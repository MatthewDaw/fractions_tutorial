/* lessons/cmp.js — identity + step strip for Lesson №5 "Compare & Check" (#/cmp).
   The single source of truth: each cmp step page declares only `lesson: "cmp"`
   and pulls № / tag / title / route + this tab strip from here. */
export default {
  id: "cmp",
  num: "№5",
  tag: "Lesson 5 · Compare & Check",
  title: "Compare & Check",
  route: "#/cmp",
  tabs: [
    { n: "1", name: "Compare", sub: "Which is bigger? Pick < = or >", href: "room-cmp.html", title: "Which is bigger? Pick < = or >" },
    { n: "2", name: "Benchmark", sub: "Nearest of 0, one-half, or 1?", href: "room-cmp-2-benchmark.html", title: "Nearest of 0, one-half, or 1?" },
    { n: "3", name: "Reason", sub: "Is the sum less, about, or more than 1?", href: "room-cmp-3-reason.html", title: "Is the sum less, about, or more than 1?" },
    { n: "★", name: "Practice", sub: "Fresh problems — paced to your mastery", href: "room-cmp-practice.html", title: "Fresh problems — paced to your mastery" },
  ],
};
