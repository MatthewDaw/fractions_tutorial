/* kitchen-simp — Babushka's Kitchen question for №8 Simplify.
   Pure data; all chrome comes from the shared KitchenScreen template. Asks the
   SAME concept as the lesson's final question (divide top and bottom by their
   greatest common factor to find the simplest name) with fresh numbers, so a
   miss routes back to room-simp for more study. */
export default {
  kind: "kitchen",
  id: "simp",
  cook: "kid",
  story: `The Kid filled <b>six ninths</b> of the dumpling tray. Babushka wants the same amount written its simplest way. <b>What is the simplest name for that part of the tray?</b>`,
  recipe: `This recipe uses <b>Lesson 8 · Simplify</b> — divide the top and bottom by their greatest common factor.`,
  answer: { type: "choice", lead: "Tap the simplest name", options: ["2/3", "6/9", "4/6"] },
  tutorLine: `The biggest number that divides both 6 and 9 is 3 — so tap the simplest name.`,
  readVox: "mr_kitchen_simp",
};
