/* room-num-2-count — №4 The Top Number · Stage 2 "Count".
   The reverse of Shade: the ruler is already shaded — read the picture and say
   the top number (count the red pieces). (Synthesis: "the top number is 6, how
   many red pieces are there?") Snapshot: 6 of 8 shaded → top number 6. */
import { tutor } from "../cookSvg.js";

const ruler = (n, k) =>
  Array.from({ length: n }, (_, i) => `<div class="den-seg${i < k ? " is-unit" : ""}"></div>`).join("");

export default {
  kind: "lesson",
  lesson: "num",

  stageHTML: `
    <div class="den-play">
      <div class="den-pick-frac"><div class="bignum"><span class="n" style="color:var(--red)">?</span><span class="bar" style="background:var(--ink)"></span><span class="d">8</span></div></div>
      <div class="den-ruler-wrap">
        <div class="den-ruler">${ruler(8, 6)}</div>
        <div class="den-ends"><span>0</span><span>1</span></div>
        <div class="den-cap">Count the red pieces — that count is the top number.</div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">How Many Are Shaded?</h3>
      <div class="hint">
        The bottom number is <b>8</b>. <b>Count the red pieces</b> — that count is
        the <b>top number</b>. How many are shaded here?
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="nl-ans-amt">red pieces counted →</span>
        <span class="r1-fz-slate">
          <div class="slate slate-fraction" role="group" aria-label="write the top number">
            <div class="slate-slot"><div class="slate-cell"><canvas class="slate-canvas" role="img" aria-label="write the top digit"></canvas><span class="slate-ph" aria-hidden="true">✎</span></div></div>
            <span class="slate-bar" style="background:var(--ink)" aria-hidden="true"></span>
            <div class="slate-slot is-disabled"><div class="slate-cell"><span class="slate-ph" aria-hidden="true">8</span></div></div>
          </div>
        </span>
      </div>
      <div class="lbar-cap">write the top number — how many of the 8 pieces are red</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("Count the red pieces. Six of the eight are shaded, so the top number is 6 — the fraction is 6/8."),
};
