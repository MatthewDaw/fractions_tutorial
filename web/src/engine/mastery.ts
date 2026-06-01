// mastery.ts — U4: MasteryEstimate assembly (measurement §4.5).
//
// buildMasteryEstimate(observations, P_known) assembles all four dimensions
// and returns a MasteryEstimate.
//
// AFFECT FIREWALL: no affect term anywhere in this module. Signal events in
// the log are visible to the Observation pipeline only as the affect_window
// stub (always empty), and that field is never read here. The gate in gate.ts
// also does not read affect_window. The firewall is structural — the type
// makes it impossible for an affect value to reach the gate.
//
// ENGINE PURITY: NO React imports, NO wall-clock calls.

import type { Observation, MasteryEstimate } from './types.js';
import {
  computeFluency,
  isIndependent,
  hasTransferred,
  computeHintDependence,
} from './dimensions.js';

// ---------------------------------------------------------------------------
// MasteryEstimate assembly
// ---------------------------------------------------------------------------

/**
 * Build a MasteryEstimate from an Observation stream and the current BKT
 * P_known (already updated by bktUpdate).
 *
 * @param observations   Full observation history for this node.
 * @param P_known        Current BKT posterior (output of bktUpdate or coldStart).
 * @param lastRetentionProbe  Timestamp of the last retention probe, or null.
 */
export function buildMasteryEstimate(
  observations: readonly Observation[],
  P_known: number,
  lastRetentionProbe: number | null = null
): MasteryEstimate {
  // Compute each dimension independently — AFFECT FIREWALL: we never touch
  // affect_window or any Signal-derived field. Each dimension reads only
  // {correct, scaffold_level, hint_max_rung, latency, answer_value, surface_form}.
  const fluency_stats = computeFluency(observations);
  const independent = isIndependent(observations);
  const transfer_passed = hasTransferred(observations);
  const hint_dependence = computeHintDependence(observations);

  // max_scaffold_passed: highest scaffold level at which the child answered
  // correctly, hint-free.
  let max_scaffold_passed: MasteryEstimate['max_scaffold_passed'] = null;
  for (const obs of observations) {
    if (obs.correct && obs.hint_max_rung === 0) {
      if (max_scaffold_passed === null || obs.scaffold_level > max_scaffold_passed) {
        max_scaffold_passed = obs.scaffold_level;
      }
    }
  }

  // independence is captured in max_scaffold_passed >= 3 AND ≥2 distinct
  // problems, but the isIndependent() check is the canonical gate input
  // (stored in the estimate indirectly via max_scaffold_passed and the gate).
  // We annotate it in max_scaffold_passed: if isIndependent() passes, we
  // guarantee max_scaffold_passed reflects at least L3.
  if (independent && (max_scaffold_passed === null || max_scaffold_passed < 3)) {
    max_scaffold_passed = 3;
  }

  return {
    P_known,
    fluency_stats,
    max_scaffold_passed,
    transfer_passed,
    hint_dependence,
    last_retention_probe: lastRetentionProbe,
  };
}

// ---------------------------------------------------------------------------
// Pure fold: stream of observations → MasteryEstimate
//
// This is a convenience entry-point for the measurementReduce pipeline.
// It takes a stream of observations (already in chronological order) and
// the current P_known (maintained externally by bkt.ts) and assembles the
// full estimate.
// ---------------------------------------------------------------------------

export { buildMasteryEstimate as assembleMasteryEstimate };
