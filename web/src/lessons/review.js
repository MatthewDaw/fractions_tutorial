/* lessons/review.js — identity + copy for the U8 "Mixed Basket" interleaved
   review, route #/review.

   Mixed Basket is a STANDALONE scene (like the kitchen): it is not a staged
   lesson and has no StageTabs strip (`tabs: []`). It does not use the № /
   "Lesson n · tag" header chrome; it keeps its bespoke centred column. The
   fields below are the single source of truth for its title/subtitle copy, so
   MixedReview.jsx no longer inlines those strings.

   Per the "data vs logic" rule, ONLY identity/copy lives here. The two-phase
   identify→solve loop, problem rotation, generateFor/gradeAnswer grading, and
   Slate refs stay in MixedReview.jsx.

   `sub(done)` builds the running subtitle ("…solved N so far."). `empty` holds
   the <2-recipe empty-state copy. `bridge`/`wrong`/`solved`/`miss` are the
   status-ribbon lines the component shows after each interaction. */
export default {
  id: "review",
  route: "#/review",
  // No staged tab strip — Mixed Basket interleaves, it does not progress stages.
  tabs: [],
  title: "Mixed Basket",
  /** Running subtitle for the ready state. */
  sub: (done) =>
    `Babushka mixed the recipes together — solved ${done} so far.`,
  /** Phase-1 prompt above the recipe choices. */
  question: "Which recipe is this?",
  /** <2 introduced recipes: interleaving needs at least two schemas. */
  empty: {
    title: "Babushka's Mixed Basket",
    sub: "Cook a few more recipes first — then come back and we'll mix them all together!",
    back: "← Back to the map",
  },
  /** Status-ribbon copy keyed by interaction outcome. */
  messages: {
    bridge: "Yes — now solve it.",
    wrong: "Look again — which kind of recipe is this?",
    solved: "Correct!",
    miss: "Not quite — take another look.",
  },
};
