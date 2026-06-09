// test_selfReportProbes_mount.test.jsx — UI8+UI9 (gap-build-260609): the mounting
// test. Proves the two orphaned probes now MOUNT at the governed occasional
// boundary, that the cadence is boundary-only + ≤ once/N + skippable + non-blocking,
// and that recordCoherence actually fires (the dead sink is finally wired).

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, cleanup, fireEvent } from '@testing-library/react';
import React from 'react';

import {
  publishDecision,
  resetEngineStore,
  getSnapshot,
} from '../../src/runtime/engineStore.js';
import SelfReportProbes from '../../src/ui/SelfReportProbes.jsx';

beforeEach(() => {
  resetEngineStore();
  cleanup();
});

// Advance the judged-boundary counter by publishing `n` decisions (each
// publishDecision with a decision appends one decisionLog entry = one boundary).
function advanceBoundaries(n, kind = 'PresentProblem') {
  for (let i = 0; i < n; i++) {
    act(() => {
      publishDecision({ kind, rationale: `r${i}` }, null, i);
    });
  }
}

describe('SelfReportProbes — mounting + cadence', () => {
  it('does NOT surface a probe before N boundaries (boundary-only, occasional)', () => {
    render(<SelfReportProbes active everyN={5} />);
    advanceBoundaries(4); // fewer than N
    expect(screen.queryByTestId('orientation-probe')).toBeNull();
    expect(screen.queryByTestId('affect-probe')).toBeNull();
  });

  it('surfaces exactly ONE probe at the Nth boundary (one per opportunity)', () => {
    render(<SelfReportProbes active everyN={5} />);
    advanceBoundaries(5);
    // The first opportunity is orientation; affect must NOT also be open.
    expect(screen.getByTestId('orientation-probe')).toBeTruthy();
    expect(screen.queryByTestId('affect-probe')).toBeNull();
  });

  it('renders nothing when not active (no probes on title / world map)', () => {
    render(<SelfReportProbes active={false} everyN={5} />);
    advanceBoundaries(10);
    expect(screen.queryByTestId('orientation-probe')).toBeNull();
    expect(screen.queryByTestId('affect-probe')).toBeNull();
  });

  it('wires recordCoherence: answering the orientation probe moves the metric', () => {
    render(<SelfReportProbes active everyN={5} />);
    advanceBoundaries(5);
    expect(getSnapshot().metrics.coherenceAsked).toBe(0);
    // PresentProblem → steady question; "practise" is the coherent answer.
    fireEvent.click(screen.getByRole('button', { name: /practising this kind of problem/i }));
    const s = getSnapshot();
    expect(s.metrics.coherenceAsked).toBe(1);
    expect(s.metrics.coherenceCorrect).toBe(1);
    // The probe is non-blocking: it closes after the tap.
    expect(screen.queryByTestId('orientation-probe')).toBeNull();
  });

  it('is skippable + non-blocking: dismissing records no coherence and closes', () => {
    render(<SelfReportProbes active everyN={5} />);
    advanceBoundaries(5);
    fireEvent.click(screen.getByRole('button', { name: /not now|skip/i }));
    // A skip is never a coherence failure: nothing recorded.
    expect(getSnapshot().metrics.coherenceAsked).toBe(0);
    expect(screen.queryByTestId('orientation-probe')).toBeNull();
  });

  it('never double-prompts: after one probe, the next N-1 boundaries are silent', () => {
    render(<SelfReportProbes active everyN={5} />);
    advanceBoundaries(5);
    // Skip the first probe to free the opportunity.
    fireEvent.click(screen.getByRole('button', { name: /not now|skip/i }));
    // Boundaries 6..9 must NOT surface a probe (≤ once/N, never two in a row).
    advanceBoundaries(4);
    expect(screen.queryByTestId('orientation-probe')).toBeNull();
    expect(screen.queryByTestId('affect-probe')).toBeNull();
    // Boundary 10 alternates to the affect probe.
    advanceBoundaries(1);
    expect(screen.getByTestId('affect-probe')).toBeTruthy();
    expect(screen.queryByTestId('orientation-probe')).toBeNull();
  });

  it('the affect probe routes through selfReport plumbing as an advisory Signal', () => {
    const onAffectReport = vi.fn();
    render(<SelfReportProbes active everyN={5} onAffectReport={onAffectReport} />);
    advanceBoundaries(5);
    fireEvent.click(screen.getByRole('button', { name: /not now|skip/i })); // skip orientation
    advanceBoundaries(5); // boundary 10 → affect probe
    fireEvent.click(screen.getByRole('button', { name: /easy-peasy/i }));
    expect(onAffectReport).toHaveBeenCalledTimes(1);
    const graded = onAffectReport.mock.calls[0][0];
    expect(graded.choice).toBe('easy');
    expect(graded.goldLabel.report).toBe('easy');
    // Advisory only: answering affect must NOT touch the coherence metric or churn.
    expect(getSnapshot().metrics.coherenceAsked).toBe(0);
    expect(getSnapshot().metrics.uiChurn).toBe(0);
  });

  it('the "why did this change?" question appears for a CHANGE_KIND boundary', () => {
    render(<SelfReportProbes active everyN={5} />);
    // 4 routine boundaries, then the 5th is a FadeScaffold change.
    advanceBoundaries(4);
    advanceBoundaries(1, 'FadeScaffold');
    const probe = screen.getByTestId('orientation-probe');
    expect(probe.textContent).toMatch(/why did the screen just change/i);
    // The coherent answer for FadeScaffold is the "doing well" option.
    fireEvent.click(screen.getByRole('button', { name: /doing great, so i get fewer hints/i }));
    const s = getSnapshot();
    expect(s.metrics.coherenceAsked).toBe(1);
    expect(s.metrics.coherenceCorrect).toBe(1);
  });
});
