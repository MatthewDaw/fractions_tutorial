/* room-cmp-scale — №5 Compare & Check · Stage 3 "Scale Up". When the bottoms
   differ you can't just line up the pictures — first MULTIPLY each fraction up to
   a common bottom, and only THEN compare the tops.
   2/3 = 8/12, 3/4 = 9/12 → 8/12 < 9/12, so 2/3 < 3/4. */
import { tutor } from "../cookSvg.js";
import { cmpDrag } from "../compare.js";
import { digitGrid } from "../eqBox.js";

const frac = (n, d, big = 42) => `<div class="bignum" style="font-size:${big}px;min-width:54px"><span class="n" style="color:var(--red)">${n}</span><span class="bar" style="background:var(--ink)"></span><span class="d">${d}</span></div>`;
const slotFrac = (n, d) => `<div class="bignum" style="font-size:42px;min-width:54px"><span class="n eq-slot-active" style="color:var(--red)">${n}</span><span class="bar" style="background:var(--ink)"></span><span class="d eq-slot-active" style="color:var(--red)">${d}</span></div>`;
/* the symbols sit in a bin on the LEFT of the answer; drag one into the slot. */
/* one multiply row: 2/3  × 4/4  →  [ / ] (the scaled fraction the child builds) */
const mulRow = (n, d, by, sn, sd) => `<div class="eq-stage" style="padding:0; gap:16px; align-items:center">
  ${frac(n, d, 40)}<span class="eq-eq" style="font-style:normal">× ${by}/${by} →</span>${slotFrac(sn, sd)}</div>`;

export default {
  kind: "lesson",
  lesson: "cmp",

  stageHTML: `
    <div style="display:flex; align-items:center; justify-content:center; gap:34px; height:100%;">
      ${digitGrid(8)}
      <div style="display:flex; flex-direction:column; gap:18px;">
        <div class="eq-cap" style="text-align:center">Different bottoms — multiply each up to <b>twelfths</b> first.</div>
        ${mulRow(2, 3, 4, 8, 12)}
        ${mulRow(3, 4, 3, 9, 12)}
        <div class="eq-eq">same bottom now — compare the tops below ↓</div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Multiply to a Common Bottom</h3>
      <div class="hint">
        Different bottoms means the pieces are different sizes — you <b>can't</b>
        compare yet. First <b>multiply</b> each fraction up to the <b>same bottom</b>
        (the cross-multiply skill): <b>2/3 = 8/12</b> and <b>3/4 = 9/12</b>. Only
        <b>after</b> the bottoms match do you compare the tops — more on top wins.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">${cmpDrag(8, 12, 9, 12)}</div>
      <div class="lbar-cap">you scaled to a common bottom — now drag the symbol between the tops</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("Different bottoms, so multiply first. Two thirds is eight twelfths, three quarters is nine twelfths. NOW the bottoms match — eight is less than nine, so 2/3 is less than 3/4."),
};
