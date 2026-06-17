/* room-r4-3-fade — №8 Equivalent Fractions · Stage 3 "Triple" (the tripling phase).
   The same box as the doubling phase, but now the ×3 knife is dragged across it:
   each of the 3 cells becomes 3, so the box reads 3/9 — the red "same amount" edge
   proves the shaded area never moved. 1/3 = 3/9. */
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
        <span class="eq-lab">after the ×3 cut</span>
        ${eqBox(3, 3, 1, { guide: true })}
        ${eqFrac(3, 9)}
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Cut Each Cell in Three</h3>
      <div class="hint">
        Same box, a bigger cut. Drag the <b>×3</b> knife across it: every cell
        becomes <b>three</b>, so the <b>3</b> columns become <b>9</b> cells and the
        <b>1</b> shaded column becomes <b>3</b>. The red edge shows the amount
        <b>did not move</b>: <b>1/3 and 3/9 are the same amount</b>.
      </div>
      ${eqTools([3], { on: 3 })}
    </div>`,

  answerHTML: `
    <div class="lbar r4-s-answer">
      <div class="r4-s-eqrow">
        <span class="bignum"><span class="n" style="color:var(--red)">1</span><span class="bar" style="background:var(--ink)"></span><span class="d">3</span></span>
        <span class="r4-s-eq">=</span>
        <span class="bignum"><span class="n" style="color:var(--red)">3</span><span class="bar" style="background:var(--ink)"></span><span class="d">9</span></span>
        <span class="r4-s-amt">same amount — top ×3, bottom ×3</span>
        <div class="r4-s-marks"><button class="check ready">Got it →</button></div>
      </div>
      <div class="r4-s-cap">the ×3 cut triples both numbers, so the value is unchanged</div>
    </div>`,

  tutorHTML: tutor("Now the ×3 knife cuts every cell into three. Three columns become nine, one shaded becomes three — 1/3 is 3/9, the very same amount."),
};
