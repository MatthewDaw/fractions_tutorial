/* kitchen-cmp — Babushka's Kitchen question for №5 Compare & Check.
   Pure data; all chrome comes from the shared KitchenScreen template. Asks the
   SAME concept as the lesson's final question (rename two different-base fractions
   to a common bottom, then more on top wins) with fresh numbers, so a miss routes
   back to room-cmp for more study. */
export default {
  kind: "kitchen",
  id: "cmp",
  cook: "grandpa",
  story: `Grandpa drizzled <b>three fifths</b> of the honey jar over his blini, while Babushka used <b>seven tenths</b> of hers. The jars are the same size, but the pours are measured in different parts. Write &lt;, =, or &gt; between them — is <b>3/5</b> less than, equal to, or more than <b>7/10</b>?`,
  recipe: `This recipe uses <b>Lesson 5 · Compare &amp; Check</b> — rename both to the same bottom, then more on top wins.`,
  answer: { type: "compare", left: "3/5", right: "7/10" },
  tutorLine: `Different bottoms — rename both to the same bottom, then more on top wins.`,
  readVox: "mr_kitchen_cmp",
};
