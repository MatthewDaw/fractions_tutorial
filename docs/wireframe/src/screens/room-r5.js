/* room-r5 — №12 Mixed Numbers · Stage 1 "Identify". A 0→2 quarter strip with 7
   shaded. The child fills the fraction from the number column (pick a number, drop
   it on the top or bottom). The foot holds only Check. Snapshot: 7/4. */
import { tutor } from "../cookSvg.js";
import { mixRuler, fracSlots, digitGrid } from "../eqBox.js";

const checkBar = `<div class="lbar"><div class="lbar-marks"><button class="check">Check</button></div></div>`;

export default {
  kind: "lesson",
  lesson: "r5",

  stageHTML: `
    <div class="eq-stage" style="gap:34px">
      ${digitGrid(7)}
      <div class="eq-col" style="gap:18px">
        ${mixRuler(7, 4, 2, { w: 520 })}
        ${fracSlots(7, 4, "n")}
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Fill In the Fraction</h3>
      <div class="hint">
        The strip runs <b>0 → 2</b>, cut into <b>quarters</b>. Pick a number and drop
        it in: the <b>bottom</b> is how many pieces make one whole (<b>4</b>), the
        <b>top</b> is how many are shaded (<b>7</b>). So it's <b>7/4</b> — and the red
        runs <b>past the 1 mark</b>, so it's more than one whole.
      </div>
    </div>`,

  answerHTML: checkBar,

  tutorHTML: tutor("Build it from the strip — four quarters in a whole on the bottom, seven shaded on top. That's 7/4, and it passes the 1 mark, so more than a whole."),
};
