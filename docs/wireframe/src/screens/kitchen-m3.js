/* kitchen-m3 — Babushka's Kitchen question for №2 Times Facts.
   Pure data; all chrome comes from the shared KitchenScreen template. Asks the
   SAME concept as the lesson's final question (equal bundles × per-bundle count)
   with fresh numbers, so a miss routes back to room-m3 for more study. */
export default {
  kind: "kitchen",
  id: "m3",
  cook: "grandpa",
  story: `Grandpa lines up <b>six jars</b> of pickles on the pantry shelf, and packs <b>four cucumbers</b> into every jar. "All sealed for winter," he says. How many cucumbers did he pack in all?`,
  recipe: `This recipe uses <b>Lesson 2 · Times Facts</b> — equal bundles, so multiply the groups by the size of each.`,
  answer: { type: "integer", lead: "Write the total" },
  tutorLine: `Read it, find the groups and the size of each, and write the total.`,
  readVox: "mr_kitchen_m3",
};
