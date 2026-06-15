/* room-num-5-numbers — №4 The Top Number · Stage 5 "Numbers" (raw symbols).
   No picture — do the math from the symbols alone. Same bottom number, so the
   one with MORE on top has more shaded ⇒ it is bigger. Snapshot: 3/5 vs 1/5,
   3/5 chosen as the bigger. */
import { tutor } from "../cookSvg.js";

const frac = (nTop, d, on) => `
      <div class="den-bare-card${on ? " is-on" : ""}">
        <div class="bignum"><span class="n" style="color:var(--red)">${nTop}</span><span class="bar" style="background:var(--ink)"></span><span class="d">${d}</span></div>
      </div>`;

export default {
  kind: "lesson",
  lesson: "num",

  stageHTML: `
    <div class="den-bare">
      ${frac(3, 5, true)}
      <span class="den-bare-vs">vs</span>
      ${frac(1, 5, false)}
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Just the Numbers</h3>
      <div class="hint">
        No picture this time. The <b>bottom numbers are the same</b> (fifths), so
        the pieces are the same size — the fraction with <b>more on top</b> has
        <b>more pieces shaded</b>, so it is <b>bigger</b>. Which is bigger,
        <b>3/5</b> or <b>1/5</b>?
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="nl-ans-amt">bigger fraction:</span>
        <span class="den-choices">
          <span class="den-choice is-on">3/5</span>
          <span class="den-choice">1/5</span>
        </span>
      </div>
      <div class="lbar-cap">same bottom, so more on top wins — 3/5 &gt; 1/5</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("Same bottom number means same-size pieces — so more on top is bigger. 3/5 is more than 1/5."),
};
