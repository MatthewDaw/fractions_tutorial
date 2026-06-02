// observation.ts — U2: Observation pipeline (measurement §4.7.4 steps 1 & 2).
//
// segment(log) groups the events between each 'problem_present' and its
// matching 'judged' into a single rich Observation, capturing every available
// input per KTD3.
//
// ENGINE PURITY: NO React imports, NO wall-clock calls. Time arrives only as
// event timestamps (event.t).

import type { Event, Action, Signal, Observation, ErrorSignature, Modality, ScaffoldLevel } from './types.js';
import { PARAMS } from './params.js';

// ---------------------------------------------------------------------------
// Type guards — distinguish Action from Signal
// ---------------------------------------------------------------------------

function isAction(ev: Event): ev is Action {
  return !('confidence' in ev);
}

// ---------------------------------------------------------------------------
// Error-signature classification
//
// Maps slip codes (from momsProblems.gradeAnswer) and structural patterns in
// the submitted answer to the standard misconception taxonomy defined in
// ErrorSignature. This is the single place that bridges slip codes → names.
// ---------------------------------------------------------------------------

/**
 * Classify a wrong answer into an ErrorSignature.
 *
 * @param slipCode  The `slip` field from momsProblems.gradeAnswer, or null.
 * @param answerNum Submitted numerator (may be null/NaN when not a fraction).
 * @param answerDen Submitted denominator.
 * @param targetNum The correct numerator.
 * @param targetDen The correct denominator.
 * @param operands  Optional [[na,da],[nb,db]] from the problem.
 */
export function classifyErrorSignature(
  slipCode: string | null,
  answerNum: number | null,
  answerDen: number | null,
  targetNum: number | null,
  targetDen: number | null,
  operands?: readonly (readonly [number, number])[] | null
): ErrorSignature {
  // ---- slip codes from momsProblems.gradeAnswer ----
  if (slipCode === 'sameBottom') {
    // The child added denominators as well as numerators.
    // Distinguish between:
    //   add_across_unlike — the child added tops AND bottoms when the denominators
    //                        were UNLIKE (e.g. 1/2 + 1/3 → 2/5)
    //   add_denominators  — the same mechanical error but denominators happen to be
    //                        the same (e.g. 2/7 + 3/7 → 5/14), or unlike but the
    //                        specific pattern matches the generic da+db formula.
    if (
      operands &&
      operands.length === 2 &&
      answerDen !== null &&
      answerDen === operands[0][1] + operands[1][1]
    ) {
      const [, da] = operands[0];
      const [, db] = operands[1];
      // Unlike denominators: child treats them as if they were like → add_across_unlike.
      if (da !== db) {
        return 'add_across_unlike';
      }
      // Like denominators: child also added the (equal) bottoms → add_denominators.
      return 'add_denominators';
    }
    // Fallback: treat sameBottom slip as add_denominators.
    return 'add_denominators';
  }

  if (slipCode === 'notSimplified') {
    return 'not_simplified';
  }

  if (slipCode === 'leftoverOnly') {
    return 'forced_leftover';
  }

  // ---- structural pattern matching on the submitted answer ----
  if (
    operands &&
    operands.length === 2 &&
    answerNum !== null &&
    answerDen !== null
  ) {
    const [opA, opB] = operands;
    const [na, da] = opA;
    const [nb, db] = opB;

    // add_across_unlike / add_denominators: child added BOTH tops AND bottoms.
    // pattern: answer = (na+nb) / (da+db)
    // Distinguish by whether the original denominators were unlike.
    if (answerNum === na + nb && answerDen === da + db) {
      // Unlike denominators → add_across_unlike (more specific misconception name).
      // Like denominators → add_denominators (classic same-bottom error).
      return da !== db ? 'add_across_unlike' : 'add_denominators';
    }

    // scaled_bottom_only: child scaled denominator but forgot to scale numerator
    // detects: answer denominator is a multiple of target denominator, but
    // answer numerator was NOT scaled by the same factor.
    if (
      targetNum !== null &&
      targetDen !== null &&
      answerDen !== null &&
      answerDen !== 0 &&
      targetDen !== 0 &&
      answerDen % da === 0 &&
      answerDen % db === 0
    ) {
      // The denominator looks like a valid common denominator, but value is wrong
      const scaleFactor = answerDen / da;
      const expectedNum = na * scaleFactor + nb * (answerDen / db);
      if (answerNum !== expectedNum) {
        return 'scaled_bottom_only';
      }
    }
  }

  // ---- requireSimplified context ----
  if (slipCode === 'notSimplified') {
    return 'not_simplified';
  }

  // ---- forced_leftover: improper→mixed conversion error ----
  if (slipCode === 'wrongValue' && operands === null) {
    // single-operand problems (simplify / mixed) — opaque wrong value
    return 'other';
  }

  // Unknown slip or no structural pattern matched
  if (slipCode && slipCode !== 'wrongValue' && slipCode !== 'fillBoth' && slipCode !== 'fillAll') {
    return 'other';
  }

  return null; // correct, or no recognisable pattern
}

// ---------------------------------------------------------------------------
// Attempt boundary extraction helpers
// ---------------------------------------------------------------------------

interface AttemptBoundary {
  presentIdx: number;
  judgedIdx: number;
}

/**
 * Find all (problem_present, judged) index pairs in the log.
 * Each pair is one attempt boundary.
 */
function findAttemptBoundaries(log: readonly Event[]): AttemptBoundary[] {
  const boundaries: AttemptBoundary[] = [];
  let presentIdx = -1;
  for (let i = 0; i < log.length; i++) {
    const ev = log[i];
    if (!isAction(ev)) continue;
    if (ev.type === 'problem_present') {
      presentIdx = i;
    } else if (ev.type === 'judged' && presentIdx >= 0) {
      boundaries.push({ presentIdx, judgedIdx: i });
      presentIdx = -1; // reset; next present starts a new attempt
    }
  }
  return boundaries;
}

// ---------------------------------------------------------------------------
// Self-correction counter
//
// A self-correction is detected when the same fraction slot oscillates:
// place followed by remove (or vice versa) before the final submit.
// We count oscillations as net back-and-forth pairs.
// ---------------------------------------------------------------------------

function countSelfCorrections(events: readonly Action[]): number {
  // Track the sequence of place/remove actions. Each time the direction
  // reverses (place→remove or remove→place) that is one self-correction.
  let corrections = 0;
  let lastDir: 'place' | 'remove' | null = null;
  for (const ev of events) {
    if (ev.type === 'piece_place' || ev.type === 'piece_add') {
      if (lastDir === 'remove') corrections++;
      lastDir = 'place';
    } else if (ev.type === 'piece_remove' || ev.type === 'piece_lift') {
      if (lastDir === 'place') corrections++;
      lastDir = 'remove';
    }
  }
  return corrections;
}

// ---------------------------------------------------------------------------
// Main segment function
// ---------------------------------------------------------------------------

/**
 * Segment a flat event log into one Observation per attempt.
 *
 * An "attempt" is the span [problem_present ... judged] (inclusive of both
 * endpoints). Events outside any such span are ignored (e.g. navigation or
 * Signal-only spans).
 *
 * Returns observations in chronological order.
 */
export function segment(log: readonly Event[]): Observation[] {
  const boundaries = findAttemptBoundaries(log);
  const observations: Observation[] = [];

  for (const { presentIdx, judgedIdx } of boundaries) {
    const span = log.slice(presentIdx, judgedIdx + 1);

    // Extract only Action events within the span for processing.
    const actions = span.filter(isAction);
    // Collect Signal events for affect_window (currently always empty stub).
    // This seam lets the affect camera inject data here in the future.
    const _signals = span.filter((ev): ev is Signal => !isAction(ev));

    const presentAction = actions.find((a) => a.type === 'problem_present');
    const submitAction = actions.find((a) => a.type === 'answer_submit');
    const judgedAction = actions.find((a) => a.type === 'judged');

    if (!presentAction || !judgedAction) continue;

    // --- latency (time is data) ---
    const latency = submitAction
      ? submitAction.t - presentAction.t
      : judgedAction.t - presentAction.t;

    // --- hint_max_rung ---
    const hintActions = actions.filter((a) => a.type === 'hint_shown');
    const hint_max_rung = hintActions.reduce((max, a) => {
      const rung = typeof a.payload['rung'] === 'number' ? a.payload['rung'] : 0;
      return Math.max(max, rung);
    }, 0);

    // --- self_corrections from place/remove oscillation ---
    const self_corrections = countSelfCorrections(actions);

    // --- scaffold_level from present event ---
    const rawScaffold = presentAction.payload['scaffold_level'];
    const scaffold_level: ScaffoldLevel =
      rawScaffold === 0 || rawScaffold === 1 || rawScaffold === 2 ||
      rawScaffold === 3 || rawScaffold === 4
        ? (rawScaffold as ScaffoldLevel)
        : 0;

    // --- modality from submit or present event ---
    const modality: Modality =
      (submitAction?.modality ?? presentAction.modality) as Modality;

    // --- recognizer_confidence (handwriting only) ---
    const recognizer_confidence: number | null =
      modality === 'handwriting'
        ? typeof submitAction?.payload['recognizer_confidence'] === 'number'
          ? (submitAction.payload['recognizer_confidence'] as number)
          : 0.5 // default when handwriting but confidence not recorded
        : null;

    // --- correct + answer_value from judged event ---
    const correct = judgedAction.payload['correct'] === true;
    const rawAnswerNum = judgedAction.payload['answer_num'];
    const rawAnswerDen = judgedAction.payload['answer_den'];
    const rawAnswerValue = judgedAction.payload['answer_value'];
    const answer_value: [number, number] | null =
      typeof rawAnswerNum === 'number' && typeof rawAnswerDen === 'number'
        ? [rawAnswerNum, rawAnswerDen]
        : Array.isArray(rawAnswerValue) &&
          typeof rawAnswerValue[0] === 'number' &&
          typeof rawAnswerValue[1] === 'number'
          ? [rawAnswerValue[0], rawAnswerValue[1]]
          : null;

    // --- error_signature ---
    let error_signature: ErrorSignature = null;
    if (!correct) {
      const slipCode =
        typeof judgedAction.payload['slip'] === 'string'
          ? (judgedAction.payload['slip'] as string)
          : null;
      const targetNum =
        typeof judgedAction.payload['target_num'] === 'number'
          ? (judgedAction.payload['target_num'] as number)
          : null;
      const targetDen =
        typeof judgedAction.payload['target_den'] === 'number'
          ? (judgedAction.payload['target_den'] as number)
          : null;
      const rawOperands = judgedAction.payload['operands'];
      const operands: readonly (readonly [number, number])[] | null =
        Array.isArray(rawOperands) ? (rawOperands as (readonly [number, number])[]) : null;

      error_signature = classifyErrorSignature(
        slipCode,
        answer_value ? answer_value[0] : null,
        answer_value ? answer_value[1] : null,
        targetNum,
        targetDen,
        operands
      );
    }

    // --- too_fast_correct ---
    const too_fast_correct = correct && latency < PARAMS.latencyFloorMs;

    // --- problem_id + surface_form (emission seam; judged payload first, then present) ---
    const jPid = judgedAction.payload['problem_id'];
    const pPid = presentAction.payload['problem_id'];
    const problem_id: string | undefined =
      typeof jPid === 'string' ? jPid : typeof pPid === 'string' ? pPid : undefined;
    const jSf = judgedAction.payload['surface_form'];
    const pSf = presentAction.payload['surface_form'];
    const surface_form: string | undefined =
      typeof jSf === 'string' ? jSf : typeof pSf === 'string' ? pSf : undefined;

    // --- affect_window: typed stub, always empty (seam for the camera) ---
    const affect_window: readonly never[] = [];

    observations.push({
      correct,
      answer_value,
      error_signature,
      latency,
      hint_max_rung,
      self_corrections,
      scaffold_level,
      modality,
      recognizer_confidence,
      too_fast_correct,
      problem_id,
      surface_form,
      affect_window,
    });
  }

  return observations;
}
