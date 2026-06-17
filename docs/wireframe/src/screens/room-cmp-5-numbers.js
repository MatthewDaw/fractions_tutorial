/* room-cmp-5-numbers — №5 Compare & Check · Stage 5 "Numbers". The picture is gone.
   Compare two DIFFERENT-base fractions from the numbers alone by renaming them to a
   common bottom (the equivalence skill): 2/3 and 3/4 become 8/12 and 9/12, so
   2/3 < 3/4. */
import { tutor } from "../cookSvg.js";
import { cmpDrag } from "../compare.js";

const frac = (n, d, big = 44) => `<div class="bignum" style="font-size:${big}px"><span class="n" style="color:var(--red)">${n}</span><span class="bar" style="background:var(--ink)"></span><span class="d">${d}</span></div>`;

export default {
  kind: "lesson",
  lesson: "cmp",

  stageHTML: `
    <div class="eq-stage" style="flex-direction:column; gap:20px">
      <div class="eq-stage" style="padding:0; gap:22px">
        ${frac(2, 3, 56)}
        <div class="eq-eq" style="font-style:normal">?</div>
        ${frac(3, 4, 56)}
      </div>
      <div class="eq-eq">rename both over 12 ↓</div>
      <div class="eq-stage" style="padding:0; gap:22px">
        ${frac(8, 12)}
        <span class="eq-eq" style="font-style:normal">&lt;</span>
        ${frac(9, 12)}
      </div>
      <div class="eq-cap">same bottom now — <b>8/12 &lt; 9/12</b>, so <b>2/3 &lt; 3/4</b></div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Compare From the Numbers</h3>
      <div class="hint">
        No strip now. Different bottoms — so <b>rename</b> both to the <b>same
        bottom</b> (the skill from Equivalent Fractions). Over <b>12</b>: <b>2/3 =
        8/12</b> and <b>3/4 = 9/12</b>. Now the bottoms match, so more on top wins:
        <b>2/3 &lt; 3/4</b>.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">${cmpDrag(2, 3, 3, 4)}</div>
      <div class="lbar-cap">rename to a common bottom, then compare the tops</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("No picture — rename both to twelfths. Two thirds is eight twelfths, three quarters is nine twelfths. Eight is less than nine, so 2/3 is less than 3/4."),
};
