// unlikeDenMath.js — the shared, content-free unlike-denominator math engine:
// derived quantities + an exact verifier + a deterministic generator that
// indexes into a CALLER-SUPPLIED problem bank. No problem set or anchor lives
// here anymore — those come from per-lesson configs — so this engine is reused
// by every unlike-denominator rung.
//
// A problem is a plain object { aNum, aDen, bNum, bDen } meaning aNum/aDen +
// bNum/bDen. Everything here is pure and deterministic — NO Math.random, NO
// Date — so reloads/HMR stay stable and the synthetic harness can replay a seed.

// ---- small integer helpers ----
export function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }
export function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }

// ---- derived quantities ---------------------------------------------------
// The least common denominator of the two pieces.
export function lcd(problem) { return lcm(problem.aDen, problem.bDen); }

// The exact sum as a fraction over the LCD (NOT reduced — R2 keeps answers in
// the common-denominator form the child actually builds; SIMPLIFY is R3's job).
// Returned { num, den } where den === lcd(problem).
export function exactSum(problem) {
  const d = lcd(problem);
  const num = problem.aNum * (d / problem.aDen) + problem.bNum * (d / problem.bDen);
  return { num, den: d };
}

// The multipliers that scale each piece to the chosen common denominator. Only
// meaningful when `denom` is a common multiple of both denominators; returns
// null multipliers otherwise so callers can reject the choice.
export function multipliersFor(problem, denom) {
  const okA = denom % problem.aDen === 0, okB = denom % problem.bDen === 0;
  return {
    multA: okA ? denom / problem.aDen : null,
    multB: okB ? denom / problem.bDen : null,
    valid: okA && okB,
  };
}

// Candidate common denominators offered by the picker: the LCD and the next two
// multiples of it (LCD, 2·LCD, 3·LCD). All are valid common sizes; the LCD is
// the tidy one (full stars), larger multiples are "over-slicing" (fewer stars,
// per room doc §4.6). Derived from the CURRENT problem — never hardcoded.
export function commonDenChoices(problem) {
  const base = lcd(problem);
  return [base, base * 2, base * 3];
}

// ---- exact verifier -------------------------------------------------------
// Is n/d a correct answer to this problem? Correct IFF n/d equals the exact sum
// (cross-multiplied so we never divide). Stars reward tidiness: the LCD earns 3,
// a larger valid common denominator earns 2 then 1 (over-slicing is correct but
// less fluent). A non-common-denominator answer that still happens to equal the
// value (e.g. an already-reduced form) is correct but scored by how its
// denominator compares to the LCD.
//   returns { ok: boolean, stars: 0..3, isCommonDen: boolean }
export function verify(problem, n, d) {
  if (!(n > 0 && d > 0)) return { ok: false, stars: 0, isCommonDen: false };
  const s = exactSum(problem);
  const ok = n * s.den === d * s.num; // n/d === s.num/s.den
  if (!ok) return { ok: false, stars: 0, isCommonDen: false };
  const base = lcd(problem);
  const isCommonDen = d % problem.aDen === 0 && d % problem.bDen === 0;
  let stars;
  if (d === base) stars = 3;          // the LCD — tidy, full marks
  else if (d === base * 2) stars = 2; // one over-slice
  else stars = 1;                     // bigger still (or an off-LCD valid form)
  return { ok: true, stars, isCommonDen };
}

// ---- cross-multiply (the "cut both" / rename-both shape) -------------------
// For Lesson 3 (Cross-Multiply): when the two bottoms share nothing, the
// classic rule is to multiply EACH fraction, top and bottom, by the OTHER
// fraction's bottom. The common bottom is then the PRODUCT of the two bottoms.
// Pure + content-free: returns the multipliers, the product common denominator,
// the scaled numerators, and the added total — everything the numbers-lead
// crossing-arrows visual needs to render itself from the live problem.
//   { multA, multB, common, scaledANum, scaledBNum, totalNum }
export function crossMultiply(problem) {
  const { aNum, aDen, bNum, bDen } = problem;
  const multA = bDen;              // scale A by the OTHER bottom
  const multB = aDen;              // scale B by the OTHER bottom
  const common = aDen * bDen;      // the product is the shared bottom
  const scaledANum = aNum * multA;
  const scaledBNum = bNum * multB;
  return { multA, multB, common, scaledANum, scaledBNum, totalNum: scaledANum + scaledBNum };
}

// ---- deterministic generator ----------------------------------------------
// generateProblem(bank, index): the index-th problem from the CALLER-SUPPLIED
// bank (cycled). Pure index arithmetic — no randomness, no clock — so it is a
// pure function of its arguments. The bank is a per-lesson array of
// { aNum, aDen, bNum, bDen } pairs (the L4 "new dress" transfer set).
export function generateProblem(bank, index) {
  const n = ((index % bank.length) + bank.length) % bank.length;
  return { ...bank[n] };
}
