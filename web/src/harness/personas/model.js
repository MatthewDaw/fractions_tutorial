// harness/personas/model.js — U3: the synthetic-learner persona factory.
//
// A persona is a GENERATIVE model of a child that the U4 runner drives one
// problem at a time. It samples whether it got the problem right from ITS OWN
// latent skill (truePknownBySkill + learnRate) plus slip/guess noise — NOT from
// the engine's BKT params. Wrong answers are planted via the inverse-error map on
// the REAL operands so the engine fingerprints them. Latency, hint rung, self-
// corrections and idle/oscillation signals all come from the persona's own latent
// constants (fatigue, attention, hint appetite, oscillation rate).
//
// DISJOINTNESS LINT (test_param_disjointness): this file and every sibling under
// personas/ MUST NOT import the engine's params module (the lint forbids that
// import path as a literal substring anywhere under personas/).
// The persona's notion of "how the child behaves" is parameter-disjoint from the
// engine's notion of "how to infer mastery" — that is what makes the harness a
// real red-team and not a tautology.
//
// CONTRACT (build the U4 runner to this):
//   persona = {
//     id, klass, latent, meta:{approximates,mightMiss},
//     truePKnown(skillId) -> number in [0,1],
//     emit(problem, ctx) -> attempt
//   }
//   ctx = { skillId, level, surfaceForm, lastDecision, rng, step }
//   attempt = { answer:[num,den]|null, latencyMs, hintRung, selfCorrections,
//               modality, signals:[{type:'idle'|'oscillation', confidence}] }
//   emit MAY mutate an internal fatigue/session counter across calls.

import { inverseAnswer, misconceptionsFor } from './inverseErrors.js';
import { randInt, chance } from '../rng.js';

// Latency floor the engine treats as "too fast to be a real compute" is 1200ms
// in the engine today. We DELIBERATELY do not import it (disjointness) and we
// expose latency as a RANGE/draw rather than a single value pinned to that floor
// (review A8). Personas that intend to look "fast" draw from a band that may dip
// under it; honest computers draw from a band well above it.
const DEFAULT_LATENCY = { base: 4000, spread: 2500, fatiguePerStep: 120 };

// ---------------------------------------------------------------------------
// Default latent — every field has a sane default so makePersona(spec) needs
// only the fields it wants to vary.
// ---------------------------------------------------------------------------

function defaultLatent() {
  return {
    /** map skillId -> true P(known) at session start, [0,1]. */
    truePknownBySkill: {},
    /** fallback P(known) for skills not in the map. */
    truePknownDefault: 0.5,
    /** how much each correct attempt raises true P(known) toward 1. */
    learnRate: 0.06,
    /** P(careless wrong) on a skill the child actually knows. */
    pSlip: 0.08,
    /** P(lucky correct) on a skill the child does NOT know. */
    pGuess: 0.15,
    /** the child's stable misconception id (used to plant wrong answers). */
    misconception: null,
    /** how strongly the misconception (vs a random slip) drives wrong answers. */
    misconceptionStrength: 0.85,
    /** latency drift multiplier per step (fatigue accrual). */
    fatigueDecay: 1.0,
    /** number of attempts before attention degrades (latency rises, focus drops). */
    attentionSpan: 12,
    /** appetite for hints: P(ring a hint) and how high it climbs. */
    hintAppetite: 0.15,
    /** P(an oscillation / place-remove waffle) within an attempt. */
    oscillationRate: 0.1,
    /** preferred input modality. */
    modality: 'tap',
    /** latency band {base,spread,fatiguePerStep}. */
    latency: DEFAULT_LATENCY,
    /** P(emitting an idle signal) per attempt (boredom/disengagement). */
    idleRate: 0.04,
    /** when true, emit() may produce null/malformed answers (off-task/refuser). */
    offTask: false,
  };
}

// ---------------------------------------------------------------------------
// makePersona — the factory.
// ---------------------------------------------------------------------------

/**
 * @param {object} spec
 *   { id, klass, meta?, latent?, truePKnown?, emit? }   // emit/truePKnown overridable
 * @returns persona implementing the contract.
 */
export function makePersona(spec) {
  const latent = { ...defaultLatent(), ...(spec.latent || {}) };
  const meta = spec.meta || { approximates: 'a learner', mightMiss: 'unmodeled behaviors' };

  // Per-persona mutable session state. The runner gets a FRESH persona instance
  // per session (library factories return new objects), so this is per-session.
  const session = {
    step: 0,                 // attempts emitted so far this session
    pknownBySkill: {},       // live, mutated true P(known) per skill (learning)
  };

  function truePKnown(skillId) {
    if (skillId in session.pknownBySkill) return session.pknownBySkill[skillId];
    const seed =
      skillId in latent.truePknownBySkill
        ? latent.truePknownBySkill[skillId]
        : latent.truePknownDefault;
    session.pknownBySkill[skillId] = clamp01(seed);
    return session.pknownBySkill[skillId];
  }

  // Custom emit override (used by spoofers that need bespoke behavior).
  const emitImpl = spec.emit || defaultEmit;

  const persona = {
    id: spec.id,
    klass: spec.klass,
    latent,
    meta,
    truePKnown,
    // bind session + latent into emit via closure args
    emit(problem, ctx) {
      const out = emitImpl(problem, ctx, { latent, session, truePKnown, spec });
      session.step += 1;
      return out;
    },
    // expose session for tests/inspection (non-contract)
    _session: session,
  };
  return persona;
}

// ---------------------------------------------------------------------------
// The default generative emit.
// ---------------------------------------------------------------------------

function defaultEmit(problem, ctx, env) {
  const { latent, session, truePKnown } = env;
  const rng = ctx.rng;
  const skillId = ctx.skillId;

  // --- off-task / refuser short-circuit ---
  if (latent.offTask) {
    return offTaskAttempt(problem, ctx, env);
  }

  // --- correctness draw from the persona's OWN latent skill (NOT engine BKT) ---
  const p = truePKnown(skillId);
  let correct;
  if (chance(rng, p)) {
    // child "knows" it — but may slip.
    correct = !chance(rng, latent.pSlip);
  } else {
    // child does not know it — but may guess lucky.
    correct = chance(rng, latent.pGuess);
  }

  // --- learning: a correct attempt nudges true P(known) up toward 1 ---
  if (correct) {
    const cur = truePKnown(skillId);
    session.pknownBySkill[skillId] = clamp01(cur + latent.learnRate * (1 - cur));
  }

  // --- answer_value ---
  const answer = correct
    ? correctAnswerValue(problem)
    : wrongAnswerValue(skillId, problem, latent, rng);

  // --- latency: base + fatigue drift over the session (short attention RISES) ---
  const latencyMs = drawLatency(latent, session.step, rng);

  // --- hint rung from hint appetite (H0 if no ladder is available) ---
  const hintRung = drawHintRung(latent, ctx, rng);

  // --- self-corrections from oscillation rate ---
  const selfCorrections = chance(rng, latent.oscillationRate)
    ? randInt(rng, 1, 2)
    : 0;

  // --- signals: idle (disengagement) and oscillation (waffling) ---
  const signals = [];
  if (chance(rng, latent.idleRate)) {
    signals.push({ type: 'idle', confidence: 0.5 + rng() * 0.4 });
  }
  if (selfCorrections > 0) {
    signals.push({ type: 'oscillation', confidence: 0.4 + rng() * 0.5 });
  }

  return {
    answer,
    latencyMs,
    hintRung,
    selfCorrections,
    modality: latent.modality,
    signals,
  };
}

// ---------------------------------------------------------------------------
// Answer helpers
// ---------------------------------------------------------------------------

/** The correct answer_value [num,den] where the generator exposes a flat fraction. */
export function correctAnswerValue(problem) {
  const ans = (problem && problem.answer) || {};
  if (typeof ans.num === 'number' && typeof ans.den === 'number') {
    return [ans.num, ans.den];
  }
  // product / rel / mixed answers: encode a flat [num,den] the runner can carry.
  if (typeof ans.product === 'number') return [ans.product, 1];
  if (typeof ans.whole === 'number') {
    // mixed: present the improper value as [num,den] from operands.
    const op = problem.operands || {};
    if (typeof op.num === 'number' && typeof op.den === 'number') return [op.num, op.den];
    return [ans.whole, 1];
  }
  return [1, 1];
}

/** A wrong answer_value: misconception-driven (strength) or a random slip. */
function wrongAnswerValue(skillId, problem, latent, rng) {
  const ms = misconceptionsFor(skillId);
  let m = latent.misconception;
  // If the persona has no fixed misconception, or rolls under strength-miss,
  // pick a plausible misconception for THIS skill (so the engine sees structure).
  if (!m || (ms.length && !ms.includes(m))) {
    m = ms.length ? ms[randInt(rng, 0, ms.length - 1)] : null;
  }
  if (m && !chance(rng, latent.misconceptionStrength)) {
    // occasionally a different slip rather than the signature misconception
    m = ms.length ? ms[randInt(rng, 0, ms.length - 1)] : m;
  }
  const planted = inverseAnswer(skillId, m, problem);
  // inverseAnswer never returns the correct value for a known misconception, but
  // guard anyway so a "wrong" attempt is never accidentally graded correct.
  const correct = correctAnswerValue(problem);
  if (planted && correct && planted[0] === correct[0] && planted[1] === correct[1]) {
    return [planted[0] + 1, planted[1]];
  }
  return planted;
}

// ---------------------------------------------------------------------------
// Latency / hint draws
// ---------------------------------------------------------------------------

/**
 * Latency as a DRAW from a band (review A8): base + uniform spread, plus a
 * fatigue term that GROWS with session length once attention is exceeded.
 * Short-attention personas (small attentionSpan, large fatiguePerStep) therefore
 * see latency RISE across the session.
 */
function drawLatency(latent, step, rng) {
  const L = latent.latency || DEFAULT_LATENCY;
  const overAttention = Math.max(0, step - latent.attentionSpan);
  const fatigue = (step * 0.4 + overAttention) * (L.fatiguePerStep || 0) * latent.fatigueDecay;
  const jitter = rng() * (L.spread || 0);
  return Math.round((L.base || 0) + jitter + fatigue);
}

/**
 * Hint rung the persona rings. H0 when no ladder is available (we proxy "ladder
 * exists" by scaffold level > 0 OR an explicit ctx.hasLadder). Otherwise climbs
 * with hintAppetite.
 */
function drawHintRung(latent, ctx, rng) {
  const ladderExists = ctx.hasLadder ?? (ctx.level != null ? ctx.level < 4 : true);
  if (!ladderExists) return 0;
  if (!chance(rng, latent.hintAppetite)) return 0;
  // appetite also sets how high they climb: heavier appetite → higher rung.
  if (chance(rng, latent.hintAppetite)) return randInt(rng, 2, 3);
  return 1;
}

// ---------------------------------------------------------------------------
// Off-task / refuser attempt
// ---------------------------------------------------------------------------

function offTaskAttempt(problem, ctx, env) {
  const rng = ctx.rng;
  // emit one of: null answer, a "timeout" (huge latency + null), or a malformed
  // answer (NaN den). All still WELL-FORMED attempt objects (runner must not drop).
  const roll = rng();
  let answer = null;
  let latencyMs = 60000 + Math.round(rng() * 30000); // long idle/timeout
  if (roll < 0.34) {
    answer = null; // refusal / blank
  } else if (roll < 0.67) {
    answer = [NaN, NaN]; // malformed scribble
  } else {
    answer = null;
    latencyMs = 90000; // hard timeout
  }
  return {
    answer,
    latencyMs,
    hintRung: 0,
    selfCorrections: 0,
    modality: env.latent.modality,
    signals: [{ type: 'idle', confidence: 0.7 + rng() * 0.3 }],
  };
}

// ---------------------------------------------------------------------------
// utils
// ---------------------------------------------------------------------------

function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
