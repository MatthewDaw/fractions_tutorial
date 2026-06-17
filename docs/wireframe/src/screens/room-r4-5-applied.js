/* room-r4-5-applied — №8 Equivalent Fractions · Stage 5 "Find · Pick". The knives
   are FROZEN now. Instead the child picks a top and a bottom number (numbers +
   the fraction sit to the LEFT of the square); the box cuts itself to match as
   they choose, so a correct pair lands on the same red amount. Snapshot: 4 over 12
   chosen → the box shows 4/12 (an equivalent of 1/3). */
import { tutor } from "../cookSvg.js";
import { eqBox, digitGrid } from "../eqBox.js";

export default { kind: "lesson",
  lesson: "r4",

  stageHTML: `
    <div class="eq-stage">
      ${digitGrid(4)}
      <div class="eq-col">
        <div class="bignum" style="font-size:56px"><span class="n eq-slot-active" style="color:var(--red)">4</span><span class="bar" style="background:var(--ink)"></span><span class="d">12</span></div>
        <div class="eq-cap">pick the top, then the bottom — the box splits to match</div>
      </div>
      <div class="eq-col">
        <span class="eq-lab">it cuts as you choose</span>
        ${eqBox(3, 4, 1, { guide: true })}
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Choose the Numbers</h3>
      <div class="hint">
        The knives are <b>put away</b>. Now <b>choose</b> a top number and a bottom
        number — the box cuts itself to match. When your pair keeps the <b>same red
        amount</b> as <b>1/3</b>, it is an equivalent: <b>4/12</b> works because 4
        is a third of 12.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="bignum"><span class="n" style="color:var(--red)">1</span><span class="bar" style="background:var(--ink)"></span><span class="d">3</span></span>
        <span class="nl-ans-eq">=</span>
        <span class="bignum"><span class="n" style="color:var(--red)">4</span><span class="bar" style="background:var(--ink)"></span><span class="d">12</span></span>
        <span class="nl-ans-amt">the box landed on the same amount ✓</span>
      </div>
      <div class="lbar-cap">choose top &amp; bottom; a match keeps the red edge in place</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("No knives this time — pick the numbers. As you choose, the box cuts to match. Four over twelve sits on the same amount, so it's equivalent to 1/3.") };
