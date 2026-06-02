// multEqualGroups.js — MULT_EQUAL_GROUPS (m1): g groups of s = g*s.
//
// Surface forms: 'canonical' (g <= s, the natural "g plates of s") vs 'commuted'
// (g > s — the SAME product read the other way). Solving both proves the child
// understands groups x size rather than memorizing one orientation.
import { rngFor, randInt, pick, tierForLevel, resolveSurfaceForm } from './core.js';

export const SKILL = 'MULT_EQUAL_GROUPS';
export const SURFACE_FORMS = ['canonical', 'commuted'];

const RANGE = [
  [2, 5],  // tier 0
  [2, 6],  // tier 1
  [2, 9],  // tier 2
];

export function generate({ level = 0, index = 0, surfaceForm } = {}) {
  const rng = rngFor(SKILL, index);
  const tier = tierForLevel(level);
  const form = resolveSurfaceForm(SURFACE_FORMS, surfaceForm, index);
  const [lo, hi] = RANGE[tier];

  let g = randInt(rng, lo, hi);
  let s = randInt(rng, lo, hi);
  // Break ties so 'commuted' (g > s) can be strict and 'canonical' (g <= s) holds.
  if (g === s) s = s > lo ? s - 1 : s + 1;
  if (form === 'canonical' && g > s) [g, s] = [s, g]; // ensure g <= s
  if (form === 'commuted' && g < s) [g, s] = [s, g];  // ensure g > s

  return {
    skill: SKILL,
    level,
    surfaceForm: form,
    index,
    operands: { groups: g, size: s },
    answer: { product: g * s },
    prompt: `${g} × ${s}`,
  };
}
