// test_grade.test.js — gradeAnswer accepts the correct answer and rejects wrong
// ones, for every skill, across generated problems.
import { describe, it, expect } from 'vitest';
import { generateFor, generatorSkills } from '../../src/generators/index.js';
import { gradeAnswer, answerShape } from '../../src/generators/grade.js';

// Build the canonical correct answer from a problem's own answer field.
function correctAnswerFor(p) {
  switch (answerShape(p.skill)) {
    case 'mixed': return { whole: p.answer.whole, num: p.answer.num, den: p.answer.den };
    case 'integer': return { value: p.answer.product };
    case 'relation': return { rel: p.answer.rel };
    default: return { num: p.answer.num, den: p.answer.den };
  }
}

describe.each(generatorSkills())('gradeAnswer: %s', (skill) => {
  it('marks the canonical correct answer as correct (3★) across many variations', () => {
    for (let level = 0; level <= 4; level++) {
      for (let index = 0; index < 20; index++) {
        const p = generateFor(skill, { level, index });
        const g = gradeAnswer(p, correctAnswerFor(p));
        expect(g.correct).toBe(true);
        expect(g.stars).toBe(3);
        expect(g.errorSignature).toBeNull();
      }
    }
  });

  it('rejects a clearly wrong answer', () => {
    const p = generateFor(skill, { level: 1, index: 0 });
    let wrong;
    switch (answerShape(skill)) {
      case 'integer': wrong = { value: p.answer.product + 7 }; break;
      case 'relation': wrong = { rel: p.answer.rel === 'less' ? 'more' : (p.answer.rel === '<' ? '>' : 'less') }; break;
      case 'mixed': wrong = { whole: p.answer.whole + 1, num: p.answer.num, den: p.answer.den }; break;
      default: wrong = { num: p.answer.num + 1, den: p.answer.den }; break; // +1 top, same bottom → always a different value
    }
    expect(gradeAnswer(p, wrong).correct).toBe(false);
  });
});

describe('gradeAnswer: SIMPLIFY equal-but-not-reduced', () => {
  it('treats an equal-value, non-lowest-terms answer as 2★ not_simplified (no mastery credit)', () => {
    // Find a SIMPLIFY problem and answer with the presented (unreduced) fraction.
    const p = generateFor('SIMPLIFY', { level: 2, index: 3 });
    const g = gradeAnswer(p, { num: p.operands.num, den: p.operands.den });
    expect(g.correct).toBe(false);
    expect(g.stars).toBe(2);
    expect(g.errorSignature).toBe('not_simplified');
  });
});

describe('gradeAnswer: IMPROPER_TO_MIXED exact-whole trap', () => {
  it('accepts a bare whole (empty leftover) and rejects a forced leftover', () => {
    const p = generateFor('IMPROPER_TO_MIXED', { level: 2, index: 0, surfaceForm: 'exact_whole' });
    expect(gradeAnswer(p, { whole: p.answer.whole, num: '', den: '' }).correct).toBe(true);
    const forced = gradeAnswer(p, { whole: p.answer.whole, num: 1, den: p.answer.den });
    expect(forced.correct).toBe(false);
    expect(forced.errorSignature).toBe('forced_leftover');
  });
});
