/* room-r5-4-wholes — №12 Mixed Numbers · Stage 4 "How Many Wholes". 11/4 on a 0→3
   strip. The child fills the mixed number — how many whole units fill (2) and what's
   left (3/4). Division-with-remainder, made visual. Foot holds only Check. */
import { tutor } from "../cookSvg.js";
import { mixRuler, mixedSlots, digitGrid } from "../eqBox.js";

const checkBar = `<div class="lbar"><div class="lbar-marks"><button class="check">Check</button></div></div>`;

export default {
  kind: "lesson",
  lesson: "r5",

  stageHTML: `
    <div class="eq-stage" style="gap:34px">
      ${digitGrid(2)}
      <div class="eq-col" style="gap:18px">
        ${mixRuler(11, 4, 3, { w: 660 })}
        <div class="eq-stage" style="padding:0; gap:18px">
          <div class="bignum"><span class="n" style="color:var(--red)">11</span><span class="bar" style="background:var(--ink)"></span><span class="d">4</span></div>
          <div class="eq-eq">=</div>
          ${mixedSlots(2, 3, 4, "w")}
        </div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">How Many Wholes Fit?</h3>
      <div class="hint">
        <b>11</b> quarters. Each whole needs <b>4</b>: so <b>8</b> fills <b>two</b>
        wholes, and <b>3</b> are left over. Fill in <b>2¾</b>. (That's just
        <b>11 ÷ 4 = 2 remainder 3</b> — the remainder is the leftover pieces.)
      </div>
    </div>`,

  answerHTML: checkBar,

  tutorHTML: tutor("Each whole takes four quarters. Eight quarters make two wholes, and three are left — so 11/4 is 2¾. It's 11 divided by 4, remainder 3."),
};
