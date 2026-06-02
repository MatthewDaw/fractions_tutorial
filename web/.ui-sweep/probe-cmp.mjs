// Measure the compare-stage number lines: for each .nl-point and .nl-fill,
// print its x/width and which line (by nearby tag) it belongs to.
import { chromium } from "playwright";
const BASE = process.env.SHOOT_BASE || "http://localhost:5173";
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await p.goto(`${BASE}/#/cmp`, { waitUntil: "domcontentloaded" }).catch(() => {});
await p.waitForSelector("#stage", { timeout: 8000 }).catch(() => {});
await p.waitForTimeout(1200);
const data = await p.evaluate(() => {
  const out = { tags: [], fills: [], points: [], lines: [] };
  for (const el of document.querySelectorAll(".cmp-line-tag")) {
    const r = el.getBoundingClientRect();
    out.tags.push({ text: el.textContent.trim().replace(/\s+/g, ""), x: Math.round(r.x), y: Math.round(r.y) });
  }
  for (const el of document.querySelectorAll(".nl-fill")) {
    const r = el.getBoundingClientRect();
    out.fills.push({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) });
  }
  for (const el of document.querySelectorAll(".nl-point")) {
    const r = el.getBoundingClientRect();
    out.points.push({ cx: Math.round(r.x + r.width / 2), y: Math.round(r.y), w: Math.round(r.width) });
  }
  for (const el of document.querySelectorAll(".nline")) {
    const r = el.getBoundingClientRect();
    out.lines.push({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) });
  }
  return out;
});
console.log(JSON.stringify(data, null, 2));
await b.close();
