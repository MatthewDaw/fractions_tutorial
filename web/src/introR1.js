// introR1.js — narration cue sheet + transcript for the R1 "Same Denominators"
// intro video (public/intros/r1-same-denominators.html).
//
// The video is a ~36s hand-animated timeline whose on-screen captions appear at
// fixed timecodes (see the BEATS table in the html). Each cue pairs one beat with:
//   - `gate`:  the second the line's beat begins on screen (matches the caption)
//   - `pause`: a breath (seconds) required AFTER the previous line finishes
//   - `key`:   the pre-baked voice clip, public/voice/<key>.mp3 (r1i_* clips)
//   - `text`:  the transcript line (also the exact words the clip says)
//
// RoomIntro.jsx reads the video's playhead (localStorage[`${STAGE_PERSIST_KEY}:t`])
// and plays/highlights these in sync: a line begins when the playhead passes BOTH
// its `gate` and `prevLineEnd + pause`, so it never talks over the wrong visual nor
// clips the one before. Worked example: 2/7 + 3/7 = 5/7 (same denominator).
// Keep `gate`s aligned with the html BEATS table if that timeline changes.

export const STAGE_PERSIST_KEY = "samedenom.v1";
export const INTRO_DURATION = 26;

// gates track the video's BEATS table:
//   two stacks (tops level) 1.5, drop to floor / line up 5.0, push together 8.5,
//   count one..five 11.5, bottom stays seven 16.0, makes five sevenths 19.0.
export const INTRO_CUES = [
  { gate: 1.5,  pause: 0,   key: "r1i_intro",  text: "Two sevenths here, and three sevenths here." },
  { gate: 5.0,  pause: 0.5, key: "r1i_match",  text: "Every piece is the same size — they line up." },
  { gate: 8.5,  pause: 0.5, key: "r1i_push",   text: "Push them together into one stack." },
  { gate: 11.5, pause: 0.5, key: "r1i_count",  text: "Count the pieces… one, two, three, four, five." },
  { gate: 16.0, pause: 0.5, key: "r1i_bottom", text: "The bottom number stays seven." },
  { gate: 19.0, pause: 0.5, key: "r1i_answer", text: "Two sevenths plus three sevenths makes five sevenths." },
];
