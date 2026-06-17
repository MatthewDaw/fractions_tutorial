/* lessons/r4.js — identity + step strip for the "Equivalent Fractions" room
   (#/r4). Refactored from the old Simplify lesson: equivalence on a SQUARE (not
   the ruler). Doubling and tripling are two phases of the SAME lesson — the child
   sees 1/3, doubles it (×2 → 2/6), triples it (×3 → 3/9), learns to raise the
   bottom to a target, then hunts every equivalent (pick the numbers, then numbers
   alone). Each step page declares only `lesson: "r4"`. */
export default {
  id: "r4",
  backHref: "shelf-combine.html",
  num: "№8",
  tag: "Lesson 8 · Equivalent Fractions",
  title: "Equivalent Fractions",
  route: "#/r4-2-bind",
  tabs: [
    { n: "1", name: "Double", sub: "cut each cell in two — 1/3 = 2/6, same amount", href: "room-r4-2-bind.html", title: "cut each cell in two — 1/3 = 2/6, same amount" },
    { n: "2", name: "Triple", sub: "cut each cell in three — 1/3 = 3/9, same amount", href: "room-r4-3-fade.html", title: "cut each cell in three — 1/3 = 3/9, same amount" },
    { n: "3", name: "Raise", sub: "pick the tool that makes the bottom number N", href: "room-r4-4-numbers.html", title: "pick the tool that makes the bottom number N" },
    { n: "4", name: "Find · Pick", sub: "choose top & bottom, watch the box cut to match", href: "room-r4-5-applied.html", title: "choose top & bottom, watch the box cut to match" },
    { n: "5", name: "Find · All", sub: "match the 1/3 target — find every equivalent", href: "room-r4-6-words.html", title: "match the 1/3 target — find every equivalent" },
    { n: "6", name: "Sort", sub: "drag each fraction to the bin it matches", href: "room-r4-7-sort.html", title: "drag each fraction to the bin it matches" },
    { n: "★", name: "Practice", sub: "Fresh problems — paced to your mastery", href: "room-r4-practice.html", title: "Fresh problems — paced to your mastery" },
  ],
};
