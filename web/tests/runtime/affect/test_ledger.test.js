// test_ledger.test.js — Phase 2 (plan 005, S5): the precision ledger.
//
// "Every affect-raised hypothesis logged with {trigger, hypothesis, action,
//  behavior_confirmed?, severity}. This is the counter-metric artifact — affect's
//  precision-without-behavior, weighted by intervention cost." A false escalation
//  (high cost) must hurt weighted precision far more than a false "take your time".

import { describe, it, expect } from 'vitest';
import { makeLedger, record, resolve, report } from '../../../src/runtime/affect/ledger.js';

function entry(over = {}) {
  return {
    trigger: 'idle',
    hypothesis: 'disengaged',
    action: 'TAKE_YOUR_TIME',
    severity: 'low',
    context_hash: 'abc123',
    behavior_confirmed: null,
    ...over,
  };
}

describe('ledger — append is immutable', () => {
  it('record returns a new ledger and leaves the original untouched', () => {
    const l0 = makeLedger();
    const l1 = record(l0, entry());
    expect(l0.entries.length).toBe(0);
    expect(l1.entries.length).toBe(1);
    expect(typeof l1.entries[0].id).toBe('number');
  });
});

describe('ledger — precision', () => {
  it('precision counts confirmed over resolved; pending is excluded', () => {
    let l = makeLedger();
    l = record(l, entry({ behavior_confirmed: true }));
    l = record(l, entry({ behavior_confirmed: false }));
    l = record(l, entry({ behavior_confirmed: null })); // pending
    const r = report(l);
    expect(r.confirmed).toBe(1);
    expect(r.unconfirmed).toBe(1);
    expect(r.pending).toBe(1);
    expect(r.precision).toBeCloseTo(0.5, 5);
  });

  it('cost-weighted precision punishes a false HIGH-severity escalation harder than a false low', () => {
    // Ledger A: one confirmed low + one false low.
    let a = makeLedger();
    a = record(a, entry({ severity: 'low', behavior_confirmed: true }));
    a = record(a, entry({ severity: 'low', behavior_confirmed: false }));
    // Ledger B: one confirmed low + one false HIGH (escalation).
    let b = makeLedger();
    b = record(b, entry({ severity: 'low', behavior_confirmed: true }));
    b = record(b, entry({ severity: 'high', action: 'EscalateToHuman', behavior_confirmed: false }));

    expect(report(b).costWeightedPrecision).toBeLessThan(report(a).costWeightedPrecision);
  });
});

describe('ledger — per-trigger breakdown (does each signal earn its place)', () => {
  it('reports precision per trigger channel', () => {
    let l = makeLedger();
    l = record(l, entry({ trigger: 'idle', behavior_confirmed: true }));
    l = record(l, entry({ trigger: 'idle', behavior_confirmed: false }));
    l = record(l, entry({ trigger: 'latency_stall', behavior_confirmed: true }));
    const r = report(l);
    expect(r.byTrigger.idle.raised).toBe(2);
    expect(r.byTrigger.idle.precision).toBeCloseTo(0.5, 5);
    expect(r.byTrigger.latency_stall.precision).toBeCloseTo(1, 5);
  });
});

describe('ledger — resolve a pending hypothesis', () => {
  it('resolve flips a pending entry and updates precision', () => {
    let l = makeLedger();
    l = record(l, entry({ behavior_confirmed: null }));
    const id = l.entries[0].id;
    expect(report(l).pending).toBe(1);
    l = resolve(l, id, true);
    expect(report(l).pending).toBe(0);
    expect(report(l).confirmed).toBe(1);
  });
});

describe('ledger — observe-only entries are logged but excluded from precision', () => {
  it('control-window hypotheses do not count toward precision', () => {
    let l = makeLedger();
    l = record(l, entry({ observeOnly: true, behavior_confirmed: false }));
    const r = report(l);
    expect(l.entries.length).toBe(1);      // logged
    expect(r.confirmed + r.unconfirmed).toBe(0); // not scored
  });
});
