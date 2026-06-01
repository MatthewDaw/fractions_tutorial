// introR3.js — narration cue sheet + transcript for the R3 "Scale One"
// intro video (public/intros/r3-scale-one.html).
//
// Lesson 2 · Scale One: adding unlike fractions where ONE bottom already fits the
// other. Worked example 3/8 + 1/4 = 5/8 — slice ONLY the quarter into two eighths;
// the three eighths stay exactly as they are (rename just ONE fraction).
//
// The video is a ~38s hand-animated timeline whose on-screen captions appear at
// fixed timecodes (see the BEATS table in the html). Each cue pairs one beat with:
//   - `gate`:  the second the line's beat begins on screen (matches the caption)
//   - `pause`: a breath (seconds) required AFTER the previous line finishes
//   - `key`:   the voice clip to bake, public/voice/<key>.mp3 (NEW r3i_* clips)
//   - `text`:  the transcript line (also the exact words the clip says)
//
// RoomIntro.jsx reads the video's playhead (localStorage[`${STAGE_PERSIST_KEY}:t`])
// and plays/highlights these in sync: a line begins when the playhead passes BOTH
// its `gate` and `prevLineEnd + pause`, so it never talks over the wrong visual nor
// clips the one before. Keep `gate`s aligned with the html BEATS table if the
// timeline changes.

export const STAGE_PERSIST_KEY = "scaleone.v1";
export const INTRO_DURATION = 24;

// gates track the video's BEATS table:
//   two strips 1.5, "quarter is bigger" 4.4, "a quarter is two eighths" 8.7,
//   slice ONLY the quarter 11.5, every piece an eighth 16.7,
//   count 19.2, makes five eighths 22.1.
export const INTRO_CUES = [
  { gate: 1.5,  pause: 0,   key: "r3i_intro",   text: "Three eighths, and one quarter." },
  { gate: 4.4,  pause: 0.5, key: "r3i_bigger",  text: "The quarter is bigger — but eighths fit right inside it." },
  { gate: 8.7,  pause: 0.5, key: "r3i_match",   text: "A quarter is the same as two eighths." },
  { gate: 11.5, pause: 0.5, key: "r3i_slice",   text: "So we slice only the quarter — the three eighths stay just as they are." },
  { gate: 16.7, pause: 0.5, key: "r3i_eighth",  text: "Now every piece is an eighth." },
  { gate: 19.2, pause: 0.5, key: "r3i_count",   text: "Three eighths plus two eighths…" },
  { gate: 22.1, pause: 0.4, key: "r3i_answer",  text: "…makes five eighths." },
];
