/* kitchen-m1 — Babushka's Kitchen question for №1 Equal Groups.
   Pure data; all chrome comes from the shared KitchenScreen template. Asks the
   SAME concept as the lesson's final question (N equal groups of M = N×M total)
   with fresh numbers, so a miss routes back to room-m1 for more study. */
export default {
  kind: "kitchen",
  id: "m1",
  cook: "kid",
  story: `The Kid lined up <b>4 jars</b> and dropped <b>3 plums</b> into each one — every jar got the same amount. <b>How many plums went into the jars in all?</b>`,
  recipe: `This recipe uses <b>Lesson 1 · Equal Groups</b> — equal groups of the same size, so multiply the groups by the size.`,
  answer: { type: "integer", lead: "Write the total" },
  tutorLine: `Read it, count the equal groups and how many in each, and write the total.`,
  readVox: "mr_kitchen_m1",
};
