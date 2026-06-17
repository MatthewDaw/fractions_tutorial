// introDen.js — narration cue sheet + transcript for the den "The Bottom Number"
// intro video (public/intros/den-bottom-number.html).
//
// The video is a ~26s hand-animated timeline whose on-screen captions appear at
// fixed timecodes (see the BEATS table in the html). Each cue pairs one beat with:
//   - `gate`:  the second the line's beat begins on screen (matches the caption)
//   - `pause`: a breath (seconds) required AFTER the previous line finishes
//   - `key`:   the pre-baked voice clip, public/voice/<key>.mp3 (deni_* clips —
//              baked centrally; missing audio DEGRADES gracefully)
//   - `text`:  the transcript line (also the exact words the clip says)
//
// RoomIntro.jsx reads the video's playhead (localStorage[`${STAGE_PERSIST_KEY}:t`])
// and plays/highlights these in sync: a line begins when the playhead passes BOTH
// its `gate` and `prevLineEnd + pause`. Teaching idea: the DENOMINATOR is how many
// equal pieces a whole is cut into, and a BIGGER bottom number makes each piece
// SMALLER — show one whole (0→1), cut it into 3 (one third, orange), cut another
// whole into 8 (one eighth, red), compare the widths, conclude 1/8 < 1/3. Keep
// `gate`s aligned with the html BEATS table.

export const STAGE_PERSIST_KEY = "bottomnumber.v1";
export const INTRO_DURATION = 26;

// gates track the video's BEATS table:
//   one whole 1.4, cut into 3 (one third) 5.5, cut into 8 (one eighth) 10.5,
//   more pieces = smaller 16.0, the statement 1/8 < 1/3 at 21.0.
export const INTRO_CUES = [
  { gate: 1.4,  pause: 0,   key: "deni_whole",   text: "This is one whole — from zero to one." },
  { gate: 5.5,  pause: 0.5, key: "deni_thirds",  text: "Cut it into 3 equal pieces — each one is one third." },
  { gate: 10.5, pause: 0.5, key: "deni_eighths", text: "Cut another whole into 8 — each one is one eighth." },
  { gate: 16.0, pause: 0.5, key: "deni_smaller", text: "More pieces means each piece is smaller." },
  { gate: 21.0, pause: 0.5, key: "deni_compare", text: "So one eighth is smaller than one third." },
];
