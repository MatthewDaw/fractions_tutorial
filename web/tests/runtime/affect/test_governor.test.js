// test_governor.test.js — Phase 2 (plan 005, S5): the nudge-fatigue governor.
//
// "A per-child intervention budget; dismissed offers throttle further offers so the
//  watcher can't manufacture the disengagement it then detects." Backoff grows with
//  dismissals; a genuinely accepted offer clears the penalty.

import { describe, it, expect } from 'vitest';
import {
  makeGovernor,
  canOffer,
  registerOffer,
  registerDismissal,
  registerAccepted,
  effectiveCooldown,
  GOVERNOR_PARAMS,
} from '../../../src/runtime/affect/governor.js';

describe('governor — intervention budget', () => {
  it('exhausts after maxOffers offers', () => {
    let g = makeGovernor();
    let attempt = 0;
    let offers = 0;
    while (canOffer(g, attempt)) {
      g = registerOffer(g, attempt);
      offers += 1;
      attempt += GOVERNOR_PARAMS.baseCooldown; // wait out the cooldown each time
      if (offers > 50) break; // safety
    }
    expect(offers).toBe(GOVERNOR_PARAMS.maxOffers);
    expect(canOffer(g, attempt + 100)).toBe(false);
  });
});

describe('governor — cooldown', () => {
  it('blocks a second offer until the cooldown elapses', () => {
    let g = makeGovernor();
    g = registerOffer(g, 0);
    expect(canOffer(g, 1)).toBe(false);                         // too soon
    expect(canOffer(g, GOVERNOR_PARAMS.baseCooldown)).toBe(true); // cooldown elapsed
  });
});

describe('governor — dismissal throttle (anti-manufacture)', () => {
  it('each dismissal grows the effective cooldown', () => {
    let g = makeGovernor();
    const c0 = effectiveCooldown(g);
    g = registerDismissal(g);
    const c1 = effectiveCooldown(g);
    g = registerDismissal(g);
    const c2 = effectiveCooldown(g);
    expect(c1).toBeGreaterThan(c0);
    expect(c2).toBeGreaterThan(c1);
  });

  it('after dismissals the same gap that used to allow an offer no longer does', () => {
    let g = makeGovernor();
    g = registerOffer(g, 0);
    g = registerDismissal(g);
    g = registerDismissal(g);
    // baseCooldown gap would have allowed a fresh offer; now it must not.
    expect(canOffer(g, GOVERNOR_PARAMS.baseCooldown)).toBe(false);
  });
});

describe('governor — accepted offer clears the penalty', () => {
  it('registerAccepted resets dismissal backoff to baseline', () => {
    let g = makeGovernor();
    g = registerDismissal(g);
    g = registerDismissal(g);
    expect(effectiveCooldown(g)).toBeGreaterThan(GOVERNOR_PARAMS.baseCooldown);
    g = registerAccepted(g);
    expect(effectiveCooldown(g)).toBe(GOVERNOR_PARAMS.baseCooldown);
  });
});

describe('governor — immutability', () => {
  it('register* return new state, leaving the prior untouched', () => {
    const g0 = makeGovernor();
    const g1 = registerOffer(g0, 0);
    expect(g0.budget).toBe(GOVERNOR_PARAMS.maxOffers);
    expect(g1.budget).toBe(GOVERNOR_PARAMS.maxOffers - 1);
  });
});
