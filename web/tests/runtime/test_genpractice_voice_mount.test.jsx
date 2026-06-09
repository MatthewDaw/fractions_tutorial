// test_genpractice_voice_mount.test.jsx — UI7: the VoicePredictionBeat is now
// MOUNTED + REACHABLE in the generated-practice surface (GenPracticeBoard), and
// its pre-commitment signal flows ADVISORY (to the engine store's prediction
// counter-metrics) and NEVER to the engine gate / judgeAndAdvance.
//
// Acceptance (from docs/reviews/2026-06-09-ui-reassessment-mounting.md §UI7):
//   • the voice beat is reachable in the generated-practice surface for
//     fraction/integer skills (supportsVoicePrediction filters mixed/relation);
//   • a test asserts it mounts + the predict signal flows advisory (not the gate);
//   • the beat is opt-in / skippable / non-blocking (the answer is still graded by
//     the room on the real submit).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import React from 'react';

// Same minimal Slate stand-in the reteach test uses (jsdom can't drive the real
// canvas/pointer Slate). The voice beat under test is independent of the widget.
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
import {
  getSnapshot,
  resetEngineStore,
} from '../../src/runtime/engineStore.js';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
beforeEach(() => {
  resetEngineStore();
});

// A fake `scaffold` matching the controller surface GenPracticeBoard consumes.
// reportAttempt / award are spies so the test can assert the voice prediction
// NEVER reaches the engine judge path — only the real `submit` does.
function makeScaffold(prob, overrides = {}) {
  return {
    prob,
    solved: false,
    badInput: false,
    status: { tone: 'normal', text: '' },
    setStatus: vi.fn(),
    award: vi.fn(),
    reportAttempt: vi.fn(),
    flashBad: vi.fn(),
    ...overrides,
  };
}

describe('UI7 — VoicePredictionBeat is mounted in GenPracticeBoard', () => {
  it('renders the beat for a fraction skill (ADD_SAME_DEN), above the answer input', () => {
    const prob = generateFor('ADD_SAME_DEN', { level: 2, index: 0 });
    render(
      React.createElement(GenPracticeBoard, { skill: 'ADD_SAME_DEN', scaffold: makeScaffold(prob) })
    );
    // The beat is present + reachable.
    expect(screen.getByTestId('voice-prediction-beat')).toBeTruthy();
    // jsdom has no Web Speech API → the opt-in typing fallback is what is shown
    // (never auto-grabbing the mic).
    expect(screen.getByLabelText(/type your predicted answer/i)).toBeTruthy();
    // The answer input still exists underneath — the beat does not replace it.
    expect(screen.getByTestId('slate-n')).toBeTruthy();
  });

  it('renders the beat for an integer skill (MULT_FACTS)', () => {
    const prob = generateFor('MULT_FACTS', { level: 1, index: 0 });
    render(
      React.createElement(GenPracticeBoard, { skill: 'MULT_FACTS', scaffold: makeScaffold(prob) })
    );
    expect(screen.getByTestId('voice-prediction-beat')).toBeTruthy();
  });

  it('does NOT render the beat for a mixed skill (IMPROPER_TO_MIXED, filtered out)', () => {
    const prob = generateFor('IMPROPER_TO_MIXED', { level: 1, index: 0 });
    render(
      React.createElement(GenPracticeBoard, { skill: 'IMPROPER_TO_MIXED', scaffold: makeScaffold(prob) })
    );
    expect(screen.queryByTestId('voice-prediction-beat')).toBeNull();
  });

  it('does NOT render the beat for a relation skill (COMPARE_BENCHMARK, filtered out)', () => {
    const prob = generateFor('COMPARE_BENCHMARK', { level: 1, index: 0 });
    render(
      React.createElement(GenPracticeBoard, { skill: 'COMPARE_BENCHMARK', scaffold: makeScaffold(prob) })
    );
    expect(screen.queryByTestId('voice-prediction-beat')).toBeNull();
  });
});

describe('UI7 — the prediction signal is ADVISORY (store only, not the gate)', () => {
  it('a recorded prediction updates the store counter-metrics and never calls the engine judge', () => {
    const prob = generateFor('MULT_FACTS', { level: 1, index: 0 });
    const scaffold = makeScaffold(prob);
    render(
      React.createElement(GenPracticeBoard, { skill: 'MULT_FACTS', scaffold })
    );

    expect(getSnapshot().metrics.predictionsMade).toBe(0);

    // Type a (correct) guess into the beat's fallback and record it.
    const guess = screen.getByLabelText(/type your predicted answer/i);
    fireEvent.change(guess, { target: { value: String(prob.answer.product) } });
    fireEvent.click(screen.getByRole('button', { name: /that's my guess/i }));

    // ADVISORY: the store's prediction counter ticked.
    expect(getSnapshot().metrics.predictionsMade).toBe(1);
    // NOT the gate: the engine judge path was never touched by the prediction.
    expect(scaffold.reportAttempt).not.toHaveBeenCalled();
    expect(scaffold.award).not.toHaveBeenCalled();
  });

  it('a fast WRONG pre-commitment records the anti-pattern-match flag (advisory)', () => {
    // A typed guess in the fallback path is recorded immediately (startedAt is set
    // and read in the same synchronous submit), so its latency reads as ~0ms —
    // i.e. "fast". A fast + WRONG pre-commitment is the confident-wrong anti-pattern.
    const prob = generateFor('MULT_FACTS', { level: 1, index: 0 });
    const scaffold = makeScaffold(prob);
    render(
      React.createElement(GenPracticeBoard, { skill: 'MULT_FACTS', scaffold })
    );

    const guess = screen.getByLabelText(/type your predicted answer/i);
    // a WRONG guess, recorded fast
    fireEvent.change(guess, { target: { value: String(prob.answer.product + 7) } });
    fireEvent.click(screen.getByRole('button', { name: /that's my guess/i }));

    const m = getSnapshot().metrics;
    expect(m.predictionsMade).toBe(1);
    expect(m.predictionAntiPatterns).toBe(1);
    // still advisory: never the gate.
    expect(scaffold.reportAttempt).not.toHaveBeenCalled();
  });

  it('the real answer is still graded by the room on actual submit (gate unchanged)', () => {
    const prob = generateFor('MULT_FACTS', { level: 1, index: 0 });
    const scaffold = makeScaffold(prob);
    render(
      React.createElement(GenPracticeBoard, { skill: 'MULT_FACTS', scaffold })
    );

    // Predict first (advisory)…
    const guess = screen.getByLabelText(/type your predicted answer/i);
    fireEvent.change(guess, { target: { value: String(prob.answer.product) } });
    fireEvent.click(screen.getByRole('button', { name: /that's my guess/i }));
    // the beat is now dismissed (the child moves to the real answer step)
    expect(screen.queryByTestId('voice-prediction-beat')).toBeNull();

    // …now the REAL attempt goes through the room's grading (award), not the beat.
    fireEvent.change(screen.getByTestId('slate-v'), { target: { value: String(prob.answer.product) } });
    fireEvent.click(screen.getByTestId('slate-submit'));
    expect(scaffold.award).toHaveBeenCalledTimes(1);
  });
});

describe('UI7 — opt-in / skippable / non-blocking', () => {
  it('Skip — just stack dismisses the beat without recording a signal', () => {
    const prob = generateFor('ADD_SAME_DEN', { level: 2, index: 0 });
    const scaffold = makeScaffold(prob);
    render(
      React.createElement(GenPracticeBoard, { skill: 'ADD_SAME_DEN', scaffold })
    );

    expect(screen.getByTestId('voice-prediction-beat')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));

    // Dismissed, no signal recorded, gate untouched.
    expect(screen.queryByTestId('voice-prediction-beat')).toBeNull();
    expect(getSnapshot().metrics.predictionsMade).toBe(0);
    expect(scaffold.reportAttempt).not.toHaveBeenCalled();
    // The answer input is still live underneath — the beat never blocked it.
    expect(screen.getByTestId('slate-n')).toBeTruthy();
  });
});
