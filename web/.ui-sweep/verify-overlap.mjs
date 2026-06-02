// Verify the shared LessonBoard fix: the answer bar must never overlap the stage.
// Drives each lesson, walks its stage tabs, and for every stage measures whether
// the answer zone's top is below the stage zone's bottom (no overlap). Screenshots
// each stage to verify-shots/overlap-<route>-<n>.png.
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE || "http://localhost:5179";
const ROUTES = process.argv.slice(2).length ? process.argv.slice(2) : ["m1"];
const OUT = new URL("./verify-shots/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
fs.mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
let bad = 0;
for (const route of ROUTES) {
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto(`${BASE}/#/${route}`, { waitUntil: "networkidle" });
  for (let i = 0; i < 5; i++) {
    const c = await p.$(".intro-continue");
    if (c) { await c.click().catch(() => {}); await p.waitForTimeout(450); }
  }
  await p.waitForSelector(".stage-tabs", { timeout: 6000 }).catch(() => {});
  const tabCount = await p.$$eval(".stage-tab", (els) => els.length).catch(() => 0);
  for (let n = 0; n < tabCount; n++) {
    const tabs = await p.$$(".stage-tab");
    if (!tabs[n]) break;
    await tabs[n].click().catch(() => {});
    await p.waitForTimeout(650);
    const m = await p.evaluate(() => {
      const box = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), h: Math.round(r.height) }; };
      const wide = !!document.querySelector(".lboard.is-wide");
      const hud = !!document.querySelector(".hud");
      if (wide) {
        // wide = full-width word column + narrow tutor column, SIDE BY SIDE.
        // overlap only if the columns overlap horizontally.
        const wp = box(".lboard-wp"), tutor = box(".lboard-tutor");
        const ov = wp && tutor ? Math.round(wp.right - tutor.left) : null;
        return { mode: "wide", a: wp, b: tutor, overlap: ov, axis: "x" };
      }
      if (hud && !document.querySelector(".lboard")) return { mode: "hud", a: null, b: null, overlap: null };
      // split: stage row above the answer row — overlap if stage bottom passes answer top.
      const stage = box(".lboard-stage"), answer = box(".lboard-answer");
      const ov = stage && answer ? Math.round(stage.bottom - answer.top) : null;
      return { mode: "split", a: stage, b: answer, overlap: ov, axis: "y" };
    });
    const verdict = m.overlap == null ? `n/a (${m.mode})` : (m.overlap > 2 ? `OVERLAP ${m.overlap}px` : `ok (${m.mode})`);
    if (m.overlap != null && m.overlap > 2) bad++;
    console.log(`${route} stage ${n + 1}: ${verdict}  a=${JSON.stringify(m.a)} b=${JSON.stringify(m.b)}`);
    await p.screenshot({ path: `${OUT}overlap-${route}-${n + 1}.png` });
  }
  await p.close();
}
await b.close();
console.log(bad === 0 ? "\nPASS — no overlaps detected." : `\nFAIL — ${bad} overlapping stage(s).`);
