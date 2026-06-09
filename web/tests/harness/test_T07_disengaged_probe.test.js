import { describe, it, expect } from 'vitest';
import { runExpectedFindings } from '../../src/harness/oracle/expectedFindings.js';
import { runSession } from '../../src/harness/sessionRunner.js';
import { personaById } from '../../src/harness/personas/library.js';

describe('T07 disengaged-never-escalates finding', () => {
  it('flags-off: finding is PRESENT (no warm raise fires)', () => {
    const off = runExpectedFindings({ flags: {} });
    const d = off.findings.find(f => f.id === 'disengaged-never-escalates');
    console.log('flags-off finding:', JSON.stringify(d));
    expect(d.present).toBe(true);
  });

  it('flags-on: finding is RESOLVED (warm raise fires)', () => {
    const on = runExpectedFindings({ flags: { frustrationScaffold: true } });
    const d = on.findings.find(f => f.id === 'disengaged-never-escalates');
    console.log('flags-on finding:', JSON.stringify(d));
    expect(d.present).toBe(false);
  });
  
  it('off-task at L0 runs to StepCap (no RaiseScaffold legal)', () => {
    const tape = runSession({ persona: personaById('off-task'), skillId: 'ADD_SAME_DEN', seed: 2, stepCap: 40 });
    console.log('terminal:', tape.terminal);
    expect(tape.terminal.kind).toBe('StepCap');
  });
  
  it('off-task at L1 with frustrationScaffold gets warm RaiseScaffold', () => {
    const tape = runSession({ persona: personaById('off-task'), skillId: 'ADD_SAME_DEN', seed: 2, stepCap: 10, flags: { frustrationScaffold: true }, startScaffold: 1 });
    const decisions = tape.steps.map(s => ({ kind: s.decision.kind, preserveWork: s.decision.preserveWork, rationale: s.decision.rationale?.substring(0, 60) }));
    console.log('steps:', JSON.stringify(decisions));
    const warmRaise = tape.steps.find(s => s.decision.kind === 'RaiseScaffold' && s.decision.preserveWork === true);
    console.log('warm raise found:', warmRaise?.decision);
    expect(warmRaise).toBeTruthy();
  });
});
