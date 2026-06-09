// VoicePredictionBeat.jsx — UI6: the opt-in "say the sum before you stack it" beat.
//
// state-model §10: verbal pre-commitment (saying the predicted answer BEFORE
// manipulating) is a strong anti-pattern-match signal. This is a self-contained
// pre-manipulation beat: it does NOT touch the room stage machine. A room drops
// it in ABOVE the manipulative; when the learner records a prediction it calls
// onPredict(result, signal) and the room continues exactly as before.
//
// Three hard rules (matching the engine/affect invariants):
//   • OPT-IN + non-intrusive: nothing happens until the child presses "Say my
//     guess". We never auto-grab the mic (the stability policy: the system
//     refuses to auto-change the interface). A "Skip" always lets them move on.
//   • GRACEFUL FALLBACK: where the Web Speech API is unavailable (jsdom/tests,
//     unsupported browsers) we render a tiny TYPING field instead, so the beat
//     never blocks the learner. The fallback is the test-covered path.
//   • ADVISORY only: the verdict comes from the deterministic verifier
//     (verifyPrediction → gradeAnswer), never the raw transcript; the result is
//     surfaced to the parent as a pre-commitment SIGNAL, not a mastery input.
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  getSpeechRecognition,
  verifyPrediction,
  predictionSignal,
} from '../runtime/voicePrediction.js';
import '../styles/voicepredict.css';

// recognition phases for the live (mic) path
const IDLE = 'idle';
const LISTENING = 'listening';
const DONE = 'done';

/**
 * @param {object}   props
 * @param {object}   props.problem   the current GeneratedProblem (verified against)
 * @param {(result, signal)=>void} props.onPredict  called once a prediction is
 *        recorded; result = verifyPrediction(...), signal = predictionSignal(...).
 *        The prediction is ADVISORY — the room keeps grading the real attempt.
 * @param {()=>void} [props.onSkip]  the learner opts out of predicting this one.
 * @param {object}   [props.recognitionFactory]  test seam: override the recognizer
 *        constructor (defaults to the Web Speech API when present).
 * @param {()=>number} [props.now]   test seam for latency timing (defaults Date.now).
 */
export default function VoicePredictionBeat({
  problem,
  onPredict,
  onSkip,
  recognitionFactory,
  now = Date.now,
}) {
  const SR = recognitionFactory ?? getSpeechRecognition();
  const voiceAvailable = typeof SR === 'function';

  const [phase, setPhase] = useState(IDLE);
  const [heard, setHeard] = useState('');     // last transcript shown back
  const [typed, setTyped] = useState('');     // fallback typing buffer
  const [outcome, setOutcome] = useState(null); // 'correct' | 'wrong' | 'unrecognized'
  const recRef = useRef(null);
  const startedAtRef = useRef(null);

  // reset whenever a new problem arrives (the beat is per-problem)
  useEffect(() => {
    setPhase(IDLE);
    setHeard('');
    setTyped('');
    setOutcome(null);
    startedAtRef.current = null;
    if (recRef.current) {
      try { recRef.current.abort(); } catch (_) {}
      recRef.current = null;
    }
  }, [problem?.problem_id, problem?.skill, problem?.level, problem?.index]);

  useEffect(() => () => {
    if (recRef.current) { try { recRef.current.abort(); } catch (_) {} }
  }, []);

  // Verify a transcript with the DETERMINISTIC verifier and report up. The raw
  // transcript is never the verdict — verifyPrediction parses it into the answer
  // shape and grades it with gradeAnswer.
  const record = useCallback(
    (transcript) => {
      const result = verifyPrediction(problem, transcript);
      const latencyMs = startedAtRef.current != null ? now() - startedAtRef.current : null;
      const signal = predictionSignal(result, { latencyMs });
      setHeard(result.heard);
      setOutcome(!result.recognized ? 'unrecognized' : result.grade.correct ? 'correct' : 'wrong');
      setPhase(DONE);
      if (typeof onPredict === 'function') onPredict(result, signal);
    },
    [problem, onPredict, now]
  );

  // ---- live mic path (opt-in) ----------------------------------------------
  const startListening = useCallback(() => {
    if (!voiceAvailable) return;
    let rec;
    try {
      rec = new SR();
    } catch (_) {
      // construction failed → behave as unavailable; the fallback typing field
      // is already rendered, so the learner is never blocked.
      return;
    }
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const t = e?.results?.[0]?.[0]?.transcript ?? '';
      record(t);
    };
    rec.onerror = () => { setPhase(IDLE); };
    rec.onend = () => { setPhase((p) => (p === LISTENING ? IDLE : p)); };
    recRef.current = rec;
    startedAtRef.current = now();
    setPhase(LISTENING);
    try { rec.start(); } catch (_) { setPhase(IDLE); }
  }, [voiceAvailable, SR, record, now]);

  const stopListening = useCallback(() => {
    if (recRef.current) { try { recRef.current.stop(); } catch (_) {} }
    setPhase(IDLE);
  }, []);

  // ---- typing fallback path -------------------------------------------------
  const submitTyped = useCallback(() => {
    if (startedAtRef.current == null) startedAtRef.current = now();
    record(typed);
  }, [typed, record, now]);

  if (!problem) return null;

  const outcomeText =
    outcome === 'correct' ? "Nice — let's check it by stacking."
    : outcome === 'wrong' ? "Good guess written down — now let's see what really happens."
    : outcome === 'unrecognized' ? "Didn't catch a number — no worries, let's stack and find out."
    : null;

  return (
    <div className="voicepredict" data-testid="voice-prediction-beat">
      <p className="voicepredict__prompt qcap" data-vox-speaker="cook">
        Before you stack — what do you think the answer is?
      </p>

      {voiceAvailable ? (
        <div className="voicepredict__mic">
          {phase === IDLE && (
            <button
              type="button"
              className="voicepredict__say check"
              onClick={startListening}
            >
              🎤 Say my guess
            </button>
          )}
          {phase === LISTENING && (
            <button
              type="button"
              className="voicepredict__listening check"
              onClick={stopListening}
              aria-live="polite"
            >
              Listening… (tap to stop)
            </button>
          )}
        </div>
      ) : (
        // No Web Speech API (jsdom/tests, unsupported browsers): graceful typing
        // fallback so the beat never blocks the learner.
        <div className="voicepredict__fallback">
          <label className="voicepredict__fallback-label">
            <span>Type your guess</span>
            <input
              type="text"
              className="voicepredict__input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitTyped(); }}
              aria-label="type your predicted answer"
              data-novox=""
            />
          </label>
          <button
            type="button"
            className="voicepredict__guess check"
            onClick={submitTyped}
            disabled={!typed.trim()}
          >
            That's my guess
          </button>
        </div>
      )}

      {heard && (
        <div className="voicepredict__heard">
          You said: <span className="voicepredict__heard-text">{heard}</span>
        </div>
      )}
      {outcomeText && <div className="voicepredict__outcome ribbon">{outcomeText}</div>}

      {onSkip && phase !== DONE && (
        <button
          type="button"
          className="voicepredict__skip"
          onClick={() => onSkip()}
          aria-label="Skip the guess"
        >
          Skip — just stack
        </button>
      )}
    </div>
  );
}
