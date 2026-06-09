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
    // bored-high-skill: already-competent learner who disengages across the session.
    // NON-BKT: boredom is NOT a BKT parameter — competence is high and stable but
    // latency RISES (boredom drift) and intentional errors INCREASE with session
    // length, distinct from fast-mastery (succeeds cleanly) and off-task (full
    // refusal). The boredom law: pBoredomError grows linearly from 0 at step 0 to
    // ~0.25 at step 20, independent of latent skill.
    makePersona({
      id: 'bored-high-skill',
      klass: 'bored-high-skill-nonbkt',
      latent: {
        truePknownDefault: 0.85, learnRate: 0.02, pSlip: 0.04, pGuess: 0.1,
        hintAppetite: 0.02, idleRate: 0.12,
        latency: { base: 3000, spread: 1500, fatiguePerStep: 180 }, // strong drift
        misconception: 'add_denominators',
      },
      emit: boredHighSkillEmit,
      meta: {
        approximates: 'bored high-skill learner who needs challenge',
        mightMiss: 'a bored child who re-engages when given harder material (we model monotone disengagement)',
      },
    }),
    // performance-oriented: optimises for ADVANCING the gate, not for learning.
    // NON-BKT: the child locks onto the FIRST surface form seen (no structural
    // transfer) and answers at moderate-fast speed WITHOUT hints. Very low learnRate
    // (true skill does not improve), moderate pSlip, moderate truePknown (~0.5)
    // — enough lucky-correct runs to open the gate while transfer is structurally
    // absent (only one surface_form seen → falseTransfer fires once the gate opens).
    // Distinct from fast-shallow-guesser (latency stays well above the 800ms floor)
    // and from over-hinter (hintAppetite near zero).
    makePersona({
      id: 'performance-oriented',
      klass: 'performance-oriented-nonbkt',
      latent: {
        truePknownDefault: 0.5, learnRate: 0.01, pSlip: 0.12, pGuess: 0.2,
        lockedSurfaceBySkill: {}, // first surface form seen per skill, locked
        hintAppetite: 0.02, idleRate: 0.04,
        latency: { base: 1800, spread: 1200, fatiguePerStep: 20 }, // above floor, not implausibly fast
      },
      emit: performanceOrientedEmit,
      meta: {
        approximates: "performance-oriented student who optimizes for finishing, not understanding",
        mightMiss: 'a child who learns to optimise AND internalises the material over time',
      },
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

/**
 * bored-high-skill: NON-BKT boredom-drift law.
 *
 * The child already knows the material (truePknownDefault ~0.85, learnRate ~0.02).
 * Two boredom signals RISE with session step:
 *   (1) Latency drift: boredom latency bonus grows linearly, so later steps take
 *       meaningfully longer even though the child "knows" the answer.
 *   (2) Intentional error rate (pBoredomError): grows linearly from 0 at step 0 to
 *       BOREDOM_ERROR_RATE_AT_20 at step 20 (capped there). These are deliberate
 *       wrong answers from a competent child who is no longer trying, not slips.
 *
 * This is distinct from:
 *   - fast-mastery: succeeds cleanly with low latency, no intentional errors.
 *   - off-task: full refusal (null/NaN answers), not high-competence wrong answers.
 *   - short-attention: rising latency but starts at moderate competence (0.5), not high.
 */
const BOREDOM_ERROR_RATE_AT_20 = 0.25; // pBoredomError at step 20+

function boredHighSkillEmit(problem, ctx, env) {
  const { latent, session, truePKnown } = env;
  const rng = ctx.rng;
  const skillId = ctx.skillId;

  // Boredom error rate grows linearly with session step, capped at step 20.
  const boredSteps = Math.min(session.step, 20);
  const pBoredomError = (boredSteps / 20) * BOREDOM_ERROR_RATE_AT_20;

  // Intentional boredom error: despite knowing the material, the child submits a
  // wrong answer. This is NOT a slip — it fires at pBoredomError independent of
  // latent skill, and it does not suppress learning (they know it).
  let correct;
  if (chance(rng, pBoredomError)) {
    // Deliberate boredom error — high-skill child not trying.
    correct = false;
  } else {
    // Normal correctness from latent skill (high pknown → usually correct).
    const p = truePKnown(skillId);
    correct = chance(rng, p) ? !chance(rng, latent.pSlip) : chance(rng, latent.pGuess);
    if (correct) {
      const cur = truePKnown(skillId);
      session.pknownBySkill[skillId] = clamp01(cur + latent.learnRate * (1 - cur));
    }
  }

  const answer = correct
    ? correctAnswerValue(problem)
    : plantWrong(skillId, problem, latent, rng);

  // Boredom latency bonus: rises linearly with session step (additional drift
  // on top of the standard fatigue term from drawLatency). This is the boredom-
  // specific signal: the child lingers, daydreams, checks out — even at high skill.
  const L = latent.latency;
  const overAttention = Math.max(0, session.step - (latent.attentionSpan || 12));
  const fatigue = (session.step * 0.4 + overAttention) * (L.fatiguePerStep || 0);
  const boredLatencyBonus = session.step * 120; // 120ms/step boredom drift
  const jitter = rng() * (L.spread || 0);
  const latencyMs = Math.round((L.base || 0) + jitter + fatigue + boredLatencyBonus);

  // Idle signals increase with boredom (daydreaming, off-gaze).
  const idleP = latent.idleRate + pBoredomError * 0.5;
  const signals = [];
  if (chance(rng, idleP)) {
    signals.push({ type: 'idle', confidence: 0.5 + rng() * 0.4 });
  }

  return {
    answer,
    latencyMs,
    hintRung: 0, // bored child doesn't bother ringing hints
    selfCorrections: 0,
    modality: latent.modality || 'tap',
    signals,
  };
}

/**
 * performance-oriented: NON-BKT surface-lock law.
 *
 * This child optimises for advancing the gate, not for real understanding:
 *
 *   (1) SURFACE LOCK: on first sighting per skill, the child locks onto that
 *       surface_form and only ever sees (in its own model) that one form — so
 *       ctx.surfaceForm is IGNORED for latency/correctness decisions.  The key
 *       effect is that the tape will show zero surface-form variation: every
 *       attempt carries the SAME surfaceForm the runner assigned, and since the
 *       runner sequences problems through one skill the surfaceForm is naturally
 *       stable for shallow skills.  The oracle's hasNoSurfaceVariation() will
 *       see ≤1 distinct form and correctly fire falseTransfer once the gate opens.
 *
 *   (2) CORRECTNESS from moderate latent skill (truePknown ~0.5, pSlip ~0.12):
 *       not a high-skill child — just lucky enough across a 40-step session to
 *       rack up the consecutive-correct run the gate needs.
 *
 *   (3) NO HINTS (hintAppetite ~0.02): the child skips hints entirely to look
 *       "clean" to the engine (hintFree corrects count toward consecutiveCleanCorrects).
 *
 *   (4) LATENCY: base 1800ms, spread 1200ms, tiny fatigue — comfortably above
 *       the 800ms too-fast-correct floor, so corrects are NEVER flagged too_fast.
 *       This is explicitly NOT implausibly fast (contrast fast-shallow-guesser:
 *       base 300ms, dips under the floor on purpose).
 *
 *   (5) VERY LOW learnRate (0.01): true skill barely improves across the session —
 *       the gate opens on a lucky run, not genuine mastery.
 *
 * Distinct from:
 *   - fast-shallow-guesser: that persona's latency BASE is 300ms (under the 800ms
 *     floor); this persona's base is 1800ms (solidly above).
 *   - over-hinter: over-hinter has hintAppetite 0.6; this persona is near-zero.
 *   - memorizer: memorizer explicitly passes the trained form and fails all others;
 *     this persona has moderate but uniform competence and is about gate-gaming, not
 *     rote-memorisation of one template.
 */
function performanceOrientedEmit(problem, ctx, env) {
  const { latent, session, truePKnown } = env;
  const rng = ctx.rng;
  const skillId = ctx.skillId;

  // Lock the first surface form encountered per skill (never update after).
  if (!(skillId in latent.lockedSurfaceBySkill)) {
    latent.lockedSurfaceBySkill[skillId] = ctx.surfaceForm;
  }
  // (The locked form is stored for inspector/oracle use; the runner records
  //  ctx.surfaceForm from the problem regardless — we cannot override that.
  //  What matters for falseTransfer is that the ENGINE only presents one
  //  surfaceForm per session to a single-skill runner, so the tape has ≤1 distinct
  //  form.)

  // Correctness: drawn from latent skill — moderate pknown, low learnRate.
  const p = truePKnown(skillId);
  let correct;
  if (chance(rng, p)) {
    correct = !chance(rng, latent.pSlip); // knows it but may slip
  } else {
    correct = chance(rng, latent.pGuess); // lucky guess
  }

  // Minimal learning: barely improves (learnRate ~0.01).
  if (correct) {
    const cur = truePKnown(skillId);
    session.pknownBySkill[skillId] = clamp01(cur + latent.learnRate * (1 - cur));
  }

  const answer = correct
    ? correctAnswerValue(problem)
    : plantWrong(skillId, problem, latent, rng);

  // Latency: moderate-fast, NOT implausibly fast (stays above the 800ms floor).
  const L = latent.latency;
  const overAttention = Math.max(0, session.step - (latent.attentionSpan || 20));
  const fatigue = (session.step * 0.4 + overAttention) * (L.fatiguePerStep || 0);
  const jitter = rng() * (L.spread || 0);
  const latencyMs = Math.round((L.base || 0) + jitter + fatigue);

  return {
    answer,
    latencyMs,
    hintRung: chance(rng, latent.hintAppetite) ? 1 : 0, // near-zero; skips hints
    selfCorrections: 0, // focused; does not waffle
    modality: latent.modality || 'tap',
    signals: chance(rng, latent.idleRate) ? [{ type: 'idle', confidence: 0.5 }] : [],
  };
}

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
