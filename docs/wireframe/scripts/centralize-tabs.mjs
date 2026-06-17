/* centralize-tabs.mjs — stop every page carrying its own tab array.
   - structured pages: replace the `tabs: [ … ]` block with `lesson: "nl"`.
   - raw lesson pages: convert to structured modules that render through
     LessonScreen via `belowHTML` (everything under the tab strip), so they too
     use the shared <StageTabs>. */
import fs from "node:fs";
import path from "node:path";

const DIR = path.resolve("src/screens");

const STRUCTURED = ["room-nl.js", "room-nl-2-write.js", "room-r1.js", "room-r1-5-numbers.js"];
const RAW = ["room-r1-6-applied.js", "room-r1-sw-showwork.js", "room-r1-7-words.js", "room-r1-practice.js"];

// structured: tabs array -> lesson: "nl"
for (const f of STRUCTURED) {
  const p = path.join(DIR, f);
  let s = fs.readFileSync(p, "utf8");
  const start = s.indexOf("  tabs: [");
  const end = s.indexOf("\n  ],", start);
  if (start === -1 || end === -1) { console.warn("!! tabs not found:", f); continue; }
  s = s.slice(0, start) + '  lesson: "nl",' + s.slice(end + "\n  ],".length);
  fs.writeFileSync(p, s);
  console.log("structured -> lesson:", f);
}

// find the index just past the matching </div> for the <div at openIdx
function endOfDiv(s, openIdx) {
  const re = /<div\b|<\/div>/g;
  re.lastIndex = openIdx;
  let depth = 0, m;
  while ((m = re.exec(s))) {
    if (m[0] === "</div>") { depth--; if (depth === 0) return re.lastIndex; }
    else depth++;
  }
  return -1;
}
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

// raw: convert to structured with belowHTML
for (const f of RAW) {
  const p = path.join(DIR, f);
  const src = fs.readFileSync(p, "utf8");
  const title = (src.match(/title:\s*"([^"]*)"/) || [])[1] || "№3 Same Denominators";
  const bodyM = src.match(/bodyHTML:\s*`([\s\S]*)`,\s*\};?\s*$/);
  if (!bodyM) { console.warn("!! bodyHTML not found:", f); continue; }
  const body = bodyM[1];
  const tabsOpen = body.indexOf('<div class="stage-tabs"');
  const tabsEnd = endOfDiv(body, tabsOpen);
  const pageOpen = body.indexOf('<div class="page"');
  const pageEnd = endOfDiv(body, pageOpen);
  if (tabsEnd === -1 || pageEnd === -1) { console.warn("!! parse failed:", f); continue; }
  const below = body.slice(tabsEnd, pageEnd - "</div>".length).replace(/^\s+|\s+$/g, "");

  const mod = `/* ${f.replace(/\.js$/, "")} — lesson step of №3 (rendered by LessonScreen).
   Centralized chrome: toolbar + the shared <StageTabs> (see lessons.js) come from
   the component; this module declares only its identity and the markup BELOW the
   tabs (belowHTML), so it carries no copy of the tab strip. */
export default {
  kind: "lesson",
  lesson: "nl",
  toolbarTitle: ${JSON.stringify(title)},
  route: "#/nl",
  num: "№3",
  tag: "Lesson 3 · On the Number Line",
  title: "Same Denominators",
  belowHTML: \`
${esc(below)}
\`,
};
`;
  fs.writeFileSync(p, mod);
  console.log("raw -> structured (belowHTML):", f);
}
console.log("done");
