// U3 — persona disjointness + behavioral invariants.
//
// (1) Disjointness LINT: NO file under src/harness/personas/ may contain the
//     substring 'engine/params'. If a persona imported PARAMS, its "true" learner
//     behavior would be parameter-coupled to the engine's inference params and the
//     harness would be a tautology, not a red-team.
// (2) memorizer masters its trained surface form; a different-form probe is wrong.
// (3) oscillator correctness flips on a period coprime with 3 (engine fadeStreakK).
// (4) off-task persona emits a null/malformed answer + idle signal, still well-formed.
// (5) train and held-out families share no ids and draw disjoint latents.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { allPersonas, personaById, _meta } from '../../src/harness/personas/library.js';
import { trainFamily, heldOutFamily } from '../../src/harness/personas/families.js';
import { generateFor, surfaceFormsFor } from '../../src/generators/index.js';
import { personaRng } from '../../src/harness/rng.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const PERSONA_DIR = join(HERE, '..', '..', 'src', 'harness', 'personas');

function ctx(persona, { skillId, level = 1, surfaceForm, step = 0 }) {
  return {
    skillId,
    level,
    surfaceForm,
    lastDecision: null,
    rng: personaRng(persona.id, 42, step),
    step,
  };
}

function wellFormedAttempt(a) {
  // answer is [num,den] OR null; everything else present with the right types.
  const answerOk = a.answer === null || (Array.isArray(a.answer) && a.answer.length === 2);
  return (
    answerOk &&
    typeof a.latencyMs === 'number' &&
    typeof a.hintRung === 'number' &&
    typeof a.selfCorrections === 'number' &&
    typeof a.modality === 'string' &&
    Array.isArray(a.signals)
  );
}

describe('(1) disjointness lint — no engine/params import under personas/', () => {
  it('no persona file contains the substring engine/params', () => {
    const files = readdirSync(PERSONA_DIR).filter((f) => f.endsWith('.js'));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const src = readFileSync(join(PERSONA_DIR, f), 'utf8');
      // Strip away the word in prose comments that legitimately mention it? No —
      // the rule is literal: the substring must not appear at all (the safest lint).
      expect(src.includes('engine/params'), `${f} must not reference engine/params`).toBe(false);
    }
  });
});

describe('(2) memorizer masters trained form, fails a different form', () => {
  it('trained surfaceForm passes, other surfaceForm fails', () => {
    const skill = 'ADD_SAME_DEN';
    const [formA, formB] = surfaceFormsFor(skill);
    const mem = personaById('memorizer');

    // Train on formA across several attempts (locks trainedSurface to formA).
    let trainedCorrect = 0;
    for (let i = 0; i < 8; i++) {
      const prob = generateFor(skill, { level: 1, index: i, surfaceForm: formA });
      const att = mem.emit(prob, ctx(mem, { skillId: skill, surfaceForm: formA, step: i }));
      const correct = answerCorrect(att.answer, prob);
      if (correct) trainedCorrect++;
    }
    // Now probe the OTHER form — should be (near-)deterministically wrong.
    let otherCorrect = 0;
    for (let i = 0; i < 8; i++) {
      const prob = generateFor(skill, { level: 1, index: 100 + i, surfaceForm: formB });
      const att = mem.emit(prob, ctx(mem, { skillId: skill, surfaceForm: formB, step: 8 + i }));
      if (answerCorrect(att.answer, prob)) otherCorrect++;
    }
    expect(trainedCorrect).toBeGreaterThan(otherCorrect);
    expect(otherCorrect).toBeLessThanOrEqual(1); // template does not transfer
  });
});

describe('(3) oscillator flips correctness on a period coprime with 3', () => {
  it('period is coprime with the engine fadeStreakK literal (3)', () => {
    expect(_meta.FADE_STREAK_K_LITERAL).toBe(3);
    expect(gcd(_meta.OSCILLATOR_PERIOD, 3)).toBe(1); // coprime
  });

  it('correctness is non-monotone across a full period (it forgets, not just learns)', () => {
    const osc = personaById('oscillator');
    const skill = 'ADD_SAME_DEN';
    const seq = [];
    for (let i = 0; i < _meta.OSCILLATOR_PERIOD * 2; i++) {
      const prob = generateFor(skill, { level: 1, index: i, surfaceForm: 'proper' });
      const att = osc.emit(prob, ctx(osc, { skillId: skill, surfaceForm: 'proper', step: i }));
      seq.push(answerCorrect(att.answer, prob));
    }
    // A BKT learner trends monotonically up; an oscillator must dip back down at
    // least once after a correct (a learned→forgot flip).
    let sawForget = false;
    for (let i = 1; i < seq.length; i++) {
      if (seq[i - 1] === true && seq[i] === false) sawForget = true;
    }
    expect(sawForget).toBe(true);
  });
});

describe('(4) off-task persona stays well-formed', () => {
  it('emits null/malformed answer + an idle signal, and the attempt is well-formed', () => {
    const off = personaById('off-task');
    let sawNullOrMalformed = false;
    let sawIdle = false;
    for (let i = 0; i < 12; i++) {
      const prob = generateFor('ADD_SAME_DEN', { level: 1, index: i });
      const att = off.emit(prob, ctx(off, { skillId: 'ADD_SAME_DEN', surfaceForm: 'proper', step: i }));
      expect(wellFormedAttempt(att)).toBe(true); // runner must not drop it
      if (att.answer === null || (Array.isArray(att.answer) && att.answer.some(Number.isNaN))) {
        sawNullOrMalformed = true;
      }
      if (att.signals.some((s) => s.type === 'idle')) sawIdle = true;
    }
    expect(sawNullOrMalformed).toBe(true);
    expect(sawIdle).toBe(true);
  });
});

describe('(5) train vs held-out families: disjoint ids and latents', () => {
  it('share no persona ids', () => {
    const train = trainFamily().map((p) => p.id);
    const held = heldOutFamily().map((p) => p.id);
    const overlap = train.filter((id) => held.includes(id));
    expect(overlap).toEqual([]);
  });

  it('draw latents from DISJOINT ranges (held-out pSlip/learnRate exceed train maxima)', () => {
    const train = trainFamily();
    const held = heldOutFamily();
    // Train ranges cap learnRate at 0.12 and pSlip at 0.12; held-out floors are
    // above those. Assert the family separation holds for the drawn values.
    const trainMaxLearn = Math.max(...train.map((p) => p.latent.learnRate));
    const heldMinLearn = Math.min(...held.map((p) => p.latent.learnRate));
    expect(heldMinLearn).toBeGreaterThan(trainMaxLearn);

    const trainMaxSlip = Math.max(...train.map((p) => p.latent.pSlip));
    const heldMinSlip = Math.min(...held.map((p) => p.latent.pSlip));
    expect(heldMinSlip).toBeGreaterThan(trainMaxSlip);
  });

  it('held-out family uses a non-BKT generative law (oscillatory / bimodal klass)', () => {
    const held = heldOutFamily();
    expect(held.some((p) => /nonbkt/.test(p.klass))).toBe(true);
  });
});

describe('population sanity', () => {
  it('all the named personas exist and are unique', () => {
    const all = allPersonas();
    const ids = all.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length); // unique
    for (const id of [
      'fast-mastery', 'slow-but-steady', 'confident-guesser', 'memorizer',
      'over-hinter', 'anxious-low-energy', 'short-attention', 'misconception-stable',
      'low-reading', 'oscillator', 'bimodal', 'off-task',
      'same-answer-memorizer', 'denominator-transfer-spoofer', 'fast-shallow-guesser',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('short-attention latency RISES across the session', () => {
    const sa = personaById('short-attention');
    const skill = 'ADD_SAME_DEN';
    const early = [];
    const late = [];
    for (let i = 0; i < 20; i++) {
      const prob = generateFor(skill, { level: 1, index: i, surfaceForm: 'proper' });
      const att = sa.emit(prob, ctx(sa, { skillId: skill, surfaceForm: 'proper', step: i }));
      (i < 5 ? early : i >= 15 ? late : []).push?.(att.latencyMs);
    }
    const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(avg(late)).toBeGreaterThan(avg(early));
  });

  it('fast-shallow-guesser produces correct answers below a plausible-compute floor', () => {
    const fs = personaById('fast-shallow-guesser');
    const skill = 'ADD_SAME_DEN';
    let fastCorrects = 0;
    for (let i = 0; i < 20; i++) {
      const prob = generateFor(skill, { level: 1, index: i, surfaceForm: 'proper' });
      const att = fs.emit(prob, ctx(fs, { skillId: skill, surfaceForm: 'proper', step: i }));
      if (answerCorrect(att.answer, prob) && att.latencyMs < 1200) fastCorrects++;
    }
    expect(fastCorrects).toBeGreaterThan(0);
  });

  it('same-answer-memorizer reports one fixed answer_value across distinct problems', () => {
    const sa = personaById('same-answer-memorizer');
    const answers = new Set();
    for (let i = 0; i < 6; i++) {
      const prob = generateFor('ADD_SAME_DEN', { level: 1, index: i, surfaceForm: 'proper' });
      const att = sa.emit(prob, ctx(sa, { skillId: 'ADD_SAME_DEN', surfaceForm: 'proper', step: i }));
      answers.add(`${att.answer[0]}/${att.answer[1]}`);
    }
    expect(answers.size).toBe(1); // collapses distinct problems under the proxy
  });
});

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function answerCorrect(answer, problem) {
  if (!Array.isArray(answer)) return false;
  const ans = problem.answer || {};
  if (typeof ans.num === 'number' && typeof ans.den === 'number') {
    return answer[0] === ans.num && answer[1] === ans.den;
  }
  if (typeof ans.product === 'number') return answer[0] === ans.product && answer[1] === 1;
  return false;
}

function gcd(a, b) {
  while (b) { [a, b] = [b, a % b]; }
  return a;
}
