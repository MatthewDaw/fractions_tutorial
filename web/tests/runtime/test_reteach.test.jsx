// test_reteach.test.jsx — U5 (plan 002): targeted reteach on a diagnosed
// misconception, surfaced via GenPracticeBoard's data-driven copy table.
//
// Plan U5 test scenarios:
//   - A wrong attempt with `add_denominators` shows the matching reteach beat,
//     not the generic warn.
//   - A careless slip (`other`/`null`) shows the generic re-ask (no over-trigger).
//   - A signature with no authored reteach falls back to the generic path
//     (no crash / no blank surface).
//   - Reteach shows ONCE per problem; a 2nd same-signature error falls back to
//     the generic re-ask.
//   - Interaction states: "Got it" tap-to-skip dismisses the beat; the beat
//     auto-advances (auto-dismisses) after the clip — neither hard-gates the child.
//
// This is the presentation/runtime seam: GenPracticeBoard owns the reteach copy
// table + control flow and reuses the engine ErrorSignature the grader emits (U4).
// We feed a real GeneratedProblem and a lightweight fake `scaffold` (the shared
// controller's surface) so the grading is real and the engine is not re-graded.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';

// Minimal Slate stand-in: one input per slot + a Check button that submits.
// (The real Slate needs canvas/pointer wiring jsdom can't drive; the reteach
// logic under test is independent of the input widget.)
vi.mock('../../src/components/Slate.jsx', () => ({
  default: ({ slots = [], values = {}, onChange, onSubmit, disabled }) =>
    React.createElement(
      'div',
      { 'data-testid': 'slate' },
      ...slots.map((slot) =>
        React.createElement('input', {
          key: slot.key,
          'data-testid': `slate-${slot.key}`,
          value: values[slot.key] ?? '',
          disabled,
          onChange: (e) => onChange(slot.key, e.target.value),
        })
      ),
      React.createElement(
        'button',
        { 'data-testid': 'slate-submit', disabled, onClick: () => !disabled && onSubmit && onSubmit() },
        'Check'
      )
    ),
}));

import GenPracticeBoard from '../../src/components/GenPracticeBoard.jsx';
import { generateFor } from '../../src/generators/index.js';

// ---------------------------------------------------------------------------
// A fake `scaffold` matching the controller surface GenPracticeBoard consumes.
// It uses real React state so setStatus/award flow through render like the live
// hook, and records reportAttempt calls so we can assert the engine still hears
// the wrong attempt (the credit→prereq path is untouched).
// ---------------------------------------------------------------------------
function FakeBoard({ prob, reteachAutoAdvanceMs }) {
  const [solved, setSolved] = React.useState(false);
  const [badInput, setBadInput] = React.useState(false);
  const [status, setStatus] = React.useState({ tone: 'normal', text: '' });

  // STABLE across re-renders (setStatus re-renders FakeBoard) so the spy the test
  // reads off window is the same instance the board actually calls.
  const reportAttemptRef = React.useRef(null);
  if (!reportAttemptRef.current) reportAttemptRef.current = vi.fn();
  window.__reteachSpies = window.__reteachSpies || {};
  window.__reteachSpies.reportAttempt = reportAttemptRef.current;

  const scaffold = {
    prob,
    solved,
    badInput,
    status,
    setStatus,
    award: () => setSolved(true),
    reportAttempt: reportAttemptRef.current,
    flashBad: () => {
      setBadInput(true);
      setTimeout(() => setBadInput(false), 0);
    },
  };

  return React.createElement(GenPracticeBoard, {
    skill: prob.skill,
    scaffold,
    reteachAutoAdvanceMs,
  });
}

// A like-denominator add problem: answering (na+nb)/(da+db) = add_denominators.
function addSameDenProb() {
  return generateFor('ADD_SAME_DEN', { level: 2, index: 0 });
}

/** Type a fraction answer into the mocked Slate and submit. */
async function submitFraction(n, d) {
  const nInput = screen.getByTestId('slate-n');
  const dInput = screen.getByTestId('slate-d');
  await act(async () => {
    fireEvent.change(nInput, { target: { value: String(n) } });
    fireEvent.change(dInput, { target: { value: String(d) } });
  });
  const btn = screen.getByTestId('slate-submit');
  await act(async () => { fireEvent.click(btn); });
}

beforeEach(() => {
  window.__reteachSpies = {};
});
afterEach(() => {
  vi.useRealTimers();
});

describe('U5 reteach — add_denominators shows the matching beat', () => {
  it('a wrong add_denominators attempt surfaces the signature-specific reteach beat', async () => {
    const prob = addSameDenProb(); // 2/8 + 5/8, correct 7/8
    render(React.createElement(FakeBoard, { prob }));

    // "Added the bottoms too": (2+5)/(8+8) = 7/16 → add_denominators.
    await submitFraction(7, 16);

    // The matching reteach card is present, with the authored copy.
    const beat = document.querySelector('.gen-practice__reteach');
    expect(beat).toBeTruthy();
    expect(beat.textContent).toMatch(/Keep the bottom the same/i);
    // The warn ribbon shows the signature-specific line (NOT the generic re-ask).
    expect(document.body.textContent).toMatch(/keep the bottom the same/i);
    expect(document.body.textContent).not.toMatch(/take another look and try again/i);
  });

  it('the reteach beat carries data-vox so tap-to-read replays the baked clip', async () => {
    const prob = addSameDenProb();
    render(React.createElement(FakeBoard, { prob }));
    await submitFraction(7, 16);

    const beat = document.querySelector('.gen-practice__reteach');
    expect(beat).toBeTruthy();
    expect(beat.getAttribute('data-vox')).toBeTruthy();
    expect(beat.getAttribute('data-vox')).toMatch(/Keep the bottom the same/i);
  });

  it('the wrong attempt still reaches the engine with the error signature (credit path intact)', async () => {
    const prob = addSameDenProb();
    render(React.createElement(FakeBoard, { prob }));
    await submitFraction(7, 16);

    const reportAttempt = window.__reteachSpies.reportAttempt;
    expect(reportAttempt).toHaveBeenCalled();
    const callArg = reportAttempt.mock.calls[0][0];
    expect(callArg.correct).toBe(false);
    expect(callArg.errorSignature).toBe('add_denominators');
  });
});

describe('U5 reteach — generic path for unclassified / undiagnosed errors', () => {
  it('a careless slip (other) shows the generic re-ask, not a reteach beat', async () => {
    const prob = addSameDenProb(); // correct 7/8
    render(React.createElement(FakeBoard, { prob }));

    // A random wrong value that is NOT the add-bottoms pattern → grades to `other`.
    await submitFraction(3, 8);

    expect(document.querySelector('.gen-practice__reteach')).toBeNull();
    expect(document.body.textContent).toMatch(/take another look and try again/i);
  });

  it('an unauthored-but-real signature falls back to the generic path (no crash, no blank surface)', async () => {
    // Build a real problem and an authored-table miss: a SIMPLIFY-shaped grade
    // emits `not_simplified` which IS authored, so instead simulate an unauthored
    // real signature by stubbing the copy lookup absence: use a mult skill error
    // that classifies but to a signature we deliberately remove from the table?
    // Simpler + honest: drive `other`-adjacent path via a value that classifies to
    // a non-authored signature is not reachable from the table (every union member
    // IS authored), so we assert the FALLBACK CONTRACT directly: a signature with
    // no table entry yields the generic re-ask and does not throw.
    //
    // We exercise it by monkeypatching: render with a problem and submit a wrong
    // answer whose signature has no entry. The mult `skip_count_drift` IS authored?
    // No — only the five add/fraction-ish entries are in RETEACH. A mult miss
    // (e.g. add_factors) is therefore UNAUTHORED and exercises the fallback.
    const prob = generateFor('MULT_FACTS', { level: 2, index: 0 });
    // a×b → a+b is the add_factors slip (unauthored in the RETEACH table).
    const [a, b] = (() => {
      const o = prob.operands;
      if ('a' in o && 'b' in o) return [o.a, o.b];
      if ('groups' in o && 'size' in o) return [o.groups, o.size];
      if ('rows' in o && 'cols' in o) return [o.rows, o.cols];
      return [0, 0];
    })();
    render(React.createElement(FakeBoard, { prob }));

    const vInput = screen.getByTestId('slate-v');
    await act(async () => { fireEvent.change(vInput, { target: { value: String(a + b) } }); });
    const btn = screen.getByTestId('slate-submit');
    // Must not throw, and must show the generic re-ask with no reteach card.
    await act(async () => { fireEvent.click(btn); });

    expect(document.querySelector('.gen-practice__reteach')).toBeNull();
    expect(document.body.textContent).toMatch(/take another look and try again/i);
  });
});

describe('U5 reteach — once per problem; 2nd same error falls back to generic', () => {
  it('a second same-signature error on the same problem falls back to the generic re-ask', async () => {
    const prob = addSameDenProb();
    render(React.createElement(FakeBoard, { prob }));

    // 1st add_denominators error → reteach beat.
    await submitFraction(7, 16);
    expect(document.querySelector('.gen-practice__reteach')).toBeTruthy();

    // 2nd add_denominators error on the SAME problem → generic re-ask, no beat.
    await submitFraction(7, 16);
    expect(document.querySelector('.gen-practice__reteach')).toBeNull();
    expect(document.body.textContent).toMatch(/take another look and try again/i);
  });
});

describe('U5 reteach — interaction states (no hard gate)', () => {
  it('"Got it" tap-to-skip dismisses the beat immediately', async () => {
    const prob = addSameDenProb();
    render(React.createElement(FakeBoard, { prob }));
    await submitFraction(7, 16);

    expect(document.querySelector('.gen-practice__reteach')).toBeTruthy();
    const skip = document.querySelector('.gen-practice__reteach-skip');
    expect(skip).toBeTruthy();
    expect(skip.textContent).toMatch(/got it/i);

    await act(async () => { fireEvent.click(skip); });
    expect(document.querySelector('.gen-practice__reteach')).toBeNull();
  });

  it('the beat auto-advances (auto-dismisses) after the clip duration', async () => {
    vi.useFakeTimers();
    const prob = addSameDenProb();
    render(React.createElement(FakeBoard, { prob, reteachAutoAdvanceMs: 4000 }));

    // submit synchronously under fake timers.
    const nInput = screen.getByTestId('slate-n');
    const dInput = screen.getByTestId('slate-d');
    act(() => {
      fireEvent.change(nInput, { target: { value: '7' } });
      fireEvent.change(dInput, { target: { value: '16' } });
    });
    act(() => { fireEvent.click(screen.getByTestId('slate-submit')); });

    expect(document.querySelector('.gen-practice__reteach')).toBeTruthy();

    // Advance past the auto-advance window → the beat clears itself (no hard gate).
    act(() => { vi.advanceTimersByTime(4001); });
    expect(document.querySelector('.gen-practice__reteach')).toBeNull();
  });

  it('input stays live after a reteach (no hard gate — the child can retry)', async () => {
    const prob = addSameDenProb();
    render(React.createElement(FakeBoard, { prob }));
    await submitFraction(7, 16);

    expect(document.querySelector('.gen-practice__reteach')).toBeTruthy();
    // The answer inputs and Check button remain enabled — the beat overlays, it
    // does not lock the workspace.
    expect(screen.getByTestId('slate-n').disabled).toBe(false);
    expect(screen.getByTestId('slate-submit').disabled).toBe(false);
  });
});
