// voicePrediction.js — UI6: the voice-prediction PARSE + VERIFY core (pure).
//
// state-model §10 build-seq item 3: "Voice prediction: say the sum before
// stacking — verbal pre-commitment is a strong anti-pattern-match signal." The
// learner SAYS their predicted answer BEFORE manipulating; we transcribe it,
// parse the spoken number(s), and verify against the expected answer.
//
// TWO HARD INVARIANTS:
//   1. We NEVER reinvent grading. parseSpoken*() only turns a transcript into the
//      SAME answer shape the typing input produces ({num,den} / {value}); the
//      verdict comes from the existing deterministic gradeAnswer (generators/
//      grade.js). The raw transcript never decides correctness.
//   2. The prediction is ADVISORY. predictionSignal() derives a pre-commitment
//      read (was the pre-answer wrong-but-fast-and-confident — an anti-pattern-
//      match flag) for the engine/affect side as a SIGNAL only. It is not a
//      mastery input and never bypasses the gate; the real attempt is graded
//      later when the learner actually submits.
//
// Detection lives here too (getSpeechRecognition) so the UI and tests share one
// source of truth — jsdom has no SpeechRecognition, so the typing fallback path
// is what the tests exercise.
import { gradeAnswer, answerShape } from '../generators/grade.js';

// ---------------------------------------------------------------------------
// Web Speech API detection (no side effects; never grabs the mic)
// ---------------------------------------------------------------------------

/**
 * The Web Speech recognition constructor, or null where unavailable
 * (jsdom/tests, browsers without it). Reading this NEVER starts the mic — the UI
 * decides, opt-in, whether to construct + start a recognizer.
 *
 * @param {object} [scope] window-like object (defaults to globalThis); injectable for tests.
 * @returns {Function|null}
 */
export function getSpeechRecognition(scope) {
  const w = scope || (typeof globalThis !== 'undefined' ? globalThis : undefined);
  if (!w) return null;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/** True when a real speech recognizer is available (else the typing fallback is used). */
export function isVoiceInputAvailable(scope) {
  return getSpeechRecognition(scope) != null;
}

// ---------------------------------------------------------------------------
// Spoken-number parsing — transcript → number (digits OR number words)
// ---------------------------------------------------------------------------

const ONES = {
  zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90,
};

// Ordinal/denominator words → the value they name (used for the bottom of a
// spoken fraction, e.g. "three FOURTHS", "two THIRDS", "one HALF").
const ORDINALS = {
  half: 2, halves: 2, third: 3, thirds: 3, fourth: 4, fourths: 4, quarter: 4,
  quarters: 4, fifth: 5, fifths: 5, sixth: 6, sixths: 6, seventh: 7, sevenths: 7,
  eighth: 8, eighths: 8, ninth: 9, ninths: 9, tenth: 10, tenths: 10,
  eleventh: 11, twelfth: 12, twelfths: 12,
};

const normalize = (s) =>
  String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9/\s.-]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Parse the leading whole-number value from a run of tokens, consuming as many
 * as form one number. Returns { value, used } or null. Handles digits and word
 * forms up to "ninety-nine" (e.g. "twenty four" → 24, "forty" → 40).
 */
function readWhole(tokens, start) {
  let i = start;
  let total = null;
  // a bare digit run
  if (i < tokens.length && /^\d+$/.test(tokens[i])) {
    return { value: parseInt(tokens[i], 10), used: 1 };
  }
  // word form: [tens] [ones]  OR  [ones]  OR  [teen]
  if (i < tokens.length && tokens[i] in TENS) {
    total = TENS[tokens[i]];
    i++;
    if (i < tokens.length && tokens[i] in ONES && ONES[tokens[i]] < 10) {
      total += ONES[tokens[i]];
      i++;
    }
    return { value: total, used: i - start };
  }
  if (i < tokens.length && tokens[i] in ONES) {
    return { value: ONES[tokens[i]], used: 1 };
  }
  return null;
}

/**
 * Parse a spoken/typed transcript into a single non-negative integer, or null.
 * Accepts "12", "twelve", "twenty four". Picks the FIRST parseable number.
 */
export function parseSpokenInteger(transcript) {
  const norm = normalize(transcript).replace(/-/g, ' ');
  const tokens = norm.split(' ').filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    const w = readWhole(tokens, i);
    if (w) return w.value;
  }
  return null;
}

/**
 * Parse a spoken/typed transcript into a fraction {num, den}, or null.
 * Accepts:
 *   "3/4", "three fourths", "three quarters", "one half", "two over three",
 *   a bare whole ("five" → 5/1, so a whole-number sum can be spoken too).
 */
export function parseSpokenFraction(transcript) {
  const norm = normalize(transcript);

  // digit form "a/b"
  const slash = norm.match(/(\d+)\s*\/\s*(\d+)/);
  if (slash) return { num: parseInt(slash[1], 10), den: parseInt(slash[2], 10) };

  const tokens = norm.replace(/-/g, ' ').split(' ').filter(Boolean);

  // "<num> over <den>"
  const overIdx = tokens.indexOf('over');
  if (overIdx > 0) {
    const top = readWhole(tokens, 0);
    const bot = readWhole(tokens, overIdx + 1);
    if (top && bot && bot.value > 0) return { num: top.value, den: bot.value };
  }

  // "<num> <ordinal-denominator>"  e.g. "three fourths", "one half"
  const top = readWhole(tokens, 0);
  if (top) {
    for (let i = top.used; i < tokens.length; i++) {
      if (tokens[i] in ORDINALS) {
        return { num: top.value, den: ORDINALS[tokens[i]] };
      }
    }
    // a bare whole spoken as a sum → treat as value/1
    return { num: top.value, den: 1 };
  }
  return null;
}

/**
 * Turn a transcript into the answer object the skill's gradeAnswer expects.
 * Mirrors the typing-input shapes in GenPracticeBoard so the SAME verifier runs.
 * Returns null when nothing parseable was heard.
 *
 *   fraction → { num, den }
 *   integer  → { value }
 *   (mixed / relation are NOT voice-target shapes — return null so the beat is
 *    skipped for those skills and the learner just uses the existing input.)
 *
 * @param {string} skill
 * @param {string} transcript
 */
export function transcriptToAnswer(skill, transcript) {
  const shape = answerShape(skill);
  if (shape === 'integer') {
    const v = parseSpokenInteger(transcript);
    return v == null ? null : { value: v };
  }
  if (shape === 'fraction') {
    return parseSpokenFraction(transcript);
  }
  // 'mixed' / 'relation' have no natural single-utterance form here.
  return null;
}

/** Skills this beat supports as a spoken prediction (single number / fraction). */
export function supportsVoicePrediction(skill) {
  const shape = answerShape(skill);
  return shape === 'integer' || shape === 'fraction';
}

// ---------------------------------------------------------------------------
// Verify (reuse the deterministic grader) + advisory pre-commitment signal
// ---------------------------------------------------------------------------

/**
 * Verify a transcript against the problem's expected answer using the EXISTING
 * deterministic verifier (gradeAnswer). The raw transcript never decides the
 * verdict — it is only parsed into the canonical answer shape first.
 *
 * @param {object} problem  a GeneratedProblem
 * @param {string} transcript
 * @returns {{
 *   heard: string, parsed: object|null, recognized: boolean,
 *   grade: { correct: boolean, stars: number, errorSignature: string|null } | null
 * }}
 */
export function verifyPrediction(problem, transcript) {
  const parsed = transcriptToAnswer(problem.skill, transcript);
  if (!parsed) {
    return { heard: String(transcript ?? ''), parsed: null, recognized: false, grade: null };
  }
  const grade = gradeAnswer(problem, parsed);
  return { heard: String(transcript ?? ''), parsed, recognized: true, grade };
}

// A pre-commitment that is BOTH wrong and fast is the anti-pattern-match flag
// the state-model calls out (confident wrong guess). Mirrors the engine's own
// latencyFloor notion of "too fast" without importing engine PARAMS into the UI
// layer (kept advisory + UI-local on purpose).
const PRECOMMIT_FAST_MS = 1500;

/**
 * Derive the ADVISORY pre-commitment signal from a verified prediction. This is
 * a Signal-shaped read for the engine/affect side, NOT a graded mastery input —
 * it never enters the gate and never substitutes for the real submitted attempt.
 *
 * @param {object} result        a verifyPrediction() result
 * @param {object} [opts]
 * @param {number} [opts.latencyMs]  time from prompt-shown to spoken prediction
 * @returns {{
 *   kind: 'voice_prediction', advisory: true, recognized: boolean,
 *   predictedCorrect: boolean|null, latencyMs: number|null,
 *   antiPatternMatch: boolean
 * }}
 */
export function predictionSignal(result, opts = {}) {
  const latencyMs = Number.isFinite(opts.latencyMs) ? opts.latencyMs : null;
  const predictedCorrect = result && result.grade ? !!result.grade.correct : null;
  // anti-pattern-match: a confident (fast) WRONG pre-answer. Only flagged when we
  // actually recognized + graded the prediction as wrong AND it came fast.
  const antiPatternMatch =
    predictedCorrect === false && latencyMs != null && latencyMs < PRECOMMIT_FAST_MS;
  return {
    kind: 'voice_prediction',
    advisory: true,
    recognized: !!(result && result.recognized),
    predictedCorrect,
    latencyMs,
    antiPatternMatch,
  };
}
