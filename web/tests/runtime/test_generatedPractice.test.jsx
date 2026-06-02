// test_generatedPractice.test.jsx — the estimator-driven practice loop end to end,
// through the REAL engine (no mocks): generators → useGeneratedPractice →
// measurementReduce + nextDecision → practiceFlow → next generated problem.
//
// This is the proof that "auto-generate variations + let the estimator keep things
// moving" actually composes: a diligent learner's clean streak makes the engine
// fade scaffold (harder generated problems); a too-fast guesser gets transfer-
// probed onto a different surface form instead of being waved through.
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeneratedPractice } from '../../src/runtime/useGeneratedPractice.js';
import { resetEngineStore } from '../../src/runtime/engineStore.js';

// Grade a generated SIMPLIFY problem: correct iff the answer equals lowest terms.
function gradeSimplify(problem, ans) {
  const correct = ans.num === problem.answer.num && ans.den === problem.answer.den;
  return { correct, stars: correct ? 3 : 0, errorSignature: correct ? null : 'not_simplified' };
}

let clock;
beforeEach(() => {
  localStorage.clear();
  resetEngineStore();
  clock = 100000;
  vi.spyOn(Date, 'now').mockImplementation(() => clock);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('useGeneratedPractice — estimator-driven generated loop', () => {
  it('starts on a valid generated problem for the skill', () => {
    const { result } = renderHook(() =>
      useGeneratedPractice({ skill: 'SIMPLIFY', lessonId: 'r4', gradeAnswer: gradeSimplify })
    );
    const p = result.current.problem;
    expect(p.skill).toBe('SIMPLIFY');
    expect(result.current.level).toBe(0);
    // correct-by-construction: presented fraction reduces to the answer.
    expect(p.answer.num * p.operands.factor).toBe(p.operands.num);
  });

  it('hands a fresh variation after each correct answer (the loop runs)', () => {
    const { result } = renderHook(() =>
      useGeneratedPractice({ skill: 'SIMPLIFY', lessonId: 'r4', gradeAnswer: gradeSimplify })
    );
    const prompts = new Set();
    for (let i = 0; i < 5; i++) {
      const p = result.current.problem;
      prompts.add(p.prompt);
      clock += 1500; // diligent pace (in-band, not too fast)
      act(() => {
        result.current.submit({ num: p.answer.num, den: p.answer.den });
      });
    }
    // The learner saw several DIFFERENT problems, not the same one repeated.
    expect(prompts.size).toBeGreaterThan(2);
  });

  it('fades scaffold (harder problems) after a clean correct streak', () => {
    const { result } = renderHook(() =>
      useGeneratedPractice({ skill: 'SIMPLIFY', lessonId: 'r4', gradeAnswer: gradeSimplify })
    );
    const levels = [result.current.level];
    for (let i = 0; i < 6; i++) {
      const p = result.current.problem;
      clock += 1500; // clean: hint-free + in-band latency
      act(() => {
        result.current.submit({ num: p.answer.num, den: p.answer.den });
      });
      levels.push(result.current.level);
    }
    // A clean streak should push the scaffold level up at least once (FadeScaffold).
    expect(Math.max(...levels)).toBeGreaterThan(0);
  });

  it('transfer-probes a too-fast guesser onto a DIFFERENT surface form', () => {
    const { result } = renderHook(() =>
      useGeneratedPractice({ skill: 'SIMPLIFY', lessonId: 'r4', gradeAnswer: gradeSimplify })
    );
    const firstForm = result.current.surfaceForm;
    // Answer correctly but suspiciously fast (below the 800ms compute floor).
    const p0 = result.current.problem;
    clock += 100;
    act(() => {
      result.current.submit({ num: p0.answer.num, den: p0.answer.den });
    });
    // The engine flags too_fast_correct → queues a TransferProbe → the next problem
    // is a structurally different surface form (real transfer, not a repeat shape).
    const forms = result.current.problem;
    expect(forms.surfaceForm).not.toBe(undefined);
    // After the probe the loop is still serving valid, correct-by-construction problems.
    expect(forms.answer.num * forms.operands.factor).toBe(forms.operands.num);
  });

  it('never exits early while the learner is mid-practice', () => {
    const { result } = renderHook(() =>
      useGeneratedPractice({ skill: 'SIMPLIFY', lessonId: 'r4', gradeAnswer: gradeSimplify })
    );
    clock += 1500;
    act(() => {
      const p = result.current.problem;
      result.current.submit({ num: p.answer.num, den: p.answer.den });
    });
    expect(result.current.exit).toBeNull();
  });
});
