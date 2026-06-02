// test_practiceFlow.test.js — the Decision → next-problem mapper (estimator loop).
import { describe, it, expect } from 'vitest';
import { nextPractice, otherSurfaceForm } from '../../src/runtime/practiceFlow.js';

const base = { skill: 'SIMPLIFY', level: 2, index: 5, surfaceForm: 'single_factor' };

describe('otherSurfaceForm', () => {
  it('returns the OTHER form for a 2-form skill', () => {
    expect(otherSurfaceForm('SIMPLIFY', 'single_factor')).toBe('multi_factor');
    expect(otherSurfaceForm('SIMPLIFY', 'multi_factor')).toBe('single_factor');
  });
});

describe('nextPractice', () => {
  it('PresentProblem → another variation at the decision level + next index', () => {
    const r = nextPractice({ kind: 'PresentProblem', scaffold: 2, surface_form: 'single_factor' }, base);
    expect(r.action).toBe('present');
    expect(r.spec).toMatchObject({ level: 2, index: 6, surfaceForm: 'single_factor' });
  });

  it('FadeScaffold → harder (level + 1), clamped at maxLevel', () => {
    expect(nextPractice({ kind: 'FadeScaffold' }, base).spec).toMatchObject({ level: 3, index: 6 });
    expect(nextPractice({ kind: 'FadeScaffold' }, { ...base, level: 4 }).spec.level).toBe(4);
  });

  it('RaiseScaffold → easier (level - 1), floored at 0', () => {
    expect(nextPractice({ kind: 'RaiseScaffold' }, base).spec).toMatchObject({ level: 1, index: 6 });
    expect(nextPractice({ kind: 'RaiseScaffold' }, { ...base, level: 0 }).spec.level).toBe(0);
  });

  it('TransferProbe → same level, a DIFFERENT surface form', () => {
    const r = nextPractice({ kind: 'TransferProbe' }, base);
    expect(r.action).toBe('present');
    expect(r.spec.level).toBe(2);
    expect(r.spec.surfaceForm).toBe('multi_factor'); // different from single_factor
  });

  it('ReturnToKitchen → exit (return)', () => {
    const r = nextPractice({ kind: 'ReturnToKitchen', recipe: 'trays' }, base);
    expect(r.action).toBe('return');
    expect(r.spec).toBeUndefined();
    expect(r.decision.recipe).toBe('trays');
  });

  it('RouteToRoom → exit (route)', () => {
    const r = nextPractice({ kind: 'RouteToRoom', node: 'ADD_SAME_DEN' }, base);
    expect(r.action).toBe('route');
  });

  it('is pure — same inputs give the same output', () => {
    const d = { kind: 'TransferProbe' };
    expect(nextPractice(d, base)).toEqual(nextPractice(d, base));
  });

  it('advances the index on every presented problem', () => {
    let st = { skill: 'SIMPLIFY', level: 1, index: 0 };
    const indices = [];
    for (let i = 0; i < 5; i++) {
      const r = nextPractice({ kind: 'PresentProblem', scaffold: st.level }, st);
      indices.push(r.spec.index);
      st = { ...st, level: r.spec.level, index: r.spec.index };
    }
    expect(indices).toEqual([1, 2, 3, 4, 5]);
  });
});
