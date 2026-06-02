// harness/personas/library.js — U3: the synthetic-learner population.
//
// Each persona is a makePersona(spec). The library covers (1) ordinary BKT-shaped
// archetypes, (2) explicitly NON-BKT laws (oscillator, bimodal), (3) an off-task
// refuser, and (4) three AUDIT SPOOFERS that each target one spoofable engine
// proxy (the harness's red-team payload — see engine/dimensions.ts):
//   - same-answer-memorizer → the independence "distinct problem" answer_value proxy
//   - denominator-only transfer-spoofer → the transfer "denominator" surface proxy
//   - fast-but-shallow-guesser → fluencyOk()-always-true (the soft fluency gate)
//
// DISJOINTNESS: NO import of the engine's params module anywhere under personas/
// (the lint forbids that import path as a literal substring). The oscillator's
// period is coprime with the engine's fadeStreakK; we HARDCODE the literal 3 (with
// this comment) rather than import PARAMS — importing params would fail the lint.

import { makePersona, correctAnswerValue } from './model.js';
import { inverseAnswer, misconceptionsFor } from './inverseErrors.js';
import { randInt, chance } from '../rng.js';
import { trainFamily, heldOutFamily } from './families.js';

// The engine's fadeStreakK is 3 (params.ts). We must NOT import it (disjointness
// lint), so the oscillator's period is the literal 7 — coprime with 3 — hardcoded.
const FADE_STREAK_K_LITERAL = 3; // mirror of engine PARAMS.fadeStreakK (do NOT import)
const OSCILLATOR_PERIOD = 7;     // coprime with 3 → a fade streak never aligns with a peak

// ===========================================================================
// Ordinary archetypes (BKT-shaped, via the default emit).
// ===========================================================================

function archetypes() {
  return [
    makePersona({
      id: 'fast-mastery',
      klass: 'fast-mastery',
      latent: {
        truePknownDefault: 0.7, learnRate: 0.2, pSlip: 0.04, pGuess: 0.2,
        attentionSpan: 30, hintAppetite: 0.03,
        latency: { base: 2500, spread: 1500, fatiguePerStep: 30 },
      },
      meta: { approximates: 'a quick learner who masters in a few attempts',
              mightMiss: 'plateau/ceiling effects on the hardest transfer forms' },
    }),
    makePersona({
      id: 'slow-but-steady',
      klass: 'slow-but-steady',
      latent: {
        truePknownDefault: 0.3, learnRate: 0.08, pSlip: 0.06, pGuess: 0.12,
        attentionSpan: 25, hintAppetite: 0.12,
        latency: { base: 6000, spread: 3000, fatiguePerStep: 60 },
      },
      meta: { approximates: 'a learner who gets there with more reps',
              mightMiss: 'giving up before mastery (we keep grinding)' },
    }),
    makePersona({
      id: 'confident-guesser',
      klass: 'confident-guesser',
      latent: {
        truePknownDefault: 0.25, learnRate: 0.05, pSlip: 0.1, pGuess: 0.45,
        attentionSpan: 15, hintAppetite: 0.02,
        latency: { base: 1500, spread: 1200, fatiguePerStep: 20 },
      },
      meta: { approximates: 'a child who guesses fast and often lands lucky',
              mightMiss: 'guesser who also reads hints (we keep appetite low)' },
    }),
    // memorizer: masters its TRAINED surface form, fails the OTHER form.
    makePersona({
      id: 'memorizer',
      klass: 'memorizer',
      latent: {
        truePknownDefault: 0.2, learnRate: 0.1, pSlip: 0.05, pGuess: 0.1,
        trainedSurfaceBySkill: {}, // filled lazily on first sighting per skill
        attentionSpan: 20, hintAppetite: 0.08,
      },
      emit: memorizerEmit,
      meta: { approximates: 'a rote learner who templates ONE surface form',
              mightMiss: 'partial transfer (we make the off-form near-deterministic fail)' },
    }),
    makePersona({
      id: 'over-hinter',
      klass: 'over-hinter',
      latent: {
        truePknownDefault: 0.4, learnRate: 0.09, pSlip: 0.06, pGuess: 0.15,
        attentionSpan: 18, hintAppetite: 0.6,
        latency: { base: 5000, spread: 2500, fatiguePerStep: 50 },
      },
      meta: { approximates: 'a child who leans on hints to get corrects',
              mightMiss: 'hint-then-internalize (our appetite stays high)' },
    }),
    makePersona({
      id: 'anxious-low-energy',
      klass: 'anxious-low-energy',
      latent: {
        truePknownDefault: 0.35, learnRate: 0.07, pSlip: 0.18, pGuess: 0.1,
        attentionSpan: 8, hintAppetite: 0.2, idleRate: 0.15, oscillationRate: 0.3,
        latency: { base: 7000, spread: 4000, fatiguePerStep: 150 },
      },
      meta: { approximates: 'an anxious child who slips and waffles under load',
              mightMiss: 'recovery after reassurance (no affect-repair channel)' },
    }),
    // short-attention: latency RISES with session length (small span, big drift).
    makePersona({
      id: 'short-attention',
      klass: 'short-attention',
      latent: {
        truePknownDefault: 0.5, learnRate: 0.09, pSlip: 0.1, pGuess: 0.15,
        attentionSpan: 5, hintAppetite: 0.1, idleRate: 0.18,
        latency: { base: 3000, spread: 2000, fatiguePerStep: 400 }, // strong drift
      },
      meta: { approximates: 'a child who fades fast within a session (latency climbs)',
              mightMiss: 'second-wind recovery after a break' },
    }),
    // misconception-stable: a fixed, strong misconception across the session.
    makePersona({
      id: 'misconception-stable',
      klass: 'misconception-stable',
      latent: {
        truePknownDefault: 0.45, learnRate: 0.03, pSlip: 0.06, pGuess: 0.08,
        misconception: 'add_across_unlike', misconceptionStrength: 0.97,
        attentionSpan: 20, hintAppetite: 0.1,
      },
      meta: { approximates: 'a child with one entrenched, repeatable misconception',
              mightMiss: 'misconception that decays once confronted' },
    }),
    // low-reading: prefers voice; tends to idle on text-heavy prompts.
    makePersona({
      id: 'low-reading',
      klass: 'low-reading',
      latent: {
        truePknownDefault: 0.45, learnRate: 0.08, pSlip: 0.12, pGuess: 0.15,
        modality: 'voice', attentionSpan: 14, hintAppetite: 0.25, idleRate: 0.12,
        latency: { base: 6500, spread: 3000, fatiguePerStep: 90 },
      },
      meta: { approximates: 'a learner who struggles to READ prompts (uses voice)',
              mightMiss: 'reading growth over time (modality is fixed)' },
    }),
  ];
}

// ===========================================================================
// NON-BKT laws + off-task.
// ===========================================================================

function nonBkt() {
  return [
    // oscillator: learns-then-forgets on a period coprime with fadeStreakK (3).
    makePersona({
      id: 'oscillator',
      klass: 'oscillator-nonbkt',
      latent: {
        truePknownDefault: 0.5, pSlip: 0.07, pGuess: 0.15,
        hintAppetite: 0.1, oscillationRate: 0.15, idleRate: 0.05, modality: 'tap',
        misconception: 'add_denominators',
      },
      emit: oscillatorEmit(OSCILLATOR_PERIOD),
      meta: { approximates: 'a learns-then-forgets child (non-monotone competence)',
              mightMiss: 'time-based (not attempt-based) forgetting' },
    }),
    // bimodal: lucky-on-easy — high P at low levels, near-chance at high levels.
    makePersona({
      id: 'bimodal',
      klass: 'bimodal-nonbkt',
      latent: {
        truePknownDefault: 0.5, pSlip: 0.08, pGuess: 0.18,
        hintAppetite: 0.12, oscillationRate: 0.1, idleRate: 0.06, modality: 'tap',
        misconception: 'scaled_bottom_only',
      },
      emit: bimodalEasyEmit(),
      meta: { approximates: 'a child who is solid on easy items but collapses on hard ones',
              mightMiss: 'difficulty that is not captured by level alone' },
    }),
    // off-task / refuser: null/timeout/malformed answers + idle signals.
    makePersona({
      id: 'off-task',
      klass: 'off-task-refuser',
      latent: { offTask: true, modality: 'tap', idleRate: 0.9 },
      meta: { approximates: 'a disengaged child who refuses / times out / scribbles',
              mightMiss: 'partial engagement (we model full refusal)' },
    }),
  ];
}

// ===========================================================================
// AUDIT SPOOFERS — each targets one engine proxy.
// ===========================================================================

function spoofers() {
  return [
    // (1) same-answer-memorizer: emits the SAME answer_value on structurally
    // DISTINCT problems → exploits the independence check's answer_value
    // "distinct problem" proxy (dimensions.ts ~143). It answers CORRECTLY only
    // when its fixed answer happens to be right, but always REPORTS that fixed
    // value so the proxy collapses two distinct problems into one bucket.
    makePersona({
      id: 'same-answer-memorizer',
      klass: 'spoofer:independence-answer-proxy',
      latent: {
        truePknownDefault: 0.8, pSlip: 0.03, pGuess: 0.3,
        fixedAnswer: [1, 2], hintAppetite: 0.02, modality: 'tap',
        latency: { base: 3000, spread: 1500, fatiguePerStep: 30 },
      },
      emit: sameAnswerEmit,
      meta: { approximates: 'a child who reuses one memorized answer across items',
              mightMiss: 'whether problem_id (the real fix) defeats the spoof — that is the AUDIT' },
    }),
    // (2) denominator-only transfer-spoofer: varies ONLY the denominator across
    // problems, never the structure → exploits the transfer check's denominator
    // surface proxy (dimensions.ts ~194). Same surfaceForm, different den.
    makePersona({
      id: 'denominator-transfer-spoofer',
      klass: 'spoofer:transfer-denominator-proxy',
      latent: {
        truePknownDefault: 0.85, pSlip: 0.03, pGuess: 0.3,
        hintAppetite: 0.02, modality: 'tap',
        latency: { base: 4000, spread: 1500, fatiguePerStep: 30 }, // in-band, not too fast
      },
      emit: denomTransferEmit,
      meta: { approximates: 'a child who "transfers" only by denominator change, not structure',
              mightMiss: 'whether surface_form (the real fix) defeats the spoof — the AUDIT' },
    }),
    // (3) fast-but-shallow-guesser: correct AND below the plausible-compute
    // latency floor → exploits fluencyOk() returning true unconditionally
    // (dimensions.ts ~91). Latency band dips UNDER the floor on purpose.
    makePersona({
      id: 'fast-shallow-guesser',
      klass: 'spoofer:fluency-soft-gate',
      latent: {
        truePknownDefault: 0.75, pSlip: 0.03, pGuess: 0.4,
        hintAppetite: 0.02, modality: 'tap',
        // base BELOW the engine's plausible-compute floor (≈1200ms) so corrects
        // arrive "too fast". We do NOT import the floor (disjointness) — we just
        // draw from a fast band and let the engine's guard react.
        latency: { base: 300, spread: 500, fatiguePerStep: 5 },
      },
      emit: fastShallowEmit,
      meta: { approximates: 'a child who answers correctly but implausibly fast (shallow)',
              mightMiss: 'whether too_fast_correct + a transfer probe catches it — the AUDIT' },
    }),
  ];
}

// ---------------------------------------------------------------------------
// Bespoke emit implementations.
// ---------------------------------------------------------------------------

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

function plantWrong(skillId, problem, latent, rng) {
  const ms = misconceptionsFor(skillId);
  const m = latent.misconception && ms.includes(latent.misconception)
    ? latent.misconception
    : (ms.length ? ms[randInt(rng, 0, ms.length - 1)] : null);
  const planted = inverseAnswer(skillId, m, problem);
  const correct = correctAnswerValue(problem);
  if (planted && correct && planted[0] === correct[0] && planted[1] === correct[1]) {
    return [planted[0] + 1, planted[1]];
  }
  return planted;
}

/** memorizer: deterministic PASS on the trained surface form, FAIL on any other. */
function memorizerEmit(problem, ctx, env) {
  const { latent, session } = env;
  const rng = ctx.rng;
  const skillId = ctx.skillId;
  // Lock the trained surface form to the FIRST one this persona sees per skill.
  if (!(skillId in latent.trainedSurfaceBySkill)) {
    latent.trainedSurfaceBySkill[skillId] = ctx.surfaceForm;
  }
  const trained = latent.trainedSurfaceBySkill[skillId];
  const onTrained = ctx.surfaceForm === trained;
  // On the trained form: near-deterministic correct (slip only).
  // On any other form: near-deterministic WRONG (template doesn't transfer).
  const correct = onTrained ? !chance(rng, latent.pSlip) : chance(rng, 0.03);
  const answer = correct ? correctAnswerValue(problem) : plantWrong(skillId, problem, latent, rng);
  return {
    answer,
    latencyMs: Math.round(3500 + rng() * 2000 + session.step * 40),
    hintRung: 0,
    selfCorrections: 0,
    modality: latent.modality || 'tap',
    signals: onTrained ? [] : (chance(rng, 0.3) ? [{ type: 'idle', confidence: 0.6 }] : []),
  };
}

/** oscillator: triangular-wave competence on `period` (coprime with 3). */
function oscillatorEmit(period) {
  return function emit(problem, ctx, env) {
    const { latent, session, truePKnown } = env;
    const rng = ctx.rng;
    const phase = session.step % period;
    const wave = 1 - Math.abs(phase - (period - 1) / 2) / ((period - 1) / 2 || 1);
    const pEff = clamp01(0.15 + 0.7 * wave);
    const correct = chance(rng, pEff) ? !chance(rng, latent.pSlip) : chance(rng, latent.pGuess);
    const answer = correct ? correctAnswerValue(problem) : plantWrong(ctx.skillId, problem, latent, rng);
    return {
      answer,
      latencyMs: Math.round(3000 + rng() * 3000 + session.step * 70),
      hintRung: chance(rng, latent.hintAppetite) ? randInt(rng, 1, 3) : 0,
      selfCorrections: chance(rng, latent.oscillationRate) ? 1 : 0,
      modality: latent.modality || 'tap',
      signals: chance(rng, latent.idleRate) ? [{ type: 'idle', confidence: 0.6 }] : [],
    };
  };
}

/** bimodal lucky-on-easy: high P at low level, near-chance at high level. */
function bimodalEasyEmit() {
  return function emit(problem, ctx, env) {
    const { latent, session } = env;
    const rng = ctx.rng;
    const level = ctx.level == null ? 2 : ctx.level;
    const pEff = level <= 1 ? 0.9 : level >= 3 ? 0.2 : 0.5;
    const correct = chance(rng, pEff) ? !chance(rng, latent.pSlip) : chance(rng, latent.pGuess);
    const answer = correct ? correctAnswerValue(problem) : plantWrong(ctx.skillId, problem, latent, rng);
    return {
      answer,
      latencyMs: Math.round((level >= 3 ? 6000 : 3000) + rng() * 2000 + session.step * 50),
      hintRung: level >= 3 && chance(rng, latent.hintAppetite) ? randInt(rng, 1, 2) : 0,
      selfCorrections: chance(rng, latent.oscillationRate) ? 1 : 0,
      modality: latent.modality || 'tap',
      signals: level >= 3 && chance(rng, latent.idleRate) ? [{ type: 'idle', confidence: 0.6 }] : [],
    };
  };
}

/** same-answer-memorizer: ALWAYS reports latent.fixedAnswer regardless of problem. */
function sameAnswerEmit(problem, ctx, env) {
  const { latent, session } = env;
  const rng = ctx.rng;
  const fixed = latent.fixedAnswer || [1, 2];
  const correct = correctAnswerValue(problem);
  // It is "correct" only when its fixed answer truly matches — but it ALWAYS
  // submits the fixed value, collapsing distinct problems under the proxy.
  return {
    answer: [fixed[0], fixed[1]],
    latencyMs: Math.round(3000 + rng() * 1500 + session.step * 30),
    hintRung: 0,
    selfCorrections: 0,
    modality: latent.modality || 'tap',
    signals: [],
    // expose for the audit which true-correctness this attempt would have had:
    _spoofMatchedCorrect: !!correct && fixed[0] === correct[0] && fixed[1] === correct[1],
  };
}

/**
 * denominator-transfer-spoofer: answers CORRECTLY but its competence is tied ONLY
 * to denominator novelty, never to structural surface_form. It is reliably correct
 * (so the transfer-by-denominator proxy is satisfied across different dens) while
 * never demonstrating real structural transfer. Latency stays IN BAND (not fast).
 */
function denomTransferEmit(problem, ctx, env) {
  const { latent, session } = env;
  const rng = ctx.rng;
  const correct = !chance(rng, latent.pSlip); // near-always correct
  const answer = correct ? correctAnswerValue(problem) : plantWrong(ctx.skillId, problem, latent, rng);
  return {
    answer,
    latencyMs: Math.round(4000 + rng() * 1500 + session.step * 30), // in-band
    hintRung: 0,
    selfCorrections: 0,
    modality: latent.modality || 'tap',
    signals: [],
  };
}

/**
 * fast-but-shallow-guesser: correct but BELOW the plausible-compute latency floor,
 * so each correct is "too fast". Exploits the soft fluency gate (always-true).
 */
function fastShallowEmit(problem, ctx, env) {
  const { latent, session } = env;
  const rng = ctx.rng;
  const correct = chance(rng, 0.8) ? true : chance(rng, latent.pGuess);
  const answer = correct ? correctAnswerValue(problem) : plantWrong(ctx.skillId, problem, latent, rng);
  // latency band sits UNDER the engine floor → too_fast_correct on corrects.
  const L = latent.latency;
  return {
    answer,
    latencyMs: Math.round(L.base + rng() * L.spread + session.step * L.fatiguePerStep),
    hintRung: 0,
    selfCorrections: 0,
    modality: latent.modality || 'tap',
    signals: [],
  };
}

// ===========================================================================
// Public population API.
// ===========================================================================

let _all = null;

function buildAll() {
  return [
    ...archetypes(),
    ...nonBkt(),
    ...spoofers(),
    ...trainFamily(),
    ...heldOutFamily(),
  ];
}

/**
 * All personas (archetypes + non-BKT + spoofers + both families).
 * Rebuilt fresh each call so session state never leaks across runs.
 * @returns persona[]
 */
export function allPersonas() {
  return buildAll();
}

/** Look up a single persona by id (fresh instance). */
export function personaById(id) {
  return buildAll().find((p) => p.id === id) || null;
}

// Re-export the fade-streak literal + oscillator period for tests/inspection.
export const _meta = { FADE_STREAK_K_LITERAL, OSCILLATOR_PERIOD };
