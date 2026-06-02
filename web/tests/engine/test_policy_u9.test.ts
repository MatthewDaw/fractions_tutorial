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
    const dec = nextDecision(s, mastery, recent, 1000);
    expect(dec.kind).not.toBe('RaiseScaffold');
  });
});
