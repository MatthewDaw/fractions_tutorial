/* kitchen-r3 — Babushka's Kitchen question for №9 Scale One.
   Pure data; all chrome comes from the shared KitchenScreen template. Asks the
   SAME concept as the lesson's final question (one bottom is a multiple of the
   other, so scale one fraction up to match, then add) with fresh numbers, so a
   miss routes back to room-r3 for more study. */
export default {
  kind: "kitchen",
  id: "r3",
  cook: "grandpa",
  story: `Grandpa has <b>half</b> a strip of dough and <b>one fourth</b> of a strip of bacon. Laid end to end on the ruler, how much is that altogether? One bottom already fits — rename the half into fourths first. <b>How much is that altogether?</b>`,
  recipe: `This recipe uses <b>Lesson 9 · Scale One</b> — rename one fraction so the bottoms match, then add the tops.`,
  answer: { type: "fraction", lead: "Write how much in all" },
  tutorLine: `Read it, scale one fraction up so the bottoms match, and write how much in all.`,
  readVox: "mr_kitchen_r3",
};
