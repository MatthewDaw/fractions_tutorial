/* room-simp — №9 Simplify · Stage 1 "Identify". A box cut into 12 cells with 8
   shaded (left 2 of 3 columns × 4 rows). The child names it — 8/12 — before
   learning to bundle it down to its simplest name. Same square as equivalence. */
import { tutor } from "../cookSvg.js";
import { eqBox, eqFrac } from "../eqBox.js";

export default {
  kind: "lesson",
  lesson: "simp",

  stageHTML: `
    <div class="eq-stage" style="align-items:center;gap:40px">
      <div class="eq-col">
        <span class="eq-lab">the box</span>
        ${eqBox(3, 4, 2)}
      </div>
      <div class="eq-col" style="gap:12px">
        <span class="eq-lab">Which fraction?</span>
        <div class="den-choices" style="flex-direction:column;gap:8px">
          <span class="den-choice is-on">8/12</span>
          <span class="den-choice">8/4</span>
          <span class="den-choice">4/8</span>
          <span class="den-choice">12/8</span>
        </div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Name the Shaded Part</h3>
      <div class="hint">
        The box has <b>12</b> equal cells and <b>8</b> are shaded — count the top
        (shaded) and the bottom (total) to name the fraction.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="nl-ans-amt">shaded part:</span>
      </div>
      <div class="lbar-cap">count the shaded cells (top) and the total cells (bottom)</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("Twelve cells, eight shaded — that's 8/12. It's the right amount, just written with lots of pieces. Let's bundle it down."),
};
