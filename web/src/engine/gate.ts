// gate.ts — U5: Deterministic mastery gate (measurement §4.5).
//
// isMastered(est) ⟺ P_known ≥ 0.95 AND independent AND transfer_passed AND fluency_ok(soft)
//                   [ AND delayed_probe_passed  — only when PARAMS.requireDelayedProbe ]
//
// ACQUIRED vs durable MASTERED (002 U7 R9 / T09): the four conjuncts above are
// ACQUIRED — all in-session, Chain-A evidence is green. With PARAMS.requireDelayedProbe
// ON, durable MASTERED additionally requires a PASSED delayed retention probe
// (est.delayed_probe_passed), so a node that has been ACQUIRED but never survived a
// spaced out-of-session probe reads as NOT mastered. With the flag OFF (default) the
// extra conjunct is skipped and ACQUIRED == MASTERED — byte-identical to today.
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
 *   5. delayed_probe_passed === true — ONLY when requireDelayedProbe is on
 *      (durable MASTERED vs in-session ACQUIRED, 002 U7 R9 / T09)
 *
 * @param est           The MasteryEstimate for the node under evaluation.
 * @param fluencyHardMode  When true, fluency is a hard gate condition.
 *                         Defaults to false (soft/advisory) until the age_band
 *                         is calibrated with pilot data (measurement Open Q1).
 * @param requireDelayedProbe  When true, a PASSED delayed retention probe is a
 *                         hard gate condition (durable mastery). Defaults to OFF
 *                         (PARAMS.requireDelayedProbe) so the extra conjunct is
 *                         skipped and certification is byte-identical to today.
 */
/**
 * Optional round-2 gate-hardening flag overlay (T22–T25). Each defaults to its
 * PARAMS value so existing call sites — `isMastered(est)` — pick up the live
 * (default-OFF) configuration and behave byte-identically to today. `nodeId` is
 * only consulted by the per-skill T25 conjunct; when omitted, T25 never fires.
 */
export interface GateHardeningFlags {
  requireMisconceptionFree?: boolean;
  requireStableEstimate?: boolean;
  strictGateThreshold?: boolean;
  requireTransferProbe?: boolean;
  /** The node id under evaluation — needed for the per-skill T25 conjunct. */
  nodeId?: string;
}

export function isMastered(
  est: MasteryEstimate,
  fluencyHardMode = PARAMS.fluencyHardMode,
  requireDelayedProbe = PARAMS.requireDelayedProbe,
  hardening: GateHardeningFlags = {}
): boolean {
  const requireMisconceptionFree =
    hardening.requireMisconceptionFree ?? PARAMS.requireMisconceptionFree;
  const requireStableEstimate =
    hardening.requireStableEstimate ?? PARAMS.requireStableEstimate;
  const strictGateThreshold =
    hardening.strictGateThreshold ?? PARAMS.strictGateThreshold;
  const requireTransferProbe =
    hardening.requireTransferProbe ?? PARAMS.requireTransferProbe;

  // Condition 1 — BKT accuracy. T24 (round2): when strictGateThreshold is on, use the
  // STRICTER P_known bar (strictGateThresholdValue) tied to the committed τ=0.85;
  // OFF (default) uses gateThreshold (0.95) — byte-identical to today.
  const accuracyBar = strictGateThreshold
    ? PARAMS.strictGateThresholdValue
    : PARAMS.gateThreshold;
  if (est.P_known < accuracyBar) return false;

  // Condition 2 — scaffold independence: max_scaffold_passed must be ≥ L3
  // (the independence check in mastery.ts guarantees this when isIndependent()
  // passes, but we enforce it here as the structural gate condition).
  if (est.max_scaffold_passed === null || est.max_scaffold_passed < 3) return false;

  // Condition 3 — transfer
  if (!est.transfer_passed) return false;

  // Condition 4 — fluency (soft unless hard mode is enabled)
  if (!fluencyOk(est.fluency_stats, fluencyHardMode)) return false;

  // Condition 5 — durable mastery: a PASSED delayed retention probe. Only enforced
  // when requireDelayedProbe is on. When OFF (default) this branch is skipped
  // entirely, so an ACQUIRED (never-probed) node certifies exactly as before —
  // the rollback is a genuine no-op. delayed_probe_passed is undefined/false until
  // decay.applyProbeResult stamps it on a correct probe.
  if (requireDelayedProbe && est.delayed_probe_passed !== true) return false;

  // Condition 6 — T22 misconception-persistence guard. Only enforced when
  // requireMisconceptionFree is on. The trailing N=2 attempts must be
  // misconception-free (est.recent_misconception_free), so a stable misconception
  // blocks the gate until cleared. OFF (default) ⇒ skipped, byte-identical.
  if (requireMisconceptionFree && est.recent_misconception_free !== true) return false;

  // Condition 7 — T23 pre-acquisition debounce. Only enforced when
  // requireStableEstimate is on: require a STABLE estimate (N=2 consecutive in-band
  // corrects) AND an evidence floor of stableEstimateEvidenceFloor (10) gate-relevant
  // attempts before banking Mastered. OFF (default) ⇒ skipped, byte-identical.
  if (requireStableEstimate) {
    if (est.estimate_stable !== true) return false;
    if ((est.evidence_count ?? 0) < PARAMS.stableEstimateEvidenceFloor) return false;
  }

  // Condition 8 — T25 per-skill transfer-probe requirement. Only enforced when
  // requireTransferProbe is on AND this node id is in PARAMS.transferProbeSkills:
  // require ≥1 correct attempt at a VARIED surface_form (est.varied_transfer_forms ≥ 1),
  // the independent transfer signal (T13). OFF (default) or unlisted skill ⇒ skipped.
  if (
    requireTransferProbe &&
    hardening.nodeId !== undefined &&
    PARAMS.transferProbeSkills.includes(hardening.nodeId)
  ) {
    if ((est.varied_transfer_forms ?? 0) < 1) return false;
  }

  // AFFECT FIREWALL: est.last_retention_probe and any affect_window are never
  // read here. The gate is structurally limited to the Chain A conditions.
  return true;
}

// ---------------------------------------------------------------------------
// Convenience: test without exposing the full estimate
// ---------------------------------------------------------------------------

/**
 * The gate conditions as individual boolean predicates. Useful for the inspector
 * and test assertions. `durableOk` reflects the delayed-probe conjunct: it is
 * trivially true when requireDelayedProbe is off (the conjunct does not constrain
 * the gate) and otherwise mirrors the passed-delayed-probe signal, so
 * (all-conditions-true ⟺ isMastered) holds in both flag states.
 */
export function gateConditions(
  est: MasteryEstimate,
  fluencyHardMode = PARAMS.fluencyHardMode,
  requireDelayedProbe = PARAMS.requireDelayedProbe,
  hardening: GateHardeningFlags = {}
): {
  accuracyOk: boolean;
  independenceOk: boolean;
  transferOk: boolean;
  fluencyOk: boolean;
  durableOk: boolean;
  misconceptionFreeOk: boolean;
  stableEstimateOk: boolean;
  transferProbeOk: boolean;
} {
  const requireMisconceptionFree =
    hardening.requireMisconceptionFree ?? PARAMS.requireMisconceptionFree;
  const requireStableEstimate =
    hardening.requireStableEstimate ?? PARAMS.requireStableEstimate;
  const strictGateThreshold =
    hardening.strictGateThreshold ?? PARAMS.strictGateThreshold;
  const requireTransferProbe =
    hardening.requireTransferProbe ?? PARAMS.requireTransferProbe;
  const accuracyBar = strictGateThreshold
    ? PARAMS.strictGateThresholdValue
    : PARAMS.gateThreshold;
  const transferProbeApplies =
    requireTransferProbe &&
    hardening.nodeId !== undefined &&
    PARAMS.transferProbeSkills.includes(hardening.nodeId);
  return {
    accuracyOk: est.P_known >= accuracyBar,
    independenceOk: est.max_scaffold_passed !== null && est.max_scaffold_passed >= 3,
    transferOk: est.transfer_passed,
    fluencyOk: fluencyOk(est.fluency_stats, fluencyHardMode),
    durableOk: !requireDelayedProbe || est.delayed_probe_passed === true,
    // Each hardening condition is trivially true when its flag is off (the conjunct
    // does not constrain the gate), so (all-conditions-true ⟺ isMastered) holds in
    // every flag state — mirroring the durableOk contract.
    misconceptionFreeOk: !requireMisconceptionFree || est.recent_misconception_free === true,
    stableEstimateOk:
      !requireStableEstimate ||
      (est.estimate_stable === true &&
        (est.evidence_count ?? 0) >= PARAMS.stableEstimateEvidenceFloor),
    transferProbeOk: !transferProbeApplies || (est.varied_transfer_forms ?? 0) >= 1,
  };
}
