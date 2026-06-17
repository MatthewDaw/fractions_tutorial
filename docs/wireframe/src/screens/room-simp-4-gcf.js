/* room-simp-4-gcf — №9 Simplify · Stage 4 "Big Bundle". Instead of bundling twice,
   pick the BIGGEST bundle that fits in one move. 8 and 12 share the factor 4, so
   ÷4 merges every four cells and lands straight on 2/3. The wrong tool either
   doesn't divide evenly or doesn't go all the way. */
import { tutor } from "../cookSvg.js";
import { eqBox, eqFrac, eqTools } from "../eqBox.js";

export default {
  kind: "lesson",
  lesson: "simp",

  stageHTML: `
    <div class="eq-stage">
      <div class="eq-col">
        <span class="eq-lab">start — 8/12</span>
        ${eqBox(3, 4, 2, { guide: true })}
        ${eqFrac(8, 12)}
      </div>
      <div class="eq-eq">÷4</div>
      <div class="eq-col">
        <span class="eq-lab">after one big bundle</span>
        ${eqBox(3, 1, 2, { guide: true })}
        ${eqFrac(2, 3)}
        <div class="eq-cap">biggest shared factor is <b>4</b></div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">One Big Bundle</h3>
      <div class="hint">
        Why bundle twice? Find the <b>biggest</b> tool that fits. <b>8</b> and
        <b>12</b> are <b>both</b> divisible by <b>4</b> — so <b>÷4</b> merges every
        four cells and reaches <b>2/3</b> in a single move. That biggest shared
        number is the <b>greatest common factor</b>.
      </div>
      ${eqTools([2, 3, 4], { on: 4, divide: true })}
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="bignum"><span class="n" style="color:var(--red)">8</span><span class="bar" style="background:var(--ink)"></span><span class="d">12</span></span>
        <span class="nl-ans-eq">=</span>
        <span class="bignum"><span class="n" style="color:var(--red)">2</span><span class="bar" style="background:var(--ink)"></span><span class="d">3</span></span>
        <span class="nl-ans-amt">÷4 — the biggest bundle — reaches simplest at once</span>
      </div>
      <div class="lbar-cap">divide top &amp; bottom by their greatest common factor (4)</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("Eight and twelve both divide by four — the biggest tool that fits. One ÷4 bundle takes 8/12 straight to 2/3. That four is the greatest common factor."),
};
