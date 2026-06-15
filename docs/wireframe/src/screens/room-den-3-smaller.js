/* room-den-3-smaller — №3 The Bottom Number · Stage 3 "Smaller".
   Two rulers side by side so the size difference is VISIBLE: 1/3 has big pieces,
   1/8 has tiny ones. The child sees in the picture that the BIGGER bottom number
   makes the SMALLER piece, and taps the smaller one (1/8). */
import { tutor } from "../cookSvg.js";

const ruler = (n, unit) =>
  Array.from({ length: n }, (_, i) =>
    `<div class="den-seg${i === 0 ? " is-unit" : ""}">${i === 0 ? `<span class="den-seg-lab">${unit}</span>` : ""}</div>`
  ).join("");

const row = (n, unit, on) => `
      <div class="den-row${on ? " is-pick" : ""}">
        <div class="bignum"><span class="n">1</span><span class="bar" style="background:var(--ink)"></span><span class="d">${n}</span></div>
        <div class="den-ruler is-sm">${ruler(n, unit)}</div>
      </div>`;

export default {
  kind: "lesson",
  lesson: "den",

  stageHTML: `
    <div class="den-compare">
      ${row(3, "1/3")}
      ${row(8, "1/8")}
      <div class="den-cap">Same ruler, two bottom numbers. Which red piece is smaller?</div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Which Piece Is Smaller?</h3>
      <div class="hint">
        Both rulers go from <b>0</b> to <b>1</b> — the same whole. The more pieces
        you cut it into, the <b>smaller</b> each piece must be. So a <b>bigger
        bottom number</b> means a <b>smaller</b> piece. Tap the smaller one.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="nl-ans-amt">smaller piece:</span>
        <span class="den-choices">
          <span class="den-choice">1/3</span>
          <span class="den-choice is-on">1/8</span>
        </span>
      </div>
      <div class="lbar-cap">8 is bigger than 3, so 1/8 is the smaller piece</div>
      <div class="lbar-marks">
        <button class="check" disabled>Check</button>
      </div>
    </div>`,

  tutorHTML: tutor("Same whole, cut into more pieces — so each piece is smaller. A bigger bottom number means a smaller piece. 1/8 is smaller than 1/3."),
};
