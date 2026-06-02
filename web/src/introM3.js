// introM3.js — narration cue sheet + transcript for the m3 "Times Facts" intro
// video (public/intros/m3-times-facts.html).
//
// The video is a ~24s hand-animated timeline whose on-screen captions appear at
// fixed timecodes (see the BEATS table in the html). Each cue pairs one beat with:
//   - `gate`:  the second the line's beat begins on screen (matches the caption)
//   - `pause`: a breath (seconds) required AFTER the previous line finishes
//   - `key`:   the pre-baked voice clip, public/voice/<key>.mp3 (m3i_* clips —
//              added centrally in a later phase; missing audio degrades silently)
//   - `text`:  the transcript line (also the exact words the clip says)
//
// RoomIntro.jsx reads the video's playhead (localStorage[`${STAGE_PERSIST_KEY}:t`])
// and plays/highlights these in sync. Worked example: 7 × 8 = 56 (skip-count by
// eights). All products are SPELLED IN WORDS in the voice lines ("seven eights
// are fifty-six"). Keep `gate`s aligned with the html BEATS table if it changes.

export const STAGE_PERSIST_KEY = "timesfacts.v1";
export const INTRO_DURATION = 24;

// gates track the video's BEATS table:
//   seven empty jars 1.5, one scoop of eight 4.5, fill all seven (tally jumps)
//   8.0, write 7×8=56 13.0, know it by heart 16.5, derived-fact trick 19.5.
export const INTRO_CUES = [
  { gate: 1.5,  pause: 0,   key: "m3i_intro",   text: "Seven empty jars, and a scoop that holds eight." },
  { gate: 4.5,  pause: 0.5, key: "m3i_scoop",   text: "One handful into each jar — eight at a time." },
  { gate: 8.0,  pause: 0.5, key: "m3i_count",   text: "Count by eights: eight, sixteen, twenty-four, thirty-two, forty, forty-eight, fifty-six." },
  { gate: 13.0, pause: 0.5, key: "m3i_write",   text: "Seven eights are fifty-six. Seven times eight is fifty-six." },
  { gate: 16.5, pause: 0.5, key: "m3i_byheart", text: "Skip-counting gets you there — but a master cook knows it by heart." },
  { gate: 19.5, pause: 0.5, key: "m3i_trick",   text: "And if you forget, split it: seven fives and seven threes — thirty-five and twenty-one make fifty-six." },
];
