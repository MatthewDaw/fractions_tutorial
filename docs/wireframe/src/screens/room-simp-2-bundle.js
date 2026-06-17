/* room-simp-2-bundle — №9 Simplify · Stage 2 "Bundle". The inverse of the
   equivalence "Double": drag the ÷2 bundle tool across 8/12 and every TWO cells
   merge into one, so 12 cells become 6 and 8 shaded become 4 — 8/12 = 4/6. The red
   "same amount" edge proves nothing was lost; only the cut lines were rubbed out. */
import { tutor } from "../cookSvg.js";
import { eqBox, eqFrac, eqTools } from "../eqBox.js";

export default {
  kind: "lesson",
  lesson: "simp",

  stageHTML: `
    <div class="eq-stage">
      <div class="eq-col">
        <span class="eq-lab">before</span>
        ${eqBox(3, 4, 2, { guide: true })}
        ${eqFrac(8, 12)}
      </div>
      <div class="eq-eq">=</div>
      <div class="eq-col">
        <span class="eq-lab">after the ÷2 bundle</span>
        ${eqBox(3, 2, 2, { guide: true })}
        ${eqFrac(4, 6)}
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Bundle Every Two Cells</h3>
      <div class="hint">
        Drag the <b>÷2</b> tool across the box. It rubs out lines so <b>every two
        cells become one</b> — the <b>12</b> cells become <b>6</b> and the <b>8</b>
        shaded become <b>4</b>. The red edge shows the amount <b>did not move</b>:
        <b>8/12 and 4/6 are the same amount</b>, just fewer pieces.
      </div>
      ${eqTools([2], { on: 2, divide: true })}
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="bignum"><span class="n" style="color:var(--red)">8</span><span class="bar" style="background:var(--ink)"></span><span class="d">12</span></span>
        <span class="nl-ans-eq">=</span>
        <span class="bignum"><span class="n" style="color:var(--red)">4</span><span class="bar" style="background:var(--ink)"></span><span class="d">6</span></span>
        <span class="nl-ans-amt">same amount — top ÷2, bottom ÷2</span>
      </div>
      <div class="lbar-cap">bundling divides both numbers, so the value is unchanged</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("The ÷2 tool bundles every two cells into one. Twelve becomes six, eight becomes four — 8/12 is 4/6, the very same amount with fewer pieces."),
};
