// addSameDen.js — ADD_SAME_DEN (R1): a/d + b/d = (a+b)/d.
//
// The denominator is shared and stays locked; only the tops are counted. The
// structural variant that matters for transfer is whether the sum stays UNDER a
// whole or lands exactly ON a whole — children who add tops mechanically often
// stumble when a+b == d (is it d/d? is it 1?). So that is the second surface form.
import { rngFor, randInt, pick, tierForLevel, resolveSurfaceForm } from './core.js';

export const SKILL = 'ADD_SAME_DEN';
export const SURFACE_FORMS = ['proper', 'makes_whole'];

// Denominator pools widen with difficulty.
const DEN_POOL = [
  [4, 5, 6],        // tier 0
  [6, 7, 8, 9],     // tier 1
  [8, 9, 10, 12],   // tier 2
];

export function generate({ level = 0, index = 0, surfaceForm } = {}) {
  const rng = rngFor(SKILL, index);
  const tier = tierForLevel(level);
  const form = resolveSurfaceForm(SURFACE_FORMS, surfaceForm, index);
  const den = pick(rng, DEN_POOL[tier]);

  let a;
  let b;
  if (form === 'makes_whole') {
    // a + b === den (sum is exactly one whole).
    a = randInt(rng, 1, den - 1);
    b = den - a;
  } else {
    // proper: a + b < den (sum stays under one whole).
    a = randInt(rng, 1, den - 2);
    b = randInt(rng, 1, den - 1 - a);
  }

  return {
    skill: SKILL,
    level,
    surfaceForm: form,
    index,
    operands: { a: { num: a, den }, b: { num: b, den }, den },
    answer: { num: a + b, den },
    prompt: `${a}/${den} + ${b}/${den}`,
  };
}
