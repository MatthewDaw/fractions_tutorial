/* room-den-build — №3 The Bottom Number · Stage "Build" (the match-two-squares
   game, on OUR 2-D box). Recreates the Synthesis "make two identical squares"
   game, but scoped to the BOTTOM number: the TOP number is fixed at 1 (a unit
   fraction 1/N) and never changes — the child only picks the bottom number to
   split YOUR box into the same number of pieces as the TARGET. One piece is
   already red. Snapshot: target = 1/6; bottom picker on 6 → the two squares
   match. 2-D box layout (the game uses squares, not the ruler). */
import { tutor } from "../cookSvg.js";

// bottom-number picker 1..9 (the chosen value highlighted)
const numcol = (on) =>
  Array.from({ length: 9 }, (_, i) => i + 1)
    .map((k) => `<div class="den-num${k === on ? " is-on" : ""}">${k}</div>`)
    .join("");

// how many grid columns make the box look square-ish (1 row for ≤3, 2×2 for 4)
const cols = (n) => (n <= 3 ? n : n === 4 ? 2 : 3);
// a square split into n cells with the first k filled red
const box = (n, k, cls = "") => {
  const cells = Array.from({ length: n }, (_, i) => `<div class="sq-cell${i < k ? " is-fill" : ""}"></div>`).join("");
  return `<div class="sq-box ${cls}" style="grid-template-columns:repeat(${cols(n)},1fr)">${cells}</div>`;
};

export default {
  kind: "lesson",
  lesson: "den",

  stageHTML: `
    <div class="sq-game">
      <div class="sq-pickcol">
        <span class="num-tag">numbers</span>
        <div class="den-numcol">${numcol(6)}</div>
      </div>
      <div class="sq-frac sq-frac-pick">
        <div class="bignum"><span class="n sq-slot-locked">1</span><span class="bar" style="background:var(--ink)"></span><span class="d sq-slot-active">6</span></div>
        <div class="sq-frac-hint">top stays 1 — drop your number on the bottom</div>
      </div>
      <div class="sq-side">
        <span class="sq-side-lab">your square</span>
        ${box(6, 1)}
      </div>
      <div class="sq-match">match&nbsp;→</div>
      <div class="sq-side">
        <span class="sq-side-lab">target</span>
        ${box(6, 1, "is-target")}
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Make Two Identical Squares</h3>
      <div class="hint">
        The top number stays <b>1</b> — one red piece. Pick the <b>bottom number</b>
        so <b>your</b> square is cut into the <b>same number of equal pieces</b> as
        the <b>target</b>. More pieces means each piece is smaller — change the
        bottom number until the two squares look the same.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="sq-frac"><div class="bignum"><span class="n">1</span><span class="bar" style="background:var(--ink)"></span><span class="d">6</span></div></span>
        <span class="nl-ans-eq">=</span>
        <span class="nl-ans-amt"><b>1</b> red piece out of <b>6</b> equal pieces — squares match</span>
      </div>
      <div class="lbar-cap">pick the bottom number that makes your square match the target</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("The top number is always 1 here — one red piece. Pick the bottom number so your square has the same number of pieces as the target."),
};
