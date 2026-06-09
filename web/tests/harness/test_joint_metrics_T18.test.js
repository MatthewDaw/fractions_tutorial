// T18 — Joint counter-metrics test.
//
// Verifies that MetricsRecord carries both joint derived metrics and that they
// correctly detect the two cross-condition gaming patterns described in PDF Req 7:
//
//   transfer_per_mastery_gain  — catches "score/mastery up but transfer flat"
//   hint_independence_divergence — catches "hints up, independence down"
//
// Uses hand-built synthetic tapes so the population is exactly known, enabling
// precise numeric assertions. Depends on T13's independent false_transfer_rate.

import { describe, it, expect } from 'vitest';
import { aggregate, MetricsRecord } from '../../src/harness/metrics.js';

// ---------------------------------------------------------------------------
// Minimal tape/step helpers (mirrors test_metrics_counter_pairing.test.js).
// ---------------------------------------------------------------------------

function mkTape(over = {}) {
  return {
    run_id: 'r',
    seed: 1,
    persona_id: 'test-persona',
    persona_latents: {},
    params_hash: 'h',
    engine_sha: 'dev',
    flags: {},
    skillId: 'ADD_SAME_DEN',
    steps: [],
    terminal: { kind: 'StepCap', step: 5 },
    ...over,
  };
}

function mkStep(over = {}) {
  return {
    decision: { kind: 'PracticeAtLevel', rationale: '' },
    observation: {
      correct: true,
      scaffold_level: 2,
      hint_max_rung: 0,
      latency: 3000,
      answer_value: [1, 2],
      surface_form: 'form_A',
    },
    gate: false,
    latent: 0.9,
    pknown: 0.9,
    ...over,
  };
}

// ---------------------------------------------------------------------------
// Fixture A: "score up / transfer flat" gaming pattern.
//
// Three tapes where mastery gates open (mastery_rate > 0), BUT every session
// only ever sees ONE surface_form — so falseTransfer fires on every gated tape.
// Meanwhile falsePositiveMastery does NOT fire (latent >= tau 0.8).
//
// Expected: transfer_per_mastery_gain = false_transfer_rate / false_mastery_rate
//           = 1.0 / epsilon (very large) because false_mastery_rate is near 0
//           but false_transfer_rate is 1.0.
// ---------------------------------------------------------------------------

// All steps with one surface form and latent >= tau — gate opens, transfer is
// structurally absent (single surface form), mastery is genuine.
const tapeGateSingleForm_1 = mkTape({
  run_id: 'gsfA1',
  persona_id: 'performance-oriented',
  steps: [
    mkStep({ observation: { correct: true, scaffold_level: 2, hint_max_rung: 0, latency: 3000, answer_value: [1, 2], surface_form: 'same_form' } }),
    mkStep({ observation: { correct: true, scaffold_level: 2, hint_max_rung: 0, latency: 3000, answer_value: [1, 2], surface_form: 'same_form' } }),
    mkStep({ gate: true, latent: 0.9, pknown: 0.9, observation: { correct: true, scaffold_level: 2, hint_max_rung: 0, latency: 3000, answer_value: [1, 2], surface_form: 'same_form' } }),
  ],
});

const tapeGateSingleForm_2 = mkTape({
  run_id: 'gsfA2',
  persona_id: 'performance-oriented',
  steps: [
    mkStep({ observation: { correct: true, scaffold_level: 2, hint_max_rung: 0, latency: 3000, answer_value: [1, 2], surface_form: 'same_form' } }),
    mkStep({ gate: true, latent: 0.85, pknown: 0.85, observation: { correct: true, scaffold_level: 2, hint_max_rung: 0, latency: 3000, answer_value: [1, 2], surface_form: 'same_form' } }),
  ],
});

// ---------------------------------------------------------------------------
// Fixture B: "hints up, independence down" gaming pattern.
//
// Tapes with heavy hint use (rung=3, correct=false) + gate opens below tau
// (false mastery). The independence_rate will be low, hints_given will be high.
//
// Expected: hint_independence_divergence = hints_given * (1 - independence_rate)
//           is large (many hints, low independence).
// ---------------------------------------------------------------------------

// Step with a top-rung hint on a wrong answer = hints_given increments.
function hintStep(over = {}) {
  return mkStep({
    observation: {
      correct: false,
      scaffold_level: 0,
      hint_max_rung: 3, // ANSWER_GIVEAWAY_RUNG
      latency: 5000,
      answer_value: [9, 9],
      surface_form: 'form_A',
    },
    gate: false,
    latent: 0.3,
    pknown: 0.3,
    ...over,
  });
}

// A tape with many hint steps + a false-mastery gate open (latent < tau).
const tapeHeavyHints = mkTape({
  run_id: 'hhB1',
  persona_id: 'over-hinter',
  steps: [
    hintStep(),
    hintStep(),
    hintStep(),
    mkStep({ gate: true, latent: 0.3, pknown: 0.3, observation: { correct: true, scaffold_level: 2, hint_max_rung: 0, latency: 3000, answer_value: [1, 2], surface_form: 'form_A' } }),
  ],
});

// A clean tape with NO hints — baseline for comparison.
const tapeNoHints = mkTape({
  run_id: 'nhB2',
  persona_id: 'slow-but-steady',
  steps: [
    mkStep({ latent: 0.9 }),
    mkStep({ gate: true, latent: 0.9 }),
  ],
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('T18 — joint metrics are present on every MetricsRecord', () => {
  it('aggregate result always carries transfer_per_mastery_gain', () => {
    const rec = aggregate([tapeNoHints]);
    expect(rec).toHaveProperty('transfer_per_mastery_gain');
    expect(typeof rec.transfer_per_mastery_gain).toBe('number');
    expect(Number.isFinite(rec.transfer_per_mastery_gain)).toBe(true);
  });

  it('aggregate result always carries hint_independence_divergence', () => {
    const rec = aggregate([tapeNoHints]);
    expect(rec).toHaveProperty('hint_independence_divergence');
    expect(typeof rec.hint_independence_divergence).toBe('number');
    expect(Number.isFinite(rec.hint_independence_divergence)).toBe(true);
  });

  it('joint metrics appear in per_persona_class breakdowns too', () => {
    const rec = aggregate([tapeNoHints, tapeHeavyHints]);
    for (const className of Object.keys(rec.per_persona_class)) {
      const cls = rec.per_persona_class[className];
      expect(cls).toHaveProperty('transfer_per_mastery_gain');
      expect(cls).toHaveProperty('hint_independence_divergence');
    }
  });

  it('toJSON includes joint metrics (they survive serialization)', () => {
    const rec = aggregate([tapeNoHints]);
    const json = rec.toJSON();
    expect(json).toHaveProperty('transfer_per_mastery_gain');
    expect(json).toHaveProperty('hint_independence_divergence');
  });
});

describe('T18 — transfer_per_mastery_gain detects "score up / transfer flat" gaming', () => {
  it('single-surface-form population: false_transfer_rate=1, false_mastery_rate~0 => high ratio', () => {
    // Both tapes: gate opens (latent >= tau => NOT false mastery), but only one
    // surface_form => falseTransfer fires on both.
    // false_mastery_rate = 0/2 = 0 (capped by epsilon)
    // false_transfer_rate = 2/2 = 1.0
    // transfer_per_mastery_gain = 1.0 / epsilon => very large
    const rec = aggregate([tapeGateSingleForm_1, tapeGateSingleForm_2]);
    expect(rec.false_mastery_rate).toBe(0);
    expect(rec.false_transfer_rate).toBe(1.0);
    // ratio = 1.0 / 1e-6 = 1,000,000
    expect(rec.transfer_per_mastery_gain).toBeCloseTo(1.0 / 1e-6, 0);
    expect(rec.transfer_per_mastery_gain).toBeGreaterThan(1000);
  });

  it('clean population (both signals zero): ratio stays at 0/epsilon = 0', () => {
    // tape with surface variation + latent >= tau: neither signal fires.
    const cleanTape = mkTape({
      run_id: 'clean',
      persona_id: 'fast-mastery',
      steps: [
        mkStep({ observation: { correct: true, scaffold_level: 2, hint_max_rung: 0, latency: 3000, answer_value: [1, 2], surface_form: 'form_A' } }),
        mkStep({ gate: true, latent: 0.9, pknown: 0.9, observation: { correct: true, scaffold_level: 2, hint_max_rung: 0, latency: 3000, answer_value: [1, 2], surface_form: 'form_B' } }),
      ],
    });
    const rec = aggregate([cleanTape]);
    expect(rec.false_mastery_rate).toBe(0);
    expect(rec.false_transfer_rate).toBe(0);
    // 0 / epsilon = 0
    expect(rec.transfer_per_mastery_gain).toBe(0);
  });

  it('when false_mastery_rate > 0 and false_transfer_rate = same, ratio ~= 1.0', () => {
    // A tape where both signals fire: latent < tau AND single surface form.
    const bothFalseTape = mkTape({
      run_id: 'both',
      persona_id: 'spoofer',
      steps: [
        mkStep({ observation: { correct: true, scaffold_level: 2, hint_max_rung: 0, latency: 3000, answer_value: [1, 2], surface_form: 'same_form' } }),
        mkStep({ gate: true, latent: 0.3, pknown: 0.3, observation: { correct: true, scaffold_level: 2, hint_max_rung: 0, latency: 3000, answer_value: [1, 2], surface_form: 'same_form' } }),
      ],
    });
    const rec = aggregate([bothFalseTape]);
    expect(rec.false_mastery_rate).toBe(1.0);
    expect(rec.false_transfer_rate).toBe(1.0);
    // 1.0 / max(1.0, 1e-6) = 1.0
    expect(rec.transfer_per_mastery_gain).toBeCloseTo(1.0, 10);
  });

  it('gaming pattern: "score up / transfer flat" tape produces high transfer_per_mastery_gain divergence', () => {
    // Scenario: performance-oriented persona whose mastery rate is high (many gates
    // open), but every session locks onto the same surface_form, so false_transfer_rate
    // is also high — but false_mastery_rate is near 0 (latent >= tau).
    // This is the "score up / transfer flat" pattern the spec calls out.
    const rec = aggregate([tapeGateSingleForm_1, tapeGateSingleForm_2]);
    // The ratio must be >> 1: transfer diverges far above mastery signal.
    expect(rec.transfer_per_mastery_gain).toBeGreaterThan(100);
  });
});

describe('T18 — hint_independence_divergence detects "hints up, independence down" gaming', () => {
  it('heavy hint tape: hints_given high, independence_rate low => large divergence', () => {
    // tapeHeavyHints: 3 hint steps (hints_given=3) + false mastery gate (independence low).
    const rec = aggregate([tapeHeavyHints]);
    expect(rec.hints_given).toBe(3);
    // independence_rate counts gated AND NOT falsePositiveMastery / n_tapes.
    // The gate opened below tau => falsePositiveMastery, so independence_rate = 0.
    expect(rec.independence_rate).toBe(0);
    // 3 * (1 - 0) = 3
    expect(rec.hint_independence_divergence).toBeCloseTo(3, 10);
  });

  it('no-hint tape: hints_given=0 => divergence=0 regardless of independence_rate', () => {
    const rec = aggregate([tapeNoHints]);
    expect(rec.hints_given).toBe(0);
    expect(rec.hint_independence_divergence).toBe(0);
  });

  it('hints given but high independence: divergence low (hints not gaming independence)', () => {
    // A tape with hint steps, but the gate that fires has latent >= tau (genuine mastery).
    // hints_given=1, independence_rate = 1/1 = 1 => divergence = 1 * (1-1) = 0.
    const hintButGenuineTape = mkTape({
      run_id: 'hbg',
      persona_id: 'honest-hinter',
      steps: [
        // top-rung hint on wrong answer — counts as hints_given
        hintStep(),
        // genuine mastery gate (latent >= tau => does NOT reduce independence)
        mkStep({ gate: true, latent: 0.9, pknown: 0.9 }),
      ],
    });
    const rec = aggregate([hintButGenuineTape]);
    expect(rec.hints_given).toBe(1);
    // gated AND not falsePositiveMastery = 1, n=1 => independence_rate = 1.0
    expect(rec.independence_rate).toBe(1.0);
    // 1 * (1 - 1) = 0
    expect(rec.hint_independence_divergence).toBe(0);
  });

  it('mixed population: divergence reflects the blend of heavy and clean sessions', () => {
    // tapeHeavyHints: hints_given=3, gate below tau => independence_rate contribution: 0
    // tapeNoHints: hints_given=0, gate above tau => independence_rate contribution: 1/2
    // Population: hints_given=3, n=2, gated-genuine=1, independence_rate=0.5
    // divergence = 3 * (1 - 0.5) = 1.5
    const rec = aggregate([tapeHeavyHints, tapeNoHints]);
    expect(rec.hints_given).toBe(3);
    expect(rec.independence_rate).toBeCloseTo(0.5, 10);
    expect(rec.hint_independence_divergence).toBeCloseTo(1.5, 10);
  });
});
