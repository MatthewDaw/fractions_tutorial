/* room-num-make — №4 The Top Number · Stage "Make" (the match-two-squares game,
   step 2 — recreate BOTH numbers). The full Synthesis game: nothing is fixed.
   The child reads the TARGET square, then picks the bottom number (how many
   equal pieces) AND the top number (how many to shade) to rebuild it exactly.
   Snapshot echoes the Synthesis screenshot: target = 8/9 (a 3×3 box, eight red);
   both pickers set to match. 2-D box layout. */
import { tutor } from "../cookSvg.js";

const numcol = (on, max = 9) =>
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
        <div class="den-numcol">${numcol(8)}</div>
      </div>
      <div class="sq-frac sq-frac-pick">
        <div class="bignum"><span class="n sq-slot-active" style="color:var(--red)">8</span><span class="bar" style="background:var(--ink)"></span><span class="d">9</span></div>
        <div class="sq-frac-hint">tap a number, then tap the top or bottom</div>
      </div>
      <div class="sq-side">
        <span class="sq-side-lab">your square</span>
        ${box(9, 8)}
      </div>
      <div class="sq-match">match&nbsp;→</div>
      <div class="sq-side">
        <span class="sq-side-lab">target</span>
        ${box(9, 8, "is-target")}
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Rebuild Both Numbers</h3>
      <div class="hint">
        Now <b>nothing is fixed</b>. Read the <b>target</b>: count <b>all</b> the
        pieces to set the <b>bottom number</b>, then count the <b>red</b> ones to
        set the <b>top number</b>. Get both right and <b>your</b> square will match
        the target exactly.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="sq-frac"><div class="bignum"><span class="n" style="color:var(--red)">8</span><span class="bar" style="background:var(--ink)"></span><span class="d">9</span></div></span>
        <span class="nl-ans-eq">=</span>
        <span class="nl-ans-amt"><b>9</b> pieces, <b>8</b> red — the squares match</span>
      </div>
      <div class="lbar-cap">set the bottom (all pieces) and the top (red pieces) to match the target</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("Count every piece in the target for the bottom number, then count the red pieces for the top number. Set both to rebuild the square."),
};
