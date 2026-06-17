/* room-num-practice — №4 The Top Number · Practice.
   Fresh, unsolved: read a shaded ruler and name the fraction. Snapshot: 4 of 6
   shaded, slate empty, Check inert. */
import { tutor } from "../cookSvg.js";

const ruler = (n, k) =>
  Array.from({ length: n }, (_, i) => `<div class="den-seg${i < k ? " is-unit" : ""}"></div>`).join("");

export default {
  kind: "lesson",
  lesson: "num",

  stageHTML: `
    <div class="den-play">
      <div class="den-ruler-wrap">
        <div class="den-ruler">${ruler(6, 4)}</div>
        <div class="den-ends"><span>0</span><span>1</span></div>
        <div class="den-cap">What fraction of the ruler is shaded?</div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Your Turn</h3>
      <div class="hint">
        Read the ruler. How many equal pieces in all (<b>bottom number</b>), and
        how many are <b>red</b> (<b>top number</b>)? Write the fraction.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="nl-ans-amt">shaded fraction →</span>
        <span class="r1-fz-slate">
          <div class="slate slate-fraction" role="group" aria-label="write the shaded fraction">
            <div class="slate-slot"><div class="slate-cell"><canvas class="slate-canvas" role="img" aria-label="write the top digit"></canvas><span class="slate-ph" aria-hidden="true">✎</span></div></div>
            <span class="slate-bar" style="background:var(--ink)" aria-hidden="true"></span>
            <div class="slate-slot"><div class="slate-cell"><canvas class="slate-canvas" role="img" aria-label="write the bottom digit"></canvas></div></div>
          </div>
        </span>
      </div>
      <div class="lbar-cap">count the pieces, count the red, write the fraction</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("Six pieces in all, four shaded — name the fraction. Total on the bottom, shaded on top."),
};
