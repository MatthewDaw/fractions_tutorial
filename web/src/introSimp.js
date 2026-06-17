// introSimp.js — narration cue sheet + transcript for the simp "Simplify" intro
// video (public/intros/simp-simplify.html).
//
// The video is a ~30s hand-animated timeline whose on-screen captions appear at
// fixed timecodes (see the BEATS table in the html). Each cue pairs one beat with:
//   - `gate`:  the second the line's beat begins on screen (matches the caption)
//   - `pause`: a breath (seconds) required AFTER the previous line finishes
//   - `key`:   the pre-baked voice clip, public/voice/<key>.mp3 (simpi_* clips —
//              baked centrally; missing audio DEGRADES gracefully)
//   - `text`:  the transcript line (also the exact words the clip says)
//
// RoomIntro.jsx reads the video's playhead (localStorage[`${STAGE_PERSIST_KEY}:t`])
// and plays/highlights these in sync: a line begins when the playhead passes BOTH
// its `gate` and `prevLineEnd + pause`. Worked example: 8/12 → 4/6 → 2/3 — run
// equivalence BACKWARDS by BUNDLING cells to write the same amount with the fewest
// pieces. Show 8/12 as a 3×4 box (8 shaded red), bundle every two rows (→ 4/6),
// bundle again (→ 2/3); the red amount and its 2/3-boundary edge never move. Keep
// `gate`s aligned with the html BEATS table.

export const STAGE_PERSIST_KEY = "simplify.v1";
export const INTRO_DURATION = 35;

// gates track the video's BEATS table:
//   show 8/12 (3×4 box) 1.4, bundle to 4/6 7.0, bundle to 2/3 14.0,
//   emphasize the unchanged red edge 20.0, the equation 8/12 = 2/3 at 25.0.
export const INTRO_CUES = [
  { gate: 1.4,  pause: 0,   key: "simpi_start",    text: "Eight twelfths — the same amount, but lots of little pieces." },
  { gate: 7.0,  pause: 0.5, key: "simpi_bundle1",  text: "Bundle every two cells together — eight twelfths becomes four sixths." },
  { gate: 14.0, pause: 0.5, key: "simpi_bundle2",  text: "Bundle again — four sixths becomes two thirds." },
  { gate: 20.0, pause: 0.5, key: "simpi_edge",     text: "The red amount never moved — same amount, fewer pieces." },
  // gate 25.0 — the result beat: the two boxes we drew sit side by side. Name the
  // equality and point back at them so the child connects 8/12 and 2/3 as one amount.
  { gate: 25.0, pause: 0.5, key: "simpi_equal",    text: "Up above are the fractions we drew: eight twelfths and two thirds. They're equal — the same amount, just with the fewest pieces." },
];
