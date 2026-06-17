// introNL.js — narration cue sheet + transcript for the nl "On the Number Line"
// intro video (public/intros/nl-number-line.html).
//
// The video is a ~20s hand-animated timeline whose on-screen captions appear at
// fixed timecodes (see the BEATS table in the html). Each cue pairs one beat with:
//   - `gate`:  the second the line's beat begins on screen (matches the caption)
//   - `pause`: a breath (seconds) required AFTER the previous line finishes
//   - `key`:   the pre-baked voice clip, public/voice/<key>.mp3 (nli_* clips —
//              baked centrally; missing audio DEGRADES gracefully)
//   - `text`:  the transcript line (also the exact words the clip says)
//
// RoomIntro.jsx reads the video's playhead (localStorage[`${STAGE_PERSIST_KEY}:t`])
// and plays/highlights these in sync: a line begins when the playhead passes BOTH
// its `gate` and `prevLineEnd + pause`. Worked example: place 3/4 on a 0→1 line cut
// into fourths (teal, grid hatch), the bead glides three parts along, the fill
// grows, and "that point IS the number." Keep `gate`s aligned with the html BEATS.

export const STAGE_PERSIST_KEY = "numberline.v1";
export const INTRO_DURATION = 45;

// gates track the video's BEATS table; each is set so a line never starts before
// the previous clip (+breath) has finished. Keep in lockstep with the html BEATS.
// Part 1 (1.4–16.8) places 3/4 on the line; Part 2 (21.0–37.0) adds 2/4 + 1/4
// back to 3/4 by breaking the fractions into same-size 1/4 blocks on a second
// line and sliding them together.
export const INTRO_CUES = [
  { gate: 1.4,  pause: 0,   key: "nli_number",   text: "A fraction is a number — one point on the line." },
  { gate: 5.4,  pause: 0.5, key: "nli_cut",      text: "Cut the line from zero to one into four equal parts." },
  { gate: 9.7,  pause: 0.5, key: "nli_slide",    text: "Slide the red point three parts along." },
  { gate: 13.0, pause: 0.5, key: "nli_fill",     text: "The fill grows to show three fourths of the way." },
  { gate: 16.8, pause: 0.5, key: "nli_isnum",    text: "That point is the number three fourths." },
  // Part 2 — adding fractions that share a bottom
  { gate: 21.0, pause: 0.6, key: "nli_comefrom", text: "So where does three fourths come from? We add." },
  { gate: 25.0, pause: 0.6, key: "nli_two",      text: "Start with two fourths — two equal pieces." },
  { gate: 29.0, pause: 0.6, key: "nli_second",   text: "Draw a second line: one more fourth, the same size." },
  { gate: 33.7, pause: 0.6, key: "nli_join",     text: "Same bottom, same-size pieces — slide them together." },
  { gate: 37.9, pause: 0.6, key: "nli_total",    text: "Keep the bottom, add the tops — two fourths plus one fourth is three fourths." },
];
