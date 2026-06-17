/* kitchen-r4 — Babushka's Kitchen question for №7 Equivalent Fractions.
   Pure data; all chrome comes from the shared KitchenScreen template. Asks the
   SAME concept as the lesson's final question (which fraction equals a given
   simplest fraction) with fresh numbers, so a miss routes back to the r4 lesson for
   more study. The Cat cooks wordlessly, so Babushka narrates. */
export default {
  kind: "kitchen",
  id: "r4",
  cook: "cat",
  story: `The Cat's recipe needs <b>two thirds</b> of a jar of honey, but the only spoon left measures in sixths. Babushka asks: which scoop pours out the same amount as <b>2/3</b>?`,
  recipe: `This recipe uses <b>Lesson 7 · Equivalent Fractions</b> — multiply (or divide) the top and bottom by the same number.`,
  answer: { type: "choice", lead: "Tap the equal fraction", options: ["4/6", "3/6", "2/6"] },
  tutorLine: `Multiply the top and bottom of 2/3 by the same number — which scoop matches?`,
  readVox: "mr_kitchen_r4",
};
