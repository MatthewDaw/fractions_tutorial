/* lessons/r3.js — identity + step strip for Lesson №9 "Scale One" (#/r3).
   The single source of truth: each r3 step page declares only `lesson: "r3"`
   and pulls № / tag / title / route + this tab strip from here. */
export default {
  id: "r3",
  num: "№9",
  tag: "Lesson 9 · Scale One",
  title: "Scale One",
  route: "#/r3",
  tabs: [
    { n: "1", name: "Manipulate", sub: "the blocks ARE the problem; drag & slice by touch", href: "room-r3.html" },
    { n: "2", name: "Ghost", sub: "blocks a faded ghost behind; write the whole answer", href: "room-r3-5-ghost.html" },
    { n: "3", name: "Numbers", sub: "a bare equation; write the whole solution", href: "room-r3-6-numbers.html" },
    { n: "4", name: "Simplify", sub: "reduce your sum to lowest terms — 3/6 = 1/2", href: "room-r3-8-simplify.html" },
    { n: "5", name: "Applied", sub: "a worded question with the fractions shown; write the sum", href: "room-r3-a-applied.html" },
    { n: "6", name: "Show Work", sub: "write out how you'd solve it on a blank slate", href: "room-r3-sw-showwork.html" },
    { n: "7", name: "Words", sub: "a plain-language word problem; read it and solve", href: "room-r3-7-words.html" },
    { n: "★", name: "Practice", sub: "fresh problems — paced to your mastery", href: "room-r3-practice.html" },
  ],
};
