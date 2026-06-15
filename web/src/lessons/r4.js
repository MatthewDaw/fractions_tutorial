/* lessons/r4.js — identity + step strip for Lesson №8 "Simplify" (#/r4).
   The single source of truth: each r4 step page declares only `lesson: "r4"`
   and pulls № / tag / title / route + this tab strip from here. */
export default {
  id: "r4",
  num: "№8",
  tag: "Lesson 8 · Simplifying",
  title: "Simplify",
  route: "#/r4",
  tabs: [
    { n: "1", name: "Group", sub: "Drag a group size — bundle equal cells", href: "room-r4.html", title: "Drag a group size — bundle equal cells" },
    { n: "2", name: "Bind", sub: "Group, then write the equivalent name", href: "room-r4-2-bind.html", title: "Group, then write the equivalent name" },
    { n: "3", name: "Fade", sub: "Pick the shared factor, then write", href: "room-r4-3-fade.html", title: "Pick the shared factor, then write" },
    { n: "4", name: "Numbers", sub: "Bare 8/12 — write lowest terms", href: "room-r4-4-numbers.html", title: "Bare 8/12 — write lowest terms" },
    { n: "5", name: "Applied", sub: "Write the fraction, then its simplest name", href: "room-r4-5-applied.html", title: "Write the fraction, then its simplest name" },
    { n: "SW", name: "Show Work", sub: "Show your work on a blank slate", href: "room-r4-sw-showwork.html", title: "Show your work on a blank slate" },
    { n: "6", name: "Words", sub: "Read the recipe, write the simplest name", href: "room-r4-6-words.html", title: "Read the recipe, write the simplest name" },
    { n: "★", name: "Practice", sub: "Fresh problems — paced to your mastery", href: "room-r4-practice.html", title: "Fresh problems — paced to your mastery" },
  ],
};
