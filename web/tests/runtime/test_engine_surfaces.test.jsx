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
});
