/* room-r4-2-bind — №8 Equivalent Fractions ×2 · Stage 2 "Split". Two boxes that
   both show 1/3. On the right the child has dragged the ×2 splitting tool across
   it: a horizontal cut turns each of the 3 cells into 2, so the box now reads 2/6
   — but the red "same amount" edge proves the shaded AREA never moved. 1/3 = 2/6. */
import { tutor } from "../cookSvg.js";
import { eqBox, eqFrac, eqTools } from "../eqBox.js";

export default {
  kind: "lesson",
  lesson: "r4",

  stageHTML: `
    <div class="eq-stage">
      <div class="eq-col">
        <span class="eq-lab">before</span>
        ${eqBox(3, 1, 1, { guide: true })}
        ${eqFrac(1, 3)}
      </div>
      <div class="eq-eq">=</div>
      <div class="eq-col">
        <span class="eq-lab">after the ×2 cut</span>
        ${eqBox(3, 2, 1, { guide: true })}
        ${eqFrac(2, 6)}
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Cut Each Cell in Two</h3>
      <div class="hint">
        Drag the <b>×2</b> knife across the box. It slices <b>every</b> cell into
        <b>two</b> — so the <b>3</b> columns become <b>6</b> cells and the <b>1</b>
        shaded column becomes <b>2</b> shaded cells. The red edge shows the shaded
        amount <b>did not move</b>: <b>1/3 and 2/6 are the same amount</b>.
      </div>
      ${eqTools([2], { on: 2 })}
    </div>`,

  answerHTML: `
    <div class="lbar r4-s-answer">
      <div class="r4-s-eqrow">
        <span class="bignum"><span class="n" style="color:var(--red)">1</span><span class="bar" style="background:var(--ink)"></span><span class="d">3</span></span>
        <span class="r4-s-eq">=</span>
        <span class="bignum"><span class="n" style="color:var(--red)">2</span><span class="bar" style="background:var(--ink)"></span><span class="d">6</span></span>
        <span class="r4-s-amt">same amount — top ×2, bottom ×2</span>
        <div class="r4-s-marks"><button class="check ready">Got it →</button></div>
      </div>
      <div class="r4-s-cap">the ×2 cut doubles both numbers, so the value is unchanged</div>
    </div>`,

  tutorHTML: tutor("The ×2 knife cuts every cell in two. Three columns become six, one shaded becomes two — 1/3 is 2/6, the very same amount."),
};
