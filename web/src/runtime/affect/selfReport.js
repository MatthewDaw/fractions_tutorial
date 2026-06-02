// affect/selfReport.js — Phase 3 (plan 005, S3): the self-report companion core.
//
// A consented tap ("tricky" / "easy-peasy") is a FIRST-CLASS signal AND the gold-
// standard label the inferred layer is graded against. This module is the pure
// corroboration logic (the React probe in ui/AffectProbe.jsx is the surface):
//   - evaluateSelfReport: corroborates the tap against recent behavior, DISCARDING
//     the actionable signal if behavior flatly contradicts it, but ALWAYS returning
//     the raw report as a gold label (a contradiction is itself data).
//   - applySelfReportToLedger: resolves pending affect hypotheses against the tap —
//     the ground-truth resolution of the precision ledger.
//
// PURE: no React, no wall-clock.

export const SELF_REPORT_PARAMS = {
  /** Last-N window of attempts examined for contradiction. */
  window: 3,
  /** "easy" is contradicted when ≥ this many of the window were wrong. */
  contradictWrongCount: 3,
  /** "tricky" is contradicted when ≥ this many of the window were clean hint-free corrects. */
  contradictCleanCount: 3,
};

function recentWindow(recentObservations, n) {
  const obs = recentObservations || [];
  return obs.slice(-n);
}

/**
 * Evaluate a self-report tap against recent behavior.
 *
 * @param {'tricky'|'easy'} choice
 * @param {Array<{correct:boolean, hint_max_rung?:number}>} recentObservations
 * @returns {{ choice:string, corroborated:boolean, signal:object|null,
 *             goldLabel:{report:string, corroborated:boolean, contradictedBy:string|null} }}
 */
export function evaluateSelfReport(choice, recentObservations, params = SELF_REPORT_PARAMS) {
  const win = recentWindow(recentObservations, params.window);
  const wrong = win.filter((o) => o.correct === false).length;
  const cleanCorrect = win.filter((o) => o.correct === true && (o.hint_max_rung || 0) === 0).length;

  let corroborated = true;
  let contradictedBy = null;

  if (choice === 'easy' && wrong >= params.contradictWrongCount) {
    corroborated = false;
    contradictedBy = 'recent_errors';
  } else if (choice === 'tricky' && cleanCorrect >= params.contradictCleanCount) {
    corroborated = false;
    contradictedBy = 'recent_clean_corrects';
  }

  const goldLabel = { report: choice, corroborated, contradictedBy };

  // The actionable Signal is discarded when behavior contradicts the report; the
  // gold label is kept either way.
  const signal = corroborated
    ? {
        type: 'self_report',
        confidence: 1, // consented, gold standard
        payload: { choice, corroborated: true },
        t: 0,
        actor: 'human',
      }
    : null;

  return { choice, corroborated, signal, goldLabel };
}

/**
 * Resolve pending affect hypotheses in the ledger against a self-report. A
 * "tricky" report CONFIRMS pending struggle hypotheses; "easy" CONTRADICTS them
 * (a false alarm). Already-resolved entries are left untouched.
 *
 * @returns a new ledger
 */
export function applySelfReportToLedger(ledger, choice) {
  const confirm = choice === 'tricky';
  return {
    ...ledger,
    entries: ledger.entries.map((e) =>
      e.behavior_confirmed === null && !e.observeOnly
        ? { ...e, behavior_confirmed: confirm }
        : e
    ),
  };
}
