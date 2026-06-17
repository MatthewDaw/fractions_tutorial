/* room-simp-3-lowest — №9 Simplify · Stage 3 "Lowest Terms". Keep bundling: ÷2
   again takes 4/6 → 2/3. Now no bundle fits — a ÷3 would cut the 2 red columns
   across a group (it straddles the red edge), so it can't merge evenly. When no
   tool clicks, you've reached the simplest name. 2/3 is lowest terms. */
import { tutor } from "../cookSvg.js";
import { eqBox, eqFrac, eqTools } from "../eqBox.js";

export default {
  kind: "lesson",
  lesson: "simp",

  stageHTML: `
    <div class="eq-stage">
      <div class="eq-col">
        <span class="eq-lab">before</span>
        ${eqBox(3, 2, 2, { guide: true })}
        ${eqFrac(4, 6)}
      </div>
      <div class="eq-eq">=</div>
      <div class="eq-col">
        <span class="eq-lab">after ÷2 — simplest</span>
        ${eqBox(3, 1, 2, { guide: true })}
        ${eqFrac(2, 3)}
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Bundle to Lowest Terms</h3>
      <div class="hint">
        Bundle once more — <b>÷2</b> takes <b>4/6</b> to <b>2/3</b>. Now <b>no</b>
        tool fits: a ÷3 would slice the <b>2 red columns</b> apart (the group
        <b>straddles</b> the red edge), so it can't merge evenly. When <b>nothing
        bundles cleanly</b>, you're at the <b>simplest name</b>: <b>2/3</b>.
      </div>
      ${eqTools([2], { on: 2, divide: true })}
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="bignum"><span class="n" style="color:var(--red)">4</span><span class="bar" style="background:var(--ink)"></span><span class="d">6</span></span>
        <span class="nl-ans-eq">=</span>
        <span class="bignum"><span class="n" style="color:var(--red)">2</span><span class="bar" style="background:var(--ink)"></span><span class="d">3</span></span>
        <span class="nl-ans-amt">simplest — nothing bundles cleanly anymore</span>
      </div>
      <div class="lbar-cap">simplest form = no bundle of any size fits evenly</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("One more ÷2 and 4/6 is 2/3. Try to bundle again — a group of three would cut the red apart, so it won't fit. Nothing bundles, so 2/3 is simplest."),
};
