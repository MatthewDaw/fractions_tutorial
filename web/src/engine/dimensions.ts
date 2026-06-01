// dimensions.ts — U4: Fluency, scaffold-independence, transfer, hint-dependence.
// (measurement §4.2–4.4)
//
// All functions are pure folds over an Observation array. No wall-clock calls,
// no React, no side effects.
//
// ENGINE PURITY: NO React imports, NO wall-clock calls.

import type { Observation, FluencyStats, ScaffoldLevel } from './types.js';
import { PARAMS } from './params.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function median(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Compute the slope (linear regression coefficient) of a sequence of values.
 * Returns 0 when n < 2 (undefined slope treated as flat = no deterioration).
 */
function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  // Simple least-squares slope through index 0..n-1.
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (values[i] - meanY);
    den += (i - meanX) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

// ---------------------------------------------------------------------------
// Fluency (measurement §4.2)
//
// Over the LAST fluencyMinN (≥5) correct observations:
//   fluency_ok ⟺ median_latency ≤ age_band(skill) AND slope ≤ ε
//
// age_band and ε are uncalibrated — the result is SOFT/advisory (KTD2).
// A config switch in fluencyOk() can flip it to hard once calibrated.
// ---------------------------------------------------------------------------

/** Nominal per-level latency ceilings (ms). Uncalibrated; used for soft advisory only. */
const AGE_BAND_MS = 15_000; // 15 s — generous uncalibrated ceiling
/** Latency slope threshold (ms per attempt): slope ≤ ε means not deteriorating. */
const SLOPE_EPS = 500;

/**
 * Compute fluency statistics over the last N correct observations.
 *
 * Returns a FluencyStats object. `median_latency` and `slope` are null when
 * the count of correct observations is below PARAMS.fluencyMinN.
 */
export function computeFluency(observations: readonly Observation[]): FluencyStats {
  const corrects = observations.filter((o) => o.correct);
  const n = corrects.length;

  if (n < PARAMS.fluencyMinN) {
    return { median_latency: null, slope: null, n };
  }

  const recent = corrects.slice(-PARAMS.fluencyMinN);
  const latencies = recent.map((o) => o.latency);
  const sorted = [...latencies].sort((a, b) => a - b);
  const mdn = median(sorted);
  const slope = linearSlope(latencies);

  return { median_latency: mdn, slope, n };
}

/**
 * Determine whether fluency is satisfied.
 *
 * @param stats     FluencyStats from computeFluency().
 * @param hardMode  When false (default), a failing fluency stat is advisory only
 *                  and this function returns true. When true (calibrated mode),
 *                  a failing stat returns false and blocks the gate.
 */
export function fluencyOk(
  stats: FluencyStats,
  hardMode = false
): boolean {
  if (!hardMode) {
    // Soft/advisory — always passes pre-calibration.
    return true;
  }
  if (stats.median_latency === null || stats.slope === null) {
    // Not enough data — do not block (insufficient evidence).
    return true;
  }
  return stats.median_latency <= AGE_BAND_MS && stats.slope <= SLOPE_EPS;
}

// ---------------------------------------------------------------------------
// Independence (measurement §4.3)
//
// ≥2 correct answers on ≥2 DISTINCT problems, all at scaffold_level ≥ L3,
// all hint_max_rung === 0 (hint-free).
// ---------------------------------------------------------------------------

/**
 * The minimum scaffold level that counts for independence evidence.
 * Design L3 = "bare expression, no cue" per graph.ts scaffold_ladder.
 */
const INDEPENDENCE_MIN_SCAFFOLD: ScaffoldLevel = 3;

/** Minimum number of qualifying correct observations required. */
const INDEPENDENCE_MIN_COUNT = 2;

/** Minimum number of distinct problems required. */
const INDEPENDENCE_MIN_DISTINCT_PROBLEMS = 2;

/**
 * Returns true when the child has demonstrated scaffold-independence:
 * ≥2 correct at L3+ on ≥2 distinct problems, all hint-free.
 */
export function isIndependent(observations: readonly Observation[]): boolean {
  const qualifying = observations.filter(
    (o) =>
      o.correct &&
      o.scaffold_level >= INDEPENDENCE_MIN_SCAFFOLD &&
      o.hint_max_rung === 0
  );
  if (qualifying.length < INDEPENDENCE_MIN_COUNT) return false;

  // Count distinct problem identifiers. Each Observation may carry a
  // surface_form in answer_value[1] context or a problem_id in the event.
  // We use a combination of scaffold_level and answer_value as a rough
  // "distinct problem" proxy when no explicit problem_id is present.
  // A problem_id field is used when present on the observation (future seam).
  const problemIds = new Set<string>();
  for (const obs of qualifying) {
    // Use the problem_id if the observation carries it (future seam), otherwise
    // hash a proxy from answer_value to distinguish problems structurally.
    const id: string =
      (obs as Observation & { problem_id?: string }).problem_id ??
      (obs.answer_value !== null
        ? `${obs.answer_value[0]}/${obs.answer_value[1]}`
        : `no-value-${obs.scaffold_level}`);
    problemIds.add(id);
  }
  return problemIds.size >= INDEPENDENCE_MIN_DISTINCT_PROBLEMS;
}

// ---------------------------------------------------------------------------
// Transfer (measurement §4.4)
//
// ≥2 correct on ≥2 structurally distinct surface_forms, hint-free,
// at low scaffold (≤ L3 in the independence sense — "low scaffold" here means
// the child is working without heavy cues), latency in band.
// ---------------------------------------------------------------------------

/** "Low scaffold" ceiling for transfer qualification. */
const TRANSFER_MAX_SCAFFOLD: ScaffoldLevel = 3;

/** Minimum number of qualifying corrects for transfer. */
const TRANSFER_MIN_COUNT = 2;

/** Minimum number of structurally distinct surface forms. */
const TRANSFER_MIN_DISTINCT_FORMS = 2;

/**
 * Returns true when the child has demonstrated transfer:
 * ≥2 correct on ≥2 distinct surface_forms, hint-free, low scaffold,
 * latency in band.
 *
 * surface_form is read from the Observation's optional `surface_form` field
 * (added by the future lesson emission seam). When absent, falls back to
 * proxying via answer_value to detect structural difference.
 */
export function hasTransferred(observations: readonly Observation[]): boolean {
  const qualifying = observations.filter(
    (o) =>
      o.correct &&
      o.scaffold_level <= TRANSFER_MAX_SCAFFOLD &&
      o.hint_max_rung === 0 &&
      o.latency >= PARAMS.latencyFloorMs // in band (not too fast)
  );
  if (qualifying.length < TRANSFER_MIN_COUNT) return false;

  const forms = new Set<string>();
  for (const obs of qualifying) {
    const form: string =
      (obs as Observation & { surface_form?: string }).surface_form ??
      (obs.answer_value !== null
        ? `${obs.answer_value[1]}` // denominator as a structural proxy
        : `anon-${obs.scaffold_level}`);
    forms.add(form);
  }
  return forms.size >= TRANSFER_MIN_DISTINCT_FORMS;
}

// ---------------------------------------------------------------------------
// Hint-dependence (measurement §4.4 / §4.5)
//
// Fraction of recent correct answers that required hint_max_rung ≥ H2.
// H2 = rung 2 (the child needed at least the second hint level).
// ---------------------------------------------------------------------------

/** Minimum hint rung that counts as "hint-dependent." */
const HINT_DEPENDENCE_THRESHOLD = 2;

/** Window of recent correct observations to assess. */
const HINT_DEPENDENCE_WINDOW = 5;

/**
 * Returns the fraction [0, 1] of recent correct observations that required
 * hint_max_rung ≥ H2. Returns 0 when there are no recent corrects.
 */
export function computeHintDependence(observations: readonly Observation[]): number {
  const recentCorrects = observations
    .filter((o) => o.correct)
    .slice(-HINT_DEPENDENCE_WINDOW);
  if (recentCorrects.length === 0) return 0;
  const hintDependent = recentCorrects.filter(
    (o) => o.hint_max_rung >= HINT_DEPENDENCE_THRESHOLD
  );
  return hintDependent.length / recentCorrects.length;
}
