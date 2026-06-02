// grade.js — grade a learner answer against a GeneratedProblem, per skill.
//
// Pure + reusable: the practice board grades with it, and the synthetic-challenger
// harness will grade with the SAME function (so "correct" means the same thing in
// the live app and the red-team runs). Returns { correct, stars, errorSignature }.
//
// Answer shapes by skill:
//   fraction  {num,den}        → ADD_SAME_DEN, ADD_UNLIKE_COPRIME/NESTED, SUB_SAME_DEN, FRACTION_ON_LINE
//   simplify  {num,den}        → SIMPLIFY (full marks ONLY in lowest terms; equal-but-not-reduced = 2★, not_simplified)
//   mixed     {whole,num,den}  → IMPROPER_TO_MIXED (exact-whole = empty/zero leftover)
//   integer   {value}          → MULT_EQUAL_GROUPS, MULT_FACTS
//   relation  {rel}            → COMPARE_BENCHMARK
import { gcd } from './core.js';

/** Cross-multiply equal value: a/b === c/d (guards zero/garbage). */
function equalValue(an, ad, bn, bd) {
  if (!(ad > 0) || !(bd > 0)) return false;
  return an * bd === bn * ad;
}

function num(x) {
  const n = typeof x === 'string' ? parseInt(x, 10) : x;
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Pull the two fraction operands out of a generator's `operands` (shapes vary:
 * {a,b}, {start,take}, {a,b,den}, or [[n,d],[n,d]]). Returns [{num,den},{num,den}]
 * or null when fewer than two fraction-shaped operands are present.
 */
function twoOperands(operands) {
  if (!operands || typeof operands !== 'object') return null;
  const list = Array.isArray(operands) ? operands : Object.values(operands);
  const ops = [];
  for (const o of list) {
    if (Array.isArray(o) && o.length >= 2) ops.push({ num: num(o[0]), den: num(o[1]) });
    else if (o && typeof o === 'object' && 'num' in o && 'den' in o) ops.push({ num: num(o.num), den: num(o.den) });
    if (ops.length === 2) break;
  }
  return ops.length === 2 ? ops : null;
}

/**
 * Classify an add/subtract wrong answer into an engine ErrorSignature, or null.
 * Detects the classic "added the bottoms too" misconception (answer = (na+nb)/(da+db)):
 * like denominators → add_denominators; unlike → add_across_unlike. This is the
 * new grading logic U4 needs — the catch-all wrong_value can't drive remediation.
 */
function classifyAddError(operands, an, ad) {
  if (!Number.isFinite(an) || !Number.isFinite(ad)) return null;
  const ops = twoOperands(operands);
  if (!ops) return null;
  const [p, q] = ops;
  if (an === p.num + q.num && ad === p.den + q.den) {
    return p.den !== q.den ? 'add_across_unlike' : 'add_denominators';
  }
  return null;
}

/**
 * @param {object} problem  a GeneratedProblem (problem.skill, problem.answer, problem.operands)
 * @param {object} answer   the learner's answer in the skill's shape
 * @returns {{ correct: boolean, stars: number, errorSignature: string|null }}
 */
export function gradeAnswer(problem, answer = {}) {
  const a = problem.answer;
  switch (problem.skill) {
    case 'SIMPLIFY': {
      // Same value as the presented fraction?
      const n = num(answer.num);
      const d = num(answer.den);
      if (!(d > 0) || !(n >= 0)) return { correct: false, stars: 0, errorSignature: null };
      const sameValue = equalValue(n, d, problem.operands.num, problem.operands.den);
      if (!sameValue) return { correct: false, stars: 0, errorSignature: 'other' };
      const lowest = gcd(n, d) === 1;
      // Engine credit gated on full reduction (anti false-positive, matches the
      // locked R4 equivalence framing); a same-amount-but-not-reduced answer is
      // encouraged (2★) but does NOT count as mastery of SIMPLIFY.
      return lowest
        ? { correct: true, stars: 3, errorSignature: null }
        : { correct: false, stars: 2, errorSignature: 'not_simplified' };
    }

    case 'IMPROPER_TO_MIXED': {
      const w = num(answer.whole);
      const r = answer.num === '' || answer.num == null ? 0 : num(answer.num);
      const d = a.num === 0 ? (answer.den === '' || answer.den == null ? a.den : num(answer.den)) : num(answer.den);
      const wholeOk = w === a.whole;
      const remOk = a.num === 0 ? r === 0 : equalValue(r, d, a.num, a.den);
      return wholeOk && remOk
        ? { correct: true, stars: 3, errorSignature: null }
        : { correct: false, stars: 0, errorSignature: a.num === 0 && r > 0 ? 'forced_leftover' : 'other' };
    }

    case 'MULT_EQUAL_GROUPS':
    case 'MULT_FACTS': {
      const v = num(answer.value ?? answer.product);
      return v === a.product
        ? { correct: true, stars: 3, errorSignature: null }
        : { correct: false, stars: 0, errorSignature: 'other' };
    }

    case 'COMPARE_BENCHMARK': {
      return answer.rel === a.rel
        ? { correct: true, stars: 3, errorSignature: null }
        : { correct: false, stars: 0, errorSignature: 'other' };
    }

    // Default: a single fraction answer judged by EQUAL VALUE (adds/subtracts/place).
    // The skill is the operation, not reduction, so any equal-value form is correct.
    default: {
      const n = num(answer.num);
      const d = num(answer.den);
      if (equalValue(n, d, a.num, a.den)) return { correct: true, stars: 3, errorSignature: null };
      // U4: fingerprint the misconception from the operands so the engine's
      // credit→reteach path can fire (add_denominators is the 6.58x-common error).
      return { correct: false, stars: 0, errorSignature: classifyAddError(problem.operands, n, d) || 'other' };
    }
  }
}

/** The input shape a skill's answer needs (drives the practice board's UI). */
export function answerShape(skill) {
  switch (skill) {
    case 'IMPROPER_TO_MIXED': return 'mixed';
    case 'MULT_EQUAL_GROUPS':
    case 'MULT_FACTS': return 'integer';
    case 'COMPARE_BENCHMARK': return 'relation';
    default: return 'fraction';
  }
}
