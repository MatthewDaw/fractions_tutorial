// Assert M2 Manipulate tray is per-cell (tapping the LAST cell fills ONLY it).
import { chromium } from "playwright";
const BASE = process.env.SHOOT_BASE || "http://localhost:5173";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
const p = await ctx.newPage();
const errs = [];
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
p.on("pageerror", (e) => errs.push(String(e)));
await p.goto(`${BASE}/#/m2`, { waitUntil: "networkidle" });
await p.waitForSelector(".intro-continue"); await p.click(".intro-continue"); await p.waitForTimeout(500);
await p.click(".intro-continue"); await p.waitForSelector(".m2-stage-tab"); await p.waitForTimeout(300);
const tabs = await p.$$(".m2-stage-tab"); await tabs[0].click(); await p.waitForTimeout(400);

const cells = await p.$$(".m2-tray-cell");
const total = cells.length;
// tap the LAST cell
await cells[total - 1].click(); await p.waitForTimeout(300);
const filledAfterLast = await p.$$eval(".m2-tray-cell.is-filled", (els) => els.length);
const readout = (await p.$eval(".m2-count-readout", (e) => e.textContent)).trim();

// tap a middle cell too — should add exactly one more
await cells[5].click(); await p.waitForTimeout(200);
const filledAfter2 = await p.$$eval(".m2-tray-cell.is-filled", (els) => els.length);

// tap the last cell again — should toggle it OFF (self-correct), back to 1
await cells[total - 1].click(); await p.waitForTimeout(200);
const filledAfterToggle = await p.$$eval(".m2-tray-cell.is-filled", (els) => els.length);

const pass = total === 24 && filledAfterLast === 1 && filledAfter2 === 2 && filledAfterToggle === 1;
console.log(JSON.stringify({ total, filledAfterLast, readout, filledAfter2, filledAfterToggle, pass, errs }, null, 2));
await b.close();
process.exit(pass ? 0 : 1);
