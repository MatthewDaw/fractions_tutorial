// observe/baseline.ts — Phase 1 (plan 005, S4): per-child latency-residual baseline.
//
// "Baselines are per-child and relative. Act on the latency residual and its
//  derivative, never a cohort threshold." (locked decision S4)
//
// The baseline models a child's EXPECTED latency as the product of their rolling
// difficulty-normalized speed (an EWMA) and the item's difficulty. The residual
// (observed − expected) is the behavioral signal; its EWMA variance is the
// per-child spread used to standardize it (z) and to derive a personal
// plausible-compute floor that REPLACES the fixed PARAMS.latencyFloorMs.
//
// Cold start is observe-only: until `minSamples` corrects accrue, `established`
// is false and consumers must log but not act (within-session drift is the
// control). This file owns the difficulty model so it is the single calibration
// point the persona warm-start (Phase 5) tunes.
//
// ENGINE PURITY: NO React imports, NO wall-clock calls. Latency arrives as a
// plain number (a difference of injected event timestamps).

import type { ScaffoldLevel } from '../types.js';

// ---------------------------------------------------------------------------
// Tunables (hand-seeded; persona warm-start re-seeds these in Phase 5 — O1/O2)
// ---------------------------------------------------------------------------

export interface BaselineParams {
  /** EWMA weight on the newest sample (0..1). Higher = more reactive to drift. */
  alpha: number;
  /** Correct attempts required before the baseline is `established` (actionable). */
  minSamples: number;
  /** Standard deviations below expected used to set the personal plausible floor. */
  floorK: number;
  /**
   * Minimum fraction of expected the floor must drop, even at ~zero observed
   * spread — so the floor always sits below typical latency (a nominal-speed
   * answer is never flagged too-fast).
   */
  floorMarginFrac: number;
  /** Hard minimum (ms) the personal floor can never drop below. */
  minFloorMs: number;
  /** Difficulty multiplier added per scaffold level (L4 independent = hardest). */
  scaffoldDifficultySlope: number;
}

export const BASELINE_PARAMS: BaselineParams = {
  alpha: 0.3,
  minSamples: 5,
  floorK: 1.5,
  floorMarginFrac: 0.4,
  minFloorMs: 300,
  scaffoldDifficultySlope: 0.15,
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface LatencyBaseline {
  /** Number of (correct) samples incorporated. */
  readonly n: number;
  /** EWMA of difficulty-normalized latency (ms) — the child's nominal speed. */
  readonly ewmaMs: number;
  /** EWMA of squared residual (ms²) — the child's own spread. */
  readonly varMs2: number;
  /** True once n ≥ minSamples: the baseline may be acted upon. */
  readonly established: boolean;
}

export function emptyBaseline(): LatencyBaseline {
  return { n: 0, ewmaMs: 0, varMs2: 0, established: false };
}

// ---------------------------------------------------------------------------
// Difficulty model — the single calibration point
// ---------------------------------------------------------------------------

/**
 * Difficulty multiplier for a design scaffold level. Independence (L4) is the
 * hardest (no support), max-support (L0) the easiest, so difficulty rises with
 * the level. 1.0 at L0; slope is a tunable.
 */
export function difficultyForScaffold(
  level: ScaffoldLevel,
  params: BaselineParams = BASELINE_PARAMS
): number {
  return 1 + params.scaffoldDifficultySlope * level;
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Incorporate one attempt's latency at a given item difficulty.
 *
 * @param baseline   Prior baseline.
 * @param latencyMs  Observed latency (ms) — a difference of injected timestamps.
 * @param difficulty Item difficulty multiplier (1.0 = nominal). See difficultyForScaffold.
 */
export function updateBaseline(
  baseline: LatencyBaseline,
  latencyMs: number,
  difficulty: number,
  params: BaselineParams = BASELINE_PARAMS
): LatencyBaseline {
  const d = difficulty > 0 ? difficulty : 1;
  const normalized = latencyMs / d;

  if (baseline.n === 0) {
    return { n: 1, ewmaMs: normalized, varMs2: 0, established: 1 >= params.minSamples };
  }

  // Residual against the CURRENT expected, before folding the new sample in.
  const expected = baseline.ewmaMs * d;
  const resid = latencyMs - expected;

  const ewmaMs = (1 - params.alpha) * baseline.ewmaMs + params.alpha * normalized;
  const varMs2 = (1 - params.alpha) * baseline.varMs2 + params.alpha * resid * resid;
  const n = baseline.n + 1;

  return { n, ewmaMs, varMs2, established: n >= params.minSamples };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * Expected latency (ms) for an item of the given difficulty, or null while the
 * baseline is still cold (observe-only).
 */
export function expectedLatencyMs(
  baseline: LatencyBaseline,
  difficulty: number
): number | null {
  if (!baseline.established) return null;
  const d = difficulty > 0 ? difficulty : 1;
  return baseline.ewmaMs * d;
}

export interface ResidualResult {
  /** Expected latency used (established model, or within-session drift control). */
  expectedMs: number;
  /** Observed − expected (ms). Negative = faster than personal baseline. */
  residualMs: number;
  /** Residual standardized by the child's own spread (0 when spread unknown). */
  z: number;
  /** Whether the baseline is established (actionable) vs observe-only. */
  established: boolean;
}

/**
 * Compute the latency residual for an attempt. Always returns a number so cold
 * start can still LOG it; `established` tells the consumer whether to ACT.
 *
 * Cold-start fallback (within-session drift): expected is the EWMA-so-far if any
 * samples exist, else the latency itself (residual 0 — nothing to compare to).
 */
export function latencyResidual(
  baseline: LatencyBaseline,
  latencyMs: number,
  difficulty: number
): ResidualResult {
  const d = difficulty > 0 ? difficulty : 1;
  const expectedMs = baseline.n > 0 ? baseline.ewmaMs * d : latencyMs;
  const residualMs = latencyMs - expectedMs;
  const sd = Math.sqrt(baseline.varMs2);
  const z = sd > 0 ? residualMs / sd : 0;
  return { expectedMs, residualMs, z, established: baseline.established };
}

/**
 * Per-child plausible-compute floor (ms). This REPLACES the fixed
 * PARAMS.latencyFloorMs in the too_fast_correct guard: a correct answer below
 * this floor is implausibly fast FOR THIS CHILD.
 *
 * While cold, returns `defaultFloorMs` (today's constant) so the seam degrades
 * to current behavior with no baseline. Once warm, returns expected − k·sd,
 * clamped to [minFloorMs, expected].
 */
export function plausibleFloorMs(
  baseline: LatencyBaseline,
  difficulty: number,
  defaultFloorMs: number,
  params: BaselineParams = BASELINE_PARAMS
): number {
  const expected = expectedLatencyMs(baseline, difficulty);
  if (expected === null) return defaultFloorMs;
  const sd = Math.sqrt(baseline.varMs2);
  const drop = Math.max(params.floorK * sd, expected * params.floorMarginFrac);
  return Math.min(expected, Math.max(params.minFloorMs, expected - drop));
}
