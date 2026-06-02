// harness/oracle/invariants.js — U5: ground-truth-FREE metamorphic relations.
//
// Invariants need NO oracle/latent truth: they assert RELATIONS between re-run
// tapes (or re-folded logs) that MUST hold for any correct measurement engine,
// regardless of what the "right" answer is. A violation is a real bug in the
// engine (or the harness mirror) and is returned with the minimal differing detail.
//
// Implemented relations:
//   (a) surface-form permutation       — relabeling surface forms must not flip
//                                         the final mastery verdict.
//   (b) monotonicity                   — injecting one extra correct attempt must
//                                         never LOWER final P_known.
//   (c) strict-dominance ordering      — a uniformly-higher-slip persona must not
//                                         reach gate-open EARLIER than its twin.
//
// PURE: no wall-clock, no fs. Everything flows from the injected seed.

import { runSession } from '../sessionRunner.js';
import { personaById } from '../personas/library.js';
import { measurementReduce, appendEvent } from '../engineApi.js';

const SKILL = 'ADD_SAME_DEN';

// ---------------------------------------------------------------------------
// (a) Surface-form permutation invariant
// ---------------------------------------------------------------------------

/**
 * Wrap a persona so its emit RELABELS the surface form it reports (ctx.surfaceForm)
 * through a fixed permutation, WITHOUT touching correctness or the rng stream.
 *
 * The default persona emit ignores ctx.surfaceForm for correctness, so the gate
 * outcome MUST be invariant to this relabel. (We do not use the memorizer here —
 * it is the one persona whose competence is surface-form-bound by design.)
 */
function withPermutedSurfaceForm(persona, permute) {
  const origEmit = persona.emit;
  persona.emit = (problem, ctx) =>
    origEmit(problem, { ...ctx, surfaceForm: permute(ctx.surfaceForm) });
  return persona;
}

/** A trivial involution permutation that never affects a surface-form-blind persona. */
function identityRelabel(sf) {
  return sf === undefined ? sf : `relabeled:${sf}`;
}

function gateVerdict(tape) {
  return tape.steps.some((s) => s.gate === true);
}

function firstGateStep(tape) {
  return tape.steps.findIndex((s) => s.gate === true);
}

function surfaceFormPermutationInvariant(seed) {
  const base = runSession({ persona: personaById('fast-mastery'), skillId: SKILL, seed, stepCap: 60 });
  const permuted = runSession({
    persona: withPermutedSurfaceForm(personaById('fast-mastery'), identityRelabel),
    skillId: SKILL,
    seed,
    stepCap: 60,
  });
  const vBase = gateVerdict(base);
  const vPerm = gateVerdict(permuted);
  const held = vBase === vPerm;
  return {
    name: 'surface-form-permutation-preserves-mastery-verdict',
    held,
    evidence: held
      ? { verdict: vBase }
      : { baseVerdict: vBase, permutedVerdict: vPerm, baseFirstGate: firstGateStep(base), permutedFirstGate: firstGateStep(permuted) },
  };
}

// ---------------------------------------------------------------------------
// (b) Monotonicity invariant — one extra correct never lowers final P_known
// ---------------------------------------------------------------------------

/** Append one full attempt burst (present→submit→judged) to a log. */
function appendAttempt(log, t, correct, { scaffold = 2, latency = 3000 } = {}) {
  let next = appendEvent(log, {
    type: 'problem_present',
    payload: { node_id: SKILL, level: scaffold, scaffold_level: scaffold, surface_form: 'sf' },
    modality: 'tap', actor: 'synthetic:inv', t,
  });
  next = appendEvent(next, {
    type: 'answer_submit',
    payload: {
      node_id: SKILL, answer_value: [1, 2], answer_num: 1, answer_den: 2, modality: 'tap',
      scaffold_level: scaffold, latency_ms: latency, hint_max_rung: 0, self_corrections: 0, surface_form: 'sf',
    },
    modality: 'tap', actor: 'synthetic:inv', t: t + latency,
  });
  next = appendEvent(next, {
    type: 'judged',
    payload: {
      node_id: SKILL, correct, answer_value: [1, 2], answer_num: 1, answer_den: 2,
      error_signature: correct ? null : 'other', slip: null, target_num: 1, target_den: 2,
      operands: null, stars: correct ? 3 : 0, scaffold_level: scaffold, latency_ms: latency,
      hint_max_rung: 0, self_corrections: 0, modality: 'tap', surface_form: 'sf',
      too_fast_correct: false, affect_window: [],
    },
    modality: 'tap', actor: 'synthetic:inv', t: t + latency,
  });
  return next;
}

function monotonicityInvariant(seed) {
  // Build a deterministic mixed log (seed only selects the correctness pattern length).
  const pattern = [true, false, true, true, false]; // fixed, seed-stable
  let base = [];
  let t = 1_000_000;
  for (const c of pattern) {
    base = appendAttempt(base, t, c);
    t += 10_000;
  }
  const pBase = measurementReduce(base, t).mastery[SKILL].P_known;

  // Inject ONE extra correct attempt.
  const boosted = appendAttempt(base, t, true);
  const tEnd = t + 10_000;
  const pBoost = measurementReduce(boosted, tEnd).mastery[SKILL].P_known;

  const held = pBoost >= pBase - 1e-9;
  return {
    name: 'monotonicity-extra-correct-never-lowers-pknown',
    held,
    evidence: held
      ? { pBase, pBoost }
      : { pBase, pBoost, delta: pBoost - pBase },
  };
}

// ---------------------------------------------------------------------------
// (c) Strict-dominance ordering — higher slip must not gate-open earlier
// ---------------------------------------------------------------------------

function dominatedSlipPersona(slip) {
  const p = personaById('fast-mastery');
  p.latent.truePknownBySkill = { [SKILL]: 0.9 };
  p.latent.pSlip = slip;
  p.latent.pGuess = 0.2;
  p.latent.hintAppetite = 0;
  p.latent.latency = { base: 3000, spread: 1000, fatiguePerStep: 20 };
  return p;
}

function dominanceInvariant(seed) {
  // Two twins differing ONLY in slip: the higher-slip twin is strictly dominated.
  const strong = runSession({ persona: dominatedSlipPersona(0.02), skillId: SKILL, seed, stepCap: 60 });
  const weak = runSession({ persona: dominatedSlipPersona(0.4), skillId: SKILL, seed, stepCap: 60 });

  const gStrong = firstGateStep(strong); // -1 if never
  const gWeak = firstGateStep(weak);

  // A never-gating dominated twin (gWeak === -1) trivially satisfies "not earlier".
  const weakNotEarlier =
    gWeak === -1 || gStrong === -1 ? true : gWeak >= gStrong;

  return {
    name: 'strict-dominance-higher-slip-not-earlier-gate',
    held: weakNotEarlier,
    evidence: weakNotEarlier
      ? { strongFirstGate: gStrong, weakFirstGate: gWeak }
      : { strongFirstGate: gStrong, weakFirstGate: gWeak, violation: 'dominated twin gated earlier' },
  };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Run every metamorphic invariant against the current engine.
 *
 * @param {object} [opts]
 *   @param {number} [opts.seed=1]  seed lineage for all relation re-runs.
 * @returns {Array<{ name:string, held:boolean, evidence:object }>}
 */
export function checkInvariants({ seed = 1 } = {}) {
  return [
    surfaceFormPermutationInvariant(seed),
    monotonicityInvariant(seed),
    dominanceInvariant(seed),
  ];
}
