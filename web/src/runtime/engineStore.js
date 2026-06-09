// engineStore.js — the single live channel between the (per-lesson) engine
// runtime and the global, always-mounted model surfaces (RationaleBanner +
// MasteryInspector + Tier-2 nudge toast).
//
// WHY A STORE (and not props):
//   The Decision/MasteryEstimate live inside whichever lesson's useLessonEngine
//   instance is currently mounted. The surfaces that must show them — "why did
//   this change?" and the counter-metrics inspector — live in Shell, ABOVE the
//   lessons. Threading a callback down through every lesson + LessonShell +
//   LessonUnlikeDen + MomsRoom would be N edits and easy to get wrong. A tiny
//   observable singleton lets useLessonEngine PUBLISH once and Shell SUBSCRIBE
//   once — every lesson is covered for free, including the partial adopters.
//
// PURITY: this file is in runtime/ (the React layer), so reading Date.now() is
// allowed here. The engine/ fold stays wall-clock-free; callers pass `t` in.
//
// Consumed via useEngineStore() (useSyncExternalStore) below.

// UI2: the decision kinds that visibly CHANGE the interface (and so surface a
// RationaleBanner / move the scaffold). Mirrors EngineSurfaces' CHANGE_KINDS —
// kept here so the store can tally the UI-responsiveness counter-metrics at the
// judged boundary without importing a UI file.
const CHANGE_KINDS = new Set([
  'FadeScaffold',
  'RaiseScaffold',
  'TransferProbe',
  'RouteToRoom',
  'ReturnToKitchen',
  'EscalateToHuman',
]);

// UI2: an empty UI-responsiveness metrics record (the PDF's "interface" counter-
// metrics, vs. the LEARNING counter-metrics in metrics.*). Factored out so
// resetEngineStore and the initial state can't drift apart.
function emptyUiMetrics() {
  return {
    // Sum of (surfacing − trigger) ms across CHANGE_KIND decisions, plus a count,
    // so the inspector can show the MEAN time-to-UI-change. avgMs derived below.
    timeToChangeTotalMs: 0,
    timeToChangeCount: 0,
    // "Understood why" proxy: of the CHANGE_KIND banners shown, how many the
    // learner acknowledged/dismissed (acked) vs. let scroll past (shown − acked).
    changeBannersShown: 0,
    changeBannersAcked: 0,
    // Stability/churn rate inputs: UI-changes (CHANGE_KIND decisions) per problem
    // judged. rate = uiChanges / problemsJudged (a problem = one publishDecision
    // carrying a decision). Catches "the UI changed too often".
    uiChanges: 0,
    problemsJudged: 0,
  };
}

let state = {
  // The most recent engine Decision (or null before the first submit).
  decision: null,
  // Its rationale string (KTD8) — what the banner shows. '' = banner hidden.
  rationale: '',
  // The latest live MasteryEstimate map from measurementReduce (or null).
  masteryMap: null,
  // Append-only, capped log of decisions this session: {kind, rationale, t}.
  decisionLog: [],
  // Counter-metrics surfaced in the inspector (the brief's anti-shallow guards).
  metrics: { uiChurn: 0 },
  // UI2: UI-responsiveness counter-metrics (instrumentation only — advisory,
  // never feeds adaptation). Raw tallies; the inspector derives rates from them.
  uiMetrics: emptyUiMetrics(),
  // UI2: timestamp of the open judged boundary (the "trigger"), set by
  // markTrigger and consumed by the next publishDecision. null = no open trigger.
  pendingTriggerT: null,
  // A transient Tier-2 nudge ({ type, text, t }) or null. Cleared after display.
  nudge: null,
};

const listeners = new Set();

function notify() {
  for (const fn of listeners) fn();
}

/** Subscribe to store changes. Returns an unsubscribe function. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Read the current immutable snapshot (stable identity until a publish). */
export function getSnapshot() {
  return state;
}

/**
 * UI2: mark the trigger (the judged boundary opening) so the NEXT publishDecision
 * can compute time-to-UI-change = surfacing_t − trigger_t. Called by the React
 * runtime right before it runs the engine fold. No-op-safe if called twice; the
 * most recent trigger wins. Purely advisory instrumentation.
 *
 * @param {number} t — caller-supplied trigger timestamp (React layer reads clock)
 */
export function markTrigger(t = 0) {
  state = { ...state, pendingTriggerT: t };
  notify();
}

/**
 * Publish a Decision + the mastery map that produced it. Called by
 * useLessonEngine at the JUDGED boundary (the only place nextDecision runs).
 *
 * @param {object|null} decision     — the engine Decision (has .kind, .rationale)
 * @param {object|null} masteryMap   — Record<nodeId, MasteryEstimate>
 * @param {number}      t            — caller-supplied timestamp (React layer)
 */
export function publishDecision(decision, masteryMap, t = 0) {
  const rationale = decision?.rationale ?? state.rationale;

  // UI churn (state-model §Success counter-metric): a scaffold-level change is a
  // "T3" structural change. Count them so the inspector can show whether the UI
  // churned too often.
  const isChurn =
    decision?.kind === 'FadeScaffold' || decision?.kind === 'RaiseScaffold';

  const logEntry = decision
    ? { kind: decision.kind, rationale: decision.rationale ?? '', t }
    : null;

  // ---- UI2: UI-responsiveness instrumentation (advisory, never adaptive) -----
  const isChange = !!decision && CHANGE_KINDS.has(decision.kind);
  const um = state.uiMetrics;
  // time-to-UI-change: only when this is a change AND a trigger is open. A
  // non-negative delta only (a clock that went backwards is dropped, not negative-
  // counted). Consume the trigger so a later routine publish can't reuse it.
  const haveTrigger = state.pendingTriggerT !== null;
  const delta = haveTrigger ? t - state.pendingTriggerT : null;
  const recordTime = isChange && delta !== null && delta >= 0;
  const nextUiMetrics = {
    ...um,
    timeToChangeTotalMs: um.timeToChangeTotalMs + (recordTime ? delta : 0),
    timeToChangeCount: um.timeToChangeCount + (recordTime ? 1 : 0),
    // Each CHANGE_KIND decision surfaces a banner the learner can ack/dismiss.
    changeBannersShown: um.changeBannersShown + (isChange ? 1 : 0),
    uiChanges: um.uiChanges + (isChange ? 1 : 0),
    // A "problem judged" = any publish that carries a decision.
    problemsJudged: um.problemsJudged + (decision ? 1 : 0),
  };

  state = {
    ...state,
    decision: decision ?? state.decision,
    rationale,
    masteryMap: masteryMap ?? state.masteryMap,
    decisionLog: logEntry
      ? [...state.decisionLog, logEntry].slice(-50)
      : state.decisionLog,
    metrics: { ...state.metrics, uiChurn: state.metrics.uiChurn + (isChurn ? 1 : 0) },
    uiMetrics: nextUiMetrics,
    // Trigger is consumed once a decision surfaces (whether or not we timed it).
    pendingTriggerT: decision ? null : state.pendingTriggerT,
  };
  notify();
}

/**
 * UI2: record that the learner acknowledged/dismissed the change-rationale banner
 * (the "understood why" proxy). Called by the RationaleBanner on dismiss. Only
 * counts up to the number of change-banners actually shown (so the ack-rate is
 * bounded at 1.0). Advisory instrumentation; does not touch adaptation.
 */
export function acknowledgeRationale() {
  const um = state.uiMetrics;
  if (um.changeBannersAcked >= um.changeBannersShown) return;
  state = {
    ...state,
    uiMetrics: { ...um, changeBannersAcked: um.changeBannersAcked + 1 },
  };
  notify();
}

/**
 * UI2: derive the reportable UI-responsiveness metrics from the raw tallies.
 *   • avgTimeToChangeMs — mean ms from trigger to a UI-change surfacing (null if none)
 *   • ackRate           — fraction of change-banners acknowledged (null if none shown)
 *   • churnRate         — UI-changes per problem judged (null if none judged)
 * Pure read; safe to call from render.
 *
 * @param {typeof state.uiMetrics} [um]
 */
export function deriveUiMetrics(um = state.uiMetrics) {
  return {
    avgTimeToChangeMs:
      um.timeToChangeCount > 0 ? um.timeToChangeTotalMs / um.timeToChangeCount : null,
    ackRate:
      um.changeBannersShown > 0 ? um.changeBannersAcked / um.changeBannersShown : null,
    churnRate: um.problemsJudged > 0 ? um.uiChanges / um.problemsJudged : null,
    // pass raw tallies through for the inspector's secondary line.
    uiChanges: um.uiChanges,
    problemsJudged: um.problemsJudged,
    changeBannersShown: um.changeBannersShown,
    changeBannersAcked: um.changeBannersAcked,
  };
}

/**
 * Publish a transient Tier-2 nudge for the toast surface.
 *
 * @param {{ type: string, text: string }|null} nudge
 * @param {number} t
 */
export function publishNudge(nudge, t = 0) {
  state = { ...state, nudge: nudge ? { ...nudge, t } : null };
  notify();
}

/** Clear the current nudge (called by the toast after it auto-dismisses). */
export function clearNudge() {
  if (state.nudge === null) return;
  state = { ...state, nudge: null };
  notify();
}

/** Reset the whole store. Test-only / new-session helper. */
export function resetEngineStore() {
  state = {
    decision: null,
    rationale: '',
    masteryMap: null,
    decisionLog: [],
    metrics: { uiChurn: 0 },
    uiMetrics: emptyUiMetrics(),
    pendingTriggerT: null,
    nudge: null,
  };
  notify();
}
