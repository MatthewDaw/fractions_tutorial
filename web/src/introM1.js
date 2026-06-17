// introM1.js — narration cue sheet + transcript for the m1 "Equal Groups" intro
// video (public/intros/m1-equal-groups.html).
//
// The video is a ~22s hand-animated timeline whose on-screen captions appear at
// fixed timecodes (see the BEATS table in the html). Each cue pairs one beat with:
//   - `gate`:  the second the line's beat begins on screen (matches the caption)
//   - `pause`: a breath (seconds) required AFTER the previous line finishes
//   - `key`:   the pre-baked voice clip, public/voice/<key>.mp3 (m1i_* clips —
//              added centrally in a later phase; missing audio DEGRADES gracefully)
//   - `text`:  the transcript line (also the exact words the clip says)
//
// RoomIntro.jsx reads the video's playhead (localStorage[`${STAGE_PERSIST_KEY}:t`])
// and plays/highlights these in sync: a line begins when the playhead passes BOTH
// its `gate` and `prevLineEnd + pause`. Worked example: 3 × 4 = 12 (three jars,
// the SAME four plums in every jar). The jars are NEVER rotated (commutativity is
// deferred to m2). The narration nouns (jars/plums) match the video's on-screen
// captions + drawn manipulative exactly. Keep `gate`s aligned with the html BEATS.

export const STAGE_PERSIST_KEY = "equalgroups.v1";
export const INTRO_DURATION = 32;

// gates track the video's BEATS table. Each gate is set so the line plays the
// instant its animation beat fires without clipping the previous clip (a gate
// never lands before the prior clip + breath has finished). Keep these in
// lockstep with the html BEATS table if either changes.
export const INTRO_CUES = [
  { gate: 1.2,  pause: 0,   key: "m1i_intro",  text: "Babushka sets out three jars." },
  { gate: 4.0,  pause: 0.4, key: "m1i_first",  text: "Four plums in the first jar." },
  { gate: 7.5,  pause: 0.5, key: "m1i_same",   text: "The same four in the next jar — every jar gets the same." },
  { gate: 12.0, pause: 0.5, key: "m1i_third",  text: "And the same four again. Three equal jars of four." },
  { gate: 15.8, pause: 0.5, key: "m1i_add",    text: "Four, plus four, plus four — add the group again and again." },
  { gate: 20.5, pause: 0.5, key: "m1i_times",  text: "Three groups of four is three times four — twelve. Count the groups, not the numbers." },
];
