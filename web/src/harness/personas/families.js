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
 * At-scaffold-disengaged law (NON-BKT): a surface-fluent child who checks out
 * (idle signals) whenever scaffold increases. Correctness is HIGH regardless of
 * latent skill (pattern recognition, not BKT posterior), but truePKnown grows
 * VERY SLOWLY via a hardcoded micro-learning rate (0.025/correct) — far below the
 * held-out learnRate range [0.13, 0.25] which stays in the latent object for
 * disjointness but is NOT used by this emit.
 *
 * The key mechanic that makes this a genuine frustration-scaffold test case:
 *
 *   flags-OFF (frustrationScaffold=false): idle signals at scaffold>0 are ignored
 *     by the engine. FadeScaffold fires quickly (3 clean corrects). Gate opens at
 *     step ~9 while truePKnown ≈ 0.769 < τ=0.80 → FALSE MASTERY.
 *
 *   flags-ON (frustrationScaffold=true): disengagedScaffoldCount arms the 3b
 *     RaiseScaffold path. Gate opening is DELAYED to step ~18, by which point
 *     truePKnown has grown to ≈ 0.807 ≥ τ=0.80 via micro-learning → NO false
 *     mastery. The frustration-scaffold path PREVENTED false mastery.
 *
 * transfer_after_fade is TRUE in BOTH conditions (gate opens after a fade in both),
 * so the novel-form transfer guardrail is unaffected. This is the held-out defect
 * that certifies frustrationScaffold as REAL (T20).
 *
 * NON-BKT: correctness is decoupled from the BKT posterior (pattern recognition,
 * not learned conditional). Latent truePKnown is updated by the emit (not by BKT),
 * at a micro-rate (0.025) to simulate very slow genuine mastery accrual.
 */
function atScaffoldDisengagedEmit() {
  // Micro-learning rate: truePKnown grows slowly per correct attempt.
  // Deliberately NOT latent.learnRate (which is held-out-range [0.13,0.25] for
  // disjointness, but would learn too fast for this mechanic). The emit owns the
  // learning update for this persona.
  const MICRO_LEARN_RATE = 0.025;
  return function emit(problem, ctx, env) {
    const { latent, session } = env;
    const rng = ctx.rng;
    const skillId = ctx.skillId;

    // Track scaffold level internally (mirrors sessionRunner: Fade +1, Raise -1).
    if (session._trackedScaffold === undefined) session._trackedScaffold = 0;
    if (ctx.lastDecision) {
      if (ctx.lastDecision.kind === 'FadeScaffold') {
        session._trackedScaffold = Math.min(4, session._trackedScaffold + 1);
      } else if (ctx.lastDecision.kind === 'RaiseScaffold') {
        session._trackedScaffold = Math.max(0, session._trackedScaffold - 1);
      }
    }

    // NON-BKT correctness: surface pattern-recognition (not BKT posterior).
    // High correct rate so the engine's P_known climbs and gate eventually opens.
    const correct = chance(rng, 0.85) ? !chance(rng, latent.pSlip) : chance(rng, latent.pGuess);

    // Micro-learning: emit owns the truePKnown update (slow accumulation).
    // This is what allows the persona to escape false mastery with flags-ON:
    // the 3b delay gives enough correct reps for truePKnown to cross τ.
    if (correct) {
      const cur = session.pknownBySkill[skillId] ?? latent.truePknownDefault;
      session.pknownBySkill[skillId] = clamp01(cur + MICRO_LEARN_RATE * (1 - cur));
    }

    const answer = correct
      ? correctAnswerValue(problem)
      : plantWrong(skillId, problem, latent, rng);

    // In-band latency: 2500-4000ms (comfortably above 1200ms floor, below 8000ms hard-mode ceiling).
    const latencyMs = Math.round(2500 + rng() * 1500 + session.step * 30);

    // Disengagement signal: emitted at HIGH probability when scaffold > 0 (child
    // checks out once the difficulty increases). At scaffold=0 the child is engaged.
    // This is the idle-signal pattern the frustration-scaffold 3b path responds to:
    //   - flags-OFF: engine ignores these signals → FadeScaffold fires quickly
    //   - flags-ON: disengagedScaffoldCount arms 3b → RaiseScaffold delays gate
    const atHigherScaffold = session._trackedScaffold > 0;
    const pIdle = atHigherScaffold ? 0.70 : 0.05;
    const signals = chance(rng, pIdle)
      ? [{ type: 'idle', confidence: 0.65 + rng() * 0.25 }]
      : [];

    return {
      answer,
      latencyMs,
      hintRung: 0,        // no hints (surface fluency, not scaffold-climbing)
      selfCorrections: 0,
      modality: latent.modality || 'tap',
      signals,
    };
  };
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

  // at-scaffold-disengaged member — surface-fluent with slow latent learning.
  // truePknownDefault=0.71 (within held-out [0.62,0.9], below τ=0.80).
  // With frustrationScaffold OFF the gate opens quickly (step ~9) before
  // truePKnown exceeds τ → false mastery. With frustrationScaffold ON the
  // 3b RaiseScaffold loop delays gate opening to step ~18 by which time
  // truePKnown has grown to ≈0.807 ≥ τ → no false mastery.
  // TAF=true in BOTH conditions, so the transfer_after_fade guardrail is
  // unaffected. This is the held-out certification signal for frustrationScaffold.
  {
    const rng = personaRng('heldout-lineage:at-scaffold-disengaged', 9000, 3);
    const latent = drawLatent(rng, HELDOUT_RANGES, {
      misconception: 'add_denominators',
      truePknownDefault: 0.71,  // below τ=0.80, within held-out [0.62,0.9]
    });
    out.push(makePersona({
      id: 'fam-held-at-scaffold-disengaged',
      klass: 'heldout:at-scaffold-disengaged-nonbkt',
      latent,
      emit: atScaffoldDisengagedEmit(),
      meta: {
        approximates: 'a child who disengages when scaffold increases (surface-fluent, slowly mastering)',
        mightMiss: 'a child who disengages at lower scaffolds or re-engages immediately',
      },
    }));
  }

  return out;
}
