/* lessons/mom.js — identity + engine-graph bindings for Babushka's Kitchen,
   route #/mom.

   The kitchen is the word-problem transfer layer over the fraction-arithmetic
   strand, NOT a staged lesson: its "stages" (mirror / combine / look-ahead) are
   state-driven and invisible, so it has no StageTabs strip (`tabs: []`). It
   therefore does NOT use the № / "Lesson n · tag" header identity — it keeps its
   bespoke topbar (★ heart + mastery pips). The identity fields below are the
   single source of truth for the kitchen's tag/title chrome.

   What moves here (data only — per the "data vs logic" rule): the room→engine
   SkillNode bindings (`roomToNode`). The engine wiring, grading, Slate refs, and
   adaptive flow stay in MomsRoom.jsx. The skill labels/curriculum order remain in
   momsProblems.js (they are coupled to the BANK question data there). */

/** Room id (rooms.js / BANK) → engine SkillNode id. Mirrors graph.ts. */
export const roomToNode = {
  r1: "ADD_SAME_DEN",
  r3: "ADD_UNLIKE_NESTED",
  r2: "ADD_UNLIKE_COPRIME",
  r4: "SIMPLIFY",
  r5: "IMPROPER_TO_MIXED",
};

/** Engine SkillNode id → room id (inverse of roomToNode). */
export const nodeToRoom = Object.fromEntries(
  Object.entries(roomToNode).map(([room, node]) => [node, room])
);

export default {
  id: "mom",
  route: "#/mom",
  // Bespoke kitchen chrome (NOT the № / "Lesson n" pattern):
  badge: "★",
  tag: "Babushka's Kitchen · Story Problems",
  title: "Show Babushka What You Know",
  // No staged tab strip — kitchen stages are state-driven & invisible.
  tabs: [],
  // Engine graph bindings (data, consumed by MomsRoom's flow logic):
  roomToNode,
  nodeToRoom,
};
