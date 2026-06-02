// subSameDen.js — SUB_SAME_DEN (s1): s/d - t/d = (s-t)/d, with t < s.
//
// Surface forms: 'part_minus_part' (s < d — a fraction take away a fraction) vs
// 'whole_minus_part' (s === d — starting from a full whole, e.g. 8/8 - 3/8). The
// whole-minus-part case is where children forget the top of a whole is d, not 1.
import { rngFor, randInt, pick, tierForLevel, resolveSurfaceForm } from './core.js';

export const SKILL = 'SUB_SAME_DEN';
export const SURFACE_FORMS = ['part_minus_part', 'whole_minus_part'];

const DENS = [
  [4, 5, 6],      // tier 0
  [6, 7, 8],      // tier 1
  [8, 9, 10, 12], // tier 2
];

export function generate({ level = 0, index = 0, surfaceForm } = {}) {
  const rng = rngFor(SKILL, index);
  const tier = tierForLevel(level);
  const form = resolveSurfaceForm(SURFACE_FORMS, surfaceForm, index);
  const den = pick(rng, DENS[tier]);

  const s = form === 'whole_minus_part' ? den : randInt(rng, 2, den - 1);
  const t = randInt(rng, 1, s - 1);

  return {
    skill: SKILL,
    level,
    surfaceForm: form,
    index,
    operands: { start: { num: s, den }, take: { num: t, den }, den },
    answer: { num: s - t, den },
    prompt: `${s}/${den} − ${t}/${den}`,
  };
}
