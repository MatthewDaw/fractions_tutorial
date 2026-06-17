/* lessons/cmp.js — identity + step strip for Lesson №5 "Compare & Check" (#/cmp).
   Rewritten as a natural extension of "The Top Number": it starts with two SQUARES
   showing different fractions, makes the square→ruler mapping explicit, then hands
   off to the rulers, then drops the picture so the child compares from the numbers.
   It also walks from SAME-base fractions (same-size pieces) to DIFFERENT bases.
   Each step page declares only `lesson: "cmp"`. */
export default {
  id: "cmp",
  backHref: "shelf-combine.html",
  num: "№11",
  tag: "Lesson 11 · Compare & Check",
  title: "Compare & Check",
  route: "#/cmp",
  tabs: [
    { n: "1", name: "Boxes", sub: "same base — which square has more shaded?", href: "room-cmp.html", title: "same base — which square has more shaded?" },
    { n: "2", name: "Box → Ruler", sub: "the same fraction as a square AND a ruler", href: "room-cmp-2-map.html", title: "the same fraction as a square AND a ruler" },
    { n: "3", name: "Rulers · Same", sub: "same base on rulers — longer red wins", href: "room-cmp-3-same.html", title: "same base on rulers — longer red wins" },
    { n: "4", name: "Rulers · Different", sub: "different base — line the rulers up", href: "room-cmp-4-diff.html", title: "different base — line the rulers up" },
    { n: "5", name: "Scale Up", sub: "multiply both fractions to a common bottom", href: "room-cmp-scale.html", title: "multiply both fractions to a common bottom" },
    { n: "6", name: "Numbers", sub: "no picture — compare from the numbers", href: "room-cmp-5-numbers.html", title: "no picture — compare from the numbers" },
    { n: "★", name: "Practice", sub: "Fresh problems — paced to your mastery", href: "room-cmp-practice.html", title: "Fresh problems — paced to your mastery" },
  ],
};
