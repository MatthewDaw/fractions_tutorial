/* room-num-5-numbers — №4 The Top Number · Stage 7 "Numbers".
   No picture — reason from bare symbols. Both fractions share the same
   denominator (5ths); the bigger top number is bigger. Snapshot: 3/5 vs 1/5,
   child taps 3/5 as the bigger fraction. */
import { tutor } from "../cookSvg.js";

export default {
  kind: "lesson",
  lesson: "num",

  stageHTML: `
    <div class="den-play">
      <div class="den-bare">
        <button type="button" class="den-bare-card is-on" aria-pressed="true">
          <div class="bignum" style="font-size:52px">
            <span class="n" style="color:var(--red)">3</span>
            <span class="bar" style="background:var(--ink)"></span>
            <span class="d">5</span>
          </div>
        </button>
        <span class="den-bare-vs">vs</span>
        <button type="button" class="den-bare-card" aria-pressed="false">
          <div class="bignum" style="font-size:52px">
            <span class="n" style="color:var(--red)">1</span>
            <span class="bar" style="background:var(--ink)"></span>
            <span class="d">5</span>
          </div>
        </button>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Just the Numbers</h3>
      <div class="hint">
        No picture. The <b>bottoms are the same</b> (5ths), so the pieces
        are the same size — the fraction with <b>more on top</b> is
        <b>bigger</b>. Tap the bigger fraction.
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

  tutorHTML: tutor("Same bottom number, so the pieces are the same size. More on top means more of them — 3/5 is bigger than 1/5."),
};
