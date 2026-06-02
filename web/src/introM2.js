// introM2.js — narration cue sheet + transcript for the m2 "Baking Trays" intro
// video (public/intros/m2-baking-trays.html).
//
// The video is a ~24s hand-animated timeline whose on-screen captions appear at
// fixed timecodes (see the BEATS table in the html). Each cue pairs one beat with:
//   - `gate`:  the second the line's beat begins on screen (matches the caption)
//   - `pause`: a breath (seconds) required AFTER the previous line finishes
//   - `key`:   the pre-baked voice clip, public/voice/<key>.mp3 (m2i_* clips —
//              added centrally in a later phase; missing audio degrades gracefully)
//   - `text`:  the transcript line (also the exact words the clip says)
//
// RoomIntro.jsx reads the video's playhead (localStorage[`${STAGE_PERSIST_KEY}:t`])
// and plays/highlights these in sync: a line begins when the playhead passes BOTH
// its `gate` and `prevLineEnd + pause`. Worked example: 4 × 6 = 24 (a tray).
// Keep `gate`s aligned with the html BEATS table if that timeline changes.

export const STAGE_PERSIST_KEY = "arrays.v1";
export const INTRO_DURATION = 24;

// gates track the video's BEATS table:
//   loose buns (messy) 1.5, snap into 4 rows of 6 at 5.0, count by rows 9.0,
//   spin the tray 14.0, score into 16 + 8 at 18.0, close at 21.0.
export const INTRO_CUES = [
  { gate: 1.5,  pause: 0,   key: "m2i_intro",  text: "Loose buns all over — too messy to count." },
  { gate: 5.0,  pause: 0.4, key: "m2i_tidy",   text: "Tidy them into a tray: four rows of six." },
  { gate: 9.0,  pause: 0.5, key: "m2i_count",  text: "Count by rows — six, twelve, eighteen, twenty-four." },
  { gate: 14.0, pause: 0.5, key: "m2i_spin",   text: "Spin the tray: four rows of six, or six rows of four — still twenty-four." },
  { gate: 18.0, pause: 0.5, key: "m2i_score",  text: "Score it: four sixes is four fours and four twos — sixteen plus eight is twenty-four." },
  { gate: 21.0, pause: 0.5, key: "m2i_close",  text: "A tray is a rectangle, povaryonok — rows times columns." },
];
