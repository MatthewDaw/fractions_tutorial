// T13 — falseTransfer independence test.
//
// Proves that falseTransfer and falsePositiveMastery are INDEPENDENT oracle
// signals after the T13 fix.  The fix keys falseTransfer on structural
// surface_form variation, NOT on latent < tau.
//
// Four canonical tapes:
//
//   A - falsely-mastered WITH real transfer variation:
//       gate opened while latent < tau, BUT two distinct surface_forms seen.
//       -> falsePositiveMastery = true, falseTransfer = false
//
//   B - falsely-mastered with NO surface variation:
//       gate opened while latent < tau, only one surface_form seen.
//       -> falsePositiveMastery = true, falseTransfer = true
//
//   C - genuinely mastered with NO surface variation:
//       gate opened while latent >= tau, only one surface_form seen.
//       -> falsePositiveMastery = false, falseTransfer = true
//
//   D - genuinely mastered WITH real transfer variation:
//       gate opened while latent >= tau, two distinct surface_forms seen.
//       -> falsePositiveMastery = false, falseTransfer = false  (clean)
import { describe, it, expect } from 'vitest';
import { labelTape } from '../../src/harness/oracle/latentTruth.js';

function mkTape(over = {}) {
  return {
    run_id: 'r',
    seed: 42,
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

function mkStep(surfaceForm, latent, gate) {
  return {
    decision: { kind: 'PracticeAtLevel', rationale: '' },
    observation: {
      correct: true,
      scaffold_level: 2,
      hint_max_rung: 0,
      latency: 3000,
      answer_value: [1, 2],
      surface_form: surfaceForm,
    },
    gate: gate === true,
    latent,
    pknown: latent,
  };
}

// Tape A: false mastery (latent < tau) WITH surface variation.
const tapeA = mkTape({
  run_id: 'A',
  steps: [
    mkStep('form_A', 0.5, false),
    mkStep('form_B', 0.5, false),
    mkStep('form_A', 0.5, true),
  ],
});

// Tape B: false mastery (latent < tau) with NO surface variation.
const tapeB = mkTape({
  run_id: 'B',
  steps: [
    mkStep('form_A', 0.5, false),
    mkStep('form_A', 0.5, false),
    mkStep('form_A', 0.5, true),
  ],
});

// Tape C: genuine mastery (latent >= tau) with NO surface variation.
const tapeC = mkTape({
  run_id: 'C',
  steps: [
    mkStep('form_A', 0.9, false),
    mkStep('form_A', 0.9, false),
    mkStep('form_A', 0.9, true),
  ],
});

// Tape D: genuine mastery (latent >= tau) WITH surface variation (clean tape).
const tapeD = mkTape({
  run_id: 'D',
  steps: [
    mkStep('form_A', 0.9, false),
    mkStep('form_B', 0.9, false),
    mkStep('form_A', 0.9, true),
  ],
});

describe('T13 - falseTransfer is independent of falsePositiveMastery', () => {
  it('tape A: falsely-mastered WITH surface variation => falsePositiveMastery=true, falseTransfer=false', () => {
    const label = labelTape(tapeA, { tauLatent: 0.8 });
    expect(label.labels.falsePositiveMastery).toBe(true);
    expect(label.labels.falseTransfer).toBe(false);
    expect(label.labels.evidence.falsePositiveMastery.length).toBeGreaterThan(0);
    expect(label.labels.evidence.falseTransfer.length).toBe(0);
  });

  it('tape B: falsely-mastered with NO surface variation => both true', () => {
    const label = labelTape(tapeB, { tauLatent: 0.8 });
    expect(label.labels.falsePositiveMastery).toBe(true);
    expect(label.labels.falseTransfer).toBe(true);
    expect(label.labels.evidence.falseTransfer.length).toBeGreaterThan(0);
    expect(label.labels.evidence.falseTransfer[0].noSurfaceVariation).toBe(true);
  });

  it('tape C: genuinely mastered with NO surface variation => falsePositiveMastery=false, falseTransfer=true', () => {
    const label = labelTape(tapeC, { tauLatent: 0.8 });
    expect(label.labels.falsePositiveMastery).toBe(false);
    expect(label.labels.falseTransfer).toBe(true);
    expect(label.labels.evidence.falsePositiveMastery.length).toBe(0);
    expect(label.labels.evidence.falseTransfer.length).toBeGreaterThan(0);
  });

  it('tape D: genuinely mastered WITH surface variation => both false (clean tape)', () => {
    const label = labelTape(tapeD, { tauLatent: 0.8 });
    expect(label.labels.falsePositiveMastery).toBe(false);
    expect(label.labels.falseTransfer).toBe(false);
  });

  it('falseTransfer requires a gate to have opened (never-gating tape => false)', () => {
    const noGateTape = mkTape({
      run_id: 'E',
      steps: [
        mkStep('form_A', 0.5, false),
        mkStep('form_A', 0.5, false),
      ],
    });
    const label = labelTape(noGateTape, { tauLatent: 0.8 });
    expect(label.labels.falseTransfer).toBe(false);
  });

  it('falseTransfer is false when surface_form absent on all steps (no data = no claim)', () => {
    const noFormTape = mkTape({
      run_id: 'F',
      steps: [
        {
          decision: { kind: 'PracticeAtLevel', rationale: '' },
          observation: { correct: true, scaffold_level: 2, hint_max_rung: 0, latency: 3000, answer_value: [1, 2] },
          gate: true,
          latent: 0.5,
          pknown: 0.5,
        },
      ],
    });
    const label = labelTape(noFormTape, { tauLatent: 0.8 });
    expect(label.labels.falseTransfer).toBe(false);
  });

  it('all four (falsePositiveMastery, falseTransfer) combinations are reachable — proves independence', () => {
    const labelA = labelTape(tapeA, { tauLatent: 0.8 }).labels;
    const labelB = labelTape(tapeB, { tauLatent: 0.8 }).labels;
    const labelC = labelTape(tapeC, { tauLatent: 0.8 }).labels;
    const labelD = labelTape(tapeD, { tauLatent: 0.8 }).labels;

    const pairs = new Set([
      labelA.falsePositiveMastery + ',' + labelA.falseTransfer,
      labelB.falsePositiveMastery + ',' + labelB.falseTransfer,
      labelC.falsePositiveMastery + ',' + labelC.falseTransfer,
      labelD.falsePositiveMastery + ',' + labelD.falseTransfer,
    ]);

    expect(pairs.has('true,false')).toBe(true);
    expect(pairs.has('true,true')).toBe(true);
    expect(pairs.has('false,true')).toBe(true);
    expect(pairs.has('false,false')).toBe(true);
    expect(pairs.size).toBe(4);
  });
});
