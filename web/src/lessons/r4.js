/* lessons/r4.js — identity + step strip for the "Equivalent Fractions" room
   (#/r4). Refactored from the old Simplify lesson: equivalence on a SQUARE (not
   the ruler). Doubling and tripling are two phases of the SAME lesson — the child
   sees 1/3, doubles it (×2 → 2/6), triples it (×3 → 3/9), learns to raise the
   bottom to a target, then hunts every equivalent (pick the numbers, then numbers
   alone). Each step page declares only `lesson: "r4"`. */
export default {
  id: "r4",
  num: "№7",
  tag: "Lesson 7 · Equivalent Fractions",
  title: "Equivalent Fractions",
  route: "#/r4",
  tabs: [
    { n: "1", name: "Identify", sub: "what fraction of the box is shaded?", href: "room-r4.html", title: "what fraction of the box is shaded?" },
    { n: "2", name: "Double", sub: "cut each cell in two — 1/3 = 2/6, same amount", href: "room-r4-2-bind.html", title: "cut each cell in two — 1/3 = 2/6, same amount" },
    { n: "3", name: "Triple", sub: "cut each cell in three — 1/3 = 3/9, same amount", href: "room-r4-3-fade.html", title: "cut each cell in three — 1/3 = 3/9, same amount" },
    { n: "4", name: "Raise", sub: "pick the tool that makes the bottom number N", href: "room-r4-4-numbers.html", title: "pick the tool that makes the bottom number N" },
    { n: "5", name: "Find · Pick", sub: "choose top & bottom, watch the box cut to match", href: "room-r4-5-applied.html", title: "choose top & bottom, watch the box cut to match" },
    { n: "6", name: "Find · All", sub: "match the 1/3 target — find every equivalent", href: "room-r4-6-words.html", title: "match the 1/3 target — find every equivalent" },
    { n: "7", name: "Sort", sub: "drag each fraction to the bin it matches", href: "room-r4-7-sort.html", title: "drag each fraction to the bin it matches" },
    { n: "★", name: "Practice", sub: "Fresh problems — paced to your mastery", href: "room-r4-practice.html", title: "Fresh problems — paced to your mastery" },
  ],
  // Layout dims for the split LessonBoard.
  layout: { railW: 452, footH: 150 },
  // Per-stage goal-banner copy.
  goals: {
    identify: "The box is cut into *3 equal columns* and one is shaded red. The shaded part is *one out of three* — written as *1/3*. The bottom number counts all the columns; the top counts the shaded ones.",
    double: "The *×2 knife* cuts every cell in two. Three columns become six, one shaded column becomes two — *1/3 and 2/6 are the same amount*. The red edge proves the shaded area never moved.",
    triple: "The *×3 knife* cuts every cell into three. Three columns become nine, one shaded becomes three — *1/3 and 3/9 are the same amount*. Same red edge, same amount.",
    raise: "Pick the knife that makes the bottom number exactly *12*. Thirds cut into four each give 12 cells — so the *×4 tool* is right. The top rises the same way: 1 × 4 = 4.",
    findpick: "The knives are put away. *Choose a top and a bottom number* — the box cuts itself to match. When your pair keeps the same red amount as 1/3, it is an equivalent fraction.",
    findall: "The *target stays fixed at 1/3*. Work your box with the numbers: every pair that keeps the same red amount as the target is an equivalent — 2/6, 3/9, 4/12, 5/15 … How many can you find?",
    sort: "Each bin is labelled with a *simplest fraction*. Drag each new fraction into the bin it is equal to. Think: does the top fit into the bottom the same number of times?",
  },
};
