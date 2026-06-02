// harness/search.js — U8: adversarial search for the nearest DECISION-FLIP.
//
// This is the red-team's "find the closest plausible child the engine misjudges"
// search. Given an HONEST baseline persona, it perturbs the persona's LATENT
// vector + run seed inside a PLAUSIBILITY BOX and drives the REAL engine (via
// runSession) until it finds a latent that FLIPS an engine decision against the
// oracle's latent truth — minimizing the distance from the honest baseline.
//
// Two objectives (both are decision FLIPS labelTape already detects):
//   falseMastery     — the engine opens the mastery gate while the persona's
//                      latent truth is still below τ (falsePositiveMastery).
//   missedEscalation — the persona is latently stuck (low + flat) and the
//                      reachable STUCK conditions hold, yet the engine never
//                      EscalateToHuman (missedEscalation).
//
// METHOD (Open Q3): a LIGHT, gradient-free (μ,λ) evolutionary loop — NOT CMA-ES.
// Each generation keeps the μ best candidates (by a fitness that maximizes the
// flip while minimizing distance-to-honest) and spawns λ children by Gaussian
// mutation of the latent vector + a seed jitter, every perturbation CLIPPED back
// into the plausibility box. All randomness flows from personaRng(seed) so a
// reported { latent, seed } REPLAYS the exact flip.
//
// The plausibility box is the harness's credibility contract: a "child" the
// engine misjudges only matters if the child is PLAUSIBLE. pSlip<0.5 and
// pGuess<0.5 (a learner who slips/guesses more than half the time is not a
// coherent learner), learnRate/truePknown∈[0,1], and the box is roughly monotone
// (we never search a child who is MORE likely correct when they know LESS).

import { runSession } from './sessionRunner.js';
import { personaById } from './personas/library.js';
import { makePersona } from './personas/model.js';
import { labelTape, DEFAULT_TAU_LATENT } from './oracle/latentTruth.js';
import { personaRng } from './rng.js';

// ---------------------------------------------------------------------------
// The searchable latent vector + its PLAUSIBILITY BOX.
// ---------------------------------------------------------------------------
//
// Each dim is a scalar latent the persona's default emit reads. `lo`/`hi` are the
// box edges; `step` is the Gaussian mutation sigma in raw units. The box is the
// SINGLE place plausibility is enforced — projectToBox() clips every candidate
// here, so no search step can ever leave it (the test asserts pGuess never ≥ 0.5).

export const LATENT_DIMS = Object.freeze([
  // P(known) the child starts with — the lever that opens the gate falsely.
  { key: 'truePknownDefault', lo: 0.0, hi: 1.0, step: 0.12 },
  // how fast a correct attempt lifts true P(known) toward 1.
  { key: 'learnRate', lo: 0.0, hi: 1.0, step: 0.08 },
  // P(careless wrong) on a known skill — capped well under 1/2 (a "knower" who is
  // wrong most of the time is not a knower).
  { key: 'pSlip', lo: 0.0, hi: 0.499, step: 0.06 },
  // P(lucky correct) on an UNKNOWN skill — capped under 1/2 (a guesser who is
  // right most of the time is, definitionally, not guessing).
  { key: 'pGuess', lo: 0.0, hi: 0.499, step: 0.06 },
  // how entrenched the misconception is (drives structured wrong answers).
  { key: 'misconceptionStrength', lo: 0.0, hi: 1.0, step: 0.1 },
  // appetite for hints — the lever that drives the heavy-hint STUCK escalation.
  { key: 'hintAppetite', lo: 0.0, hi: 1.0, step: 0.1 },
]);

/** The hard plausibility ceilings the box must NEVER exceed (asserted by tests). */
export const PLAUSIBILITY_CEILINGS = Object.freeze({ pSlip: 0.5, pGuess: 0.5 });

/** Read the searchable latent vector out of a persona spec's latent block. */
function vectorFromLatent(latent) {
  const v = {};
  for (const d of LATENT_DIMS) {
    const raw = latent && typeof latent[d.key] === 'number' ? latent[d.key] : (d.lo + d.hi) / 2;
    v[d.key] = clamp(raw, d.lo, d.hi);
  }
  return v;
}

/** Clip a candidate vector back inside the plausibility box (every dim). */
function projectToBox(v) {
  const out = {};
  for (const d of LATENT_DIMS) {
    out[d.key] = clamp(typeof v[d.key] === 'number' ? v[d.key] : (d.lo + d.hi) / 2, d.lo, d.hi);
  }
  // Roughly-monotone guard: a child cannot be MORE likely to slip when known than
  // to guess right when unknown would invert the "knowing helps" ordering. We do
  // not couple the two dims (that would shrink the box arbitrarily); the per-dim
  // ceilings above already keep both under 1/2, preserving knowing > guessing.
  return out;
}

/** L2-ish distance over the bounded latent dims, NORMALIZED per dim to [0,1]. */
export function distanceToHonest(candidate, honest) {
  let sum = 0;
  for (const d of LATENT_DIMS) {
    const span = d.hi - d.lo || 1;
    const a = (clamp(candidate[d.key] ?? d.lo, d.lo, d.hi) - d.lo) / span;
    const b = (clamp(honest[d.key] ?? d.lo, d.lo, d.hi) - d.lo) / span;
    const delta = a - b;
    sum += delta * delta;
  }
  return Math.sqrt(sum);
}

// ---------------------------------------------------------------------------
// Candidate evaluation — build a persona from a latent vector, run a session,
// label the tape, read the requested flip signal.
// ---------------------------------------------------------------------------

const OBJECTIVES = Object.freeze({
  falseMastery: 'falsePositiveMastery',
  missedEscalation: 'missedEscalation',
});

/**
 * Materialize a fresh persona whose latent is the baseline spec's latent with the
 * searched vector dims overwritten. A FRESH persona per eval (no state leak).
 */
function personaForVector(baseSpec, vector) {
  return makePersona({
    id: baseSpec.id,
    klass: baseSpec.klass,
    meta: baseSpec.meta,
    latent: { ...baseSpec.latent, ...vector },
    emit: baseSpec.emit, // honor a bespoke emit if the baseline carried one
  });
}

/**
 * Evaluate one candidate { vector, seed } against the objective.
 * @returns {{ flip:boolean, flipKind:string|null, tape:object, label:object }}
 */
function evaluate(baseSpec, skillId, vector, seed, stepCap, tauLatent, objectiveKey) {
  const persona = personaForVector(baseSpec, vector);
  const tape = runSession({ persona, skillId, seed, stepCap });
  const label = labelTape(tape, { tauLatent });
  const labelKey = OBJECTIVES[objectiveKey];
  const flip = !!label.labels[labelKey];
  return { flip, flipKind: flip ? objectiveKey : null, tape, label };
}

// ---------------------------------------------------------------------------
// (μ,λ) evolutionary loop.
// ---------------------------------------------------------------------------

/**
 * Fitness: prefer FLIPPING candidates, and among flippers prefer the one nearest
 * to honest. Among non-flippers, prefer the one CLOSEST to becoming a flip — we
 * proxy "closeness to a flip" with a soft pressure that grows the flip levers
 * (gate-opening for falseMastery, hint appetite at floor for missedEscalation)
 * while keeping distance low. Lower fitness is BETTER (we minimize).
 */
function fitness(distance, flip) {
  // Flippers always beat non-flippers (the −1 offset dominates any distance in
  // [0, √dims]); among flippers, nearer-to-honest wins on the distance term.
  return (flip ? 0 : 1) * 1000 + distance;
}

/** Mutate a vector by per-dim Gaussian noise (sigma = dim.step), then project. */
function mutate(vector, rng) {
  const out = {};
  for (const d of LATENT_DIMS) {
    const base = typeof vector[d.key] === 'number' ? vector[d.key] : (d.lo + d.hi) / 2;
    out[d.key] = base + gaussian(rng) * d.step;
  }
  return projectToBox(out);
}

/** Box-Muller standard normal from a uniform rng. */
function gaussian(rng) {
  let u = 0;
  let w = 0;
  // avoid log(0)
  do { u = rng(); } while (u <= 1e-9);
  w = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w);
}

/**
 * searchNearestFlip — find the latent NEAREST to the honest baseline that flips
 * the requested engine decision, with a replayable seed.
 *
 * @param {object} args
 *   @param {object|string} args.baseSpec   the HONEST baseline: a persona spec
 *          ({ id, klass, meta, latent, emit? }) or a library persona id string.
 *          Its latent is the "honest" anchor distance is measured from.
 *   @param {string} args.skillId
 *   @param {'falseMastery'|'missedEscalation'} [args.objective='falseMastery']
 *   @param {number} [args.seed=1]          base seed for the search RNG + sessions.
 *   @param {number} [args.generations=8]
 *   @param {number} [args.mu=3]            parents kept per generation.
 *   @param {number} [args.lambda=8]        children spawned per generation.
 *   @param {number} [args.stepCap=40]
 *   @param {number} [args.tauLatent=DEFAULT_TAU_LATENT]
 * @returns {{ found:boolean, latent:object|null, seed:number|null,
 *             distanceToHonest:number|null, flipKind:string|null, tape:object|null,
 *             honest:object, generationsRun:number, evaluations:number }}
 */
export function searchNearestFlip({
  baseSpec,
  skillId,
  objective = 'falseMastery',
  seed = 1,
  generations = 8,
  mu = 3,
  lambda = 8,
  stepCap = 40,
  tauLatent = DEFAULT_TAU_LATENT,
}) {
  const spec = resolveSpec(baseSpec);
  if (!spec) throw new Error('searchNearestFlip: baseSpec did not resolve to a persona spec');
  if (!skillId) throw new Error('searchNearestFlip: skillId is required');
  if (!(objective in OBJECTIVES)) {
    throw new Error(`searchNearestFlip: unknown objective "${objective}"`);
  }

  const honest = vectorFromLatent(spec.latent);
  // A small candidate seed pool the search jitters over (replayable per (seed,step)).
  const seedRng = personaRng(`search:${spec.id}:${skillId}:${objective}`, seed, 0);

  let evaluations = 0;
  let best = null; // { vector, seed, distance, flip, flipKind, tape }

  // Seed the population: the honest anchor itself (seed s0) + (mu-1) box-uniform
  // draws, so generation 0 already probes both "is honest itself a flip?" and the
  // wider box.
  let parents = [];
  parents.push(makeCandidate(spec, skillId, honest, seed, stepCap, tauLatent, objective));
  evaluations += 1;
  for (let k = 1; k < Math.max(1, mu); k++) {
    const v = projectToBox(boxUniform(seedRng));
    const s = jitterSeed(seed, seedRng);
    parents.push(makeCandidate(spec, skillId, v, s, stepCap, tauLatent, objective));
    evaluations += 1;
  }
  parents = rank(parents, honest);
  best = bestFlipperOrTop(parents, best);

  let generationsRun = 0;
  for (let g = 0; g < generations; g++) {
    generationsRun = g + 1;
    const genRng = personaRng(`search:${spec.id}:${skillId}:${objective}:gen`, seed, g + 1);
    const children = [];
    for (let i = 0; i < lambda; i++) {
      const parent = parents[i % parents.length];
      const childVec = mutate(parent.vector, genRng);
      // jitter the seed half the time so we explore seed-sensitivity too.
      const childSeed = genRng() < 0.5 ? parent.seed : jitterSeed(seed, genRng);
      children.push(makeCandidate(spec, skillId, childVec, childSeed, stepCap, tauLatent, objective));
      evaluations += 1;
    }
    // (μ,λ): select the next μ parents from the CHILDREN (comma strategy), but keep
    // the global best so a found flip is never lost (elitism on the champion only).
    parents = rank(children, honest).slice(0, Math.max(1, mu));
    best = bestFlipperOrTop(parents, best);

    // Early exit: once we have a flip AND a full generation failed to find a closer
    // one, the nearest within the box is unlikely to improve — stop.
    if (best && best.flip) {
      const closerChild = parents.find((c) => c.flip && c.distance < best.distance - 1e-9);
      if (!closerChild) break;
      best = closerChild;
    }
  }

  if (best && best.flip) {
    return {
      found: true,
      latent: { ...spec.latent, ...best.vector },
      seed: best.seed,
      distanceToHonest: best.distance,
      flipKind: best.flipKind,
      tape: best.tape,
      honest: { ...honest },
      generationsRun,
      evaluations,
    };
  }

  // Honest negative: no flip within the plausibility box.
  return {
    found: false,
    latent: null,
    seed: null,
    distanceToHonest: null,
    flipKind: null,
    tape: null,
    honest: { ...honest },
    generationsRun,
    evaluations,
  };
}

// ---------------------------------------------------------------------------
// Coverage-guided variant.
// ---------------------------------------------------------------------------

/**
 * The (decision_kind, skill, scaffold_level) tuples a single tape touches.
 * scaffold_level is read off each step's Observation (segment-derived).
 */
function tupleSetForTape(tape) {
  const tuples = new Set();
  for (const s of tape.steps || []) {
    const dk = s.decision ? s.decision.kind : null;
    const sl = s.observation ? s.observation.scaffold_level : null;
    tuples.add(`${dk}|${tape.skillId}|${sl}`);
  }
  return tuples;
}

/**
 * searchCoverage — a coverage-guided variant: KEEP any mutant that reaches a NEW
 * (decision_kind, skill, scaffold_level) tuple not yet in the corpus, and report
 * the distinct engine decision-branches hit vs a FIXED-PANEL baseline (the honest
 * persona run once with no mutation).
 *
 * @param {object} args  same shape as searchNearestFlip (objective is ignored for
 *        keeping — coverage keeps on NOVELTY, not flips — but flips are still
 *        labeled so champions can feed U9).
 * @returns {{ corpus:Array, branchesHit:number, baselineBranches:number,
 *             coverageDelta:number, tuples:string[] }}
 */
export function searchCoverage({
  baseSpec,
  skillId,
  objective = 'falseMastery',
  seed = 1,
  generations = 8,
  lambda = 8,
  stepCap = 40,
  tauLatent = DEFAULT_TAU_LATENT,
}) {
  const spec = resolveSpec(baseSpec);
  if (!spec) throw new Error('searchCoverage: baseSpec did not resolve to a persona spec');
  if (!skillId) throw new Error('searchCoverage: skillId is required');

  const honest = vectorFromLatent(spec.latent);

  // Fixed-panel baseline: the honest persona, unmutated, run once.
  const baseCand = makeCandidate(spec, skillId, honest, seed, stepCap, tauLatent, objective);
  const baselineTuples = tupleSetForTape(baseCand.tape);
  const baselineBranches = distinctBranches(baselineTuples);

  // Coverage corpus: start with the baseline, then keep any mutant that adds a NEW
  // tuple. Seeded mutation so the corpus is replayable.
  const corpus = [toCorpusEntry(baseCand)];
  const seen = new Set(baselineTuples);

  for (let g = 0; g < generations; g++) {
    const genRng = personaRng(`coverage:${spec.id}:${skillId}`, seed, g + 1);
    for (let i = 0; i < lambda; i++) {
      const childVec = mutate(honest, genRng);
      const childSeed = jitterSeed(seed, genRng);
      const cand = makeCandidate(spec, skillId, childVec, childSeed, stepCap, tauLatent, objective);
      const tuples = tupleSetForTape(cand.tape);
      let addedNew = false;
      for (const t of tuples) {
        if (!seen.has(t)) {
          seen.add(t);
          addedNew = true;
        }
      }
      if (addedNew) corpus.push(toCorpusEntry(cand));
    }
  }

  const branchesHit = distinctBranches(seen);
  return {
    corpus,
    branchesHit,
    baselineBranches,
    coverageDelta: branchesHit - baselineBranches,
    tuples: [...seen].sort(),
  };
}

/** Distinct ENGINE decision-branches = distinct decision_kinds across tuples. */
function distinctBranches(tupleSet) {
  const kinds = new Set();
  for (const t of tupleSet) kinds.add(String(t).split('|')[0]);
  return kinds.size;
}

/** A compact corpus entry (U9 consumes champions: latent + seed + flip + tuples). */
function toCorpusEntry(cand) {
  return {
    latent: cand.vector,
    seed: cand.seed,
    flip: cand.flip,
    flipKind: cand.flipKind,
    distance: cand.distance,
    run_id: cand.tape.run_id,
    tuples: [...tupleSetForTape(cand.tape)].sort(),
  };
}

// ---------------------------------------------------------------------------
// Candidate plumbing
// ---------------------------------------------------------------------------

function makeCandidate(spec, skillId, vector, seed, stepCap, tauLatent, objective) {
  const v = projectToBox(vector);
  const { flip, flipKind, tape, label } = evaluate(spec, skillId, v, seed, stepCap, tauLatent, objective);
  return {
    vector: v,
    seed,
    flip,
    flipKind,
    tape,
    label,
    distance: distanceToHonest(v, vectorFromLatent(spec.latent)),
  };
}

/** Rank candidates by fitness (lower better); stable tie-break by distance. */
function rank(cands, honest) {
  return [...cands].sort((a, b) => {
    const fa = fitness(a.distance, a.flip);
    const fb = fitness(b.distance, b.flip);
    if (fa !== fb) return fa - fb;
    return a.distance - b.distance;
  });
}

/** Track the global champion: the nearest flipper seen so far (elitism). */
function bestFlipperOrTop(rankedParents, prevBest) {
  const topFlipper = rankedParents.find((c) => c.flip) || null;
  if (topFlipper) {
    if (!prevBest || !prevBest.flip || topFlipper.distance < prevBest.distance - 1e-9) {
      return topFlipper;
    }
    return prevBest;
  }
  // no flipper yet — keep prevBest if it flipped, else the nearest non-flipper.
  if (prevBest && prevBest.flip) return prevBest;
  return rankedParents[0] || prevBest || null;
}

// ---------------------------------------------------------------------------
// utils
// ---------------------------------------------------------------------------

function clamp(x, lo, hi) {
  return x < lo ? lo : x > hi ? hi : x;
}

/** A uniform draw inside the box (per dim). */
function boxUniform(rng) {
  const v = {};
  for (const d of LATENT_DIMS) v[d.key] = d.lo + rng() * (d.hi - d.lo);
  return v;
}

/** Deterministically jitter a seed (replayable: same rng stream → same jitter). */
function jitterSeed(baseSeed, rng) {
  return ((baseSeed | 0) ^ (Math.floor(rng() * 0x7fffffff) | 0)) >>> 0;
}

/** Resolve a baseSpec arg (id string OR spec object) into a persona SPEC object. */
function resolveSpec(baseSpec) {
  if (typeof baseSpec === 'string') {
    const p = personaById(baseSpec);
    if (!p) return null;
    // a persona instance carries { id, klass, latent, meta } — usable as a spec.
    return { id: p.id, klass: p.klass, latent: { ...p.latent }, meta: p.meta };
  }
  if (baseSpec && typeof baseSpec === 'object' && baseSpec.id) {
    return { id: baseSpec.id, klass: baseSpec.klass, latent: { ...(baseSpec.latent || {}) }, meta: baseSpec.meta, emit: baseSpec.emit };
  }
  return null;
}
