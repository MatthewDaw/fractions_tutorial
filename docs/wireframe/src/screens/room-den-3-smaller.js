/* room-den-3-smaller — №3 The Bottom Number · Stage 5 "Smaller". Two stacked
   rulers — 1/3 (3 pieces) and 1/8 (8 pieces) — on the SAME 0→1 whole. The child
   TAPS the ruler whose red piece is smaller. Snapshot: child has tapped the 1/8
   ruler — more pieces means each piece is smaller, so 1/8 < 1/3. */
import { tutor } from "../cookSvg.js";

const PAIR = [3, 8]; // 1/3 vs 1/8 — smaller red piece is 1/8

/* single ruler row: fraction glyph + ruler strip. is-pick adds tap cursor. */
const rulerRow = (n, chosen = false) => {
  const segs = Array.from({ length: n }, (_, i) =>
    `<div class="den-seg${i === 0 ? " is-unit" : ""}">` +
    (i === 0 ? `<span class="den-seg-lab">1/${n}</span>` : "") +
    `</div>`
  ).join("");
  return `
    <div class="den-row is-pick${chosen ? " is-chosen" : ""}">
      <div class="bignum" style="font-size:38px;min-width:64px">
        <span class="n">1</span>
        <span class="bar" style="background:var(--ink)"></span>
        <span class="d">${n}</span>
      </div>
      <div class="den-ruler is-sm">${segs}</div>
    </div>`;
};

export default {
  kind: "lesson",
  lesson: "den",

  stageHTML: `
    <div class="sq-game" style="gap:34px">
      <div class="den-compare">
        ${rulerRow(3)}
        ${rulerRow(8, true)}
        <div class="den-cap">Same ruler, two bottom numbers. Which red piece is smaller?</div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Which Piece Is Smaller?</h3>
      <div class="hint">
        Both rulers go from <b>0</b> to <b>1</b> — the same whole. The more
        pieces you cut it into, the <b>smaller</b> each piece must be. So a
        <b>bigger bottom number</b> means a <b>smaller</b> piece. Tap the
        ruler with the smaller red piece.
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
      <div class="lbar-cap">8 is bigger than 3, so 1/8 is the smaller piece — tap the ruler to choose</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("Same whole, but 1/8 is cut into more pieces than 1/3 — so each 1/8 piece is smaller. Tap the ruler with the smaller red piece."),
};
