/* room-r5-2-fill — №12 Mixed Numbers · Stage 2 "Fill a Whole". One unit, all four
   quarters shaded. The child fills the fraction (4/4) from the number column to see
   that a completely full unit is 1 whole. Foot holds only Check. */
import { tutor } from "../cookSvg.js";
import { mixRuler, fracSlots, digitGrid } from "../eqBox.js";

const checkBar = `<div class="lbar"><div class="lbar-marks"><button class="check">Check</button></div></div>`;

export default {
  kind: "lesson",
  lesson: "r5",

  stageHTML: `
    <div class="eq-stage" style="gap:34px">
      ${digitGrid(4)}
      <div class="eq-col" style="gap:18px">
        ${mixRuler(4, 4, 1, { w: 320 })}
        <div class="eq-stage" style="padding:0; gap:16px">
          ${fracSlots(4, 4, "d")}
          <div class="eq-eq" style="font-style:normal">= <b style="color:var(--red)">1</b> whole</div>
        </div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Fill One Whole</h3>
      <div class="hint">
        Shade all <b>4</b> quarters and fill the fraction: <b>4/4</b>. The unit from
        <b>0</b> to <b>1</b> is completely red — a full unit is <b>one whole</b>.
        Whenever the <b>top equals the bottom</b>, you have exactly <b>1</b>. That's
        how wholes hide inside an improper fraction.
      </div>
    </div>`,

  answerHTML: checkBar,

  tutorHTML: tutor("All four quarters shaded fills the unit from 0 to 1 — that's 4/4, which is one whole. Top equals bottom always makes one."),
};
