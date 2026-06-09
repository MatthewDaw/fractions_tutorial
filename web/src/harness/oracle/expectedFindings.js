// harness/oracle/expectedFindings.js — U5 / KTD14: the 6 audit defects encoded as
// expected BEHAVIORAL signatures, each tied to its diagnostic persona and each
// PARAMETERIZED by flag state.
//
// The HUMAN-AGREEMENT metric = fraction of the 6 that the harness REPRODUCES. A
// finding is `present: true` when the harness observes the defect's behavioral
// signature (in the diagnostic persona's tape and/or via the minimal structural
// fixture that exercises the exact proxy the persona targets).
//
// FLAG HONESTY (review F1 / config.js): plan-002's flags are INERT STUBS today —
// they are threaded through tapes but do NOT yet route into the engine's PARAMS.
// So a flags-ON run STILL shows the defects present. Each finding records
// `flagThatResolves` (the 002 flag that WILL fix it once 002 routes the flag
// through PARAMS), and we document that the resolution is not yet observable.
//
// The six audited defects:
//   1. fluencyOk-always-true            (fast-shallow-guesser)   → fluencyHardMode
//   2. answer_value independence proxy  (same-answer-memorizer)  → unifiedTaxonomy
//   3. denominator transfer proxy       (denominator-transfer-spoofer) → unifiedTaxonomy
//   4. dead retention_probe             (oscillator)             → delayedProbe
//   5. never-incremented disengagedCount(off-task)               → frustrationScaffold
//   6. single-correct stage advance     (scripted-path)          → (002 scaffold rewire)

import { runSession } from '../sessionRunner.js';
import { personaById } from '../personas/library.js';
import { characterizeScriptedStage } from '../sessionRunner.js';
import { isIndependent, hasTransferred, fluencyOk, computeFluency } from '../../engine/dimensions.js';
import { PLAUSIBLE_COMPUTE_FLOOR_MS, detectImplausibleFluencyGate } from './positiveControl.js';

const SKILL = 'ADD_SAME_DEN';

// ---------------------------------------------------------------------------
// Observation fixture helper (minimal, structurally-precise proxy probes)
// ---------------------------------------------------------------------------

function obs(over = {}) {
  return {
    correct: true,
    answer_value: [1, 2],
    error_signature: null,
    latency: 3000,
    hint_max_rung: 0,
    self_corrections: 0,
    scaffold_level: 3,
    modality: 'tap',
    recognizer_confidence: null,
    too_fast_correct: false,
    affect_window: [],
    ...over,
  };
}

// ---------------------------------------------------------------------------
// 1. fluencyOk-always-true — fast-shallow-guesser masters at implausible latency
// ---------------------------------------------------------------------------

function findingFluencyAlwaysTrue(flags) {
  // The native fast-shallow-guesser answers BELOW the engine's transfer floor, so
  // it cannot pass transfer to reach the gate — its corrects are "too fast". To
  // exercise the gate-opening manifestation we use the fast-shallow GATE-OPENER
  // (corrects just above the engine floor, far below a plausible compute time) and
  // confirm the oracle catches the implausibly-fast gate. We ALSO assert the raw
  // defect: fluencyOk returns true on an implausibly fast fluency stat — in BOTH
  // soft AND hard mode (the age band is uncalibrated/generous), which is why the
  // fluencyHardMode flag does not actually resolve it today.
  const p = personaById('fast-mastery'); // stand-in fast-shallow gate-opener
  p.latent.truePknownBySkill = { [SKILL]: 0.98 };
  p.latent.pSlip = 0;
  p.latent.pGuess = 1;
  p.latent.hintAppetite = 0;
  p.latent.latency = { base: 1250, spread: 60, fatiguePerStep: 0 };
  // Thread the flag state into the tape run so the gate is computed under the SAME
  // PARAMS the rest of the audit reasons about. With fluencyHardMode ON (and the
  // age band now calibrated), hard-mode fluencyOk rejects this implausibly-fast
  // median, so the gate never opens and the oracle finds no implausible gate.
  const tape = runSession({ persona: p, skillId: SKILL, seed: 7, stepCap: 30, flags });
  const flaggedGate = detectImplausibleFluencyGate(tape);

  const fastStat = { median_latency: 200, slope: 0, n: 5 };
  const hardMode = !!flags.fluencyHardMode;
  const fluencyStillPasses = fluencyOk(fastStat, hardMode);

  const present = flaggedGate !== null || fluencyStillPasses;
  return {
    id: 'fluencyOk-always-true',
    present,
    persona_id: 'fast-shallow-guesser',
    flagThatResolves: 'fluencyHardMode',
    evidence: {
      gateOpenAtImplausibleLatency: flaggedGate,
      fluencyOkOnImplausibleStat: { stat: fastStat, hardMode, passes: fluencyStillPasses },
      note:
        'RESOLVED once fluencyHardMode is on AND the age band is calibrated: hard-mode ' +
        'fluencyOk now applies a plausible-compute FLOOR (fluencyPlausibleFloorMs), so a ' +
        '200ms median FAILS fluency and the implausibly-fast gate never opens. With the flag ' +
        'OFF (reversible default-rollback), the soft gate returns and the defect is present again.',
    },
  };
}

// ---------------------------------------------------------------------------
// 2. answer_value independence proxy — same-answer-memorizer
// ---------------------------------------------------------------------------

function findingIndependenceAnswerProxy(_flags) {
  // The proxy keys "distinct problem" on answer_value (dimensions.ts ~143). Two
  // corrects with DIFFERENT answer_values on what is structurally the SAME problem
  // are FALSELY counted as independent; two corrects with the SAME answer_value on
  // genuinely DISTINCT problems are FALSELY denied. Either direction proves the
  // proxy is wrong. We assert the false-grant direction (the dangerous one).
  const falselyIndependent = isIndependent([obs({ answer_value: [1, 2] }), obs({ answer_value: [2, 4] })]);
  const falselyDenied = !isIndependent([obs({ answer_value: [1, 2] }), obs({ answer_value: [1, 2] })]);
  const present = falselyIndependent; // the spoofable, dangerous direction
  return {
    id: 'independence-answer-value-proxy',
    present,
    persona_id: 'same-answer-memorizer',
    flagThatResolves: 'unifiedTaxonomy',
    evidence: {
      falselyIndependentOnSameProblemDifferentValues: falselyIndependent,
      falselyDeniedOnDistinctProblemsSameValue: falselyDenied,
      note: 'distinctness should key on problem_id, not answer_value; the same-answer-memorizer exploits this.',
    },
  };
}

// ---------------------------------------------------------------------------
// 3. denominator transfer proxy — denominator-transfer-spoofer
// ---------------------------------------------------------------------------

function findingTransferDenominatorProxy(_flags) {
  // The proxy keys "distinct surface form" on answer_value[1] (the denominator,
  // dimensions.ts ~194) when no surface_form field is present. So a child who
  // varies ONLY the denominator — never the structure — FALSELY passes transfer.
  const fixturePass = hasTransferred([
    obs({ answer_value: [1, 2], scaffold_level: 2 }),
    obs({ answer_value: [1, 3], scaffold_level: 2 }),
  ]);
  // Corroborate in a real tape: the denominator-transfer-spoofer reaches gate-open
  // (which requires transfer_passed) without any genuine structural variation.
  const tape = runSession({ persona: personaById('denominator-transfer-spoofer'), skillId: SKILL, seed: 7, stepCap: 60 });
  const gatedViaProxy = tape.steps.some((s) => s.gate === true);
  const present = fixturePass && gatedViaProxy;
  return {
    id: 'transfer-denominator-proxy',
    present,
    persona_id: 'denominator-transfer-spoofer',
    flagThatResolves: 'unifiedTaxonomy',
    evidence: {
      transferPassesOnDenominatorOnlyVariation: fixturePass,
      spooferReachesGateOpen: gatedViaProxy,
      firstGateStep: tape.steps.findIndex((s) => s.gate === true),
      note: 'transfer should key on structural surface_form, not the denominator; the spoofer only changes den.',
    },
  };
}

// ---------------------------------------------------------------------------
// 4. dead retention_probe — oscillator never demoted by time
// ---------------------------------------------------------------------------

function findingDeadRetentionProbe(_flags) {
  // The runner (mirroring the live runtime) never emits a `retention_probe` event,
  // so last_retention_probe stays null and the time-based DEMOTION path is dead: an
  // oscillator/forgetter that opens the gate then forgets is never demoted by a
  // retention probe (the gate may re-close on P_known movement, but no probe ever
  // fires). We detect deadness as: across the oscillator's whole tape, NO step's
  // decision is a retention probe AND the observation carries no retention signal.
  const tape = runSession({ persona: personaById('oscillator'), skillId: SKILL, seed: 11, stepCap: 60 });
  const anyRetentionDecision = tape.steps.some(
    (s) => s.decision && /retention/i.test(s.decision.kind || '')
  );
  const firstGate = tape.steps.findIndex((s) => s.gate === true);
  const forgetsAfterGate =
    firstGate >= 0 && tape.steps.slice(firstGate).some((s) => s.gate === false);
  // present = the retention probe path is dead (never invoked) — the engine has no
  // way to demote on a retention interval. forgetsAfterGate corroborates a forgetter
  // exists for which a retention probe WOULD matter.
  const present = !anyRetentionDecision;
  return {
    id: 'dead-retention-probe',
    present,
    persona_id: 'oscillator',
    flagThatResolves: 'delayedProbe',
    evidence: {
      retentionProbeEverFired: anyRetentionDecision,
      forgetterExists: forgetsAfterGate,
      firstGateStep: firstGate,
      note: 'last_retention_probe is never set by the runtime, so no retention-interval demotion can occur.',
    },
  };
}

// ---------------------------------------------------------------------------
// 5. never-incremented disengagedCount — off-task never escalates
// ---------------------------------------------------------------------------

function findingDisengagedNeverEscalates(_flags) {
  // The disengaged escalation trigger reads state.disengagedCount / recentBehavior,
  // but disengagedCount is never incremented and recentBehavior is the EMPTY channel
  // (sessionRunner header). So an off-task refuser — maximally disengaged — never
  // escalates. We reproduce via the unreachable DISENGAGED path: the off-task persona
  // runs to stepCap with terminal !== EscalateToHuman.
  const tape = runSession({ persona: personaById('off-task'), skillId: SKILL, seed: 2, stepCap: 40 });
  const escalated = tape.terminal && tape.terminal.kind === 'EscalateToHuman';
  const present = !escalated;
  return {
    id: 'disengaged-never-escalates',
    present,
    persona_id: 'off-task',
    flagThatResolves: 'frustrationScaffold',
    evidence: {
      terminalKind: tape.terminal ? tape.terminal.kind : null,
      allIncorrect: tape.steps.every((s) => s.observation && s.observation.correct === false),
      note: 'disengaged trigger is UNREACHABLE: disengagedCount never increments and recentBehavior is empty.',
    },
  };
}

// ---------------------------------------------------------------------------
// 6. single-correct stage advance — scripted path (U4 characterizeScriptedStage)
// ---------------------------------------------------------------------------

function findingSingleCorrectStageAdvance(_flags) {
  const fact = characterizeScriptedStage(SKILL, 1);
  const present =
    fact.scriptedAdvanceRule === 'single-correct' && fact.scriptedAttemptsToAdvance === 1;
  return {
    id: 'single-correct-stage-advance',
    present,
    persona_id: 'scripted-path',
    flagThatResolves: null, // resolved only by rewiring useLessonScaffold (002-owned)
    evidence: {
      scriptedAdvanceRule: fact.scriptedAdvanceRule,
      engineAdvanceRule: fact.engineAdvanceRule,
      source: fact.source,
      note: 'the scripted runtime advances a stage on ONE correct, ahead of the engine mastery gate.',
    },
  };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Run all six expected-findings probes under the given flag state.
 *
 * @param {object} [opts] { flags? } — plan-002 flag overrides (inert stubs today).
 * @returns {{ findings: object[], humanAgreement: number, flags: object }}
 *   humanAgreement = fraction of the 6 reproduced (present === true).
 */
export function runExpectedFindings({ flags = {} } = {}) {
  const f = {
    fluencyHardMode: false,
    frustrationScaffold: false,
    delayedProbe: false,
    unifiedTaxonomy: false,
    ...flags,
  };
  const findings = [
    findingFluencyAlwaysTrue(f),
    findingIndependenceAnswerProxy(f),
    findingTransferDenominatorProxy(f),
    findingDeadRetentionProbe(f),
    findingDisengagedNeverEscalates(f),
    findingSingleCorrectStageAdvance(f),
  ];
  const reproduced = findings.filter((x) => x.present).length;
  return {
    findings,
    humanAgreement: reproduced / findings.length,
    flags: f,
  };
}
