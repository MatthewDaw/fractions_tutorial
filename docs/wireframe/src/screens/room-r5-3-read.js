/* room-r5-3-read — №12 Mixed Numbers · Stage 3 "Read". Read 7/4 off the strip and
   FILL the mixed number: pick numbers for the whole (1), the top (3) and the bottom
   (4) of 1¾. Foot holds only Check. */
import { tutor } from "../cookSvg.js";
import { mixRuler, mixedSlots, digitGrid } from "../eqBox.js";

const checkBar = `<div class="lbar"><div class="lbar-marks"><button class="check">Check</button></div></div>`;

export default {
  kind: "lesson",
  lesson: "r5",

  stageHTML: `
    <div class="eq-stage" style="gap:34px">
      ${digitGrid(1)}
      <div class="eq-col" style="gap:18px">
        ${mixRuler(7, 4, 2, { w: 520 })}
        <div class="eq-stage" style="padding:0; gap:18px">
          <div class="bignum"><span class="n" style="color:var(--red)">7</span><span class="bar" style="background:var(--ink)"></span><span class="d">4</span></div>
          <div class="eq-eq">=</div>
          ${mixedSlots(1, 3, 4, "w")}
        </div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Read the Mixed Number</h3>
      <div class="hint">
        Read it off the strip and fill it in. The first unit <b>0→1</b> is full —
        that's <b>1 whole</b>. Past the <b>1</b> mark, <b>3</b> more quarters are
        shaded — the leftover <b>3/4</b>. So <b>7/4 = 1¾</b>: the <b>whole</b> is the
        full units, the <b>fraction</b> is what's left.
      </div>
    </div>`,

  answerHTML: checkBar,

  tutorHTML: tutor("The first unit is full — one whole. Three quarters spill past the 1 mark — the leftover. So 7/4 is one and three-quarters, 1¾."),
};
