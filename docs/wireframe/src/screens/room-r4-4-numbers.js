/* room-r4-4-numbers — №8 Equivalent Fractions · Stage 4 "Raise". A target bottom
   number is set: "make the bottom 12". The child picks the splitting tool whose
   cut reaches it — from thirds, ×4 gives 12 cells, 4 shaded → 4/12. The wrong
   knife lands on the wrong bottom number. */
import { tutor } from "../cookSvg.js";
import { eqBox, eqFrac, eqTools } from "../eqBox.js";

export default {
  kind: "lesson",
  lesson: "r4",

  stageHTML: `
    <div class="eq-stage">
      <div class="eq-col">
        <span class="eq-lab">your box — now 4/12</span>
        ${eqBox(3, 4, 1, { guide: true })}
      </div>
      <div class="eq-col">
        <div style="display:flex; align-items:center; gap:18px;">
          ${eqFrac(1, 3)}
          <div class="eq-eq">→</div>
          ${eqFrac(4, 12)}
        </div>
        <div class="eq-cap">target bottom number: <b>12</b></div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Raise the Bottom to 12</h3>
      <div class="hint">
        The box starts at <b>1/3</b>. Pick the knife that makes the bottom number
        exactly <b>12</b>. Thirds cut into <b>four</b> each give <b>12</b> cells —
        so the <b>×4</b> tool is right (3 × 4 = 12), and the top rises the same way
        (1 × 4 = 4). The amount stays put.
      </div>
      ${eqTools([2, 3, 4, 5], { on: 4 })}
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="bignum"><span class="n" style="color:var(--red)">1</span><span class="bar" style="background:var(--ink)"></span><span class="d">3</span></span>
        <span class="nl-ans-eq">=</span>
        <span class="bignum"><span class="n" style="color:var(--red)">4</span><span class="bar" style="background:var(--ink)"></span><span class="d">12</span></span>
        <span class="nl-ans-amt">the ×4 knife reached a bottom of 12</span>
      </div>
      <div class="lbar-cap">pick the knife in the panel — 3 × 4 = 12, so 1/3 = 4/12</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("You need a bottom of twelve. Three cut into four is twelve, so pick the ×4 knife — and the top becomes four. 1/3 is 4/12."),
};
