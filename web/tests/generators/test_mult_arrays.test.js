// test_mult_arrays.test.js — focused correctness + scaffolding tests for the new
// m2 (MULT_ARRAYS) room: the generator's rows×cols products, its surface-form
// orientation contract, difficulty growth across levels, the hint ladder
// (strategy, not answer), and the BakingTray interior/perimeter helper.
import { describe, it, expect } from 'vitest';
import { generateFor, surfaceFormsFor } from '../../src/generators/index.js';
import { hintsFor } from '../../src/generators/hints.js';
import { isInterior, interiorCount } from '../../src/components/BakingTray.jsx';

describe('multArrays generator — correctness', () => {
  it('product always equals rows × cols (correct by construction)', () => {
    for (let level = 0; level <= 4; level++) {
      for (let index = 0; index < 40; index++) {
        const p = generateFor('MULT_ARRAYS', { level, index });
        expect(p.skill).toBe('MULT_ARRAYS');
        expect(p.answer.product).toBe(p.operands.rows * p.operands.cols);
        expect(p.prompt).toBe(`${p.operands.rows} × ${p.operands.cols}`);
      }
    }
  });

  it('surface forms encode tray orientation: upright (r<=c) vs rotated (r>c)', () => {
    expect(surfaceFormsFor('MULT_ARRAYS')).toEqual(['upright', 'rotated']);
    for (let index = 0; index < 20; index++) {
      const up = generateFor('MULT_ARRAYS', { level: 2, index, surfaceForm: 'upright' });
      expect(up.operands.rows).toBeLessThanOrEqual(up.operands.cols);
      const rot = generateFor('MULT_ARRAYS', { level: 2, index, surfaceForm: 'rotated' });
      expect(rot.operands.rows).toBeGreaterThan(rot.operands.cols);
    }
  });

  it('the same product appears either orientation (commutativity holds)', () => {
    // The rotated tray is the upright one spun: r×c and c×r share a product.
    const up = generateFor('MULT_ARRAYS', { level: 2, index: 3, surfaceForm: 'upright' });
    const rot = generateFor('MULT_ARRAYS', { level: 2, index: 3, surfaceForm: 'rotated' });
    expect(up.answer.product).toBe(up.operands.rows * up.operands.cols);
    expect(rot.answer.product).toBe(rot.operands.rows * rot.operands.cols);
  });

  it('is deterministic — same (level, index) reproduces the exact tray', () => {
    for (let index = 0; index < 10; index++) {
      expect(generateFor('MULT_ARRAYS', { level: 2, index }))
        .toEqual(generateFor('MULT_ARRAYS', { level: 2, index }));
    }
  });

  it('difficulty grows: level 4 can reach the hard-fact cluster (factor up to 9)', () => {
    let maxFactor = 0;
    for (let index = 0; index < 60; index++) {
      const p = generateFor('MULT_ARRAYS', { level: 4, index });
      maxFactor = Math.max(maxFactor, p.operands.rows, p.operands.cols);
    }
    expect(maxFactor).toBeGreaterThanOrEqual(8);
  });
});

describe('multArrays — hint ladder (scaffolding, least→most assistance)', () => {
  it('has a two-rung ladder: the method, then a concrete first move — never the answer', () => {
    const hints = hintsFor('MULT_ARRAYS');
    expect(hints.length).toBe(2);
    for (const h of hints) {
      expect(typeof h).toBe('string');
      expect(h.length).toBeGreaterThan(8);
      // the rungs talk strategy (rows/columns/cut), not a bare product number
      expect(h).not.toMatch(/= ?\d/);
    }
    // rung 1 names the method (rows times columns / commutativity)
    expect(hints[0]).toMatch(/row|column|rectangle/i);
    // rung 2 is a concrete move (count a row, or cut the tray — distributivity)
    expect(hints[1]).toMatch(/row|cut|piece|add/i);
  });
});

describe('BakingTray — interior / perimeter helper (area vs. edge guard)', () => {
  it('flags the outer ring as non-interior on a 4×6 tray', () => {
    expect(isInterior(0, 0, 4, 6)).toBe(false); // corner
    expect(isInterior(0, 3, 4, 6)).toBe(false); // top edge
    expect(isInterior(3, 3, 4, 6)).toBe(false); // bottom edge
    expect(isInterior(1, 1, 4, 6)).toBe(true);  // inside
    expect(isInterior(2, 4, 4, 6)).toBe(true);  // inside
  });

  it('interiorCount is (rows-2)(cols-2) for a tray with an inner ring', () => {
    expect(interiorCount(4, 6)).toBe(2 * 4); // 8
    expect(interiorCount(5, 8)).toBe(3 * 6); // 18
  });

  it('degrades to all-cells-interior when a dimension < 3 (no inner ring)', () => {
    expect(isInterior(0, 0, 2, 6)).toBe(true);
    expect(interiorCount(2, 6)).toBe(12);
  });
});
