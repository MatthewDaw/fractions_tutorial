// improperToMixed.js — IMPROPER_TO_MIXED (R5): present (w*d + r)/d; the answer is
// the mixed number w and r/d.
//
// Surface forms: 'with_remainder' (r > 0 — the canonical w r/d, e.g. 9/7 → 1 2/7)
// vs 'exact_whole' (r === 0 — the trap, e.g. 14/7 → 2 with NO leftover, which
// children routinely mis-write as 2 0/7 or forget). exact_whole is the transfer
// case that proves they understand the division, not a memorized template.
import { rngFor, randInt, pick, tierForLevel, resolveSurfaceForm } from './core.js';

export const SKILL = 'IMPROPER_TO_MIXED';
export const SURFACE_FORMS = ['with_remainder', 'exact_whole'];

const CONFIG = [
  { wholes: [1, 2], dens: [2, 3, 4] },     // tier 0
  { wholes: [1, 2, 3], dens: [3, 4, 5, 6] }, // tier 1
  { wholes: [2, 3], dens: [5, 6, 7, 8] },   // tier 2
];

export function generate({ level = 0, index = 0, surfaceForm } = {}) {
  const rng = rngFor(SKILL, index);
  const tier = tierForLevel(level);
  const form = resolveSurfaceForm(SURFACE_FORMS, surfaceForm, index);
  const cfg = CONFIG[tier];

  const w = pick(rng, cfg.wholes);
  const d = pick(rng, cfg.dens);
  const r = form === 'exact_whole' ? 0 : randInt(rng, 1, d - 1);

  return {
    skill: SKILL,
    level,
    surfaceForm: form,
    index,
    operands: { num: w * d + r, den: d },
    answer: { whole: w, num: r, den: d }, // mixed number; r === 0 means a bare whole
    prompt: `${w * d + r}/${d} = ?`,
  };
}
