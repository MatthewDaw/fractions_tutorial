// introM2.js — narration cue sheet + transcript for the m2 "Baking Trays" intro
// video (public/intros/m2-baking-trays.html).
//
// The video is a ~24s hand-animated timeline whose on-screen captions appear at
// fixed timecodes (see the BEATS table in the html). Each cue pairs one beat with:
//   - `gate`:  the second the line's beat begins on screen (matches the caption)
//   - `pause`: a breath (seconds) required AFTER the previous line finishes
//   - `key`:   the pre-baked voice clip, public/voice/<key>.mp3 (m2i_* clips —
//              added centrally in a later phase; missing audio degrades silently)
//   - `text`:  the transcript line (also the exact words the clip says)
//
// RoomIntro.jsx reads the video's playhead (localStorage[`${STAGE_PERSIST_KEY}:t`])
// and plays/highlights these in sync. Worked example: 4 × 6 = 24 (a tray of 4 rows
// of 6). Beats: loose buns → tidied into 4 rows of 6 → count by rows 6,12,18,24
// (bridge back to m1 equal groups) → spin the tray (commutativity) → score into
// 4×4 + 4×2 = 16 + 8 = 24 (distributivity, the takeaway). Products spelled in words.
// Keep `gate`s aligned with the html BEATS table if it changes.

export const STAGE_PERSIST_KEY = "arrays.v1";
export const INTRO_DURATION = 24;

// gates track the video's BEATS table:
//   loose buns 1.5, snap into 4 rows of 6 4.5, count by rows 8.5, spin the tray 13.0,
//   score into 4×4 + 4×2 17.0, close 20.5.
export const INTRO_CUES = [
  { gate: 1.5,  pause: 0,   key: "m2i_intro",  text: "A heap of loose buns — too messy to count." },
  { gate: 4.5,  pause: 0.5, key: "m2i_tidy",   text: "Tidy them into a tray: four rows of six." },
  { gate: 8.5,  pause: 0.5, key: "m2i_count",  text: "Count by rows — six, twelve, eighteen, twenty-four." },
  { gate: 13.0, pause: 0.5, key: "m2i_spin",   text: "Spin the tray. Four rows of six, or six rows of four — still twenty-four." },
  { gate: 17.0, pause: 0.5, key: "m2i_score",  text: "Score it: four fours and four twos — sixteen and eight make twenty-four." },
  { gate: 20.5, pause: 0.5, key: "m2i_close",  text: "A tray is a rectangle, povaryonok — rows times columns." },
];
