// test_voicePrediction.test.jsx — UI6: voice-prediction beat.
//
// Covers the two acceptance paths:
//   1. PARSE → VERIFY: a transcript is parsed into the answer shape and graded
//      by the EXISTING deterministic verifier (gradeAnswer) — never by the raw
//      transcript. (digits, number words, spoken fractions, integers.)
//   2. FALLBACK: jsdom has NO SpeechRecognition, so the component renders the
//      typing fallback; a typed guess parses+verifies through the same path and
//      reports an ADVISORY pre-commitment signal. The learner is never blocked.
// Plus: the live-mic path with an injected fake recognizer (transcription→verify),
// and the advisory anti-pattern-match signal (fast wrong guess).

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';

import VoicePredictionBeat from '../../src/ui/VoicePredictionBeat.jsx';
import {
  getSpeechRecognition,
  isVoiceInputAvailable,
  parseSpokenInteger,
  parseSpokenFraction,
  transcriptToAnswer,
  supportsVoicePrediction,
  verifyPrediction,
  predictionSignal,
} from '../../src/runtime/voicePrediction.js';
import { generateFor } from '../../src/generators/index.js';

afterEach(cleanup);

// ── pure parse layer ────────────────────────────────────────────────────────
describe('parseSpokenInteger', () => {
  it('parses digits and number words (incl. compound tens)', () => {
    expect(parseSpokenInteger('12')).toBe(12);
    expect(parseSpokenInteger('twelve')).toBe(12);
    expect(parseSpokenInteger('twenty four')).toBe(24);
    expect(parseSpokenInteger('twenty-four')).toBe(24);
    expect(parseSpokenInteger('I think it is forty')).toBe(40);
  });
  it('returns null when no number is heard', () => {
    expect(parseSpokenInteger('um what')).toBeNull();
    expect(parseSpokenInteger('')).toBeNull();
    expect(parseSpokenInteger(null)).toBeNull();
  });
});

describe('parseSpokenFraction', () => {
  it('parses "a/b", "three fourths", "two over three", "one half", bare wholes', () => {
    expect(parseSpokenFraction('3/4')).toEqual({ num: 3, den: 4 });
    expect(parseSpokenFraction('three fourths')).toEqual({ num: 3, den: 4 });
    expect(parseSpokenFraction('three quarters')).toEqual({ num: 3, den: 4 });
    expect(parseSpokenFraction('one half')).toEqual({ num: 1, den: 2 });
    expect(parseSpokenFraction('two over three')).toEqual({ num: 2, den: 3 });
    expect(parseSpokenFraction('five')).toEqual({ num: 5, den: 1 });
  });
});

// ── parse → VERIFY with the existing deterministic grader ────────────────────
describe('verifyPrediction reuses gradeAnswer (never the raw transcript)', () => {
  it('a correct spoken fraction verifies correct for an add problem', () => {
    const p = generateFor('ADD_SAME_DEN', { level: 0, index: 0 });
    const spoken = `${p.answer.num} over ${p.answer.den}`;
    const r = verifyPrediction(p, spoken);
    expect(r.recognized).toBe(true);
    expect(r.parsed).toEqual({ num: p.answer.num, den: p.answer.den });
    expect(r.grade.correct).toBe(true);
  });

  it('a correct spoken integer verifies correct for a mult problem', () => {
    const p = generateFor('MULT_FACTS', { level: 1, index: 2 });
    const r = verifyPrediction(p, `${p.answer.product}`);
    expect(r.recognized).toBe(true);
    expect(r.parsed).toEqual({ value: p.answer.product });
    expect(r.grade.correct).toBe(true);
  });

  it('a WRONG spoken answer verifies incorrect (verdict from the grader)', () => {
    const p = generateFor('MULT_FACTS', { level: 1, index: 0 });
    const r = verifyPrediction(p, `${p.answer.product + 3}`);
    expect(r.recognized).toBe(true);
    expect(r.grade.correct).toBe(false);
  });

  it('an UNPARSEABLE transcript is not recognized and yields no grade', () => {
    const p = generateFor('MULT_FACTS', { level: 1, index: 0 });
    const r = verifyPrediction(p, 'erm I dunno');
    expect(r.recognized).toBe(false);
    expect(r.grade).toBeNull();
  });

  it('mixed / relation skills are not voice-prediction targets', () => {
    expect(supportsVoicePrediction('IMPROPER_TO_MIXED')).toBe(false);
    expect(supportsVoicePrediction('COMPARE_BENCHMARK')).toBe(false);
    expect(transcriptToAnswer('IMPROPER_TO_MIXED', 'one and a half')).toBeNull();
    expect(supportsVoicePrediction('ADD_SAME_DEN')).toBe(true);
    expect(supportsVoicePrediction('MULT_FACTS')).toBe(true);
  });
});

// ── advisory pre-commitment SIGNAL ───────────────────────────────────────────
describe('predictionSignal stays advisory', () => {
  it('is always tagged advisory and never carries a mastery verdict', () => {
    const p = generateFor('MULT_FACTS', { level: 1, index: 0 });
    const r = verifyPrediction(p, `${p.answer.product}`);
    const s = predictionSignal(r, { latencyMs: 4000 });
    expect(s.advisory).toBe(true);
    expect(s.kind).toBe('voice_prediction');
    expect(s.predictedCorrect).toBe(true);
    // a correct (or slow) prediction is never an anti-pattern flag
    expect(s.antiPatternMatch).toBe(false);
  });

  it('flags anti-pattern-match for a FAST WRONG pre-commitment (confident guess)', () => {
    const p = generateFor('MULT_FACTS', { level: 1, index: 0 });
    const r = verifyPrediction(p, `${p.answer.product + 5}`);
    const fast = predictionSignal(r, { latencyMs: 600 });
    expect(fast.predictedCorrect).toBe(false);
    expect(fast.antiPatternMatch).toBe(true);
    // the same wrong guess given slowly is NOT flagged
    const slow = predictionSignal(r, { latencyMs: 9000 });
    expect(slow.antiPatternMatch).toBe(false);
  });
});

// ── detection: jsdom has no SpeechRecognition ────────────────────────────────
describe('Web Speech API detection', () => {
  it('reports unavailable in jsdom (no SpeechRecognition global)', () => {
    expect(getSpeechRecognition()).toBeNull();
    expect(isVoiceInputAvailable()).toBe(false);
  });
  it('detects an injected recognizer', () => {
    const fake = function FakeSR() {};
    expect(getSpeechRecognition({ SpeechRecognition: fake })).toBe(fake);
    expect(getSpeechRecognition({ webkitSpeechRecognition: fake })).toBe(fake);
  });
});

// ── component: FALLBACK (no SpeechRecognition) is the test-covered path ───────
describe('VoicePredictionBeat — typing fallback (no Web Speech API)', () => {
  it('renders a typing field (not a mic button) when speech is unavailable', () => {
    const p = generateFor('MULT_FACTS', { level: 1, index: 0 });
    render(<VoicePredictionBeat problem={p} onPredict={() => {}} />);
    expect(screen.getByTestId('voice-prediction-beat')).toBeTruthy();
    expect(screen.getByLabelText(/type your predicted answer/i)).toBeTruthy();
    expect(screen.queryByText(/say my guess/i)).toBeNull();
  });

  it('a typed guess parses+verifies and reports an advisory signal', () => {
    const p = generateFor('MULT_FACTS', { level: 1, index: 0 });
    const onPredict = vi.fn();
    render(<VoicePredictionBeat problem={p} onPredict={onPredict} />);
    const input = screen.getByLabelText(/type your predicted answer/i);
    fireEvent.change(input, { target: { value: String(p.answer.product) } });
    fireEvent.click(screen.getByRole('button', { name: /that's my guess/i }));

    expect(onPredict).toHaveBeenCalledTimes(1);
    const [result, signal] = onPredict.mock.calls[0];
    expect(result.recognized).toBe(true);
    expect(result.grade.correct).toBe(true);
    expect(signal.advisory).toBe(true);
    // verdict surfaced to the learner without blocking the room
    expect(screen.getByText(/let's check it by stacking/i)).toBeTruthy();
  });

  it('Skip lets the learner move on without predicting', () => {
    const p = generateFor('MULT_FACTS', { level: 1, index: 0 });
    const onSkip = vi.fn();
    const onPredict = vi.fn();
    render(<VoicePredictionBeat problem={p} onPredict={onPredict} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(onSkip).toHaveBeenCalled();
    expect(onPredict).not.toHaveBeenCalled();
  });
});

// ── component: live mic path via an injected fake recognizer ──────────────────
// Drives the SAME transcription→verify path a real browser would, without the
// Web Speech API: an injected recognitionFactory whose start() fires a transcript.
function makeFakeRecognition(transcript) {
  return function FakeRecognition() {
    this.lang = '';
    this.start = () => {
      // emulate the async onresult callback
      this.onresult({ results: [[{ transcript }]] });
      if (this.onend) this.onend();
    };
    this.stop = () => {};
    this.abort = () => {};
  };
}

describe('VoicePredictionBeat — live mic path (injected recognizer)', () => {
  it('transcribes a spoken number, verifies it, and reports the signal', () => {
    const p = generateFor('MULT_FACTS', { level: 1, index: 0 });
    const spoken = String(p.answer.product); // a correct spoken guess
    const onPredict = vi.fn();
    render(
      <VoicePredictionBeat
        problem={p}
        onPredict={onPredict}
        recognitionFactory={makeFakeRecognition(spoken)}
      />
    );
    // mic path: a "Say my guess" button (not the typing field)
    fireEvent.click(screen.getByRole('button', { name: /say my guess/i }));
    expect(onPredict).toHaveBeenCalledTimes(1);
    const [result, signal] = onPredict.mock.calls[0];
    expect(result.recognized).toBe(true);
    expect(result.grade.correct).toBe(true);
    expect(signal.advisory).toBe(true);
    expect(screen.getByText(new RegExp(`You said:`, 'i'))).toBeTruthy();
  });
});
