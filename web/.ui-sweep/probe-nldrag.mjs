// End-to-end drag test for the number-line lesson: grab the point bead and drag
// it to the 3/4 tick; assert the lesson registers a correct placement (and that
// it did NOT prematurely solve before release). Verifies the smooth-drag +
// judge-on-release fix.
import { chromium } from "playwright";
const BASE = process.env.SHOOT_BASE || "http://localhost:5173";
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
const errs = [];
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await p.goto(`${BASE}/#/nl`, { waitUntil: "domcontentloaded" }).catch(() => {});
await p.waitForSelector("#stage", { timeout: 8000 }).catch(() => {});
await p.waitForTimeout(1000);

const geom = await p.evaluate(() => {
  const dot = document.querySelector(".nl-point");
  const line = document.querySelector(".nline");
  const dr = dot.getBoundingClientRect(), lr = line.getBoundingClientRect();
  return {
    dot: { cx: dr.x + dr.width / 2, cy: dr.y + dr.height / 2 },
    line: { left: lr.x, top: lr.y, width: lr.width },
  };
});
// target = 3/4 along the line (0..1)
const targetX = geom.line.left + 0.75 * geom.line.width;
const targetY = geom.line.top;

// drag: press the bead, move in steps (checking it has NOT solved mid-drag), release on 3/4
await p.mouse.move(geom.dot.cx, geom.dot.cy);
await p.mouse.down();
let solvedMidDrag = false;
for (let i = 1; i <= 10; i++) {
  await p.mouse.move(geom.dot.cx + (targetX - geom.dot.cx) * (i / 10), targetY, { steps: 2 });
  await p.waitForTimeout(30);
  if (i === 9) {
    solvedMidDrag = await p.evaluate(() =>
      /Right on it|Next stage|✓ on the line/i.test(document.body.innerText));
  }
}
await p.mouse.up();
await p.waitForTimeout(700);

const after = await p.evaluate(() => {
  const txt = document.body.innerText;
  const dot = document.querySelector(".nl-point").getBoundingClientRect();
  const line = document.querySelector(".nline").getBoundingClientRect();
  return {
    solvedText: /Right on it|Next stage ?!|placed at three fourths|✓ on the line/i.test(txt),
    dotFrac: ((dot.x + dot.width / 2 - line.x) / line.width).toFixed(3), // should be ~0.750
  };
});
console.log(JSON.stringify({ solvedMidDrag, after, consoleErrors: errs.slice(0, 4) }, null, 2));
await b.close();
