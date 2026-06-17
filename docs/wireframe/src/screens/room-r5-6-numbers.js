/* room-r5-6-numbers — №12 Mixed Numbers · Stage 6 "Numbers". No picture: convert
   both ways and FILL the answers from the column. Improper→mixed is divide with
   remainder (7 ÷ 4 = 1 r3 → fill 1¾); mixed→improper is whole × bottom + top
   (1¾ → fill 7/4). Foot holds only Check. */
import { tutor } from "../cookSvg.js";
import { mixedNum, mixedSlots, fracSlots, digitGrid } from "../eqBox.js";

const checkBar = `<div class="lbar"><div class="lbar-marks"><button class="check">Check</button></div></div>`;

export default {
  kind: "lesson",
  lesson: "r5",

  stageHTML: `
    <div class="eq-stage" style="gap:40px">
      ${digitGrid(1)}
      <div class="eq-col" style="gap:28px">
        <div class="eq-col" style="gap:8px">
          <span class="eq-lab">improper → mixed</span>
          <div class="eq-stage" style="padding:0; gap:16px">
            <div class="bignum" style="font-size:48px"><span class="n" style="color:var(--red)">7</span><span class="bar" style="background:var(--ink)"></span><span class="d">4</span></div>
            <div class="eq-eq">→</div>
            ${mixedSlots(1, 3, 4, "w")}
            <span class="eq-cap">7 ÷ 4 = 1 remainder 3</span>
          </div>
        </div>
        <div class="eq-col" style="gap:8px">
          <span class="eq-lab">mixed → improper</span>
          <div class="eq-stage" style="padding:0; gap:16px">
            ${mixedNum(1, 3, 4)}
            <div class="eq-eq">→</div>
            ${fracSlots(7, 4, "n", 48)}
            <span class="eq-cap">1 × 4 + 3 = 7</span>
          </div>
        </div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Just the Numbers</h3>
      <div class="hint">
        No strip now — both rules from the symbols. <b>Improper → mixed:</b> divide
        top by bottom; the answer is the <b>whole</b>, the remainder is the new
        <b>top</b> (7 ÷ 4 = 1 r3 → <b>1¾</b>). <b>Mixed → improper:</b> <b>whole ×
        bottom + top</b> over the same bottom (1 × 4 + 3 = <b>7/4</b>).
      </div>
    </div>`,

  answerHTML: checkBar,

  tutorHTML: tutor("Two rules. To make a mixed number, divide: 7 ÷ 4 is 1 remainder 3, so 1¾. To go back, multiply and add: 1 times 4 plus 3 is 7, over 4."),
};
