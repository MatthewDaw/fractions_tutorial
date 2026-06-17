/* kitchen-s1 — Babushka's Kitchen question for №7 Taking Away.
   Pure data; all chrome comes from the shared KitchenScreen template. Asks the
   SAME concept as the lesson's final question (subtract tops, keep the bottom)
   with fresh numbers, so a miss routes back to room-s1 for more study. */
export default {
  kind: "kitchen",
  id: "s1",
  cook: "cat",
  story: `Babushka set out <b>six sevenths</b> of a honey cake on the table. The Cat batted <b>two sevenths</b> of the cake onto the floor. The slices are the same size — sevenths. <b>How much of the cake is left?</b>`,
  recipe: `This recipe uses <b>Lesson 7 · Taking Away</b> — same-size pieces, so subtract the tops and keep the bottom.`,
  answer: { type: "fraction", lead: "Write how much is left" },
  tutorLine: `Read it, find the two fractions, and write how much is left.`,
  readVox: "mr_kitchen_s1",
};
