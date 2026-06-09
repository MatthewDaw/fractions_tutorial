// 006 O1 — the four multiplication ErrorSignature members survive segment()
// (they are NOT coerced to 'other' by the VALID_SIGS allowlist), so the SPECIFIC
// signature reaches the credit/reteach path. Also asserts assignCredit consumes
// the specific signature binding-only (no cross-strand prereq propagation).
import { describe, it, expect } from 'vitest';
import { segment } from '../../src/engine/observation.js';
import { assignCredit, ERROR_PREREQ_IMPLICATION } from '../../src/engine/credit.js';
import type { Event, SkillNode } from '../../src/engine/types.js';

const MULT_SIGS = ['add_factors', 'skip_count_drift', 'array_perimeter', 'distributive_add_parts'] as const;

function multAttempt(node: string, sig: string): Event[] {
  const t = 1000;
  return [
    { type: 'problem_present', payload: { node_id: node, scaffold_level: 1 }, modality: 'tap', t, actor: 'human' },
    { type: 'answer_submit', payload: { node_id: node, answer_value: [10, 1] }, modality: 'tap', t: t + 2000, actor: 'human' },
    { type: 'judged', payload: { node_id: node, correct: false, error_signature: sig, answer_value: [10, 1], scaffold_level: 1 }, modality: 'tap', t: t + 2001, actor: 'human' },
  ];
}

describe('006 O1 mult signatures reach observation + credit', () => {
  it('each emitted mult signature survives segment() (not coerced to other)', () => {
    for (const sig of MULT_SIGS) {
      const obs = segment(multAttempt('MULT_FACTS', sig));
      expect(obs[0].error_signature).toBe(sig);
    }
  });

  it('all four mult signatures are keys of the credit implication map (exhaustive)', () => {
    for (const sig of MULT_SIGS) {
      expect(sig in ERROR_PREREQ_IMPLICATION).toBe(true);
      // mult misconceptions are binding-only: no fraction-prereq is implicated.
      expect(ERROR_PREREQ_IMPLICATION[sig]).toBe(null);
    }
  });

  it('assignCredit receives the specific signature and credits binding-only (no cross-strand prereq)', () => {
    const multFacts: SkillNode = {
      id: 'MULT_FACTS', roomId: 'm3', prereqs: [],
      scaffold_ladder: [['core']], transfer_forms: ['core', 'edge'],
    };
    const graph = new Map<string, SkillNode>([[multFacts.id, multFacts]]);
    for (const sig of MULT_SIGS) {
      const obs = segment(multAttempt('MULT_FACTS', sig))[0];
      expect(obs.error_signature).toBe(sig); // specific signature flows in
      const updates = assignCredit(obs, 'MULT_FACTS', graph);
      // binding node updated; no spurious prereq update for a mult misconception.
      expect(updates).toHaveLength(1);
      expect(updates[0]).toMatchObject({ nodeId: 'MULT_FACTS', correct: false, weight: 1.0 });
    }
  });
});
