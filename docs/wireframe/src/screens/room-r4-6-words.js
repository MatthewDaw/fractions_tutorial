/* room-r4-6-words — №8 Equivalent Fractions · Stage 6 "Find · All". The full hunt:
   numbers, then the fraction, then YOUR box, then a fixed TARGET square showing
   1/3 on the right. The child works the middle box with the numbers, finding every
   equivalent that keeps the same red amount as the target. Snapshot: 4/12 chosen,
   the middle box matches the 1/3 target. */
import { tutor } from "../cookSvg.js";
import { eqBox, digitGrid } from "../eqBox.js";

export default { kind: "lesson",
  lesson: "r4",

  stageHTML: `
    <div class="eq-stage">
      ${digitGrid(4)}
      <div class="eq-col">
        <div class="bignum" style="font-size:52px"><span class="n eq-slot-active" style="color:var(--red)">4</span><span class="bar" style="background:var(--ink)"></span><span class="d">12</span></div>
      </div>
      <div class="eq-col">
        <span class="eq-lab">your box</span>
        ${eqBox(3, 4, 1, { guide: true })}
      </div>
      <div class="eq-eq">match<br>→</div>
      <div class="eq-col">
        <span class="eq-lab">target — 1/3</span>
        ${eqBox(3, 1, 1, { guide: true, cls: "is-target" })}
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Find Every Equivalent</h3>
      <div class="hint">
        The <b>target</b> on the right is fixed at <b>1/3</b>. Work <b>your</b> box
        with the numbers: every pair that keeps the <b>same red amount</b> as the
        target is an equivalent — <b>2/6</b>, <b>3/9</b>, <b>4/12</b>, <b>5/15</b> …
        How <b>many</b> can you find?
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="bignum"><span class="n" style="color:var(--red)">4</span><span class="bar" style="background:var(--ink)"></span><span class="d">12</span></span>
        <span class="nl-ans-eq">=</span>
        <span class="bignum"><span class="n" style="color:var(--red)">1</span><span class="bar" style="background:var(--ink)"></span><span class="d">3</span></span>
        <span class="nl-ans-amt">your box matches the target — that's one more equivalent</span>
      </div>
      <div class="lbar-cap">keep going — find every fraction equal to 1/3</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("The target stays at 1/3. Work your box until it lands on the same red amount — 4/12 matches. Keep finding more: 2/6, 3/9, 5/15 …") };
