// introNum.js — narration cue sheet + transcript for the num "The Top Number"
// intro video (public/intros/num-top-number.html).
//
// The video is a ~26s hand-animated timeline whose on-screen captions appear at
// fixed timecodes (see the BEATS table in the html). Each cue pairs one beat with:
//   - `gate`:  the second the line's beat begins on screen (matches the caption)
//   - `pause`: a breath (seconds) required AFTER the previous line finishes
//   - `key`:   the pre-baked voice clip, public/voice/<key>.mp3 (numi_* clips —
//              baked centrally; missing audio DEGRADES gracefully)
//   - `text`:  the transcript line (also the exact words the clip says)
//
// RoomIntro.jsx reads the video's playhead (localStorage[`${STAGE_PERSIST_KEY}:t`])
// and plays/highlights these in sync: a line begins when the playhead passes BOTH
// its `gate` and `prevLineEnd + pause`. Worked example: 5/8 — show one whole cut
// into eight equal pieces (red, v_stripe hatch), shade five left to right, float
// the numerator 5 above the shaded run, emphasize the denominator 8, read 5/8.
// Keep `gate`s aligned with the html BEATS table.

export const STAGE_PERSIST_KEY = "topnumber.v1";
export const INTRO_DURATION = 26;

// gates track the video's BEATS table:
//   cut into eight pieces 1.4, shade five 6.0, the top number five 13.0,
//   the bottom number eight 18.0, read five eighths 5/8 at 22.0.
export const INTRO_CUES = [
  { gate: 1.4,  pause: 0,   key: "numi_cut",    text: "One whole, cut into 8 equal pieces." },
  { gate: 6.0,  pause: 0.5, key: "numi_shade",  text: "Shade the pieces you have — one, two, three, four, five." },
  { gate: 13.0, pause: 0.5, key: "numi_top",    text: "The top number counts the shaded pieces — five." },
  { gate: 18.0, pause: 0.5, key: "numi_bottom", text: "The bottom number is how many pieces in all — eight." },
  { gate: 22.0, pause: 0.5, key: "numi_read",   text: "Five shaded out of eight — that's five eighths." },
];
