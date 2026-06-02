// One-off: verify the mandatory show-work gate. Drive a lesson to the SW step,
// assert Next is disabled, draw a stroke on the blank canvas, assert Next enables.
import { chromium } from "playwright";

const BASE = "http://localhost:5173";

async function run(route, tabSel, tabN, label, out) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push(String(e)));

  await page.goto(`${BASE}/#/${route}`, { waitUntil: "networkidle" });
  await page.waitForSelector(".intro-continue");
  await page.click(".intro-continue");
  await page.waitForTimeout(600);
  await page.click(".intro-continue");
  await page.waitForSelector(tabSel);
  await page.waitForTimeout(400);
  const tabs = await page.$$(tabSel);
  await tabs[tabN].click();
  await page.waitForTimeout(700);

  const findNext = () => page.locator("button.check", { hasText: "Next" }).first();
  const before = await findNext().isDisabled().catch(() => "no-button");

  // draw a stroke on the blank canvas
  const canvas = await page.$(".bs-canvas");
  const b = await canvas.boundingBox();
  await page.mouse.move(b.x + b.width * 0.3, b.y + b.height * 0.4);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(b.x + b.width * (0.3 + 0.4 * i / 8), b.y + b.height * (0.4 + 0.2 * i / 8));
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
  await page.waitForTimeout(300);

  const after = await findNext().isDisabled().catch(() => "no-button");
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1280, height: 800 } });

  // advance via Next, confirm we land on Words
  await findNext().click().catch(() => {});
  await page.waitForTimeout(700);
  const onWords = await page.locator("text=Optional").first().count();

  await browser.close();
  console.log(JSON.stringify({ label, nextDisabledBeforeInk: before, nextDisabledAfterInk: after, wordsScratchVisibleAfterAdvance: onWords > 0, consoleErrors: errs }, null, 2));
}

await run("m2", ".m2-stage-tab", 6, "M2", ".ui-sweep/verify-shots/m2-sw-inked.png");
await run("r2", ".beat-btn", 7, "R2", ".ui-sweep/verify-shots/r2-sw-inked.png");
