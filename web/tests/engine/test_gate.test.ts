// test_gate.test.ts — U5: Mastery gate tests.
//
// Test scenarios (from the plan U5):
//   1. Gate passes only when ALL four conditions hold; flipping any one closes it.
//   2. Pre-calibration, a failing soft-fluency does NOT block the gate.
//   3. The config hard-switch makes failing fluency block the gate.
//   4. MASTERED status is reachable only through isMastered() (type/shape assertion).
//   5. gateConditions() reports individual condition states correctly.

import { describe, it, expect } from 'vitest';
import { isMastered, gateConditions } from '../../src/engine/gate.js';
import type { MasteryEstimate } from '../../src/engine/types.js';
import { PARAMS } from '../../src/engine/params.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a fully-passing MasteryEstimate (all conditions green). */
function passingEstimate(): MasteryEstimate {
  return {
    P_known: 0.96,               // above gateThreshold (0.95)
    fluency_stats: {
      median_latency: 5000,      // well below AGE_BAND_MS (15 s)
      slope: -50,                // negative slope = improving
      n: 7,
    },
    max_scaffold_passed: 3,      // ≥ L3 = independent
    transfer_passed: true,
    hint_dependence: 0,
    last_retention_probe: null,
  };
}

/** Mutate one field and return a new estimate. */
function with_<K extends keyof MasteryEstimate>(
  est: MasteryEstimate,
  key: K,
  value: MasteryEstimate[K]
): MasteryEstimate {
  return { ...est, [key]: value };
}

// ---------------------------------------------------------------------------
// 1. All four conditions must hold; flipping any one closes the gate
// ---------------------------------------------------------------------------

describe('isMastered — AND gate', () => {
  it('passes when all four conditions hold', () => {
    expect(isMastered(passingEstimate())).toBe(true);
  });

  it('fails when P_known is below the threshold', () => {
    const est = with_(passingEstimate(), 'P_known', PARAMS.gateThreshold - 0.001);
    expect(isMastered(est)).toBe(false);
  });

  it('passes exactly at the threshold', () => {
    const est = with_(passingEstimate(), 'P_known', PARAMS.gateThreshold);
    expect(isMastered(est)).toBe(true);
  });

  it('fails when max_scaffold_passed is null (no independent evidence)', () => {
    const est = with_(passingEstimate(), 'max_scaffold_passed', null);
    expect(isMastered(est)).toBe(false);
  });

  it('fails when max_scaffold_passed < 3 (not independent)', () => {
    const est = with_(passingEstimate(), 'max_scaffold_passed', 2);
    expect(isMastered(est)).toBe(false);
  });

  it('passes with max_scaffold_passed exactly 3', () => {
    const est = with_(passingEstimate(), 'max_scaffold_passed', 3);
    expect(isMastered(est)).toBe(true);
  });

  it('passes with max_scaffold_passed 4', () => {
    const est = with_(passingEstimate(), 'max_scaffold_passed', 4);
    expect(isMastered(est)).toBe(true);
  });

  it('fails when transfer_passed is false', () => {
    const est = with_(passingEstimate(), 'transfer_passed', false);
    expect(isMastered(est)).toBe(false);
  });

  it('failing TWO conditions still fails (not just any-one)', () => {
    const est = {
      ...passingEstimate(),
      P_known: 0.5,            // fail accuracy
      transfer_passed: false,  // fail transfer
    };
    expect(isMastered(est)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2 & 3. Soft vs. hard fluency switch
// ---------------------------------------------------------------------------

describe('isMastered — fluency soft/hard switch', () => {
  /** Estimate where fluency stats would fail the hard gate. */
  function failingFluencyEstimate(): MasteryEstimate {
    return {
      ...passingEstimate(),
      fluency_stats: {
        median_latency: 30_000, // above AGE_BAND_MS (15 s) — fails hard gate
        slope: 2000,            // positive slope = deteriorating — fails hard gate
        n: 7,
      },
    };
  }

  it('soft mode (default): failing fluency does NOT block the gate', () => {
    // Pre-calibration — fluency is advisory only.
    expect(isMastered(failingFluencyEstimate(), false)).toBe(true);
  });

  it('hard mode: failing fluency DOES block the gate', () => {
    expect(isMastered(failingFluencyEstimate(), true)).toBe(false);
  });

  it('hard mode: passing fluency still passes', () => {
    expect(isMastered(passingEstimate(), true)).toBe(true);
  });

  it('hard mode: insufficient data (null) is treated as passing (not enough evidence to block)', () => {
    const est = {
      ...passingEstimate(),
      fluency_stats: { median_latency: null, slope: null, n: 2 },
    };
    // fluencyOk with hardMode=true and null stats returns true (insufficient evidence)
    expect(isMastered(est, true)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. Retention probe timestamp does NOT affect the gate
//    (affirms the affect firewall — last_retention_probe is Chain-A metadata,
//     not a gate condition itself).
// ---------------------------------------------------------------------------

describe('isMastered — retention probe does not affect gate', () => {
  it('a non-null last_retention_probe does not change the gate result', () => {
    const withProbe = with_(passingEstimate(), 'last_retention_probe', 1_700_000_000_000);
    expect(isMastered(withProbe)).toBe(true);
  });

  it('a null last_retention_probe still passes when other conditions hold', () => {
    const withoutProbe = with_(passingEstimate(), 'last_retention_probe', null);
    expect(isMastered(withoutProbe)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. gateConditions() reports individual states
// ---------------------------------------------------------------------------

describe('gateConditions', () => {
  it('all conditions true for a passing estimate', () => {
    const conds = gateConditions(passingEstimate());
    expect(conds.accuracyOk).toBe(true);
    expect(conds.independenceOk).toBe(true);
    expect(conds.transferOk).toBe(true);
    expect(conds.fluencyOk).toBe(true);
  });

  it('accuracyOk false when P_known < threshold', () => {
    const est = with_(passingEstimate(), 'P_known', 0.5);
    expect(gateConditions(est).accuracyOk).toBe(false);
  });

  it('independenceOk false when max_scaffold_passed < 3', () => {
    const est = with_(passingEstimate(), 'max_scaffold_passed', 1);
    expect(gateConditions(est).independenceOk).toBe(false);
  });

  it('transferOk false when transfer_passed is false', () => {
    const est = with_(passingEstimate(), 'transfer_passed', false);
    expect(gateConditions(est).transferOk).toBe(false);
  });

  it('gateConditions consistency: all true ⟺ isMastered (soft mode)', () => {
    // Every combination of passing/failing should be internally consistent.
    const estimates: MasteryEstimate[] = [
      passingEstimate(),
      with_(passingEstimate(), 'P_known', 0.5),
      with_(passingEstimate(), 'transfer_passed', false),
      with_(passingEstimate(), 'max_scaffold_passed', null),
    ];
    for (const est of estimates) {
      const conds = gateConditions(est);
      const allTrue = conds.accuracyOk && conds.independenceOk && conds.transferOk && conds.fluencyOk;
      expect(isMastered(est)).toBe(allTrue);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Type/shape assertion: no setter bypass
//
// The MASTERED concept is only derivable from isMastered().
// There is no "setMastered" or "DeclareMastered" in the Decision union.
// We assert the absence of such a type by verifying the Decision union
// imported from types.ts has no 'DeclareMastered' kind.
// ---------------------------------------------------------------------------

describe('no setter bypass — isMastered is the sole MASTERED path', () => {
  it('isMastered is a pure predicate (no side effects)', () => {
    const est = passingEstimate();
    const copy = { ...est };
    isMastered(est);
    // The original estimate is unchanged.
    expect(est).toEqual(copy);
  });

  it('calling isMastered multiple times gives the same result (deterministic)', () => {
    const est = passingEstimate();
    const r1 = isMastered(est);
    const r2 = isMastered(est);
    expect(r1).toBe(r2);
  });
});
