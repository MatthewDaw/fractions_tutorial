// U4 — segment() trusts the error_signature the runtime emitted (the credit path
// was dead because segment re-derived from slip/operands the generated runtime
// never emits). Unknown strings coerce to 'other'.
import { describe, it, expect } from 'vitest';
import { segment } from '../../src/engine/observation.js';
import type { Event } from '../../src/engine/types.js';

function attempt(sig: string): Event[] {
  const t = 1000;
  return [
    { type: 'problem_present', payload: { node_id: 'ADD_SAME_DEN', scaffold_level: 1 }, modality: 'tap', t, actor: 'human' },
    { type: 'answer_submit', payload: { node_id: 'ADD_SAME_DEN', answer_value: [5, 16] }, modality: 'tap', t: t + 2000, actor: 'human' },
    { type: 'judged', payload: { node_id: 'ADD_SAME_DEN', correct: false, error_signature: sig, answer_value: [5, 16], scaffold_level: 1 }, modality: 'tap', t: t + 2001, actor: 'human' },
  ];
}

describe('U4 segment() trusts the emitted error_signature', () => {
  it('a known emitted engine signature reaches the observation (credit path is live)', () => {
    const obs = segment(attempt('add_denominators'));
    expect(obs[0].error_signature).toBe('add_denominators');
  });
  it('an unknown emitted signature coerces to other (no non-union pollution)', () => {
    const obs = segment(attempt('flipped'));
    expect(obs[0].error_signature).toBe('other');
  });
});
