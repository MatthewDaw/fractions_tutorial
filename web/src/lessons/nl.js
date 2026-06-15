/* lessons/nl.js — identity + step strip for Lesson №3 "On the Number Line"
   (locate a fraction as a single POINT on the 0→1 ruler), route #/nl.

   AUTHORED for the real-app refactor: the wireframe has no lessons/nl.js (its
   nl entry is kept inline in docs/wireframe/src/lessons.js as the merged №3
   nl+r1 lesson). This registry entry is reconciled with the real-app
   AppNumberLine.jsx STAGES (Place · Write · Numbers · ★Practice) — the three
   focused teaching stages plus estimator-paced practice.

   The single source of truth: AppNumberLine declares only `lesson: "nl"` and
   pulls № / tag / title / route + this tab strip from here. */
export default {
  id: "nl",
  num: "№3",
  tag: "Lesson 3 · On the Number Line",
  title: "Same Denominators",
  route: "#/nl",
  tabs: [
    { n: "1", name: "Place", sub: "drag the point to the fraction", href: "room-nl.html", title: "drag the point to the fraction" },
    { n: "2", name: "Write", sub: "name the marked point", href: "room-nl-2-write.html", title: "name the marked point" },
    { n: "3", name: "Numbers", sub: "past 1 — place a fraction bigger than a whole", href: "room-nl-3-numbers.html", title: "past 1 — place a fraction bigger than a whole" },
    { n: "★", name: "Practice", sub: "Fresh problems — paced to your mastery", href: "room-nl-practice.html", title: "Fresh problems — paced to your mastery" },
  ],
};
