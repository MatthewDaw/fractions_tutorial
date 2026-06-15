/* lessons/m1.js — identity + step strip for Lesson №1 "Equal Groups" (#/m1).
   The single source of truth: each m1 step page declares only `lesson: "m1"`
   and pulls № / tag / title / route + this tab strip from here. */
export default {
  id: "m1",
  num: "№1",
  tag: "Lesson 1 · Equal Groups",
  title: "Equal Groups",
  route: "#/m1",
  tabs: [
    { n: "1", name: "Manipulate", sub: "fill the plates", href: "room-m1.html", title: "fill the plates" },
    { n: "2", name: "Bind", sub: "4 + 4 + 4, write 12", href: "room-m1-2-bind.html", title: "4 + 4 + 4, write 12" },
    { n: "3", name: "Fade", sub: "collapse to 3 × 4", href: "room-m1-3-fade.html", title: "collapse to 3 × 4" },
    { n: "4", name: "Workbench", sub: "build it in bowls", href: "room-m1-4-workbench.html", title: "build it in bowls" },
    { n: "5", name: "Numbers", sub: "bare 3 × 4 = ?", href: "room-m1-5-numbers.html", title: "bare 3 × 4 = ?" },
    { n: "6", name: "Applied", sub: "write the setup, then total", href: "room-m1-6-applied.html", title: "write the setup, then total" },
    { n: "sw", name: "Show Work", sub: "show your work", href: "room-m1-sw-showwork.html", title: "show your work" },
    { n: "7", name: "Words", sub: "story problem", href: "room-m1-7-words.html", title: "story problem" },
    { n: "★", name: "Practice", sub: "Fresh problems — paced to your mastery", href: "room-m1-practice.html", title: "Fresh problems — paced to your mastery" },
  ],
};
