// simplify.js — SIMPLIFY (R4): present (p*k)/(q*k); the lowest-terms answer is p/q.
//
// Built by construction: pick a fraction ALREADY in lowest terms (gcd(p,q)===1),
// multiply top and bottom by k, and present that. The answer is guaranteed to be
// p/q, so the generated problem is always correct and always reducible.
//
// Surface forms: 'single_factor' (k is prime — one division reduces it, e.g.
// 4/6 → 2/3) vs 'multi_factor' (k is composite — needs more than one step or a
// bigger shared factor, e.g. 8/12 → 2/3). The latter is the transfer case.
import { rngFor, randInt, pick, tierForLevel, resolveSurfaceForm, gcd } from './core.js';

export const SKILL = 'SIMPLIFY';
export const SURFACE_FORMS = ['single_factor', 'multi_factor'];

// [lowest-terms denominator pool, multiplier pool] per tier.
const CONFIG = [
  { qs: [2, 3, 4], primes: [2, 3], composites: [4] },        // tier 0
  { qs: [3, 4, 5], primes: [2, 3], composites: [4, 6] },     // tier 1
  { qs: [4, 5, 6], primes: [3, 5], composites: [4, 6] },     // tier 2
];

export function generate({ level = 0, index = 0, surfaceForm } = {}) {
  const rng = rngFor(SKILL, index);
  const tier = tierForLevel(level);
  const form = resolveSurfaceForm(SURFACE_FORMS, surfaceForm, index);
  const cfg = CONFIG[tier];

  // Lowest-terms fraction p/q with 1 <= p < q and gcd(p,q) === 1.
  const q = pick(rng, cfg.qs);
  let p = randInt(rng, 1, q - 1);
  // Nudge to coprime (small q, so at most a couple of steps).
  let guard = 0;
  while (gcd(p, q) !== 1 && guard++ < q) p = (p % (q - 1)) + 1;
  if (gcd(p, q) !== 1) p = 1; // q is prime-safe fallback

  const k = form === 'single_factor' ? pick(rng, cfg.primes) : pick(rng, cfg.composites);

  return {
    skill: SKILL,
    level,
    surfaceForm: form,
    index,
    operands: { num: p * k, den: q * k, factor: k },
    answer: { num: p, den: q }, // lowest terms
    prompt: `${p * k}/${q * k} = ?`,
  };
}
