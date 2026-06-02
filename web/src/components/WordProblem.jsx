// WordProblem.jsx — the Stage-5 beat: Babushka's recipe told in plain language, with a
// Read-aloud affordance and a Slate the child HANDWRITES the answer into. No bars,
// no given equation — the child reads the story, finds the fractions in words, and
// writes the total. The lesson supplies the verify logic via onCheck(values).
//
// PROPS:
//   story     : string | ReactNode — the plain-language story (put the fractions in
//               words, e.g. "two fifths ... one fifth"). <b> in markup is styled red.
//   tag       : string — the small uppercase card label (default "Babushka's Recipe")
//   readAloud : optional () => void — called by the Read-aloud button. If omitted,
//               we read `story` (when it's a string) via the shared useVoice() hook,
//               which itself falls back to Web Speech when no clip exists.
//   speaking  : optional boolean — drive the speaker pulse when the parent owns voice
//   answerLead: string — prompt above the Slate (default "Write the total")
//   slots/values/onChange/layout/den/disabled/autoFocusKey — forwarded to <Slate>
//               so the lesson controls the handwritten answer. If you'd rather supply
//               your own answer surface, pass `children` and it renders in place of
//               the built-in Slate.
//   onCheck(values) — the lesson's verifier; called with the current `values` (or
//               with no args when you drive your own children).
//   checkLabel: string — Check button text (default "Check")
//   checkDisabled : boolean
//
// Accessibility: numeric handwriting + tap fallback (via Slate), large targets,
// prefers-reduced-motion (slate.css), denominator colors. stopVoice() runs on
// unmount through useVoice(), so leaving the beat never leaves audio playing.
import React from "react";
import Slate from "./Slate.jsx";
import { useVoice } from "../voice.js";
import "../styles/slate.css";

// small speaker glyph, matching the lesson's Read-aloud affordance
function SpeakerIcon() {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true">
      <path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)" />
      <path d="M11 4 Q14 7 11 10" stroke="var(--red)" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

export default function WordProblem({
  story,
  tag = "Babushka's Recipe",
  readAloud,
  speaking,
  answerLead = "Write the total",
  // optional SETUP region rendered above the answer — the word→math translation
  // surface (an <ExpressionSlate>). On Applied it's a required gate; on the final
  // Words stage it's an optional scratch. WordProblem just renders it; the room
  // owns whether it gates the answer (via the answer's `disabled`) and grading.
  setup,
  setupLead = "Write the question in symbols",
  // Slate passthrough (the built-in answer surface)
  slots,
  values = {},
  onChange = () => {},
  layout = "fraction",
  den,
  disabled = false,
  autoFocusKey,
  // custom answer surface (overrides the built-in Slate)
  children,
  // verify
  onCheck = () => {},
  checkLabel = "Check",
  checkDisabled = false,
  className = "",
}) {
  // Own a voice instance only for the default Read-aloud path; if the parent
  // passes `readAloud` we defer to it (and its own `speaking` flag).
  const voice = useVoice();
  const ownSpeaking = readAloud ? speaking : voice.speaking;

  function onRead() {
    if (readAloud) { readAloud(); return; }
    if (typeof story === "string") voice.say(story);
  }

  function onSubmit() {
    if (!checkDisabled) onCheck(values);
  }

  // Render the story: a string drops straight in (so <b> in copy isn't possible
  // unless passed as a node); a node renders as-is.
  return (
    <div className={"wp" + (className ? " " + className : "")}>
      <div className="wp-card">
        <div className="wp-card-head">
          <span className="wp-tag">{tag}</span>
          <button
            type="button"
            className={"wp-readaloud" + (ownSpeaking ? " speaking" : "")}
            onClick={onRead}
            aria-label="Read the recipe aloud"
          >
            <SpeakerIcon />
            Read aloud
          </button>
        </div>
        <p className="wp-story">{story}</p>
      </div>

      {setup != null && (
        <div className="wp-setup">
          {setupLead && <span className="wp-setup-lead">{setupLead}</span>}
          <div className="wp-setup-row">{setup}</div>
        </div>
      )}

      <div className="wp-answer">
        <span className="wp-answer-lead">{answerLead}</span>
        <div className="wp-answer-row">
          {children != null ? (
            children
          ) : (
            <Slate
              slots={slots || []}
              values={values}
              onChange={onChange}
              onSubmit={onSubmit}
              layout={layout}
              den={den}
              disabled={disabled}
              autoFocusKey={autoFocusKey}
              ariaLabel="write the total"
            />
          )}
          {/* The built-in Check belongs to the built-in Slate. When a caller passes
              its own `children` answer surface, it owns its own controls — rendering
              this button too would leave a second, inert Check beside theirs. */}
          {children == null && (
            <button
              type="button"
              className="wp-check"
              onClick={() => onCheck(values)}
              disabled={checkDisabled}
            >{checkLabel}</button>
          )}
        </div>
      </div>
    </div>
  );
}
