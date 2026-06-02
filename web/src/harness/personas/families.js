// harness/personas/families.js — U3: train vs held-out persona families.
//
// The harness is a red-team: if every persona were a different parameterisation
// of the SAME generative law the engine assumes (BKT), passing the held-out set
// would prove nothing. So the held-out family (a) draws latents from DISJOINT
// ranges, (b) uses a FRESH seed lineage, and (c) where possible uses a genuinely
// NON-BKT generative law (oscillatory / bimodal latent dynamics) rather than just
// re-rolled BKT constants (review A3). No persona id is shared between families.
//
// DISJOINTNESS: this file must not import the engine's params module either
// (the personas lint forbids that import path anywhere under personas/).

import { makePersona } from './model.js';
import { personaRng } from '../rng.js';

// ---------------------------------------------------------------------------
// Latent draw helpers — a family is a seed lineage + a set of disjoint ranges.
// ---------------------------------------------------------------------------

function lerp(rng, lo, hi) {
  return lo + rng() * (hi - lo);
}

// TRAIN ranges — "ordinary" learners. learnRate moderate, slip/guess modest.
const TRAIN_RANGES = {
  truePknownDefault: [0.25, 0.6],
  learnRate: [0.05, 0.12],
  pSlip: [0.04, 0.12],
  pGuess: [0.1, 0.25],
  misconceptionStrength: [0.6, 0.9],
  attentionSpan: [10, 18],
  hintAppetite: [0.05, 0.25],
  oscillationRate: [0.05, 0.2],
  idleRate: [0.02, 0.08],
};

// HELD-OUT ranges — DISJOINT from TRAIN on every axis (no overlap), so a
// held-out persona is never just a re-seeded train persona.
const HELDOUT_RANGES = {
  truePknownDefault: [0.62, 0.9],   // disjoint from [0.25,0.6]
  learnRate: [0.13, 0.25],          // disjoint from [0.05,0.12]
  pSlip: [0.13, 0.3],               // disjoint from [0.04,0.12]
  pGuess: [0.26, 0.45],             // disjoint from [0.1,0.25]
  misconceptionStrength: [0.91, 0.99], // disjoint from [0.6,0.9]
  attentionSpan: [3, 9],            // disjoint from [10,18]
  hintAppetite: [0.26, 0.5],        // disjoint from [0.05,0.25]
  oscillationRate: [0.21, 0.4],     // disjoint from [0.05,0.2]
  idleRate: [0.09, 0.2],            // disjoint from [0.02,0.08]
};

function drawLatent(rng, ranges, extra = {}) {
  return {
    truePknownDefault: lerp(rng, ...ranges.truePknownDefault),
    learnRate: lerp(rng, ...ranges.learnRate),
    pSlip: lerp(rng, ...ranges.pSlip),
    pGuess: lerp(rng, ...ranges.pGuess),
    misconceptionStrength: lerp(rng, ...ranges.misconceptionStrength),
    attentionSpan: Math.round(lerp(rng, ...ranges.attentionSpan)),
    hintAppetite: lerp(rng, ...ranges.hintAppetite),
    oscillationRate: lerp(rng, ...ranges.oscillationRate),
    idleRate: lerp(rng, ...ranges.idleRate),
    ...extra,
  };
}

// ---------------------------------------------------------------------------
// A NON-BKT emit law for the held-out family: correctness follows an OSCILLATORY
// or BIMODAL latent process rather than a monotone BKT skill. This is the review
// A3 requirement — the held-out generative form is qualitatively different.
// ---------------------------------------------------------------------------

import { correctAnswerValue } from './model.js';
import { inverseAnswer, misconceptionsFor } from './inverseErrors.js';
import { randInt, chance } from '../rng.js';

/**
 * Oscillatory law: the child's effective competence rises and falls on a fixed
 * period (learns-then-forgets), so correctness is NOT a monotone BKT curve.
 * Period 7 is coprime with the engine's fadeStreakK (=3) so a fade streak never
 * lines up with a competence peak.
 */
function oscillatoryEmit(period) {
  return function emit(problem, ctx, env) {
    const { latent, session, truePKnown } = env;
    const rng = ctx.rng;
    const phase = session.step % period;
    // competence peaks mid-period, troughs at the edges (triangular wave).
    const wave = 1 - Math.abs(phase - (period - 1) / 2) / ((period - 1) / 2 || 1);
    const base = truePKnown(ctx.skillId);
    const pEff = clamp01(0.2 + 0.6 * wave * (0.5 + base));
    const correct = chance(rng, pEff) ? !chance(rng, latent.pSlip) : chance(rng, latent.pGuess);
    const answer = correct
      ? correctAnswerValue(problem)
      : plantWrong(ctx.skillId, problem, latent, rng);
    const latencyMs = Math.round(3000 + rng() * 4000 + session.step * 80);
    return {
      answer,
      latencyMs,
      hintRung: chance(rng, latent.hintAppetite) ? randInt(rng, 1, 3) : 0,
      selfCorrections: chance(rng, latent.oscillationRate) ? 1 : 0,
      modality: latent.modality || 'tap',
      signals: chance(rng, latent.idleRate) ? [{ type: 'idle', confidence: 0.6 }] : [],
    };
  };
}

/**
 * Bimodal law: two latent modes (engaged vs checked-out). A coin per attempt
 * picks the mode; engaged ≈ high P, checked-out ≈ near-chance. NOT a single BKT
 * posterior.
 */
function bimodalEmit() {
  return function emit(problem, ctx, env) {
    const { latent, session } = env;
    const rng = ctx.rng;
    const engaged = chance(rng, 0.55);
    const pEff = engaged ? 0.85 : 0.2;
    const correct = chance(rng, pEff) ? !chance(rng, latent.pSlip) : chance(rng, latent.pGuess);
    const answer = correct
      ? correctAnswerValue(problem)
      : plantWrong(ctx.skillId, problem, latent, rng);
    const latencyMs = Math.round((engaged ? 2500 : 7000) + rng() * 2000 + session.step * 60);
    return {
      answer,
      latencyMs,
      hintRung: !engaged && chance(rng, latent.hintAppetite) ? randInt(rng, 1, 3) : 0,
      selfCorrections: chance(rng, latent.oscillationRate) ? 1 : 0,
      modality: latent.modality || 'tap',
      signals: !engaged && chance(rng, latent.idleRate + 0.1)
        ? [{ type: 'idle', confidence: 0.7 }]
        : [],
    };
  };
}

function plantWrong(skillId, problem, latent, rng) {
  const ms = misconceptionsFor(skillId);
  const m = latent.misconception && ms.includes(latent.misconception)
    ? latent.misconception
    : (ms.length ? ms[randInt(rng, 0, ms.length - 1)] : null);
  return inverseAnswer(skillId, m, problem);
}

/**
 * Fluency-spoof law (NON-BKT): correctness is DECOUPLED from the latent skill — the
 * child is reliably correct out of memorized/lucky surface fluency, yet NEVER learns,
 * so true competence stays pinned BELOW mastery. Answers are in-band (≥800ms so the
 * runner counts them as clean corrects) and hint-free, so the engine climbs the
 * scaffold and opens the gate on a child who has NOT mastered — a false-mastery
 * adversary. The sealed judge MUST carry at least one such defect: a held-out family
 * the engine handles perfectly (fm≡0) can never certify a false-mastery fix, because
 * an already-zero rate cannot be improved. This is the held-out fm signal (review A3:
 * non-BKT form preserved — correctness is not a BKT posterior).
 */
function fluencySpoofEmit() {
  return function emit(problem, ctx, env) {
    const { latent } = env;
    const rng = ctx.rng;
    // 90% correct regardless of latent (no learning update → latent stays < τ).
    const correct = chance(rng, 0.9) ? true : chance(rng, latent.pGuess);
    const answer = correct
      ? correctAnswerValue(problem)
      : plantWrong(ctx.skillId, problem, latent, rng);
    return {
      answer,
      latencyMs: Math.round(1500 + rng() * 1500), // in-band (≥800ms), hint-free
      hintRung: 0,
      selfCorrections: 0,
      modality: latent.modality || 'tap',
      signals: [],
    };
  };
}

function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

// ---------------------------------------------------------------------------
// Family builders.
// ---------------------------------------------------------------------------

/**
 * The TRAIN family — ordinary BKT-shaped learners drawn from the TRAIN ranges.
 * Seed lineage 'train' keeps these stable + distinct from the held-out lineage.
 * @returns persona[]
 */
export function trainFamily() {
  const out = [];
  const specs = [
    { id: 'fam-train-a', klass: 'train:moderate', misconception: 'add_denominators' },
    { id: 'fam-train-b', klass: 'train:hint-leaner', misconception: 'scaled_bottom_only' },
    { id: 'fam-train-c', klass: 'train:steady', misconception: null },
  ];
  specs.forEach((s, i) => {
    const rng = personaRng(`train-lineage:${s.id}`, 1000, i);
    const latent = drawLatent(rng, TRAIN_RANGES, { misconception: s.misconception });
    out.push(makePersona({
      id: s.id,
      klass: s.klass,
      latent,
      meta: {
        approximates: 'an ordinary classroom learner (monotone BKT-ish skill growth)',
        mightMiss: 'sudden affect swings; non-monotone forgetting',
      },
    }));
  });
  return out;
}

/**
 * The HELD-OUT family — DISJOINT latent ranges, FRESH seed lineage, and a
 * genuinely NON-BKT generative law (oscillatory + bimodal). No id overlaps train.
 * @returns persona[]
 */
export function heldOutFamily() {
  const out = [];

  // oscillatory member — period 7 (coprime with engine fadeStreakK literal 3).
  {
    const rng = personaRng('heldout-lineage:osc', 9000, 0);
    const latent = drawLatent(rng, HELDOUT_RANGES, { misconception: 'add_across_unlike' });
    out.push(makePersona({
      id: 'fam-held-osc',
      klass: 'heldout:oscillatory-nonbkt',
      latent,
      emit: oscillatoryEmit(7),
      meta: {
        approximates: 'a learns-then-forgets child (oscillatory competence, NOT BKT)',
        mightMiss: 'true retention-interval forgetting (period is synthetic, not time-based)',
      },
    }));
  }

  // bimodal member — engaged/checked-out mixture.
  {
    const rng = personaRng('heldout-lineage:bimodal', 9000, 1);
    const latent = drawLatent(rng, HELDOUT_RANGES, { misconception: 'forced_leftover' });
    out.push(makePersona({
      id: 'fam-held-bimodal',
      klass: 'heldout:bimodal-nonbkt',
      latent,
      emit: bimodalEmit(),
      meta: {
        approximates: 'an attention-bimodal child (two latent modes, NOT a single BKT posterior)',
        mightMiss: 'gradual within-session drift between the two modes',
      },
    }));
  }

  // fluency-spoofer member — reliably correct yet shallow (latent PINNED < τ), so the
  // engine false-masters it. This is the held-out family's false-mastery signal: the
  // sealed judge needs a real defect to certify any fm fix (a defect-free held-out set
  // can't measure improvement). NON-BKT (correctness decoupled from a BKT posterior)
  // and latent-disjoint from train (drawn learnRate/pSlip exceed the train maxima).
  {
    const rng = personaRng('heldout-lineage:fluency', 9000, 2);
    const latent = drawLatent(rng, HELDOUT_RANGES, {
      misconception: 'add_across_unlike',
      // override the drawn truePknownDefault to GUARANTEE it sits below τ=0.8 (still
      // within the held-out [0.62,0.9] range, so disjoint from train [0.25,0.6]).
      truePknownDefault: 0.7,
    });
    out.push(makePersona({
      id: 'fam-held-fluency-spoofer',
      klass: 'heldout:fluency-spoofer-nonbkt',
      latent,
      emit: fluencySpoofEmit(),
      meta: {
        approximates: 'a fluent-but-shallow child (reliably correct, never truly masters)',
        mightMiss: 'a child whose surface fluency genuinely reflects mastery (we pin latent < τ)',
      },
    }));
  }

  return out;
}
