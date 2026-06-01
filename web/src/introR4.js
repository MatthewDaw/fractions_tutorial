// introR4.js — narration cue sheet + transcript for the R4 "Simplify" intro
// video (public/intros/r4-simplify.html).
//
// The video is a ~36s hand-animated timeline whose on-screen captions appear at
// fixed timecodes (see the BEATS table in the html). Each cue pairs one beat with:
//   - `gate`:  the second the line's beat begins on screen (matches the caption)
//   - `pause`: a breath (seconds) required AFTER the previous line finishes
//   - `key`:   the pre-baked voice clip, public/voice/<key>.mp3 (r4i_* clips)
//   - `text`:  the transcript line (also the exact words the clip says)
//
// RoomIntro.jsx reads the video's playhead (localStorage[`${STAGE_PERSIST_KEY}:t`])
// and plays/highlights these in sync: a line begins when the playhead passes BOTH
// its `gate` and `prevLineEnd + pause`, so it never talks over the wrong visual nor
// clips the one before. Keep `gate`s aligned with the html BEATS table if that
// timeline changes.

export const STAGE_PERSIST_KEY = "simplify.v1";
export const INTRO_DURATION = 27;

// gates track the video's BEATS table:
//   eight twelfths 1.5, fuse equal groups 5.8, into one sixth 10.5,
//   fuse again to thirds 14.7, amount never changed 19.4, tidied up 23.7.
export const INTRO_CUES = [
  { gate: 1.5,  pause: 0,   key: "r4i_intro",   text: "Eight twelfths — a bar of many tiny pieces." },
  { gate: 5.8,  pause: 0.5, key: "r4i_fuse",    text: "Let's fuse equal groups into fewer, bigger pieces." },
  { gate: 10.5, pause: 0.5, key: "r4i_sixth",   text: "Two twelfths fuse into one sixth — now it's four sixths." },
  { gate: 14.7, pause: 0.5, key: "r4i_thirds",  text: "Keep going — fuse again into the biggest pieces: two thirds." },
  { gate: 19.4, pause: 0.5, key: "r4i_same",    text: "The amount never changed — the bar is the same length." },
  { gate: 23.7, pause: 0.5, key: "r4i_tidy",    text: "Eight twelfths is two thirds, tidied up." },
];
