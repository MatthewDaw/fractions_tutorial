// CCSS grade-3–5 denominator set + in-grade helpers.
// Pure data/util — no React. Lessons must stay inside this set
// (never 7 or 9). See .ccss-contract.md.
export const CCSS_DENOMINATORS = [2, 3, 4, 5, 6, 8, 10, 12, 100];

export function isInGrade(d) {
  return CCSS_DENOMINATORS.includes(Number(d));
}

// Filter a problem bank to in-grade denominators.
// `keys` default to the unlike-den bank shape (aDen/bDen).
export function filterBankInGrade(bank, keys = ["aDen", "bDen"]) {
  return bank.filter((p) => keys.every((k) => isInGrade(p[k])));
}
