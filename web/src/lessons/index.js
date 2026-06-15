/* lessons/index.js — the single source of truth for every lesson's identity +
   step strip. Mirrors docs/wireframe/src/lessons.js.

   A lesson component does NOT carry its own № / tag / title / route or tab
   array. It declares only `lesson: "<id>"` (or looks itself up by id); the
   shared shell resolves identity + strip from the LESSONS map here. Add/rename/
   reorder steps in ONE place.

   Each family lives in its own module under src/lessons/<id>.js, default-
   exporting a `{ id, num, tag, title, route, tabs:[{ n, name, sub, href }] }`
   object. They are imported explicitly (rather than glob-scanned) because this
   directory also holds the r2/r3 problem-data modules (r2-unit.js,
   r3-nonunit.js) which are NOT registry entries.

   PURELY ADDITIVE: as of the Foundation phase no component imports this yet.
   Wiring each lesson to read from LESSONS happens per-page later. */

import m1 from "./m1.js";
import m3 from "./m3.js";
import nl from "./nl.js";
import r1 from "./r1.js";
import r2 from "./r2.js";
import r3 from "./r3.js";
import r4 from "./r4.js";
import r5 from "./r5.js";
import s1 from "./s1.js";
import cmp from "./cmp.js";
import den from "./den.js";
import num from "./num.js";

const DEFS = [m1, m3, nl, r1, r2, r3, r4, r5, s1, cmp, den, num];

export const LESSONS = {};
for (const def of DEFS) {
  if (def && def.id) LESSONS[def.id] = def;
}

export default LESSONS;
