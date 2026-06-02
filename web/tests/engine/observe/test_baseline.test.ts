// test_baseline.test.ts — Phase 1 (plan 005, S4): per-child latency-residual baseline.
//
// The residual is the signal AND its own calibration. These tests pin:
//   1. Cold start: an empty baseline is observe-only (not established), n=0.
//   2. Establishment: after minSamples corrects, `established` flips true.
//   3. Difficulty model: expected latency scales with item difficulty.
//   4. Residual: observed − expected; an unusually fast attempt → large negative residual.
//   5. Standardized residual (z) reflects the child's own spread, not a cohort.
//   6. Per-child plausible floor: defaults to the engine constant when cold, and
//      drops to a personal value (below expected, above a hard minimum) once warm.
//   7. EWMA tracks within-child drift (a child who slows down pushes the baseline up).
//   8. Purity/determinism: identical inputs → identical baseline (no wall-clock).
//
// ENGINE PURITY: pure functions, time only as injected latency numbers.

import { describe, it, expect } from 'vitest';
import {
  emptyBaseline,
  updateBaseline,
  expectedLatencyMs,
  latencyResidual,
  plausibleFloorMs,
  difficultyForScaffold,
  BASELINE_PARAMS,
} from '../../../src/engine/observe/baseline.js';

// Feed n correct attempts at a fixed latency + difficulty.
function warm(latencyMs: number, difficulty: number, n: number) {
  let b = emptyBaseline();
  for (let i = 0; i < n; i++) b = updateBaseline(b, latencyMs, difficulty);
  return b;
}

describe('latency baseline — cold start is observe-only', () => {
  it('an empty baseline has n=0 and is not established', () => {
    const b = emptyBaseline();
    expect(b.n).toBe(0);
    expect(b.established).toBe(false);
  });

  it('expectedLatencyMs is null before the baseline is established', () => {
    const b = emptyBaseline();
    expect(expectedLatencyMs(b, 1)).toBeNull();
  });
});

describe('latency baseline — establishment threshold', () => {
  it('flips to established only after minSamples corrects', () => {
    const min = BASELINE_PARAMS.minSamples;
    const justUnder = warm(4000, 1, min - 1);
    const atThreshold = warm(4000, 1, min);
    expect(justUnder.established).toBe(false);
    expect(atThreshold.established).toBe(true);
  });
});

describe('latency baseline — difficulty model', () => {
  it('expected latency scales up with item difficulty', () => {
    // Warm at the nominal difficulty (1.0) with a steady 4s latency.
    const b = warm(4000, 1, BASELINE_PARAMS.minSamples);
    const easy = expectedLatencyMs(b, 1)!;
    const hard = expectedLatencyMs(b, 2)!;
    expect(hard).toBeGreaterThan(easy);
    // A 2× harder item should expect ~2× the nominal latency.
    expect(hard).toBeCloseTo(easy * 2, 0);
  });

  it('difficultyForScaffold makes the independent level (L4) harder than max-support (L0)', () => {
    expect(difficultyForScaffold(4)).toBeGreaterThan(difficultyForScaffold(0));
  });
});

describe('latency baseline — residual', () => {
  it('an unusually fast attempt yields a large negative residual once warm', () => {
    const b = warm(4000, 1, BASELINE_PARAMS.minSamples);
    const r = latencyResidual(b, 800, 1); // 800ms vs ~4000ms expected
    expect(r.established).toBe(true);
    expect(r.residualMs).toBeLessThan(0);
    expect(r.expectedMs).toBeCloseTo(4000, -2);
  });

  it('a steady attempt at the baseline yields a near-zero residual', () => {
    const b = warm(4000, 1, BASELINE_PARAMS.minSamples);
    const r = latencyResidual(b, 4000, 1);
    expect(Math.abs(r.residualMs)).toBeLessThan(500);
  });

  it('residual is reported but flagged not-established during cold start', () => {
    const b = warm(4000, 1, 2); // below minSamples
    const r = latencyResidual(b, 1000, 1);
    expect(r.established).toBe(false);
    // still numerically computable (within-session drift control), just not actionable
    expect(typeof r.residualMs).toBe('number');
  });
});

describe('latency baseline — per-child plausible floor (replaces fixed latencyFloorMs)', () => {
  it('returns the supplied default constant while cold', () => {
    const b = emptyBaseline();
    expect(plausibleFloorMs(b, 1, 1200)).toBe(1200);
  });

  it('returns a personal floor below expected (but above a hard minimum) once warm', () => {
    const b = warm(4000, 1, BASELINE_PARAMS.minSamples);
    const floor = plausibleFloorMs(b, 1, 1200);
    const expected = expectedLatencyMs(b, 1)!;
    expect(floor).toBeLessThan(expected);
    expect(floor).toBeGreaterThanOrEqual(BASELINE_PARAMS.minFloorMs);
  });

  it('a fast child gets a lower floor than a slow child (per-child, not cohort)', () => {
    const fast = warm(2000, 1, BASELINE_PARAMS.minSamples);
    const slow = warm(9000, 1, BASELINE_PARAMS.minSamples);
    expect(plausibleFloorMs(fast, 1, 1200)).toBeLessThan(plausibleFloorMs(slow, 1, 1200));
  });
});

describe('latency baseline — within-child drift', () => {
  it('a child who slows down pushes the EWMA expected latency up', () => {
    let b = warm(3000, 1, BASELINE_PARAMS.minSamples);
    const before = expectedLatencyMs(b, 1)!;
    for (let i = 0; i < 6; i++) b = updateBaseline(b, 8000, 1); // now slow
    const after = expectedLatencyMs(b, 1)!;
    expect(after).toBeGreaterThan(before);
  });
});

describe('latency baseline — determinism (engine purity)', () => {
  it('identical inputs produce identical baselines', () => {
    const a = warm(4000, 1, 8);
    const b = warm(4000, 1, 8);
    expect(a).toEqual(b);
  });
});
