// introR4.js — narration cue sheet + transcript for the R4 "Simplify" intro
// video (public/intros/r4-simplify.html).
//
// The video is a ~27s hand-animated timeline whose on-screen captions appear at
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
//   8 of 12 1.5, watch the edge 5, group by 2 -> 4/6 9, group again -> 2/3 13,
//   divide top+bottom = divide by 1 17.5, 8/12 = 2/3 simplest 22.
export const INTRO_CUES = [
  { gate: 1.5,  pause: 0.3, key: "r4i_intro",    text: "Babushka's answer came out as eight out of twelve. One whole, cut into twelve equal pieces, with eight of them filled." },
  { gate: 5,    pause: 0.5, key: "r4i_edge",     text: "Watch the right edge of the filled part. We are about to rename this fraction, but that edge will never move — the amount stays the same." },
  { gate: 9,    pause: 0.5, key: "r4i_group",    text: "Group the pieces by twos. Twelve cells become six, and the eight filled become four. Four out of six — and look, the filled edge did not move at all." },
  { gate: 13,   pause: 0.5, key: "r4i_again",    text: "Group again by twos. Six cells become three, and the four filled become two. Two out of three — and that filled edge has still not moved." },
  { gate: 17.5, pause: 0.5, key: "r4i_byone",    text: "Here is why this is allowed. We divided the top and the bottom by the same number. Same number over same number is one — and dividing by one can never change the amount." },
  { gate: 22,   pause: 0.5, key: "r4i_simplest", text: "So eight twelfths is exactly two thirds. The same amount, just written with the smallest numbers — its simplest name." },
];
