// T15 — bored-high-skill persona: boredom-drift signature test.
//
// Asserts the two NON-BKT boredom signals that distinguish this persona from
// fast-mastery (which just succeeds) and off-task (which fully refuses):
//   (1) Rising latency across the session (boredom drift).
//   (2) Occasional intentional errors despite high latent skill (at step >= 10).
//
// Both claims are verified from a fixed seed for reproducibility.
import { describe, it, expect } from 'vitest';
import { personaById, allPersonas } from '../../src/harness/personas/library.js';
import { runSession } from '../../src/harness/sessionRunner.js';

describe('bored-high-skill persona — wired into library', () => {
  it('is present in allPersonas()', () => {
    const ids = allPersonas().map((p) => p.id);
    expect(ids).toContain('bored-high-skill');
  });

  it('personaById returns a valid persona with correct metadata', () => {
    const p = personaById('bored-high-skill');
    expect(p).not.toBeNull();
    expect(p.id).toBe('bored-high-skill');
    expect(p.klass).toBe('bored-high-skill-nonbkt');
    // High starting competence (spec: ~0.85)
    expect(p.latent.truePknownDefault).toBeGreaterThanOrEqual(0.8);
    // Low learn rate (spec: ~0.02 — already knows it)
    expect(p.latent.learnRate).toBeLessThanOrEqual(0.05);
    // meta.approximates must reference the PDF archetype
    expect(p.meta.approximates).toMatch(/bored.*high.?skill|high.?skill.*bored/i);
  });
});

describe('bored-high-skill persona — boredom-drift signature', () => {
  // Use a fixed seed for reproducibility — every claim is seed-deterministic.
  const SEED = 42;
  const SKILL = 'ADD_SAME_DEN';
  const STEP_CAP = 40;

  function runBored() {
    return runSession({
      persona: personaById('bored-high-skill'),
      skillId: SKILL,
      seed: SEED,
      stepCap: STEP_CAP,
    });
  }

  it('latency RISES across the session (late-session latency substantially exceeds early-session)', () => {
    const tape = runBored();
    expect(tape.steps.length).toBeGreaterThan(10);

    // observation.latency holds the latency value the engine read off the burst.
    const early5 = tape.steps.slice(0, 5).map((s) => s.observation && s.observation.latency).filter(Number.isFinite);
    const late5  = tape.steps.slice(-5).map((s) => s.observation && s.observation.latency).filter(Number.isFinite);

    expect(early5.length).toBeGreaterThan(0);
    expect(late5.length).toBeGreaterThan(0);

    const median = (arr) => {
      const sorted = [...arr].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    };

    const earlyMedian = median(early5);
    const lateMedian  = median(late5);

    // Late-session latency must be substantially higher.
    // The boredom law adds 120ms/step boredom bonus + 180ms/step fatigue on top of
    // a 3000ms base. Over 35 steps that is well above 10000ms extra, so the
    // difference must clear 1000ms with any reasonable seed.
    expect(lateMedian).toBeGreaterThan(earlyMedian);
    expect(lateMedian - earlyMedian).toBeGreaterThan(1000);
  });

  it('produces intentional errors at late steps despite high latent competence', () => {
    const tape = runBored();
    expect(tape.steps.length).toBeGreaterThan(15);

    // Steps 10..end: boredom error probability is (min(step,20)/20)*0.25 which is
    // >=0.125 at step 10. At high truePknown=0.85 the natural wrong rate is ~0.135;
    // the boredom layer adds on top so there must be at least one incorrect in the
    // late half across a 40-step session.
    const lateErrors = tape.steps
      .slice(10)
      .filter((s) => s.observation && s.observation.correct === false);
    expect(lateErrors.length).toBeGreaterThan(0);
  });

  it('does NOT produce null answer_value steps (not off-task — child still submits answers)', () => {
    const tape = runBored();
    // off-task produces answer_value === null for every step.
    // bored-high-skill must have at least some non-null answers.
    const nonNull = tape.steps.filter((s) => s.observation && s.observation.answer_value !== null);
    expect(nonNull.length).toBeGreaterThan(0);

    // And must never emit NaN as the answer (the persona always returns a real fraction
    // or a planted wrong answer, never NaN/null).
    const nanSteps = tape.steps.filter(
      (s) =>
        s.observation &&
        s.observation.answer_value !== null &&
        (Number.isNaN(s.observation.answer_value[0]) || Number.isNaN(s.observation.answer_value[1]))
    );
    expect(nanSteps.length).toBe(0);
  });

  it('high-skill child achieves majority-correct answers overall (not a refuser)', () => {
    const tape = runBored();
    const corrects = tape.steps.filter((s) => s.observation && s.observation.correct).length;
    const total    = tape.steps.length;
    // Even with boredom errors the high pknown (0.85) must keep the overall correct
    // rate above 50%.
    expect(corrects / total).toBeGreaterThan(0.5);
  });

  it('is distinct from fast-mastery: bored persona has higher late-session latency', () => {
    const boredTape = runBored();
    const fastTape  = runSession({
      persona: personaById('fast-mastery'),
      skillId: SKILL,
      seed: SEED,
      stepCap: STEP_CAP,
    });

    const boredLate = boredTape.steps.slice(-5)
      .map((s) => s.observation && s.observation.latency)
      .filter(Number.isFinite);
    const fastLate  = fastTape.steps.slice(-5)
      .map((s) => s.observation && s.observation.latency)
      .filter(Number.isFinite);

    if (boredLate.length === 0 || fastLate.length === 0) return; // guard if tape short

    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

    // Bored persona's late-session average latency must exceed fast-mastery's.
    expect(avg(boredLate)).toBeGreaterThan(avg(fastLate));
  });
});
