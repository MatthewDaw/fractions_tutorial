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
import { publishDecision } from './engineStore.js';
import { checkTooFastCorrect, makeTier2Window } from './tier2.js';

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
  };
}

/** Default (empty) recent-behavior object. */
const EMPTY_RECENT_BEHAVIOR = {
  observations: [],
  isDisengaged: false,
};

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
    publishDecision(dec, reduceResult.mastery, now);

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
