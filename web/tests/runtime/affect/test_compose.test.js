// test_compose.test.js — Phase 2 (plan 005, S5): composeAffect end-to-end.
//
// composeAffect ties composite + affectState + governor + ledger into the value
// that fills the recentBehavior affect slot. Behavior-only adaptation runs through
// T2/T3 here; the ledger records every raised hypothesis; the governor throttles.

import { describe, it, expect } from 'vitest';
import { composeAffect } from '../../../src/runtime/affect/index.js';
import { makeGovernor, GOVERNOR_PARAMS } from '../../../src/runtime/affect/governor.js';
import { makeLedger, report } from '../../../src/runtime/affect/ledger.js';
import { neutralAffect } from '../../../src/runtime/affect/affectState.js';

function obs(type, confidence = 0.9, observeOnly = false) {
  return { signal: { type, confidence, payload: {} }, observeOnly, attemptIndex: 0 };
}

function baseInput(over = {}) {
  return {
    observed: [],
    ctx: { hintState: 0, attemptIndex: 5, context_hash: 'h1' },
    prevAffect: neutralAffect(),
    governor: makeGovernor(),
    ledger: makeLedger(),
    ...over,
  };
}

describe('composeAffect — T1 quiet by default', () => {
  it('no corroboration → no recommendation, untouched ledger and governor', () => {
    const out = composeAffect(baseInput({ observed: [obs('idle')] }));
    expect(out.composite.band).toBe('T1');
    expect(out.recommendedTier).toBe('none');
    expect(out.ledger.entries.length).toBe(0);
    expect(out.governor.budget).toBe(GOVERNOR_PARAMS.maxOffers);
    expect(out.isDisengaged).toBe(false);
  });
});

describe('composeAffect — corroborated escalation', () => {
  it('two channels → T2 recommendation, governor spent, hypothesis logged pending', () => {
    const out = composeAffect(baseInput({ observed: [obs('idle'), obs('orphaned_interaction')] }));
    expect(out.composite.band).toBe('T2');
    expect(out.recommendedTier).toBe('T2');
    expect(out.governor.budget).toBe(GOVERNOR_PARAMS.maxOffers - 1);
    expect(out.ledger.entries.length).toBe(1);
    expect(out.ledger.entries[0].behavior_confirmed).toBe(null); // pending until corroborated
    expect(out.ledger.entries[0].context_hash).toBe('h1');
  });

  it('three strong channels → T3 and isDisengaged true (the recentBehavior slot)', () => {
    const out = composeAffect(
      baseInput({ observed: [obs('idle'), obs('orphaned_interaction'), obs('latency_stall')] })
    );
    expect(out.composite.band).toBe('T3');
    expect(out.isDisengaged).toBe(true);
    expect(out.ledger.entries[0].severity).toBe('high');
  });
});

describe('composeAffect — nudge fatigue suppresses without manufacturing', () => {
  it('an exhausted budget yields no recommendation and an observe-only (unscored) ledger entry', () => {
    let g = makeGovernor();
    g = { ...g, budget: 0 }; // exhausted
    const out = composeAffect(
      baseInput({ observed: [obs('idle'), obs('orphaned_interaction')], governor: g })
    );
    expect(out.recommendedTier).toBe('none');
    // logged for transparency, but not counted as an intervention in precision
    expect(out.ledger.entries.length).toBe(1);
    expect(out.ledger.entries[0].observeOnly).toBe(true);
    expect(report(out.ledger).confirmed + report(out.ledger).unconfirmed).toBe(0);
  });
});

describe('composeAffect — cold-start observe-only signals do not escalate', () => {
  it('observe-only signals stay T1 even when two channels would otherwise corroborate', () => {
    const out = composeAffect(
      baseInput({ observed: [obs('idle', 0.9, true), obs('orphaned_interaction', 0.9, true)] })
    );
    expect(out.composite.band).toBe('T1');
    expect(out.recommendedTier).toBe('none');
  });
});

describe('composeAffect — smoothing + determinism', () => {
  it('smooths affect from prevAffect', () => {
    const out = composeAffect(baseInput({ observed: [obs('idle'), obs('orphaned_interaction')] }));
    expect(out.affectState.engagement).toBeLessThan(1);
    expect(out.affectState.valence).toBe('neutral');
  });

  it('identical input → identical output', () => {
    const i = baseInput({ observed: [obs('idle'), obs('latency_stall')] });
    expect(composeAffect(i)).toEqual(composeAffect(i));
  });
});
