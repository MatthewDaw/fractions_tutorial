/* room-num-build — №4 The Top Number · Stage "Build" (the match-two-SQUARES game,
   step 1 — the bottom number is FIXED). The square is already cut into the right
   number of cells (bottom fixed at 6); the child taps a number and drops it on the
   top slot, shading the same count as the TARGET square. Snapshot: target =
   4/6; top = 4, bottom fixed 6 → the squares match. */
import { tutor } from "../cookSvg.js";
import { cellBox, digitGrid } from "../eqBox.js";

export default { kind: "lesson",
  lesson: "num",

  stageHTML: `
    <div class="sq-game">
      ${digitGrid(4)}
      <div class="sq-frac sq-frac-pick">
        <div class="bignum"><span class="n sq-slot-active" style="color:var(--red)">4</span><span class="bar" style="background:var(--ink)"></span><span class="d sq-slot-locked">6</span></div>
        <div class="sq-frac-hint">bottom is fixed — pick the top number</div>
      </div>
      <div class="eq-col">
        <span class="eq-lab">your square</span>
        ${cellBox(6, 4)}
      </div>
      <div class="eq-eq">match<br>→</div>
      <div class="eq-col">
        <span class="eq-lab">target</span>
        ${cellBox(6, 4, { cls: "is-target" })}
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Match the Shaded Pieces</h3>
      <div class="hint">
        The bottom number is fixed at <b>6</b> — both squares already have six equal
        cells. Pick the <b>top number</b> so <b>your</b> square has the <b>same
        number of red cells</b> as the <b>target</b>. The top number just counts how
        many cells are shaded.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="bignum"><span class="n" style="color:var(--red)">4</span><span class="bar" style="background:var(--ink)"></span><span class="d">6</span></span>
        <span class="nl-ans-eq">=</span>
        <span class="nl-ans-amt"><b>4</b> red cells out of <b>6</b> — squares match</span>
      </div>
      <div class="lbar-cap">bottom is fixed — pick the top number that matches the target</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("The bottom number is set for you. Just pick the top number so your square has as many red cells as the target.") };
