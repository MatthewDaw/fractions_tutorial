// test_gate_round2_hardening.test.ts — Round-2 gate-hardening flags (T22–T25).
//
// Each flag ships DEFAULT-OFF so the live gate is byte-identical to today and the
// existing suite stays green. For EACH flag we prove two things:
//   • flag-OFF  → behavior identical to today (a passing/ACQUIRED estimate certifies).
//   • flag-ON   → the target false-mastery cell is now NOT mastered.
//
// We drive the flags via the explicit `hardening` overlay arg (no PARAMS mutation),
// mirroring the T09 delayed-probe test convention (explicit-arg flag).
//
// PURITY/DETERMINISM: isMastered is a pure predicate; we also assert no mutation.

import { describe, it, expect } from 'vitest';
import { isMastered, gateConditions } from '../../src/engine/gate.js';
import { buildMasteryEstimate } from '../../src/engine/mastery.js';
import type { MasteryEstimate, Observation } from '../../src/engine/types.js';
import { PARAMS } from '../../src/engine/params.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A fully-passing estimate (all original conjuncts green) WITH the round-2
 *  derived fields set so that none of the new conjuncts block when their flag
 *  is on — this is the "genuinely mastered" baseline. */
function passingEstimate(): MasteryEstimate {
  return {
    P_known: 0.995, // above both gateThreshold (0.95) AND strict (0.992, T30 re-tune)
    fluency_stats: { median_latency: 5000, slope: -50, n: 7 },
    max_scaffold_passed: 3,
    transfer_passed: true,
    hint_dependence: 0,
    last_retention_probe: null,
    mastered_at: null,
    recent_misconception_free: true,
    estimate_stable: true,
    evidence_count: 12,
    varied_transfer_forms: 2,
  };
}

/** A genuine in-band correct observation. */
function correctObs(over: Partial<Observation> = {}): Observation {
  return {
    correct: true,
    answer_value: [1, 2],
    error_signature: null,
    latency: 4000,
    hint_max_rung: 0,
    self_corrections: 0,
    scaffold_level: 3,
    modality: 'tap',
    recognizer_confidence: null,
    too_fast_correct: false,
    affect_window: [],
    ...over,
  };
}

// ===========================================================================
// Defaults — all four flags default OFF (reversible / byte-identical guarantee)
// ===========================================================================

describe('round2 hardening — all four flags default OFF', () => {
  it('PARAMS defaults: every round-2 gate flag is false', () => {
    expect(PARAMS.requireMisconceptionFree).toBe(false);
    expect(PARAMS.requireStableEstimate).toBe(false);
    expect(PARAMS.strictGateThreshold).toBe(false);
    expect(PARAMS.requireTransferProbe).toBe(false);
  });

  it('default isMastered (no overlay) is unchanged for a today-passing estimate', () => {
    // A today-style estimate (no round-2 fields at all) still certifies at default.
    const today: MasteryEstimate = {
      P_known: 0.96,
      fluency_stats: { median_latency: 5000, slope: -50, n: 7 },
      max_scaffold_passed: 3,
      transfer_passed: true,
      hint_dependence: 0,
      last_retention_probe: null,
      mastered_at: null,
    };
    expect(isMastered(today)).toBe(true);
  });
});

// ===========================================================================
// T22 — Misconception-persistence guard (requireMisconceptionFree)
// ===========================================================================

describe('T22 requireMisconceptionFree — stable-misconception guard', () => {
  /** A "stable misconception" tape: P_known has been dragged up but the last
   *  two attempts still carry a fingerprinted misconception. */
  const stableMisconception: MasteryEstimate = {
    ...passingEstimate(),
    recent_misconception_free: false, // last N=2 carry an error_signature
  };

  it('flag OFF → behavior identical to today (misconception field ignored)', () => {
    // OFF: the misconception conjunct is skipped, so a stable-misconception tape
    // certifies exactly as it does today (the original four conjuncts are green).
    expect(isMastered(stableMisconception, undefined, undefined, { requireMisconceptionFree: false })).toBe(true);
    // And the bare default (PARAMS off) matches.
    expect(isMastered(stableMisconception)).toBe(true);
  });

  it('flag ON → stable-misconception tape is NOT mastered', () => {
    expect(isMastered(stableMisconception, undefined, undefined, { requireMisconceptionFree: true })).toBe(false);
  });

  it('flag ON → a genuinely misconception-free tape still certifies', () => {
    expect(isMastered(passingEstimate(), undefined, undefined, { requireMisconceptionFree: true })).toBe(true);
  });

  it('gateConditions: misconceptionFreeOk is the sole blocker (flag ON)', () => {
    const c = gateConditions(stableMisconception, undefined, undefined, { requireMisconceptionFree: true });
    expect(c.accuracyOk).toBe(true);
    expect(c.independenceOk).toBe(true);
    expect(c.transferOk).toBe(true);
    expect(c.fluencyOk).toBe(true);
    expect(c.misconceptionFreeOk).toBe(false);
  });

  it('derived field: a tape whose last 2 attempts carry an error_signature is not misconception-free', () => {
    // Earlier corrects, then two misconception attempts at the tail.
    const obs: Observation[] = [
      correctObs(),
      correctObs(),
      correctObs({ correct: false, error_signature: 'add_denominators' }),
      correctObs({ correct: false, error_signature: 'add_denominators' }),
    ];
    const est = buildMasteryEstimate(obs, 0.99);
    expect(est.recent_misconception_free).toBe(false);
  });

  it('derived field: a clean tail IS misconception-free', () => {
    const obs: Observation[] = [
      correctObs({ correct: false, error_signature: 'add_denominators' }),
      correctObs(),
      correctObs(),
    ];
    const est = buildMasteryEstimate(obs, 0.99);
    expect(est.recent_misconception_free).toBe(true);
  });
});

// ===========================================================================
// T23 — Pre-acquisition debounce (requireStableEstimate)
// ===========================================================================

describe('T23 requireStableEstimate — pre-acquisition / early-gate debounce', () => {
  /** A "credited-too-early" tape: the original conjuncts are green but the
   *  estimate is not yet stable (a single lucky crossing) AND evidence is thin. */
  const earlyGate: MasteryEstimate = {
    ...passingEstimate(),
    estimate_stable: false,
    evidence_count: 4, // below the floor of 10
  };

  it('flag OFF → behavior identical to today (stability/evidence ignored)', () => {
    expect(isMastered(earlyGate, undefined, undefined, { requireStableEstimate: false })).toBe(true);
    expect(isMastered(earlyGate)).toBe(true);
  });

  it('flag ON → early-gate (unstable) tape is NOT mastered', () => {
    expect(isMastered(earlyGate, undefined, undefined, { requireStableEstimate: true })).toBe(false);
  });

  it('flag ON → stable but thin-evidence tape is NOT mastered (evidence floor)', () => {
    const stableThin: MasteryEstimate = { ...passingEstimate(), estimate_stable: true, evidence_count: 9 };
    expect(isMastered(stableThin, undefined, undefined, { requireStableEstimate: true })).toBe(false);
  });

  it('flag ON → stable AND enough evidence still certifies', () => {
    expect(isMastered(passingEstimate(), undefined, undefined, { requireStableEstimate: true })).toBe(true);
  });

  it('gateConditions: stableEstimateOk is the sole blocker (flag ON)', () => {
    const c = gateConditions(earlyGate, undefined, undefined, { requireStableEstimate: true });
    expect(c.accuracyOk).toBe(true);
    expect(c.transferOk).toBe(true);
    expect(c.stableEstimateOk).toBe(false);
  });

  it('derived fields: two in-band corrects at the tail ⇒ stable; thin stream ⇒ low evidence', () => {
    const obs: Observation[] = [correctObs(), correctObs()];
    const est = buildMasteryEstimate(obs, 0.99);
    expect(est.estimate_stable).toBe(true);
    expect(est.evidence_count).toBe(2);
  });

  it('derived field: a recent miss at the tail ⇒ NOT stable', () => {
    const obs: Observation[] = [correctObs(), correctObs({ correct: false })];
    const est = buildMasteryEstimate(obs, 0.99);
    expect(est.estimate_stable).toBe(false);
  });
});

// ===========================================================================
// T24 — τ-band calibration (strictGateThreshold)
// ===========================================================================

describe('T24 strictGateThreshold — raised P_known bar tied to τ=0.85', () => {
  /** A learner sitting between the default and strict bars: P_known 0.97
   *  (passes 0.95 default, fails 0.985 strict). */
  const borderline: MasteryEstimate = { ...passingEstimate(), P_known: 0.97 };

  it('chosen strict value is 0.992 (above the 0.95 default; T30 re-tune)', () => {
    expect(PARAMS.strictGateThresholdValue).toBe(0.992);
    expect(PARAMS.strictGateThresholdValue).toBeGreaterThan(PARAMS.gateThreshold);
    // T30: the strict bar must sit BELOW the BKT ceiling (pKnownClamp[1]) so it is
    // genuinely reachable-but-hard, not moot (the prior 0.985 was below the old 0.99
    // clamp but a high-correct stream pinned at 0.99 cleared it in <10 steps).
    expect(PARAMS.strictGateThresholdValue).toBeLessThan(PARAMS.pKnownClamp[1]);
  });

  it('flag OFF → behavior identical to today (uses gateThreshold 0.95)', () => {
    expect(isMastered(borderline, undefined, undefined, { strictGateThreshold: false })).toBe(true);
    expect(isMastered(borderline)).toBe(true);
  });

  it('flag ON → borderline (P_known 0.97) tape is NOT mastered', () => {
    expect(isMastered(borderline, undefined, undefined, { strictGateThreshold: true })).toBe(false);
  });

  it('flag ON → a learner above the strict bar (0.995) still certifies', () => {
    expect(isMastered(passingEstimate(), undefined, undefined, { strictGateThreshold: true })).toBe(true);
  });

  it('flag ON → exactly at the strict bar certifies (boundary inclusive)', () => {
    const atBar: MasteryEstimate = { ...passingEstimate(), P_known: PARAMS.strictGateThresholdValue };
    expect(isMastered(atBar, undefined, undefined, { strictGateThreshold: true })).toBe(true);
  });

  it('gateConditions: accuracyOk reflects the strict bar when flag ON', () => {
    expect(gateConditions(borderline, undefined, undefined, { strictGateThreshold: true }).accuracyOk).toBe(false);
    expect(gateConditions(borderline, undefined, undefined, { strictGateThreshold: false }).accuracyOk).toBe(true);
  });
});

// ===========================================================================
// T25 — Per-skill transfer-probe requirement (requireTransferProbe)
// ===========================================================================

describe('T25 requireTransferProbe — per-skill varied-form transfer (FRACTION_ON_LINE)', () => {
  /** A tape that passes the existing transfer conjunct but has seen only ONE
   *  varied surface_form (no genuine independent transfer). */
  const noVariedTransfer: MasteryEstimate = { ...passingEstimate(), varied_transfer_forms: 0 };

  it('FRACTION_ON_LINE is in the rollout list', () => {
    expect(PARAMS.transferProbeSkills).toContain('FRACTION_ON_LINE');
  });

  it('flag OFF → behavior identical to today (varied-form field ignored)', () => {
    expect(isMastered(noVariedTransfer, undefined, undefined, { requireTransferProbe: false, nodeId: 'FRACTION_ON_LINE' })).toBe(true);
    expect(isMastered(noVariedTransfer)).toBe(true);
  });

  it('flag ON + FRACTION_ON_LINE + no varied form → NOT mastered', () => {
    expect(isMastered(noVariedTransfer, undefined, undefined, { requireTransferProbe: true, nodeId: 'FRACTION_ON_LINE' })).toBe(false);
  });

  it('flag ON + FRACTION_ON_LINE + a varied form present → certifies', () => {
    expect(isMastered(passingEstimate(), undefined, undefined, { requireTransferProbe: true, nodeId: 'FRACTION_ON_LINE' })).toBe(true);
  });

  it('flag ON but a NON-listed skill → conjunct does not apply (still certifies)', () => {
    // ADD_SAME_DEN is not in the rollout list ⇒ the per-skill conjunct is skipped.
    expect(isMastered(noVariedTransfer, undefined, undefined, { requireTransferProbe: true, nodeId: 'ADD_SAME_DEN' })).toBe(true);
  });

  it('flag ON but no nodeId supplied → conjunct cannot fire (still certifies)', () => {
    expect(isMastered(noVariedTransfer, undefined, undefined, { requireTransferProbe: true })).toBe(true);
  });

  it('gateConditions: transferProbeOk is the sole blocker (flag ON, listed skill)', () => {
    const c = gateConditions(noVariedTransfer, undefined, undefined, { requireTransferProbe: true, nodeId: 'FRACTION_ON_LINE' });
    expect(c.transferOk).toBe(true); // the ORIGINAL transfer conjunct is green
    expect(c.transferProbeOk).toBe(false); // the NEW varied-form conjunct blocks
  });

  it('derived field: two distinct surface_forms ⇒ varied_transfer_forms 2', () => {
    const obs: Observation[] = [
      correctObs({ surface_form: 'number_line' }),
      correctObs({ surface_form: 'area_model' }),
    ];
    const est = buildMasteryEstimate(obs, 0.99);
    expect(est.varied_transfer_forms).toBe(2);
  });
});

// ===========================================================================
// Combined / invariants
// ===========================================================================

describe('round2 hardening — purity, determinism, gateConditions consistency', () => {
  it('isMastered does not mutate its input under any flag overlay', () => {
    const est = passingEstimate();
    const copy = JSON.parse(JSON.stringify(est));
    isMastered(est, true, true, {
      requireMisconceptionFree: true,
      requireStableEstimate: true,
      strictGateThreshold: true,
      requireTransferProbe: true,
      nodeId: 'FRACTION_ON_LINE',
    });
    expect(est).toEqual(copy);
  });

  it('deterministic: same inputs ⇒ same result', () => {
    const est = passingEstimate();
    const flags = { requireStableEstimate: true, requireMisconceptionFree: true } as const;
    expect(isMastered(est, undefined, undefined, flags)).toBe(isMastered(est, undefined, undefined, flags));
  });

  it('all-conditions-true ⟺ isMastered under all four flags ON (consistency)', () => {
    const flags = {
      requireMisconceptionFree: true,
      requireStableEstimate: true,
      strictGateThreshold: true,
      requireTransferProbe: true,
      nodeId: 'FRACTION_ON_LINE',
    } as const;
    const estimates: MasteryEstimate[] = [
      passingEstimate(),
      { ...passingEstimate(), recent_misconception_free: false },
      { ...passingEstimate(), estimate_stable: false },
      { ...passingEstimate(), P_known: 0.97 },
      { ...passingEstimate(), varied_transfer_forms: 0 },
    ];
    for (const est of estimates) {
      const c = gateConditions(est, true, true, flags);
      const allTrue =
        c.accuracyOk && c.independenceOk && c.transferOk && c.fluencyOk &&
        c.durableOk && c.misconceptionFreeOk && c.stableEstimateOk && c.transferProbeOk;
      expect(isMastered(est, true, true, flags)).toBe(allTrue);
    }
  });

  it('all four flags ON: a genuinely-mastered tape still certifies (no over-stricting of the real case)', () => {
    // fluencyHardMode on (passing fluency stats), delayed-probe OFF (that is T09, out of
    // scope here) so we isolate the four round-2 conjuncts on a genuinely-mastered tape.
    expect(
      isMastered(passingEstimate(), true, false, {
        requireMisconceptionFree: true,
        requireStableEstimate: true,
        strictGateThreshold: true,
        requireTransferProbe: true,
        nodeId: 'FRACTION_ON_LINE',
      })
    ).toBe(true);
  });
});
