/* room-den-4-numbers — №3 The Bottom Number · Stage 5 "Numbers".
   The rulers are gone — now reason from the NUMBER alone. Given 1/4 and 1/9,
   which is smaller? (No picture; the child applies "bigger bottom ⇒ smaller
   piece".) Snapshot: 1/9 chosen as the smaller (is-on). */
import { tutor } from "../cookSvg.js";

const frac = (d, on) => `
      <button class="den-bare-card${on ? " is-on" : ""}">
        <div class="bignum"><span class="n">1</span><span class="bar" style="background:var(--ink)"></span><span class="d">${d}</span></div>
      </button>`;

export default {
  kind: "lesson",
  lesson: "den",

  stageHTML: `
    <div class="den-bare">
      ${frac(4, false)}
      <span class="den-bare-vs">vs</span>
      ${frac(9, true)}
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Just the Numbers</h3>
      <div class="hint">
        No picture this time. Both are <b>one piece</b> — so the only thing that
        matters is <b>how many pieces the whole was cut into</b>. The
        <b>bigger</b> bottom number makes the <b>smaller</b> piece. Which is smaller,
        <b>1/4</b> or <b>1/9</b>?
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="den-ans-amt">smaller fraction:</span>
        <span class="den-choices">
          <span class="den-choice">1/4</span>
          <span class="den-choice is-on">1/9</span>
        </span>
      </div>
      <div class="lbar-cap">9 &gt; 4, so the ninth is the smaller piece — 1/9 &lt; 1/4</div>
      <div class="lbar-marks">
        <button class="check" disabled>Next stage ▸</button>
      </div>
    </div>`,

  tutorHTML: tutor("No picture needed now. The bigger the bottom number, the smaller the piece — so 1/9 is smaller than 1/4."),
};
