// introS1.js — narration cue sheet + transcript for the s1 "Taking Away" intro
// video (public/intros/s1-taking-away.html).
//
// The video is a ~21s hand-animated timeline whose on-screen captions appear at
// fixed timecodes (see the BEATS table in the html). Each cue pairs one beat with:
//   - `gate`:  the second the line's beat begins on screen (matches the caption)
//   - `pause`: a breath (seconds) required AFTER the previous line finishes
//   - `key`:   the pre-baked voice clip, public/voice/<key>.mp3 (s1i_* clips —
//              baked centrally; missing audio DEGRADES gracefully)
//   - `text`:  the transcript line (also the exact words the clip says)
//
// RoomIntro.jsx reads the video's playhead (localStorage[`${STAGE_PERSIST_KEY}:t`])
// and plays/highlights these in sync: a line begins when the playhead passes BOTH
// its `gate` and `prevLineEnd + pause`. Worked example: 5/8 − 2/8 = 3/8 — show 5/8
// as one stack of eighths (red, v_stripe hatch), break it into five unit pieces,
// drag two off into the "used" tray, count the three left, keep the bottom. Keep
// `gate`s aligned with the html BEATS table.

export const STAGE_PERSIST_KEY = "takingaway.v1";
export const INTRO_DURATION = 25;

// gates track the video's BEATS table:
//   one stack of five eighths 1.4, break into five pieces 5.0, take two away 9.5,
//   count three left 14.0, the equation 5/8 − 2/8 = 3/8 at 17.0.
export const INTRO_CUES = [
  { gate: 1.4,  pause: 0,   key: "s1i_stack",  text: "Babushka has five eighths of a loaf — one stack." },
  { gate: 5.3,  pause: 0.5, key: "s1i_break",  text: "Break the stack into five single eighths." },
  { gate: 9.5,  pause: 0.5, key: "s1i_take",   text: "Take two pieces away into the tray." },
  { gate: 14.0, pause: 0.5, key: "s1i_left",   text: "Count what's left: three eighths." },
  { gate: 17.0, pause: 0.5, key: "s1i_keep",   text: "Five eighths minus two eighths is three eighths — keep the bottom the same." },
];
