// U4 — grade.js emits engine ErrorSignature union values, with operand-aware
// detection of the add-the-denominators misconception (new grading logic).
import { describe, it, expect } from 'vitest';
import { gradeAnswer } from '../../src/generators/grade.js';
import { generateFor, generatorSkills } from '../../src/generators/index.js';

const UNION = new Set([
  'add_denominators', 'add_across_unlike', 'scaled_bottom_only',
  'forced_leftover', 'not_simplified', 'other', null,
]);

describe('U4 grade.js → engine ErrorSignature', () => {
  it('adding denominators on a like-denominator add → add_denominators', () => {
    const prob = { skill: 'ADD_SAME_DEN', answer: { num: 5, den: 8 }, operands: { a: { num: 3, den: 8 }, b: { num: 2, den: 8 }, den: 8 } };
    expect(gradeAnswer(prob, { num: 5, den: 16 }).errorSignature).toBe('add_denominators');
  });

  it('adding across unlike denominators → add_across_unlike', () => {
    const prob = { skill: 'ADD_UNLIKE_COPRIME', answer: { num: 5, den: 6 }, operands: { a: { num: 1, den: 2 }, b: { num: 1, den: 3 } } };
    expect(gradeAnswer(prob, { num: 2, den: 5 }).errorSignature).toBe('add_across_unlike');
  });

  it('unreduced-but-equal SIMPLIFY stays not_simplified (locked Simplify-lesson behavior)', () => {
    const prob = { skill: 'SIMPLIFY', answer: { num: 2, den: 3 }, operands: { num: 8, den: 12 } };
    const g = gradeAnswer(prob, { num: 4, den: 6 });
    expect(g.errorSignature).toBe('not_simplified');
    expect(g.correct).toBe(false);
    expect(g.stars).toBe(2);
  });

  it('every wrong-answer signature across all generators is a union member (no orphans)', () => {
    for (const skill of generatorSkills()) {
      const p = generateFor(skill, { level: 1, index: 3 });
      const wrong = { num: -7, den: 9, whole: 99, value: -1, product: -1, rel: 'zzz' };
      expect(UNION.has(gradeAnswer(p, wrong).errorSignature)).toBe(true);
    }
  });
});
