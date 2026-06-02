// harness/engineApi.js — the harness's single bind point to the engine's PUBLIC
// API (review F4). engine/index.ts re-exports only types/PARAMS/graph/log; the
// fold/policy/gate functions live in their own modules. We re-export them here so
// the rest of the harness imports from ONE barrel and the "bind to the public API"
// claim is literal. These are the future wire DTOs (a Python relocation swaps the
// fetch at this file only).
//
// NOTE: engine files import each other with `.js` specifiers that resolve to `.ts`
// under Vite/Vitest; we follow the same convention here.

export { measurementReduce } from '../engine/measurementReduce.js';
export { nextDecision, legalMoves } from '../engine/policy.js';
export { isMastered } from '../engine/gate.js';
export {
  PARAMS,
} from '../engine/params.js';
export {
  allNodes,
  getNode,
  prereqsOf,
  mostUpstreamUnmastered,
} from '../engine/graph.js';
export { appendEvent, foldLog } from '../engine/log.js';
export { segment } from '../engine/observation.js';

// Content + flow surfaces (already public, used by the live runtime).
export {
  generateFor,
  generatorSkills,
  surfaceFormsFor,
  hasGenerator,
} from '../generators/index.js';
export { nextPractice, otherSurfaceForm } from '../runtime/practiceFlow.js';
