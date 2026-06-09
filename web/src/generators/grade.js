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
//   integer   {value}          → MULT_EQUAL_GROUPS, MULT_ARRAYS, MULT_FACTS
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
 * Pull the two whole-number factors out of a mult generator's `operands`
 * ({groups,size} for m1, {rows,cols} for m2, {a,b} for m3), as [x, y] or null.
 */
function twoFactors(operands) {
  if (!operands || typeof operands !== 'object') return null;
  let x;
  let y;
  if ('groups' in operands && 'size' in operands) { x = num(operands.groups); y = num(operands.size); }
  else if ('rows' in operands && 'cols' in operands) { x = num(operands.rows); y = num(operands.cols); }
  else if ('a' in operands && 'b' in operands) { x = num(operands.a); y = num(operands.b); }
  else return null;
  return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
}

/**
 * Classify a wrong multiplication answer into a specific engine ErrorSignature
 * (006 O1), or null to fall through to the generic 'other'. Operand-aware so the
 * mult strand gets error-specific remediation instead of collapsing to 'other'.
 *
 *   add_factors            v === a+b           (added the factors)
 *   array_perimeter        v === 2(a+b)        (m2: counted the border, not the area)
 *   skip_count_drift       v === a*b ± min(a,b) (skip-count off by one whole group)
 *   distributive_add_parts v === a + b1 + b2   (summed split sizes, not partial products)
 *
 * @param {string} skill   the mult skill id (m1/m2/m3 binding)
 * @param {object} operands the problem operands (carries the two factors)
 * @param {number} v       the submitted product
 * @param {number} product the correct product
 */
function classifyMultError(skill, operands, v, product) {
  if (!Number.isFinite(v)) return null;
  const factors = twoFactors(operands);
  if (!factors) return null;
  const [a, b] = factors;

  // add_factors: a×b → a+b (the canonical "added instead of multiplied" slip).
  // Guard against a+b === a*b (e.g. 2×2) so a genuine product isn't misread.
  if (v === a + b && a + b !== a * b) return 'add_factors';

  // array_perimeter (m2 specifically): rows×cols → 2(rows+cols), the border count.
  if (skill === 'MULT_ARRAYS' && v === 2 * (a + b) && 2 * (a + b) !== a * b) {
    return 'array_perimeter';
  }

  // skip_count_drift: skip-counting that lands one whole group short or long
  // (e.g. counted 5 sixes as 4 or 6 sixes — off by one skip of size `a` OR `b`).
  // Checked before distributive so a ±one-group drift isn't mis-read as a split slip.
  for (const step of [a, b]) {
    if (step > 0 && (v === product + step || v === product - step) && v !== product) {
      return 'skip_count_drift';
    }
  }

  // distributive_add_parts: the child splits one factor into b = b1 + b2, but only
  // multiplies ONE part and then ADDS the other part's bare size instead of taking
  // its partial product — i.e. a*b1 + b2 (or a*b2 + b1) for some interior split.
  // Correct distributive is a*b1 + a*b2; this is the "summed the split size" slip.
  // Scanned over the splittable factor's interior cuts (deterministic, operand-driven).
  for (const [whole, other] of [[a, b], [b, a]]) {
    for (let part = 1; part < whole; part++) {
      const rest = whole - part;
      // multiplied `part` by `other`, then added the leftover size `rest` raw
      const slip = other * part + rest;
      if (v === slip && slip !== a * b && slip !== a + b) return 'distributive_add_parts';
    }
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
    case 'MULT_ARRAYS':
    case 'MULT_FACTS': {
      const v = num(answer.value ?? answer.product);
      if (v === a.product) return { correct: true, stars: 3, errorSignature: null };
      // 006 O1: fingerprint the specific mult misconception (add_factors /
      // array_perimeter / skip_count_drift / distributive_add_parts) so the mult
      // strand gets error-specific remediation instead of collapsing to 'other'.
      return {
        correct: false,
        stars: 0,
        errorSignature: classifyMultError(problem.skill, problem.operands, v, a.product) || 'other',
      };
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
    case 'MULT_ARRAYS':
    case 'MULT_FACTS': return 'integer';
    case 'COMPARE_BENCHMARK': return 'relation';
    default: return 'fraction';
  }
}
