// harness/flagOverlay.js — T12: the PARAMS-override path the recursive loop drives
// for a flags-ON sweep.
//
// THE GAP THIS CLOSES: the harness used to thread its plan-002 flags into the
// session TAPE only (sessionRunner writes `flags` onto the tape, config.js hashes
// PARAMS for attribution) — but never APPLIED them to the engine PARAMS the
// session actually gates on. So a flags-on sweep was a no-op and the U13/T07
// certification could only ever read NO_CHANGE. The premise that "flags are inert
// until 002 wires PARAMS" is STALE: 002 U1 ALREADY routes PARAMS through
// gate.ts (isMastered/fluencyOk read PARAMS.fluencyHardMode at CALL TIME),
// policy.ts (RaiseScaffold reads PARAMS.frustrationScaffold), and params.ts. The
// engine reads the LIVE PARAMS object property on every call — the harness just
// never flipped it.
//
// MECHANISM: the engine imports the singleton `PARAMS` object and reads its
// properties at call time. `engineApi.js` re-exports that SAME reference. So we
// flip engine gating for a sweep by mutating the live PARAMS object's properties
// in place, then RESTORING them after the sweep so flags-off and flags-on runs
// use genuinely different gating and nothing leaks across sweeps.
//
// PURITY/DETERMINISM: this is a SCOPED, RESTORED mutation — apply → run → restore.
// We never leave PARAMS mutated past the run() callback (or the explicit restore).
// Same {persona, skill, seed, flags} → byte-identical tape, because the overlay is
// a pure function of `flags` and is fully reverted between sweeps.
//
// AFFECT-IS-ADVISORY / ENGINE INVARIANTS: we do NOT edit engine/** — its PARAMS
// routing already exists. We only flip already-defined, reversible PARAMS knobs.
// Flags with NO engine routing today (delayedProbe, unifiedTaxonomy) are HONESTLY
// inert here: they are recorded onto the tape for attribution but map to no PARAMS
// key, so they cannot change gating until the engine grows a knob (T09 et al.).

import { PARAMS } from './engineApi.js';

/**
 * The flag → PARAMS-path mapping. Each entry names the live PARAMS property the
 * flag drives. A flag absent from this table has NO engine routing today and is
 * therefore inert (tape-only attribution), NOT silently dropped.
 *
 *   fluencyHardMode         → PARAMS.fluencyHardMode         (gate.ts: hard fluency conjunct)
 *   frustrationScaffold     → PARAMS.frustrationScaffold     (policy.ts: warm RaiseScaffold rationale)
 *
 * Escalation knobs are nested under PARAMS.escalation; the overlay supports a
 * dotted form so a sweep can tighten/loosen the disengagement/stuck thresholds:
 *
 *   escalation.nDiseng        → PARAMS.escalation.nDiseng        (policy.ts: disengaged escalation)
 *   escalation.nStuck         → PARAMS.escalation.nStuck         (policy.ts: stuck escalation)
 *   escalation.nDisengScaffold → PARAMS.escalation.nDisengScaffold (policy.ts: 3b frustration-scaffold threshold)
 */
const FLAG_TO_PARAM = Object.freeze({
  fluencyHardMode: 'fluencyHardMode',
  frustrationScaffold: 'frustrationScaffold',
  fluencyLatencyTargetMs: 'fluencyLatencyTargetMs',
  'escalation.nDiseng': 'escalation.nDiseng',
  'escalation.nStuck': 'escalation.nStuck',
  'escalation.nDisengScaffold': 'escalation.nDisengScaffold',
});

/** Flags carried for attribution that have NO engine PARAMS routing yet (inert). */
const INERT_FLAGS = Object.freeze(['delayedProbe', 'unifiedTaxonomy']);

/** Read a (possibly dotted) path off an object. */
function getPath(obj, path) {
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

/** Set a (possibly dotted) path on an object (mutating in place). */
function setPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

/**
 * Normalize a caller's `flags` into the set of { paramPath, value } overrides that
 * have a real engine routing today, dropping inert flags (with NO routing) and
 * any flag set to its baseline `false`/undefined.
 *
 * A boolean flag overrides its PARAMS property to that boolean. An `escalation.*`
 * flag overrides the numeric threshold to the given number. A flag value of
 * `false`/`undefined`/`null` is treated as "leave baseline" so a flags-off run is
 * byte-identical to today (no override applied).
 */
function resolveOverrides(flags) {
  const overrides = [];
  if (!flags || typeof flags !== 'object') return overrides;
  for (const [flag, value] of Object.entries(flags)) {
    const paramPath = FLAG_TO_PARAM[flag];
    if (!paramPath) continue; // inert or non-routing flag (delayedProbe, etc.).
    if (value === false || value === undefined || value === null) continue; // baseline.
    overrides.push({ paramPath, value });
  }
  return overrides;
}

/**
 * Apply a flag overlay to the LIVE engine PARAMS object and return a restore
 * handle. The caller MUST invoke restore() (or use withFlags) so flags never leak
 * across sweeps.
 *
 * @param {object} flags  plan-002 flags (fluencyHardMode, frustrationScaffold,
 *                        escalation.nDiseng, escalation.nStuck, …). Falsy/baseline
 *                        values and inert flags are no-ops.
 * @returns {{ restore: () => void, applied: Array<{paramPath:string, value:any}> }}
 */
export function applyFlagOverlay(flags) {
  const overrides = resolveOverrides(flags);
  const saved = overrides.map(({ paramPath }) => ({ paramPath, prev: getPath(PARAMS, paramPath) }));
  for (const { paramPath, value } of overrides) {
    setPath(PARAMS, paramPath, value);
  }
  let restored = false;
  return {
    applied: overrides,
    restore() {
      if (restored) return;
      // Restore in reverse so nested writes unwind cleanly.
      for (let i = saved.length - 1; i >= 0; i--) {
        setPath(PARAMS, saved[i].paramPath, saved[i].prev);
      }
      restored = true;
    },
  };
}

/**
 * Run `fn` with the flag overlay applied to the engine PARAMS, ALWAYS restoring
 * PARAMS afterward (even if `fn` throws). This is the safe entry point the session
 * runner uses: apply → run the session → restore. With baseline/empty flags the
 * overlay is a no-op and `fn` sees today's PARAMS unchanged.
 *
 * @template T
 * @param {object} flags
 * @param {() => T} fn
 * @returns {T}
 */
export function withFlags(flags, fn) {
  const handle = applyFlagOverlay(flags);
  try {
    return fn();
  } finally {
    handle.restore();
  }
}

/** The inert flags (attribution-only, no engine routing yet) — exported for docs/tests. */
export { INERT_FLAGS, FLAG_TO_PARAM };
