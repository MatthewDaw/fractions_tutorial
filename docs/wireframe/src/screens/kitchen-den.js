/* kitchen-den — Babushka's Kitchen question for №3 The Bottom Number.
   Pure data; all chrome comes from the shared KitchenScreen template. Asks the
   SAME concept as the lesson's final question (the bigger the bottom number, the
   smaller each piece) with fresh numbers, so a miss routes back to room-den. */
export default {
  kind: "kitchen",
  id: "den",
  cook: "grandpa",
  story: `Grandpa cut one pie into <b>fifths</b> and an identical pie into <b>eighths</b>. He wants the bigger slice. <b>Which single piece is smaller — 1/5 or 1/8?</b>`,
  recipe: `This recipe uses <b>Lesson 3 · The Bottom Number</b> — the bigger the bottom number, the more pieces, so each piece is smaller.`,
  answer: { type: "compare", left: "1/5", right: "1/8" },
  tutorLine: `More pieces means smaller pieces — look at the bottom number.`,
  readVox: "mr_kitchen_den",
};
