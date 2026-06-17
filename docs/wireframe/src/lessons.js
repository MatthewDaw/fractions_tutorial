/* lessons.js — the single source of truth for each lesson's identity + step strip.

   A lesson-step page does NOT carry its own № / tag / title / route or tab array.
   It declares only `lesson: "<id>"`; <LessonScreen>/<StageTabs> resolve the
   identity + strip from here and mark the active tab by matching the current
   route. Add/rename/reorder steps in ONE place.

   Each family lives in its own module under src/lessons/ (default-exporting a
   `{ id, num, tag, title, route, tabs }` object) so they can be authored
   independently. They are aggregated here by `id`. `nl` is kept inline (the
   merged №3 nl+r1 lesson) for historical reasons; the rest come from the glob. */

const nl = {
  id: "nl",
  backHref: "shelf-build.html",
  num: "№5",
  tag: "Lesson 5 · Same Denominators",
  title: "Same Denominators",
  route: "#/nl",
  tabs: [
    { n: "1", name: "Place", sub: "grow the fraction from 1/4 blocks", href: "room-nl.html" },
    { n: "2", name: "Write", sub: "name the marked point", href: "room-nl-2-write.html" },
    { n: "3", name: "Manipulate", sub: "drag & count blocks", href: "room-r1.html" },
    { n: "4", name: "Numbers", sub: "bare 2/7 + 3/7 = ?", href: "room-r1-5-numbers.html" },
    { n: "5", name: "Applied", sub: "write the sum, then total", href: "room-r1-6-applied.html" },
    { n: "6", name: "Show Work", sub: "show your work", href: "room-r1-sw-showwork.html" },
    { n: "7", name: "Words", sub: "story problem", href: "room-r1-7-words.html" },
    { n: "★", name: "Practice", sub: "fresh problems — paced to your mastery", href: "room-r1-practice.html" },
  ],
};

export const LESSONS = { nl };

// Per-family modules (src/lessons/<id>.js) — each default-exports a lesson def.
const familyModules = import.meta.glob("./lessons/*.js", { eager: true });
for (const path in familyModules) {
  const def = familyModules[path].default;
  if (def && def.id) LESSONS[def.id] = def;
}
