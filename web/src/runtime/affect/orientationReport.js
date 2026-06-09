// affect/orientationReport.js — UI3 (gap-build-260609): the orientation self-report core.
//
// The state-model "Success Criteria" asks: can the child state goal / next /
// why-changed? Nothing measured it. This is the lightweight, OCCASIONAL 1-tap
// orientation check — a sibling to selfReport.js. The child taps WHICH of 2–3
// options describes what they are working on (or why the screen changed); we grade
// the tap against the lesson's currently-expected orientation to produce a
// COHERENCE judgement and a first-class Signal.
//
// Mirrors selfReport.js exactly in shape:
//   - evaluateOrientationReport: pure grading of the tap vs the expected key,
//     emitting a Signal (consented, gold standard) and a coherence judgement.
//   - the React surface (ui/OrientationProbe.jsx) decides WHEN to show it; the
//     parent decides what to do with the report. This module is pure.
//
// FIREWALL (same as selfReport): this is advisory instrumentation. The Signal/
// coherence judgement feed a COUNTER-METRIC and the harness — never the mastery
// gate. Orientation is about whether the learner UNDERSTANDS the surface, not
// whether they have mastered the skill.
//
// PURE: no React, no wall-clock.

/**
 * Grade an orientation self-report tap against the lesson's expected answer.
 *
 * A tap whose `key` matches `expectedKey` is COHERENT (the child correctly named
 * the goal / why-changed); otherwise it is incoherent — itself useful data (the
 * surface moved faster than the child's understanding). A skip yields neither a
 * Signal nor a coherence judgement.
 *
 * @param {string|null} choiceKey   — the tapped option key (null/undefined = skip).
 * @param {string} expectedKey      — the orientation the lesson currently expects.
 * @returns {{
 *   choice: string|null,
 *   skipped: boolean,
 *   coherent: boolean|null,
 *   signal: object|null,
 *   goldLabel: { report: string|null, expected: string, coherent: boolean|null },
 * }}
 */
export function evaluateOrientationReport(choiceKey, expectedKey) {
  // A skip is never penalised and never blocks: no Signal, no coherence judgement.
  if (choiceKey === null || choiceKey === undefined) {
    return {
      choice: null,
      skipped: true,
      coherent: null,
      signal: null,
      goldLabel: { report: null, expected: expectedKey, coherent: null },
    };
  }

  const coherent = choiceKey === expectedKey;

  // The tap is a consented, first-class Signal (gold standard, like selfReport).
  // Unlike selfReport we keep the Signal even when incoherent — a wrong-orientation
  // tap is exactly the coherence datum we want to count, not a contradiction to
  // discard.
  const signal = {
    type: 'orientation_report',
    confidence: 1, // consented, gold standard
    payload: { choice: choiceKey, expected: expectedKey, coherent },
    t: 0,
    actor: 'human',
  };

  const goldLabel = { report: choiceKey, expected: expectedKey, coherent };

  return { choice: choiceKey, skipped: false, coherent, signal, goldLabel };
}
