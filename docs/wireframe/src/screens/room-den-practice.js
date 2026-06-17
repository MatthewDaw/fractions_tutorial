/* room-den-practice — №3 The Bottom Number · Practice.
   Fresh, unsolved comparison drawn from the skill (bigger bottom ⇒ smaller
   piece). Snapshot: 1/6 vs 1/2, nothing chosen yet, Check inert. */
import { tutor } from "../cookSvg.js";

const frac = (d) => `
      <button class="den-bare-card">
        <div class="bignum"><span class="n">1</span><span class="bar" style="background:var(--ink)"></span><span class="d">${d}</span></div>
      </button>`;

export default {
  kind: "lesson",
  lesson: "den",

  stageHTML: `
    <div class="den-bare">
      ${frac(6)}
      <span class="den-bare-vs">vs</span>
      ${frac(2)}
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Your Turn</h3>
      <div class="hint">
        Which piece is <b>smaller</b>? Remember: the <b>bigger</b> the bottom
        number, the <b>smaller</b> the piece. No picture — reason from the numbers.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="den-ans-amt">tap the smaller fraction:</span>
        <span class="den-choices">
          <span class="den-choice">1/6</span>
          <span class="den-choice">1/2</span>
        </span>
      </div>
      <div class="lbar-cap">pick one, then it grades itself — bigger bottom, smaller piece</div>
      <div class="lbar-marks">
        <button class="check" disabled>Check</button>
      </div>
    </div>`,

  tutorHTML: tutor("Fresh one. Bigger bottom number, smaller piece — so which of 1/6 and 1/2 is smaller?"),
};
