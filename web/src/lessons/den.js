/* den — "The Bottom Number" (Denominator). A foundational lesson taught on the
   RULER: pick a bottom number, watch the 0→1 ruler split into that many equal
   pieces, and discover that a BIGGER bottom number makes each piece SMALLER.
   Arch: play/split → map image↔number → see which is smaller → reason from the
   number alone → practice. (Numbering is provisional; the whole map is renumbered
   in one pass later.) */
export default {
  id: "den",
  num: "№3",
  tag: "Lesson 3 · Building Fractions",
  title: "The Bottom Number",
  route: "#/den",
  tabs: [
    { n: "1", name: "Paint",   sub: "cut into N, then paint 1/N red",    href: "room-den-paint.html" },
    { n: "2", name: "Split",   sub: "break the ruler into equal pieces", href: "room-den.html" },
    { n: "3", name: "Match",   sub: "match the ruler to its number",     href: "room-den-2-match.html" },
    { n: "4", name: "Build",   sub: "make two squares match (bottom only)", href: "room-den-build.html" },
    { n: "5", name: "Smaller", sub: "which piece is smaller?",           href: "room-den-3-smaller.html" },
    { n: "6", name: "Numbers", sub: "smaller — just from the number",    href: "room-den-4-numbers.html" },
    { n: "★", name: "Practice", sub: "fresh problems — paced to your mastery", href: "room-den-practice.html" },
  ],
};
