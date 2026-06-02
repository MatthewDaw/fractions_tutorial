// harness/oracle/positiveControl.js — U5: VERIFY-FIRST positive control.
//
// A red-team harness is only trustworthy if it CATCHES a defect we KNOW is in the
// code. The confirmed positive control is the `fluencyOk()`-always-true soft gate
// (engine/dimensions.ts ~91): in soft mode fluencyOk returns true unconditionally,
// so a learner can open the mastery gate with IMPLAUSIBLY LOW latency — a fast,
// shallow "answer" stream the engine never questions on fluency grounds.
//
// We DO NOT rely on the `consecutiveErrors` double-count (U4 found it increments
// ONCE — UNCONFIRMED as a defect), so the positive control is built ONLY on the
// confirmed fluencyOk defect.
//
// blindControl(injectDefectFn) is the review-A7 hook: it accepts an EXTERNALLY
// supplied defect injector — a function the persona authors never saw — and reports
// whether the oracle still catches a gate-open whose fluency is implausibly fast.
// This guards against the oracle only detecting bugs it was hand-tuned for.

import { runSession } from '../sessionRunner.js';
import { personaById } from '../personas/library.js';
import { computeFluency } from '../../engine/dimensions.js';

const SKILL = 'ADD_SAME_DEN';

/**
 * The oracle's PLAUSIBLE-COMPUTE FLOOR (ms) — the minimum median latency at which
 * a stream of corrects is credible as genuine fluency rather than a fast guess.
 *
 * Named + configurable, and DELIBERATELY DISJOINT from the engine's own
 * latencyFloorMs (1200). The engine floor is the "too fast to be real" guard the
 * engine THINKS it applies; the oracle floor is a STRICTER plausibility bar the
 * oracle uses to AUDIT the gate. A gate that opens with median latency below this
 * floor — while fluencyOk waved it through — is the flagged defect.
 */
export const PLAUSIBLE_COMPUTE_FLOOR_MS = 1500;

/**
 * Detect the fluency defect on a tape: a gate-open step whose fluency median
 * latency (over the corrects up to and including that step) is below the oracle's
 * plausible-compute floor. Returns the flagged step (or null).
 */
export function detectImplausibleFluencyGate(tape, { floorMs = PLAUSIBLE_COMPUTE_FLOOR_MS } = {}) {
  for (let i = 0; i < tape.steps.length; i++) {
    if (tape.steps[i].gate !== true) continue;
    const obs = tape.steps.slice(0, i + 1).map((s) => s.observation).filter(Boolean);
    const fl = computeFluency(obs);
    if (fl.median_latency !== null && fl.median_latency < floorMs) {
      return { step: i, medianLatency: fl.median_latency, slope: fl.slope, floorMs };
    }
  }
  return null;
}

/**
 * Build the canonical fast-shallow learner for the positive control: accurate
 * enough to satisfy independence + transfer (so the gate CAN open), but with a
 * latency band that sits just above the engine's transfer floor (1200ms) and FAR
 * below a plausible fraction-compute time. fluencyOk (soft, always-true) lets it
 * through; the oracle must catch it.
 */
function fastShallowGateOpener() {
  const p = personaById('fast-mastery');
  p.latent.truePknownBySkill = { [SKILL]: 0.98 };
  p.latent.pSlip = 0;
  p.latent.pGuess = 1;
  p.latent.hintAppetite = 0;
  // ~1250ms median: above the engine's 1200 transfer floor, below the oracle's 1500.
  p.latent.latency = { base: 1250, spread: 60, fatiguePerStep: 0 };
  return p;
}

/**
 * Run the positive control. Returns whether the oracle caught the known fluencyOk
 * defect, with the gate-open evidence.
 *
 * @param {object} [opts] { seed?, floorMs? }
 * @returns {{ caught:boolean, gateOpenStep:number, flagged:object|null, defect:string }}
 */
export function runPositiveControl({ seed = 7, floorMs = PLAUSIBLE_COMPUTE_FLOOR_MS } = {}) {
  const tape = runSession({ persona: fastShallowGateOpener(), skillId: SKILL, seed, stepCap: 30 });
  const gateOpenStep = tape.steps.findIndex((s) => s.gate === true);
  const flagged = detectImplausibleFluencyGate(tape, { floorMs });
  return {
    caught: flagged !== null,
    gateOpenStep,
    flagged,
    defect: 'fluencyOk-always-true (dimensions.ts ~91): gate opens with implausibly low median latency',
  };
}

// ---------------------------------------------------------------------------
// blindControl — externally-supplied defect injector (review A7)
// ---------------------------------------------------------------------------

/**
 * Run a BLIND control: an external party supplies `injectDefectFn`, a function the
 * persona authors never saw, that returns a persona/run spec designed to exercise
 * SOME mastery defect. We run it and report whether the oracle's fluency-implausibility
 * detector still catches a gate-open it should not trust.
 *
 * The injector receives a small toolkit so it can build a session without importing
 * harness internals directly:
 *   { personaById, SKILL }  ->  { persona, skillId?, seed?, stepCap?, floorMs? }
 *
 * This proves detection is not ONLY of the designed-for fast-shallow persona: any
 * injected run whose gate opens on implausibly fast corrects is caught by the SAME
 * oracle code path.
 *
 * @param {Function} injectDefectFn
 * @param {object} [opts] { floorMs? }
 * @returns {{ caught:boolean, gateOpenStep:number, flagged:object|null, injected:boolean }}
 */
export function blindControl(injectDefectFn, { floorMs = PLAUSIBLE_COMPUTE_FLOOR_MS } = {}) {
  if (typeof injectDefectFn !== 'function') {
    return { caught: false, gateOpenStep: -1, flagged: null, injected: false };
  }
  const spec = injectDefectFn({ personaById, SKILL }) || {};
  const persona = spec.persona;
  if (!persona) {
    return { caught: false, gateOpenStep: -1, flagged: null, injected: false };
  }
  const tape = runSession({
    persona,
    skillId: spec.skillId || SKILL,
    seed: spec.seed ?? 7,
    stepCap: spec.stepCap ?? 30,
  });
  const gateOpenStep = tape.steps.findIndex((s) => s.gate === true);
  const flagged = detectImplausibleFluencyGate(tape, { floorMs: spec.floorMs ?? floorMs });
  return { caught: flagged !== null, gateOpenStep, flagged, injected: true };
}
