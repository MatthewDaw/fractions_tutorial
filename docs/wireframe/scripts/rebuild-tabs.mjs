/* rebuild-tabs.mjs — drop several steps from the merged №3 lesson and rebuild the
   tab strip across every remaining merged page (structured + raw formats).
   Dropped: Past 1 (nl-3-numbers), Bind (r1-2-bind), Fade (r1-3-fade),
            Workbench (r1-4-workbench). */
import fs from "node:fs";
import path from "node:path";

const DIR = path.resolve("src/screens");

const DELETE = [
  "room-nl-3-numbers.js",
  "room-r1-2-bind.js",
  "room-r1-3-fade.js",
  "room-r1-4-workbench.js",
];

// final 8-tab strip
const TABS = [
  { n: "1", name: "Place", sub: "grow the fraction from 1/4 blocks", href: "room-nl.html" },
  { n: "2", name: "Write", sub: "name the marked point", href: "room-nl-2-write.html" },
  { n: "3", name: "Manipulate", sub: "drag & count blocks", href: "room-r1.html" },
  { n: "4", name: "Numbers", sub: "bare 2/7 + 3/7 = ?", href: "room-r1-5-numbers.html" },
  { n: "5", name: "Applied", sub: "write the sum, then total", href: "room-r1-6-applied.html" },
  { n: "sw", name: "Show Work", sub: "show your work", href: "room-r1-sw-showwork.html" },
  { n: "6", name: "Words", sub: "story problem", href: "room-r1-7-words.html" },
  { n: "★", name: "Practice", sub: "fresh problems — paced to your mastery", href: "room-r1-practice.html" },
];

// structured modules (tabs: array) -> active href
const ACTIVE = {
  "room-nl.js": "room-nl.html",
  "room-nl-2-write.js": "room-nl-2-write.html",
  "room-r1.js": "room-r1.html",
  "room-r1-5-numbers.js": "room-r1-5-numbers.html",
};
// raw modules (stage-tabs HTML in bodyHTML) -> active href
const RAW_ACTIVE = {
  "room-r1-6-applied.js": "room-r1-6-applied.html",
  "room-r1-sw-showwork.js": "room-r1-sw-showwork.html",
  "room-r1-7-words.js": "room-r1-7-words.html",
  "room-r1-practice.js": "room-r1-practice.html",
};

function jsTabs(activeHref) {
  const lines = TABS.map((t) => {
    const tail = t.href === activeHref
      ? `active: true, title: ${JSON.stringify(t.sub)} }`
      : `href: ${JSON.stringify(t.href)}, title: ${JSON.stringify(t.sub)} }`;
    return `    { n: ${JSON.stringify(t.n)}, name: ${JSON.stringify(t.name)}, sub: ${JSON.stringify(t.sub)}, ${tail},`;
  });
  return "  tabs: [\n" + lines.join("\n") + "\n  ],";
}

function htmlTabs(activeHref) {
  const items = TABS.map((t) => {
    const inner =
      `\n          <span class="stage-tab-n">${t.n}</span>` +
      `\n          <span class="stage-tab-tx"><span class="stage-tab-name">${t.name}</span><span class="stage-tab-sub">${t.sub}</span></span>\n        `;
    if (t.href === activeHref) {
      return `        <button type="button" role="tab" aria-selected="true" class="stage-tab is-active" title="${t.sub}">${inner}</button>`;
    }
    return `        <a href="${t.href}" role="tab" aria-selected="false" class="stage-tab" title="${t.sub}">${inner}</a>`;
  });
  return `<div class="stage-tabs" role="tablist" aria-label="Lesson stages">\n${items.join("\n")}\n      </div>`;
}

for (const f of DELETE) {
  const p = path.join(DIR, f);
  if (fs.existsSync(p)) { fs.unlinkSync(p); console.log("deleted", f); }
}

for (const [file, activeHref] of Object.entries(ACTIVE)) {
  const p = path.join(DIR, file);
  let s = fs.readFileSync(p, "utf8");
  const start = s.indexOf("  tabs: [");
  const end = s.indexOf("\n  ],", start);
  if (start === -1 || end === -1) { console.warn("!! tabs block not found:", file); continue; }
  s = s.slice(0, start) + jsTabs(activeHref) + s.slice(end + "\n  ],".length);
  fs.writeFileSync(p, s);
  console.log("rebuilt tabs (structured):", file);
}

for (const [file, activeHref] of Object.entries(RAW_ACTIVE)) {
  const p = path.join(DIR, file);
  let s = fs.readFileSync(p, "utf8");
  const startIdx = s.indexOf('<div class="stage-tabs"');
  if (startIdx === -1) { console.warn("!! stage-tabs not found:", file); continue; }
  const afterOpen = s.indexOf(">", startIdx) + 1;
  const closeIdx = s.indexOf("</div>", afterOpen); // stage-tabs has no nested divs
  if (closeIdx === -1) { console.warn("!! stage-tabs close not found:", file); continue; }
  s = s.slice(0, startIdx) + htmlTabs(activeHref) + s.slice(closeIdx + "</div>".length);
  fs.writeFileSync(p, s);
  console.log("rebuilt tabs (raw):", file);
}
console.log("done");
