// test_generators.test.js — invariants for the auto-generated practice layer.
//
// The whole point of generators is CORRECT-BY-CONSTRUCTION content, so each skill
// gets an INDEPENDENT validator that re-derives the answer from the operands and
// asserts it matches what the generator returned. Plus: determinism (replay),
// surface-form coverage + explicit selection, and difficulty validity across all
// scaffold levels.
import { describe, it, expect } from 'vitest';
import { gcd } from '../../src/generators/core.js';
import {
  generateFor,
  generatorSkills,
  surfaceFormsFor,
  hasGenerator,
} from '../../src/generators/index.js';

// Independent answer validators (do NOT reuse the generator's own math).
const VALIDATORS = {
  ADD_SAME_DEN: (p) => {
    const { a, b, den } = p.operands;
    expect(a.den).toBe(den);
    expect(b.den).toBe(den);
    expect(p.answer).toEqual({ num: a.num + b.num, den });
    if (p.surfaceForm === 'makes_whole') expect(a.num + b.num).toBe(den);
    if (p.surfaceForm === 'proper') expect(a.num + b.num).toBeLessThan(den);
  },
  ADD_UNLIKE_COPRIME: (p) => {
    const { a, b } = p.operands;
    expect(gcd(a.den, b.den)).toBe(1);
    expect(p.answer.den).toBe(a.den * b.den);
    expect(p.answer.num).toBe(a.num * b.den + b.num * a.den);
    if (p.surfaceForm === 'unit') expect(a.num === 1 && b.num === 1).toBe(true);
  },
  ADD_UNLIKE_NESTED: (p) => {
    const { a, b } = p.operands;
    expect(b.den % a.den).toBe(0); // smaller divides larger
    const scale = b.den / a.den;
    expect(p.answer.den).toBe(b.den);
    expect(p.answer.num).toBe(a.num * scale + b.num);
    if (p.surfaceForm === 'nest_x2') expect(scale).toBe(2);
    if (p.surfaceForm === 'nest_x3plus') expect(scale).toBeGreaterThanOrEqual(3);
  },
  SIMPLIFY: (p) => {
    const { num, den, factor } = p.operands;
    // Answer is the reduced form; multiplying back gives the presented fraction.
    expect(gcd(p.answer.num, p.answer.den)).toBe(1);
    expect(p.answer.num * factor).toBe(num);
    expect(p.answer.den * factor).toBe(den);
    // And it genuinely reduces (presented fraction is NOT already lowest terms).
    expect(gcd(num, den)).toBeGreaterThan(1);
  },
  IMPROPER_TO_MIXED: (p) => {
    const { num, den } = p.operands;
    const { whole, num: rem, den: ad } = p.answer;
    expect(ad).toBe(den);
    expect(rem).toBeGreaterThanOrEqual(0);
    expect(rem).toBeLessThan(den);
    expect(whole * den + rem).toBe(num);
    if (p.surfaceForm === 'exact_whole') expect(rem).toBe(0);
    if (p.surfaceForm === 'with_remainder') expect(rem).toBeGreaterThan(0);
  },
  MULT_EQUAL_GROUPS: (p) => {
    const { groups, size } = p.operands;
    expect(p.answer.product).toBe(groups * size);
    if (p.surfaceForm === 'canonical') expect(groups).toBeLessThanOrEqual(size);
    if (p.surfaceForm === 'commuted') expect(groups).toBeGreaterThan(size);
  },
  MULT_FACTS: (p) => {
    const { a, b } = p.operands;
    expect(p.answer.product).toBe(a * b);
    if (p.surfaceForm === 'edge') expect(a === 0 || a === 1 || b === 0 || b === 1).toBe(true);
    if (p.surfaceForm === 'core') expect(a >= 2 && b >= 2).toBe(true);
  },
  FRACTION_ON_LINE: (p) => {
    const { num, den, whole, rem } = p.answer;
    expect(whole).toBe(Math.floor(num / den));
    expect(rem).toBe(num % den);
    if (p.surfaceForm === 'proper') expect(num).toBeLessThan(den);
    if (p.surfaceForm === 'improper') expect(num).toBeGreaterThan(den);
  },
  SUB_SAME_DEN: (p) => {
    const { start, take, den } = p.operands;
    expect(start.den).toBe(den);
    expect(take.den).toBe(den);
    expect(take.num).toBeLessThan(start.num);
    expect(p.answer).toEqual({ num: start.num - take.num, den });
    if (p.surfaceForm === 'whole_minus_part') expect(start.num).toBe(den);
  },
  COMPARE_BENCHMARK: (p) => {
    if (p.surfaceForm === 'benchmark_half') {
      const { fraction } = p.operands;
      const exp = 2 * fraction.num < fraction.den ? 'less' : 2 * fraction.num > fraction.den ? 'more' : 'equal';
      expect(p.answer.rel).toBe(exp);
    } else {
      const { a, b } = p.operands;
      expect(a.den).toBe(b.den);
      expect(a.num).not.toBe(b.num);
      expect(p.answer.rel).toBe(a.num < b.num ? '<' : '>');
    }
  },
};

const SKILLS = generatorSkills();

describe('generator registry', () => {
  it('covers all ten skills with a validator each', () => {
    expect(SKILLS.length).toBe(10);
    for (const s of SKILLS) {
      expect(hasGenerator(s)).toBe(true);
      expect(VALIDATORS[s]).toBeDefined();
      expect(surfaceFormsFor(s).length).toBe(2);
    }
  });

  it('throws for an unknown skill', () => {
    expect(() => generateFor('NOPE')).toThrow();
  });
});

describe.each(SKILLS)('generator: %s', (skill) => {
  const validate = VALIDATORS[skill];

  it('is correct-by-construction across all levels and many indices', () => {
    for (let level = 0; level <= 4; level++) {
      for (let index = 0; index < 40; index++) {
        const p = generateFor(skill, { level, index });
        expect(p.skill).toBe(skill);
        expect(p.level).toBe(level);
        expect(typeof p.prompt).toBe('string');
        validate(p);
      }
    }
  });

  it('is deterministic — same (level, index) reproduces the exact problem', () => {
    for (let index = 0; index < 10; index++) {
      const a = generateFor(skill, { level: 2, index });
      const b = generateFor(skill, { level: 2, index });
      expect(a).toEqual(b);
    }
  });

  it('honors an explicitly requested surface form (for TransferProbe)', () => {
    for (const form of surfaceFormsFor(skill)) {
      for (let index = 0; index < 12; index++) {
        const p = generateFor(skill, { level: 2, index, surfaceForm: form });
        expect(p.surfaceForm).toBe(form);
        validate(p);
      }
    }
  });

  it('rotates through both surface forms when none is requested', () => {
    const seen = new Set();
    for (let index = 0; index < 12; index++) {
      seen.add(generateFor(skill, { level: 2, index }).surfaceForm);
    }
    expect(seen.size).toBe(2);
  });

  it('produces variety — not the same problem every index', () => {
    const prompts = new Set();
    for (let index = 0; index < 20; index++) {
      prompts.add(generateFor(skill, { level: 2, index }).prompt);
    }
    expect(prompts.size).toBeGreaterThan(3);
  });
});
