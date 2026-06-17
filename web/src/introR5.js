// introR5.js — narration cue sheet + transcript for the R5 "Mixed Numbers"
// intro video (public/intros/r5-mixed-numbers.html).
//
// The video is a ~25s hand-animated timeline whose on-screen captions appear at
// fixed timecodes (see the BEATS table in the html). Each cue pairs one beat with:
//   - `gate`:  the second the line's beat begins on screen (matches the caption)
//   - `pause`: a breath (seconds) required AFTER the previous line finishes
//   - `key`:   the pre-baked voice clip, public/voice/<key>.mp3 (r5q_* clips)
//   - `text`:  the transcript line (also the exact words the clip says)
//
// RoomIntro.jsx reads the video's playhead (localStorage[`${STAGE_PERSIST_KEY}:t`])
// and plays/highlights these in sync: a line begins when the playhead passes BOTH
// its `gate` and `prevLineEnd + pause`, so it never talks over the wrong visual nor
// clips the one before. Keep `gate`s aligned with the html BEATS table if that
// timeline changes.
//
// Lesson · Mixed Numbers — worked example seven quarters (7/4) → one and three
// quarters (1¾). The video stacks seven teal quarters on a 0→2 ruler: the stack
// overflows past the "1 whole" line, the lower four snap shut into one whole, and
// three quarters are left over.

export const STAGE_PERSIST_KEY = "mixed.v1";
export const INTRO_DURATION = 25;

// gates track the video's BEATS table:
//   stack 1.5, past 5.3, four 8.7, whole 11.7, left 15.9, answer 18.9.
export const INTRO_CUES = [
  { gate: 1.5,  pause: 0,   key: "r5q_stack",  text: "Seven quarters — a tall stack of fourths." },
  { gate: 5.3,  pause: 0.5, key: "r5q_past",   text: "It climbs right past one whole." },
  { gate: 8.7,  pause: 0.5, key: "r5q_four",   text: "Four quarters make one whole." },
  { gate: 11.7, pause: 0.5, key: "r5q_whole",  text: "Group those four — they snap into one." },
  { gate: 15.9, pause: 0.5, key: "r5q_left",   text: "Three quarters are left over." },
  { gate: 18.9, pause: 0.5, key: "r5q_answer", text: "So seven fourths is one and three quarters." },
];
