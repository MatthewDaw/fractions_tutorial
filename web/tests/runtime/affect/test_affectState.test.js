// test_affectState.test.js — Phase 2 (plan 005, S5): AffectState from behavior.
//
// "AffectState produced from behavior first: {engagement, attention, confidence}
//  derived from the composite (valence stays neutral until self-report/camera exist).
//  Smoothed ~1–2 Hz, windowed onto each attempt." Valence-neutral is a firewall
//  invariant: Phase 2 has NO emotion/valence inference.

import { describe, it, expect } from 'vitest';
import {
  neutralAffect,
  deriveAffect,
  smoothAffect,
} from '../../../src/runtime/affect/affectState.js';
import { computeComposite } from '../../../src/runtime/affect/composite.js';

function obs(type, confidence = 0.9) {
  return { signal: { type, confidence, payload: {} }, observeOnly: false, attemptIndex: 0 };
}

describe('affectState — neutral baseline', () => {
  it('no signals → high engagement/attention, neutral valence', () => {
    const a = deriveAffect(computeComposite([], { hintState: 0 }), []);
    expect(a.engagement).toBeGreaterThan(0.8);
    expect(a.attention).toBeGreaterThan(0.8);
    expect(a.valence).toBe('neutral');
  });
});

describe('affectState — VALENCE FIREWALL (no emotion inference in Phase 2)', () => {
  it('valence is neutral no matter what behavioral signals fire', () => {
    const heavy = computeComposite(
      [obs('idle'), obs('orphaned_interaction'), obs('latency_stall'), obs('rapid_submit')],
      { hintState: 3 }
    );
    expect(deriveAffect(heavy, []).valence).toBe('neutral');
    expect(smoothAffect(neutralAffect(), deriveAffect(heavy, []), 0.5).valence).toBe('neutral');
  });
});

describe('affectState — directionality', () => {
  it('engagement drops as the composite score rises', () => {
    const low = deriveAffect(computeComposite([obs('idle')], { hintState: 0 }), []);
    const high = deriveAffect(
      computeComposite([obs('idle'), obs('orphaned_interaction'), obs('rapid_submit')], { hintState: 0 }),
      []
    );
    expect(high.engagement).toBeLessThan(low.engagement);
  });

  it('attention drops with idle + latency_stall', () => {
    const base = deriveAffect(computeComposite([], { hintState: 0 }), []);
    const stalled = deriveAffect(
      computeComposite([obs('idle'), obs('latency_stall')], { hintState: 0 }),
      []
    );
    expect(stalled.attention).toBeLessThan(base.attention);
  });

  it('all dimensions stay within [0,1]', () => {
    const a = deriveAffect(
      computeComposite([obs('idle'), obs('orphaned_interaction'), obs('latency_stall'), obs('rapid_submit')], { hintState: 5 }),
      []
    );
    for (const k of ['engagement', 'attention', 'confidence']) {
      expect(a[k]).toBeGreaterThanOrEqual(0);
      expect(a[k]).toBeLessThanOrEqual(1);
    }
  });
});

describe('affectState — smoothing', () => {
  it('a single spike does not fully swing the smoothed state', () => {
    const prev = neutralAffect();
    const spike = deriveAffect(
      computeComposite([obs('idle'), obs('orphaned_interaction'), obs('latency_stall')], { hintState: 3 }),
      []
    );
    const smoothed = smoothAffect(prev, spike, 0.4);
    // smoothed engagement sits between prev and the raw spike
    expect(smoothed.engagement).toBeLessThan(prev.engagement);
    expect(smoothed.engagement).toBeGreaterThan(spike.engagement);
  });
});
