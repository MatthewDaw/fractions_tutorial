// practiceFlow.js — the bridge that turns an engine Decision into the NEXT
// generated problem (or an exit). This is what makes the mastery estimator "keep
// things moving": instead of walking fixed stages, a lesson asks the engine what
// to do after each judged answer and this maps the answer onto a fresh, validated
// variation from the generator library.
//
//   continue (PresentProblem) → another variation at the engine's chosen level
//   FadeScaffold              → harder: level + 1 (less support)
//   RaiseScaffold             → easier: level - 1 (more support, keep their work)
//   TransferProbe             → same level, a DIFFERENT surface form (real transfer)
//   ReturnToKitchen           → exit: mastered, go back to the stumping recipe
//   RouteToRoom               → exit: routed upstream to a prerequisite
//
// Pure + deterministic: no Date.now()/Math.random(), no React. Given the same
// (decision, state) it returns the same next spec, so a replayed session
// reproduces the exact problem stream.
import { surfaceFormsFor } from '../generators/index.js';

/**
 * @typedef {Object} PracticeState
 * @property {string} skill         engine skill node id
 * @property {number} level         current scaffold level (0..4)
 * @property {number} index         current variation index (monotonic per skill)
 * @property {string} [surfaceForm] the surface form just shown
 */

/** Pick a surface form different from `current` (falls back to current if only one). */
export function otherSurfaceForm(skill, current) {
  const forms = surfaceFormsFor(skill);
  if (forms.length < 2) return current ?? forms[0] ?? null;
  const other = forms.find((f) => f !== current);
  return other ?? forms[0];
}

/**
 * Map an engine Decision + the current practice state to the next move.
 *
 * @param {object} decision  engine Decision ({ kind, scaffold?, surface_form?, ... })
 * @param {PracticeState} state
 * @param {object} [opts]  { maxLevel?: number }
 * @returns {{ action: 'present'|'return'|'route', spec?: {level:number,index:number,surfaceForm?:string}, decision: object }}
 *   action 'present' → render spec as a new problem.
 *   action 'return'/'route' → leave the practice loop (mastered / routed upstream).
 */
export function nextPractice(decision, state, opts = {}) {
  const maxLevel = opts.maxLevel ?? 4;
  const kind = decision?.kind;
  const nextIndex = (state.index ?? 0) + 1;
  const level = state.level ?? 0;

  switch (kind) {
    case 'FadeScaffold':
      return {
        action: 'present',
        decision,
        spec: { level: Math.min(maxLevel, level + 1), index: nextIndex },
      };

    case 'RaiseScaffold':
      return {
        action: 'present',
        decision,
        spec: { level: Math.max(0, level - 1), index: nextIndex },
      };

    case 'TransferProbe':
      return {
        action: 'present',
        decision,
        spec: {
          level,
          index: nextIndex,
          surfaceForm: otherSurfaceForm(state.skill, state.surfaceForm),
        },
      };

    case 'ReturnToKitchen':
      return { action: 'return', decision };

    case 'RouteToRoom':
      return { action: 'route', decision };

    case 'PresentProblem':
    default:
      // Routine "continue" → another variation at the SAME practice level (more
      // practice). The level is moved only by Fade/Raise above; a PresentProblem
      // must NOT pull it back to the policy's entry scaffold, or the difficulty
      // would collapse to L0 between reps. (Matches useLessonScaffold's generated
      // mode, which holds the level except on an explicit fade/raise.)
      return {
        action: 'present',
        decision,
        spec: {
          level,
          index: nextIndex,
          surfaceForm: decision?.surface_form,
        },
      };
  }
}
