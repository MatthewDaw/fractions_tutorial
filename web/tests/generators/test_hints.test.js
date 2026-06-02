// test_hints.test.js — every skill has a real hint ladder (strategy, not answer).
import { describe, it, expect } from 'vitest';
import { generatorSkills } from '../../src/generators/index.js';
import { hintsFor } from '../../src/generators/hints.js';

describe('hint ladder', () => {
  it('every generated skill has at least one hint rung', () => {
    for (const skill of generatorSkills()) {
      const hints = hintsFor(skill);
      expect(hints.length).toBeGreaterThanOrEqual(1);
      for (const h of hints) {
        expect(typeof h).toBe('string');
        expect(h.length).toBeGreaterThan(8);
      }
    }
  });

  it('returns an empty ladder for an unknown skill (no crash)', () => {
    expect(hintsFor('NOPE')).toEqual([]);
  });
});
