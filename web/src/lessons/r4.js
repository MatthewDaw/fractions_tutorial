/* lessons/r4.js — identity + step strip for Lesson №8 "Simplify" (#/r4).
   The single source of truth: each r4 step page declares only `lesson: "r4"`
   and pulls № / tag / title / route + this tab strip from here. */
export default {
  id: "r4",
  num: "№8",
  tag: "Lesson 8 · Simplifying",
  title: "Simplify",
  route: "#/r4",
  tabs: [
    { n: "1", name: "Group", sub: "Drag a group size — bundle equal cells", href: "room-r4.html", title: "Drag a group size — bundle equal cells" },
    { n: "2", name: "Bind", sub: "Group, then write the equivalent name", href: "room-r4-2-bind.html", title: "Group, then write the equivalent name" },
    { n: "3", name: "Fade", sub: "Pick the shared factor, then write", href: "room-r4-3-fade.html", title: "Pick the shared factor, then write" },
    { n: "4", name: "Numbers", sub: "Bare 8/12 — write lowest terms", href: "room-r4-4-numbers.html", title: "Bare 8/12 — write lowest terms" },
    { n: "5", name: "Applied", sub: "Write the fraction, then its simplest name", href: "room-r4-5-applied.html", title: "Write the fraction, then its simplest name" },
    { n: "SW", name: "Show Work", sub: "Show your work on a blank slate", href: "room-r4-sw-showwork.html", title: "Show your work on a blank slate" },
    { n: "6", name: "Words", sub: "Read the recipe, write the simplest name", href: "room-r4-6-words.html", title: "Read the recipe, write the simplest name" },
    { n: "★", name: "Practice", sub: "Fresh problems — paced to your mastery", href: "room-r4-practice.html", title: "Fresh problems — paced to your mastery" },
  ],
  // Layout dims for the split LessonBoard (was duplicated per-stage in AppR4.jsx).
  layout: { railW: 452, footH: 150 },
  // Per-stage goal-banner copy. Keyed by the lesson's internal stage ids
  // (manipulate/bind/fade/numbers/applied/showwork/words). Copy is data; it is
  // rendered through <LessonGoal>. Strings here use plain markup tokens the
  // component turns into <b> emphasis (no JSX in the registry). The {n}/{d}
  // placeholders are filled by the component from START_NUM/START_DEN.
  goals: {
    manipulate: "Babushka's answer came out as *8 out of 12* pieces. Drag a group size onto the bar to bundle the cells — divide the top *and* bottom by the same number. The filled edge can't move, so the amount stays the same.",
    bind: "Group the bar into bigger cells — and each time, *copy the new name* onto the Slate. 4 out of 6, then 2 out of 3: all the SAME amount as 8/12.",
    fade: "The bar is fading. *Pick the number* that divides BOTH 8 and 12, then *write* the equivalent line yourself. Same number top and bottom — that's dividing by 1.",
    numbers: "Just the numbers: *{n}/{d} = ?* Write the equivalent fraction in lowest terms — its simplest name. No bar to lean on.",
    applied: "A question in words. First *write the fraction* it describes ({n}/{d}); once that's checked, *write the same amount with its simplest name*.",
    showwork: "Now *show your work* on the blank slate — write anything you like. When you've put something down, tap *Next*.",
    words: "Read Babushka's recipe. The leftover comes out as an unwieldy fraction — *write the same amount as its simplest name*.",
  },
};
