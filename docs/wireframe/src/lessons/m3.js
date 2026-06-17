/* lessons/m3.js — identity + step strip for Lesson №2 "Times Facts" (#/m3).
   The single source of truth: each m3 step page declares only `lesson: "m3"`
   and pulls № / tag / title / route + this tab strip from here. */
export default {
  id: "m3",
  backHref: "shelf-found.html",
  num: "№2",
  tag: "Lesson 2 · Times Facts",
  title: "Times Facts",
  route: "#/m3",
  tabs: [
    { n: "1", name: "Manipulate", sub: "scoop & read the jar", href: "room-m3.html", title: "scoop & read the jar" },
    { n: "2", name: "Bind", sub: "jar + write 56", href: "room-m3-2-bind.html", title: "jar + write 56" },
    { n: "3", name: "Fade", sub: "fill the skip-line", href: "room-m3-3-fade.html", title: "fill the skip-line" },
    { n: "4", name: "Workbench", sub: "build 7 groups of 8", href: "room-m3-4-workbench.html", title: "build 7 groups of 8" },
    { n: "5", name: "Numbers", sub: "bare 7 × 8 = ?", href: "room-m3-5-numbers.html", title: "bare 7 × 8 = ?" },
    { n: "6", name: "Applied", sub: "write the setup, then total", href: "room-m3-6-applied.html", title: "write the setup, then total" },
    { n: "7", name: "Show Work", sub: "show your work", href: "room-m3-sw-showwork.html", title: "show your work" },
    { n: "8", name: "Words", sub: "story problem", href: "room-m3-7-words.html", title: "story problem" },
    { n: "★", name: "Practice", sub: "Fresh problems — paced to your mastery", href: "room-m3-practice.html", title: "Fresh problems — paced to your mastery" },
  ],
};
