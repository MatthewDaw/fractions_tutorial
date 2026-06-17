/* kitchen — the landing screen for Babushka's Kitchen (#/mom).
   Shows the FIRST skill's question (Equal Groups, №1) with the full KitchenScreen
   chrome: topbar, skill tab strip, kq two-column layout (scratch pad + answer card
   left; question panel + cook portrait + Babushka tutor right).

   This mirrors the real app's MomsRoom initial state: the first skill in the
   CURRICULUM queue — currently m1 (Equal Groups) — with the mirror-stage question
   posed and the full kitchen chrome visible.

   Individual skill questions are at kitchen-<id>.js (e.g. kitchen-m1.js). This
   landing is a standalone object — NOT a re-export — so that it documents the
   intended landing state clearly and can diverge from kitchen-m1 if the first
   curriculum skill ever changes.

   Layout matches MomsRoom.jsx:
     kq-main (left)  — scratch pad (kq-play) + answer card pinned to bottom (kq-answer)
     kq-rail (right) — question panel (kq-question) + cook portrait (mr-asker) + tutor (kq-tutor)
*/

export default {
  kind: "kitchen",
  id: "m1",                    // first skill — links № / skill label / "Learn it" room
  cook: "kid",                 // the Kid brought this problem to Babushka's counter
  story: `The Kid lined up <b>4 jars</b> and dropped <b>3 plums</b> into each one — every jar got the same amount. <b>How many plums went into the jars in all?</b>`,
  recipe: `This recipe uses <b>Lesson 1 · Equal Groups</b> — equal groups of the same size, so multiply the groups by the size.`,
  answer: { type: "integer", lead: "Write the total" },
  tutorLine: `Read it, count the equal groups and how many in each, and write the total.`,
  readVox: "mr_kitchen_m1",
};
