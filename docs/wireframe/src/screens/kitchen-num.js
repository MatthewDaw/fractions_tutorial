/* kitchen-num — Babushka's Kitchen question for №4 The Top Number.
   Pure data; all chrome comes from the shared KitchenScreen template. Asks the
   SAME concept as the lesson's final question (the top number counts how many of
   the equal pieces are taken) with fresh numbers, so a miss routes to room-num. */
export default {
  kind: "kitchen",
  id: "num",
  cook: "kid",
  story: `The Kid cut a cake into <b>seven equal slices</b> and frosted <b>four</b> of them with cherries. <b>What fraction of the cake has cherries?</b>`,
  recipe: `This recipe uses <b>Lesson 4 · The Top Number</b> — the bottom is how many equal slices, the top counts how many are frosted.`,
  answer: { type: "fraction", lead: "Write the fraction" },
  tutorLine: `The bottom is how many slices in all; the top counts the ones with cherries.`,
  readVox: "mr_kitchen_num",
};
