// test_engine_surfaces.test.jsx — locks in the store → surface wiring that makes
// the brief's "why did this change?" banner, Tier-2 nudge toast, and counter-
// metric inspector actually appear from engine output (they were orphan files
// before). Pure store assertions + a render of EngineSurfaces driven by the store.
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import React from 'react';

import {
  publishDecision,
  publishNudge,
  clearNudge,
  resetEngineStore,
  getSnapshot,
  markTrigger,
  acknowledgeRationale,
  deriveUiMetrics,
} from '../../src/runtime/engineStore.js';
import EngineSurfaces from '../../src/ui/EngineSurfaces.jsx';

beforeEach(() => {
  resetEngineStore();
  cleanup();
});

describe('engineStore', () => {
  it('starts empty', () => {
    const s = getSnapshot();
    expect(s.rationale).toBe('');
    expect(s.decision).toBeNull();
    expect(s.decisionLog).toEqual([]);
    expect(s.metrics.uiChurn).toBe(0);
  });

  it('publishDecision records rationale, decision, log entry, and mastery map', () => {
    const dec = { kind: 'PresentProblem', rationale: 'Continue at this level.' };
    const map = { ADD_SAME_DEN: { P_known: 0.4 } };
    publishDecision(dec, map, 123);
    const s = getSnapshot();
    expect(s.rationale).toBe('Continue at this level.');
    expect(s.decision).toBe(dec);
    expect(s.masteryMap).toBe(map);
    expect(s.decisionLog).toHaveLength(1);
    expect(s.decisionLog[0]).toMatchObject({ kind: 'PresentProblem', t: 123 });
  });

  it('counts scaffold changes as UI churn (and nothing else)', () => {
    publishDecision({ kind: 'PresentProblem', rationale: 'a' }, null, 1);
    publishDecision({ kind: 'FadeScaffold', rationale: 'b' }, null, 2);
    publishDecision({ kind: 'RaiseScaffold', rationale: 'c' }, null, 3);
    publishDecision({ kind: 'TransferProbe', rationale: 'd' }, null, 4);
    expect(getSnapshot().metrics.uiChurn).toBe(2); // only Fade + Raise
  });

  it('caps the decision log at 50 entries', () => {
    for (let i = 0; i < 60; i++) {
      publishDecision({ kind: 'PresentProblem', rationale: `r${i}` }, null, i);
    }
    expect(getSnapshot().decisionLog).toHaveLength(50);
    expect(getSnapshot().decisionLog[49].rationale).toBe('r59');
  });

  it('publishNudge / clearNudge round-trips', () => {
    publishNudge({ type: 'TAKE_YOUR_TIME', text: 'No rush.' }, 5);
    expect(getSnapshot().nudge).toMatchObject({ type: 'TAKE_YOUR_TIME', t: 5 });
    clearNudge();
    expect(getSnapshot().nudge).toBeNull();
  });
});

describe('engineStore — UI2 UI-responsiveness metrics', () => {
  it('starts with an empty uiMetrics record', () => {
    const s = getSnapshot();
    expect(s.uiMetrics).toMatchObject({
      timeToChangeTotalMs: 0,
      timeToChangeCount: 0,
      changeBannersShown: 0,
      changeBannersAcked: 0,
      uiChanges: 0,
      problemsJudged: 0,
    });
    const d = deriveUiMetrics();
    expect(d.avgTimeToChangeMs).toBeNull();
    expect(d.ackRate).toBeNull();
    expect(d.churnRate).toBeNull();
  });

  it('computes time-to-UI-change as surface_t − trigger_t for CHANGE decisions', () => {
    // Trigger opens at t=1000, the FadeScaffold surfaces at t=1040 → 40ms.
    markTrigger(1000);
    publishDecision({ kind: 'FadeScaffold', rationale: 'reducing support' }, null, 1040);
    // Second change: trigger at 2000, surfaces at 2010 → 10ms. Mean = (40+10)/2 = 25.
    markTrigger(2000);
    publishDecision({ kind: 'RaiseScaffold', rationale: 'adding support' }, null, 2010);
    expect(deriveUiMetrics().avgTimeToChangeMs).toBe(25);
  });

  it('does NOT time routine PresentProblem (only CHANGE_KIND decisions)', () => {
    markTrigger(100);
    publishDecision({ kind: 'PresentProblem', rationale: 'continue' }, null, 130);
    const d = deriveUiMetrics();
    expect(d.avgTimeToChangeMs).toBeNull(); // no change-decision timed
    expect(d.problemsJudged).toBe(1); // but it still counts as a judged problem
    expect(d.uiChanges).toBe(0);
  });

  it('drops a backwards clock (no negative time-to-change)', () => {
    markTrigger(5000);
    publishDecision({ kind: 'FadeScaffold', rationale: 'x' }, null, 4000); // clock went back
    expect(deriveUiMetrics().avgTimeToChangeMs).toBeNull();
  });

  it('counts a trigger only once — a routine publish after a change is untimed', () => {
    markTrigger(0);
    publishDecision({ kind: 'FadeScaffold', rationale: 'x' }, null, 20); // consumes trigger
    publishDecision({ kind: 'FadeScaffold', rationale: 'y' }, null, 999); // no open trigger
    const d = deriveUiMetrics();
    expect(d.avgTimeToChangeMs).toBe(20); // only the first was timed
    expect(d.changeBannersShown).toBe(2);
  });

  it('ack-rate = acknowledged change-banners / change-banners shown', () => {
    publishDecision({ kind: 'FadeScaffold', rationale: 'a' }, null, 1); // shown=1
    publishDecision({ kind: 'RaiseScaffold', rationale: 'b' }, null, 2); // shown=2
    publishDecision({ kind: 'TransferProbe', rationale: 'c' }, null, 3); // shown=3
    acknowledgeRationale(); // acked=1
    acknowledgeRationale(); // acked=2
    expect(deriveUiMetrics().ackRate).toBeCloseTo(2 / 3, 5);
  });

  it('ack count is bounded by banners shown (rate never exceeds 1.0)', () => {
    publishDecision({ kind: 'FadeScaffold', rationale: 'a' }, null, 1); // shown=1
    acknowledgeRationale();
    acknowledgeRationale(); // extra ack ignored
    acknowledgeRationale();
    expect(deriveUiMetrics().ackRate).toBe(1);
    expect(getSnapshot().uiMetrics.changeBannersAcked).toBe(1);
  });

  it('churn-rate = UI changes / problems judged', () => {
    // 5 problems judged, 2 of which changed the UI → 0.4.
    publishDecision({ kind: 'PresentProblem', rationale: 'p' }, null, 1);
    publishDecision({ kind: 'FadeScaffold', rationale: 'c' }, null, 2);
    publishDecision({ kind: 'PresentProblem', rationale: 'p' }, null, 3);
    publishDecision({ kind: 'RaiseScaffold', rationale: 'c' }, null, 4);
    publishDecision({ kind: 'PresentProblem', rationale: 'p' }, null, 5);
    const d = deriveUiMetrics();
    expect(d.churnRate).toBeCloseTo(0.4, 5);
    expect(d.uiChanges).toBe(2);
    expect(d.problemsJudged).toBe(5);
  });

  it('end-to-end: a simulated decision sequence yields all three metrics', () => {
    // Three problems: P (routine), Fade (change, 30ms, acked), Raise (change, 50ms, not acked).
    markTrigger(0);
    publishDecision({ kind: 'PresentProblem', rationale: 'continue' }, null, 12);
    markTrigger(100);
    publishDecision({ kind: 'FadeScaffold', rationale: 'fewer guides' }, null, 130); // 30ms
    acknowledgeRationale(); // learner read the Fade rationale
    markTrigger(200);
    publishDecision({ kind: 'RaiseScaffold', rationale: 'more guides' }, null, 250); // 50ms

    const d = deriveUiMetrics();
    expect(d.avgTimeToChangeMs).toBe(40); // (30 + 50) / 2
    expect(d.ackRate).toBeCloseTo(1 / 2, 5); // 1 of 2 change-banners acked
    expect(d.churnRate).toBeCloseTo(2 / 3, 5); // 2 changes over 3 problems
  });

  it('resetEngineStore clears uiMetrics and the pending trigger', () => {
    markTrigger(10);
    publishDecision({ kind: 'FadeScaffold', rationale: 'x' }, null, 30);
    acknowledgeRationale();
    resetEngineStore();
    const s = getSnapshot();
    expect(s.pendingTriggerT).toBeNull();
    expect(deriveUiMetrics(s.uiMetrics).avgTimeToChangeMs).toBeNull();
    expect(deriveUiMetrics(s.uiMetrics).churnRate).toBeNull();
  });

  it('legacy uiChurn (learning metric) is unchanged by UI2 instrumentation', () => {
    publishDecision({ kind: 'FadeScaffold', rationale: 'a' }, null, 1);
    publishDecision({ kind: 'RaiseScaffold', rationale: 'b' }, null, 2);
    publishDecision({ kind: 'TransferProbe', rationale: 'c' }, null, 3);
    expect(getSnapshot().metrics.uiChurn).toBe(2); // still only Fade + Raise
  });
});

describe('EngineSurfaces', () => {
  it('shows the rationale banner when active and a rationale exists', () => {
    publishDecision({ kind: 'FadeScaffold', rationale: '3 clean answers — reducing support.' }, null, 1);
    render(<EngineSurfaces active showInspector={false} />);
    const banner = screen.getByTestId('rationale-banner');
    expect(banner.textContent).toMatch(/reducing support/i);
  });

  it('hides the banner when not active (e.g. on the world map)', () => {
    publishDecision({ kind: 'FadeScaffold', rationale: 'should not show' }, null, 1);
    render(<EngineSurfaces active={false} showInspector={false} />);
    expect(screen.queryByTestId('rationale-banner')).toBeNull();
  });

  it('does NOT show the banner for a routine PresentProblem (anti-churn)', () => {
    // PresentProblem fires on every answer; surfacing it as "why did this change"
    // would be noise. It still lands in the decision log (inspector), not the banner.
    publishDecision({ kind: 'PresentProblem', rationale: 'Continue at this level.' }, null, 1);
    render(<EngineSurfaces active showInspector={false} />);
    expect(screen.queryByTestId('rationale-banner')).toBeNull();
  });

  it('shows a Tier-2 nudge toast when active', () => {
    publishNudge({ type: 'HINT_OFFER', text: 'Take a look at the picture.' }, 1);
    render(<EngineSurfaces active showInspector={false} />);
    const toast = screen.getByTestId('engine-nudge');
    expect(toast.getAttribute('data-nudge-type')).toBe('HINT_OFFER');
  });

  it('renders the inspector toggle when showInspector is set', () => {
    render(<EngineSurfaces active showInspector />);
    expect(screen.getByTestId('inspector-toggle')).toBeTruthy();
  });

  it('reflects a new rationale live after a later publish', () => {
    render(<EngineSurfaces active showInspector={false} />);
    expect(screen.queryByTestId('rationale-banner')).toBeNull();
    act(() => {
      publishDecision({ kind: 'RaiseScaffold', rationale: 'Adding support after errors.' }, null, 2);
    });
    expect(screen.getByTestId('rationale-banner').textContent).toMatch(/adding support/i);
  });

  it('UI2: dismissing the change-rationale banner records an ack', () => {
    publishDecision({ kind: 'FadeScaffold', rationale: 'fewer guides' }, null, 1);
    render(<EngineSurfaces active showInspector={false} />);
    expect(deriveUiMetrics().ackRate).toBe(0); // shown, not yet acked
    act(() => {
      screen.getByTestId('rationale-banner').querySelector('button').click();
    });
    expect(deriveUiMetrics().ackRate).toBe(1); // dismiss = ack
  });

  it('UI2: the inspector renders the three UI-responsiveness metrics', () => {
    markTrigger(0);
    publishDecision({ kind: 'FadeScaffold', rationale: 'x' }, null, 30);
    render(<EngineSurfaces active={false} showInspector />);
    act(() => {
      screen.getByTestId('inspector-toggle').click();
    });
    expect(screen.getByTestId('metric-timeToChange').textContent).toMatch(/30 ms/);
    expect(screen.getByTestId('metric-ackRate').textContent).toMatch(/0%/);
    expect(screen.getByTestId('metric-churnRate').textContent).toMatch(/1\.00/);
  });
});
