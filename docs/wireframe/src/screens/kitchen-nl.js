/* kitchen-nl — Babushka's Kitchen question for №6 Same Denominators.
   Pure data; all chrome comes from the shared KitchenScreen template. Asks the
   SAME concept as the lesson's final question (add tops, keep the bottom) with
   fresh numbers, so a miss routes back to room-nl for more study. */
export default {
  kind: "kitchen",
  id: "nl",
  cook: "kid",
  story: `The Kid scooped <b>two sixths</b> of the berry basket into the bowl, then tipped in <b>three sixths</b> more. The scoops are the same size — sixths. <b>How much of the basket is in the bowl now?</b>`,
  recipe: `This recipe uses <b>Lesson 6 · Same Denominators</b> — the bottoms already match, so add the tops and keep the bottom.`,
  answer: { type: "fraction", lead: "Write how much in all" },
  tutorLine: `Read it, find the two fractions, and write how much in all.`,
  readVox: "mr_kitchen_nl",
};
