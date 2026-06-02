// LessonGoal — the ONE goal banner: a "Read aloud" speaker button + the voiced
// goal caption. Replaces the identical <div className="goal">…</div> block every
// lesson inlined; only the voice key, the bold copy, and an optional namespaced
// className on the text ever differed.
//
// Props:
//   say        — the voice fn; clicking the speaker calls say(voiceKey).
//   speaking   — animates the speaker icon while narration plays.
//   voiceKey   — the line to speak; also the data-vox attribute for tap-to-read.
//   voxSpeaker — data-vox-speaker (which character voice reads the caption).
//   className  — extra class on .goal-text (e.g. "m1-goal-text").
//   children   — the caption copy (may include <b>…</b>).
import React from "react";

export default function LessonGoal({ say, speaking, voiceKey, voxSpeaker, className = "", children }) {
  return (
    <div className="goal">
      <button className={"speaker" + (speaking ? " speaking" : "")} onClick={() => say(voiceKey)}>
        <svg width="16" height="14" viewBox="0 0 16 14"><path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)" /><path d="M11 4 Q14 7 11 10" stroke="var(--red)" strokeWidth="1.4" fill="none" /></svg>
        Read aloud
      </button>
      <div className={"goal-text" + (className ? " " + className : "")} data-vox={voiceKey} data-vox-speaker={voxSpeaker}>
        {children}
      </div>
    </div>
  );
}
