// introR5.js — narration cue sheet + transcript for the R5 "Mixed Numbers"
// intro video (public/intros/r5-mixed-numbers.html).
//
// The video is a ~36s hand-animated timeline whose on-screen captions appear at
// fixed timecodes (see the BEATS table in the html). Each cue pairs one beat with:
//   - `gate`:  the second the line's beat begins on screen (matches the caption)
//   - `pause`: a breath (seconds) required AFTER the previous line finishes
//   - `key`:   the pre-baked voice clip, public/voice/<key>.mp3 (r5i_* clips)
//   - `text`:  the transcript line (also the exact words the clip says)
//
// RoomIntro.jsx reads the video's playhead (localStorage[`${STAGE_PERSIST_KEY}:t`])
// and plays/highlights these in sync: a line begins when the playhead passes BOTH
// its `gate` and `prevLineEnd + pause`, so it never talks over the wrong visual nor
// clips the one before. Keep `gate`s aligned with the html BEATS table if that
// timeline changes.
//
// Lesson 5 · Mixed Numbers — worked example nine sevenths (9/7) → one and two
// sevenths (1 2/7). The video stacks nine indigo sevenths on a 0→2 ruler: the
// stack overflows past the "1 whole" line, the lower seven snap shut into one
// whole, and two sevenths are left over.

export const STAGE_PERSIST_KEY = "mixed.v1";
export const INTRO_DURATION = 21;

// gates track the video's BEATS table:
//   stack 1.5, overflow 5.4, seven-make-a-whole 8.5, snap-shut 10.9,
//   two-left-over 14.7, mixed-number answer 17.3.
export const INTRO_CUES = [
  { gate: 1.5,  pause: 0,   key: "r5i_stack",    text: "Here are nine sevenths — a tall stack of pieces." },
  { gate: 5.4,  pause: 0.5, key: "r5i_overflow", text: "Look — it climbs right past one whole." },
  { gate: 8.5,  pause: 0.5, key: "r5i_seven",    text: "Seven sevenths make one whole." },
  { gate: 10.9, pause: 0.5, key: "r5i_snap",     text: "Group those seven, and they snap into one whole." },
  { gate: 14.7, pause: 0.5, key: "r5i_left",     text: "And two sevenths are left over." },
  { gate: 17.3, pause: 0.5, key: "r5i_answer",   text: "So nine sevenths is one whole and two sevenths." },
];
