// test_live_tier2_nudge_t29.test.jsx — T29: wire the LIVE Tier-2 nudge.
//
// FINDING (T26 report + limitations-memo): T26 wired the Tier-2 in-the-moment
// nudge (idle / oscillation / too-fast-correct) on the HARNESS sessionRunner path
// and proved it fires there. But on the LIVE path, useLessonEngine.judgeAndAdvance
// builds recentBehavior.observations from `recentObsRef.current.slice(-10)`, and
// `recentObsRef` was initialized to [] and NEVER APPENDED — so a real child's
// recentBehavior was ALWAYS EMPTY and the policy's Tier-2 window read nothing. The
// nudge therefore never surfaced in the browser.
//
// FIX (reversible, PARAMS.tier2NudgeLive, default-off): at the submit boundary the
// hook now populates recentObsRef from the SAME segment()-derived Observations the
// engine already computes from this log (mirroring sessionRunner's
// `segment(log).slice(-10)` — no duplicated detectors, no invented signal), and
// surfaces the resulting Tier-2 nudge via engineStore.publishNudge.
//
// These tests prove (live path, real observe/segment layer):
//   1. flag OFF: recentBehavior.observations stays EMPTY (byte-identical) + no nudge.
//   2. flag ON:  recentObsRef IS populated → the policy receives a non-empty
//      recentBehavior.observations buffer (the dead input edge is wired).
//   3. flag ON + too-fast-correct window: a TRANSFER_PROBE_QUEUED nudge is published
//      (the nudge path is REACHABLE on the live path).
//   4. flag ON + idle window: a HINT_OFFER nudge is published.
//   5. flag ON + oscillation window: a TAKE_YOUR_TIME nudge is published.
//   6. escalation UNCHANGED: disengagedCount / consecutiveErrors are untouched by the
//      wiring, and nextDecision is still called EXACTLY ONCE per submit boundary.
//
// The engine policy/measure/log modules are mocked (the .jsx runtime tests cannot
// resolve the .ts seam reliably); the observe layer and segment() are the REAL
// modules — the buffer's observations must come from the genuine observation floor.
// We assert on the live recentBehavior object the hook hands to nextDecision and on
// the publishNudge calls the hook makes.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---- Engine mocks (same shape as test_disengaged_writer_u9.test.jsx) ---------
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

// nextDecision spy: capture the recentBehavior arg + policy-state counters at each
// call, plus a running call count (boundary-once rule).
const captured = [];
vi.mock('../../src/engine/policy.js', () => ({
  nextDecision: vi.fn((policyState, _mastery, recentBehavior) => {
    captured.push({
      // Snapshot the observations the policy ACTUALLY received (the ref mutates).
      observations: recentBehavior.observations.map((o) => ({
        correct: o.correct,
        latency: o.latency,
        self_corrections: o.self_corrections,
        too_fast_correct: o.too_fast_correct,
      })),
      isDisengaged: recentBehavior.isDisengaged,
      disengagedCount: policyState.disengagedCount,
      disengagedScaffoldCount: policyState.disengagedScaffoldCount,
      consecutiveErrors: policyState.consecutiveErrors,
    });
    return { kind: 'PresentProblem', node: 'ADD_SAME_DEN', scaffold: 0, surface_form: 'default', rationale: 'continue' };
  }),
}));

// Spy publishNudge so we can assert the live nudge surfaces on the advisory channel.
const nudges = [];
vi.mock('../../src/runtime/engineStore.js', async (importActual) => {
  const actual = await importActual();
  return {
    ...actual,
    publishNudge: vi.fn((nudge) => { nudges.push(nudge); }),
  };
});

import { useLessonEngine } from '../../src/runtime/useLessonEngine.js';
import { nextDecision } from '../../src/engine/policy.js';
import { PARAMS } from '../../src/engine/params.js';

// ---------------------------------------------------------------------------
// Attempt drivers — each controls latency via fake system time so segment()
// derives the precise window (too-fast / idle) we want to exercise.
// ---------------------------------------------------------------------------

/** Present a problem, advance the clock by `latencyMs`, then submit. */
function attempt(result, { latencyMs, correct, selfCorrections = 0, value = [1, 2] }) {
  act(() => {
    result.current.emit({ type: 'problem_present', payload: { node_id: 'ADD_SAME_DEN', scaffold_level: 2 } });
  });
  for (let k = 0; k < selfCorrections; k++) {
    act(() => { result.current.emit({ type: 'piece_place', payload: { node_id: 'ADD_SAME_DEN' } }); });
    act(() => { result.current.emit({ type: 'piece_remove', payload: { node_id: 'ADD_SAME_DEN' } }); });
  }
  act(() => { vi.advanceTimersByTime(latencyMs); });
  act(() => {
    result.current.judgeAndAdvance({ value }, { correct, selfCorrections });
  });
}

describe('T29 live Tier-2 nudge — recentObsRef wired at the live boundary', () => {
  beforeEach(() => {
    captured.length = 0;
    nudges.length = 0;
    vi.mocked(nextDecision).mockClear();
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
  });
  afterEach(() => {
    vi.useRealTimers();
    PARAMS.tier2NudgeLive = false; // never leak the flag across tests.
  });

  it('flag OFF (default): recentBehavior.observations stays EMPTY and NO nudge is published', () => {
    PARAMS.tier2NudgeLive = false;
    const { result } = renderHook(() => useLessonEngine({ nodeId: 'ADD_SAME_DEN' }));
    // A too-fast correct (latency 50ms < latencyFloorMs 1200) — would be an eligible
    // window if the channel were alive.
    attempt(result, { latencyMs: 50, correct: true });
    // The policy received the OLD empty channel (recentObsRef never appended).
    expect(captured[captured.length - 1].observations).toEqual([]);
    // No nudge surfaced (byte-identical to pre-T29 behavior).
    expect(nudges.length).toBe(0);
  });

  it('flag ON: recentObsRef IS populated — the policy receives a non-empty recentBehavior buffer', () => {
    PARAMS.tier2NudgeLive = true;
    const { result } = renderHook(() => useLessonEngine({ nodeId: 'ADD_SAME_DEN' }));
    attempt(result, { latencyMs: 3000, correct: true });
    const last = captured[captured.length - 1];
    // The dead input edge is now wired: the policy sees a REAL segment()-derived
    // observation for this attempt (was always [] before T29).
    expect(last.observations.length).toBeGreaterThan(0);
    expect(last.observations[last.observations.length - 1].correct).toBe(true);
  });

  it('flag ON + too-fast-correct window: a TRANSFER_PROBE_QUEUED nudge is published (path reachable)', () => {
    PARAMS.tier2NudgeLive = true;
    const { result } = renderHook(() => useLessonEngine({ nodeId: 'ADD_SAME_DEN' }));
    // latency 50ms < PARAMS.latencyFloorMs (1200) + correct → too_fast_correct.
    attempt(result, { latencyMs: 50, correct: true });
    const last = captured[captured.length - 1].observations.slice(-1)[0];
    expect(last.too_fast_correct).toBe(true);
    expect(nudges.map((n) => n.type)).toContain('TRANSFER_PROBE_QUEUED');
  });

  it('flag ON + idle window (latency ≥ 8s): a HINT_OFFER nudge is published', () => {
    PARAMS.tier2NudgeLive = true;
    const { result } = renderHook(() => useLessonEngine({ nodeId: 'ADD_SAME_DEN' }));
    // latency 9000ms ≥ PAUSE_THRESHOLD_MS (8000) → long-pause HINT_OFFER.
    attempt(result, { latencyMs: 9000, correct: false, value: null });
    const last = captured[captured.length - 1].observations.slice(-1)[0];
    expect(last.latency).toBeGreaterThanOrEqual(8000);
    expect(nudges.map((n) => n.type)).toContain('HINT_OFFER');
  });

  it('flag ON + oscillation window (≥3 self-corrections): a TAKE_YOUR_TIME nudge is published', () => {
    PARAMS.tier2NudgeLive = true;
    const { result } = renderHook(() => useLessonEngine({ nodeId: 'ADD_SAME_DEN' }));
    // 4 place/remove reversals + an in-band latency (not idle, not too-fast) so the
    // oscillation branch wins. selfCorrections passed in meta so the judged payload
    // carries it for segment().
    attempt(result, { latencyMs: 3000, correct: false, selfCorrections: 4, value: [9, 9] });
    const last = captured[captured.length - 1].observations.slice(-1)[0];
    expect(last.self_corrections).toBeGreaterThanOrEqual(3);
    expect(nudges.map((n) => n.type)).toContain('TAKE_YOUR_TIME');
  });

  it('escalation UNCHANGED: disengagedCount stays 0 and consecutiveErrors is untouched by the wiring', () => {
    PARAMS.tier2NudgeLive = true;
    const { result } = renderHook(() => useLessonEngine({ nodeId: 'ADD_SAME_DEN' }));
    attempt(result, { latencyMs: 3000, correct: false, value: [9, 9] }); // one wrong submit
    attempt(result, { latencyMs: 3000, correct: false, value: [9, 9] }); // second wrong submit
    // The escalation counter is NEVER fed by the recentObsRef wiring.
    for (const snap of captured) expect(snap.disengagedCount).toBe(0);
    // consecutiveErrors still increments exactly once per wrong submit (unchanged).
    expect(captured[0].consecutiveErrors).toBe(1);
    expect(captured[1].consecutiveErrors).toBe(2);
  });

  it('nextDecision is still called EXACTLY ONCE per submit boundary', () => {
    PARAMS.tier2NudgeLive = true;
    const { result } = renderHook(() => useLessonEngine({ nodeId: 'ADD_SAME_DEN' }));
    attempt(result, { latencyMs: 3000, correct: true });
    expect(nextDecision).toHaveBeenCalledTimes(1);
    attempt(result, { latencyMs: 3000, correct: true });
    expect(nextDecision).toHaveBeenCalledTimes(2);
  });
});
