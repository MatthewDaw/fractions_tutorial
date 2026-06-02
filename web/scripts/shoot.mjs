// shoot.mjs — parameterized headless-Chromium screenshot tool for the UI-bug sweep.
//
// Each "page" agent in the sweep workflow drives its OWN browser via this script,
// so many pages can be captured in parallel (one thread per page).
//
// Usage:
//   node scripts/shoot.mjs <specPath.json> <outPath.png>
//
// Spec JSON:
//   {
//     "route": "r1",                 // hash route; final URL = BASE + "/#/" + route
//     "url":   "http://...",         // OR a full url (overrides route)
//     "w": 1280, "h": 800,           // viewport; defaults 1280x800 so the stage is scale 1
//     "steps": [ <action>, ... ]     // ordered actions to reach the target state
//   }
//
// Actions (each an object with ONE of these keys):
//   { "wait": 500 }                              pause N ms
//   { "waitFor": "#stage" }                      wait for selector to appear
//   { "click": ".check" }                        click first match
//   { "clickText": "Count them up" }             click first element whose text contains the string
//   { "clickNth": { "selector": ".r1-stage-tab", "n": 1 } }   click the nth (0-based) match
//   { "drag": { "from": "#a", "to": "#b" } }     pointer-drag center(from) → center(to)
//   { "drag": { "from": "#a", "toXY": [400, 300] } }          → absolute viewport px
//   { "dragBy": { "from": "#a", "dx": 120, "dy": -40 } }      → relative offset
//
// Missing selectors are recorded as warnings (not fatal) so a screenshot is always
// produced. Result JSON (warnings, finalUrl) is printed to stdout.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = process.env.SHOOT_BASE || "http://localhost:5173";

async function main() {
  const [, , specPath, outPath] = process.argv;
  if (!specPath || !outPath) {
    console.error("usage: node scripts/shoot.mjs <specPath.json> <outPath.png>");
    process.exit(2);
  }
  const spec = JSON.parse(readFileSync(specPath, "utf8"));
  const w = spec.w || 1280, h = spec.h || 800;
  const url = spec.url || `${BASE}/#/${spec.route || ""}`;
  const warnings = [];

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 2,            // crisp 2x capture
    reducedMotion: "reduce",         // lesson.css honors this → still, screenshot-stable
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push(String(e)));

  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }).catch((e) => warnings.push("goto: " + e.message));
  await page.waitForSelector("#stage", { timeout: 10000 }).catch(() => warnings.push("no #stage"));
  await page.waitForTimeout(500); // let fonts + initial layout settle

  const center = async (sel) => {
    const el = await page.$(sel);
    if (!el) return null;
    const b = await el.boundingBox();
    if (!b) return null;
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };

  for (const step of spec.steps || []) {
    try {
      if ("wait" in step) {
        await page.waitForTimeout(step.wait);
      } else if ("waitFor" in step) {
        await page.waitForSelector(step.waitFor, { timeout: 8000 });
      } else if ("click" in step) {
        const el = await page.$(step.click);
        if (!el) { warnings.push("click: not found " + step.click); continue; }
        await el.click({ timeout: 5000 });
      } else if ("clickText" in step) {
        const el = page.locator(`text=${step.clickText}`).first();
        if (await el.count() === 0) { warnings.push("clickText: not found " + step.clickText); continue; }
        await el.click({ timeout: 5000 });
      } else if ("clickNth" in step) {
        const { selector, n } = step.clickNth;
        const els = await page.$$(selector);
        if (!els[n]) { warnings.push(`clickNth: ${selector}[${n}] not found (have ${els.length})`); continue; }
        await els[n].click({ timeout: 5000 });
      } else if ("drag" in step) {
        const from = await center(step.drag.from);
        if (!from) { warnings.push("drag: from not found " + step.drag.from); continue; }
        const to = step.drag.toXY
          ? { x: step.drag.toXY[0], y: step.drag.toXY[1] }
          : await center(step.drag.to);
        if (!to) { warnings.push("drag: to not found " + step.drag.to); continue; }
        await page.mouse.move(from.x, from.y);
        await page.mouse.down();
        // several intermediate moves so pointermove handlers fire
        for (let i = 1; i <= 8; i++) {
          await page.mouse.move(from.x + (to.x - from.x) * (i / 8), from.y + (to.y - from.y) * (i / 8));
          await page.waitForTimeout(20);
        }
        await page.mouse.up();
      } else if ("dragBy" in step) {
        const from = await center(step.dragBy.from);
        if (!from) { warnings.push("dragBy: from not found " + step.dragBy.from); continue; }
        const to = { x: from.x + step.dragBy.dx, y: from.y + step.dragBy.dy };
        await page.mouse.move(from.x, from.y);
        await page.mouse.down();
        for (let i = 1; i <= 8; i++) {
          await page.mouse.move(from.x + (to.x - from.x) * (i / 8), from.y + (to.y - from.y) * (i / 8));
          await page.waitForTimeout(20);
        }
        await page.mouse.up();
      } else {
        warnings.push("unknown step: " + JSON.stringify(step));
      }
    } catch (e) {
      warnings.push("step error " + JSON.stringify(step) + ": " + e.message);
    }
  }

  await page.waitForTimeout(400); // settle after interactions
  await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: w, height: h } });
  await browser.close();
  console.log(JSON.stringify({ ok: true, finalUrl: url, out: outPath, warnings, consoleErrors }, null, 2));
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
