// U9 — reversible frustration scaffold. The felt wall stays (RaiseScaffold still
// fires at >= raiseErrorsM errors), but with the flag on the response is warm and
// signals a reachable foothold. Default off = identical prior rationale.
import { describe, it, expect, afterEach } from 'vitest';
import { nextDecision } from '../../src/engine/policy.js';
import type { PolicyState, RecentBehavior } from '../../src/engine/policy.js';
import type { MasteryEstimate } from '../../src/engine/types.js';
import { PARAMS } from '../../src/engine/params.js';

function state(): PolicyState {
  return {
    currentNodeId: 'ADD_SAME_DEN',
    currentScaffold: 2,           // > L0 so RaiseScaffold is legal
    stumpingRecipe: null,
    inKitchen: false,
    sessionMaxScaffoldPassed: null,
    consecutiveErrors: PARAMS.raiseErrorsM,   // at the frustration threshold
    consecutiveCleanCorrects: 0,
    pendingTransferProbe: false,
    pKnownHistory: [],
    heavyHintAtFloorCount: 0,
    disengagedCount: 0,           // no escalation
    disengagedScaffoldCount: 0,   // no disengagement-scaffold trigger by default
  };
}

function weakEst(): MasteryEstimate {
  return { P_known: 0.3, fluency_stats: { median_latency: null, slope: null, n: 1 }, max_scaffold_passed: 1, transfer_passed: false, hint_dependence: 0, last_retention_probe: null, mastered_at: null };
}

const recent: RecentBehavior = { observations: [], isDisengaged: false } as RecentBehavior;
const mastery = { ADD_SAME_DEN: weakEst() };

describe('U9 frustration scaffold (reversible)', () => {
  afterEach(() => { (PARAMS as any).frustrationScaffold = false; });

  it('flag OFF: RaiseScaffold fires with the neutral rationale (prior behavior)', () => {
    (PARAMS as any).frustrationScaffold = false;
    const dec = nextDecision(state(), mastery, recent, 1000);
    expect(dec.kind).toBe('RaiseScaffold');
    expect(dec.rationale).toMatch(/adding more support/i);
  });

  it('flag ON: RaiseScaffold still fires but with a warm, reachable-foothold rationale', () => {
    (PARAMS as any).frustrationScaffold = true;
    const dec = nextDecision(state(), mastery, recent, 1000);
    expect(dec.kind).toBe('RaiseScaffold');
    expect(dec.rationale).toMatch(/smaller step together|hint to get you started/i);
  });

  it('the felt wall is preserved: below the error threshold, no RaiseScaffold even with the flag on', () => {
    (PARAMS as any).frustrationScaffold = true;
    const s = state();
    s.consecutiveErrors = PARAMS.raiseErrorsM - 1;
    s.disengagedScaffoldCount = 0;
    const dec = nextDecision(s, mastery, recent, 1000);
    expect(dec.kind).not.toBe('RaiseScaffold');
  });
});

// ---------------------------------------------------------------------------
// U9/KTD7 — disengagement-driven frustration scaffold, DECOUPLED from escalation.
// The disengagement writer arms `disengagedScaffoldCount` (separate counter), which
// at the LOWER `nDisengScaffold` threshold yields a reachable RaiseScaffold when the
// flag is on — WITHOUT firing EscalateToHuman (which reads `disengagedCount`/nDiseng).
// ---------------------------------------------------------------------------

describe('U9 disengagement-driven frustration scaffold (decoupled from escalation)', () => {
  afterEach(() => { (PARAMS as any).frustrationScaffold = false; });

  it('flag ON + disengagedScaffoldCount ≥ nDisengScaffold → reachable warm RaiseScaffold', () => {
    (PARAMS as any).frustrationScaffold = true;
    const s = state();
    s.consecutiveErrors = 0;                                  // NOT the error path
    s.disengagedScaffoldCount = PARAMS.escalation.nDisengScaffold;
    const dec = nextDecision(s, mastery, recent, 1000);
    expect(dec.kind).toBe('RaiseScaffold');
    expect(dec.rationale).toMatch(/smaller step together|hint to get you started/i);
    if (dec.kind === 'RaiseScaffold') expect(dec.preserveWork).toBe(true);
  });

  it('DECOUPLING: disengagedScaffoldCount past its threshold does NOT fire EscalateToHuman (escalation counter is 0)', () => {
    (PARAMS as any).frustrationScaffold = true;
    const s = state();
    // Arm the SCAFFOLD counter well past escalation's nDiseng, but keep the
    // escalation counter (disengagedCount) at 0. Escalation must NOT fire.
    s.disengagedScaffoldCount = PARAMS.escalation.nDiseng + 5;
    s.disengagedCount = 0;
    const dec = nextDecision(s, mastery, recent, 1000);
    expect(dec.kind).not.toBe('EscalateToHuman');
    expect(dec.kind).toBe('RaiseScaffold');
  });

  it('flag OFF: disengagedScaffoldCount past threshold is inert (reversible no-op, no scaffold injection)', () => {
    (PARAMS as any).frustrationScaffold = false;
    const s = state();
    s.consecutiveErrors = 0;
    s.disengagedScaffoldCount = PARAMS.escalation.nDisengScaffold + 3;
    const dec = nextDecision(s, mastery, recent, 1000);
    // No frustration scaffold; falls through to the default (PresentProblem here).
    expect(dec.kind).not.toBe('RaiseScaffold');
  });

  it('escalation still fires on its OWN counter (disengagedCount ≥ nDiseng), independent of the scaffold path', () => {
    (PARAMS as any).frustrationScaffold = false;
    const s = state();
    s.disengagedCount = PARAMS.escalation.nDiseng;   // escalation counter armed
    s.disengagedScaffoldCount = 0;
    const dec = nextDecision(s, mastery, recent, 1000);
    expect(dec.kind).toBe('EscalateToHuman');
    if (dec.kind === 'EscalateToHuman') expect(dec.reason).toBe('disengaged');
  });
});
