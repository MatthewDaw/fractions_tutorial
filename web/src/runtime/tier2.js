// tier2.js — U12: Tier-2 nudges (state-model §6/§7).
//
// TIER-2 RULES:
//   T2 nudges are:
//     - Deterministic and nudge-only (never restructure the workspace).
//     - Boundary-safe (they NEVER emit mid-attempt; TransferProbe queues for
//       the next boundary — useLessonEngine's judgeAndAdvance picks it up).
//     - Idempotent: each trigger fires AT MOST ONCE per activation window
//       (the caller is responsible for resetting the window).
//
// THREE NUDGES (plan U12 / state-model §6):
//   1. LONG_PAUSE → offer the next hint rung (T2 within-attempt support).
//      Fires when idle time since problem_present (or last interaction) exceeds
//      PAUSE_THRESHOLD_MS.  The idle time is computed from injected event
//      timestamps — no wall-clock inside this module.
//
//   2. OSCILLATION → gentle "take your time" prompt (fires ONCE per attempt,
//      not per wiggle).  Fires when place/remove oscillation count in the
//      recent behavior buffer exceeds OSCILLATION_THRESHOLD.
//
//   3. TOO_FAST_CORRECT → queue a TransferProbe at the NEXT boundary.
//      Fires when the most recent observation has too_fast_correct === true.
//      This module sets a flag; the caller checks it at the next boundary and
//      sets pendingTransferProbe on the policy state.
//
// ENGINE PURITY:
//   This module does NOT import from the engine (no engine/ imports) and has
//   NO React imports.  It is a pure JS module: pure function interface.
//
// USAGE:
//   import { checkTier2 } from './tier2.js';
//
//   const nudge = checkTier2(recentBehavior, lastPresentT, nowT, windowState);
//   // nudge: { type, payload } | null
//   // windowState is mutated to prevent re-firing within the same window.
//
// TYPES (JSDoc only — no TS in runtime/):
//
//   RecentBehavior = {
//     observations: Observation[],   // last N observations (most recent last)
//     isDisengaged:  boolean,
//   }
//
//   Tier2Nudge = {
//     type: 'HINT_OFFER' | 'TAKE_YOUR_TIME' | 'TRANSFER_PROBE_QUEUED',
//     payload: object,
//   }
//
//   Tier2WindowState = {
//     pauseFired:      boolean,   // reset on each new problem_present
//     oscillationFired: boolean,  // reset on each new problem_present
//     transferQueued:   boolean,  // cleared when the probe fires at the boundary
//   }

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Idle time (ms) before a hint-rung offer fires. */
const PAUSE_THRESHOLD_MS = 8_000;

/** Oscillation count (place+remove cycles) above which a "take your time" fires. */
const OSCILLATION_THRESHOLD = 3;

// ---------------------------------------------------------------------------
// Exported helpers
// ---------------------------------------------------------------------------

/**
 * Build a fresh Tier-2 window-state object (one per problem attempt).
 *
 * Call this at the start of each new problem_present event.
 */
export function makeTier2Window() {
  return {
    pauseFired: false,
    oscillationFired: false,
    transferQueued: false,
  };
}

/**
 * Check for Tier-2 nudge conditions and return the first applicable nudge,
 * or null if no nudge should fire.
 *
 * Rules:
 *   1. Long pause → HINT_OFFER (fires at most once per window; window resets on
 *      new problem_present).
 *   2. Oscillation → TAKE_YOUR_TIME (fires at most once per window).
 *   3. too_fast_correct → TRANSFER_PROBE_QUEUED (fires at the NEXT boundary,
 *      not mid-attempt; this just marks the flag).
 *
 * Priority: 1 > 2 > 3 (nudges are exclusive per call; call again to get the
 * next one if needed — but in practice only one fires per event).
 *
 * @param {object} recentBehavior
 *   @param {Array} recentBehavior.observations  — recent observations (most recent last)
 *   @param {boolean} recentBehavior.isDisengaged
 *
 * @param {number}  lastInteractionT  — timestamp (ms) of the last interaction event
 *                                      (problem_present or place/remove/hint).
 *                                      Pass -1 if no interaction has occurred yet.
 * @param {number}  nowT              — current timestamp (ms), injected by caller.
 *                                      NEVER read Date.now() here.
 * @param {object}  windowState       — Mutable Tier2WindowState (from makeTier2Window).
 *                                      This function mutates it to prevent re-firing.
 *
 * @returns {{ type: string, payload: object } | null}
 */
export function checkTier2(recentBehavior, lastInteractionT, nowT, windowState) {
  if (!windowState) return null;

  const lastObs = recentBehavior?.observations?.length > 0
    ? recentBehavior.observations[recentBehavior.observations.length - 1]
    : null;

  // ---- 1. Long pause → HINT_OFFER ----------------------------------------
  if (
    !windowState.pauseFired &&
    lastInteractionT >= 0 &&
    nowT - lastInteractionT >= PAUSE_THRESHOLD_MS
  ) {
    windowState.pauseFired = true;
    // Recommend the next hint rung (the caller's current hint rung + 1, or 1).
    const currentHintRung = lastObs?.hint_max_rung ?? 0;
    return {
      type: 'HINT_OFFER',
      payload: {
        suggestedRung: currentHintRung + 1,
        idleMs: nowT - lastInteractionT,
      },
    };
  }

  // ---- 2. Oscillation → TAKE_YOUR_TIME -----------------------------------
  if (!windowState.oscillationFired) {
    const selfCorrections = lastObs?.self_corrections ?? 0;
    if (selfCorrections >= OSCILLATION_THRESHOLD) {
      windowState.oscillationFired = true;
      return {
        type: 'TAKE_YOUR_TIME',
        payload: {
          oscillations: selfCorrections,
        },
      };
    }
  }

  // ---- 3. too_fast_correct → queue TransferProbe at next boundary --------
  if (!windowState.transferQueued && lastObs?.too_fast_correct === true) {
    windowState.transferQueued = true;
    // This does NOT fire a probe immediately — it is a flag for the next boundary.
    // The caller is responsible for setting pendingTransferProbe on the policy state.
    return {
      type: 'TRANSFER_PROBE_QUEUED',
      payload: {
        message: 'Answer came in very fast — a transfer probe will be queued at the next boundary.',
      },
    };
  }

  return null;
}

/**
 * Check ONLY the oscillation trigger (without touching pauseFired/transferQueued).
 * Useful when the caller wants to check oscillation independently.
 *
 * @param {object} recentBehavior
 * @param {object} windowState
 * @returns {{ type: 'TAKE_YOUR_TIME', payload: object } | null}
 */
export function checkOscillation(recentBehavior, windowState) {
  if (!windowState || windowState.oscillationFired) return null;

  const lastObs = recentBehavior?.observations?.length > 0
    ? recentBehavior.observations[recentBehavior.observations.length - 1]
    : null;

  const selfCorrections = lastObs?.self_corrections ?? 0;
  if (selfCorrections >= OSCILLATION_THRESHOLD) {
    windowState.oscillationFired = true;
    return {
      type: 'TAKE_YOUR_TIME',
      payload: { oscillations: selfCorrections },
    };
  }
  return null;
}

/**
 * Check ONLY the long-pause trigger.
 *
 * @param {number} lastInteractionT
 * @param {number} nowT
 * @param {object} windowState
 * @param {number} [currentHintRung=0]
 * @returns {{ type: 'HINT_OFFER', payload: object } | null}
 */
export function checkLongPause(lastInteractionT, nowT, windowState, currentHintRung = 0) {
  if (!windowState || windowState.pauseFired) return null;
  if (lastInteractionT < 0) return null;

  const idleMs = nowT - lastInteractionT;
  if (idleMs >= PAUSE_THRESHOLD_MS) {
    windowState.pauseFired = true;
    return {
      type: 'HINT_OFFER',
      payload: {
        suggestedRung: currentHintRung + 1,
        idleMs,
      },
    };
  }
  return null;
}

/**
 * Check ONLY the too_fast_correct transfer-probe queuing.
 *
 * @param {object} lastObs — the most recent Observation
 * @param {object} windowState
 * @returns {{ type: 'TRANSFER_PROBE_QUEUED', payload: object } | null}
 */
export function checkTooFastCorrect(lastObs, windowState) {
  if (!windowState || windowState.transferQueued) return null;
  if (lastObs?.too_fast_correct === true) {
    windowState.transferQueued = true;
    return {
      type: 'TRANSFER_PROBE_QUEUED',
      payload: {
        message: 'Answer came in very fast — a transfer probe will be queued at the next boundary.',
      },
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Re-exports for test assertions
// ---------------------------------------------------------------------------

export { PAUSE_THRESHOLD_MS, OSCILLATION_THRESHOLD };
