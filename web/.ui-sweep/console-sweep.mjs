// Runtime smoke test: load each route, click through the intro and every stage
// tab, and report any console errors / uncaught page errors. Catches controller-
// hook runtime faults (thrown handlers, bad refs, engine emit errors) that a
// layout-geometry check would miss.
import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:5181";
const ROUTES = process.argv.slice(2).length ? process.argv.slice(2) : ["m1", "m2", "m3", "r1", "r4", "r5", "r2"];
const b = await chromium.launch();
let total = 0;
for (const route of ROUTES) {
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  p.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 200)); });
  p.on("pageerror", (e) => errs.push("PAGEERROR: " + String(e).slice(0, 200)));
  await p.goto(`${BASE}/#/${route}`, { waitUntil: "networkidle" });
  for (let i = 0; i < 5; i++) {
    const c = await p.$(".intro-continue");
    if (c) { await c.click().catch(() => {}); await p.waitForTimeout(400); }
  }
  await p.waitForSelector(".stage-tabs", { timeout: 6000 }).catch(() => {});
  const n = await p.$$eval(".stage-tab", (els) => els.length).catch(() => 0);
  for (let i = 0; i < n; i++) {
    const tabs = await p.$$(".stage-tab");
    if (!tabs[i]) break;
    await tabs[i].click().catch(() => {});
    await p.waitForTimeout(450);
  }
  // Ignore benign asset 404s (missing voice mp3s etc.) — only flag real JS errors.
  const real = errs.filter((e) => !/404|Failed to load resource|net::ERR/.test(e));
  total += real.length;
  console.log(`${route}: ${real.length ? "ERRORS(" + real.length + ")" : "clean"}${real.length ? "\n  - " + real.join("\n  - ") : ""}`);
  await p.close();
}
await b.close();
console.log(total === 0 ? "\nPASS — no runtime JS errors." : `\nFAIL — ${total} runtime error(s).`);
