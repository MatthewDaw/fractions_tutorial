/* kitchen-r2 — Babushka's Kitchen question for №10 Cross-Multiply.
   Pure data; all chrome comes from the shared KitchenScreen template. Asks the
   SAME concept as the lesson's final question (add two fractions whose bottoms
   share no factor — cross-multiply) with fresh numbers, so a miss routes back
   to room-r2 for more study. */
export default {
  kind: "kitchen",
  id: "r2",
  cook: "kid",
  story: `You cut your tray into halves and Ben cut his into thirds. Babushka needs <b>one half</b> plus <b>one third</b>. The trays are different sizes — halves and thirds — so rename both over a shared bottom. <b>How much is that altogether?</b>`,
  recipe: `This recipe uses <b>Lesson 10 · Cross-Multiply</b> — rename both fractions over a shared bottom, then add.`,
  answer: { type: "fraction", lead: "Write how much in all" },
  tutorLine: `Read it, find the two fractions, and write how much in all.`,
  readVox: "mr_kitchen_r2",
};
