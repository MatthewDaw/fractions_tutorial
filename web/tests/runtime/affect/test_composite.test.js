// test_composite.test.js — Phase 2 (plan 005, S5): the corroboration composite.
//
// "No single channel intervenes. A weighted composite crosses a band; corroboration
//  as arithmetic." The load-bearing invariant: ONE channel at max CANNOT cross from
//  T1 into T2 — at least two channels must corroborate.

import { describe, it, expect } from 'vitest';
import { computeComposite, COMPOSITE_PARAMS } from '../../../src/runtime/affect/composite.js';

// duck-typed ObservedSignal
function obs(type, confidence = 0.9, observeOnly = false, payload = {}) {
  return { signal: { type, confidence, payload }, observeOnly, attemptIndex: 0 };
}

describe('computeComposite — banding', () => {
  it('no signals → score 0, band T1', () => {
    const r = computeComposite([], { hintState: 0 });
    expect(r.score).toBe(0);
    expect(r.band).toBe('T1');
  });

  it('CORROBORATION INVARIANT: a single channel at max stays T1 (cannot cross alone)', () => {
    // Several high-confidence idle signals — one channel, maxed.
    const r = computeComposite([obs('idle'), obs('idle'), obs('idle')], { hintState: 0 });
    expect(r.byChannel.idle).toBeLessThanOrEqual(COMPOSITE_PARAMS.maxChannelPoints);
    expect(r.score).toBeLessThan(COMPOSITE_PARAMS.t2);
    expect(r.band).toBe('T1');
  });

  it('two distinct channels corroborate → crosses into T2', () => {
    const r = computeComposite([obs('idle'), obs('orphaned_interaction')], { hintState: 0 });
    expect(r.score).toBeGreaterThanOrEqual(COMPOSITE_PARAMS.t2);
    expect(r.band).toBe('T2');
  });

  it('three strong channels → T3', () => {
    const r = computeComposite(
      [obs('idle'), obs('orphaned_interaction'), obs('latency_stall')],
      { hintState: 0 }
    );
    expect(r.score).toBeGreaterThanOrEqual(COMPOSITE_PARAMS.t3);
    expect(r.band).toBe('T3');
  });

  it('hint_spend is its own channel and can be the corroborating second channel', () => {
    const heavyHint = { hintState: COMPOSITE_PARAMS.hintSpendRung + 1 };
    const idleAlone = computeComposite([obs('idle')], { hintState: 0 });
    const idlePlusHint = computeComposite([obs('idle')], heavyHint);
    expect(idleAlone.band).toBe('T1');
    expect(idlePlusHint.band).toBe('T2'); // idle + hint_spend corroborate
  });
});

describe('computeComposite — cold-start exclusion', () => {
  it('observe-only signals do not contribute to the actionable score', () => {
    const r = computeComposite(
      [obs('idle', 0.9, true), obs('orphaned_interaction', 0.9, true)],
      { hintState: 0 }
    );
    expect(r.score).toBe(0);
    expect(r.band).toBe('T1');
  });
});

describe('computeComposite — determinism', () => {
  it('identical input → identical output', () => {
    const sigs = [obs('idle'), obs('latency_stall')];
    expect(computeComposite(sigs, { hintState: 1 })).toEqual(computeComposite(sigs, { hintState: 1 }));
  });
});
