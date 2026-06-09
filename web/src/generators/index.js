// generators/index.js — the public registry. One generator per engine skill node
// (graph.ts ids). A lesson asks for a problem by its skill id, scaffold level, and
// a monotonically increasing index (attempt count); the engine can pin a
// surfaceForm to force a TransferProbe.
//
//   import { generateFor } from './generators/index.js';
//   const prob = generateFor('SIMPLIFY', { level, index, surfaceForm });
//
// Every generator is pure + deterministic (see core.js). `surfaceFormsFor` lets a
// caller enumerate a skill's structural variants (e.g. to pick a DIFFERENT one for
// transfer than the learner just saw).
import * as addSameDen from './addSameDen.js';
import * as addUnlikeCoprime from './addUnlikeCoprime.js';
import * as addUnlikeNested from './addUnlikeNested.js';
import * as simplify from './simplify.js';
import * as improperToMixed from './improperToMixed.js';
import * as multEqualGroups from './multEqualGroups.js';
import * as multArrays from './multArrays.js';
import * as multFacts from './multFacts.js';
import * as fractionOnLine from './fractionOnLine.js';
import * as subSameDen from './subSameDen.js';
import * as compareBenchmark from './compareBenchmark.js';
import { problemIdFor } from './core.js';

const MODULES = [
  addSameDen,
  addUnlikeCoprime,
  addUnlikeNested,
  simplify,
  improperToMixed,
  multEqualGroups,
  multArrays,
  multFacts,
  fractionOnLine,
  subSameDen,
  compareBenchmark,
];

const REGISTRY = new Map(MODULES.map((m) => [m.SKILL, m]));

/** True if a generator exists for this skill id. */
export function hasGenerator(skill) {
  return REGISTRY.has(skill);
}

/** All skill ids that have a generator. */
export function generatorSkills() {
  return [...REGISTRY.keys()];
}

/** The structural surface forms a skill can present (for transfer selection). */
export function surfaceFormsFor(skill) {
  const m = REGISTRY.get(skill);
  return m ? m.SURFACE_FORMS.slice() : [];
}

/**
 * Generate one validated problem variation.
 *
 * @param {string} skill   engine skill node id (e.g. 'SIMPLIFY')
 * @param {object} spec    { level?: 0..4, index?: number, surfaceForm?: string }
 * @returns {object}       GeneratedProblem (see core.js envelope)
 * @throws if no generator is registered for `skill`
 */
export function generateFor(skill, spec = {}) {
  const m = REGISTRY.get(skill);
  if (!m) throw new Error(`No problem generator for skill "${skill}"`);
  const prob = m.generate(spec);
  // Attach a stable problem_id so the engine's independence check can count
  // distinct problems structurally (not by answer value). Additive — every
  // generator gets it without per-generator edits.
  if (prob && prob.problem_id === undefined) {
    prob.problem_id = problemIdFor(
      skill,
      prob.level,
      prob.surfaceForm,
      spec.index ?? prob.index ?? 0
    );
  }
  return prob;
}
