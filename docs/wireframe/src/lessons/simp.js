/* lessons/simp.js — identity + step strip for the "Simplify" room (#/simp). The
   mirror of Equivalent Fractions: instead of CUTTING cells (×) to make more names,
   the child BUNDLES cells back together (÷) to reach the simplest name. Same
   square, same fixed red "amount" edge. 8/12 → 4/6 → 2/3 by repeated bundling, or
   straight there with one big bundle (÷ the GCF). Each step declares only
   `lesson: "simp"`. */
export default {
  id: "simp",
  backHref: "shelf-combine.html",
  num: "№8",
  tag: "Lesson 8 · Simplify",
  title: "Simplify",
  route: "#/simp",
  tabs: [
    { n: "1", name: "Identify", sub: "name the chunky fraction — 8/12", href: "room-simp.html", title: "name the chunky fraction — 8/12" },
    { n: "2", name: "Bundle", sub: "merge every 2 cells — 8/12 = 4/6, same amount", href: "room-simp-2-bundle.html", title: "merge every 2 cells — 8/12 = 4/6, same amount" },
    { n: "3", name: "Lowest Terms", sub: "bundle until no group fits — that's simplest", href: "room-simp-3-lowest.html", title: "bundle until no group fits — that's simplest" },
    { n: "4", name: "Big Bundle", sub: "÷ the biggest factor — reach simplest in one move", href: "room-simp-4-gcf.html", title: "÷ the biggest factor — reach simplest in one move" },
    { n: "5", name: "Pick", sub: "choose the simplest top & bottom", href: "room-simp-5-pick.html", title: "choose the simplest top & bottom" },
    { n: "6", name: "Numbers", sub: "no picture — write the simplest name", href: "room-simp-6-numbers.html", title: "no picture — write the simplest name" },
    { n: "★", name: "Practice", sub: "Fresh problems — paced to your mastery", href: "room-simp-practice.html", title: "Fresh problems — paced to your mastery" },
  ],
};
