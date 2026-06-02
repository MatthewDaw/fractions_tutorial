// generators/core.js — shared kernel for the auto-generated practice layer.
//
// WHY THIS EXISTS:
//   Today every lesson hardcodes one fixed example (2/7+3/7, 8/12→2/3, …). The
//   measurement engine already decides WHEN to give another problem, fade, raise,
//   or test transfer — but the lessons have no supply of fresh problems to hand
//   it. These generators are that supply: per-skill pure functions that emit
//   unlimited VALIDATED variations, classified by surface-form for transfer
//   measurement, parameterized by scaffold level + difficulty.
//
// CONTRACT EVERY GENERATOR FOLLOWS:
//   generate({ level, index, surfaceForm? }) -> GeneratedProblem
//     • PURE + DETERMINISTIC: same (skill, level, index) → same problem. No
//       Date.now()/Math.random() — randomness comes from a seeded PRNG keyed by
//       (skill, index), so a replayed session reproduces the exact problem stream
//       (mirrors the engine's KTD9 replay discipline).
//     • CORRECT BY CONSTRUCTION: the generator computes the answer itself from the
//       operands it chose, so a generated problem is never wrong (the brief's
//       non-negotiable content-correctness, via constrained generation).
//     • level (0..4) maps to difficulty: low = friendly numbers + the canonical
//       shape; high = bigger denominators, improper results, and the misconception
//       traps. surfaceForm (optional) forces a structurally-distinct variant for a
//       TransferProbe; omitted → the generator rotates forms by index.
//
// GeneratedProblem envelope (skill-specific fields under `operands`/`answer`):
//   { skill, level, surfaceForm, index, operands, answer, prompt }

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) + string hash — replay-safe randomness
// ---------------------------------------------------------------------------

/** mulberry32 — tiny, fast, deterministic PRNG. Returns a () => [0,1) function. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a 32-bit string hash — turns a skill id into a stable seed. */
export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A PRNG seeded deterministically by (skill, index). */
export function rngFor(skill, index) {
  const seed = (hashStr(skill) ^ Math.imul((index | 0) + 1, 2654435761)) >>> 0;
  return makeRng(seed);
}

// ---------------------------------------------------------------------------
// Small numeric helpers
// ---------------------------------------------------------------------------

/** Inclusive integer in [min, max]. */
export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Pick one element of a non-empty array. */
export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

/** Greatest common divisor (Euclid). */
export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

/** Least common multiple. */
export function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

/** Are a and b coprime? */
export function coprime(a, b) {
  return gcd(a, b) === 1;
}

/**
 * Map a scaffold level (0..4) to a difficulty tier (0..2):
 *   L0/L1 → tier 0 (friendliest numbers, canonical shape)
 *   L2/L3 → tier 1 (mid)
 *   L4    → tier 2 (largest numbers, traps, transfer)
 * Generators read the tier to choose number pools; keeping the mapping here means
 * the whole library shares one notion of "harder".
 */
export function tierForLevel(level) {
  const l = Number.isFinite(level) ? level : 0;
  if (l <= 1) return 0;
  if (l <= 3) return 1;
  return 2;
}

/**
 * Choose a surface form: honor an explicit request (TransferProbe), else rotate
 * deterministically by index so a run of problems alternates structural shapes.
 */
export function resolveSurfaceForm(forms, requested, index) {
  if (requested && forms.includes(requested)) return requested;
  return forms[((index | 0) % forms.length + forms.length) % forms.length];
}

/**
 * Stable, replay-safe problem identifier from the dimensions that define a
 * distinct generated problem. The engine's independence check uses this to count
 * truly distinct problems instead of the answer_value proxy (two problems with the
 * same numeric answer must still count as two). Deterministic — no Date.now()/
 * Math.random(), mirroring the seeded-PRNG replay discipline above.
 */
export function problemIdFor(skill, level, surfaceForm, index) {
  return `${skill}:${level}:${surfaceForm}:${index}`;
}
