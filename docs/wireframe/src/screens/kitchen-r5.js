/* kitchen-r5 — Babushka's Kitchen question for №12 Mixed Numbers.
   Pure data; all chrome comes from the shared KitchenScreen template. Asks the
   SAME concept as the lesson's final question (rename an improper fraction as a
   mixed number — divide top by bottom) with fresh numbers, so a miss routes back
   to room-r5 for more study. */
export default {
  kind: "kitchen",
  id: "r5",
  cook: "grandpa",
  story: `Seven quarter-slices of pie are cooling on the rack — that's <b>7/4</b>, more than one whole pie. Four quarters make one whole pie. Grandpa wants to write it the tidy way. <b>How many whole pies, and how many quarters left over?</b>`,
  recipe: `This recipe uses <b>Lesson 12 · Mixed Numbers</b> — divide the top by the bottom; the answer is the whole and the remainder is the new top.`,
  answer: { type: "mixed", lead: "Write it as a mixed number" },
  tutorLine: `Divide seven by four — how many wholes fit, and how many quarters are left over?`,
  readVox: "mr_kitchen_r5",
};
