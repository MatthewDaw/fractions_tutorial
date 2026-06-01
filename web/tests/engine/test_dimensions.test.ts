// test_dimensions.test.ts — U4: Fluency, independence, transfer, hint-dependence + MasteryEstimate.
//
// Tests:
//   1. Fluency needs ≥5 corrects; with 4, median_latency and slope are null.
//   2. Two corrects at L3 on distinct problems hint-free → independent.
//   3. One correct at L3 hint-free is NOT enough for independence.
//   4. A hinted correct (hint_max_rung > 0) does not count for independence.
//   5. Two corrects on the SAME surface_form do NOT pass transfer.
//   6. Two corrects on distinct surface_forms DO pass transfer.
//   7. hint_dependence rises when recent corrects used H2+.
//   8. MasteryEstimate is a pure fold (replay-stable).
//   9. AFFECT FIREWALL: injecting affect Signals changes no MasteryEstimate field.

import { describe, it, expect } from 'vitest';
import {
  computeFluency,
  fluencyOk,
  isIndependent,
  hasTransferred,
  computeHintDependence,
} from '../../src/engine/dimensions.js';
import { buildMasteryEstimate } from '../../src/engine/mastery.js';
import { segment } from '../../src/engine/observation.js';
import type { Observation, Event, Action } from '../../src/engine/types.js';
import { PARAMS } from '../../src/engine/params.js';

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function makeObs(overrides: Partial<Observation> = {}): Observation {
  return {
    correct: true,
    answer_value: [3, 4],
    error_signature: null,
    latency: 3000,
    hint_max_rung: 0,
    self_corrections: 0,
    scaffold_level: 3,
    modality: 'tap',
    recognizer_confidence: null,
    too_fast_correct: false,
    affect_window: [],
    ...overrides,
  };
}

/** Build N correct observations with distinct answer_values (simulates distinct problems). */
function makeDistinctCorrects(n: number, scaffoldLevel: Observation['scaffold_level'] = 3): Observation[] {
  return Array.from({ length: n }, (_, i) => makeObs({
    scaffold_level: scaffoldLevel,
    answer_value: [i + 1, i + 4], // distinct fractions
    hint_max_rung: 0,
    latency: PARAMS.latencyFloorMs + 500, // in band
  }));
}

// Action builder for affect-firewall test
function action(type: string, t: number, payload: Record<string, unknown> = {}): Action {
  return { type, payload, modality: 'tap', t, actor: 'human' };
}

function signal(type: string, t: number): Event {
  return { type, payload: { level: 'distracted' }, confidence: 0.9, t, actor: 'human' };
}

// ---------------------------------------------------------------------------
// 1. Fluency — minimum N
// ---------------------------------------------------------------------------

describe('computeFluency', () => {
  it('returns null median and slope when n < fluencyMinN (4 corrects)', () => {
    const obs = makeDistinctCorrects(PARAMS.fluencyMinN - 1);
    const stats = computeFluency(obs);
    expect(stats.median_latency).toBeNull();
    expect(stats.slope).toBeNull();
    expect(stats.n).toBe(PARAMS.fluencyMinN - 1);
  });

  it('returns non-null median and slope with exactly fluencyMinN corrects', () => {
    const obs = makeDistinctCorrects(PARAMS.fluencyMinN);
    const stats = computeFluency(obs);
    expect(stats.median_latency).not.toBeNull();
    expect(stats.slope).not.toBeNull();
    expect(stats.n).toBe(PARAMS.fluencyMinN);
  });

  it('counts only CORRECT observations', () => {
    const obs = [
      ...makeDistinctCorrects(3),
      makeObs({ correct: false, latency: 2000 }),
      makeObs({ correct: false, latency: 2000 }),
      // total correct = 3 < fluencyMinN (5)
    ];
    const stats = computeFluency(obs);
    expect(stats.median_latency).toBeNull();
    expect(stats.n).toBe(3);
  });

  it('uses the LAST fluencyMinN corrects (not all)', () => {
    // 6 corrects: first one has huge latency, last 5 are normal
    const obs = [
      makeObs({ latency: 99999 }),
      ...makeDistinctCorrects(PARAMS.fluencyMinN).map((o, i) => ({ ...o, latency: 2000 + i * 100 })),
    ];
    const stats = computeFluency(obs);
    // median should be from the last 5 (≈2200), not 99999
    expect(stats.median_latency).toBeLessThan(10000);
  });
});

describe('fluencyOk', () => {
  it('returns true in soft mode (default) even when latency is high', () => {
    const stats = computeFluency(
      Array.from({ length: PARAMS.fluencyMinN }, () => makeObs({ latency: 60000 }))
    );
    // soft mode — always passes
    expect(fluencyOk(stats, false)).toBe(true);
  });

  it('returns true in soft mode when stats are null (not enough data)', () => {
    const stats = { median_latency: null, slope: null, n: 2 };
    expect(fluencyOk(stats, false)).toBe(true);
    expect(fluencyOk(stats, true)).toBe(true); // insufficient evidence — does not block
  });

  it('hard mode returns false when median_latency is too high', () => {
    // Build 5 corrects with latency 30s (> AGE_BAND_MS 15s)
    const obs = Array.from({ length: PARAMS.fluencyMinN }, () =>
      makeObs({ latency: 30000 })
    );
    const stats = computeFluency(obs);
    // Hard mode should fail on high latency
    expect(fluencyOk(stats, true)).toBe(false);
  });

  it('hard mode returns true when latency is fast enough', () => {
    const obs = Array.from({ length: PARAMS.fluencyMinN }, () =>
      makeObs({ latency: 5000 })
    );
    const stats = computeFluency(obs);
    expect(fluencyOk(stats, true)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2, 3, 4. Independence
// ---------------------------------------------------------------------------

describe('isIndependent', () => {
  it('false with 0 corrects', () => {
    expect(isIndependent([])).toBe(false);
  });

  it('false with only 1 correct at L3, hint-free', () => {
    const obs = [makeObs({ scaffold_level: 3, hint_max_rung: 0 })];
    expect(isIndependent(obs)).toBe(false);
  });

  it('true with 2 corrects at L3 on distinct problems hint-free', () => {
    const obs = [
      makeObs({ scaffold_level: 3, hint_max_rung: 0, answer_value: [3, 4] }),
      makeObs({ scaffold_level: 3, hint_max_rung: 0, answer_value: [5, 8] }),
    ];
    expect(isIndependent(obs)).toBe(true);
  });

  it('false when both corrects are on the SAME problem (same answer_value)', () => {
    const obs = [
      makeObs({ scaffold_level: 3, hint_max_rung: 0, answer_value: [3, 4] }),
      makeObs({ scaffold_level: 3, hint_max_rung: 0, answer_value: [3, 4] }),
    ];
    // Both have the same answer_value proxy → same "problem" → not independent
    expect(isIndependent(obs)).toBe(false);
  });

  it('false when hinted corrects are below L3', () => {
    const obs = [
      makeObs({ scaffold_level: 2, hint_max_rung: 0, answer_value: [3, 4] }),
      makeObs({ scaffold_level: 2, hint_max_rung: 0, answer_value: [5, 8] }),
    ];
    expect(isIndependent(obs)).toBe(false);
  });

  it('a hinted correct (hint_max_rung > 0) does not count', () => {
    const obs = [
      makeObs({ scaffold_level: 3, hint_max_rung: 2, answer_value: [3, 4] }), // hinted
      makeObs({ scaffold_level: 3, hint_max_rung: 0, answer_value: [5, 8] }), // hint-free
    ];
    // Only 1 qualifying (hint-free, L3+) — not enough
    expect(isIndependent(obs)).toBe(false);
  });

  it('true with 3 corrects at L4 on distinct problems (more than minimum)', () => {
    const obs = makeDistinctCorrects(3, 4);
    expect(isIndependent(obs)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5, 6. Transfer
// ---------------------------------------------------------------------------

describe('hasTransferred', () => {
  it('false with 0 corrects', () => {
    expect(hasTransferred([])).toBe(false);
  });

  it('false with 2 corrects on the SAME surface_form / same denominator proxy', () => {
    const obs = [
      makeObs({ answer_value: [3, 4], hint_max_rung: 0, scaffold_level: 2, latency: PARAMS.latencyFloorMs + 500 }),
      makeObs({ answer_value: [7, 4], hint_max_rung: 0, scaffold_level: 2, latency: PARAMS.latencyFloorMs + 500 }),
      // Both denominator = 4 → same surface_form proxy
    ];
    expect(hasTransferred(obs)).toBe(false);
  });

  it('true with 2 corrects on distinct denominators (distinct surface_forms)', () => {
    const obs = [
      makeObs({ answer_value: [3, 4], hint_max_rung: 0, scaffold_level: 2, latency: PARAMS.latencyFloorMs + 500 }),
      makeObs({ answer_value: [5, 6], hint_max_rung: 0, scaffold_level: 2, latency: PARAMS.latencyFloorMs + 500 }),
      // Denominator 4 ≠ 6 → distinct surface_forms
    ];
    expect(hasTransferred(obs)).toBe(true);
  });

  it('true with explicit surface_form field', () => {
    const obs = [
      { ...makeObs({ hint_max_rung: 0, scaffold_level: 2, latency: PARAMS.latencyFloorMs + 500 }), surface_form: 'visual' },
      { ...makeObs({ hint_max_rung: 0, scaffold_level: 2, latency: PARAMS.latencyFloorMs + 500 }), surface_form: 'symbolic' },
    ];
    expect(hasTransferred(obs as Observation[])).toBe(true);
  });

  it('hinted correct does not count for transfer', () => {
    const obs = [
      makeObs({ answer_value: [3, 4], hint_max_rung: 2, scaffold_level: 2, latency: PARAMS.latencyFloorMs + 500 }),
      makeObs({ answer_value: [5, 6], hint_max_rung: 0, scaffold_level: 2, latency: PARAMS.latencyFloorMs + 500 }),
    ];
    // Only 1 qualifying → fails transfer
    expect(hasTransferred(obs)).toBe(false);
  });

  it('too_fast correct (latency < floor) does not count for transfer', () => {
    const obs = [
      makeObs({ answer_value: [3, 4], hint_max_rung: 0, scaffold_level: 2, latency: PARAMS.latencyFloorMs - 100 }),
      makeObs({ answer_value: [5, 6], hint_max_rung: 0, scaffold_level: 2, latency: PARAMS.latencyFloorMs - 100 }),
    ];
    // Both below latency floor → not in band
    expect(hasTransferred(obs)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 7. Hint-dependence
// ---------------------------------------------------------------------------

describe('computeHintDependence', () => {
  it('0 when no observations', () => {
    expect(computeHintDependence([])).toBe(0);
  });

  it('0 when all recent corrects are hint-free', () => {
    const obs = makeDistinctCorrects(5).map((o) => ({ ...o, hint_max_rung: 0 }));
    expect(computeHintDependence(obs)).toBe(0);
  });

  it('rises when recent corrects used H2+', () => {
    const obs = [
      makeObs({ hint_max_rung: 2 }), // hint-dependent
      makeObs({ hint_max_rung: 3 }), // hint-dependent
      makeObs({ hint_max_rung: 0 }), // hint-free
      makeObs({ hint_max_rung: 0 }), // hint-free
    ];
    const dep = computeHintDependence(obs);
    expect(dep).toBeGreaterThan(0);
    expect(dep).toBeLessThanOrEqual(1);
    expect(dep).toBeCloseTo(2 / 4, 5);
  });

  it('1.0 when ALL recent corrects used H2+', () => {
    const obs = makeDistinctCorrects(3).map((o) => ({ ...o, hint_max_rung: 2 }));
    expect(computeHintDependence(obs)).toBe(1);
  });

  it('counts only CORRECT observations (incorrect with hints should not count)', () => {
    const obs = [
      makeObs({ correct: false, hint_max_rung: 3 }), // wrong — excluded
      makeObs({ correct: true, hint_max_rung: 0 }),  // correct, hint-free
    ];
    expect(computeHintDependence(obs)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 8. MasteryEstimate — pure fold (replay-stable)
// ---------------------------------------------------------------------------

describe('buildMasteryEstimate', () => {
  it('is replay-stable: same observations produce the same estimate', () => {
    const obs = makeDistinctCorrects(5);
    const P_known = 0.7;
    const est1 = buildMasteryEstimate(obs, P_known);
    const est2 = buildMasteryEstimate(obs, P_known);
    expect(est1.P_known).toBe(est2.P_known);
    expect(est1.transfer_passed).toBe(est2.transfer_passed);
    expect(est1.hint_dependence).toBe(est2.hint_dependence);
    expect(est1.max_scaffold_passed).toBe(est2.max_scaffold_passed);
  });

  it('P_known reflects the injected value (not recalculated)', () => {
    const est = buildMasteryEstimate(makeDistinctCorrects(3), 0.88);
    expect(est.P_known).toBe(0.88);
  });

  it('max_scaffold_passed is null when no hint-free corrects', () => {
    const obs = [makeObs({ correct: true, hint_max_rung: 1, scaffold_level: 3 })];
    const est = buildMasteryEstimate(obs, 0.5);
    // hint_max_rung=1 → not hint-free → does not count for max_scaffold_passed
    expect(est.max_scaffold_passed).toBeNull();
  });

  it('max_scaffold_passed reflects the highest hint-free scaffold level', () => {
    const obs = [
      makeObs({ correct: true, hint_max_rung: 0, scaffold_level: 2 }),
      makeObs({ correct: true, hint_max_rung: 0, scaffold_level: 4 }),
      makeObs({ correct: true, hint_max_rung: 1, scaffold_level: 4 }), // hinted — does not count
    ];
    const est = buildMasteryEstimate(obs, 0.7);
    expect(est.max_scaffold_passed).toBe(4);
  });

  it('last_retention_probe is passed through as-is', () => {
    const ts = 1_700_000_000_000;
    const est = buildMasteryEstimate([], 0.3, ts);
    expect(est.last_retention_probe).toBe(ts);
  });
});

// ---------------------------------------------------------------------------
// 9. AFFECT FIREWALL — injecting affect Signals changes no MasteryEstimate field
// ---------------------------------------------------------------------------

describe('AFFECT FIREWALL', () => {
  it('injecting affect Signals into the log does not change any MasteryEstimate field', () => {
    // Build a baseline log with real attempts.
    const baseLog: Event[] = [];

    function addAttempt(
      presentT: number,
      judgedT: number,
      correct: boolean,
      scaffoldLevel: 0 | 1 | 2 | 3 | 4,
      answerDen: number
    ) {
      baseLog.push(
        action('problem_present', presentT, { scaffold_level: scaffoldLevel }),
        action('answer_submit', judgedT - 100, { num: 3, den: answerDen }),
        action('judged', judgedT, { correct, answer_num: 3, answer_den: answerDen })
      );
    }

    addAttempt(1000, 4000, true, 3, 4);
    addAttempt(5000, 8000, true, 3, 6);
    addAttempt(9000, 12000, false, 3, 5);
    addAttempt(13000, 16000, true, 4, 8);
    addAttempt(17000, 20000, true, 3, 10);

    // Segment the base log → observations.
    const baseObs = segment(baseLog);
    const P_known = 0.72;
    const baseEst = buildMasteryEstimate(baseObs, P_known);

    // Now build a log WITH affect Signals interspersed.
    const affectLog: Event[] = [];
    for (const ev of baseLog) {
      affectLog.push(ev);
      // inject an affect signal after every event
      affectLog.push(signal('affect_distracted', ('t' in ev ? ev.t : 0) + 1));
      affectLog.push(signal('affect_tense', ('t' in ev ? ev.t : 0) + 2));
    }

    const affectObs = segment(affectLog);
    const affectEst = buildMasteryEstimate(affectObs, P_known);

    // Every MasteryEstimate field must be identical.
    expect(affectEst.P_known).toBe(baseEst.P_known);
    expect(affectEst.transfer_passed).toBe(baseEst.transfer_passed);
    expect(affectEst.hint_dependence).toBe(baseEst.hint_dependence);
    expect(affectEst.max_scaffold_passed).toBe(baseEst.max_scaffold_passed);
    expect(affectEst.fluency_stats.n).toBe(baseEst.fluency_stats.n);
    expect(affectEst.fluency_stats.median_latency).toBe(baseEst.fluency_stats.median_latency);
    expect(affectEst.fluency_stats.slope).toBe(baseEst.fluency_stats.slope);
    expect(affectEst.last_retention_probe).toBe(baseEst.last_retention_probe);
  });

  it('affect_window field of each Observation is always the empty array stub', () => {
    const logWithAffect: Event[] = [
      action('problem_present', 1000, { scaffold_level: 2 }),
      signal('affect_distracted', 1500),
      signal('affect_tense', 2000),
      action('answer_submit', 3000, { num: 3, den: 4 }),
      signal('affect_calm', 3100),
      action('judged', 3200, { correct: true, answer_num: 3, answer_den: 4 }),
    ];
    const obs = segment(logWithAffect);
    expect(obs).toHaveLength(1);
    expect(obs[0].affect_window).toEqual([]);
  });

  it('MasteryEstimate does not have an affect field at all', () => {
    const est = buildMasteryEstimate([], 0.5);
    expect('affect' in est).toBe(false);
    expect('affect_window' in est).toBe(false);
    expect('affect_score' in est).toBe(false);
  });
});
