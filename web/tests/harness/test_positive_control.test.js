// U5 — positive control (VERIFY-FIRST): the harness must catch a defect we KNOW
// is in the code (fluencyOk-always-true), plus a BLIND injected defect (review A7).
import { describe, it, expect } from 'vitest';
import {
  runPositiveControl,
  blindControl,
  detectImplausibleFluencyGate,
  PLAUSIBLE_COMPUTE_FLOOR_MS,
} from '../../src/harness/oracle/positiveControl.js';
import { runSession } from '../../src/harness/sessionRunner.js';
import { personaById } from '../../src/harness/personas/library.js';

describe('runPositiveControl — flags the confirmed fluencyOk defect', () => {
  it('the fast-shallow learner opens the gate at IMPLAUSIBLY low latency and is caught', () => {
    const pc = runPositiveControl({ seed: 7 });
    // The gate DOES open (fluencyOk waved the fast corrects through).
    expect(pc.gateOpenStep).toBeGreaterThanOrEqual(0);
    // The oracle catches it.
    expect(pc.caught).toBe(true);
    expect(pc.flagged).not.toBeNull();
    // The flagged gate's fluency median is below the oracle's plausible-compute floor.
    expect(pc.flagged.medianLatency).toBeLessThan(PLAUSIBLE_COMPUTE_FLOOR_MS);
    expect(pc.defect).toMatch(/fluencyOk/);
  });

  it('the oracle floor is disjoint from the engine latencyFloorMs (1200)', () => {
    expect(PLAUSIBLE_COMPUTE_FLOOR_MS).toBe(1500);
    expect(PLAUSIBLE_COMPUTE_FLOOR_MS).not.toBe(1200);
  });

  it('an honest, in-band learner is NOT flagged (no false alarm)', () => {
    // Slow-but-steady answers well above the plausible-compute floor.
    const tape = runSession({ persona: personaById('slow-but-steady'), skillId: 'ADD_SAME_DEN', seed: 4, stepCap: 60 });
    const flagged = detectImplausibleFluencyGate(tape);
    // Either it never gates, or if it does the median latency is plausible (≥ floor).
    expect(flagged).toBeNull();
  });
});

describe('blindControl — catches an externally-supplied defect injector (review A7)', () => {
  it('catches a blind fast-shallow injection the persona authors did not design for', () => {
    const bc = blindControl(({ personaById: byId, SKILL }) => {
      const p = byId('fast-mastery');
      p.latent.truePknownBySkill = { [SKILL]: 0.98 };
      p.latent.pSlip = 0;
      p.latent.pGuess = 1;
      p.latent.hintAppetite = 0;
      // a DIFFERENT fast band than the positive control uses.
      p.latent.latency = { base: 1300, spread: 40, fatiguePerStep: 0 };
      return { persona: p, seed: 5 };
    });
    expect(bc.injected).toBe(true);
    expect(bc.caught).toBe(true);
    expect(bc.gateOpenStep).toBeGreaterThanOrEqual(0);
  });

  it('reports injected:false when handed a non-function or a spec without a persona', () => {
    expect(blindControl(null).injected).toBe(false);
    expect(blindControl(() => ({})).injected).toBe(false);
  });
});
