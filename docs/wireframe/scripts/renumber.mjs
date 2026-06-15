/* renumber.mjs — one-shot: after merging №3 (Number Line) + №4 (Same Denominators)
   into one lesson, shift the later lessons down so there's no gap:
     s1 №5→4, cmp №6→5, r3 №7→6, r2 №8→7, r4 №9→8, r5 №10→9.
   Touches ONLY identity fields (num / tag / toolbarTitle / title / num-mark /
   puzzle-tag), never hint/content text, so cross-references stay intact. */
import fs from "node:fs";
import path from "node:path";

const SCREENS = path.resolve("src/screens");
const GROUPS = [
  { prefix: "room-s1", old: 5, neu: 4 },
  { prefix: "room-cmp", old: 6, neu: 5 },
  { prefix: "room-r3", old: 7, neu: 6 },
  { prefix: "room-r2", old: 8, neu: 7 },
  { prefix: "room-r4", old: 9, neu: 8 },
  { prefix: "room-r5", old: 10, neu: 9 },
];

function renumber(src, o, n) {
  const subs = [
    [`num: "№${o}"`, `num: "№${n}"`],
    [`toolbarTitle: "№${o} `, `toolbarTitle: "№${n} `],
    [`title: "№${o} `, `title: "№${n} `],
    [`tag: "Lesson ${o} · `, `tag: "Lesson ${n} · `],
    [`>№${o}</span>`, `>№${n}</span>`],
    [`puzzle-tag">Lesson ${o} · `, `puzzle-tag">Lesson ${n} · `],
  ];
  let out = src;
  let hits = 0;
  for (const [a, b] of subs) {
    const parts = out.split(a);
    if (parts.length > 1) {
      hits += parts.length - 1;
      out = parts.join(b);
    }
  }
  return { out, hits };
}

let files = 0;
let total = 0;
for (const g of GROUPS) {
  for (const f of fs.readdirSync(SCREENS)) {
    if (!f.endsWith(".js")) continue;
    // exact prefix match on the lesson token (room-r2 must not catch room-r2x… it won't, but be precise)
    if (!(f === g.prefix + ".js" || f.startsWith(g.prefix + "-"))) continue;
    const p = path.join(SCREENS, f);
    const src = fs.readFileSync(p, "utf8");
    const { out, hits } = renumber(src, g.old, g.neu);
    if (hits > 0) {
      fs.writeFileSync(p, out);
      files++;
      total += hits;
      console.log(`  ${f}: №${g.old}→№${g.neu} (${hits} edits)`);
    } else {
      console.warn(`  !! ${f}: no identity hits for №${g.old}`);
    }
  }
}
console.log(`renumbered ${files} files, ${total} identity edits`);
