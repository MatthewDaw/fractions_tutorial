// introR2.js — narration cue sheet + transcript for the R2 "Same-Size Pieces"
// intro video (public/intros/r2-same-size-pieces-v2.html).
//
// The video is a ~37s hand-animated timeline whose on-screen captions appear at
// fixed timecodes (see the BEATS table in the html). Each cue pairs one beat with:
//   - `gate`:  the second the line's beat begins on screen (matches the caption)
//   - `pause`: a breath (seconds) required AFTER the previous line finishes
//   - `key`:   the pre-baked voice clip, public/voice/<key>.mp3 (r2i_* clips)
//   - `text`:  the transcript line (also the exact words the clip says)
//
// RoomIntro.jsx reads the video's playhead (localStorage[`${STAGE_PERSIST_KEY}:t`])
// and plays/highlights these in sync: a line begins when the playhead passes BOTH
// its `gate` and `prevLineEnd + pause`, so it never talks over the wrong visual nor
// clips the one before. The 7 clip KEYS + their TEXT are unchanged from the prior
// cut, so the baked mp3s are reused (no re-bake). Keep `gate`s aligned with the
// html BEATS table if that timeline changes.

export const STAGE_PERSIST_KEY = "samesize.v2";
export const INTRO_DURATION = 32;

// Knife animation retimed: knives now enter from the right one at a time.
//   Knife A (×2, 1/3 strip) fires at 8.0s, finishes at 11.5s.
//   Knife B (×3, 1/2 strip) fires at 11.5s, finishes at 15.0s.
//   two strips 1.5, "different sizes" 5.0, SLICE 8.0,
//   every piece a sixth 15.5, bottom is six 19.0,
//   count the pieces 21.5, five sixths 25.0.
export const INTRO_CUES = [
  { gate: 1.5,  pause: 0,   key: "r2i_pieces",    text: "One third of a strip, and one half of a strip." },
  { gate: 5.0,  pause: 0.5, key: "r2i_different", text: "Different sizes — how can we add them?" },
  { gate: 8.0,  pause: 0.5, key: "r2i_slice",     text: "Slice them into matching pieces!" },
  { gate: 15.5, pause: 0.5, key: "r2i_sixth",     text: "Every piece is now one sixth — the same size." },
  { gate: 19.0, pause: 0.5, key: "r2i_bottom",    text: "So the bottom number is six." },
  { gate: 21.5, pause: 0.5, key: "r2i_count",     text: "Count the pieces…" },
  { gate: 25.0, pause: 0.5, key: "r2i_answer",    text: "One third plus one half makes five sixths." },
];
