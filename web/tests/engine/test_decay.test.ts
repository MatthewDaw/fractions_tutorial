// test_decay.test.ts — U5: Decay / retention probe tests.
//
// Test scenarios (from the plan U5):
//   1. A scheduled probe becomes due after the injected delay.
//   2. A failed probe demotes the node (transfer_passed=false, P_known < 0.95).
//   3. A demoted node is eligible for wall routing again (isMastered returns false).
//   4. A passed probe records the timestamp but keeps P_known and transfer_passed.
//   5. No wall-clock calls — all time is injected via 'now' parameter.

import { describe, it, expect } from 'vitest';
import {
  scheduleRetentionProbe,
  isProbeDue,
  applyProbeResult,
  PROBE_DELAYS_MS,
} from '../../src/engine/decay.js';
import { isMastered } from '../../src/engine/gate.js';
import type { MasteryEstimate } from '../../src/engine/types.js';
import { PARAMS } from '../../src/engine/params.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000; // arbitrary fixed epoch (ms)

/** Build a fully-mastered estimate. */
function masteredEstimate(): MasteryEstimate {
  return {
    P_known: 0.97,
    fluency_stats: { median_latency: 4000, slope: -10, n: 8 },
    max_scaffold_passed: 3,
    transfer_passed: true,
    hint_dependence: 0,
    last_retention_probe: null,
  };
}

// ---------------------------------------------------------------------------
// 1. Probe scheduling + due-date
// ---------------------------------------------------------------------------

describe('scheduleRetentionProbe', () => {
  it('first probe (index 0) is due 1 day after now', () => {
    const probe = scheduleRetentionProbe('ADD_SAME_DEN', NOW, 0);
    expect(probe.dueAt).toBe(NOW + PROBE_DELAYS_MS[0]);
    expect(probe.dueAt).toBe(NOW + DAY_MS);
  });

  it('second probe (index 1) is due 3 days after now', () => {
    const probe = scheduleRetentionProbe('ADD_SAME_DEN', NOW, 1);
    expect(probe.dueAt).toBe(NOW + PROBE_DELAYS_MS[1]);
    expect(probe.dueAt).toBe(NOW + 3 * DAY_MS);
  });

  it('probe index is clamped at the schedule length', () => {
    const maxIdx = PROBE_DELAYS_MS.length - 1;
    const probe = scheduleRetentionProbe('ADD_SAME_DEN', NOW, 999);
    expect(probe.dueAt).toBe(NOW + PROBE_DELAYS_MS[maxIdx]);
  });

  it('probe nodeId is stored', () => {
    const probe = scheduleRetentionProbe('ADD_UNLIKE_NESTED', NOW);
    expect(probe.nodeId).toBe('ADD_UNLIKE_NESTED');
  });
});

describe('isProbeDue', () => {
  it('probe is NOT due before dueAt', () => {
    const probe = scheduleRetentionProbe('ADD_SAME_DEN', NOW, 0);
    expect(isProbeDue(probe, NOW)).toBe(false);
    expect(isProbeDue(probe, NOW + DAY_MS - 1)).toBe(false);
  });

  it('probe IS due at exactly dueAt', () => {
    const probe = scheduleRetentionProbe('ADD_SAME_DEN', NOW, 0);
    expect(isProbeDue(probe, probe.dueAt)).toBe(true);
  });

  it('probe IS due after dueAt', () => {
    const probe = scheduleRetentionProbe('ADD_SAME_DEN', NOW, 0);
    expect(isProbeDue(probe, probe.dueAt + 1000)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. Failed probe demotes the node
// ---------------------------------------------------------------------------

describe('applyProbeResult — failed probe', () => {
  it('clears transfer_passed', () => {
    const est = masteredEstimate();
    const after = applyProbeResult(est, { correct: false, now: NOW + DAY_MS });
    expect(after.transfer_passed).toBe(false);
  });

  it('drops P_known below the mastery threshold (0.95)', () => {
    const est = masteredEstimate();
    const after = applyProbeResult(est, { correct: false, now: NOW + DAY_MS });
    expect(after.P_known).toBeLessThan(PARAMS.gateThreshold);
  });

  it('records the probe timestamp', () => {
    const probeTime = NOW + DAY_MS;
    const after = applyProbeResult(masteredEstimate(), { correct: false, now: probeTime });
    expect(after.last_retention_probe).toBe(probeTime);
  });

  it('does not mutate the input estimate', () => {
    const est = masteredEstimate();
    const original = { ...est };
    applyProbeResult(est, { correct: false, now: NOW });
    expect(est).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// 3. A demoted node is no longer mastered → eligible for wall routing
// ---------------------------------------------------------------------------

describe('demoted node re-opens for wall routing', () => {
  it('isMastered returns false after a failed probe', () => {
    const est = masteredEstimate();
    // Confirm the estimate was mastered before the probe.
    expect(isMastered(est)).toBe(true);

    // Apply a failed probe.
    const demoted = applyProbeResult(est, { correct: false, now: NOW + DAY_MS });

    // The demoted node should no longer pass the gate.
    expect(isMastered(demoted)).toBe(false);
  });

  it('P_known is below gateThreshold after demotion', () => {
    const est = masteredEstimate();
    const demoted = applyProbeResult(est, { correct: false, now: NOW + DAY_MS });
    expect(demoted.P_known).toBeLessThan(PARAMS.gateThreshold);
  });

  it('transfer_passed is false after demotion', () => {
    const est = masteredEstimate();
    const demoted = applyProbeResult(est, { correct: false, now: NOW + DAY_MS });
    expect(demoted.transfer_passed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. Passed probe preserves P_known and transfer_passed
// ---------------------------------------------------------------------------

describe('applyProbeResult — passed probe', () => {
  it('keeps P_known unchanged', () => {
    const est = masteredEstimate();
    const after = applyProbeResult(est, { correct: true, now: NOW + DAY_MS });
    expect(after.P_known).toBe(est.P_known);
  });

  it('keeps transfer_passed true', () => {
    const est = masteredEstimate();
    const after = applyProbeResult(est, { correct: true, now: NOW + DAY_MS });
    expect(after.transfer_passed).toBe(true);
  });

  it('records the probe timestamp', () => {
    const probeTime = NOW + DAY_MS;
    const after = applyProbeResult(masteredEstimate(), { correct: true, now: probeTime });
    expect(after.last_retention_probe).toBe(probeTime);
  });

  it('node remains mastered after a passed probe', () => {
    const est = masteredEstimate();
    const after = applyProbeResult(est, { correct: true, now: NOW + DAY_MS });
    expect(isMastered(after)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Determinism — no wall-clock dependency
//
// Verified structurally: all functions accept 'now' as a parameter and return
// deterministic results for the same inputs. We run the same probe twice and
// confirm identical outputs.
// ---------------------------------------------------------------------------

describe('decay determinism (no wall-clock)', () => {
  it('scheduleRetentionProbe is deterministic for the same now', () => {
    const a = scheduleRetentionProbe('ADD_SAME_DEN', NOW);
    const b = scheduleRetentionProbe('ADD_SAME_DEN', NOW);
    expect(a).toEqual(b);
  });

  it('applyProbeResult is deterministic for the same inputs', () => {
    const est = masteredEstimate();
    const a = applyProbeResult(est, { correct: false, now: NOW });
    const b = applyProbeResult(est, { correct: false, now: NOW });
    expect(a).toEqual(b);
  });

  it('multiple failed probes keep demoting P_known', () => {
    const est = masteredEstimate();
    const once = applyProbeResult(est, { correct: false, now: NOW });
    const twice = applyProbeResult(once, { correct: false, now: NOW + DAY_MS });
    // Each incorrect BKT update further lowers P_known.
    expect(twice.P_known).toBeLessThan(once.P_known);
  });
});
