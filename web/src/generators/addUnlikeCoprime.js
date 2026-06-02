// addUnlikeCoprime.js — ADD_UNLIKE_COPRIME (R2, "Cross-Multiply"): a/d1 + b/d2
// where gcd(d1,d2) === 1, so the common denominator is d1*d2 (cross-multiply).
//
// Surface forms: 'unit' (both numerators 1 — the gentlest cross-multiply, e.g.
// 1/2 + 1/3) vs 'nonunit' (numerators > 1, the real transfer, e.g. 2/3 + 3/4).
import { rngFor, randInt, pick, tierForLevel, resolveSurfaceForm, coprime } from './core.js';

export const SKILL = 'ADD_UNLIKE_COPRIME';
export const SURFACE_FORMS = ['unit', 'nonunit'];

// Coprime denominator pairs, widening with difficulty.
const PAIR_POOL = [
  [[2, 3], [2, 5], [3, 4]],            // tier 0
  [[3, 4], [3, 5], [4, 5], [2, 7]],    // tier 1
  [[4, 5], [5, 6], [3, 8], [5, 8]],    // tier 2
];

export function generate({ level = 0, index = 0, surfaceForm } = {}) {
  const rng = rngFor(SKILL, index);
  const tier = tierForLevel(level);
  const form = resolveSurfaceForm(SURFACE_FORMS, surfaceForm, index);

  // Pick a coprime pair (pools are coprime by construction; guard anyway).
  let [d1, d2] = pick(rng, PAIR_POOL[tier]);
  if (!coprime(d1, d2)) d2 += 1;

  let aNum;
  let bNum;
  if (form === 'unit') {
    aNum = 1;
    bNum = 1;
  } else {
    aNum = randInt(rng, 1, d1 - 1);
    bNum = randInt(rng, 1, d2 - 1);
  }

  // Exact sum over the common denominator d1*d2.
  const den = d1 * d2;
  const sumNum = aNum * d2 + bNum * d1;

  return {
    skill: SKILL,
    level,
    surfaceForm: form,
    index,
    operands: { a: { num: aNum, den: d1 }, b: { num: bNum, den: d2 } },
    answer: { num: sumNum, den }, // unreduced sum over d1*d2 (the cross-multiply result)
    prompt: `${aNum}/${d1} + ${bNum}/${d2}`,
  };
}
