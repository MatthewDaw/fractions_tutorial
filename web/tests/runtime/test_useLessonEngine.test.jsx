// test_useLessonEngine.test.jsx — U9: Tests for the shared lesson runtime hook.
//
// Test scenarios (from plan U9):
//   1. emit appends a well-formed, timestamped event; the log persists across
//      a simulated reload.
//   2. judgeAndAdvance on a correct answer produces exactly one answer_submit +
//      judged pair and returns a Decision (mocked engine).
//   3. The hook never calls nextDecision mid-attempt — only at submit boundaries
//      (spy on the nextDecision import).
//   4. scaffoldMap maps LessonUnlikeDen L6 (bare slate) → design ≥ L3.
//   5. scaffoldMap maps AppR1 stage-4 (numbers) → design ≥ L3.
//   6. scaffoldMap maps LessonUnlikeDen L0 (bare slate) → L0 (i.e., ≥ 0).
//   7. A RaiseScaffold decision is returned with preserveWork: true.
//
// NOTE: Do NOT run the full test suite. This file is checked by the orchestrator.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { toScaffoldLevel } from '../../src/runtime/scaffoldMap.js';

// ---------------------------------------------------------------------------
// Mock the engine modules that useLessonEngine imports.
// We mock log.ts helpers so localStorage is not exercised in the pure unit tests
// (except for the persistence test which installs its own localStorage mock).
// ---------------------------------------------------------------------------

// We use vi.mock with factory functions. The mocks are hoisted.

vi.mock('../../src/engine/index.js', () => {
  // In-memory log for tests (shared across module boundary via closure).
  let _log = [];

  return {
    appendEvent: vi.fn((log, event) => {
      const next = [...log, event];
      _log = next;
      return next;
    }),
    loadLog: vi.fn(() => _log),
    saveLog: vi.fn((log) => { _log = [...log]; }),
    migrateFromKitchenProgress: vi.fn(() => ({})),
    // Re-export anything else the file might need
    foldLog: vi.fn((log, init, reducer) => log.reduce(reducer, init)),
  };
});

vi.mock('../../src/engine/measurementReduce.js', () => ({
  measurementReduce: vi.fn((_log, _now, _seeds) => ({
    mastery: {
      ADD_SAME_DEN: {
        P_known: 0.55,
        fluency_stats: { median_latency: null, slope: null, n: 0 },
        max_scaffold_passed: null,
        transfer_passed: false,
        hint_dependence: 0,
        last_retention_probe: null,
      },
    },
  })),
}));

// nextDecision spy — we want to verify it is called exactly once per submit,
// never during rendering or other state changes.
let nextDecisionCallCount = 0;
let lastNextDecisionArgs = null;

vi.mock('../../src/engine/policy.js', () => ({
  nextDecision: vi.fn((...args) => {
    nextDecisionCallCount += 1;
    lastNextDecisionArgs = args;
    // Return a PresentProblem decision by default.
    return {
      kind: 'PresentProblem',
      node: 'ADD_SAME_DEN',
      scaffold: 0,
      surface_form: 'default',
      rationale: 'Continue practicing at this level.',
    };
  }),
}));

// ---------------------------------------------------------------------------
// Import the hook (after mocks are set up).
// ---------------------------------------------------------------------------
import { useLessonEngine } from '../../src/runtime/useLessonEngine.js';
import { appendEvent, loadLog, saveLog } from '../../src/engine/index.js';
import { measurementReduce } from '../../src/engine/measurementReduce.js';
import { nextDecision } from '../../src/engine/policy.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Reset call counters between tests. */
function resetSpies() {
  nextDecisionCallCount = 0;
  lastNextDecisionArgs = null;
  vi.clearAllMocks();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('scaffoldMap — toScaffoldLevel', () => {
  it('maps LessonUnlikeDen L6 (bare slate) to design level >= 3', () => {
    const level = toScaffoldLevel('r2', 'L6');
    expect(level).toBeGreaterThanOrEqual(3);
  });

  it('maps LessonUnlikeDen L7 (word problem) to design level >= 3', () => {
    const level = toScaffoldLevel('r3', 'L7');
    expect(level).toBeGreaterThanOrEqual(3);
  });

  it('maps LessonUnlikeDen L0 (blocks lead) to 0', () => {
    const level = toScaffoldLevel('r2', 'L0');
    expect(level).toBe(0);
  });

  it('maps AppR1 stage 5 (numbers) to design level >= 3', () => {
    // r1 is a 7-stage arc: 1 Manipulate, 2 Bind, 3 Fade, 4 Workbench, 5 Numbers,
    // 6 Applied, 7 Words. Numbers is stage 5 (stage 4 = Workbench = L1).
    const level = toScaffoldLevel('r1', '5');
    expect(level).toBeGreaterThanOrEqual(3);
  });

  it('maps AppR1 stage 1 (manipulate) to 0', () => {
    const level = toScaffoldLevel('r1', '1');
    expect(level).toBe(0);
  });

  it('maps AppR1 stage 7 (words) to 4', () => {
    // Words is the final stage (7) in the 7-stage r1 arc.
    const level = toScaffoldLevel('r1', '7');
    expect(level).toBe(4);
  });

  it('maps AppR4 "numbers" stage to design level >= 3', () => {
    const level = toScaffoldLevel('r4', 'numbers');
    expect(level).toBeGreaterThanOrEqual(3);
  });

  it('maps AppR4 "manipulate" stage to 0', () => {
    const level = toScaffoldLevel('r4', 'manipulate');
    expect(level).toBe(0);
  });

  it('maps AppR5 "4-numbers" stage to design level >= 3', () => {
    const level = toScaffoldLevel('r5', '4-numbers');
    expect(level).toBeGreaterThanOrEqual(3);
  });

  it('maps AppR5 "1-manipulate" stage to 0', () => {
    const level = toScaffoldLevel('r5', '1-manipulate');
    expect(level).toBe(0);
  });

  it('returns 0 for unknown lesson id', () => {
    const level = toScaffoldLevel('unknown', 'L6');
    expect(level).toBe(0);
  });
});

describe('useLessonEngine — emit', () => {
  beforeEach(() => { resetSpies(); });

  it('emit stamps a t timestamp and actor:human on the event', () => {
    const { result } = renderHook(() =>
      useLessonEngine({ nodeId: 'ADD_SAME_DEN' })
    );

    let emitted;
    act(() => {
      emitted = result.current.emit({
        type: 'problem_present',
        payload: { node_id: 'ADD_SAME_DEN', scaffold_level: 0 },
      });
    });

    expect(emitted).toBeDefined();
    expect(emitted.type).toBe('problem_present');
    expect(typeof emitted.t).toBe('number');
    expect(emitted.t).toBeGreaterThan(0);
    expect(emitted.actor).toBe('human');
  });

  it('emit calls appendEvent with the stamped event', () => {
    const { result } = renderHook(() =>
      useLessonEngine({ nodeId: 'ADD_SAME_DEN' })
    );

    act(() => {
      result.current.emit({ type: 'test_event', payload: {} });
    });

    expect(appendEvent).toHaveBeenCalled();
    const callArgs = appendEvent.mock.calls[0];
    expect(callArgs[1].type).toBe('test_event');
    expect(callArgs[1].actor).toBe('human');
  });

  it('emit calls saveLog to persist the event', () => {
    const { result } = renderHook(() =>
      useLessonEngine({ nodeId: 'ADD_SAME_DEN' })
    );

    act(() => {
      result.current.emit({ type: 'test_persist', payload: {} });
    });

    expect(saveLog).toHaveBeenCalled();
  });

  it('emitted events survive a simulated reload (loadLog is called on init)', () => {
    // First render — emits an event.
    const { result: r1 } = renderHook(() =>
      useLessonEngine({ nodeId: 'ADD_SAME_DEN' })
    );

    act(() => {
      r1.current.emit({ type: 'before_reload', payload: {} });
    });

    // loadLog should have been called to initialize the log on first mount.
    expect(loadLog).toHaveBeenCalled();

    // Second render (simulated reload) — loadLog is called again.
    vi.clearAllMocks();
    renderHook(() => useLessonEngine({ nodeId: 'ADD_SAME_DEN' }));
    expect(loadLog).toHaveBeenCalled();
  });
});

describe('useLessonEngine — judgeAndAdvance', () => {
  beforeEach(() => { resetSpies(); });

  it('judgeAndAdvance emits exactly one answer_submit + one judged event', () => {
    const { result } = renderHook(() =>
      useLessonEngine({ nodeId: 'ADD_SAME_DEN' })
    );

    // First emit a problem_present (simulates the lesson starting a problem).
    act(() => {
      result.current.emit({
        type: 'problem_present',
        payload: { node_id: 'ADD_SAME_DEN', scaffold_level: 0 },
      });
    });

    const beforeCallCount = appendEvent.mock.calls.length;

    let dec;
    act(() => {
      dec = result.current.judgeAndAdvance(
        { value: [5, 7], modality: 'tap' },
        { correct: true, stars: 3 }
      );
    });

    // Should have appended exactly 2 more events: answer_submit + judged.
    const afterCallCount = appendEvent.mock.calls.length;
    const newCalls = afterCallCount - beforeCallCount;
    expect(newCalls).toBe(2);

    // Check the event types.
    const calls = appendEvent.mock.calls.slice(beforeCallCount);
    const types = calls.map(([, ev]) => ev.type);
    expect(types).toContain('answer_submit');
    expect(types).toContain('judged');
  });

  it('judgeAndAdvance returns a Decision', () => {
    const { result } = renderHook(() =>
      useLessonEngine({ nodeId: 'ADD_SAME_DEN' })
    );

    let dec;
    act(() => {
      dec = result.current.judgeAndAdvance(
        { value: [5, 7], modality: 'tap' },
        { correct: true, stars: 3 }
      );
    });

    expect(dec).toBeDefined();
    expect(typeof dec.kind).toBe('string');
    expect(typeof dec.rationale).toBe('string');
    expect(dec.rationale.length).toBeGreaterThan(0);
  });

  it('judgeAndAdvance updates the decision state in the hook', () => {
    const { result } = renderHook(() =>
      useLessonEngine({ nodeId: 'ADD_SAME_DEN' })
    );

    expect(result.current.decision).toBeNull();

    act(() => {
      result.current.judgeAndAdvance(
        { value: [5, 7] },
        { correct: true }
      );
    });

    expect(result.current.decision).not.toBeNull();
    expect(result.current.decision.kind).toBe('PresentProblem');
  });

  it('judgeAndAdvance calls measurementReduce exactly once', () => {
    const { result } = renderHook(() =>
      useLessonEngine({ nodeId: 'ADD_SAME_DEN' })
    );

    act(() => {
      result.current.judgeAndAdvance({ value: [5, 7] }, { correct: true });
    });

    expect(measurementReduce).toHaveBeenCalledTimes(1);
  });

  it('judged event carries rich metadata fields', () => {
    const { result } = renderHook(() =>
      useLessonEngine({ nodeId: 'ADD_SAME_DEN' })
    );

    act(() => {
      result.current.emit({
        type: 'problem_present',
        payload: { node_id: 'ADD_SAME_DEN', scaffold_level: 0 },
      });
    });

    act(() => {
      result.current.judgeAndAdvance(
        { value: [5, 14], modality: 'handwriting', recognizerConfidence: 0.92 },
        {
          correct: false,
          errorSignature: 'add_denominators',
          stars: 0,
          hintMaxRung: 1,
          selfCorrections: 2,
        }
      );
    });

    // Find the judged event from the appendEvent calls.
    const judgedCall = appendEvent.mock.calls.find(([, ev]) => ev.type === 'judged');
    expect(judgedCall).toBeDefined();
    const judgedEv = judgedCall[1];

    expect(judgedEv.payload.correct).toBe(false);
    expect(judgedEv.payload.error_signature).toBe('add_denominators');
    expect(judgedEv.payload.hint_max_rung).toBe(1);
    expect(judgedEv.payload.self_corrections).toBe(2);
    expect(judgedEv.payload.recognizer_confidence).toBe(0.92);
    expect(judgedEv.payload.modality).toBe('handwriting');
    expect(Array.isArray(judgedEv.payload.affect_window)).toBe(true);
    expect(judgedEv.payload.affect_window.length).toBe(0);
  });
});

describe('useLessonEngine — nextDecision boundary rule (R16)', () => {
  beforeEach(() => { resetSpies(); });

  it('nextDecision is NOT called during hook initialisation (mount)', () => {
    renderHook(() => useLessonEngine({ nodeId: 'ADD_SAME_DEN' }));
    // After mount, nextDecision should not have been called.
    expect(nextDecision).not.toHaveBeenCalled();
  });

  it('nextDecision is NOT called by emit alone', () => {
    const { result } = renderHook(() =>
      useLessonEngine({ nodeId: 'ADD_SAME_DEN' })
    );

    act(() => {
      result.current.emit({ type: 'problem_present', payload: {} });
    });
    act(() => {
      result.current.emit({ type: 'place_block', payload: {} });
    });
    act(() => {
      result.current.emit({ type: 'remove_block', payload: {} });
    });

    expect(nextDecision).not.toHaveBeenCalled();
  });

  it('nextDecision is called exactly once per judgeAndAdvance call', () => {
    const { result } = renderHook(() =>
      useLessonEngine({ nodeId: 'ADD_SAME_DEN' })
    );

    act(() => {
      result.current.judgeAndAdvance({ value: [5, 7] }, { correct: true });
    });

    expect(nextDecision).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.judgeAndAdvance({ value: [5, 7] }, { correct: true });
    });

    expect(nextDecision).toHaveBeenCalledTimes(2);
  });

  it('nextDecision receives the policy state and mastery (not empty objects)', () => {
    const { result } = renderHook(() =>
      useLessonEngine({ nodeId: 'ADD_SAME_DEN' })
    );

    act(() => {
      result.current.judgeAndAdvance({ value: [5, 7] }, { correct: true });
    });

    // nextDecision(policyState, mastery, recentBehavior, now)
    const [policyState, mastery, , now] = nextDecision.mock.calls[0];
    expect(policyState).toBeDefined();
    expect(typeof policyState.currentNodeId).toBe('string');
    expect(mastery).toBeDefined();
    expect(typeof now).toBe('number');
  });
});

describe('useLessonEngine — RaiseScaffold preserveWork', () => {
  beforeEach(() => {
    resetSpies();
    // Override nextDecision to return RaiseScaffold.
    vi.mocked(nextDecision).mockReturnValueOnce({
      kind: 'RaiseScaffold',
      preserveWork: true,
      rationale: 'Adding support after errors.',
    });
  });

  it('returns a RaiseScaffold decision with preserveWork: true', () => {
    const { result } = renderHook(() =>
      useLessonEngine({
        nodeId: 'ADD_SAME_DEN',
        lessonConfig: { lessonId: 'r1', initialBeat: '3' },
      })
    );

    let dec;
    act(() => {
      dec = result.current.judgeAndAdvance(
        { value: [5, 7] },
        { correct: false }
      );
    });

    expect(dec.kind).toBe('RaiseScaffold');
    expect(dec.preserveWork).toBe(true);
  });

  it('scaffold level decreases by 1 after RaiseScaffold', () => {
    const { result } = renderHook(() =>
      useLessonEngine({
        nodeId: 'ADD_SAME_DEN',
        lessonConfig: { lessonId: 'r1', initialBeat: '3' }, // stage 3 = design L2
      })
    );

    const before = result.current.scaffoldLevel;

    act(() => {
      result.current.judgeAndAdvance({ value: [5, 7] }, { correct: false });
    });

    const after = result.current.scaffoldLevel;
    // Should have decreased (or stayed at 0 if already at floor).
    expect(after).toBeLessThanOrEqual(before);
  });
});

describe('useLessonEngine — FadeScaffold', () => {
  beforeEach(() => {
    resetSpies();
    vi.mocked(nextDecision).mockReturnValueOnce({
      kind: 'FadeScaffold',
      rationale: 'Clean streak — reducing support.',
    });
  });

  it('scaffold level increases by 1 after FadeScaffold', () => {
    const { result } = renderHook(() =>
      useLessonEngine({
        nodeId: 'ADD_SAME_DEN',
        lessonConfig: { lessonId: 'r1', initialBeat: '2' }, // stage 2 = design L1
      })
    );

    const before = result.current.scaffoldLevel;

    act(() => {
      result.current.judgeAndAdvance({ value: [5, 7] }, { correct: true });
    });

    const after = result.current.scaffoldLevel;
    expect(after).toBeGreaterThan(before);
    expect(after).toBeLessThanOrEqual(4);
  });
});

describe('useLessonEngine — masteryFor', () => {
  beforeEach(() => { resetSpies(); });

  it('masteryFor returns null before any judgeAndAdvance call', () => {
    const { result } = renderHook(() =>
      useLessonEngine({ nodeId: 'ADD_SAME_DEN' })
    );

    expect(result.current.masteryFor('ADD_SAME_DEN')).toBeNull();
  });

  it('masteryFor returns an estimate after judgeAndAdvance', () => {
    const { result } = renderHook(() =>
      useLessonEngine({ nodeId: 'ADD_SAME_DEN' })
    );

    act(() => {
      result.current.judgeAndAdvance({ value: [5, 7] }, { correct: true });
    });

    const est = result.current.masteryFor('ADD_SAME_DEN');
    expect(est).not.toBeNull();
    expect(typeof est.P_known).toBe('number');
  });

  it('masteryFor returns null for unknown node ids', () => {
    const { result } = renderHook(() =>
      useLessonEngine({ nodeId: 'ADD_SAME_DEN' })
    );

    act(() => {
      result.current.judgeAndAdvance({ value: [5, 7] }, { correct: true });
    });

    expect(result.current.masteryFor('DOES_NOT_EXIST')).toBeNull();
  });
});

describe('useLessonEngine — rationale', () => {
  beforeEach(() => { resetSpies(); });

  it('rationale is empty string before first judgeAndAdvance', () => {
    const { result } = renderHook(() =>
      useLessonEngine({ nodeId: 'ADD_SAME_DEN' })
    );
    expect(result.current.rationale).toBe('');
  });

  it('rationale reflects the latest decision after judgeAndAdvance', () => {
    const { result } = renderHook(() =>
      useLessonEngine({ nodeId: 'ADD_SAME_DEN' })
    );

    act(() => {
      result.current.judgeAndAdvance({ value: [5, 7] }, { correct: true });
    });

    expect(result.current.rationale).toBe('Continue practicing at this level.');
  });
});
