// harness/rng.js — deterministic, replay-exact persona randomness.
//
// Reuses the generators' mulberry32/hashStr PRIMITIVES (generators/core.js) but
// defines its OWN personaRng(persona_id, seed, step) — it does NOT reuse core.js's
// rngFor(skill, index), whose 2-arg signature differs and whose name must not be
// shadowed (plan U1, review S5).
import { makeRng, hashStr } from '../generators/core.js';

/**
 * A PRNG seeded deterministically by (persona_id, seed, step).
 * Same inputs → same stream, always (replay-exact).
 * @param {string} personaId
 * @param {number} seed   run seed
 * @param {number} [step] monotonic step within a session (default 0)
 * @returns {() => number} a () => [0,1) function
 */
export function personaRng(personaId, seed, step = 0) {
  const a =
    (hashStr(String(personaId)) ^
      Math.imul((seed | 0) + 1, 2654435761) ^
      Math.imul((step | 0) + 1, 40503)) >>>
    0;
  return makeRng(a);
}

/** Inclusive integer in [min, max] from an rng. */
export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Pick one element of a non-empty array. */
export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

/** Bernoulli draw: true with probability p. */
export function chance(rng, p) {
  return rng() < p;
}
