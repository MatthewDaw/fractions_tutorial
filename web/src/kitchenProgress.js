// kitchenProgress.js — thin facade over engine-derived mastery state.
//
// This module preserves the original loadMastered / saveMastered / resetProgress
// signatures so all existing call sites continue to compile and run without change.
//
// MIGRATION STRATEGY (R19 / U11):
//   The engine's log.ts migration (migrateFromKitchenProgress) already reads the
//   legacy "moms-kitchen-progress-v1" record and seeds BKT priors so existing
//   players never lose progress.  This module is now the *write* side: saveMastered
//   keeps the legacy record alive (for apps still reading it) while the engine's
//   log + isMastered() is authoritative for new flow.
//
// READING MASTERY:
//   masteryStatusFor(nodeId, masteryMap) returns the human-facing status string:
//     'not-started'   — P_known is close to the cold-start default (≤ 0.15)
//     'in-progress'   — some evidence, but gate not yet open
//     'mastered'      — gate open (isMastered() === true)
//     'needs-review'  — gate was open but decay probe fired recently and
//                       transfer_passed is now false (demoted node)
//
//   masteryFor(nodeId, masteryMap) is a convenience alias returning the
//   MasteryEstimate for a node from the last measurementReduce result.  The
//   callers (WorldMap, Shell) pass the live masteryCache from useLessonEngine.
//
// ENGINE IMPORTS:
//   We import only isMastered from gate.ts and the graph helpers — no React.

import { isMastered } from './engine/gate.js';
import { allNodes, mostUpstreamUnmastered } from './engine/graph.js';
import { migrateFromKitchenProgress as engineMigrate, loadLog, saveLog, appendEvent } from './engine/index.js';
import { measurementReduce } from './engine/measurementReduce.js';
import { generatorSkills } from './generators/index.js';
import { PROBE_DELAYS_MS } from './engine/decay.js';

// ---------------------------------------------------------------------------
// Legacy storage key (unchanged from original — keeps existing data intact)
// ---------------------------------------------------------------------------

const KEY = 'moms-kitchen-progress-v1';

// ---------------------------------------------------------------------------
// Legacy API — signatures MUST remain stable (R19)
// ---------------------------------------------------------------------------

/**
 * loadMastered() — returns the list of mastered room ids.
 *
 * Derives mastery from the engine log when available; falls back to the legacy
 * binary record so existing players never lose progress.
 *
 * Returns: string[] of room ids (e.g. ['r1', 'r3']).
 */
export function loadMastered() {
  // Attempt engine-derived mastery first.
  try {
    const log = loadLog();
    if (log.length > 0) {
      const seedPriors = engineMigrate();
      const { mastery } = measurementReduce(log, Date.now(), seedPriors);
      const mastered = [];
      for (const node of allNodes()) {
        const est = mastery[node.id];
        if (est && isMastered(est)) {
          mastered.push(node.roomId);
        }
      }
      return mastered;
    }
  } catch (_) {
    // Engine unavailable — fall through to legacy store.
  }

  // Legacy fallback: read the binary { mastered: [...] } record.
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(v?.mastered) ? v.mastered : [];
  } catch (_) {
    return [];
  }
}

/**
 * saveMastered(mastered) — persist a mastered room-id list.
 *
 * Writes the legacy "moms-kitchen-progress-v1" record so old code paths
 * that still call saveMastered() keep working.  The engine's own log is the
 * authoritative source for new code paths; this is purely a compatibility shim.
 *
 * @param {string[]} mastered — array of room ids
 */
export function saveMastered(mastered) {
  try { localStorage.setItem(KEY, JSON.stringify({ mastered })); } catch (_) {}
}

/**
 * resetProgress() — clear persisted progress (used in dev/debug).
 * Clears both the legacy binary record and the engine log.
 */
export function resetProgress() {
  try { localStorage.removeItem(KEY); } catch (_) {}
  try { saveLog([]); } catch (_) {}
}

// ---------------------------------------------------------------------------
// Engine-derived mastery helpers (used by WorldMap and Shell)
// ---------------------------------------------------------------------------

/**
 * Returns a human-facing mastery status for a given engine node id.
 *
 * @param {string} nodeId — engine skill node id (e.g. 'ADD_SAME_DEN')
 * @param {Record<string, import('./engine/types.js').MasteryEstimate>|null} masteryMap
 *   — the result of measurementReduce(log).mastery, or null if not yet computed.
 * @returns {'not-started'|'in-progress'|'mastered'|'needs-review'}
 */
export function masteryStatusFor(nodeId, masteryMap) {
  if (!masteryMap) return 'not-started';
  const est = masteryMap[nodeId];
  if (!est) return 'not-started';

  // Gate-derived mastery.
  if (isMastered(est)) return 'mastered';

  // Needs-review is RESULT-AWARE: a node that was once mastered (mastered_at set)
  // but is no longer mastered has lapsed — a failed retention probe demoted it.
  // A *passed* probe leaves the node mastered (handled above), so this never
  // false-flags the way the old "a probe fired" heuristic did.
  if (est.mastered_at != null) {
    return 'needs-review';
  }

  // Not-started: P_known is still at or near the cold-start default.
  // We use 0.15 as the threshold (P_L0 = 0.10; prereq propagation may raise
  // it slightly, so we give it a small margin).
  if (est.P_known <= 0.15) return 'not-started';

  return 'in-progress';
}

/**
 * Returns the engine's suggestion for the next room to visit.
 *
 * Uses mostUpstreamUnmastered over all five nodes; returns the room id of the
 * most-upstream node that has not yet been mastered, or null if all are mastered.
 *
 * @param {Record<string, import('./engine/types.js').MasteryEstimate>|null} masteryMap
 * @returns {string|null} room id, or null if all mastered
 */
export function suggestedNextRoom(masteryMap) {
  if (!masteryMap) {
    // No mastery data yet: suggest the first room (ADD_SAME_DEN → r1).
    const first = allNodes()[0];
    return first ? first.roomId : null;
  }

  const allIds = allNodes().map((n) => n.id);
  const binding = mostUpstreamUnmastered(allIds, (id) => {
    const est = masteryMap[id];
    return est !== undefined && isMastered(est);
  });

  return binding?.roomId ?? null;
}

/**
 * Returns the scaffold entry level (design L0–L4) for a room, given the current
 * mastery map.  Used by Shell when a room is opened.
 *
 * Rules (from plan U11 / policy.ts computeEntryScaffold):
 *   - No evidence yet → L0.
 *   - Re-entry → one below max_scaffold_passed, floored at L0.
 *
 * @param {string} nodeId — engine skill node id
 * @param {Record<string, import('./engine/types.js').MasteryEstimate>|null} masteryMap
 * @returns {0|1|2|3|4} design scaffold level
 */
export function entryScaffoldFor(nodeId, masteryMap) {
  if (!masteryMap) return 0;
  const est = masteryMap[nodeId];
  if (!est) return 0;

  const maxPassed = est.max_scaffold_passed;
  if (maxPassed === null) return 0;

  // One below max, floored at 0.
  return /** @type {0|1|2|3|4} */ (Math.max(0, maxPassed - 1));
}

/**
 * U8: the skills eligible for interleaved "mixed review" — recipes the learner has
 * been INTRODUCED to (engaged with) AND that have a generator. A type only enters
 * the mix after initial schema formation, so interleaving never precedes
 * acquisition. "Introduced" = mastered, previously-mastered (mastered_at set), or
 * meaningful evidence (P_known elevated above the cold-start prior).
 *
 * @param {Record<string, import('./engine/types.js').MasteryEstimate>|null} masteryMap
 * @returns {string[]} engine skill node ids
 */
export function eligibleMixSkills(masteryMap) {
  if (!masteryMap) return [];
  const generatable = new Set(generatorSkills());
  const out = [];
  for (const node of allNodes()) {
    if (!generatable.has(node.id)) continue;
    const est = masteryMap[node.id];
    if (!est) continue;
    const introduced = isMastered(est) || est.mastered_at != null || est.P_known >= 0.25;
    if (introduced) out.push(node.id);
  }
  return out;
}

/**
 * U7: which mastered nodes have a spaced-retention probe DUE now. A probe becomes
 * due once the first PROBE_DELAYS_MS interval has elapsed since mastery was last
 * confirmed (mastered_at, or the last probe timestamp if one fired). Pure given
 * `now` (the caller injects Date.now() at the React boundary — the engine fold
 * stays wall-clock-free).
 *
 * @param {Record<string, import('./engine/types.js').MasteryEstimate>|null} masteryMap
 * @param {number} now — ms epoch
 * @returns {string[]} engine node ids whose probe is due
 */
export function dueProbes(masteryMap, now) {
  if (!masteryMap) return [];
  const interval = PROBE_DELAYS_MS[0];
  const out = [];
  for (const node of allNodes()) {
    const est = masteryMap[node.id];
    if (!est || !isMastered(est) || est.mastered_at == null) continue;
    const since = est.last_retention_probe != null ? est.last_retention_probe : est.mastered_at;
    if (now - since >= interval) out.push(node.id);
  }
  return out;
}

/**
 * U7: record a retention-probe result for a node by appending a `retention_probe`
 * event to the engine log. measurementReduce folds it: a pass stamps the timestamp
 * (resetting the spaced-review clock); a fail clears transfer_passed and drops
 * P_known below the gate, re-opening the node for review. The React layer may read
 * Date.now() here; only the engine fold is wall-clock-free.
 *
 * @param {string} nodeId
 * @param {boolean} correct — did the child pass the probe?
 * @param {number} [now]
 */
export function recordRetentionProbe(nodeId, correct, now = Date.now()) {
  try {
    let log = loadLog();
    log = appendEvent(log, {
      type: 'retention_probe',
      payload: { node_id: nodeId, correct: !!correct, probe_t: now },
      modality: 'tap',
      t: now,
      actor: 'human',
    });
    saveLog(log);
  } catch (_) { /* storage unavailable — skip */ }
}
