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
import { PARAMS } from './params.js';

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
  lastRetentionProbe: number | null = null,
  masteredAt: number | null = null
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

  // --- Round-2 gate-hardening derived signals (T22/T23/T25) ---
  // PURE folds over the same observation stream. Always populated; the gate reads
  // them ONLY under the matching PARAMS flag, so default-off behavior is unchanged.

  // T22: last N=2 attempts misconception-free (no error_signature). A stable
  // misconception (recent error_signature) leaves this false.
  const recent_misconception_free = recentMisconceptionFree(observations);

  // T23: stable estimate — N=2 consecutive in-band corrects at the tail (a
  // non-decreasing competence trend), plus the gate-relevant evidence count.
  const estimate_stable = isEstimateStable(observations);
  const evidence_count = countGateRelevantEvidence(observations);

  // T25: count of DISTINCT varied surface_forms seen correct, hint-free, in-band.
  const varied_transfer_forms = countVariedTransferForms(observations);

  return {
    P_known,
    fluency_stats,
    max_scaffold_passed,
    transfer_passed,
    hint_dependence,
    last_retention_probe: lastRetentionProbe,
    mastered_at: masteredAt,
    recent_misconception_free,
    estimate_stable,
    evidence_count,
    varied_transfer_forms,
  };
}

// ---------------------------------------------------------------------------
// Round-2 gate-hardening derived signals — PURE, deterministic helpers.
// ---------------------------------------------------------------------------

/**
 * T22 — true when the trailing PARAMS.misconceptionFreeWindowN (=2) attempts carry
 * NO error_signature. With fewer than N attempts it is vacuously true (insufficient
 * evidence does not assert a stable misconception). A recent fingerprinted wrong
 * pattern (error_signature !== null) leaves it false until cleared.
 */
function recentMisconceptionFree(observations: readonly Observation[]): boolean {
  const n = PARAMS.misconceptionFreeWindowN;
  const tail = observations.slice(-n);
  return tail.every((o) => o.error_signature === null);
}

/**
 * T23 — true when the trailing PARAMS.stableEstimateWindowN (=2) attempts are all
 * in-band corrects (a non-decreasing competence trend: no recent miss/oscillation
 * back below the band). "In-band correct" = correct, hint-free, latency above the
 * too-fast floor. Fewer than N qualifying tail attempts ⇒ not yet stable.
 */
function isEstimateStable(observations: readonly Observation[]): boolean {
  const n = PARAMS.stableEstimateWindowN;
  if (observations.length < n) return false;
  const tail = observations.slice(-n);
  return tail.every(
    (o) => o.correct && o.hint_max_rung === 0 && o.latency >= PARAMS.latencyFloorMs
  );
}

/**
 * T23 — count of gate-relevant evidence attempts: hint-free corrects answered in-band
 * (not implausibly fast). This is the evidence the gate banks mastery on; T23 raises
 * the floor on it (stableEstimateEvidenceFloor) so the gate cannot open before latent
 * has accumulated enough crossings.
 */
function countGateRelevantEvidence(observations: readonly Observation[]): number {
  let count = 0;
  for (const o of observations) {
    if (o.correct && o.hint_max_rung === 0 && o.latency >= PARAMS.latencyFloorMs) count++;
  }
  return count;
}

/**
 * T25 — count of DISTINCT varied surface_forms seen CORRECT, hint-free, low-scaffold,
 * in-band. Uses the structural surface_form key (the independent transfer signal, T13),
 * with the documented answer_value denominator proxy fallback only when surface_form is
 * absent — matching dimensions.hasTransferred's keying.
 */
function countVariedTransferForms(observations: readonly Observation[]): number {
  const forms = new Set<string>();
  for (const o of observations) {
    if (!o.correct || o.hint_max_rung !== 0) continue;
    if (o.scaffold_level > 3) continue;
    if (o.latency < PARAMS.latencyFloorMs) continue;
    const form: string =
      (o as Observation & { surface_form?: string }).surface_form ??
      (o.answer_value !== null ? `${o.answer_value[1]}` : `anon-${o.scaffold_level}`);
    forms.add(form);
  }
  return forms.size;
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
