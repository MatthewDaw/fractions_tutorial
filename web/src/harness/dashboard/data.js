// harness/dashboard/data.js — pure projections that feed the React dashboard.
//
// The dashboard renders the SAME tape projections the CLI writes (report.js +
// metrics + oracle), so the demo and the headless reports never disagree. Nothing
// here touches the DOM or fs — components stay thin, this stays testable.

import { runSweep, runSession } from '../sessionRunner.js';
import { labelTape, DEFAULT_TAU_LATENT } from '../oracle/latentTruth.js';
import { buildVerdictCards } from '../report.js';
import { personaById } from '../personas/library.js';

// A SMALL, representative subset for the in-browser live sweep (the full sweep is
// CLI-only — hundreds of folds would jank the tab). Chosen to surface every failure
// type: a clean master, a lucky guesser, an off-task refuser, a non-BKT oscillator,
// the two audit spoofers, and the held-out fluency-spoofer (a true false-master).
export const DEMO_PERSONA_IDS = Object.freeze([
  'fast-mastery',
  'confident-guesser',
  'off-task',
  'oscillator',
  'denominator-transfer-spoofer',
  'fam-held-fluency-spoofer',
]);

export const DEMO_SKILL_IDS = Object.freeze([
  'ADD_SAME_DEN',
  'ADD_UNLIKE_COPRIME',
  'SIMPLIFY',
  'IMPROPER_TO_MIXED',
]);

/** Short display names for skill columns (full id on hover). */
export const SKILL_SHORT = Object.freeze({
  ADD_SAME_DEN: 'Same-Den',
  ADD_UNLIKE_COPRIME: 'Unlike-LCD',
  ADD_UNLIKE_NESTED: 'Unlike-Nest',
  SIMPLIFY: 'Simplify',
  IMPROPER_TO_MIXED: 'Improper→Mixed',
  MULT_EQUAL_GROUPS: 'Mult-Groups',
  MULT_FACTS: 'Mult-Facts',
  FRACTION_ON_LINE: 'On-Line',
  SUB_SAME_DEN: 'Sub-Same',
  COMPARE_BENCHMARK: 'Compare',
});

/** The three failure dimensions a heatmap cell encodes, in display order. */
export const FAILURE_STRIPS = Object.freeze([
  { key: 'falsePositiveMastery', short: 'FM', label: 'False mastery' },
  { key: 'falseTransfer', short: 'TX', label: 'False transfer' },
  { key: 'missedEscalation', short: 'ME', label: 'Missed escalation' },
]);

/** Run the small in-browser demo sweep (deterministic). */
export function runDemoSweep({ seed = 1, stepCap = 24 } = {}) {
  return runSweep({ personaIds: [...DEMO_PERSONA_IDS], skillIds: [...DEMO_SKILL_IDS], seed, stepCap });
}

/**
 * Project tapes into a heatmap model: rows = personas, cols = skills, and a cell
 * per (persona, skill) carrying which of the three failure dimensions fired.
 *
 * @returns {{ personas:string[], skills:string[], cells:Object,
 *             tauLatent:number }}  cells keyed `${persona}|${skill}`.
 */
export function buildHeatmap(tapes, { tauLatent = DEFAULT_TAU_LATENT } = {}) {
  const personas = [...new Set(tapes.map((t) => t.persona_id))];
  const skills = [...new Set(tapes.map((t) => t.skillId))];
  const cells = {};
  for (const tape of tapes) {
    const { labels } = labelTape(tape, { tauLatent });
    const key = `${tape.persona_id}|${tape.skillId}`;
    cells[key] = {
      persona_id: tape.persona_id,
      skill: tape.skillId,
      run_id: tape.run_id,
      seed: tape.seed,
      falsePositiveMastery: labels.falsePositiveMastery,
      falseTransfer: labels.falseTransfer,
      missedEscalation: labels.missedEscalation,
      falseEscalation: labels.falseEscalation,
      anyLabel:
        labels.falsePositiveMastery || labels.falseTransfer || labels.missedEscalation || labels.falseEscalation,
    };
  }
  return { personas, skills, cells, tauLatent };
}

/** Verdict cards for ONE (persona, skill) cell, ranked most-damning first. */
export function cardsForCell(tapes, persona_id, skill, { tauLatent = DEFAULT_TAU_LATENT } = {}) {
  const subset = tapes.filter((t) => t.persona_id === persona_id && t.skillId === skill);
  return buildVerdictCards(subset, { tauLatent });
}

/**
 * Replay one session in the browser against the CURRENT engine and return the step
 * sequence + a divergence flag vs the stored tape's terminal decision (KTD8 /
 * replay-divergence state). Pure (no DOM); the component animates the result.
 *
 * @returns {{ steps:object[], terminal:object, diverged:boolean }} or null if the
 *          persona can't be rebuilt.
 */
export function replaySession({ persona_id, skill, seed, stepCap = 24, storedTerminalKind = null }) {
  const persona = personaById(persona_id);
  if (!persona) return null;
  const tape = runSession({ persona, skillId: skill, seed, stepCap });
  const diverged =
    storedTerminalKind != null && tape.terminal && tape.terminal.kind !== storedTerminalKind;
  return { steps: tape.steps, terminal: tape.terminal, diverged };
}
