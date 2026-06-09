// T17 — tau-sensitivity curve test.
//
// Verifies that buildTauSensitivityCurve produces a >=5-point curve for
// false_mastery_rate and missed_escalation_rate, and that both rates are
// non-decreasing as tau rises (the expected monotonicity direction:
// higher tau = stricter bar = more tapes labelled as false mastery).
//
// Also verifies renderTauSensitivityMarkdown produces a table and that
// buildBaselineReport now includes a tauCurve field with the swept points.

import { describe, it, expect } from 'vitest';
import {
  buildTauSensitivityCurve,
  renderTauSensitivityMarkdown,
  buildBaselineReport,
  TAU_SWEEP,
} from '../../src/harness/report.js';

// ---------------------------------------------------------------------------
// Minimal synthetic tape helpers.
// ---------------------------------------------------------------------------

function mkTape(over = {}) {
  return {
    run_id: 'r',
    seed: 1,
    persona_id: 'test-persona',
    persona_latents: { pGuess: 0.1 },
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
    decision: { kind: 'PresentProblem', rationale: '' },
    observation: {
      correct: true,
      scaffold_level: 2,
      hint_max_rung: 0,
      latency: 3000,
      answer_value: [1, 2],
      surface_form: 'form_A',
    },
    gate: false,
    latent: 0.5,
    pknown: 0.5,
    ...over,
  };
}

// A mixed population designed to make false_mastery_rate strictly increase
// between tau=0.75 and tau=0.80 (tape1 has latent=0.75 at gate-open:
//   0.75 < 0.75 is false => NOT false mastery at tau=0.75
//   0.75 < 0.80 is true  => IS false mastery at tau=0.80).
function buildMixedPopulation() {
  // Tape 1: gate opens at latent=0.75 — false mastery at tau>=0.80 only
  const tape1 = mkTape({
    run_id: 'r-fm-075',
    steps: [
      mkStep({
        gate: true,
        latent: 0.75,
        pknown: 0.97,
        observation: {
          correct: true,
          scaffold_level: 3,
          hint_max_rung: 0,
          latency: 300,
          answer_value: [1, 2],
          surface_form: 'form_A',
        },
      }),
    ],
    terminal: { kind: 'ReturnToKitchen', step: 1 },
  });

  // Tape 2: gate opens at latent=0.60 — false mastery at ALL tau values
  const tape2 = mkTape({
    run_id: 'r-fm-060',
    steps: [
      mkStep({
        gate: true,
        latent: 0.60,
        pknown: 0.97,
        observation: {
          correct: true,
          scaffold_level: 3,
          hint_max_rung: 0,
          latency: 300,
          answer_value: [1, 2],
          surface_form: 'form_A',
        },
      }),
    ],
    terminal: { kind: 'ReturnToKitchen', step: 1 },
  });

  // Tape 3: gate opens at latent=0.95 (competent) — not false mastery at any tau <= 0.90
  const tape3 = mkTape({
    run_id: 'r-clean',
    steps: [
      mkStep({
        gate: true,
        latent: 0.95,
        pknown: 0.97,
        observation: {
          correct: true,
          scaffold_level: 3,
          hint_max_rung: 0,
          latency: 3000,
          answer_value: [1, 2],
          surface_form: 'form_A',
        },
      }),
    ],
    terminal: { kind: 'ReturnToKitchen', step: 1 },
  });

  // Tape 4: stuck tape — helps missed_escalation fire at appropriate tau
  const stuckSteps = [];
  for (let i = 0; i < 8; i++) {
    stuckSteps.push(
      mkStep({
        decision: { kind: 'RaiseScaffold', rationale: 'stuck' },
        observation: {
          correct: false,
          scaffold_level: 0,
          hint_max_rung: 3,
          latency: 5000,
          answer_value: null,
          surface_form: 'form_A',
        },
        gate: false,
        latent: 0.3,
        pknown: 0.35,
      })
    );
  }
  const tape4 = mkTape({
    run_id: 'r-stuck',
    steps: stuckSteps,
    terminal: { kind: 'StepCap', step: 8 },
  });

  return [tape1, tape2, tape3, tape4];
}

const TAPES = buildMixedPopulation();

// ---------------------------------------------------------------------------
// TAU_SWEEP constant
// ---------------------------------------------------------------------------

describe('TAU_SWEEP constant', () => {
  it('has exactly 5 points covering 0.70...0.90', () => {
    expect(TAU_SWEEP).toHaveLength(5);
    expect(TAU_SWEEP[0]).toBe(0.70);
    expect(TAU_SWEEP[4]).toBe(0.90);
    for (const t of [0.70, 0.75, 0.80, 0.85, 0.90]) {
      expect(TAU_SWEEP).toContain(t);
    }
  });

  it('is sorted ascending', () => {
    for (let i = 1; i < TAU_SWEEP.length; i++) {
      expect(TAU_SWEEP[i]).toBeGreaterThan(TAU_SWEEP[i - 1]);
    }
  });
});

// ---------------------------------------------------------------------------
// buildTauSensitivityCurve — shape
// ---------------------------------------------------------------------------

describe('buildTauSensitivityCurve — shape', () => {
  it('returns exactly TAU_SWEEP.length rows by default', () => {
    const curve = buildTauSensitivityCurve(TAPES);
    expect(curve).toHaveLength(TAU_SWEEP.length);
    expect(curve.length).toBeGreaterThanOrEqual(5);
  });

  it('each row has tau, false_mastery_rate, and missed_escalation_rate', () => {
    const curve = buildTauSensitivityCurve(TAPES);
    for (const row of curve) {
      expect(typeof row.tau).toBe('number');
      expect(typeof row.false_mastery_rate).toBe('number');
      expect(typeof row.missed_escalation_rate).toBe('number');
      expect(row.false_mastery_rate).toBeGreaterThanOrEqual(0);
      expect(row.false_mastery_rate).toBeLessThanOrEqual(1);
      expect(row.missed_escalation_rate).toBeGreaterThanOrEqual(0);
      expect(row.missed_escalation_rate).toBeLessThanOrEqual(1);
    }
  });

  it('row tau values match the TAU_SWEEP points', () => {
    const curve = buildTauSensitivityCurve(TAPES);
    for (let i = 0; i < TAU_SWEEP.length; i++) {
      expect(curve[i].tau).toBe(TAU_SWEEP[i]);
    }
  });

  it('accepts a custom tauSweep', () => {
    const custom = [0.6, 0.8, 1.0];
    const curve = buildTauSensitivityCurve(TAPES, { tauSweep: custom });
    expect(curve).toHaveLength(3);
    expect(curve[0].tau).toBe(0.6);
    expect(curve[1].tau).toBe(0.8);
    expect(curve[2].tau).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// buildTauSensitivityCurve — monotonicity
// ---------------------------------------------------------------------------

describe('buildTauSensitivityCurve — monotonicity', () => {
  it('false_mastery_rate is non-decreasing as tau rises', () => {
    const curve = buildTauSensitivityCurve(TAPES);
    for (let i = 1; i < curve.length; i++) {
      // allow tiny floating-point noise
      expect(curve[i].false_mastery_rate).toBeGreaterThanOrEqual(
        curve[i - 1].false_mastery_rate - 1e-9
      );
    }
  });

  it('false_mastery_rate strictly increases between tau=0.75 and tau=0.80', () => {
    // tape1 has latent=0.75 at gate-open.
    // At tau=0.75: the oracle check is latent < tau => 0.75 < 0.75 => false (NOT below tau).
    // At tau=0.80: the oracle check is latent < tau => 0.75 < 0.80 => true (IS below tau).
    // So the rate must rise between these two tau values.
    const curve = buildTauSensitivityCurve(TAPES);
    const at075 = curve.find((r) => r.tau === 0.75);
    const at080 = curve.find((r) => r.tau === 0.80);
    expect(at080.false_mastery_rate).toBeGreaterThan(at075.false_mastery_rate);
  });

  it('missed_escalation_rate is non-decreasing as tau rises', () => {
    const curve = buildTauSensitivityCurve(TAPES);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].missed_escalation_rate).toBeGreaterThanOrEqual(
        curve[i - 1].missed_escalation_rate - 1e-9
      );
    }
  });

  it('is byte-stable (deterministic) across two calls', () => {
    const a = buildTauSensitivityCurve(TAPES);
    const b = buildTauSensitivityCurve(TAPES);
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
  });
});

// ---------------------------------------------------------------------------
// renderTauSensitivityMarkdown — markdown output
// ---------------------------------------------------------------------------

describe('renderTauSensitivityMarkdown — markdown output', () => {
  it('produces a heading and a table with the required columns', () => {
    const curve = buildTauSensitivityCurve(TAPES);
    const md = renderTauSensitivityMarkdown(curve);
    expect(md).toMatch(/sensitivity/i);
    expect(md).toMatch(/false_mastery_rate/);
    expect(md).toMatch(/missed_escalation_rate/);
    // markdown table pipe characters present
    expect(md).toContain('|');
  });

  it('has one data row per sweep point', () => {
    const curve = buildTauSensitivityCurve(TAPES);
    const md = renderTauSensitivityMarkdown(curve);
    for (const t of TAU_SWEEP) {
      expect(md).toContain(t.toFixed(2));
    }
  });

  it('mentions the oracle mandate against single-point estimates', () => {
    const md = renderTauSensitivityMarkdown(buildTauSensitivityCurve(TAPES));
    expect(md).toMatch(/review A6|never a single point|curve/i);
  });
});

// ---------------------------------------------------------------------------
// buildBaselineReport — integration: tauCurve field
// ---------------------------------------------------------------------------

describe('buildBaselineReport — includes tauCurve', () => {
  it('report has a tauCurve field with TAU_SWEEP.length rows', () => {
    const report = buildBaselineReport(TAPES);
    expect(report).toHaveProperty('tauCurve');
    expect(Array.isArray(report.tauCurve)).toBe(true);
    expect(report.tauCurve).toHaveLength(TAU_SWEEP.length);
  });

  it('tauCurve rows have the expected shape', () => {
    const report = buildBaselineReport(TAPES);
    for (const row of report.tauCurve) {
      expect(typeof row.tau).toBe('number');
      expect(typeof row.false_mastery_rate).toBe('number');
      expect(typeof row.missed_escalation_rate).toBe('number');
    }
  });

  it('tauCurve covers all required tau points', () => {
    const report = buildBaselineReport(TAPES);
    const taus = report.tauCurve.map((r) => r.tau);
    for (const t of TAU_SWEEP) {
      expect(taus).toContain(t);
    }
  });
});
