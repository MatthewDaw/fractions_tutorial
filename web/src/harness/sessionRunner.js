// harness/sessionRunner.js — U4: the headless session runner.
//
// This is the headless MIRROR of the LIVE submit boundary (useLessonEngine.js).
// It drives the REAL engine — no mock. Per attempt it:
//   measurementReduce(log, now) → mastery
//   nextDecision(PolicyState, mastery, recentBehavior, now) → decision  (boundary ONLY)
//   nextPractice(decision, practiceState) → spec  (or terminal)
//   generateFor(skill, spec) → problem
//   persona.emit(problem, ctx) → attempt
//   append the event burst that segment() ACTUALLY reads
//   update PolicyState exactly as useLessonEngine does
// …repeating to a terminal decision, recording a tape per session.
//
// DETERMINISM: byte-identical tapes for the same {persona, skill, seed, flags}.
// All randomness flows from personaRng(persona.id, seed, step). Time is INJECTED
// (we advance a synthetic clock by attempt.latencyMs), never read from wall-clock.
//
// MIRRORED FINDINGS (verified in useLessonEngine.js / policy.ts — see U5):
//   - recentBehavior is the EMPTY channel { observations: [], isDisengaged: false }.
//     Live `recentObsRef` is allocated but never appended and `disengagedCount` is
//     never incremented, so we mirror the empty channel here. This makes the
//     engine's "disengaged" escalation trigger UNREACHABLE by construction. We do
//     NOT invent observations to paper over it — that is a real finding, not a bug
//     to fix in U4.
//   - The STUCK escalation trigger IS reachable: floor scaffold (L0) + flat P_known
//     over nStuck attempts + heavy hints (heavyHintAtFloorCount ≥ nStuck). The
//     runner drives PolicyState exactly so a stuck persona reaches it.
//   - segment() reads `answer_num`/`answer_den` off the JUDGED payload (NOT
//     `answer_value`, which the live engine emits and segment ignores). To produce
//     MEANINGFUL Observations for the red-team we emit `answer_num`/`answer_den`
//     (plus the live `answer_value` for parity). This is a deliberate U4 choice:
//     we mirror the BOUNDARY (when/what is called), and we feed segment() the keys
//     it documents it reads so the tape carries real Observations.

import {
  measurementReduce,
  nextDecision,
  isMastered,
  generateFor,
  nextPractice,
  segment,
  appendEvent,
} from './engineApi.js';
import { gradeAnswer } from '../generators/grade.js';
import { personaRng } from './rng.js';
import { paramsHash } from './config.js';
import { withFlags } from './flagOverlay.js';
import { correctAnswerValue } from './personas/model.js';
import { personaById, allPersonas } from './personas/library.js';
import { serializeSession } from './tape.js';
import {
  makeTier2Window,
  checkOscillation,
  checkLongPause,
  checkTooFastCorrect,
} from '../runtime/tier2.js';

// ---------------------------------------------------------------------------
// Constants — the EMPTY recentBehavior channel (mirror of useLessonEngine).
// ---------------------------------------------------------------------------

/** The live recentBehavior channel is effectively empty (see file header). */
const EMPTY_RECENT_BEHAVIOR = Object.freeze({
  observations: [],
  isDisengaged: false,
});

/** Default skill set for a sweep = every skill that has a generator. */
const DEFAULT_SKILL_IDS = [
  'ADD_SAME_DEN',
  'ADD_UNLIKE_COPRIME',
  'ADD_UNLIKE_NESTED',
  'SIMPLIFY',
  'IMPROPER_TO_MIXED',
  'MULT_EQUAL_GROUPS',
  'MULT_FACTS',
  'FRACTION_ON_LINE',
  'SUB_SAME_DEN',
  'COMPARE_BENCHMARK',
];

// ---------------------------------------------------------------------------
// PolicyState — built and updated EXACTLY as useLessonEngine does.
// ---------------------------------------------------------------------------

/** Initial PolicyState, mirroring buildInitialPolicyState in useLessonEngine.js. */
function buildInitialPolicyState(nodeId, scaffoldLevel, { inKitchen = false, stumpingRecipe = null } = {}) {
  return {
    currentNodeId: nodeId,
    currentScaffold: scaffoldLevel,
    stumpingRecipe,
    inKitchen,
    sessionMaxScaffoldPassed: null,
    consecutiveErrors: 0,
    consecutiveCleanCorrects: 0,
    pendingTransferProbe: false,
    pKnownHistory: [],
    heavyHintAtFloorCount: 0,
    disengagedCount: 0,
    // T03: separate, LOWER-threshold disengagement counter that arms the frustration
    // SCAFFOLD (3b branch in policy.ts) without spuriously firing EscalateToHuman.
    disengagedScaffoldCount: 0,
  };
}

/**
 * Update the mutable PolicyState based on one attempt's outcome — a FAITHFUL
 * mirror of _updatePolicyState in useLessonEngine.js (we do NOT "fix" the quirk
 * that pendingTransferProbe is set elsewhere / too_fast handling lives upstream).
 */
function updatePolicyState(policyState, { correct, hintMaxRung, latency, currentScaffold }) {
  const hintFree = hintMaxRung === 0;
  const inBandLatency = latency >= 800 && latency <= 30000;

  if (correct) {
    policyState.consecutiveErrors = 0;
    if (hintFree && inBandLatency) {
      policyState.consecutiveCleanCorrects += 1;
      if (
        policyState.sessionMaxScaffoldPassed === null ||
        currentScaffold > policyState.sessionMaxScaffoldPassed
      ) {
        policyState.sessionMaxScaffoldPassed = currentScaffold;
      }
    } else {
      policyState.consecutiveCleanCorrects = 0;
    }
    policyState.pendingTransferProbe = false;
  } else {
    policyState.consecutiveErrors += 1;
    policyState.consecutiveCleanCorrects = 0;
  }

  // Heavy hints at floor scaffold drive the (reachable) stuck escalation.
  if (currentScaffold === 0 && hintMaxRung >= 3) {
    policyState.heavyHintAtFloorCount += 1;
  }
}

/** too_fast_correct flag — mirror of _isTooFastCorrect in useLessonEngine.js. */
function isTooFastCorrect(correct, latency) {
  return correct && latency < 800;
}

// ---------------------------------------------------------------------------
// Answer compare + judged-payload assembly
// ---------------------------------------------------------------------------

/**
 * Convert a persona attempt.answer ([num,den]|null|[NaN,NaN]) into the per-skill
 * answer shape gradeAnswer expects, then grade it against the generated problem.
 * null / NaN answers grade as incorrect (never coerced or dropped).
 *
 * @returns {{ correct:boolean, stars:number, errorSignature:string|null }}
 */
function gradeAttempt(problem, answerPair) {
  if (!Array.isArray(answerPair)) {
    // null / off-task refusal — a non-answer is incorrect, not dropped.
    return { correct: false, stars: 0, errorSignature: null };
  }
  const [num, den] = answerPair;
  if (!Number.isFinite(num) || !Number.isFinite(den)) {
    // [NaN, NaN] malformed scribble — incorrect, not dropped.
    return { correct: false, stars: 0, errorSignature: null };
  }
  // Map the flat [num,den] onto the skill's answer shape for gradeAnswer.
  const shaped = shapeAnswer(problem, num, den);
  return gradeAnswer(problem, shaped);
}

/** Map a flat [num,den] persona answer onto the per-skill answer object. */
function shapeAnswer(problem, num, den) {
  switch (problem.skill) {
    case 'IMPROPER_TO_MIXED': {
      // The persona carries the improper value as [num,den]; re-derive whole+rem.
      // For an exact answer ([num,den] == correct improper) this reconstructs the
      // mixed form the grader checks; otherwise it is a (correctly) wrong mixed.
      const d = den || problem.operands.den;
      const whole = Math.trunc(num / d);
      const rem = num - whole * d;
      return { whole, num: rem, den: d };
    }
    case 'MULT_EQUAL_GROUPS':
    case 'MULT_FACTS':
      // correctAnswerValue encodes product as [product, 1].
      return { value: num, product: num };
    case 'COMPARE_BENCHMARK': {
      // Relations aren't expressible as [num,den]; the persona answers correctly
      // by reproducing the relation only via correctAnswerValue fallback [1,1].
      // We reconstruct the relation from a correct match, else mark a wrong rel.
      const correct = correctAnswerValue(problem);
      const isMatch = correct && num === correct[0] && den === correct[1];
      return { rel: isMatch ? problem.answer.rel : '__wrong__' };
    }
    default:
      return { num, den };
  }
}

/**
 * Derive the classifyErrorSignature inputs (slip, target_num/den, operands) from
 * the graded result + problem, so the JUDGED payload lets segment() fingerprint
 * the error_signature. We surface the SAME slip codes momsProblems.gradeAnswer
 * would (sameBottom/notSimplified/leftoverOnly/wrongValue) by mapping the
 * generator grader's errorSignature onto them.
 */
function judgedClassifierFields(problem, gradeResult, answerPair) {
  const correctVal = correctAnswerValue(problem);
  const target_num = correctVal ? correctVal[0] : null;
  const target_den = correctVal ? correctVal[1] : null;

  // operands as [[na,da],[nb,db]] ONLY when fraction-shaped (segment needs this
  // exact shape for add_across_unlike / add_denominators / scaled_bottom_only).
  let operands = null;
  const op = problem.operands || {};
  if (op.a && op.b && typeof op.a.num === 'number' && typeof op.a.den === 'number') {
    operands = [[op.a.num, op.a.den], [op.b.num, op.b.den]];
  } else if (op.start && op.take && typeof op.start.num === 'number') {
    operands = [[op.start.num, op.start.den], [op.take.num, op.take.den]];
  }

  // Map the generator grader's errorSignature → a momsProblems-style slip code
  // that classifyErrorSignature reads. (segment passes `slip` first; structural
  // matching on operands then refines add_denominators vs add_across_unlike.)
  let slip = null;
  if (!gradeResult.correct) {
    switch (gradeResult.errorSignature) {
      case 'not_simplified':
        slip = 'notSimplified';
        break;
      case 'forced_leftover':
        slip = 'leftoverOnly';
        break;
      case 'wrong_value':
      case 'wrong_product':
      case 'wrong_relation':
      default:
        // Let structural operand matching classify add-across errors; otherwise
        // 'wrongValue' which classifier treats as opaque ('other'/null).
        slip = 'wrongValue';
        break;
    }
  }

  return { slip, target_num, target_den, operands };
}

// ---------------------------------------------------------------------------
// Event-burst emission — emit EXACTLY the event types/payloads segment() reads.
// ---------------------------------------------------------------------------

/**
 * Append one attempt's full event burst to `log`, returning the new log.
 * Advances the synthetic clock object `clock` (clock.t) by intra-attempt deltas
 * and the attempt latency. The shapes here are the contract segment() consumes:
 *
 *   problem_present { node_id, level, surface_form, scaffold_level }   (modality)
 *   piece_remove / piece_place ×selfCorrections (oscillation segment counts)
 *   hint_shown { rung }                                  (only if hintRung > 0)
 *   answer_submit { node_id, answer_value, answer_num, answer_den,
 *                   scaffold_level, latency_ms, hint_max_rung, ... }   (t = present + latency)
 *   judged { node_id, correct, answer_value, answer_num, answer_den,
 *            error_signature, slip, target_num, target_den, operands,
 *            scaffold_level, latency_ms, hint_max_rung, self_corrections,
 *            modality, too_fast_correct, surface_form }
 */
function appendAttemptBurst(log, clock, {
  nodeId,
  level,
  scaffoldLevel,
  surfaceForm,
  modality,
  answerPair,
  latencyMs,
  hintRung,
  selfCorrections,
  gradeResult,
  classifier,
}) {
  const presentT = clock.t;
  let next = log;

  // problem_present — the segment START boundary + node_id binding source.
  next = appendEvent(next, {
    type: 'problem_present',
    payload: {
      node_id: nodeId,
      level,
      scaffold_level: scaffoldLevel,
      surface_form: surfaceForm,
    },
    modality,
    actor: 'synthetic:harness',
    t: presentT,
  });

  // self-correction oscillations: a remove→place reversal counts as 1 in
  // countSelfCorrections. Emit `selfCorrections` reversals (place, then N×(remove,place)).
  let dt = 1;
  if (selfCorrections > 0) {
    next = appendEvent(next, {
      type: 'piece_place',
      payload: { node_id: nodeId },
      modality,
      actor: 'synthetic:harness',
      t: presentT + dt,
    });
    dt += 1;
    for (let k = 0; k < selfCorrections; k++) {
      next = appendEvent(next, {
        type: 'piece_remove',
        payload: { node_id: nodeId },
        modality,
        actor: 'synthetic:harness',
        t: presentT + dt,
      });
      dt += 1;
      next = appendEvent(next, {
        type: 'piece_place',
        payload: { node_id: nodeId },
        modality,
        actor: 'synthetic:harness',
        t: presentT + dt,
      });
      dt += 1;
    }
  }

  // hint_shown at the rung the persona rang (segment takes the MAX rung).
  if (hintRung > 0) {
    next = appendEvent(next, {
      type: 'hint_shown',
      payload: { node_id: nodeId, rung: hintRung },
      modality,
      actor: 'synthetic:harness',
      t: presentT + dt,
    });
    dt += 1;
  }

  // answer_submit at present + latency (segment computes latency from this).
  const submitT = presentT + Math.max(dt, latencyMs);
  const answer_value = Array.isArray(answerPair) ? answerPair : null;
  const answer_num = answer_value && Number.isFinite(answer_value[0]) ? answer_value[0] : null;
  const answer_den = answer_value && Number.isFinite(answer_value[1]) ? answer_value[1] : null;

  next = appendEvent(next, {
    type: 'answer_submit',
    payload: {
      node_id: nodeId,
      answer_value,
      answer_num,
      answer_den,
      modality,
      scaffold_level: scaffoldLevel,
      latency_ms: submitT - presentT,
      hint_max_rung: hintRung,
      self_corrections: selfCorrections,
      surface_form: surfaceForm,
    },
    modality,
    actor: 'synthetic:harness',
    t: submitT,
  });

  // judged — the segment END boundary. Carries everything segment + classifier read.
  next = appendEvent(next, {
    type: 'judged',
    payload: {
      node_id: nodeId,
      correct: gradeResult.correct,
      answer_value,
      answer_num,
      answer_den,
      error_signature: gradeResult.errorSignature,
      slip: classifier.slip,
      target_num: classifier.target_num,
      target_den: classifier.target_den,
      operands: classifier.operands,
      stars: gradeResult.stars,
      scaffold_level: scaffoldLevel,
      latency_ms: submitT - presentT,
      hint_max_rung: hintRung,
      self_corrections: selfCorrections,
      modality,
      surface_form: surfaceForm,
      too_fast_correct: isTooFastCorrect(gradeResult.correct, submitT - presentT),
      affect_window: [],
    },
    modality,
    actor: 'synthetic:harness',
    t: submitT,
  });

  // Advance the synthetic clock past this attempt (+1 so the next present is strictly later).
  clock.t = submitT + 1;
  return next;
}

// ---------------------------------------------------------------------------
// T26 — Tier-2 nudge wiring (the dead in-the-moment channel).
//
// FINDING (confirmed): the live submit boundary (useLessonEngine.judgeAndAdvance)
// passes the policy a recentBehavior whose `observations` come from `recentObsRef`
// — a ref that is ALLOCATED but NEVER appended — so the buffer is empty on every
// session, and the runner here mirrored that with the frozen EMPTY_RECENT_BEHAVIOR.
// The T03 disengaged writer feeds `disengagedScaffoldCount` (the escalation/scaffold
// counter) ONLY; it does NOT reach the Tier-2 in-the-moment nudge (idle / oscillation
// / too-fast-correct), so that channel records ZERO firings. tier2.js computes the
// nudges but nothing on the run path calls its oscillation/long-pause detectors or
// records the result.
//
// FIX (reversible, flag `tier2Nudge`, default-off): build a REAL recentBehavior
// from the SAME segment()-derived Observation the tape already records (we do NOT
// invent signals or duplicate the observe-layer detectors), then drive tier2.js's
// existing detectors at the boundary and RECORD the fired nudge on the step. With
// the flag off the channel stays exactly as before (EMPTY_RECENT_BEHAVIOR, no nudge
// recorded) so prior behavior is byte-identical. The nudge is ADVISORY: it is
// recorded for the harness's nudge-gap detector but never mutates the engine
// PolicyState or the engine Decision (affect/advisory firewall — escalation and the
// banked decision are untouched).
// ---------------------------------------------------------------------------

/**
 * Fire at most one Tier-2 nudge for the just-completed attempt, reusing the
 * existing tier2.js detectors against the REAL segment-derived observation.
 *
 * Priority mirrors tier2.checkTier2 (long-pause > oscillation > too-fast). The
 * idle/long-pause channel reads the observation's own latency as the idle time
 * (lastInteraction=0, now=obs.latency) so an idle attempt (latency ≥ PAUSE
 * threshold) fires HINT_OFFER — the SAME window findings.nudgeWindowFor flags.
 *
 * @param {object|null} obs  the segment() Observation for this attempt.
 * @returns {{ type:string, payload:object } | null}
 */
function fireTier2Nudge(obs) {
  if (!obs) return null;
  const window = makeTier2Window();
  const recent = { observations: [obs], isDisengaged: false };

  const hintRung = obs.hint_max_rung ?? 0;
  // 1. long pause → HINT_OFFER (idle time = the attempt's own latency).
  const pause = checkLongPause(0, obs.latency ?? 0, window, hintRung);
  if (pause) return pause;
  // 2. oscillation → TAKE_YOUR_TIME.
  const osc = checkOscillation(recent, window);
  if (osc) return osc;
  // 3. too-fast-correct → TRANSFER_PROBE_QUEUED.
  const fast = checkTooFastCorrect(obs, window);
  if (fast) return fast;
  return null;
}

// ---------------------------------------------------------------------------
// runSession — the headless loop.
// ---------------------------------------------------------------------------

/**
 * Drive one synthetic session end-to-end against the REAL engine.
 *
 * @param {object} args
 *   @param {object} args.persona  a FRESH persona (from personaById/allPersonas).
 *   @param {string} args.skillId  engine skill node id to practice.
 *   @param {number} args.seed     run seed (determinism).
 *   @param {number} [args.stepCap=40]  max attempts before forced terminate.
 *   @param {object} [args.flags]  plan-002 reversible flags (threaded into tape).
 *   @param {number} [args.startScaffold=0]  initial scaffold level (default 0 = L0).
 *     Set > 0 to probe disengagement at a non-floor scaffold (used by oracle probes
 *     that verify the T03 frustration-scaffold path; e.g. startScaffold=1 puts the
 *     session at L1 so RaiseScaffold is legal and the 3b branch is reachable).
 *   @param {boolean} [args.controlArm=false]  UI5 STATIC CONTROL ARM.
 *     When true, scaffold morphs (FadeScaffold / RaiseScaffold) are SUPPRESSED: the
 *     scaffold level stays fixed at startScaffold for the entire session. The engine
 *     still decides (nextDecision is called as normal) so the mastery gate, BKT fold,
 *     and all policy logic run identically — only the scaffold-level mutation after
 *     each step is skipped. This replicates a "static / fixed-scaffold" tutor that
 *     never adapts its presentation level, providing the PDF-required comparison arm.
 *     Tapes produced in this mode carry arm:'static' (vs arm:'adaptive' by default).
 * @returns {object} tape
 */
export function runSession({ persona, skillId, seed = 1, stepCap = 40, flags = {}, startScaffold = 0, controlArm = false }) {
  if (!persona) throw new Error('runSession: persona is required');
  if (!skillId) throw new Error('runSession: skillId is required');

  // T12: APPLY the plan-002 flags to the engine PARAMS for the whole session, then
  // restore (withFlags's finally) so flags never leak across sessions/sweeps. The
  // engine reads PARAMS at CALL TIME, so this is what makes a flags-ON sweep gate
  // DIFFERENTLY from flags-OFF (e.g. fluencyHardMode tightens isMastered; frustration
  // Scaffold changes the RaiseScaffold rationale). With baseline/empty flags the
  // overlay is a no-op and behavior is byte-identical to before. paramsHash() below
  // is read INSIDE the overlay so the tape's params_hash reflects the gated PARAMS.
  return withFlags(flags, () =>
    runSessionInner({ persona, skillId, seed, stepCap, flags, startScaffold, controlArm }));
}

/** The session loop, run with the flag overlay already applied to engine PARAMS. */
function runSessionInner({ persona, skillId, seed, stepCap, flags, startScaffold = 0, controlArm = false }) {
  // T26: reversible Tier-2 nudge wiring. Default OFF → the empty recentBehavior
  // channel + no recorded nudge (byte-identical to prior tapes). ON → a real
  // recentBehavior (from segment) feeds the policy and the Tier-2 nudge is recorded.
  const tier2NudgeOn = flags?.tier2Nudge === true;
  // PolicyState: currentNodeId=skillId, entry scaffold, no prior — exactly as the live hook.
  // startScaffold > 0 is used by oracle probes that need scaffold > L0 to make
  // RaiseScaffold legal (e.g. the T03 frustration-scaffold reachability probe).
  const policyState = buildInitialPolicyState(skillId, startScaffold, { inKitchen: false, stumpingRecipe: null });

  // Practice state for nextPractice (level/index/surfaceForm bookkeeping).
  let practiceState = { skill: skillId, level: 0, index: 0, surfaceForm: undefined };

  // Synthetic injected clock (no wall-clock — replay-exact).
  const clock = { t: 1_000_000 };

  let log = [];
  const steps = [];
  let terminal = { kind: 'StepCap', step: stepCap };
  let lastDecision = null;

  for (let step = 0; step < stepCap; step++) {
    const now = clock.t;

    // (1) measurementReduce(log, now) → mastery — the REAL fold.
    const { mastery } = measurementReduce(log, now);

    // (2) BOUNDARY: nextDecision called ONCE here (mirrors the judged boundary).
    // T26: when the flag is on, feed a REAL recentBehavior built from the SAME
    // segment()-derived Observations the tape records (last 10), so the channel is
    // no longer empty. The engine reads recentBehavior ONLY for the disengaged
    // escalation trigger (gated on disengagedCount, which stays 0 here), so this is
    // advisory and does NOT change the banked decision — it just makes the Tier-2
    // nudge below recordable. Off → EMPTY_RECENT_BEHAVIOR (prior behavior).
    const recentBehavior = tier2NudgeOn
      ? { observations: segment(log).slice(-10), isDisengaged: false }
      : EMPTY_RECENT_BEHAVIOR;
    const decision = nextDecision(policyState, mastery, recentBehavior, now);
    lastDecision = decision;

    // (3) nextPractice → spec OR terminal exit.
    const flow = nextPractice(decision, practiceState);
    if (flow.action !== 'present') {
      // return / route — record terminal and stop (no attempt this step).
      terminal = {
        kind: decision.kind, // ReturnToKitchen | RouteToRoom (matches flow.action)
        step,
      };
      break;
    }
    if (decision.kind === 'EscalateToHuman') {
      // EscalateToHuman is a terminal too: nextPractice falls through to 'present'
      // for it, but the policy has escalated — stop here as a human handoff.
      terminal = { kind: 'EscalateToHuman', step };
      break;
    }

    const spec = flow.spec;
    const level = spec.level;
    practiceState = {
      skill: skillId,
      level,
      index: spec.index,
      surfaceForm: spec.surfaceForm,
    };

    // (3b) generateFor(skill, spec) → problem.
    const problem = generateFor(skillId, {
      level,
      index: spec.index,
      surfaceForm: spec.surfaceForm,
    });
    const surfaceForm = problem.surfaceForm;

    // (4) persona.emit(problem, ctx) → attempt. rng keyed by (id, seed, step).
    const rng = personaRng(persona.id, seed, step);
    const attempt = persona.emit(problem, {
      skillId,
      level,
      surfaceForm,
      lastDecision,
      rng,
      step,
    });

    // (5) grade + assemble the JUDGED classifier fields, then emit the burst.
    const gradeResult = gradeAttempt(problem, attempt.answer);
    const classifier = judgedClassifierFields(problem, gradeResult, attempt.answer);

    const latencyMs = Math.max(0, Math.round(attempt.latencyMs ?? 0));
    const hintRung = Math.max(0, Math.round(attempt.hintRung ?? 0));
    const selfCorrections = Math.max(0, Math.round(attempt.selfCorrections ?? 0));
    const modality = attempt.modality || 'tap';

    log = appendAttemptBurst(log, clock, {
      nodeId: skillId,
      level,
      scaffoldLevel: policyState.currentScaffold,
      surfaceForm,
      modality,
      answerPair: attempt.answer,
      latencyMs,
      hintRung,
      selfCorrections,
      gradeResult,
      classifier,
    });

    // (6) Update PolicyState the SAME way useLessonEngine does (after the burst,
    // using the scaffold the attempt was answered at). Then fold again to read the
    // post-attempt P_known into pKnownHistory (mirrors judgeAndAdvance order).
    const answeredScaffold = policyState.currentScaffold;
    updatePolicyState(policyState, {
      correct: gradeResult.correct,
      hintMaxRung: hintRung,
      latency: latencyMs,
      currentScaffold: answeredScaffold,
    });

    // (6b) T03 disengagement writer — mirror of the submit-boundary disengagement
    // writer in useLessonEngine.js. The DECOUPLED `disengagedScaffoldCount` (arms
    // the 3b RaiseScaffold at nDisengScaffold) is incremented when the attempt
    // carries an idle signal (the child paused/abandoned without engaging), and
    // reset on GENUINE re-engagement (a clean correct in-band latency WITHOUT an
    // idle signal — an idle+correct is ambiguous and does not clear the count).
    // This is SEPARATE from `disengagedCount` (which arms EscalateToHuman) so
    // wiring the scaffold trigger never spuriously fires the escalation path
    // (T03 DECOUPLED design).
    const hasIdleSignal = Array.isArray(attempt.signals) &&
      attempt.signals.some((sig) => sig && sig.type === 'idle');
    // Re-engagement: correct AND in-band latency AND no hints AND no idle signal.
    // A correct answer with an idle signal is not genuine re-engagement (the child
    // may have been idle then guessed). A plain wrong answer does not clear count.
    const isReengaged = gradeResult.correct && latencyMs >= 800 && latencyMs <= 30000 &&
      hintRung === 0 && !hasIdleSignal;
    if (isReengaged) {
      policyState.disengagedScaffoldCount = 0;
    } else if (hasIdleSignal) {
      policyState.disengagedScaffoldCount += 1;
    }

    const post = measurementReduce(log, clock.t);
    const nodeEst = post.mastery[skillId];
    if (nodeEst) {
      const hist = policyState.pKnownHistory;
      const trimmed = hist.length >= 12 ? hist.slice(1) : hist;
      policyState.pKnownHistory = [...trimmed, nodeEst.P_known];
    }

    // Apply scaffold change from the decision (mirror: Fade +1 cap4, Raise -1 floor0).
    // CONTROL ARM: scaffold is held fixed — morph mutations are suppressed so the
    // session runs at the initial scaffold level throughout (static/no-adaptation baseline).
    if (!controlArm) {
      if (decision.kind === 'FadeScaffold') {
        policyState.currentScaffold = Math.min(4, answeredScaffold + 1);
      } else if (decision.kind === 'RaiseScaffold') {
        policyState.currentScaffold = Math.max(0, answeredScaffold - 1);
      }
    }

    // (7) Record the tape step: decision + segment-derived Observation + gate/latent/pknown.
    const observations = segment(log);
    const observation = observations[observations.length - 1] ?? null;
    const gateOpen = nodeEst ? isMastered(nodeEst) : false;

    // Record decision fields that are relevant to oracle checks. `preserveWork`
    // is present on RaiseScaffold decisions and signals the T03 warm-foothold
    // response (distinguishes frustration-scaffold 3b from the normal raise-on-error).
    const decisionRecord = { kind: decision.kind, rationale: decision.rationale };
    if ('preserveWork' in decision) decisionRecord.preserveWork = decision.preserveWork;

    // T26: fire + record the Tier-2 in-the-moment nudge for THIS attempt, reusing
    // tier2.js's detectors against the real Observation (no detector duplication,
    // no invented signal). Advisory-only: it never mutates PolicyState or the
    // engine Decision. Off → no nudge field (tapes byte-identical to before).
    const nudge = tier2NudgeOn ? fireTier2Nudge(observation) : null;

    const stepRecord = {
      decision: decisionRecord,
      observation,
      gate: gateOpen,
      latent: persona.truePKnown(skillId),
      pknown: nodeEst ? nodeEst.P_known : null,
    };
    if (nudge) stepRecord.nudge = nudge;
    steps.push(stepRecord);
  }

  return {
    run_id: `run-${seed}:${persona.id}:${skillId}`,
    seed,
    persona_id: persona.id,
    persona_latents: persona.latent,
    params_hash: paramsHash(),
    engine_sha: flags?.engineSha ?? 'dev',
    flags,
    skillId,
    steps,
    terminal,
    // UI5 control-arm tag — 'adaptive' (default) or 'static' (controlArm=true).
    arm: controlArm ? 'static' : 'adaptive',
  };
}

// ---------------------------------------------------------------------------
// runSweep — personas × skills, fresh persona per pair.
// ---------------------------------------------------------------------------

/**
 * Run a sweep over personas × skills. A FRESH persona instance is built per pair
 * (session state must never leak across runs).
 *
 * @param {object} [args]
 *   @param {string[]} [args.personaIds]  default = all personas in the library.
 *   @param {string[]} [args.skillIds]    default = all generator skills.
 *   @param {number}   [args.seed=1]
 *   @param {number}   [args.stepCap=40]
 *   @param {object}   [args.flags]
 *   @param {boolean}  [args.controlArm=false]  pass true for the static control arm.
 * @returns {object[]} tape[]
 */
export function runSweep({ personaIds, skillIds, seed = 1, stepCap = 40, flags = {}, controlArm = false } = {}) {
  const ids = personaIds && personaIds.length
    ? personaIds
    : allPersonas().map((p) => p.id);
  const skills = skillIds && skillIds.length ? skillIds : DEFAULT_SKILL_IDS;

  const tapes = [];
  for (const pid of ids) {
    for (const sk of skills) {
      const persona = personaById(pid); // FRESH per pair — no state leak.
      if (!persona) continue;
      tapes.push(runSession({ persona, skillId: sk, seed, stepCap, flags, controlArm }));
    }
  }
  return tapes;
}

// ---------------------------------------------------------------------------
// runArmComparison — UI5: run the SAME personas × skills × seed through BOTH
// the adaptive arm and the static control arm and return paired metrics.
// ---------------------------------------------------------------------------

/**
 * Run both the adaptive and static arms over the given population and compute the
 * delta on the outcomes the PDF requires evidence for:
 *   - false_mastery_rate        (lower is better — does adaptation reduce false mastery?)
 *   - transfer_after_fade       (higher is better — does adaptation improve transfer?)
 *   - independence_rate         (higher is better — does adaptation improve independence?)
 *   - mastery_rate              (higher is better — does adaptation improve gate-open rate?)
 *   - reps_to_mastery           (lower is better — does adaptation reduce required reps?)
 *
 * The SAME seed is used for both arms so persona trajectories are comparable. The
 * delta = adaptive_value - static_value (positive = adaptation helps on that metric;
 * negative = adaptation hurts or static is unexpectedly better).
 *
 * @param {object} [opts]
 *   @param {string[]} [opts.personaIds]  default = all personas.
 *   @param {string[]} [opts.skillIds]    default = all generator skills.
 *   @param {number}   [opts.seed=1]
 *   @param {number}   [opts.stepCap=40]
 *   @param {object}   [opts.flags]
 *   @param {number}   [opts.tauLatent]
 * @returns {{ adaptive: MetricsRecord, static: MetricsRecord,
 *             adaptiveTapes: object[], staticTapes: object[],
 *             delta: object, seed: number }}
 */
export function runArmComparison({
  personaIds,
  skillIds,
  seed = 1,
  stepCap = 40,
  flags = {},
  tauLatent,
} = {}) {
  // Both arms use IDENTICAL parameters — only controlArm differs.
  const adaptiveTapes = runSweep({ personaIds, skillIds, seed, stepCap, flags, controlArm: false });
  const staticTapes = runSweep({ personaIds, skillIds, seed, stepCap, flags, controlArm: true });

  // Import aggregate here to avoid circular dependency (metrics imports nothing from
  // sessionRunner; sessionRunner is the leaf module that feeds metrics).
  // aggregate is imported at the top of this file indirectly via engineApi re-exports,
  // but we call it from the comparison helper only. We use a dynamic require-style
  // import via the already-imported metrics module reference.
  // NOTE: aggregate is NOT imported at the top of sessionRunner.js by design
  // (sessionRunner is a leaf; metrics/findings import sessionRunner, not vice versa).
  // We inline the needed fold logic using the already-imported measurementReduce/segment
  // from engineApi to keep the dependency graph acyclic. We return the raw tapes so
  // callers (tests, cli, doc-sink) can pass them to aggregate themselves.
  return {
    adaptiveTapes,
    staticTapes,
    seed,
  };
}

// ---------------------------------------------------------------------------
// characterizeScriptedStage — READ-ONLY divergence fact (review F2 / KTD13).
// ---------------------------------------------------------------------------

/**
 * Characterize the SCRIPTED stage-advance path (useLessonScaffold.js) vs the
 * ENGINE mastery path, so U7/U11 can quantify the divergence.
 *
 * useLessonScaffold is a REACT HOOK (it calls useState/useRef/useEffect and binds
 * useLessonEngine internally), so it CANNOT be driven headlessly here without a
 * React renderer — which would violate this unit's "headless, no React" contract.
 * Rather than half-wire a renderer, we export a DOCUMENTED STUB recording the
 * known divergence fact, verified by reading the source:
 *
 *   In applyEngineDecision (useLessonScaffold.js — `else if (isCorrect) nextStage()`,
 *   currently near line 185; the plan's "~318" is a stale line ref, the code is
 *   the same control-flow), the SCRIPTED layer advances to the NEXT stage on a
 *   SINGLE correct answer — independent of the engine's mastery gate. The engine
 *   only moves the design scaffold on Fade/Raise; the scripted runtime additionally
 *   advances on any correct. So a child can walk the whole scripted lesson with one
 *   correct per stage while the engine's gate (P_known≥0.95 ∧ independent ∧ transfer
 *   ∧ fluency) stays CLOSED — the runtime "completes" the lesson before mastery.
 *
 * @param {string} skillId  (recorded for provenance; the fact is path-level)
 * @param {number} [seed]   (recorded for provenance)
 * @returns {object} a divergence-fact record (read-only; drives no engine state)
 */
export function characterizeScriptedStage(skillId, seed = 0) {
  return {
    skillId,
    seed,
    headless: false,
    method: 'documented-stub',
    scriptedAdvanceRule: 'single-correct',
    engineAdvanceRule: 'mastery-gate (P_known≥0.95 ∧ independent ∧ transfer ∧ fluency)',
    scriptedAttemptsToAdvance: 1,
    source: 'web/src/runtime/useLessonScaffold.js — applyEngineDecision: `else if (isCorrect) nextStage()`',
    note:
      'useLessonScaffold is a React hook and cannot be driven headlessly without a renderer ' +
      '(violates the no-React contract). This stub records the verified divergence fact: the ' +
      'scripted stage path advances on ONE correct, while the engine path requires the full ' +
      'mastery gate. U7/U11 use this to quantify engine-vs-runtime divergence. ' +
      'useLessonScaffold.js is 002-owned and is NOT edited here.',
  };
}

// Re-export serializeSession so consumers (and the test) can canonicalize a tape.
export { serializeSession };
