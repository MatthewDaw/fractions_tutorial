// RailReadAloud — the compact "Read aloud" pill that lives at the TOP of the
// rail column (Wave-F shell decision A). This is the app port of the wireframe's
// `READ_ALOUD` const (LessonScreen.jsx:38-43), injected as the rail's first
// child and styled by `wf-shell.css:251-257` to sit flush top-left.
//
// It replaces the speaker button that used to live on the (now-deleted) goal
// banner (LessonGoal.jsx:18-21). Same voice wiring, new home.
//
// Props:
//   say       — the voice fn; clicking calls say(voiceKey).
//   speaking  — animates the icon while narration plays.
//   voiceKey  — the line to speak.
//   className — extra classes on the button.
import React from "react";

export default function RailReadAloud({ say, speaking, voiceKey, className = "" }) {
  return (
    <button
      type="button"
      className={"speaker wf-rail-speaker" + (speaking ? " speaking" : "") + (className ? " " + className : "")}
      onClick={() => say(voiceKey)}
    >
      <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true">
        <path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)" />
        <path d="M11 4 Q14 7 11 10" stroke="var(--red)" strokeWidth="1.4" fill="none" />
      </svg>
      Read aloud
    </button>
  );
}
