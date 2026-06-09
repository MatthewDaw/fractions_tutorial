// test_selfReportCadence.test.js — UI8+UI9 (gap-build-260609): the shared
// occasional cadence governor. Pure-policy assertions: boundary-only, at most once
// every N, never two in a row, one probe per opportunity, alternating channels.

import { describe, it, expect } from 'vitest';
import {
  makeCadenceState,
  decideProbe,
  consumeOpportunity,
  SELF_REPORT_CADENCE,
} from '../../../src/runtime/affect/selfReportCadence.js';

describe('selfReportCadence', () => {
  it('never fires before the first boundary (boundary-only)', () => {
    const s = makeCadenceState();
    expect(decideProbe(s, 0).show).toBe(false);
    expect(decideProbe(s, -1).show).toBe(false);
    expect(decideProbe(s, NaN).show).toBe(false);
  });

  it('waits N boundaries before the first probe', () => {
    const s = makeCadenceState();
    for (let n = 1; n < SELF_REPORT_CADENCE.everyN; n++) {
      expect(decideProbe(s, n).show).toBe(false);
    }
    expect(decideProbe(s, SELF_REPORT_CADENCE.everyN).show).toBe(true);
  });

  it('fires at most once every N boundaries', () => {
    let s = makeCadenceState();
    const N = 5;
    // First opportunity at boundary 5.
    expect(decideProbe(s, 5, N).show).toBe(true);
    s = consumeOpportunity(s, 5);
    // No probe again until 5 more boundaries (6..9 silent, 10 fires).
    for (let n = 6; n < 10; n++) {
      expect(decideProbe(s, n, N).show).toBe(false);
    }
    expect(decideProbe(s, 10, N).show).toBe(true);
  });

  it('never fires two boundaries in a row, even if misconfigured N=1', () => {
    let s = makeCadenceState();
    // minGap is clamped to >=2, so even N=1 cannot fire back-to-back.
    expect(decideProbe(s, 1, 1).show).toBe(false); // first opp still waits the gap
    expect(decideProbe(s, 2, 1).show).toBe(true);
    s = consumeOpportunity(s, 2);
    expect(decideProbe(s, 3, 1).show).toBe(false); // not the very next boundary
    expect(decideProbe(s, 4, 1).show).toBe(true);
  });

  it('alternates orientation then affect (one probe per opportunity)', () => {
    let s = makeCadenceState();
    const N = 5;
    const first = decideProbe(s, 5, N);
    expect(first).toEqual({ show: true, kind: 'orientation' });
    s = consumeOpportunity(s, 5);
    const second = decideProbe(s, 10, N);
    expect(second).toEqual({ show: true, kind: 'affect' });
    s = consumeOpportunity(s, 10);
    const third = decideProbe(s, 15, N);
    expect(third).toEqual({ show: true, kind: 'orientation' });
  });

  it('a consumed (skipped) opportunity still advances the cadence', () => {
    let s = makeCadenceState();
    const N = 5;
    expect(decideProbe(s, 5, N).show).toBe(true);
    s = consumeOpportunity(s, 5); // child skipped — still consumes
    expect(decideProbe(s, 6, N).show).toBe(false);
    expect(s.lastShownAt).toBe(5);
    expect(s.shownCount).toBe(1);
  });
});
