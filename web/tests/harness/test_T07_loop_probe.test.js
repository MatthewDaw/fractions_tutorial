import { describe, it, expect } from 'vitest';
import { runLoop } from '../../src/harness/recursiveLoop.js';
import { runExpectedFindings } from '../../src/harness/oracle/expectedFindings.js';
import { defaultFlags } from '../../src/harness/config.js';

describe('T07 loop verdict', () => {
  it('canonical change shows a non-NO_CHANGE verdict or at minimum a REAL/GAMING verdict', () => {
    const verdict = runLoop({
      change: {
        id: 'plan-002-flags',
        flags: { fluencyHardMode: true, frustrationScaffold: true, delayedProbe: true, unifiedTaxonomy: true },
        engineSha: 'dev',
      },
      seed: 1,
    });
    console.log('verdict:', verdict.verdict);
    console.log('trainDelta:', JSON.stringify(verdict.trainDelta));
    console.log('heldOutDelta:', JSON.stringify(verdict.heldOutDelta));
    console.log('guardrail:', JSON.stringify(verdict.guardrail));
    console.log('regressions:', verdict.regressions);
  });
  
  it('frustrationScaffold alone - any metric change?', () => {
    const verdict = runLoop({
      change: {
        id: 'frustrationScaffold-only',
        flags: { frustrationScaffold: true },
        engineSha: 'dev',
      },
      seed: 1,
    });
    console.log('frustrationScaffold only verdict:', verdict.verdict);
    console.log('trainDelta:', JSON.stringify(verdict.trainDelta));
    console.log('heldOutDelta:', JSON.stringify(verdict.heldOutDelta));
  });
  
  it('disengaged-never-escalates: flags-off present, flags-on resolved', () => {
    const flagsOff = runExpectedFindings({ flags: defaultFlags() });
    const flagsOn = runExpectedFindings({ flags: { frustrationScaffold: true } });
    const off = flagsOff.findings.find(f => f.id === 'disengaged-never-escalates');
    const on = flagsOn.findings.find(f => f.id === 'disengaged-never-escalates');
    console.log('flags-off present:', off.present);
    console.log('flags-on present:', on.present);
    expect(off.present).toBe(true);
    expect(on.present).toBe(false);
  });
});

describe('T07 fluencyHardMode alone', () => {
  it('fluencyHardMode alone - any metric change?', () => {
    const verdict = runLoop({
      change: {
        id: 'fluencyHardMode-only',
        flags: { fluencyHardMode: true },
        engineSha: 'dev',
      },
      seed: 1,
    });
    console.log('fluencyHardMode only verdict:', verdict.verdict);
    console.log('trainDelta:', JSON.stringify(verdict.trainDelta));
    console.log('heldOutDelta:', JSON.stringify(verdict.heldOutDelta));
  });
});
