import { chromium } from "playwright";
const BASE = "http://localhost:5173";
const routes = ["r2", "r5", "m1", "r4"];
const b = await chromium.launch();
for (const r of routes) {
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto(BASE + "/#/" + r, { waitUntil: "networkidle" });
  for (let i = 0; i < 4; i++) {
    const c = await p.$(".intro-continue");
    if (c) { await c.click().catch(()=>{}); await p.waitForTimeout(500); }
  }
  await p.waitForSelector(".stage-tabs", { timeout: 5000 }).catch(()=>{});
  const m = await p.evaluate(() => {
    const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) }; };
    const tabs = [...document.querySelectorAll(".stage-tab")];
    const rights = tabs.map(t => Math.round(t.getBoundingClientRect().right));
    return { page: q(".page"), topbar: q(".topbar"), tabsBox: q(".stage-tabs"), controls: q(".controls"), tabCount: tabs.length, maxTabRight: Math.max(...rights), innerW: window.innerWidth };
  });
  console.log(r.padEnd(3), JSON.stringify(m));
  await p.close();
}
await b.close();
