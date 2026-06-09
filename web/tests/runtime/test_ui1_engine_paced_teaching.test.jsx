// test_ui1_engine_paced_teaching.test.jsx — UI1.
//
// Proves the headline UI1 behavior: the SCRIPTED teaching stages are now paced
// by the engine DECISION through the shared useLessonScaffold seam, the same way
// the generated practice stage is — not merely advanced on a single correct.
//
// Two proof axes, exercised through the shared hook (so they hold for EVERY room
// that adopts useLessonScaffold, not one room's bespoke glue):
//
//   1. STUMBLE on a teaching stage → RaiseScaffold steps the stage BACK (more
//      support), and the default PresentProblem on a wrong answer HOLDS the stage
//      (no advance) — both preserving the learner's place. This is the gap the
//      spec flags: before UI1 the wrong-answer path computed a Decision but never
//      applied it, so a teaching stumble never morphed the surface.
//   2. STRONG run → FadeScaffold on a teaching stage SKIPS AHEAD to the stage at
//      the faded design level (within the room), not just a single beat.
//
// Plus a real-room smoke (AppR4) proving a wrong teaching answer + a mocked
// RaiseScaffold steps the live stage back without breaking the room.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Engine mocks (storage + measurement + policy), same strategy as the sibling
// runtime tests. We drive nextDecision per-scenario to assert the seam applies
// whatever the engine returns.
// ---------------------------------------------------------------------------

let _log = [];

vi.mock('../../src/engine/index.js', () => ({
  appendEvent: vi.fn((log, event) => { const next = [...log, event]; _log = next; return next; }),
  loadLog: vi.fn(() => []),
  saveLog: vi.fn((log) => { _log = [...log]; }),
  migrateFromKitchenProgress: vi.fn(() => ({})),
  foldLog: vi.fn((log, init, reducer) => log.reduce(reducer, init)),
}));

vi.mock('../../src/engine/measurementReduce.js', () => ({
  measurementReduce: vi.fn(() => ({
    mastery: {
      SIMPLIFY: {
        P_known: 0.55, fluency_stats: { median_latency: null, slope: null, n: 0 },
        max_scaffold_passed: null, transfer_passed: false, hint_dependence: 0, last_retention_probe: null,
      },
    },
  })),
}));

let nextDecisionImpl = () => ({
  kind: 'PresentProblem', node: 'SIMPLIFY', scaffold: 0, surface_form: 'default',
  rationale: 'Continue at this level.',
});
vi.mock('../../src/engine/policy.js', () => ({
  nextDecision: vi.fn((...args) => nextDecisionImpl(...args)),
}));

vi.mock('../../src/voice.js', () => ({
  useVoice: () => ({ soundOn: false, speaking: false, say: vi.fn(), stopVoice: vi.fn(), toggleSound: vi.fn() }),
}));

import { useLessonScaffold } from '../../src/runtime/useLessonScaffold.js';
import { nextDecision } from '../../src/engine/policy.js';

// A small fixed-stage lesson model matching AppR4's SIMPLIFY arc (string keys,
// design levels manipulate=0, bind=1, fade=2, numbers=3, applied=3, words=4).
const STAGES = ['manipulate', 'bind', 'fade', 'numbers', 'applied', 'words'];

function makeScaffold(initialStage = 'fade') {
  return renderHook(() =>
    useLessonScaffold({
      nodeId: 'SIMPLIFY',
      lessonId: 'r4',
      initialStage,
      stagesOrder: STAGES,
      scaffoldKeyFor: (s) => s,
      introFor: () => ({ tone: 'normal', text: '' }),
      resetStage: () => {},
    })
  );
}

beforeEach(() => {
  _log = [];
  vi.clearAllMocks();
  nextDecisionImpl = () => ({
    kind: 'PresentProblem', node: 'SIMPLIFY', scaffold: 0, surface_form: 'default',
    rationale: 'Continue at this level.',
  });
});

describe('UI1 — wrong answer on a TEACHING stage is engine-paced', () => {
  it('RaiseScaffold from the engine on a stumble steps the teaching stage BACK', () => {
    const { result } = makeScaffold('fade'); // design L2
    expect(result.current.stage).toBe('fade');

    nextDecisionImpl = () => ({
      kind: 'RaiseScaffold', preserveWork: true, rationale: 'Two errors — adding support.',
    });

    act(() => {
      result.current.reportAttempt({ correct: false, answerValue: [4, 8], errorSignature: 'scaled_bottom_only', stars: 0 });
    });

    // Stepped back one beat (fade → bind), to MORE support.
    expect(result.current.stage).toBe('bind');
  });

  it('the default PresentProblem on a wrong answer HOLDS the stage (work preserved)', () => {
    const { result } = makeScaffold('fade');
    expect(result.current.stage).toBe('fade');

    // default nextDecisionImpl → PresentProblem
    act(() => {
      result.current.reportAttempt({ correct: false, answerValue: [9, 9], errorSignature: null, stars: 0 });
    });

    // No advance, no retreat — the child stays exactly where they were.
    expect(result.current.stage).toBe('fade');
    // The wrong attempt still reached the engine boundary (decision computed).
    expect(nextDecision).toHaveBeenCalledTimes(1);
  });

  it('adaptiveTeaching:false fully restores the prior behavior (wrong answer ignored by the stage)', () => {
    const { result } = renderHook(() =>
      useLessonScaffold({
        nodeId: 'SIMPLIFY', lessonId: 'r4', initialStage: 'fade',
        stagesOrder: STAGES, scaffoldKeyFor: (s) => s,
        introFor: () => ({ tone: 'normal', text: '' }), resetStage: () => {},
        adaptiveTeaching: false,
      })
    );
    nextDecisionImpl = () => ({ kind: 'RaiseScaffold', preserveWork: true, rationale: 'x' });

    act(() => {
      result.current.reportAttempt({ correct: false, answerValue: [4, 8], errorSignature: null, stars: 0 });
    });

    // Flag off → the wrong-answer decision is NOT applied; stage is unchanged.
    expect(result.current.stage).toBe('fade');
  });
});

describe('UI1 — strong run on a TEACHING stage skips ahead (FadeScaffold)', () => {
  it('FadeScaffold on a teaching stage jumps to the stage at the faded design level', () => {
    const { result } = makeScaffold('bind'); // design L1
    expect(result.current.stage).toBe('bind');

    nextDecisionImpl = () => ({ kind: 'FadeScaffold', rationale: 'Clean streak — reducing support.' });

    // A correct answer that the engine answers with FadeScaffold. award() drives
    // applyEngineDecision(dec, true) on the correct path.
    act(() => {
      result.current.award('Yes!', null, [4, 6], { stars: 3 });
    });

    // bind=L1 → faded target L2 → 'fade'. Skipped ahead past nothing here (fade is
    // the next beat), but the skip-to is computed from the design level, not a raw
    // index — proving the level-driven jump. (For a multi-beat jump see below.)
    expect(result.current.stage).toBe('fade');
  });

  it('FadeScaffold skips MULTIPLE beats when several share a design level below the target', () => {
    // numbers=L3 and applied=L3 share a level; a fade from fade(L2) targets L3 →
    // the first L3 stage 'numbers', skipping nothing extra, but a fade from
    // 'numbers'(L3) targets L4 → 'words', skipping 'applied'(L3) entirely.
    const { result } = makeScaffold('numbers'); // design L3
    expect(result.current.stage).toBe('numbers');

    nextDecisionImpl = () => ({ kind: 'FadeScaffold', rationale: 'Clean streak.' });

    act(() => {
      result.current.award('Yes!', null, [2, 3], { stars: 3 });
    });

    // L3 → L4 → 'words', skipping 'applied' (also L3). A single nextStage() would
    // have landed on 'applied'; the level-driven skip lands on 'words'.
    expect(result.current.stage).toBe('words');
  });
});

// ---------------------------------------------------------------------------
// Real-room smoke: AppR4 wrong teaching answer + RaiseScaffold steps back live.
// ---------------------------------------------------------------------------

vi.mock('../../src/components/Cook.jsx', () => ({ default: () => React.createElement('div', { 'data-testid': 'cook' }) }));
vi.mock('../../src/components/Rosette.jsx', () => ({ default: ({ count }) => React.createElement('div', { 'data-testid': 'rosette', 'data-count': count }) }));
vi.mock('../../src/components/BigFrac.jsx', () => ({ default: ({ num, den, children }) => React.createElement('span', { 'data-testid': 'bigfrac' }, `${num}/${den}`, children) }));
vi.mock('../../src/components/Slate.jsx', () => ({
  default: ({ slots, values, onChange, onSubmit, disabled }) =>
    React.createElement('div', { 'data-testid': 'slate' },
      ...slots.map((slot) =>
        React.createElement('input', {
          key: slot.key, 'data-testid': `slate-${slot.key}`,
          value: values[slot.key] ?? '', disabled,
          onChange: (e) => onChange(slot.key, e.target.value),
          onKeyDown: (e) => e.key === 'Enter' && !disabled && onSubmit && onSubmit(),
        })
      ),
      React.createElement('button', { 'data-testid': 'slate-submit', disabled, onClick: () => !disabled && onSubmit && onSubmit() }, 'Check')
    ),
}));

import AppR4 from '../../src/AppR4.jsx';

describe('UI1 — AppR4 real-room: wrong teaching answer + RaiseScaffold steps the live stage back', () => {
  it('a wrong Numbers answer with engine RaiseScaffold retreats to an earlier teaching stage', async () => {
    render(React.createElement(AppR4, { no: 4, title: 'Test' }));

    // Go to the Numbers teaching stage (index 3).
    const tabs = screen.getAllByRole('tab');
    await act(async () => { fireEvent.click(tabs[3]); });
    const activeBefore = screen.getAllByRole('tab').find((t) => t.getAttribute('aria-selected') === 'true');
    expect(activeBefore.textContent).toMatch(/Numbers/i);

    // The next judged attempt gets a RaiseScaffold from the engine.
    nextDecisionImpl = () => ({ kind: 'RaiseScaffold', preserveWork: true, rationale: 'Two errors — more support.' });

    // Submit a WRONG answer (3/5 is not equal to 8/12).
    await act(async () => {
      fireEvent.change(screen.getByTestId('slate-n'), { target: { value: '3' } });
      fireEvent.change(screen.getByTestId('slate-d'), { target: { value: '5' } });
    });
    await act(async () => { fireEvent.click(screen.getByTestId('slate-submit')); });

    // The stage retreated to a MORE-supported earlier teaching stage (Fade),
    // rather than sitting inert on Numbers — the engine now paces the stumble.
    const activeAfter = screen.getAllByRole('tab').find((t) => t.getAttribute('aria-selected') === 'true');
    expect(activeAfter.textContent).toMatch(/Fade/i);
  });
});
