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

  state = {
    ...state,
    decision: decision ?? state.decision,
    rationale,
    masteryMap: masteryMap ?? state.masteryMap,
    decisionLog: logEntry
      ? [...state.decisionLog, logEntry].slice(-50)
      : state.decisionLog,
    metrics: { ...state.metrics, uiChurn: state.metrics.uiChurn + (isChurn ? 1 : 0) },
  };
  notify();
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
    nudge: null,
  };
  notify();
}
