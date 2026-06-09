// test_gate_delayed_probe.test.ts — T09 / 002 U7 R9: the delayed-probe
// certification gate. isMastered distinguishes ACQUIRED (the four in-session
// Chain-A conjuncts green) from durable MASTERED (the skill also survived a passed
// DELAYED retention probe).
//
// Named scenarios (from the SCOPE-UPGRADED ticket):
//   A. flag-on  + NO passed delayed probe → NOT mastered (only ACQUIRED).
//   B. flag-on  + a PASSED delayed probe   → mastered (durable).
//   C. flag-off (default)                  → certification matches today, byte-for-byte,
//      regardless of delayed_probe_passed.
//
// REVERSIBILITY: the flag defaults OFF (PARAMS.requireDelayedProbe === false).
// PURITY: isMastered is a pure predicate; applyProbeResult does not mutate input.

import { describe, it, expect, afterEach } from 'vitest';
import { isMastered, gateConditions } from '../../src/engine/gate.js';
import { applyProbeResult } from '../../src/engine/decay.js';
import type { MasteryEstimate } from '../../src/engine/types.js';
import { PARAMS } from '../../src/engine/params.js';

/**
 * A fully-ACQUIRED estimate: all four in-session Chain-A conjuncts are green, but
 * the node has NEVER been probed (delayed_probe_passed is absent/false).
 */
function acquiredEstimate(): MasteryEstimate {
  return {
    P_known: 0.96, // above gateThreshold (0.95)
    fluency_stats: { median_latency: 5000, slope: -50, n: 7 },
    max_scaffold_passed: 3, // ≥ L3 = independent
    transfer_passed: true,
    hint_dependence: 0,
    last_retention_probe: null,
    mastered_at: null,
    // delayed_probe_passed omitted on purpose — never probed.
  };
}

describe('T09 default-off — requireDelayedProbe is reversible (no-op when off)', () => {
  it('PARAMS.requireDelayedProbe defaults to false', () => {
    expect(PARAMS.requireDelayedProbe).toBe(false);
  });
});

describe('T09 scenario A — flag ON + no passed delayed probe → NOT mastered (ACQUIRED only)', () => {
  it('an ACQUIRED (never-probed) node is NOT durably mastered when the flag is on', () => {
    const est = acquiredEstimate();
    // Drive the flag via the explicit arg (no PARAMS mutation needed).
    expect(isMastered(est, PARAMS.fluencyHardMode, /*requireDelayedProbe*/ true)).toBe(false);
  });

  it('explicit delayed_probe_passed:false is also NOT mastered when the flag is on', () => {
    const est: MasteryEstimate = { ...acquiredEstimate(), delayed_probe_passed: false };
    expect(isMastered(est, PARAMS.fluencyHardMode, true)).toBe(false);
  });

  it('gateConditions: all in-session conjuncts green but durableOk is false', () => {
    const conds = gateConditions(acquiredEstimate(), PARAMS.fluencyHardMode, true);
    expect(conds.accuracyOk).toBe(true);
    expect(conds.independenceOk).toBe(true);
    expect(conds.transferOk).toBe(true);
    expect(conds.fluencyOk).toBe(true);
    expect(conds.durableOk).toBe(false); // the durable conjunct is the sole blocker
  });
});

describe('T09 scenario B — flag ON + a PASSED delayed probe → durably mastered', () => {
  it('a node that PASSED a delayed probe certifies when the flag is on', () => {
    const est = applyProbeResult(acquiredEstimate(), { correct: true, now: 1_700_000_000_000 });
    expect(est.delayed_probe_passed).toBe(true);
    expect(isMastered(est, PARAMS.fluencyHardMode, true)).toBe(true);
  });

  it('a FAILED delayed probe does NOT confer durable mastery (demotion intact)', () => {
    const passing = acquiredEstimate();
    const failed = applyProbeResult(passing, { correct: false, now: 1_700_000_000_000 });
    // Demotion-on-fail path is intact: transfer cleared and P_known dropped.
    expect(failed.transfer_passed).toBe(false);
    expect(failed.P_known).toBeLessThan(PARAMS.gateThreshold);
    expect(failed.delayed_probe_passed).not.toBe(true);
    // Closed under BOTH flag states (fails the in-session conjuncts already).
    expect(isMastered(failed, PARAMS.fluencyHardMode, true)).toBe(false);
    expect(isMastered(failed, PARAMS.fluencyHardMode, false)).toBe(false);
  });
});

describe('T09 scenario C — flag OFF (default) matches today, byte-identical', () => {
  it('an ACQUIRED node certifies with the flag off (ACQUIRED == MASTERED today)', () => {
    expect(isMastered(acquiredEstimate(), PARAMS.fluencyHardMode, false)).toBe(true);
  });

  it('default arg (PARAMS.requireDelayedProbe === false) is identical to explicit-off', () => {
    const est = acquiredEstimate();
    expect(isMastered(est)).toBe(isMastered(est, PARAMS.fluencyHardMode, false));
    expect(isMastered(est)).toBe(true); // pins today's behavior
  });

  it('flag off: delayed_probe_passed value is IGNORED (neither presence nor absence matters)', () => {
    const never = acquiredEstimate();
    const passed: MasteryEstimate = { ...acquiredEstimate(), delayed_probe_passed: true };
    const failedField: MasteryEstimate = { ...acquiredEstimate(), delayed_probe_passed: false };
    expect(isMastered(never, PARAMS.fluencyHardMode, false)).toBe(true);
    expect(isMastered(passed, PARAMS.fluencyHardMode, false)).toBe(true);
    expect(isMastered(failedField, PARAMS.fluencyHardMode, false)).toBe(true);
  });

  it('gateConditions durableOk is trivially true when the flag is off', () => {
    expect(gateConditions(acquiredEstimate(), PARAMS.fluencyHardMode, false).durableOk).toBe(true);
  });
});

describe('T09 — purity / firewall', () => {
  it('applyProbeResult does not mutate its input estimate', () => {
    const est = acquiredEstimate();
    const copy = { ...est };
    applyProbeResult(est, { correct: true, now: 42 });
    expect(est).toEqual(copy); // delayed_probe_passed NOT added to the original
  });

  it('isMastered is deterministic and side-effect free under the new conjunct', () => {
    const est = applyProbeResult(acquiredEstimate(), { correct: true, now: 1 });
    const before = { ...est };
    const r1 = isMastered(est, PARAMS.fluencyHardMode, true);
    const r2 = isMastered(est, PARAMS.fluencyHardMode, true);
    expect(r1).toBe(r2);
    expect(est).toEqual(before);
  });
});
