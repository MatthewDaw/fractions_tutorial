/* lessons/mom.js — identity for Babushka's Kitchen, route #/mom.

   The kitchen is now a PURE wireframe screen (see MomsRoom.jsx): a strip of
   story-problem rooms (kitchen/rooms.js, KITCHEN_ORDER) graded LOCALLY
   (kitchen/grade.js). The adaptive/mastery ENGINE was dropped, so the kitchen no
   longer consumes any room→node bindings. The fields below are the single source
   of truth for the kitchen's bespoke tag/title chrome (★ heart, not the №
   "Lesson n" header pattern).

   `tabs: []` because the kitchen builds its own per-room strip from KITCHEN_ORDER
   (it is not a staged single lesson).

   LEGACY (harmless, unused by the kitchen): the roomToNode/nodeToRoom maps below
   remain only so a few old runtime tests that import them still resolve. They are
   not read by any live code path. */

/** LEGACY/UNUSED: room id → former engine SkillNode id. Kept harmless for tests. */
export const roomToNode = {
  r1: "ADD_SAME_DEN",
  r3: "ADD_UNLIKE_NESTED",
  r2: "ADD_UNLIKE_COPRIME",
  r4: "SIMPLIFY",
  simp: "SIMPLIFY",
  r5: "IMPROPER_TO_MIXED",
};

/** Engine SkillNode id → room id (inverse of roomToNode).
 *  When multiple rooms share a node (r4 and simp both → SIMPLIFY),
 *  the kitchen's goLearn() routes to r4 by default; simp questions
 *  override this via stumpingRecipe room tracking in MomsRoom. */
export const nodeToRoom = {
  ADD_SAME_DEN: "r1",
  ADD_UNLIKE_NESTED: "r3",
  ADD_UNLIKE_COPRIME: "r2",
  SIMPLIFY: "r4",
  IMPROPER_TO_MIXED: "r5",
};

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
