// T16 -- performance-oriented persona: gate-gaming without understanding.
//
// Asserts that the performance-oriented persona is:
//   (1) Wired into the library (present in allPersonas, retrievable by id).
//   (2) Distinct from fast-shallow-guesser: latency stays above the engine's
//       too-fast-correct floor (800ms) -- no implausibly-fast corrects.
//   (3) Distinct from over-hinter: hint appetite is low (near-zero hints).
//   (4) Produces low transfer (falseTransfer oracle signal): when a tape for
//       this persona is constructed with a single surface form and a gate-open
//       step, the oracle's falseTransfer fires independently of whether
//       falsePositiveMastery also fires. This mirrors the T13 test pattern:
//       the oracle contract is verified in isolation, not via runner coincidence.
//       (The engine always presents >=2 surface forms per skill in a live session,
//       so the synthetic tape is the correct test vehicle for the transfer claim.)
//   (5) Low learnRate: true skill barely rises across a full session.
//
// All latency/oracle claims are verified from a fixed seed for reproducibility.
import { describe, it, expect } from 'vitest';
import { personaById, allPersonas } from '../../src/harness/personas/library.js';
import { runSession } from '../../src/harness/sessionRunner.js';
import { labelTape } from '../../src/harness/oracle/latentTruth.js';

const SEED = 42;
const SKILL = 'ADD_SAME_DEN';
const STEP_CAP = 40;

function runPerf() {
  return runSession({
    persona: personaById('performance-oriented'),
    skillId: SKILL,
    seed: SEED,
    stepCap: STEP_CAP,
  });
}

// ---------------------------------------------------------------------------
// Helper: synthetic tape for the falseTransfer oracle test.
// Mirrors the T13 test-pattern: single surface form ('proper'), gate opens
// at gateStep, latentValue controls the falsePositiveMastery axis.
// ---------------------------------------------------------------------------
function mkPerfTape(latentValue, gateStep) {
  const steps = [];
  for (let i = 0; i < 5; i++) {
    steps.push({
      decision: { kind: 'PracticeAtLevel', rationale: '' },
      observation: {
        correct: true,
        scaffold_level: 2,
        hint_max_rung: 0,
        latency: 2000,
        answer_value: [1, 2],
        surface_form: 'proper',  // single form -- no structural breadth
      },
      gate: i === gateStep,
      latent: latentValue,
      pknown: latentValue,
    });
  }
  return {
    run_id: 'synth-perf',
    seed: 42,
    persona_id: 'performance-oriented',
    persona_latents: {},
    params_hash: 'h',
    engine_sha: 'dev',
    flags: {},
    skillId: SKILL,
    steps,
    terminal: { kind: 'StepCap', step: 5 },
  };
}

describe('performance-oriented persona -- wired into library', () => {
  it('is present in allPersonas()', () => {
    const ids = allPersonas().map((p) => p.id);
    expect(ids).toContain('performance-oriented');
  });

  it('personaById returns a valid persona with correct metadata', () => {
    const p = personaById('performance-oriented');
    expect(p).not.toBeNull();
    expect(p.id).toBe('performance-oriented');
    expect(p.klass).toBe('performance-oriented-nonbkt');
    // Moderate starting competence (spec: ~0.5)
    expect(p.latent.truePknownDefault).toBeGreaterThanOrEqual(0.4);
    expect(p.latent.truePknownDefault).toBeLessThanOrEqual(0.65);
    // Very low learn rate (spec: ~0.01 -- does not actually learn)
    expect(p.latent.learnRate).toBeLessThanOrEqual(0.03);
    // Low hint appetite (distinct from over-hinter)
    expect(p.latent.hintAppetite).toBeLessThanOrEqual(0.05);
    // meta.approximates must reference the PDF archetype
    expect(p.meta.approximates).toMatch(/performance.?oriented|optimiz|finishing/i);
  });
});

describe('performance-oriented persona -- distinct from fast-shallow-guesser', () => {
  // fast-shallow-guesser: latency base=300ms, spread=500ms -- dips UNDER 800ms floor.
  // performance-oriented: latency base=1800ms, spread=1200ms -- stays above 800ms.

  it('latency base is above the engine too-fast floor (800ms)', () => {
    const p = personaById('performance-oriented');
    expect(p.latent.latency.base).toBeGreaterThan(800);
  });

  it('emitted latencies are NOT implausibly fast -- all above 800ms floor', () => {
    const tape = runPerf();
    expect(tape.steps.length).toBeGreaterThan(0);
    const latencies = tape.steps
      .map((s) => s.observation && s.observation.latency)
      .filter(Number.isFinite);
    expect(latencies.length).toBeGreaterThan(0);
    const tooFast = latencies.filter((lat) => lat < 800);
    expect(tooFast.length).toBe(0);
  });

  it('no too_fast_correct flags in the tape (unlike fast-shallow-guesser)', () => {
    const tape = runPerf();
    const tooFastCorrects = tape.steps.filter(
      (s) => s.observation && s.observation.too_fast_correct === true
    );
    expect(tooFastCorrects.length).toBe(0);
  });

  it('latency base is substantially higher than fast-shallow-guesser (not implausibly fast)', () => {
    const perf = personaById('performance-oriented');
    const guesser = personaById('fast-shallow-guesser');
    // perf base is 1800ms; guesser base is 300ms -- perf is >3x higher.
    expect(perf.latent.latency.base).toBeGreaterThan(guesser.latent.latency.base * 3);
  });
});

describe('performance-oriented persona -- distinct from over-hinter', () => {
  it('produces very few or no hints across the session (low hintAppetite)', () => {
    const tape = runPerf();
    expect(tape.steps.length).toBeGreaterThan(0);
    const totalHints = tape.steps.reduce((sum, s) => {
      const rung = s.observation ? (s.observation.hint_max_rung || 0) : 0;
      return sum + rung;
    }, 0);
    // over-hinter: hintAppetite=0.6, typically many hints per session.
    // performance-oriented: hintAppetite~0.02, expected total <<10 across 40 steps.
    expect(totalHints).toBeLessThan(10);
  });

  it('hint count is substantially lower than over-hinter', () => {
    const perfTape = runPerf();
    const hinterTape = runSession({
      persona: personaById('over-hinter'),
      skillId: SKILL,
      seed: SEED,
      stepCap: STEP_CAP,
    });
    const perfHints = perfTape.steps.reduce(
      (s, step) => s + (step.observation ? (step.observation.hint_max_rung || 0) : 0),
      0
    );
    const hinterHints = hinterTape.steps.reduce(
      (s, step) => s + (step.observation ? (step.observation.hint_max_rung || 0) : 0),
      0
    );
    expect(hinterHints).toBeGreaterThan(perfHints);
  });

  it('hintAppetite is substantially lower than over-hinter', () => {
    const perf = personaById('performance-oriented');
    const hinter = personaById('over-hinter');
    // perf ~0.02 vs hinter 0.6 -- perf is <10% of hinter
    expect(perf.latent.hintAppetite).toBeLessThan(hinter.latent.hintAppetite * 0.1);
  });
});

describe('performance-oriented persona -- low transfer (falseTransfer oracle signal)', () => {
  // The engine always presents >=2 surface forms per skill in a live runSession, so
  // hasNoSurfaceVariation() never fires in a standard sweep.  The oracle contract
  // (T13) is therefore tested via synthetic tapes -- exactly as T13 does -- to prove
  // that when this persona's gate opens with structural breadth absent, falseTransfer
  // fires INDEPENDENTLY of falsePositiveMastery.
  //
  // This mirrors the conceptual model: a performance-oriented child never seeks out
  // varied surface forms; if they only encountered one in the wild, the oracle would
  // correctly flag absent transfer.

  it('synthetic tape (latent < tau=0.8): single-form gate-open => falseTransfer=true AND falsePositiveMastery=true', () => {
    const tape = mkPerfTape(0.5, 4);
    const label = labelTape(tape, { tauLatent: 0.8 });
    expect(label.labels.falseTransfer).toBe(true);
    expect(label.labels.falsePositiveMastery).toBe(true);
    expect(label.labels.evidence.falseTransfer.length).toBeGreaterThan(0);
    expect(label.labels.evidence.falseTransfer[0].noSurfaceVariation).toBe(true);
  });

  it('synthetic tape (latent >= tau=0.8): single-form gate-open => falseTransfer=true, falsePositiveMastery=false', () => {
    // INDEPENDENCE: falseTransfer fires even when mastery is genuine.
    // A performance-oriented child may truly know the material yet still never have
    // faced structural variety -- the oracle catches the structural gap independently.
    const tape = mkPerfTape(0.85, 4);
    const label = labelTape(tape, { tauLatent: 0.8 });
    expect(label.labels.falseTransfer).toBe(true);
    expect(label.labels.falsePositiveMastery).toBe(false);
    expect(label.labels.evidence.falseTransfer.length).toBeGreaterThan(0);
    expect(label.labels.evidence.falseTransfer[0].noSurfaceVariation).toBe(true);
  });

  it('persona latent has very low learnRate confirming no genuine learning accrual', () => {
    const p = personaById('performance-oriented');
    // Near-zero learnRate: the child does not accumulate real skill across the session.
    expect(p.latent.learnRate).toBeLessThanOrEqual(0.02);
  });
});

describe('performance-oriented persona -- low learnRate (does not truly learn)', () => {
  it('true P(known) barely rises across a full session', () => {
    const p = personaById('performance-oriented');
    const tape = runSession({
      persona: p,
      skillId: SKILL,
      seed: SEED,
      stepCap: STEP_CAP,
    });
    const initialPknown = 0.5;
    const finalLatents = tape.steps
      .map((s) => s.latent)
      .filter((x) => typeof x === 'number');
    if (finalLatents.length === 0) return;
    const finalLatent = finalLatents[finalLatents.length - 1];
    // With learnRate=0.01 and 40 steps, net rise must be well below 0.35.
    expect(finalLatent - initialPknown).toBeLessThan(0.35);
  });
});