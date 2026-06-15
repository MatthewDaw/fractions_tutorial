/* room-num-build — №4 The Top Number · Stage "Build" (the match-two-squares
   game, step 1 — the bottom number is FIXED). Recreates the Synthesis "make two
   identical squares" game scoped to the TOP number: the box is already cut into
   the right number of pieces (bottom fixed at 6) and the child picks only the
   TOP number to shade the same count as the TARGET. Snapshot: target = 4/6;
   top picker on 4, bottom fixed at 6 → the squares match. 2-D box layout. */
import { tutor } from "../cookSvg.js";

const numcol = (on, max) =>
  Array.from({ length: max }, (_, i) => i + 1)
    .map((k) => `<div class="den-num${k === on ? " is-on" : ""}">${k}</div>`)
    .join("");

const cols = (n) => (n <= 3 ? n : n === 4 ? 2 : 3);
const box = (n, k, cls = "") => {
  const cells = Array.from({ length: n }, (_, i) => `<div class="sq-cell${i < k ? " is-fill" : ""}"></div>`).join("");
  return `<div class="sq-box ${cls}" style="grid-template-columns:repeat(${cols(n)},1fr)">${cells}</div>`;
};

export default {
  kind: "lesson",
  lesson: "num",

  stageHTML: `
    <div class="sq-game">
      <div class="sq-pickcol">
        <span class="num-tag">numbers</span>
        <div class="den-numcol">${numcol(4, 9)}</div>
      </div>
      <div class="sq-frac sq-frac-pick">
        <div class="bignum"><span class="n sq-slot-active" style="color:var(--red)">4</span><span class="bar" style="background:var(--ink)"></span><span class="d sq-slot-locked">6</span></div>
        <div class="sq-frac-hint">bottom is fixed — drop your number on the top</div>
      </div>
      <div class="sq-side">
        <span class="sq-side-lab">your square</span>
        ${box(6, 4)}
      </div>
      <div class="sq-match">match&nbsp;→</div>
      <div class="sq-side">
        <span class="sq-side-lab">target</span>
        ${box(6, 4, "is-target")}
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Match the Shaded Pieces</h3>
      <div class="hint">
        The bottom number is fixed at <b>6</b> — both squares already have six
        equal pieces. Pick the <b>top number</b> so <b>your</b> square has the
        <b>same number of red pieces</b> as the <b>target</b>. The top number just
        counts how many pieces are shaded.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="sq-frac"><div class="bignum"><span class="n" style="color:var(--red)">4</span><span class="bar" style="background:var(--ink)"></span><span class="d">6</span></div></span>
        <span class="nl-ans-eq">=</span>
        <span class="nl-ans-amt"><b>4</b> red pieces out of <b>6</b> — squares match</span>
      </div>
      <div class="lbar-cap">bottom is fixed — pick the top number that matches the target</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("The bottom number is set for you. Just pick the top number so your square has as many red pieces as the target."),
};
