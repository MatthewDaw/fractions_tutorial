/* lessons/nl.js — identity + step strip for Lesson №6 "On the Number Line"
   (merged nl + r1 lesson), route #/nl.

   The wireframe source of truth: docs/wireframe/src/lessons.js keeps nl inline
   as the merged №6 nl+r1 lesson. This registry entry is reconciled with the
   real-app AppNumberLine.jsx STAGES.

   The single source of truth: AppNumberLine declares only `lesson: "nl"` and
   pulls № / tag / title / route + this tab strip from here. */
export default {
  id: "nl",
  num: "№6",
  tag: "Lesson 6 · On the Number Line",
  title: "Same Denominators",
  route: "#/nl",
  tabs: [
    { n: "1", name: "Place", sub: "grow the fraction from 1/4 blocks", href: "room-nl.html", title: "grow the fraction from 1/4 blocks" },
    { n: "2", name: "Write", sub: "name the marked point", href: "room-nl-2-write.html", title: "name the marked point" },
    { n: "3", name: "Manipulate", sub: "drag & count blocks", href: "room-r1.html", title: "drag & count blocks" },
    { n: "4", name: "Numbers", sub: "bare 2/7 + 3/7 = ?", href: "room-r1-5-numbers.html", title: "bare 2/7 + 3/7 = ?" },
    { n: "5", name: "Applied", sub: "write the sum, then total", href: "room-r1-6-applied.html", title: "write the sum, then total" },
    { n: "6", name: "Show Work", sub: "show your work", href: "room-r1-sw-showwork.html", title: "show your work" },
    { n: "7", name: "Words", sub: "story problem", href: "room-r1-7-words.html", title: "story problem" },
    { n: "★", name: "Practice", sub: "fresh problems — paced to your mastery", href: "room-r1-practice.html", title: "fresh problems — paced to your mastery" },
  ],
};
