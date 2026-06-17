/* room-r5-5-back — №12 Mixed Numbers · Stage 5 "The Other Way". The reverse move:
   start from the mixed number 1¾ and FILL the improper fraction it equals. Break
   the whole into 4 quarters: 1×4 = 4, plus the 3 leftover = 7 → 7/4. The child fills
   7 and 4 from the column. Foot holds only Check. */
import { tutor } from "../cookSvg.js";
import { mixRuler, mixedNum, fracSlots, digitGrid } from "../eqBox.js";

const checkBar = `<div class="lbar"><div class="lbar-marks"><button class="check">Check</button></div></div>`;

export default {
  kind: "lesson",
  lesson: "r5",

  stageHTML: `
    <div class="eq-stage" style="gap:34px">
      ${digitGrid(7)}
      <div class="eq-col" style="gap:18px">
        ${mixRuler(7, 4, 2, { w: 520 })}
        <div class="eq-stage" style="padding:0; gap:18px">
          ${mixedNum(1, 3, 4)}
          <div class="eq-eq">=</div>
          ${fracSlots(7, 4, "n")}
        </div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Break the Whole Back</h3>
      <div class="hint">
        Now go the <b>other way</b>: start from <b>1¾</b> and break the whole unit
        back into <b>quarters</b>. <b>1</b> whole is <b>4</b> quarters; add the
        <b>3</b> leftover and you have <b>7</b> — so fill in <b>7/4</b>. The rule:
        <b>whole × bottom + top</b>, kept over the same bottom.
      </div>
    </div>`,

  answerHTML: checkBar,

  tutorHTML: tutor("Backwards now: the whole is four quarters. Four plus the three leftover makes seven — so 1¾ is 7/4. Whole times bottom, plus the top."),
};
