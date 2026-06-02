// U6/U7 — retention: mastered_at tracking + probe-RESULT folding (real demotion)
// + result-aware status. Activates the previously-dead decay machinery end to end
// through the real reducer.
import { describe, it, expect } from 'vitest';
import { measurementReduce } from '../../src/engine/measurementReduce.js';
import { isMastered } from '../../src/engine/gate.js';
import { masteryStatusFor } from '../../src/kitchenProgress.js';
import type { Event } from '../../src/engine/types.js';

const NODE = 'ADD_SAME_DEN';
let t = 1000;

function attempt(log: Event[], problemId: string, surfaceForm: string, scaffold: number) {
  const present = t; const submit = t + 1600; const judged = t + 1601; t = judged + 100;
  log.push({ type: 'problem_present', payload: { node_id: NODE, scaffold_level: scaffold, problem_id: problemId, surface_form: surfaceForm }, modality: 'tap', t: present, actor: 'human' });
  log.push({ type: 'answer_submit', payload: { node_id: NODE, scaffold_level: scaffold, problem_id: problemId, surface_form: surfaceForm, answer_value: [1, 4] }, modality: 'tap', t: submit, actor: 'human' });
  log.push({ type: 'judged', payload: { node_id: NODE, correct: true, scaffold_level: scaffold, problem_id: problemId, surface_form: surfaceForm, answer_value: [1, 4], hint_max_rung: 0 }, modality: 'tap', t: judged, actor: 'human' });
}

function masteredLog(n = 10): Event[] {
  t = 1000;
  const log: Event[] = [];
  for (let i = 0; i < n; i++) attempt(log, `P${i}`, i % 2 ? 'makes_whole' : 'proper', 3);
  return log;
}

function probe(log: Event[], correct: boolean, at: number) {
  log.push({ type: 'retention_probe', payload: { node_id: NODE, correct, probe_t: at }, modality: 'tap', t: at, actor: 'human' });
}

describe('U6/U7 retention', () => {
  it('crossing the gate records mastered_at and reads as mastered', () => {
    const log = masteredLog();
    const { mastery } = measurementReduce(log, t + 1000, {});
    expect(isMastered(mastery[NODE])).toBe(true);
    expect(mastery[NODE].mastered_at).not.toBeNull();
    expect(masteryStatusFor(NODE, mastery)).toBe('mastered');
  });

  it('a FAILED retention probe demotes a mastered node to needs-review', () => {
    const log = masteredLog();
    const tProbe = t + 5_000_000;
    probe(log, false, tProbe);
    const { mastery } = measurementReduce(log, tProbe + 1000, {});
    expect(isMastered(mastery[NODE])).toBe(false);      // re-opened
    expect(mastery[NODE].transfer_passed).toBe(false);  // cleared by the lapse
    expect(mastery[NODE].mastered_at).not.toBeNull();   // remembers it was mastered
    expect(masteryStatusFor(NODE, mastery)).toBe('needs-review');
  });

  it('a PASSED retention probe leaves the node mastered (no false needs-review)', () => {
    const log = masteredLog();
    const tProbe = t + 5_000_000;
    probe(log, true, tProbe);
    const { mastery } = measurementReduce(log, tProbe + 1000, {});
    expect(isMastered(mastery[NODE])).toBe(true);
    expect(mastery[NODE].last_retention_probe).toBe(tProbe);
    expect(masteryStatusFor(NODE, mastery)).toBe('mastered');
  });

  it('replay-stable with a probe event', () => {
    const log = masteredLog();
    probe(log, false, t + 5_000_000);
    const r1 = measurementReduce(log, 9_999_999, {});
    const r2 = measurementReduce(log, 9_999_999, {});
    expect(r1.mastery[NODE].P_known).toBe(r2.mastery[NODE].P_known);
    expect(r1.mastery[NODE].mastered_at).toBe(r2.mastery[NODE].mastered_at);
  });
});
