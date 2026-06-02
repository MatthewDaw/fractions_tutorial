import { chromium } from "playwright";
const BASE = "http://localhost:5173";
const b = await chromium.launch();
for (const r of ["r2", "m1"]) {
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto(BASE + "/#/" + r, { waitUntil: "networkidle" });
  for (let i = 0; i < 4; i++) { const c = await p.$(".intro-continue"); if (c) { await c.click().catch(()=>{}); await p.waitForTimeout(500); } }
  await p.waitForSelector(".stage-tabs", { timeout: 5000 }).catch(()=>{});
  const info = await p.evaluate(() => {
    const e = document.querySelector(".stage-tabs");
    const cs = getComputedStyle(e);
    return {
      display: cs.display, gtc: cs.gridTemplateColumns, flexWrap: cs.flexWrap,
      parentClass: e.parentElement?.className, parentDisplay: getComputedStyle(e.parentElement).display,
      tab0display: getComputedStyle(document.querySelector(".stage-tab")).display,
      sheetHasStageTabs: [...document.styleSheets].some(ss => { try { return [...ss.cssRules].some(r => /\.stage-tabs/.test(r.selectorText||"")); } catch { return false; } }),
    };
  });
  console.log(r, JSON.stringify(info, null, 0));
  await p.close();
}
await b.close();
