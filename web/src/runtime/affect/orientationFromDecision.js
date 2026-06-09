// affect/orientationFromDecision.js — UI8 (gap-build-260609): derive the
// OrientationProbe's expected goal/why from the current engine decision.
//
// The probe asks the child to name WHAT they are working on / WHY the screen
// changed. The "right answer" (expectedKey) must come from the engine's own
// current decision so the coherence grade is meaningful. This is a pure mapping
// from a Decision (kind + rationale) to a reader-safe, 2–3 option orientation
// question.
//
// Two question shapes, chosen by decision kind:
//   • A CHANGE_KIND decision (the surface actually moved) → "Why did this change?"
//     The expected option restates the engine's reason in child language.
//   • Anything else (routine PresentProblem / first render) → "What are you working
//     on right now?" The expected option is the steady "keep practising" goal.
//
// FIREWALL: pure derivation only. The graded tap feeds the coherence counter-metric
// (recordCoherence), never the gate.
//
// PURE: no React, no clock.

// Mirrors engineStore/EngineSurfaces CHANGE_KINDS — the decisions that visibly move
// the interface and so warrant a "why did this change?" orientation check.
const CHANGE_KINDS = new Set([
  'FadeScaffold',
  'RaiseScaffold',
  'TransferProbe',
  'RouteToRoom',
  'ReturnToKitchen',
  'EscalateToHuman',
]);

// Per-kind "why did this change?" copy. expectedKey is the option that correctly
// names the engine's reason; the distractors are plausible-but-wrong so a tap is
// informative. All labels are reader-safe and in child language.
const WHY_BY_KIND = {
  FadeScaffold: {
    expectedKey: 'doing_well',
    options: [
      { key: 'doing_well', label: "I'm doing great, so I get fewer hints" },
      { key: 'made_mistakes', label: 'I kept making mistakes' },
      { key: 'new_topic', label: 'We started a brand-new thing' },
    ],
  },
  RaiseScaffold: {
    expectedKey: 'need_help',
    options: [
      { key: 'need_help', label: 'This part is tricky, so I get more help' },
      { key: 'doing_well', label: "I'm doing great, so it's getting harder" },
      { key: 'almost_done', label: "We're almost finished" },
    ],
  },
  TransferProbe: {
    expectedKey: 'try_new',
    options: [
      { key: 'try_new', label: 'I get to try it a new way' },
      { key: 'made_mistakes', label: 'I kept making mistakes' },
      { key: 'going_home', label: "We're going back to the kitchen" },
    ],
  },
  RouteToRoom: {
    expectedKey: 'build_up',
    options: [
      { key: 'build_up', label: 'I need to practise something else first' },
      { key: 'doing_well', label: "I'm doing great, so I get a reward" },
      { key: 'almost_done', label: "We're almost finished" },
    ],
  },
  ReturnToKitchen: {
    expectedKey: 'go_kitchen',
    options: [
      { key: 'go_kitchen', label: "I'm ready, so we go back to cook" },
      { key: 'need_help', label: 'This part is too tricky' },
      { key: 'new_topic', label: 'We started a brand-new thing' },
    ],
  },
  EscalateToHuman: {
    expectedKey: 'get_grownup',
    options: [
      { key: 'get_grownup', label: "Let's get a grown-up to help" },
      { key: 'doing_well', label: "I'm doing great" },
      { key: 'try_new', label: 'I get to try it a new way' },
    ],
  },
};

// The steady "what am I working on?" question for routine problems. Generic but
// honest: the child is practising this recipe.
const STEADY = {
  prompt: 'What are you working on right now?',
  expectedKey: 'practise',
  options: [
    { key: 'practise', label: 'Practising this kind of problem' },
    { key: 'new_game', label: 'Playing a brand-new game' },
    { key: 'finished', label: "All done — we're finished" },
  ],
};

/**
 * Build the OrientationProbe inputs for a given engine decision.
 *
 * @param {{kind?:string}|null} decision — the live engine Decision (or null).
 * @returns {{ prompt:string, options:Array<{key,label}>, expectedKey:string }}
 */
export function orientationFromDecision(decision) {
  const kind = decision?.kind;
  if (kind && CHANGE_KINDS.has(kind) && WHY_BY_KIND[kind]) {
    return {
      prompt: 'Why did the screen just change?',
      options: WHY_BY_KIND[kind].options,
      expectedKey: WHY_BY_KIND[kind].expectedKey,
    };
  }
  return { prompt: STEADY.prompt, options: STEADY.options, expectedKey: STEADY.expectedKey };
}
