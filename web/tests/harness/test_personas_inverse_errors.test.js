// U2 — inverse-error map: planted answers fingerprint as the intended signature.
//
// IMPORTANT (review A1 caveat): the round-trip assertions below (planted answer →
// classifyErrorSignature → intended signature) are COVERAGE checks that our
// inverse map wires up to the engine's classifier. They are NOT validity evidence:
// the inverse map and the classifier share the same arithmetic identity by
// construction (add_denominators IS "(na+nb)/(da+db)" on both sides), so a passing
// round-trip only proves the planted value lands where we intend — not that the
// engine's fingerprinting is independently correct.
import { describe, it, expect } from 'vitest';
import {
  inverseAnswer,
  misconceptionsFor,
  offTask,
} from '../../src/harness/personas/inverseErrors.js';
import { generateFor, generatorSkills } from '../../src/generators/index.js';
import { classifyErrorSignature } from '../../src/engine/observation.js';

// Helper: run the engine's classifier over a planted answer_value the way the
// runner/observation pipeline would (target + operands come from the problem).
function classifyPlanted(problem, answer) {
  const op = problem.operands;
  // Build the [[na,da],[nb,db]] operand pair the classifier expects, where it
  // exists (two-operand skills). Single-operand skills pass null operands.
  let operands = null;
  if (op.a && op.b && typeof op.a.num === 'number') {
    operands = [
      [op.a.num, op.a.den],
      [op.b.num, op.b.den],
    ];
  }
  const target =
    typeof problem.answer.num === 'number' && typeof problem.answer.den === 'number'
      ? [problem.answer.num, problem.answer.den]
      : [null, null];
  const [num, den] = answer;
  return classifyErrorSignature(null, num, den, target[0], target[1], operands);
}

describe('inverse-error round-trips (COVERAGE, not validity — see header)', () => {
  it('ADD_SAME_DEN add_denominators: 2/7 + 3/7 → 5/14 → add_denominators', () => {
    // Use the canonical 2/7 + 3/7 operands (the room doc example). The map reads
    // operands, so a problem carrying a=2/7, b=3/7 exercises the same code path a
    // generated tier-1 problem would.
    const problem = {
      skill: 'ADD_SAME_DEN',
      level: 1,
      surfaceForm: 'proper',
      operands: { a: { num: 2, den: 7 }, b: { num: 3, den: 7 }, den: 7 },
      answer: { num: 5, den: 7 },
    };
    const planted = inverseAnswer('ADD_SAME_DEN', 'add_denominators', problem);
    expect(planted).toEqual([5, 14]);
    expect(classifyPlanted(problem, planted)).toBe('add_denominators');
  });

  it('ADD_UNLIKE_NESTED add_across_unlike: 1/2 + 1/3 → 2/5 → add_across_unlike', () => {
    // ADD_UNLIKE_NESTED nests (ds | dl), so 1/2 + 1/3 is not directly nested.
    // Construct the operands the misconception applies to and assert directly:
    // the map reads operands, so a synthetic problem with a=1/2, b=1/3 suffices.
    const problem = {
      skill: 'ADD_UNLIKE_NESTED',
      level: 0,
      surfaceForm: 'nest_x2',
      operands: { a: { num: 1, den: 2 }, b: { num: 1, den: 3 } },
      answer: { num: 5, den: 6 },
    };
    const planted = inverseAnswer('ADD_UNLIKE_NESTED', 'add_across_unlike', problem);
    expect(planted).toEqual([2, 5]);
    expect(classifyPlanted(problem, planted)).toBe('add_across_unlike');
  });
});

describe('named-signature coverage across real generated operands', () => {
  it('SIMPLIFY not_simplified resubmits the unreduced presented form', () => {
    const problem = generateFor('SIMPLIFY', { level: 1, index: 3 });
    const planted = inverseAnswer('SIMPLIFY', 'not_simplified', problem);
    // The presented form is (p*k)/(q*k); planting it back is value-correct-but-unreduced.
    expect(planted).toEqual([problem.operands.num, problem.operands.den]);
  });

  it('ADD_UNLIKE_COPRIME scaled_bottom_only uses a real common denominator', () => {
    const problem = generateFor('ADD_UNLIKE_COPRIME', { level: 1, index: 2, surfaceForm: 'nonunit' });
    const planted = inverseAnswer('ADD_UNLIKE_COPRIME', 'scaled_bottom_only', problem);
    const sig = classifyPlanted(problem, planted);
    // Engine recognises the common-denominator-without-scaled-top pattern.
    expect(sig).toBe('scaled_bottom_only');
  });

  it('IMPROPER_TO_MIXED forced_leftover yields a plausible mis-conversion fraction', () => {
    const problem = generateFor('IMPROPER_TO_MIXED', { level: 1, index: 1, surfaceForm: 'with_remainder' });
    const planted = inverseAnswer('IMPROPER_TO_MIXED', 'forced_leftover', problem);
    expect(planted).not.toBeNull();
    // It must NOT equal the correct improper value (num/den as presented).
    expect(planted).not.toEqual([problem.operands.num, problem.operands.den]);
  });
});

describe('catalogue + fallbacks', () => {
  it('every generator skill exposes ≥2 misconceptions', () => {
    for (const skill of generatorSkills()) {
      expect(misconceptionsFor(skill).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('unknown (skill, misconception) combos return a plausible non-null slip that is NOT correct', () => {
    const problem = generateFor('ADD_SAME_DEN', { level: 0, index: 0 });
    const planted = inverseAnswer('ADD_SAME_DEN', 'totally_unknown_misconception', problem);
    expect(planted).not.toBeNull();
    expect(planted).not.toEqual([problem.answer.num, problem.answer.den]);
  });

  it('offTask() is null (off-task / refuser answer)', () => {
    expect(offTask()).toBeNull();
  });

  it('tier-B cognitive misconceptions resolve to a fraction answer_value (collapse to other in engine)', () => {
    const problem = generateFor('COMPARE_BENCHMARK', { level: 0, index: 0 });
    const planted = inverseAnswer('COMPARE_BENCHMARK', 'whole_number_bias', problem);
    expect(Array.isArray(planted)).toBe(true);
    expect(planted).toHaveLength(2);
  });
});
