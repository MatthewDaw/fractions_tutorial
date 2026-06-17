// introR4.js — narration cue sheet + transcript for the R4 "Equivalent
// Fractions" intro video (public/intros/r4-simplify.html — filename kept).
//
// The video is a ~26s hand-animated timeline whose on-screen captions appear at
// fixed timecodes (see the BEATS table in the html). Each cue pairs one beat with:
//   - `gate`:  the second the line's beat begins on screen (matches the caption)
//   - `pause`: a breath (seconds) required AFTER the previous line finishes
//   - `key`:   the pre-baked voice clip, public/voice/<key>.mp3 (r4e_* clips)
//   - `text`:  the transcript line (also the exact words the clip says, and the
//              exact words the matching #caption .cap shows)
//
// RoomIntro.jsx reads the video's playhead (localStorage[`${STAGE_PERSIST_KEY}:t`])
// and plays/highlights these in sync: a line begins when the playhead passes BOTH
// its `gate` and `prevLineEnd + pause`, so it never talks over the wrong visual nor
// clips the one before. Keep `gate`s aligned with the html BEATS table if that
// timeline changes. The html's `var PERSIST` MUST equal STAGE_PERSIST_KEY below.

export const STAGE_PERSIST_KEY = "simplify.v1";
export const INTRO_DURATION = 31;

// gates track the video's BEATS table; each is set so a line never starts before
// the previous clip (+breath) finishes, and the duration leaves the final line
// room to complete. Keep in lockstep with the html BEATS table if it changes.
// gates are aligned to the html BEATS table in r4-simplify.html.
// knife ×2 slides in at 6.0 → cut at 7.0 → exits 7.7; knife ×3 at 17.2 → cut 18.2 → exits 18.9.
// Gates spaced so each clip finishes (+~0.6s breath) before the next beat fires, so
// the narration lands ON its visual instead of drifting behind it (was the rushed feel).
export const INTRO_CUES = [
  { gate: 1.5,  pause: 0.3, key: "r4e_intro", text: "One third — one of three equal pieces." },
  { gate: 6.0,  pause: 0.5, key: "r4e_cut2",  text: "Cut each piece in two." },
  { gate: 8.5,  pause: 0.5, key: "r4e_six",   text: "Now six pieces, and two are shaded." },
  { gate: 12.7, pause: 0.5, key: "r4e_same2", text: "Same amount — two sixths equals one third." },
  { gate: 17.2, pause: 0.5, key: "r4e_cut3",  text: "Cut each third into three instead." },
  { gate: 20.7, pause: 0.5, key: "r4e_nine",  text: "Nine pieces, three shaded — three ninths." },
  { gate: 25.5, pause: 0.5, key: "r4e_same",  text: "Same red strip — one third, two sixths, three ninths." },
];
