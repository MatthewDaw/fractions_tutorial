// addUnlikeNested.js — ADD_UNLIKE_NESTED (R3, "Scale One"): a/ds + b/dl where the
// smaller denominator divides the larger (ds | dl). You scale the small fraction
// up to the larger denominator (no cross-multiply needed), e.g. 1/4 + 3/8.
//
// Surface forms: 'nest_x2' (dl = 2*ds — one doubling) vs 'nest_x3plus' (dl is a
// 3x+ multiple — a bigger scale, the real transfer).
import { rngFor, randInt, pick, tierForLevel, resolveSurfaceForm } from './core.js';

export const SKILL = 'ADD_UNLIKE_NESTED';
export const SURFACE_FORMS = ['nest_x2', 'nest_x3plus'];

// [smallDenPool, multiplierPool] per tier.
const CONFIG = [
  { smalls: [2, 3, 4], mults: [2] },        // tier 0
  { smalls: [2, 3, 4], mults: [2, 3] },     // tier 1
  { smalls: [3, 4, 5], mults: [2, 3, 4] },  // tier 2
];

export function generate({ level = 0, index = 0, surfaceForm } = {}) {
  const rng = rngFor(SKILL, index);
  const tier = tierForLevel(level);
  const form = resolveSurfaceForm(SURFACE_FORMS, surfaceForm, index);
  const cfg = CONFIG[tier];

  const ds = pick(rng, cfg.smalls);
  // Honor the requested form: x2 → multiplier 2; x3plus → a multiplier >= 3 from
  // the tier pool (fall back to 3 if the tier only offers 2).
  let m;
  if (form === 'nest_x2') {
    m = 2;
  } else {
    const big = cfg.mults.filter((x) => x >= 3);
    m = big.length ? pick(rng, big) : 3;
  }
  const dl = ds * m;

  const a = randInt(rng, 1, ds - 1);   // a/ds, the fraction to scale up
  const b = randInt(rng, 1, dl - 1);   // b/dl, already at the larger denominator

  // Scale a/ds up to /dl, then add tops.
  const sumNum = a * m + b;

  return {
    skill: SKILL,
    level,
    surfaceForm: form,
    index,
    operands: { a: { num: a, den: ds }, b: { num: b, den: dl }, scale: m },
    answer: { num: sumNum, den: dl }, // unreduced over the larger denominator
    prompt: `${a}/${ds} + ${b}/${dl}`,
  };
}
