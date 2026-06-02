// Assert M2 Manipulate grading still works: fill all 24 cells, write 24, Check → solved.
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
for (const c of cells) { await c.click(); }
await p.waitForTimeout(300);
const filled = await p.$$eval(".m2-tray-cell.is-filled", (els) => els.length);
const readout = (await p.$eval(".m2-count-readout", (e) => e.textContent)).trim();

// type the product into the slate input (the fraction-zone product slate)
const input = await p.$(".m2-fz input, .m2-fz-slate input, input");
let typed = false;
if (input) { await input.click(); await input.fill(""); await input.type("24"); typed = true; }
await p.waitForTimeout(200);

// click Check
const checkBtn = await p.$(".check");
let capText = "";
if (checkBtn) { await checkBtn.click(); await p.waitForTimeout(500); }
try { capText = (await p.$eval(".m2-fz-cap", (e) => e.textContent)).trim(); } catch {}

const pass = filled === 24 && typed && /full marks/i.test(capText);
console.log(JSON.stringify({ filled, readout, typed, capText, pass, errs }, null, 2));
await b.close();
process.exit(pass ? 0 : 1);
