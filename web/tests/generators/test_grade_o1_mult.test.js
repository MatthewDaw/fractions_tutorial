// 006 O1 — grade.js fingerprints multiplication misconceptions into the four new
// engine ErrorSignature members instead of collapsing every mult mistake to 'other'.
// Acceptance: each wrong-attempt kind → its SPECIFIC signature (not 'other').
import { describe, it, expect } from 'vitest';
import { gradeAnswer } from '../../src/generators/grade.js';

const MULT_SIGS = new Set([
  'add_factors', 'skip_count_drift', 'array_perimeter', 'distributive_add_parts',
]);

describe('006 O1 mult error-signature fingerprinting', () => {
  // m1 — equal groups: 4 groups of 6 = 24
  const m1 = { skill: 'MULT_EQUAL_GROUPS', answer: { product: 24 }, operands: { groups: 4, size: 6 } };

  it('m1: adding the factors (4+6) instead of multiplying → add_factors', () => {
    expect(gradeAnswer(m1, { value: 10 }).errorSignature).toBe('add_factors');
  });

  it('m1: skip-count short by one group (24−6) → skip_count_drift', () => {
    expect(gradeAnswer(m1, { value: 18 }).errorSignature).toBe('skip_count_drift');
  });

  it('m1: skip-count long by one group (24+6) → skip_count_drift', () => {
    expect(gradeAnswer(m1, { value: 30 }).errorSignature).toBe('skip_count_drift');
  });

  // m2 — arrays: 3 rows × 5 cols = 15; perimeter = 2(3+5) = 16
  const m2 = { skill: 'MULT_ARRAYS', answer: { product: 15 }, operands: { rows: 3, cols: 5 } };

  it('m2: perimeter-for-area 2(rows+cols) → array_perimeter', () => {
    expect(gradeAnswer(m2, { value: 16 }).errorSignature).toBe('array_perimeter');
  });

  it('m2: adding rows+cols → add_factors', () => {
    expect(gradeAnswer(m2, { value: 8 }).errorSignature).toBe('add_factors');
  });

  // m3 — facts: 7 × 8 = 56; distributive split 8 = 5+3 summed as 7*5 + 3 = 38
  const m3 = { skill: 'MULT_FACTS', answer: { product: 56 }, operands: { a: 7, b: 8 } };

  it('m3: summing distributive split sizes (7*5 + 3) → distributive_add_parts', () => {
    expect(gradeAnswer(m3, { value: 38 }).errorSignature).toBe('distributive_add_parts');
  });

  it('m3: adding the factors (7+8) → add_factors', () => {
    expect(gradeAnswer(m3, { value: 15 }).errorSignature).toBe('add_factors');
  });

  it('an unrecognised mult mistake still falls through to other', () => {
    expect(gradeAnswer(m3, { value: 99 }).errorSignature).toBe('other');
  });

  it('a correct mult answer carries no signature', () => {
    const g = gradeAnswer(m3, { value: 56 });
    expect(g.correct).toBe(true);
    expect(g.errorSignature).toBe(null);
  });

  it('every fingerprinted mult signature is one of the four new union members', () => {
    for (const v of [10, 18, 30]) expect(MULT_SIGS.has(gradeAnswer(m1, { value: v }).errorSignature)).toBe(true);
    expect(MULT_SIGS.has(gradeAnswer(m2, { value: 16 }).errorSignature)).toBe(true);
    expect(MULT_SIGS.has(gradeAnswer(m3, { value: 38 }).errorSignature)).toBe(true);
  });
});
