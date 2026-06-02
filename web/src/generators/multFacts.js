// multFacts.js — MULT_FACTS (m3): a single multiplication fact a*b.
//
// Surface forms: 'core' (both factors 2..N — ordinary recall) vs 'edge' (one
// factor is 0 or 1 — the identity/zero facts children "know" verbally but mis-fill
// in a grid). Mixing them in guards against rote skip-count pattern-matching.
import { rngFor, randInt, pick, tierForLevel, resolveSurfaceForm } from './core.js';

export const SKILL = 'MULT_FACTS';
export const SURFACE_FORMS = ['core', 'edge'];

const HI = [5, 9, 12]; // top factor by tier

export function generate({ level = 0, index = 0, surfaceForm } = {}) {
  const rng = rngFor(SKILL, index);
  const tier = tierForLevel(level);
  const form = resolveSurfaceForm(SURFACE_FORMS, surfaceForm, index);
  const hi = HI[tier];

  let a;
  let b;
  if (form === 'edge') {
    a = randInt(rng, 2, hi);
    b = pick(rng, [0, 1]);
    if (rng() < 0.5) [a, b] = [b, a]; // edge factor can lead
  } else {
    a = randInt(rng, 2, hi);
    b = randInt(rng, 2, hi);
  }

  return {
    skill: SKILL,
    level,
    surfaceForm: form,
    index,
    operands: { a, b },
    answer: { product: a * b },
    prompt: `${a} × ${b}`,
  };
}
