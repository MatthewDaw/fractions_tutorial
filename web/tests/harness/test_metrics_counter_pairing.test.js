// U6 — population metrics + failure clustering (metrics.js).
//
// The headline/counter pairing (KTD5) is enforced in the MetricsRecord CONSTRUCTOR:
// a headline metric that flatters the engine cannot be built without its counter.
// We also pin clusterFailures (same-(persona_class,skill,decision) → one ranked
// cluster), the population false-mastery rate against a hand-built labeled fixture,
// and answers-given-away (a top-rung hint on a non-mastered attempt).
import { describe, it, expect } from 'vitest';
import { MetricsRecord, aggregate, clusterFailures } from '../../src/harness/metrics.js';
import { labelTape } from '../../src/harness/oracle/latentTruth.js';

// ---------------------------------------------------------------------------
// Tiny tape/step fixtures (hand-built so the labeled population is exactly known).
// ---------------------------------------------------------------------------

function mkTape(over = {}) {
  return {
    run_id: 'r',
    seed: 1,
    persona_id: 'pc',
    persona_latents: {},
    params_hash: 'h',
    engine_sha: 'dev',
    flags: {},
    skillId: 'ADD_SAME_DEN',
    steps: [],
    terminal: { kind: 'StepCap', step: 3 },
    ...over,
  };
}

function step(over = {}) {
  return {
    decision: { kind: 'PracticeAtLevel', rationale: '' },
    observation: {
      correct: true,
      scaffold_level: 3,
      hint_max_rung: 0,
      latency: 3000,
      answer_value: [1, 2],
    },
    gate: false,
    latent: 0.5,
    pknown: 0.5,
    ...over,
  };
}

// ---------------------------------------------------------------------------
// MetricsRecord — constructor THROWS when a headline lacks its counter (KTD5).
// ---------------------------------------------------------------------------

describe('MetricsRecord — headline/counter pairing is enforced in the constructor', () => {
  it('throws when mastery_rate is present without false_mastery_rate', () => {
    expect(() => new MetricsRecord({ mastery_rate: 0.5 })).toThrow(/false_mastery_rate/);
  });

  it('throws when mastery_rate is present without evidence_count_at_gate_open', () => {
    expect(
      () => new MetricsRecord({ mastery_rate: 0.5, false_mastery_rate: 0.1 })
    ).toThrow(/evidence_count_at_gate_open/);
  });

  it('throws when hints_given is present without independence_rate', () => {
    expect(() => new MetricsRecord({ hints_given: 4 })).toThrow(/independence_rate/);
  });

  it('throws when reps_to_mastery is present without transfer_after_fade', () => {
    expect(() => new MetricsRecord({ reps_to_mastery: 7 })).toThrow(/transfer_after_fade/);
  });

  it('builds when every headline has all its counters (and is frozen)', () => {
    const rec = new MetricsRecord({
      mastery_rate: 0.5,
      false_mastery_rate: 0.1,
      evidence_count_at_gate_open: 3,
      hints_given: 2,
      independence_rate: 0.4,
      reps_to_mastery: 6,
      transfer_after_fade: 0.2,
    });
    expect(rec.mastery_rate).toBe(0.5);
    expect(Object.isFrozen(rec)).toBe(true);
    // toJSON drops the frozen pairing contract from the data plane.
    expect(rec.toJSON().required_counters).toBeUndefined();
    expect(rec.toJSON().mastery_rate).toBe(0.5);
  });

  it('a one-sided record can NEVER be serialized — the throw happens at build time', () => {
    // There is no path to a flattering record: the headline alone cannot construct.
    expect(() => new MetricsRecord({ mastery_rate: 1.0 /* no counters */ })).toThrow(/KTD5/);
  });
});

// ---------------------------------------------------------------------------
// aggregate — population false-mastery rate matches a hand-built labeled fixture.
// ---------------------------------------------------------------------------

describe('aggregate — population false-mastery rate from a hand-built labeled fixture', () => {
  // A: gate opens while latent 0.5 (< tau 0.8) → falsePositiveMastery.
  const tFalseMastery = mkTape({
    run_id: 'A',
    persona_id: 'spoofer',
    steps: [step(), step({ gate: true, latent: 0.5 })],
  });
  // B: gate opens while latent 0.9 (≥ tau) → clean, NOT false mastery.
  const tCleanGate = mkTape({
    run_id: 'B',
    persona_id: 'honest',
    steps: [step({ latent: 0.9 }), step({ gate: true, latent: 0.9 })],
  });
  // C: never gates, but a top-rung hint fires on an INCORRECT attempt.
  const tAnswerGiven = mkTape({
    run_id: 'C',
    persona_id: 'over-hinter',
    steps: [
      step({
        observation: {
          correct: false,
          scaffold_level: 1,
          hint_max_rung: 3,
          latency: 3000,
          answer_value: [9, 9],
        },
        latent: 0.4,
      }),
    ],
  });

  it('the oracle labels exactly one of the three tapes as false mastery', () => {
    expect(labelTape(tFalseMastery).labels.falsePositiveMastery).toBe(true);
    expect(labelTape(tCleanGate).labels.falsePositiveMastery).toBe(false);
    expect(labelTape(tAnswerGiven).labels.falsePositiveMastery).toBe(false);
  });

  it('population false_mastery_rate = 1 of 3 labeled tapes', () => {
    const rec = aggregate([tFalseMastery, tCleanGate, tAnswerGiven]);
    expect(rec.n_tapes).toBe(3);
    expect(rec.false_mastery_rate).toBeCloseTo(1 / 3, 10);
    expect(rec.false_positive_mastery_rate).toBeCloseTo(1 / 3, 10);
    // The returned population record honors the pairing contract (it constructed).
    expect(rec).toBeInstanceOf(MetricsRecord);
  });

  it('aggregate breaks the population down per persona class', () => {
    const rec = aggregate([tFalseMastery, tCleanGate, tAnswerGiven]);
    expect(Object.keys(rec.per_persona_class).sort()).toEqual(['honest', 'over-hinter', 'spoofer']);
    expect(rec.per_persona_class.spoofer.false_mastery_rate).toBe(1);
    expect(rec.per_persona_class.honest.false_mastery_rate).toBe(0);
  });

  it('answers-given-away increments on a top-rung hint revealing the answer on a non-mastered attempt', () => {
    const rec = aggregate([tFalseMastery, tCleanGate, tAnswerGiven]);
    // Only tape C has a rung-3 hint on a correct===false attempt.
    expect(rec.answers_given_away).toBe(1);
    expect(rec.hints_given).toBe(1);
  });

  it('a gateless population aggregates without tripping the pairing contract (mastery_rate is null, not 0)', () => {
    // Regression: when NO tape opens the gate, mastery_rate must be absent (null) so
    // its paired counter evidence_count_at_gate_open (also null) does not throw KTD5.
    const ungated = mkTape({
      run_id: 'U',
      persona_id: 'off-task',
      steps: [
        step({
          observation: { correct: false, scaffold_level: 1, hint_max_rung: 0, latency: 3000, answer_value: [9, 9] },
          latent: 0.4,
        }),
      ],
    });
    let rec;
    expect(() => {
      rec = aggregate([ungated]);
    }).not.toThrow();
    expect(rec.mastery_rate).toBeNull();
    expect(rec.evidence_count_at_gate_open).toBeNull();
  });

  it('a top-rung hint on a CORRECT attempt is NOT counted as an answer given away', () => {
    const tHintButCorrect = mkTape({
      run_id: 'D',
      persona_id: 'over-hinter',
      steps: [
        step({
          observation: {
            correct: true,
            scaffold_level: 1,
            hint_max_rung: 3,
            latency: 3000,
            answer_value: [1, 2],
          },
        }),
      ],
    });
    const rec = aggregate([tHintButCorrect]);
    expect(rec.answers_given_away).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// clusterFailures — groups same-(persona_class, skill, decision) into one cluster.
// ---------------------------------------------------------------------------

describe('clusterFailures — same (persona_class, skill, decision_kind) → one ranked cluster', () => {
  function falseMasteryTape(runId) {
    return mkTape({
      run_id: runId,
      persona_id: 'spoofer',
      skillId: 'ADD_SAME_DEN',
      steps: [step(), step({ gate: true, latent: 0.5 })],
    });
  }

  it('two failures with the same key collapse into ONE cluster with count 2', () => {
    const clusters = clusterFailures([falseMasteryTape('A'), falseMasteryTape('B')]);
    expect(clusters).toHaveLength(1);
    const c = clusters[0];
    expect(c.key).toEqual({
      persona_class: 'spoofer',
      skill: 'ADD_SAME_DEN',
      decision_kind: 'PracticeAtLevel',
    });
    expect(c.count).toBe(2);
    // falsePositiveMastery has severity 4 (the most dangerous).
    expect(c.severity).toBe(4);
    expect(c.exemplars).toHaveLength(2);
    expect(c.exemplars.map((e) => e.run_id).sort()).toEqual(['A', 'B']);
  });

  it('different decision_kinds split into distinct clusters, ranked by severity×count', () => {
    const sameDecision = [falseMasteryTape('A'), falseMasteryTape('B')]; // count 2, sev 4 → 8
    const otherDecision = mkTape({
      run_id: 'C',
      persona_id: 'spoofer',
      skillId: 'ADD_SAME_DEN',
      steps: [
        step({ decision: { kind: 'RaiseScaffold', rationale: '' } }),
        step({ decision: { kind: 'RaiseScaffold', rationale: '' }, gate: true, latent: 0.5 }),
      ],
    }); // count 1, sev 4 → 4
    const clusters = clusterFailures([...sameDecision, otherDecision]);
    expect(clusters).toHaveLength(2);
    // Ranked by severity×count descending: the count-2 cluster comes first.
    expect(clusters[0].count).toBe(2);
    expect(clusters[1].count).toBe(1);
    expect(clusters[0].key.decision_kind).toBe('PracticeAtLevel');
    expect(clusters[1].key.decision_kind).toBe('RaiseScaffold');
  });

  it('clean (unlabeled) tapes produce no clusters', () => {
    const cleanTape = mkTape({
      run_id: 'Z',
      persona_id: 'honest',
      steps: [step({ latent: 0.9 }), step({ gate: true, latent: 0.9 })],
    });
    expect(clusterFailures([cleanTape])).toEqual([]);
  });
});
