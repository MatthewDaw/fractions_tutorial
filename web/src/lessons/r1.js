/* lessons/r1.js — identity + step strip for Lesson №4 "Adding Fractions"
   (same-denominator addition), route #/r1.

   AUTHORED for the real-app refactor: the wireframe ships no r1.js (its №3 nl
   family folds the old r1 add-stages inline). This is the canonical registry
   entry for the real-app AppR1.jsx, whose STAGES array
   (Manipulate · Bind · Fade · Workbench · Numbers · Applied · Show Work · Words
   · ★Practice) is mirrored here. The `n` values are the stage badges shown in
   the strip; the component still owns its own stage keys + advance order.

   The single source of truth: AppR1 declares only `lesson: "r1"` and pulls № /
   tag / title / route + this tab strip from here. */
export default {
  id: "r1",
  num: "№4",
  tag: "Lesson 4 · Adding Fractions",
  title: "Adding Fractions",
  route: "#/r1",
  tabs: [
    { n: "1", name: "Manipulate", sub: "drag & count blocks", href: "room-r1.html", title: "drag & count blocks" },
    { n: "2", name: "Bind", sub: "blocks + write 5/7", href: "room-r1-2-bind.html", title: "blocks + write 5/7" },
    { n: "3", name: "Fade", sub: "blocks dim, write", href: "room-r1-3-fade.html", title: "blocks dim, write" },
    { n: "4", name: "Workbench", sub: "build it from the bin", href: "room-r1-4-workbench.html", title: "build it from the bin" },
    { n: "5", name: "Numbers", sub: "bare 2/7 + 3/7 = ?", href: "room-r1-5-numbers.html", title: "bare 2/7 + 3/7 = ?" },
    { n: "6", name: "Applied", sub: "write the sum, then total", href: "room-r1-6-applied.html", title: "write the sum, then total" },
    { n: "sw", name: "Show Work", sub: "show your work", href: "room-r1-sw-showwork.html", title: "show your work" },
    { n: "7", name: "Words", sub: "story problem", href: "room-r1-7-words.html", title: "story problem" },
    { n: "★", name: "Practice", sub: "Fresh problems — paced to your mastery", href: "room-r1-practice.html", title: "Fresh problems — paced to your mastery" },
  ],
};
