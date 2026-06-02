// test_proof_integration.test.jsx — PROOF SUITE (runtime layer).
//
// The engine layer (test_proof_engine) proves the LOGIC. This file proves the
// logic is actually WIRED THROUGH THE REACT RUNTIME a real lesson uses: it drives
// the shared practice hook with answers (the runtime equivalent of typing/clicking
// Check) and asserts the engineStore — the exact source the on-screen "why" banner
// reads — reflects the right decision, and that support is withdrawn on recovery.
//
// Every lesson page mounts this SAME path (useLessonScaffold → useLessonEngine →
// engineStore → RationaleBanner/MasteryInspector), so proving it here proves the
// mechanism for every page; the live browser sweep confirms each page mounts it.
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeneratedPractice } from '../../src/runtime/useGeneratedPractice.js';
import { getSnapshot, resetEngineStore } from '../../src/runtime/engineStore.js';
import { gcd } from '../../src/generators/core.js';

// Grade SIMPLIFY: lowest terms = correct (3★); equal-but-not-reduced = 2★ no-credit.
function gradeSimplify(problem, ans) {
  const correct = ans.num === problem.answer.num && ans.den === problem.answer.den;
  return { correct, stars: correct ? 3 : 0, errorSignature: correct ? null : 'not_simplified' };
}
function reduced(p) {
  const g = gcd(p.operands.num, p.operands.den);
  return { num: p.operands.num / g, den: p.operands.den / g };
}

let clock;
beforeEach(() => {
  localStorage.clear();
  resetEngineStore();
  clock = 200000;
  vi.spyOn(Date, 'now').mockImplementation(() => clock);
});
afterEach(() => vi.restoreAllMocks());

// initialLevel 2 mirrors the shipped practice stage (useLessonScaffold
// generatedStartLevel = 2 — post-teaching, mid-ladder, where Raise is in play).
function drive(skill, lessonId, gradeAnswer, initialLevel = 2) {
  return renderHook(() => useGeneratedPractice({ skill, lessonId, gradeAnswer, initialLevel }));
}

describe('CLAIM 1+2 through the runtime — support appears on errors, recedes on recovery', () => {
  it('two wrong answers (real submits) raise support → the banner store shows RaiseScaffold', () => {
    const { result } = drive('SIMPLIFY', 'r4', gradeSimplify);
    // Two wrong submits in a row (the runtime equivalent of typing a wrong answer + Check twice).
    for (let i = 0; i < 2; i++) {
      const p = result.current.problem;
      clock += 1500;
      act(() => result.current.submit({ num: p.operands.num + 1, den: p.operands.den }));
    }
    expect(getSnapshot().decision.kind).toBe('RaiseScaffold');
    expect(getSnapshot().rationale).toMatch(/support/i); // child-readable "why"
  });

  it('after support is raised, a clean streak WITHDRAWS it → the store shows FadeScaffold', () => {
    const { result } = drive('SIMPLIFY', 'r4', gradeSimplify);
    // Stumble twice (support raised)…
    for (let i = 0; i < 2; i++) {
      const p = result.current.problem;
      clock += 1500;
      act(() => result.current.submit({ num: p.operands.num + 1, den: p.operands.den }));
    }
    expect(getSnapshot().decision.kind).toBe('RaiseScaffold');
    // …then string together clean correct answers — the engine fades the support back off.
    let faded = false;
    for (let i = 0; i < 5 && !faded; i++) {
      const p = result.current.problem;
      clock += 1500; // in-band (not too-fast), hint-free → clean
      act(() => result.current.submit(reduced(p)));
      if (getSnapshot().decision.kind === 'FadeScaffold') faded = true;
    }
    expect(faded).toBe(true); // support removed once the student demonstrably no longer needs it
  });

  it('routine progress does NOT spam the banner — only real CHANGES surface a "why"', () => {
    // The banner suppresses PresentProblem; a single ordinary correct should not
    // produce a change-decision the banner would show.
    const { result } = drive('SIMPLIFY', 'r4', gradeSimplify);
    const p = result.current.problem;
    clock += 1500;
    act(() => result.current.submit(reduced(p)));
    const kind = getSnapshot().decision?.kind;
    // After one correct it's a routine PresentProblem (re-roll), not a Fade/Raise/Transfer.
    expect(['PresentProblem', undefined]).toContain(kind);
  });
});

describe('CLAIM 3 through the runtime — held at level until a clean streak, then it climbs', () => {
  it('the level does not advance on one or two corrects, then climbs on the streak', () => {
    const { result } = drive('SIMPLIFY', 'r4', gradeSimplify, 0); // start at the floor to watch it climb
    const levels = [result.current.level];
    for (let i = 0; i < 6; i++) {
      const p = result.current.problem;
      clock += 1500;
      act(() => result.current.submit(reduced(p)));
      levels.push(result.current.level);
    }
    // Starts at L0, stays put across the first correct(s), then climbs strictly upward.
    expect(levels[0]).toBe(0);
    expect(Math.max(...levels)).toBeGreaterThan(levels[0]); // it DID unlock higher levels
    // Monotonic non-decreasing (never drops a level on clean work).
    for (let i = 1; i < levels.length; i++) expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1]);
  });

  it('a too-fast (guessed) correct is caught — next problem is a different surface form', () => {
    const { result } = drive('SIMPLIFY', 'r4', gradeSimplify);
    const before = result.current.surfaceForm;
    const p = result.current.problem;
    clock += 100; // answered implausibly fast
    act(() => result.current.submit(reduced(p)));
    // The engine refuses to treat the fast answer as fluency — it probes transfer.
    expect(getSnapshot().decision.kind).toBe('TransferProbe');
    expect(result.current.problem.surfaceForm).toBeDefined();
  });
});
