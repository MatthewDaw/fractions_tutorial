/* lessons/s1.js — identity + step strip for Lesson №7 "Taking Away" (#/s1).
   The single source of truth: each s1 step page declares only `lesson: "s1"`
   and pulls № / tag / title / route + this tab strip from here. */
export default {
  id: "s1",
  num: "№6",
  tag: "Lesson 6 · Taking Away",
  title: "Taking Away",
  route: "#/s1",
  tabs: [
    { n: "1", name: "Decompose", sub: "break 5/8 into eighths", href: "room-s1.html", title: "break 5/8 into eighths" },
    { n: "2", name: "Take Away", sub: "drag 2 pieces off", href: "room-s1-2-takeaway.html", title: "drag 2 pieces off" },
    { n: "3", name: "Numbers", sub: "bare 7/8 − 3/8 = ?", href: "room-s1-3-numbers.html", title: "bare 7/8 − 3/8 = ?" },
    { n: "4", name: "Words", sub: "story problem", href: "room-s1-4-words.html", title: "story problem" },
    { n: "★", name: "Practice", sub: "Fresh problems — paced to your mastery", href: "room-s1-practice.html", title: "Fresh problems — paced to your mastery" },
  ],
};
