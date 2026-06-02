// introCmp.js — narration cue sheet + transcript for the cmp "Compare & Check"
// intro video (public/intros/cmp-compare-check.html).
//
// The video is a ~21s hand-animated timeline whose on-screen captions appear at
// fixed timecodes (see the BEATS table in the html). Each cue pairs one beat with:
//   - `gate`:  the second the line's beat begins on screen (matches the caption)
//   - `pause`: a breath (seconds) required AFTER the previous line finishes
//   - `key`:   the pre-baked voice clip, public/voice/<key>.mp3 (cmpi_* clips —
//              baked centrally; missing audio DEGRADES gracefully)
//   - `text`:  the transcript line (also the exact words the clip says)
//
// RoomIntro.jsx reads the video's playhead (localStorage[`${STAGE_PERSIST_KEY}:t`])
// and plays/highlights these in sync: a line begins when the playhead passes BOTH
// its `gate` and `prevLineEnd + pause`. Worked example: 3/8 vs 5/8 on two stacked
// 0→1 lines (same scale, eighths/red fill bars) — the farther-right bar is bigger,
// reveal "<", then check against the ½ benchmark tick. Keep `gate`s aligned with
// the html BEATS table.

export const STAGE_PERSIST_KEY = "comparecheck.v1";
export const INTRO_DURATION = 21;

// gates track the video's BEATS table:
//   two amounts on the same scale 1.4, longer bar reaches farther 5.0,
//   3/8 is less than 5/8 (drop the < sign) 9.0, 3/8 < 5/8 13.0, the ½ check 16.5.
export const INTRO_CUES = [
  { gate: 1.4,  pause: 0,   key: "cmpi_two",   text: "Two amounts on the same scale: three eighths and five eighths." },
  { gate: 5.0,  pause: 0.5, key: "cmpi_far",   text: "Same-size pieces — the longer bar reaches farther right." },
  { gate: 9.0,  pause: 0.5, key: "cmpi_less",  text: "So three eighths is less than five eighths." },
  { gate: 13.0, pause: 0.5, key: "cmpi_fewer", text: "Three eighths is less than five eighths — fewer pieces is less." },
  { gate: 16.5, pause: 0.5, key: "cmpi_half",  text: "Check against the one-half mark: three eighths falls short, five eighths clears it." },
];
