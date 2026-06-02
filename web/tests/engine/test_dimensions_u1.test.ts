// U1 — strengthened gate conjuncts (pure engine, real imports).
// Independence by problem_id (not answer_value), transfer by surface_form (not
// denominator), and fluencyOk reading PARAMS.fluencyHardMode by default.
import { describe, it, expect, afterEach } from 'vitest';
import { isIndependent, hasTransferred, fluencyOk, computeFluency } from '../../src/engine/dimensions.js';
import { PARAMS } from '../../src/engine/params.js';
import type { Observation } from '../../src/engine/types.js';

function obs(o: Partial<Observation> = {}): Observation {
  return {
    correct: true, answer_value: [3, 4], error_signature: null, latency: PARAMS.latencyFloorMs + 500,
    hint_max_rung: 0, self_corrections: 0, scaffold_level: 3, modality: 'tap',
    recognizer_confidence: null, too_fast_correct: false, affect_window: [], ...o,
  } as Observation;
}

describe('U1 isIndependent — problem_id seam', () => {
  it('two SAME answer_value but DIFFERENT problem_id count as 2 distinct', () => {
    const a = { ...obs({ answer_value: [1, 2] }), problem_id: 'P1' } as Observation;
    const b = { ...obs({ answer_value: [1, 2] }), problem_id: 'P2' } as Observation;
    expect(isIndependent([a, b])).toBe(true);
  });
  it('same problem_id repeats do NOT satisfy independence', () => {
    const a = { ...obs({ answer_value: [1, 2] }), problem_id: 'P1' } as Observation;
    const b = { ...obs({ answer_value: [9, 9] }), problem_id: 'P1' } as Observation;
    expect(isIndependent([a, b])).toBe(false);
  });
});

describe('U1 hasTransferred — surface_form over denominator', () => {
  it('denominator-only variation does NOT pass transfer when surface_form present and identical', () => {
    const a = { ...obs({ answer_value: [3, 4], scaffold_level: 3 }), surface_form: 'proper' } as Observation;
    const b = { ...obs({ answer_value: [5, 6], scaffold_level: 3 }), surface_form: 'proper' } as Observation;
    expect(hasTransferred([a, b])).toBe(false);
  });
  it('distinct surface_forms pass transfer even with identical denominators', () => {
    const a = { ...obs({ answer_value: [3, 8], scaffold_level: 3 }), surface_form: 'proper' } as Observation;
    const b = { ...obs({ answer_value: [5, 8], scaffold_level: 3 }), surface_form: 'makes_whole' } as Observation;
    expect(hasTransferred([a, b])).toBe(true);
  });
});

describe('U1 fluencyOk reads PARAMS.fluencyHardMode by default', () => {
  const slow = Array.from({ length: PARAMS.fluencyMinN }, () => obs({ latency: 60000 }));
  afterEach(() => { (PARAMS as any).fluencyHardMode = false; });
  it('default (flag off) passes regardless of latency', () => {
    (PARAMS as any).fluencyHardMode = false;
    expect(fluencyOk(computeFluency(slow))).toBe(true);
  });
  it('flag on blocks over-target latency without threading the arg', () => {
    (PARAMS as any).fluencyHardMode = true;
    expect(fluencyOk(computeFluency(slow))).toBe(false);
  });
});
