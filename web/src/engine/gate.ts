// gate.ts — U5: Deterministic mastery gate (measurement §4.5).
//
// isMastered(est) ⟺ P_known ≥ 0.95 AND independent AND transfer_passed AND fluency_ok(soft)
//
// This is the ONLY path to a MASTERED status (KTD4, R9).
// No setter bypass is possible; the type shape enforces it.
// Affect is structurally absent — the gate reads only Chain A fields.
//
// ENGINE PURITY: NO React imports, NO wall-clock calls.

import type { MasteryEstimate } from './types.js';
import { fluencyOk } from './dimensions.js';
import { PARAMS } from './params.js';

// ---------------------------------------------------------------------------
// Public gate predicate
// ---------------------------------------------------------------------------

/**
 * Returns true when ALL mastery conditions hold:
 *   1. P_known ≥ gateThreshold (default 0.95)
 *   2. Scaffold-independence: max_scaffold_passed ≥ L3 (captured in the estimate)
 *   3. transfer_passed === true
 *   4. fluency_ok (soft by default; hard mode if fluencyHardMode === true)
 *
 * @param est           The MasteryEstimate for the node under evaluation.
 * @param fluencyHardMode  When true, fluency is a hard gate condition.
 *                         Defaults to false (soft/advisory) until the age_band
 *                         is calibrated with pilot data (measurement Open Q1).
 */
export function isMastered(
  est: MasteryEstimate,
  fluencyHardMode = false
): boolean {
  // Condition 1 — BKT accuracy
  if (est.P_known < PARAMS.gateThreshold) return false;

  // Condition 2 — scaffold independence: max_scaffold_passed must be ≥ L3
  // (the independence check in mastery.ts guarantees this when isIndependent()
  // passes, but we enforce it here as the structural gate condition).
  if (est.max_scaffold_passed === null || est.max_scaffold_passed < 3) return false;

  // Condition 3 — transfer
  if (!est.transfer_passed) return false;

  // Condition 4 — fluency (soft unless hard mode is enabled)
  if (!fluencyOk(est.fluency_stats, fluencyHardMode)) return false;

  // AFFECT FIREWALL: est.last_retention_probe and any affect_window are never
  // read here. The gate is structurally limited to the four Chain A conditions.
  return true;
}

// ---------------------------------------------------------------------------
// Convenience: test without exposing the full estimate
// ---------------------------------------------------------------------------

/**
 * All four gate conditions as individual boolean predicates.
 * Useful for the inspector and test assertions.
 */
export function gateConditions(
  est: MasteryEstimate,
  fluencyHardMode = false
): {
  accuracyOk: boolean;
  independenceOk: boolean;
  transferOk: boolean;
  fluencyOk: boolean;
} {
  return {
    accuracyOk: est.P_known >= PARAMS.gateThreshold,
    independenceOk: est.max_scaffold_passed !== null && est.max_scaffold_passed >= 3,
    transferOk: est.transfer_passed,
    fluencyOk: fluencyOk(est.fluency_stats, fluencyHardMode),
  };
}
