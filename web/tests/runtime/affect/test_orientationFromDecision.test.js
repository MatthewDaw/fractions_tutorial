// test_orientationFromDecision.test.js — UI8 (gap-build-260609): derive the
// OrientationProbe's expected goal/why from the live engine decision.

import { describe, it, expect } from 'vitest';
import { orientationFromDecision } from '../../../src/runtime/affect/orientationFromDecision.js';
import { evaluateOrientationReport } from '../../../src/runtime/affect/orientationReport.js';

describe('orientationFromDecision', () => {
  it('routine PresentProblem → "what are you working on?" with a steady goal', () => {
    const { prompt, options, expectedKey } = orientationFromDecision({ kind: 'PresentProblem' });
    expect(prompt).toMatch(/what are you working on/i);
    expect(expectedKey).toBe('practise');
    expect(options.find((o) => o.key === expectedKey)).toBeTruthy();
  });

  it('null decision falls back to the steady question (first render safe)', () => {
    const { expectedKey } = orientationFromDecision(null);
    expect(expectedKey).toBe('practise');
  });

  it('a CHANGE_KIND decision → "why did this change?" keyed to the engine reason', () => {
    const fade = orientationFromDecision({ kind: 'FadeScaffold' });
    expect(fade.prompt).toMatch(/why did the screen/i);
    expect(fade.expectedKey).toBe('doing_well');

    const raise = orientationFromDecision({ kind: 'RaiseScaffold' });
    expect(raise.expectedKey).toBe('need_help');
  });

  it('each derived question has 2–3 options including the expected key', () => {
    for (const kind of ['PresentProblem', 'FadeScaffold', 'RaiseScaffold', 'TransferProbe', 'RouteToRoom', 'ReturnToKitchen', 'EscalateToHuman']) {
      const { options, expectedKey } = orientationFromDecision({ kind });
      expect(options.length).toBeGreaterThanOrEqual(2);
      expect(options.length).toBeLessThanOrEqual(3);
      expect(options.some((o) => o.key === expectedKey)).toBe(true);
    }
  });

  it('grades coherent when the child taps the expected key', () => {
    const { expectedKey } = orientationFromDecision({ kind: 'FadeScaffold' });
    expect(evaluateOrientationReport(expectedKey, expectedKey).coherent).toBe(true);
    expect(evaluateOrientationReport('made_mistakes', expectedKey).coherent).toBe(false);
  });
});
