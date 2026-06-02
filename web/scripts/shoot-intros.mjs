// shoot-intros.mjs — capture each intro "video" at its equation-reveal beat.
// Drives window.__anim.seek(t) + play(), waits for the CSS transition, screenshots.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_BASE || "http://localhost:5173";
const OUT = "scripts/intro-shots";
mkdirSync(OUT, { recursive: true });

// file, equation beat seconds (some get an extra pre-beat shot)
const JOBS = [
  ["m1-equal-groups",       [14.0, 18.0]],
  ["m2-baking-trays",       [21.0]],
  ["m3-times-facts",        [13.0]],
  ["r1-same-denominators",  [19.0]],
  ["r2-same-size-pieces-v2",[18.7]],
  ["r3-scale-one",          [22.1]],
  ["r4-simplify",           [23.7]],
  ["r5-mixed-numbers",      [17.3]],
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const results = [];

for (const [name, beats] of JOBS) {
  const url = `${BASE}/intros/${name}.html`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForFunction(() => window.__anim, null, { timeout: 8000 });
  for (const t of beats) {
    await page.evaluate((s) => { window.__anim.seek(s); window.__anim.play(); }, t);
    await page.waitForTimeout(1200); // let beats fire + transitions settle
    await page.evaluate(() => window.__anim.pause());
    const out = `${OUT}/${name}@${t}.png`;
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1280, height: 800 } });
    results.push(out);
  }
}

await browser.close();
console.log(JSON.stringify({ ok: true, shots: results }, null, 2));
