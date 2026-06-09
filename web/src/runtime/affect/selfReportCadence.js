// affect/selfReportCadence.js — UI8+UI9 (gap-build-260609): the shared,
// occasional cadence governor for the two self-report probes (OrientationProbe +
// AffectProbe).
//
// WHY THIS EXISTS:
//   OrientationProbe, AffectProbe, orientationReport.js, selfReport.js and
//   engineStore.recordCoherence are all complete but were never mounted. This is
//   the missing WIRING: one parent-owned cadence that decides WHEN to surface a
//   single self-report probe, so the two probes share one boundary and never
//   double-prompt.
//
// CADENCE RULE (R12 taste — a child must NEVER be made to reorient every turn):
//   • BOUNDARY-ONLY: an opportunity exists only at a problem boundary (a judged
//     engine decision), never mid-attempt. The caller advances `problemCount`
//     once per judged boundary; this module is pure and reads no clock.
//   • AT MOST ONCE EVERY N PROBLEMS (default N=5): a probe may fire only when at
//     least N boundaries have elapsed since the last one was surfaced.
//   • NEVER TWO TURNS IN A ROW: enforced by the N≥2 gap above (and explicitly, so
//     a misconfigured N=1 still can't fire back-to-back).
//   • ONE PROBE PER OPPORTUNITY: a single opportunity surfaces exactly one probe.
//     We ALTERNATE orientation ↔ affect across opportunities (orientation first),
//     so over time both channels are sampled without ever stacking two prompts.
//   • SKIPPABLE / NON-BLOCKING: this module only decides visibility; the probes
//     themselves are skippable and never gate. A skip still consumes the
//     opportunity (so we don't re-pester at the very next boundary).
//
// FIREWALL: this is advisory instrumentation. Its only downstream effects are the
// coherence counter-metric (recordCoherence) and the self-report Signal plumbing —
// NEVER the mastery gate.
//
// PURE: no React, no wall-clock. The React shell (ui/SelfReportProbes.jsx) owns
// the state; this module owns the policy.

export const SELF_REPORT_CADENCE = {
  /** Minimum problem boundaries between surfaced probes. */
  everyN: 5,
};

/** The two probe channels, in alternation order (orientation first). */
export const PROBE_KINDS = ['orientation', 'affect'];

/**
 * Fresh cadence state. `lastShownAt` = the problemCount at which the last probe
 * surfaced (null = none yet). `shownCount` drives the orientation↔affect
 * alternation.
 */
export function makeCadenceState() {
  return { lastShownAt: null, shownCount: 0 };
}

/**
 * May a probe surface at this boundary, and if so which one?
 *
 * @param {{lastShownAt:number|null, shownCount:number}} cadence
 * @param {number} problemCount — boundaries elapsed this session (monotone, advanced
 *                                once per judged decision; never mid-attempt).
 * @param {number} everyN       — min boundaries between probes (default 5).
 * @returns {{ show:boolean, kind:('orientation'|'affect'|null) }}
 */
export function decideProbe(cadence, problemCount, everyN = SELF_REPORT_CADENCE.everyN) {
  // Boundary-only: there is no opportunity before the first judged boundary.
  if (!Number.isFinite(problemCount) || problemCount <= 0) {
    return { show: false, kind: null };
  }

  // Never two turns in a row, regardless of how N is configured.
  const minGap = Math.max(2, everyN);

  if (cadence.lastShownAt === null) {
    // First-ever opportunity: wait until at least N boundaries have elapsed so we
    // never pounce on problem #1 (the child has barely arrived).
    if (problemCount < minGap) return { show: false, kind: null };
  } else if (problemCount - cadence.lastShownAt < minGap) {
    return { show: false, kind: null };
  }

  // One probe per opportunity, alternating orientation ↔ affect.
  const kind = PROBE_KINDS[cadence.shownCount % PROBE_KINDS.length];
  return { show: true, kind };
}

/**
 * Record that an opportunity was consumed (the probe surfaced, then was answered
 * OR skipped — either way we advance, so a skip doesn't re-pester next boundary).
 *
 * @returns new cadence state
 */
export function consumeOpportunity(cadence, problemCount) {
  return { lastShownAt: problemCount, shownCount: cadence.shownCount + 1 };
}
