// test_disengaged_writer_u9.test.jsx — U9/KTD7: the disengagement WRITER.
//
// Plan 002 U9 / improvement 2026-06-08-wire-disengaged-count.md:
//   The confirmed bug is that the disengagement counter is never WRITTEN, so the
//   disengaged-triggered frustration scaffold is structurally unreachable. This
//   test pins the new input edge:
//     - the writer INCREMENTS the (separate, decoupled) disengagedScaffoldCount on
//       the observe-layer disengagement signal at the submit boundary,
//     - it RESETS on a re-engaged attempt (mirrors how consecutiveErrors resets),
//     - it NEVER touches disengagedCount (the escalation counter) — so arming the
//       scaffold trigger does NOT spuriously fire EscalateToHuman,
//     - it does NOT touch consecutiveErrors,
//     - nextDecision is still called EXACTLY ONCE per submit boundary.
//
// The engine policy modules are mocked (the .jsx runtime tests cannot resolve the
// engine through the .ts seam reliably). The observe layer is the REAL module —
// the writer's input signal must come from the genuine observe floor. We therefore
// assert on the live mutable PolicyState object the hook hands to nextDecision.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---- Engine mocks (same shape as test_useLessonEngine.test.jsx) -------------
vi.mock('../../src/engine/index.js', () => {
  let _log = [];
  return {
    appendEvent: vi.fn((log, event) => { const next = [...log, event]; _log = next; return next; }),
    loadLog: vi.fn(() => _log),
    saveLog: vi.fn((log) => { _log = [...log]; }),
    migrateFromKitchenProgress: vi.fn(() => ({})),
    foldLog: vi.fn((log, init, reducer) => log.reduce(reducer, init)),
  };
});

vi.mock('../../src/engine/measurementReduce.js', () => ({
  measurementReduce: vi.fn(() => ({
    mastery: {
      ADD_SAME_DEN: {
        P_known: 0.5,
        fluency_stats: { median_latency: null, slope: null, n: 0 },
        max_scaffold_passed: null,
        transfer_passed: false,
        hint_dependence: 0,
        last_retention_probe: null,
        mastered_at: null,
      },
    },
  })),
}));

// nextDecision spy: capture every PolicyState snapshot it is called with, plus a
// running call count (boundary-once rule).
const captured = [];
vi.mock('../../src/engine/policy.js', () => ({
  nextDecision: vi.fn((policyState) => {
    // Snapshot the counters at call time (the ref mutates across attempts).
    captured.push({
      disengagedScaffoldCount: policyState.disengagedScaffoldCount,
      disengagedCount: policyState.disengagedCount,
      consecutiveErrors: policyState.consecutiveErrors,
    });
    return { kind: 'PresentProblem', node: 'ADD_SAME_DEN', scaffold: 0, surface_form: 'default', rationale: 'continue' };
  }),
}));

// isMastered (gate) is real but harmless here.
import { useLessonEngine } from '../../src/runtime/useLessonEngine.js';
import { nextDecision } from '../../src/engine/policy.js';
import { PARAMS } from '../../src/engine/params.js';

// ---------------------------------------------------------------------------
// Drivers: a DISENGAGED attempt (no work, instant submit → observe rapid_submit)
// vs a RE-ENGAGED attempt (worked pieces + a plausible latency).
// ---------------------------------------------------------------------------

/** One disengaged attempt: present then immediately submit with no work events. */
function disengagedAttempt(result) {
  act(() => {
    result.current.emit({ type: 'problem_present', payload: { node_id: 'ADD_SAME_DEN', scaffold_level: 2 } });
  });
  act(() => {
    // Instant, work-free submit → rapid_submit (no_work, latency < floor).
    result.current.judgeAndAdvance({ value: null }, { correct: false });
  });
}

/** One re-engaged attempt: present, place real work, then submit after a pause. */
function engagedAttempt(result) {
  act(() => {
    result.current.emit({ type: 'problem_present', payload: { node_id: 'ADD_SAME_DEN', scaffold_level: 2 } });
  });
  act(() => {
    result.current.emit({ type: 'piece_place', payload: { node_id: 'ADD_SAME_DEN' } });
  });
  act(() => {
    result.current.judgeAndAdvance({ value: [1, 2] }, { correct: true });
  });
}

describe('U9 disengagement writer — input edge wired', () => {
  beforeEach(() => { captured.length = 0; vi.mocked(nextDecision).mockClear(); });

  it('increments disengagedScaffoldCount on sustained disengagement (past the observe cold-start window)', () => {
    const { result } = renderHook(() => useLessonEngine({ nodeId: 'ADD_SAME_DEN' }));
    // observe driftControlN = 3 control attempts (observe-only). Drive enough
    // disengaged attempts that at least one actionable disengagement signal lands.
    for (let i = 0; i < 6; i++) disengagedAttempt(result);

    const finalCount = captured[captured.length - 1].disengagedScaffoldCount;
    // The counter is non-zero (the writer fired) once past the cold-start window,
    // AND reaches the frustration-scaffold threshold — so the policy's reachable
    // RaiseScaffold branch (proven in test_policy_u9.test.ts) is actually arrivable
    // from a live disengaged window (the end-to-end reachability the finding needs).
    expect(finalCount).toBeGreaterThan(0);
    expect(finalCount).toBeGreaterThanOrEqual(PARAMS.escalation.nDisengScaffold);
  });

  it('DECOUPLING: the escalation counter (disengagedCount) stays 0 — no spurious EscalateToHuman arming', () => {
    const { result } = renderHook(() => useLessonEngine({ nodeId: 'ADD_SAME_DEN' }));
    for (let i = 0; i < 6; i++) disengagedAttempt(result);

    // Every snapshot must show disengagedCount === 0: the writer feeds ONLY the
    // separate scaffold counter, never the escalation counter.
    for (const snap of captured) {
      expect(snap.disengagedCount).toBe(0);
    }
  });

  it('resets disengagedScaffoldCount on a re-engaged attempt (mirrors consecutiveErrors reset)', () => {
    const { result } = renderHook(() => useLessonEngine({ nodeId: 'ADD_SAME_DEN' }));
    for (let i = 0; i < 6; i++) disengagedAttempt(result);
    const armed = captured[captured.length - 1].disengagedScaffoldCount;
    expect(armed).toBeGreaterThan(0);

    engagedAttempt(result);
    const afterReengage = captured[captured.length - 1].disengagedScaffoldCount;
    expect(afterReengage).toBe(0);
  });

  it('nextDecision is called EXACTLY ONCE per submit boundary', () => {
    const { result } = renderHook(() => useLessonEngine({ nodeId: 'ADD_SAME_DEN' }));
    disengagedAttempt(result);
    expect(nextDecision).toHaveBeenCalledTimes(1);
    disengagedAttempt(result);
    expect(nextDecision).toHaveBeenCalledTimes(2);
  });

  it('does NOT modify consecutiveErrors semantics (still increments once per wrong submit)', () => {
    const { result } = renderHook(() => useLessonEngine({ nodeId: 'ADD_SAME_DEN' }));
    disengagedAttempt(result); // one wrong submit
    expect(captured[0].consecutiveErrors).toBe(1);
    disengagedAttempt(result); // second wrong submit
    expect(captured[1].consecutiveErrors).toBe(2);
  });
});
