// fractionOnLine.js — FRACTION_ON_LINE (nl): place num/den on a number line.
//
// Surface forms: 'proper' (value < 1, lands between 0 and 1) vs 'improper'
// (value > 1, past the first whole — the transfer that proves they read the line,
// not just "count ticks to the right of zero").
import { rngFor, randInt, pick, tierForLevel, resolveSurfaceForm } from './core.js';

export const SKILL = 'FRACTION_ON_LINE';
export const SURFACE_FORMS = ['proper', 'improper'];

const DENS = [
  [2, 3, 4],     // tier 0
  [2, 3, 4, 6],  // tier 1
  [3, 4, 6, 8],  // tier 2
];

export function generate({ level = 0, index = 0, surfaceForm } = {}) {
  const rng = rngFor(SKILL, index);
  const tier = tierForLevel(level);
  const form = resolveSurfaceForm(SURFACE_FORMS, surfaceForm, index);
  const den = pick(rng, DENS[tier]);

  let num;
  if (form === 'improper') {
    // value in (1, 3): num between den+1 and 3*den, not a whole multiple.
    do {
      num = randInt(rng, den + 1, den * 3);
    } while (num % den === 0);
  } else {
    num = randInt(rng, 1, den - 1); // proper: 0 < value < 1
  }

  const whole = Math.floor(num / den);
  const rem = num % den;

  return {
    skill: SKILL,
    level,
    surfaceForm: form,
    index,
    operands: { num, den, wholes: whole + (rem > 0 ? 1 : 0) },
    answer: { num, den, whole, rem }, // exact value + its mixed reading
    prompt: `Place ${num}/${den}`,
  };
}
