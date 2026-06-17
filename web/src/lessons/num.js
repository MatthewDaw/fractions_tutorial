/* num — "The Top Number" (Numerator). Recreates the Synthesis "top number"
   build-up on OUR ruler: explore top numbers → count the shaded pieces → make a
   whole → set both numbers to match a target. Then the house arch toward REAL
   math: raw symbols → a word problem with the numbers in it → a plain word
   problem → practice. Numbering is provisional (renumbered in one pass later). */
export default {
  id: "num",
  num: "№4",
  tag: "Lesson 4 · Building Fractions",
  title: "The Top Number",
  route: "#/num",
  tabs: [
    { n: "1", name: "Paint",   sub: "cut into N, then paint K/N red",    href: "room-num-paint.html" },
    { n: "2", name: "Shade",   sub: "try different top numbers",         href: "room-num.html" },
    { n: "3", name: "Count",   sub: "the top number counts the shaded",  href: "room-num-2-count.html" },
    { n: "4", name: "Whole",   sub: "fill every piece — n/n is 1",       href: "room-num-3-whole.html" },
    { n: "5", name: "Build",   sub: "match two squares (top only)",      href: "room-num-build.html" },
    { n: "6", name: "Make",    sub: "match two squares (both numbers)",  href: "room-num-make.html" },
    { n: "7", name: "Numbers", sub: "more on top — just the symbols",    href: "room-num-5-numbers.html" },
    { n: "8", name: "Story",   sub: "a problem with the numbers in it",  href: "room-num-6-story.html" },
    { n: "9", name: "Words",   sub: "a story problem",                   href: "room-num-7-words.html" },
    { n: "★", name: "Practice", sub: "fresh problems — paced to your mastery", href: "room-num-practice.html" },
  ],
};
