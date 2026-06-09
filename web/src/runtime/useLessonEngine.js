// useLessonEngine.js — U9: Shared lesson runtime backbone (KTD5).
//
// One hook every lesson adopts to:
//   • emit the full event burst per attempt (R3)
//   • persist the log (R1)
//   • consult the engine ONLY at submit/entry BOUNDARIES (R16 — never mid-attempt)
//   • apply the returned Decision — driving in-lesson scaffold/transfer/route (R17)
//
// CRITICAL RULES:
//   - nextDecision is called ONLY inside judgeAndAdvance (the submit boundary).
//     It MUST NOT be called on any other trigger (e.g. state change, re-render, timer).
//   - The React layer is allowed to read Date.now() for timestamps — only the
//     engine module files are forbidden from wall-clock calls.
//   - Engine imports come from web/src/engine/ (index.ts + measurementReduce.ts +
//     policy.ts). The engine itself has no React imports and no wall-clock calls.
//
// USAGE:
//   const { emit, judgeAndAdvance, scaffoldLevel, decision, rationale, masteryFor }
//     = useLessonEngine({ nodeId, lessonConfig });
//
//   emit(eventFields)        — stamp t + actor + append to log
//   judgeAndAdvance(answer, meta) — emit burst, reduce, call nextDecision, return Decision
//   scaffoldLevel            — current design scaffold level (0..4)
//   decision                 — last returned Decision (or null on first load)
//   rationale                — last decision's rationale string
//   masteryFor(nodeId)       — current MasteryEstimate for a node

import { useState, useCallback, useRef } from 'react';
import {
  appendEvent,
  loadLog,
  saveLog,
  migrateFromKitchenProgress,
} from '../engine/index.js';
import { measurementReduce } from '../engine/measurementReduce.js';
import { nextDecision } from '../engine/policy.js';
import { isMastered } from '../engine/gate.js';
import { PARAMS } from '../engine/params.js';
import { toScaffoldLevel } from './scaffoldMap.js';
import { publishDecision, markTrigger, publishNudge } from './engineStore.js';
import {
  checkTooFastCorrect,
  checkOscillation,
  checkLongPause,
  makeTier2Window,
} from './tier2.js';
import { observeBehavior, countAttempts } from '../engine/observe/index.js';
import { segment } from '../engine/observation.js';

// U9/KTD7: the observe-layer Signal types that count as a disengagement signal
// for the frustration-scaffold writer. These are the behavioral "off-task / wall"
// signals the observe floor already emits (idle / abandoned work / no-work submit /
// own-baseline stall). A re-engaged attempt (a real worked attempt with none of
// these) RESETS the counter (mirrors how consecutiveErrors resets on a correct).
const DISENGAGEMENT_SIGNAL_TYPES = new Set([
  'idle',
  'orphaned_interaction',
  'rapid_submit',
  'latency_stall',
]);

/**
 * Decide whether the MOST RECENT attempt in the log shows a disengagement signal,
 * derived from the existing observe layer (engine/observe). Pure read over the log;
 * the engine module stays wall-clock-free (signals are derived from event.t only).
 *
 * Only ACTIONABLE signals count (the observe layer's cold-start control window is
 * honored — observeOnly signals are ignored), so the first few attempts of a
 * session never arm the scaffold spuriously.
 *
 * @param {Array} log — the full event log.
 * @returns {boolean} true when the latest attempt is disengaged.
 */
function _latestAttemptIsDisengaged(log) {
  let result;
  try {
    result = observeBehavior(log);
  } catch {
    return false;
  }
  const signals = result?.signals ?? [];
  // The LATEST attempt is the last completed span (NOT the last span that happened
  // to emit a signal) — so a re-engaged attempt that emits NO disengagement signal
  // correctly reads as "not disengaged" and RESETS the counter.
  const latestIdx = countAttempts(log) - 1;
  if (latestIdx < 0) return false;
  return signals.some(
    (s) =>
      s.attemptIndex === latestIdx &&
      !s.observeOnly &&
      DISENGAGEMENT_SIGNAL_TYPES.has(s.signal?.type)
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default policy state — in-lesson, no prior history. */
function buildInitialPolicyState(nodeId, scaffoldLevel, { inKitchen = false, stumpingRecipe = null } = {}) {
  return {
    currentNodeId: nodeId,
    currentScaffold: scaffoldLevel,
    stumpingRecipe,
    inKitchen,
    sessionMaxScaffoldPassed: null,
    consecutiveErrors: 0,
    consecutiveCleanCorrects: 0,
    pendingTransferProbe: false,
    pKnownHistory: [],
    heavyHintAtFloorCount: 0,
    disengagedCount: 0,
    // U9/KTD7: separate disengagement counter that drives the reachable
    // frustration scaffold, DECOUPLED from disengagedCount (escalation). The
    // disengagement writer (below) feeds THIS counter, never disengagedCount, so
    // arming the scaffold trigger does not spuriously fire EscalateToHuman.
    disengagedScaffoldCount: 0,
  };
}

/** Default (empty) recent-behavior object. */
const EMPTY_RECENT_BEHAVIOR = {
  observations: [],
  isDisengaged: false,
};

// T29: friendly learner-facing copy for each Tier-2 nudge type, mirroring
// useLessonScaffold.NUDGE_TEXT so the live toast shows the same gentle prompts.
const NUDGE_TEXT = {
  HINT_OFFER: 'Take a look at the picture — drag a piece to try it out.',
  TAKE_YOUR_TIME: "No rush — take your time and think it through.",
  TRANSFER_PROBE_QUEUED: "Nice and quick! Let's try one more to be sure.",
};

/**
 * T29: fire AT MOST ONE Tier-2 in-the-moment nudge for the just-completed attempt,
 * reusing tier2.js's existing detectors against the REAL segment()-derived recent
 * observation — the live counterpart of sessionRunner.fireTier2Nudge (no detector
 * duplication, no invented signal). Priority mirrors tier2.checkTier2:
 * long-pause > oscillation > too-fast. ADVISORY: the caller publishes the result to
 * the toast channel only; it never mutates PolicyState or the engine Decision.
 *
 * The idle/long-pause channel reads the observation's own latency as the idle time
 * (lastInteraction=0, now=obs.latency) so an idle attempt (latency ≥ PAUSE
 * threshold) fires HINT_OFFER — the same window the harness path flags.
 *
 * @param {Array} observations  the recent segment() Observations (most recent last).
 * @returns {{ type: string, payload: object } | null}
 */
function fireLiveTier2Nudge(observations) {
  const obs = observations.length > 0 ? observations[observations.length - 1] : null;
  if (!obs) return null;
  const window = makeTier2Window();
  const recent = { observations: [obs], isDisengaged: false };

  const hintRung = obs.hint_max_rung ?? 0;
  // 1. long pause → HINT_OFFER (idle time = the attempt's own latency).
  const pause = checkLongPause(0, obs.latency ?? 0, window, hintRung);
  if (pause) return pause;
  // 2. oscillation → TAKE_YOUR_TIME.
  const osc = checkOscillation(recent, window);
  if (osc) return osc;
  // 3. too-fast-correct → TRANSFER_PROBE_QUEUED.
  const fast = checkTooFastCorrect(obs, window);
  if (fast) return fast;
  return null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useLessonEngine — shared lesson runtime hook.
 *
 * @param {Object} params
 * @param {string} params.nodeId       — The engine skill-node id for this lesson
 *                                       (e.g. 'ADD_SAME_DEN', 'ADD_UNLIKE_NESTED').
 * @param {Object} [params.lessonConfig] — Optional lesson-level configuration.
 *   @param {string} [params.lessonConfig.lessonId]  — Room id ("r1"…"r5"), used for scaffoldMap.
 *   @param {string|number} [params.lessonConfig.initialBeat] — Starting beat/stage key.
 *   @param {string|null}   [params.lessonConfig.stumpingRecipe] — Recipe that triggered routing.
 *   @param {boolean}       [params.lessonConfig.inKitchen]      — Whether in MomsRoom context.
 *
 * @returns {{
 *   emit: (eventFields: object) => void,
 *   judgeAndAdvance: (answer: object, meta: object) => import('../engine/types.js').Decision,
 *   scaffoldLevel: number,
 *   decision: import('../engine/types.js').Decision | null,
 *   rationale: string,
 *   masteryFor: (nodeId: string) => import('../engine/types.js').MasteryEstimate | null,
 * }}
 */
export function useLessonEngine({ nodeId, lessonConfig = {} } = {}) {
  const {
    lessonId = null,
    initialBeat = null,
    stumpingRecipe = null,
    inKitchen = false,
  } = lessonConfig;

  // ---- Initial scaffold level (from lessonConfig or default L0) -----------
  const initialScaffold = (lessonId != null && initialBeat != null)
    ? toScaffoldLevel(lessonId, initialBeat)
    : 0;

  // ---- Persisted event log ------------------------------------------------
  // We initialize from localStorage + migration on first mount; thereafter we
  // use the in-memory ref for performance (and sync to storage on every write).
  const logRef = useRef(null);
  if (logRef.current === null) {
    const persisted = loadLog();
    if (persisted.length > 0) {
      logRef.current = persisted;
    } else {
      // First boot: try to migrate from the old binary progress store.
      logRef.current = [];
      // (seed priors from migration are applied in measurementReduce; the log
      //  itself starts empty — the migration only affects BKT priors, not events)
    }
  }

  // ---- React state ---------------------------------------------------------
  // scaffoldLevel: the current design scaffold level for this lesson.
  const [scaffoldLevel, setScaffoldLevel] = useState(initialScaffold);

  // decision: the last Decision returned by nextDecision, or null.
  const [decision, setDecision] = useState(null);

  // masteryCache: the last measurementReduce result, used by masteryFor().
  const [masteryCache, setMasteryCache] = useState(null);

  // ---- Policy state (mutable ref — not React state; drives nextDecision) --
  // We keep this in a ref so we can update it synchronously within
  // judgeAndAdvance without triggering extra renders.
  const policyStateRef = useRef(
    buildInitialPolicyState(nodeId, initialScaffold, { inKitchen, stumpingRecipe })
  );

  // Track the recent observations buffer for the policy's recentBehavior.
  const recentObsRef = useRef([]);

  // Track problem-present timestamp for latency calculation.
  const presentTimestampRef = useRef(null);

  // Tier-2 window: one per attempt; reset on each problem_present. Keeps nudges
  // idempotent (each fires at most once per attempt).
  const tier2WindowRef = useRef(makeTier2Window());

  // U2: synchronous certification result for the current node, computed at the
  // last submit boundary. A ref (not React state) so applyEngineDecision — which
  // runs synchronously right after judgeAndAdvance inside award() — reads the
  // FRESH value, not the stale masteryCache.
  const certifiedRef = useRef(false);

  // ---- emit ----------------------------------------------------------------
  /**
   * Stamp t (browser clock — allowed in the React layer) + actor:"human" onto
   * an event object, then append to the log and persist.
   *
   * @param {object} eventFields — Partial event fields (type, payload, modality, etc.)
   * @returns {object} The complete stamped event.
   */
  const emit = useCallback((eventFields) => {
    const stamped = {
      modality: 'tap',
      actor: 'human',
      ...eventFields,
      t: Date.now(),          // React layer MAY read system clock (only engine fold cannot)
    };

    // Special handling: track problem_present timestamp for latency.
    if (stamped.type === 'problem_present') {
      presentTimestampRef.current = stamped.t;
      // New attempt → fresh Tier-2 nudge window (pause/oscillation/too-fast all
      // re-arm so each can fire once for this problem).
      tier2WindowRef.current = makeTier2Window();
      // Keep the policy's scaffold in sync with the lesson's actual stage. The
      // lesson can change scaffold by means the engine didn't decide — a manual
      // stage-tab click, or its own advance-on-correct — and problem_present
      // carries that stage's design level. Without this the policy stays stuck at
      // the entry level (L0), so RaiseScaffold never becomes legal and rationales
      // misreport the level. (Measurement reads scaffold from present already; this
      // aligns the *policy* state too.)
      const lvl = stamped.payload?.scaffold_level;
      if (typeof lvl === 'number') {
        // NOTE on consecutiveErrors: it is intentionally NOT reset here on a
        // scaffold change. In these lessons the stages ARE the scaffold ladder,
        // and the engine's cross-stage signals (a clean-correct streak that fades
        // support, an error run that raises it) are meant to span stages. Resetting
        // the per-segment counters on every stage hop would defeat both. The
        // counters reset only on a correct answer (errors) / an error or
        // out-of-band correct (clean streak), in _updatePolicyState. So a
        // RaiseScaffold rationale reflects the running consecutive-error count
        // across the session — truthful, not a double-count (verified: one wrong
        // submit increments exactly once).
        policyStateRef.current.currentScaffold = lvl;
      }
    }

    logRef.current = appendEvent(logRef.current, stamped);
    saveLog(logRef.current);

    return stamped;
  }, []);

  // ---- judgeAndAdvance -----------------------------------------------------
  /**
   * Called at the answer-submit boundary (the ONLY place nextDecision is called).
   *
   * Emits the answer_submit + judged event burst with the rich metadata,
   * recomputes MasteryEstimate via measurementReduce, calls nextDecision once,
   * updates internal state, and returns the Decision for the lesson to apply.
   *
   * @param {object} answer
   *   @param {[number,number]|null} answer.value  — [numerator, denominator] or null
   *   @param {'tap'|'type'|'handwriting'|'voice'} [answer.modality]
   *   @param {number|null} [answer.recognizerConfidence] — from ink recognizer if handwriting
   *
   * @param {object} meta — Pre-judged metadata from the lesson's own judge call.
   *   @param {boolean} meta.correct            — Was the answer correct?
   *   @param {string|null} [meta.errorSignature] — Fingerprinted misconception code.
   *   @param {number} [meta.stars]             — Star tier (1–3) if correct.
   *   @param {number} [meta.hintMaxRung]       — Highest hint rung shown (0 = no hint).
   *   @param {number} [meta.selfCorrections]   — Count of place/remove oscillations.
   *   @param {string} [meta.surfaceForm]       — Surface-form key for transfer tracking.
   *   @param {number|null} [meta.nodeIdOverride] — Override the node id for this attempt.
   *
   * @returns {import('../engine/types.js').Decision} The engine's decision.
   */
  const judgeAndAdvance = useCallback((answer, meta) => {
    const now = Date.now();

    // UI2: mark the trigger (the judged boundary opens here, on submit) so the
    // store can measure time-to-UI-change once the decision surfaces below.
    // Advisory instrumentation only — does not affect the fold or the decision.
    markTrigger(now);

    const {
      value: answerValue = null,
      modality: answerModality = 'tap',
      recognizerConfidence = null,
    } = answer || {};

    const {
      correct = false,
      errorSignature = null,
      stars = 0,
      hintMaxRung = 0,
      selfCorrections = 0,
      surfaceForm = 'default',
      problemId = null,
      nodeIdOverride = null,
    } = meta || {};

    const effectiveNodeId = nodeIdOverride || nodeId;
    const currentScaffold = policyStateRef.current.currentScaffold;

    // Compute latency: ms from problem_present to now.
    const latency = (presentTimestampRef.current != null)
      ? Math.max(0, now - presentTimestampRef.current)
      : 5000; // default if no present event was emitted

    // Emit answer_submit event.
    const submitEvent = {
      type: 'answer_submit',
      payload: {
        node_id: effectiveNodeId,
        answer_value: answerValue,
        modality: answerModality,
        scaffold_level: currentScaffold,
        latency_ms: latency,
        hint_max_rung: hintMaxRung,
        self_corrections: selfCorrections,
        surface_form: surfaceForm,
        problem_id: problemId,
        recognizer_confidence: recognizerConfidence,
      },
      modality: answerModality,
      actor: 'human',
      t: now,
    };

    // Emit judged event (the segment boundary for measurementReduce).
    const judgedEvent = {
      type: 'judged',
      payload: {
        node_id: effectiveNodeId,
        correct,
        error_signature: errorSignature,
        stars,
        answer_value: answerValue,
        scaffold_level: currentScaffold,
        latency_ms: latency,
        hint_max_rung: hintMaxRung,
        self_corrections: selfCorrections,
        modality: answerModality,
        recognizer_confidence: recognizerConfidence,
        surface_form: surfaceForm,
        problem_id: problemId,
        too_fast_correct: _isTooFastCorrect(correct, latency),
        affect_window: [],
      },
      modality: answerModality,
      actor: 'human',
      t: now,
    };

    // Append both events to the log.
    let log = logRef.current;
    log = appendEvent(log, submitEvent);
    log = appendEvent(log, judgedEvent);
    logRef.current = log;
    saveLog(log);

    // Reset present timestamp (closed the attempt).
    presentTimestampRef.current = null;

    // Recompute MasteryEstimate via measurementReduce (pure fold over the log).
    const seedPriors = migrateFromKitchenProgress();
    const reduceResult = measurementReduce(log, now, seedPriors);
    setMasteryCache(reduceResult.mastery);

    // Update policy state with the results of this attempt.
    _updatePolicyState(policyStateRef.current, {
      correct,
      hintMaxRung,
      latency,
      currentScaffold,
    });

    // ---- U9/KTD7: disengagement writer (the missing input edge) -------------
    // Derive a disengagement signal from the observe layer (idle / abandoned
    // work / no-work submit / own-baseline stall) and maintain the SEPARATE
    // disengagedScaffoldCount, mirroring how consecutiveErrors is maintained:
    // increment on the signal, reset on a re-engaged attempt. This feeds the
    // frustration-scaffold trigger (decoupled threshold), NOT disengagedCount —
    // so wiring this never spuriously arms EscalateToHuman. The counter is live
    // regardless of the flag; only the policy RESPONSE is gated behind
    // PARAMS.frustrationScaffold (default off → reversible no-op).
    if (_latestAttemptIsDisengaged(log)) {
      policyStateRef.current.disengagedScaffoldCount += 1;
    } else {
      policyStateRef.current.disengagedScaffoldCount = 0;
    }

    // ---- Tier-2: too-fast-correct → queue a TransferProbe (false-positive guard).
    // A correct answer below the plausible-compute floor is the brief's
    // "guessing / pattern-matching / UI did the reasoning" risk. tier2 flags it;
    // we set pendingTransferProbe so nextDecision (step 5) responds with a probe
    // instead of fading support on what may be a fluke. Runs AFTER
    // _updatePolicyState (which clears the flag on any correct) so it wins.
    const tooFast = _isTooFastCorrect(correct, latency);
    const tooFastNudge = checkTooFastCorrect(
      { too_fast_correct: tooFast },
      tier2WindowRef.current
    );
    if (tooFastNudge) {
      policyStateRef.current.pendingTransferProbe = true;
    }

    // Update pKnownHistory with the actual reduced P_known value for this node.
    const nodeEst = reduceResult.mastery[effectiveNodeId];
    if (nodeEst) {
      const hist = policyStateRef.current.pKnownHistory;
      const trimmed = hist.length >= 12 ? hist.slice(1) : hist;
      policyStateRef.current.pKnownHistory = [...trimmed, nodeEst.P_known];
    }

    // U2: certification = the full mastery gate on the freshly-reduced estimate.
    // Reuses the SAME fold already computed for nextDecision (no extra reduce, no
    // extra nextDecision call — the R16 boundary-once rule is untouched).
    // isMastered defaults fluencyHardMode from PARAMS (U1).
    certifiedRef.current = !!(nodeEst && isMastered(nodeEst));

    // ---- T29: populate the recentObsRef buffer (the missing input edge) ------
    // FINDING (T26 report + limitations-memo): recentObsRef was allocated but
    // NEVER appended, so the live recentBehavior.observations channel was always
    // empty and the policy's Tier-2 window read nothing — the nudge never fired in
    // the browser even though T26 proved it fires on the harness sessionRunner
    // path. Here we populate the buffer from the SAME segment()-derived
    // Observations the engine already computes from THIS log (no duplicated
    // detectors, no invented signals) — exactly how sessionRunner builds
    // `segment(log).slice(-10)`. Gated behind PARAMS.tier2NudgeLive (default off)
    // so the channel stays byte-identical (empty) when the flag is off; the policy
    // reads these observations only on default-off paths, so the banked Decision
    // is unchanged regardless. Mirrors the T03 disengaged-writer pattern: the
    // input edge is wired in the runtime layer, the engine stays pure.
    if (PARAMS.tier2NudgeLive) {
      recentObsRef.current = segment(log);
    }

    // Build recent behavior buffer.
    // (We keep the last 10 observations for the current node.)
    // The reduce result segmented from the full log contains all observations,
    // but we only pass recent ones to the policy for the recentBehavior param.
    const recentBehavior = {
      observations: recentObsRef.current.slice(-10),
      isDisengaged: policyStateRef.current.disengagedCount >= 3,
    };

    // ---- BOUNDARY: call nextDecision EXACTLY ONCE here --------------------
    const dec = nextDecision(
      policyStateRef.current,
      reduceResult.mastery,
      recentBehavior,
      now
    );
    // ---- End of boundary --------------------------------------------------

    // Apply the decision to React state.
    setDecision(dec);

    // Publish to the global store so the always-mounted RationaleBanner shows
    // the "why", and the MasteryInspector sees the live map + decision log +
    // counter-metrics — without threading props through every lesson (KTD8, R18).
    // UI2: surface with a freshly-read clock so time-to-UI-change captures the
    // (synchronous) fold cost from the trigger marked at the top of this fn.
    publishDecision(dec, reduceResult.mastery, Date.now());

    // ---- T29: surface the live Tier-2 in-the-moment nudge --------------------
    // Now that recentBehavior.observations is real, run tier2.js's detectors
    // against the latest observation and publish the (at-most-one) nudge to the
    // advisory toast channel — the live counterpart of the harness recording a
    // nudge per step. ADVISORY-ONLY: this is published to the toast store, never
    // fed back into PolicyState or the engine Decision (the advisory/affect
    // firewall). Gated behind the SAME default-off flag so prior behavior (no
    // live nudge published) is byte-identical when off.
    if (PARAMS.tier2NudgeLive) {
      const liveNudge = fireLiveTier2Nudge(recentBehavior.observations);
      if (liveNudge) {
        publishNudge(
          { type: liveNudge.type, text: NUDGE_TEXT[liveNudge.type] ?? '' },
          Date.now()
        );
      }
    }

    // Update scaffoldLevel if the decision changes it.
    if (dec.kind === 'FadeScaffold') {
      const next = Math.min(4, currentScaffold + 1);
      policyStateRef.current.currentScaffold = next;
      setScaffoldLevel(next);
    } else if (dec.kind === 'RaiseScaffold') {
      const next = Math.max(0, currentScaffold - 1);
      policyStateRef.current.currentScaffold = next;
      setScaffoldLevel(next);
    }

    return dec;
  }, [nodeId]);

  // ---- masteryFor ----------------------------------------------------------
  /**
   * Read the current MasteryEstimate for any node id.
   * Returns null if no estimate is available yet (pre-first-submit).
   *
   * @param {string} targetNodeId
   * @returns {import('../engine/types.js').MasteryEstimate | null}
   */
  const masteryFor = useCallback((targetNodeId) => {
    if (!masteryCache) return null;
    return masteryCache[targetNodeId] ?? null;
  }, [masteryCache]);

  // ---- Return surface ------------------------------------------------------
  return {
    emit,
    judgeAndAdvance,
    scaffoldLevel,
    decision,
    rationale: decision?.rationale ?? '',
    masteryFor,
    // U2: synchronous getter for the latest certification result (ref-backed so
    // it reflects the value computed at the last submit boundary).
    isCertified: useCallback(() => certifiedRef.current, []),
  };
}

// ---------------------------------------------------------------------------
// Internal helpers (not exported)
// ---------------------------------------------------------------------------

/**
 * Update the mutable policy state based on the outcome of one attempt.
 * This is NOT a pure function — it mutates policyState in place, which is
 * intentional: the policy state is a mutable ref that accumulates across
 * multiple attempts.
 */
function _updatePolicyState(policyState, { correct, hintMaxRung, latency, currentScaffold }) {
  const hintFree = hintMaxRung === 0;
  const inBandLatency = latency >= PARAMS.latencyFloorMs && latency <= 30000;

  if (correct) {
    policyState.consecutiveErrors = 0;
    if (hintFree && inBandLatency) {
      policyState.consecutiveCleanCorrects += 1;
      // Track the highest scaffold at which the child passed hint-free.
      if (
        policyState.sessionMaxScaffoldPassed === null ||
        currentScaffold > policyState.sessionMaxScaffoldPassed
      ) {
        policyState.sessionMaxScaffoldPassed = currentScaffold;
      }
    } else {
      // Hinted or out-of-band correct — reset clean streak but don't penalize.
      policyState.consecutiveCleanCorrects = 0;
    }
    policyState.pendingTransferProbe = false;
  } else {
    policyState.consecutiveErrors += 1;
    policyState.consecutiveCleanCorrects = 0;
  }

  // Track heavy hints at floor scaffold for stuck-escalation.
  if (currentScaffold === 0 && hintMaxRung >= 3) {
    policyState.heavyHintAtFloorCount += 1;
  }

  // Note: pKnownHistory is updated with the actual measurementReduce value in
  // judgeAndAdvance after the fold completes, not here.
}

/**
 * Flag a correct answer that came in suspiciously fast (below plausible-compute
 * latency floor PARAMS.latencyFloorMs). This is a false-positive guard that triggers a
 * transfer probe at the next boundary. Unified onto PARAMS.latencyFloorMs (U1) so
 * too-fast detection, transfer in-band, and clean-correct in-band share one constant —
 * no [800,1200) dead zone where a correct counts toward neither.
 */
function _isTooFastCorrect(correct, latency) {
  return correct && latency < PARAMS.latencyFloorMs;
}
