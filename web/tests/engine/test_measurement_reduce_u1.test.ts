// U1 — emission-seam proof end-to-end through the real reducer, plus the
// POSITIVE-direction reachability test (the strengthened conjuncts actually open
// at L3 on a plausible clean trace) and a replay-stability pass.
import { describe, it, expect } from 'vitest';
import { measurementReduce } from '../../src/engine/measurementReduce.js';
import { gateConditions } from '../../src/engine/gate.js';
import type { Event } from '../../src/engine/types.js';

const NODE = 'ADD_SAME_DEN';
let t = 1000;
function attempt(log: Event[], problemId: string, surfaceForm: string, scaffold: number) {
  const present = t; const submit = t + 1600; const judged = t + 1601; t = judged + 100;
  log.push({ type: 'problem_present', payload: { node_id: NODE, scaffold_level: scaffold, problem_id: problemId, surface_form: surfaceForm }, modality: 'tap', t: present, actor: 'human' });
  log.push({ type: 'answer_submit', payload: { node_id: NODE, scaffold_level: scaffold, problem_id: problemId, surface_form: surfaceForm, answer_value: [1, 4] }, modality: 'tap', t: submit, actor: 'human' });
  log.push({ type: 'judged', payload: { node_id: NODE, correct: true, scaffold_level: scaffold, problem_id: problemId, surface_form: surfaceForm, answer_value: [1, 4], hint_max_rung: 0 }, modality: 'tap', t: judged, actor: 'human' });
}

describe('U1 reachability — strengthened conjuncts open at L3 on a clean trace', () => {
  it('hint-free L3 corrects on distinct problem_ids + surface_forms satisfy independence AND transfer', () => {
    t = 1000;
    const log: Event[] = [];
    attempt(log, 'P1', 'proper', 3);
    attempt(log, 'P2', 'makes_whole', 3);
    attempt(log, 'P3', 'proper', 3);
    const { mastery } = measurementReduce(log, t + 5000, {});
    const conds = gateConditions(mastery[NODE]);
    expect(conds.independenceOk).toBe(true);
    expect(conds.transferOk).toBe(true);
  });
  it('replay-stable: identical log reduces identically', () => {
    t = 1000; const log: Event[] = []; attempt(log, 'P1', 'proper', 3); attempt(log, 'P2', 'makes_whole', 3);
    const r1 = measurementReduce(log, 99999, {});
    const r2 = measurementReduce(log, 99999, {});
    expect(r1.mastery[NODE].transfer_passed).toBe(r2.mastery[NODE].transfer_passed);
    expect(r1.mastery[NODE].max_scaffold_passed).toBe(r2.mastery[NODE].max_scaffold_passed);
  });
});
