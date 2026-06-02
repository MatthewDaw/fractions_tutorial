// harness/index.js — public entry for the synthetic-learner red-team harness.
//
// Re-exports the stable surface other harness modules + the dashboard import.
// Engine binding lives in engineApi.js (the one place we touch the engine).

export * from './engineApi.js';
export { personaRng, randInt, pick, chance } from './rng.js';
export {
  canonicalize,
  canonicalStringify,
  fnv1a,
  hashObject,
  serializeSession,
  tapesToJsonl,
  jsonlToTapes,
  writeTapesFile,
  readTapesFile,
} from './tape.js';
export { makeRun, defaultFlags, paramsHash } from './config.js';
