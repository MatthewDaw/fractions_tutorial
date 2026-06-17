/* room-num-6-story — №4 The Top Number · Stage 8 "Story" (word problem with
   the numbers IN it). The digits are given in the text; the child turns the
   words into a fraction and writes it. Snapshot: 8 slices, 5 filled → write 5/8. */
import { tutor } from "../cookSvg.js";

const rulerSegs = (n, k) =>
  Array.from({ length: n }, (_, i) => `<div class="den-seg${i < k ? " is-unit" : ""}"></div>`).join("");

export default {
  kind: "lesson",
  lesson: "num",

  stageHTML: `
    <div class="den-play">
      <div class="den-ruler-wrap">
        <div class="den-ruler">${rulerSegs(8, 0)}</div>
        <div class="den-ends"><span>0</span><span>1</span></div>
        <div class="den-cap">The tray has 8 equal slices — how many did Babushka fill with jam?</div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Babushka's Tray</h3>
      <div class="hint">
        Babushka's tray is cut into <b>8</b> equal slices. She fills <b>5</b> of
        them with jam. The <b>bottom number</b> is the total slices; the
        <b>top number</b> is how many are filled. <b>What fraction is filled?</b>
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="nl-ans-amt">fraction filled →</span>
        <span class="r1-fz-slate">
          <div class="slate slate-fraction" role="group" aria-label="write the fraction filled">
            <div class="slate-slot"><div class="slate-cell"><canvas class="slate-canvas" role="img" aria-label="write the top digit"></canvas><span class="slate-ph" aria-hidden="true">✎</span></div></div>
            <span class="slate-bar" style="background:var(--ink)" aria-hidden="true"></span>
            <div class="slate-slot"><div class="slate-cell"><canvas class="slate-canvas" role="img" aria-label="write the bottom digit"></canvas><span class="slate-ph" aria-hidden="true">✎</span></div></div>
          </div>
        </span>
      </div>
      <div class="lbar-cap">write how many filled over how many in all, then Check</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("Eight slices in all, five filled. The top number is what's filled, the bottom is the total — so 5/8."),
};
