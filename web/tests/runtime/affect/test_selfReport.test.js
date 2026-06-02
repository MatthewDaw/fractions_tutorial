// test_selfReport.test.js — Phase 3 (plan 005, S3): the self-report companion.
//
// The child's tap is a consented, FIRST-CLASS signal AND the gold-standard label.
//   - It is a corroborated Signal — DISCARDED if behavior flatly contradicts it
//     (an "easy!" after three wrong answers; a "tricky!" after three clean corrects).
//   - The raw report is ALWAYS written to the ledger/harness as the gold label —
//     even a contradicted report is data (self-report vs behavior mismatch).
//   - Applying the report RESOLVES pending affect hypotheses against ground truth.

import { describe, it, expect } from 'vitest';
import {
  evaluateSelfReport,
  applySelfReportToLedger,
  SELF_REPORT_PARAMS,
} from '../../../src/runtime/affect/selfReport.js';
import { makeLedger, record, report } from '../../../src/runtime/affect/ledger.js';

function ob(correct, hint_max_rung = 0) {
  return { correct, hint_max_rung };
}

describe('evaluateSelfReport — corroboration', () => {
  it('"tricky" amid struggle is corroborated and yields a gold-standard Signal', () => {
    const r = evaluateSelfReport('tricky', [ob(false), ob(false, 2), ob(true, 3)]);
    expect(r.corroborated).toBe(true);
    expect(r.signal).not.toBeNull();
    expect(r.signal.type).toBe('self_report');
    expect(r.signal.confidence).toBe(1); // consented gold standard
    expect(r.signal.payload.choice).toBe('tricky');
  });

  it('"easy" after three wrong is DISCARDED (behavior contradicts) but still logged', () => {
    const r = evaluateSelfReport('easy', [ob(false), ob(false), ob(false)]);
    expect(r.corroborated).toBe(false);
    expect(r.signal).toBeNull();                // discarded as an actionable signal
    expect(r.goldLabel.report).toBe('easy');    // raw report still captured
    expect(r.goldLabel.corroborated).toBe(false);
  });

  it('"easy" amid clean corrects is corroborated', () => {
    const r = evaluateSelfReport('easy', [ob(true), ob(true), ob(true)]);
    expect(r.corroborated).toBe(true);
    expect(r.signal).not.toBeNull();
  });

  it('"tricky" after three clean hint-free corrects is contradicted (discarded)', () => {
    const r = evaluateSelfReport('tricky', [ob(true, 0), ob(true, 0), ob(true, 0)]);
    expect(r.corroborated).toBe(false);
    expect(r.signal).toBeNull();
  });

  it('always returns a gold label regardless of corroboration', () => {
    const a = evaluateSelfReport('easy', [ob(false), ob(false), ob(false)]);
    const b = evaluateSelfReport('tricky', [ob(false)]);
    expect(a.goldLabel.report).toBe('easy');
    expect(b.goldLabel.report).toBe('tricky');
  });
});

describe('applySelfReportToLedger — gold label resolves pending hypotheses', () => {
  it('"tricky" confirms a pending struggle hypothesis', () => {
    let l = makeLedger();
    l = record(l, { trigger: 'idle', hypothesis: 'disengaged', action: 'T2', severity: 'low', behavior_confirmed: null });
    l = applySelfReportToLedger(l, 'tricky');
    expect(report(l).confirmed).toBe(1);
    expect(report(l).pending).toBe(0);
  });

  it('"easy" contradicts a pending struggle hypothesis (false alarm)', () => {
    let l = makeLedger();
    l = record(l, { trigger: 'idle', hypothesis: 'disengaged', action: 'T2', severity: 'low', behavior_confirmed: null });
    l = applySelfReportToLedger(l, 'easy');
    expect(report(l).unconfirmed).toBe(1);
    expect(report(l).pending).toBe(0);
  });

  it('leaves already-resolved entries untouched', () => {
    let l = makeLedger();
    l = record(l, { trigger: 'idle', hypothesis: 'disengaged', action: 'T2', severity: 'low', behavior_confirmed: true });
    l = applySelfReportToLedger(l, 'easy');
    expect(report(l).confirmed).toBe(1); // unchanged
  });
});

describe('evaluateSelfReport — determinism', () => {
  it('identical input → identical output', () => {
    const hist = [ob(false), ob(true, 2)];
    expect(evaluateSelfReport('tricky', hist)).toEqual(evaluateSelfReport('tricky', hist));
  });
});
