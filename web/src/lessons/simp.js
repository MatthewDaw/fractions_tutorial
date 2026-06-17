/* lessons/simp.js — identity + step strip for the "Simplify" room (#/simp).
   The mirror of Equivalent Fractions: instead of CUTTING cells (×) to make more
   names, the child BUNDLES cells back together (÷) to reach the simplest name.
   Same visual bar, same fixed red "amount" edge. 8/12 → 4/6 → 2/3 by repeated
   bundling, or straight there with one big bundle (÷ the GCF). */
export default {
  id: "simp",
  num: "№8",
  tag: "Lesson 8 · Simplify",
  title: "Simplify",
  route: "#/simp",
  tabs: [
    { n: "1", name: "Identify",     sub: "name the chunky fraction — 8/12",                    href: "room-simp.html", title: "name the chunky fraction — 8/12" },
    { n: "2", name: "Bundle",       sub: "merge every 2 cells — 8/12 = 4/6, same amount",       href: "room-simp-2-bundle.html", title: "merge every 2 cells — 8/12 = 4/6, same amount" },
    { n: "3", name: "Lowest Terms", sub: "bundle until no group fits — that's simplest",         href: "room-simp-3-lowest.html", title: "bundle until no group fits — that's simplest" },
    { n: "4", name: "Big Bundle",   sub: "÷ the biggest factor — reach simplest in one move",   href: "room-simp-4-gcf.html", title: "÷ the biggest factor — reach simplest in one move" },
    { n: "5", name: "Pick",         sub: "choose the simplest top & bottom",                     href: "room-simp-5-pick.html", title: "choose the simplest top & bottom" },
    { n: "★", name: "Practice",     sub: "Fresh problems — paced to your mastery",               href: "room-simp-practice.html", title: "Fresh problems — paced to your mastery" },
  ],
  layout: { railW: 452, footH: 150 },
  goals: {
    identify:    "The box has *12* equal cells and *8* are shaded. That's the fraction *8/12* — eight shaded out of twelve equal cells. A lot of tiny pieces for the amount of red. Next we bundle cells to find the fewest pieces.",
    bundle:      "Drag the *÷2* group tool onto the bar. Every two cells merge into one — 12 cells become 6 and 8 shaded become 4. The red edge *does not move*: 8/12 and 4/6 are the *same amount*, just fewer pieces.",
    lowest:      "Keep bundling until *no group fits anymore*. When no tool divides both top and bottom evenly, you've reached the *simplest name* — the fewest possible pieces for the same amount.",
    bigbundle:   "One big bundle reaches simplest in a single move. The *biggest shared factor* of 8 and 12 is 4 — drag ÷4 onto the bar to go from 8/12 straight to *2/3*. That's the GCF shortcut.",
    pick:        "The target is *8/12*. Pick the top and bottom that keep the same red amount but use the *fewest pieces*. Reduce it as far as it will go — choose the simplest pair.",
  },
};
