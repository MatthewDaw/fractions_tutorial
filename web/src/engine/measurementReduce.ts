// measurementReduce.ts — U8: The whole fold composed into one entry point.
//
// measurementReduce(log, now) -> { mastery: Record<nodeId, MasteryEstimate> }
//
// Pipeline (measurement §4.7.4 steps 1-4, then gate + decay):
//   [1] segment + featurize  (observation.ts)
//   [2] credit assignment    (credit.ts)
//   [3] BKT + dimensions update (bkt.ts / dimensions.ts)
//   [4] assemble MasteryEstimate (mastery.ts)
//   [5] gate (gate.ts)  — note: gate is a predicate, not a mutator; isMastered() is
//       available to consumers via the returned estimates
//   [6] decay-eligible nodes flagged via last_retention_probe in the estimate
//
// This is the public contract surface (KTD1). Pure, replayable — no wall-clock,
// no React, no side effects.
//
// ENGINE PURITY: NO React imports, NO wall-clock calls.

import type { Event, Observation, MasteryEstimate } from './types.js';
import { segment } from './observation.js';
import { assignCredit } from './credit.js';
import { coldStart, bktUpdate } from './bkt.js';
import { buildMasteryEstimate } from './mastery.js';
import { isMastered } from './gate.js';
import { applyProbeResult } from './decay.js';
import { allNodes } from './graph.js';
import { PARAMS } from './params.js';
import type { SkillNode } from './types.js';

// ---------------------------------------------------------------------------
// Build the graph map once (static data — safe at module level)
// ---------------------------------------------------------------------------

function buildGraphMap(): Map<string, SkillNode> {
  const map = new Map<string, SkillNode>();
  for (const node of allNodes()) {
    map.set(node.id, node);
  }
  return map;
}

const GRAPH_MAP = buildGraphMap();

// ---------------------------------------------------------------------------
// Per-node mutable accumulator (local to the fold — not exported)
// ---------------------------------------------------------------------------

interface NodeAccumulator {
  P_known: number;
  observations: Observation[];
  lastRetentionProbe: number | null;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export interface MeasurementReduceResult {
  /** Per-node MasteryEstimate, keyed by node id. */
  mastery: Record<string, MasteryEstimate>;
}

/**
 * Fold an append-only Event log into a per-node MasteryEstimate map.
 *
 * @param log   The full append-only event log (from log.ts).
 * @param now   Current timestamp (ms epoch) — injected by the caller; never
 *              read from wall-clock inside the engine (KTD9).
 * @param seedPriors  Optional seed P_known per node id (from migration, U1).
 *                    Used as the initial prior before any observations.
 * @returns     { mastery: Record<nodeId, MasteryEstimate> }
 *
 * PURE and REPLAYABLE: given the same log, now, and seedPriors, always
 * returns the same result. No external I/O.
 */
export function measurementReduce(
  log: readonly Event[],
  now: number,
  seedPriors: Readonly<Record<string, number>> = {}
): MeasurementReduceResult {
  const nodes = allNodes();

  // ---- [0] Initialise accumulators with cold-start priors ----
  //
  // We initialise in two passes:
  //   Pass A — set each node's P_known to seedPrior (if provided) or P_L0.
  //   Pass B — apply cold-start prereq propagation using the seeded priors,
  //            in topological order (already guaranteed by allNodes()).
  //
  // This means a seeded mastery (e.g. from migration) propagates to child
  // nodes' cold-start priors, matching the BKT cold-start formula.

  const acc = new Map<string, NodeAccumulator>();

  // Pass A: seed P_known from seedPriors or P_L0.
  for (const node of nodes) {
    const seedPK = seedPriors[node.id];
    acc.set(node.id, {
      P_known: seedPK !== undefined ? seedPK : PARAMS.P_L0,
      observations: [],
      lastRetentionProbe: null,
    });
  }

  // Pass B: cold-start prereq propagation (only if seedPriors is empty or
  // partial — skip for nodes that have a direct seed, matching the migration
  // intent where an already-mastered room shouldn't be re-cold-started).
  for (const node of nodes) {
    if (seedPriors[node.id] === undefined && node.prereqs.length > 0) {
      // Build the prereqPKnowns map from the accumulators seeded so far.
      const prereqPKnowns = new Map<string, number>();
      for (const prereqId of node.prereqs) {
        const prereqAcc = acc.get(prereqId);
        if (prereqAcc !== undefined) {
          prereqPKnowns.set(prereqId, prereqAcc.P_known);
        }
      }
      const prior = coldStart(node, prereqPKnowns);
      acc.get(node.id)!.P_known = prior;
    }
  }

  // ---- [1] Segment the log into Observations ----
  const observations = segment(log);

  // ---- Bind observations to nodes via the log's node_id payload ----
  //
  // Each Observation comes from events emitted within a lesson. The lesson
  // stamps each `problem_present` action with a `node_id` payload so we know
  // which skill is being practiced. We pair each Observation with its source
  // `problem_present` event's `node_id`.
  //
  // Strategy: walk the log in parallel with the observation pipeline, matching
  // each Observation (in order) to the node_id of its originating
  // problem_present event.

  const nodeIdSequence = extractNodeIdSequence(log);
  const judgedTs = extractJudgedTimestamps(log);
  // Timestamp at which each node FIRST became mastered (persists across a later
  // demoting probe). Derived from logged judged timestamps — replay-stable.
  const masteredAt = new Map<string, number>();
  // nodeIdSequence[i] = the node_id for the i-th Observation (same index).
  // If no node_id is found, default to the first node (ADD_SAME_DEN) as a
  // conservative fallback — the credit will be weakly mis-assigned but the
  // system stays functional.

  // ---- [2+3] Credit assignment + BKT update (in chronological order) ----
  for (let i = 0; i < observations.length; i++) {
    const obs = observations[i];
    const nodeId = nodeIdSequence[i] ?? nodes[0]?.id ?? 'ADD_SAME_DEN';

    // Credit assignment (step 3 of the pipeline)
    const credits = assignCredit(obs, nodeId, GRAPH_MAP);

    // BKT update for each credited node (step 4a)
    for (const credit of credits) {
      const nodeAcc = acc.get(credit.nodeId);
      if (!nodeAcc) continue;

      // Apply the BKT update. For discounted updates (weight < 1), we
      // approximate by blending the posterior toward the prior using the
      // discount weight: posterior = prior + weight * (fullUpdate - prior).
      // This keeps P_known changes proportional to the credit weight.
      const fullPosterior = bktUpdate(
        nodeAcc.P_known,
        credit.correct,
        // Use the node's own BKT params if defined
        (() => {
          const n = GRAPH_MAP.get(credit.nodeId);
          return n?.bkt_params;
        })()
      );

      if (credit.weight >= 1.0) {
        nodeAcc.P_known = fullPosterior;
      } else {
        // Discounted update: partial move from prior toward the full posterior.
        nodeAcc.P_known = nodeAcc.P_known + credit.weight * (fullPosterior - nodeAcc.P_known);
        // Re-clamp to [pKnownClamp[0], pKnownClamp[1]]
        const [lo, hi] = PARAMS.pKnownClamp;
        nodeAcc.P_known = Math.min(Math.max(nodeAcc.P_known, lo), hi);
      }

      // Accumulate observation for the binding node only
      // (dimension tracking: independence, transfer, fluency are per-binding-node)
      if (credit.nodeId === nodeId) {
        nodeAcc.observations.push(obs);
      }
    }

    // Record when the binding node FIRST crosses the mastery gate (once). Used to
    // schedule retention probes and to mark a later-lapsed node as needs-review.
    if (!masteredAt.has(nodeId)) {
      const bindingAcc = acc.get(nodeId);
      if (bindingAcc) {
        const checkEst = buildMasteryEstimate(bindingAcc.observations, bindingAcc.P_known);
        if (isMastered(checkEst)) masteredAt.set(nodeId, judgedTs[i] ?? now);
      }
    }
  }

  // ---- [4] Assemble MasteryEstimate for each node ----
  const mastery: Record<string, MasteryEstimate> = {};
  for (const node of nodes) {
    const nodeAcc = acc.get(node.id)!;
    mastery[node.id] = buildMasteryEstimate(
      nodeAcc.observations,
      nodeAcc.P_known,
      nodeAcc.lastRetentionProbe,
      masteredAt.get(node.id) ?? null
    );
  }

  // ---- [5] Gate is a predicate (isMastered) — available to consumers ----
  // The gate does not mutate the estimates; consumers call isMastered(est).
  // No mutation needed here.

  // ---- [6] Decay: mark retention-probe timestamps from the log ----
  // Probe timestamps are stored in the log via 'retention_probe' events.
  // We scan for those and update the lastRetentionProbe in the accumulators.
  // The final mastery estimates are rebuilt with those timestamps.
  applyRetentionProbes(log, acc, mastery);

  return { mastery };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Walk the event log and extract the node_id for each attempt (problem_present
 * → judged span), in observation order.
 *
 * Returns an array where index i corresponds to the i-th Observation.
 */
function extractNodeIdSequence(log: readonly Event[]): string[] {
  const nodeIds: string[] = [];
  let inAttempt = false;
  let currentNodeId: string | null = null;

  for (const ev of log) {
    // Only Actions carry node_id (Signals don't have a type we care about here)
    if ('confidence' in ev) continue; // Signal — skip

    const action = ev;
    if (action.type === 'problem_present') {
      inAttempt = true;
      const raw = action.payload['node_id'];
      currentNodeId = typeof raw === 'string' ? raw : null;
    } else if (action.type === 'judged' && inAttempt) {
      nodeIds.push(currentNodeId ?? '');
      inAttempt = false;
      currentNodeId = null;
    }
  }

  return nodeIds;
}

/**
 * The judged-event timestamp for each attempt (problem_present → judged span), in
 * observation order. Aligned by index with extractNodeIdSequence so the fold can
 * stamp the moment a node became mastered.
 */
function extractJudgedTimestamps(log: readonly Event[]): number[] {
  const ts: number[] = [];
  let inAttempt = false;
  for (const ev of log) {
    if ('confidence' in ev) continue; // Signal
    if (ev.type === 'problem_present') inAttempt = true;
    else if (ev.type === 'judged' && inAttempt) { ts.push(ev.t); inAttempt = false; }
  }
  return ts;
}

/**
 * Fold 'retention_probe' events into the final mastery estimates, applying each
 * probe's RESULT (not just its timestamp): a pass stamps last_retention_probe; a
 * fail additionally clears transfer_passed and drops P_known below the gate,
 * re-opening the node (decay.applyProbeResult).
 *
 * Payload: { node_id: string, probe_t?: number, correct?: boolean }.
 * Back-compat: an event with no explicit `correct` is treated as a pass, so older
 * timestamp-only probe events never demote.
 */
function applyRetentionProbes(
  log: readonly Event[],
  acc: Map<string, NodeAccumulator>,
  mastery: Record<string, MasteryEstimate>
): void {
  for (const ev of log) {
    if ('confidence' in ev) continue; // Signal
    if (ev.type !== 'retention_probe') continue;

    const nodeId = typeof ev.payload['node_id'] === 'string' ? ev.payload['node_id'] : null;
    if (!nodeId) continue;

    const probeT = typeof ev.payload['probe_t'] === 'number' ? ev.payload['probe_t'] : ev.t;
    const correct = typeof ev.payload['correct'] === 'boolean' ? ev.payload['correct'] : true;
    const nodeAcc = acc.get(nodeId);
    const est = mastery[nodeId];
    if (nodeAcc && est) {
      nodeAcc.lastRetentionProbe = probeT;
      mastery[nodeId] = applyProbeResult(est, { correct, now: probeT });
    }
  }
}
