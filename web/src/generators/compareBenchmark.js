// compareBenchmark.js — COMPARE_BENCHMARK (cmp): order two fractions, or compare
// one to the 1/2 benchmark.
//
// Surface forms: 'same_den' (a/d vs b/d — compare the tops, the gentle case) vs
// 'benchmark_half' (a/d vs 1/2 — reason about half, the transfer that proves they
// reason about size, not just bigger-top-wins). Answers are exact relations.
import { rngFor, randInt, pick, tierForLevel, resolveSurfaceForm } from './core.js';

export const SKILL = 'COMPARE_BENCHMARK';
export const SURFACE_FORMS = ['same_den', 'benchmark_half'];

const DENS = [
  [3, 4, 6],      // tier 0
  [4, 6, 8],      // tier 1
  [5, 6, 8, 10],  // tier 2
];

export function generate({ level = 0, index = 0, surfaceForm } = {}) {
  const rng = rngFor(SKILL, index);
  const tier = tierForLevel(level);
  const form = resolveSurfaceForm(SURFACE_FORMS, surfaceForm, index);
  const den = pick(rng, DENS[tier]);

  if (form === 'benchmark_half') {
    // Compare a/den to 1/2. Exact: 2a vs den.
    let a = randInt(rng, 1, den - 1);
    if (2 * a === den) a += a < den - 1 ? 1 : -1; // avoid trivial equals at tier 0
    const rel = 2 * a < den ? 'less' : 2 * a > den ? 'more' : 'equal';
    return {
      skill: SKILL,
      level,
      surfaceForm: form,
      index,
      operands: { fraction: { num: a, den }, benchmark: { num: 1, den: 2 } },
      answer: { rel }, // 'less' | 'more' | 'equal' vs one half
      prompt: `${a}/${den} ? 1/2`,
    };
  }

  // same_den: a/den vs b/den, a !== b.
  let a = randInt(rng, 1, den - 1);
  let b = randInt(rng, 1, den - 1);
  while (b === a) b = randInt(rng, 1, den - 1);
  const rel = a < b ? '<' : '>';
  return {
    skill: SKILL,
    level,
    surfaceForm: form,
    index,
    operands: { a: { num: a, den }, b: { num: b, den } },
    answer: { rel }, // '<' | '>'
    prompt: `${a}/${den} ? ${b}/${den}`,
  };
}
