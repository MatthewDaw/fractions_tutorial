/* room-den-build — №3 The Bottom Number · Stage 4 "Build". The child picks a
   bottom number so THEIR square (a grid of N equal cells, 1 filled red) matches
   the TARGET square (fixed at 1/6 — 6 cells, 1 red). Top number stays locked at
   1 throughout (unit fraction 1/N). Snapshot: buildDen = 6 → both squares show
   6 cells, 1 red — squares match. */
import { tutor } from "../cookSvg.js";
import { cellBox } from "../eqBox.js";

/* number column — buttons 1–9, current pick highlighted */
const numCol = (pick = 6) =>
  `<div class="sq-pickcol">
    <span class="num-tag">numbers</span>
    <div class="den-numcol">` +
  Array.from({ length: 9 }, (_, i) => i + 1)
    .map((k) => `<div class="den-num${k === pick ? " is-on" : ""}">${k}</div>`)
    .join("") +
  `</div></div>`;

/* fraction glyph: top locked at 1, bottom active (the child's pick) */
const fracGlyph = (d) =>
  `<div class="sq-frac-pick">
    <div class="bignum" style="font-size:48px">
      <span class="n sq-slot-locked">1</span>
      <span class="bar" style="background:var(--ink)"></span>
      <span class="d sq-slot-active">${d}</span>
    </div>
    <div class="sq-frac-hint">top stays 1 — pick the bottom number</div>
  </div>`;

/* a labelled square box */
const sqSide = (label, n, isTarget = false) =>
  `<div class="sq-side">
    <span class="sq-side-lab">${label}</span>
    ${cellBox(n, 1, { cls: isTarget ? "is-target" : "" })}
  </div>`;

const BUILD_DEN = 6; // snapshot: child has picked 6 — squares match

export default {
  kind: "lesson",
  lesson: "den",

  stageHTML: `
    <div class="sq-game">
      ${numCol(BUILD_DEN)}
      ${fracGlyph(BUILD_DEN)}
      ${sqSide("your square", BUILD_DEN)}
      <div class="sq-match" style="font-family:var(--display);font-size:15px;color:var(--ink-mute)">match&nbsp;→</div>
      ${sqSide("target", BUILD_DEN, true)}
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Make Two Identical Squares</h3>
      <div class="hint">
        The top number stays <b>1</b> — one red cell. Pick the <b>bottom number</b>
        so <b>your</b> square is cut into the <b>same number of equal cells</b> as
        the <b>target</b>. More cells means each cell is smaller — change the
        bottom number until the two squares look the same.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="bignum"><span class="n">1</span><span class="bar" style="background:var(--ink)"></span><span class="d">${BUILD_DEN}</span></span>
        <span class="nl-ans-eq">=</span>
        <span class="nl-ans-amt"><b>1</b> red cell out of <b>${BUILD_DEN}</b> equal cells — squares match</span>
      </div>
      <div class="lbar-cap">pick the bottom number that makes your square match the target</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("The top number is always 1 here — one red cell. Pick the bottom number so your square has the same number of cells as the target."),
};
