/* lessons/r3.js — identity + step strip for Lesson №6 "Scale One" (#/r3).
   The single source of truth: each r3 step page declares only `lesson: "r3"`
   and pulls № / tag / title / route + this tab strip from here. */
export default {
  id: "r3",
  num: "№6",
  tag: "Lesson 6 · Adding Fractions",
  title: "Scale One",
  route: "#/r3",
  tabs: [
    { n: "1", name: "Manipulate", sub: "the blocks ARE the problem; drag & slice by touch", href: "room-r3.html", title: "the blocks ARE the problem; drag & slice by touch" },
    { n: "2", name: "Bind", sub: "blocks + the written fraction; copy the numeral", href: "room-r3-2-bind.html", title: "blocks + the written fraction; copy the numeral" },
    { n: "3", name: "Fade", sub: "blocks dim to a check; the equation leads", href: "room-r3-3-fade.html", title: "blocks dim to a check; the equation leads" },
    { n: "W", name: "Workbench", sub: "pull blocks from the bin and build the answer", href: "room-r3-w-workbench.html", title: "pull blocks from the bin and build the answer" },
    { n: "3·", name: "Ghost", sub: "blocks a faded ghost behind; write the whole answer", href: "room-r3-5-ghost.html", title: "blocks a faded ghost behind; write the whole answer" },
    { n: "4", name: "Numbers", sub: "a bare equation; write the whole solution", href: "room-r3-6-numbers.html", title: "a bare equation; write the whole solution" },
    { n: "A", name: "Applied", sub: "a worded question with the fractions shown; write the sum", href: "room-r3-a-applied.html", title: "a worded question with the fractions shown; write the sum" },
    { n: "✎", name: "Show Work", sub: "write out how you'd solve it on a blank slate", href: "room-r3-sw-showwork.html", title: "write out how you'd solve it on a blank slate" },
    { n: "5", name: "Words", sub: "a plain-language word problem; read it and solve", href: "room-r3-7-words.html", title: "a plain-language word problem; read it and solve" },
    { n: "★", name: "Practice", sub: "fresh problems — paced to your mastery", href: "room-r3-practice.html", title: "fresh problems — paced to your mastery" },
  ],
};
