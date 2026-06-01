// decay.ts — U5: Spaced retention probes (measurement §4.6).
//
// A "retention probe" is a low-scaffold, hint-free check-in for a MASTERED node.
// If the child fails it, transfer_passed is cleared and P_known is dropped below
// the mastery threshold, re-opening the node for the next wall encounter.
//
// TIME IS DATA: `now` is always injected by the caller; no wall-clock inside
// the engine (KTD9, ENGINE PURITY).
//
// ENGINE PURITY: NO React imports, NO wall-clock calls.

import type { MasteryEstimate } from './types.js';
import { bktUpdate } from './bkt.js';

// ---------------------------------------------------------------------------
// Retention-probe schedule
// ---------------------------------------------------------------------------

/** Probe delay schedule (ms since mastery was first confirmed). */
export const PROBE_DELAYS_MS: readonly number[] = [
  1 * 24 * 60 * 60 * 1000,   //  1 day
  3 * 24 * 60 * 60 * 1000,   //  3 days
  7 * 24 * 60 * 60 * 1000,   //  1 week
  21 * 24 * 60 * 60 * 1000,  //  3 weeks
  60 * 24 * 60 * 60 * 1000,  //  2 months
];

/** Default initial delay before the first probe (ms). */
const DEFAULT_FIRST_PROBE_DELAY_MS = PROBE_DELAYS_MS[0];

// ---------------------------------------------------------------------------
// Probe scheduling
// ---------------------------------------------------------------------------

export interface ProbeSchedule {
  /** Node id this probe is for. */
  nodeId: string;
  /** Timestamp (ms epoch) at which the probe becomes due. */
  dueAt: number;
  /**
   * Index into PROBE_DELAYS_MS for this probe. Increments after each completed
   * probe so subsequent probes are spaced further apart.
   */
  probeIndex: number;
}

/**
 * Schedule the next retention probe for a mastered node.
 *
 * @param nodeId   The skill node id.
 * @param now      Current timestamp (ms epoch) — injected by caller, never wall-clock.
 * @param probeIndex  Which probe in the schedule this is (0 = first, 1 = second, ...).
 *                    Defaults to 0 (first probe after mastery).
 */
export function scheduleRetentionProbe(
  nodeId: string,
  now: number,
  probeIndex = 0
): ProbeSchedule {
  const idx = Math.min(probeIndex, PROBE_DELAYS_MS.length - 1);
  const delay = PROBE_DELAYS_MS[idx] ?? DEFAULT_FIRST_PROBE_DELAY_MS;
  return {
    nodeId,
    dueAt: now + delay,
    probeIndex: idx,
  };
}

/**
 * Returns true when the probe is due (i.e., now >= probe.dueAt).
 *
 * @param probe  The ProbeSchedule to check.
 * @param now    Current timestamp (ms epoch) — injected by caller.
 */
export function isProbeDue(probe: ProbeSchedule, now: number): boolean {
  return now >= probe.dueAt;
}

// ---------------------------------------------------------------------------
// Applying a probe result
// ---------------------------------------------------------------------------

export interface ProbeResult {
  /** Whether the child answered the retention probe correctly. */
  correct: boolean;
  /** Timestamp of the probe attempt — injected by caller. */
  now: number;
}

/**
 * Apply a retention-probe result to a MasteryEstimate.
 *
 * Pass:   Record the probe timestamp; P_known and transfer_passed unchanged.
 * Fail:   Clear transfer_passed AND drop P_known below gateThreshold (0.95)
 *         by applying a BKT incorrect update — the node is re-opened for the
 *         next wall encounter.
 *
 * Returns a new MasteryEstimate (does not mutate the input).
 */
export function applyProbeResult(
  est: MasteryEstimate,
  result: ProbeResult
): MasteryEstimate {
  const updated: MasteryEstimate = {
    ...est,
    last_retention_probe: result.now,
  };

  if (!result.correct) {
    // Failed probe: clear transfer_passed and drop P_known below threshold.
    // We apply one BKT incorrect update to reflect the lapse.
    const demotedPKnown = bktUpdate(est.P_known, false);
    updated.P_known = demotedPKnown;
    updated.transfer_passed = false;
  }

  return updated;
}
