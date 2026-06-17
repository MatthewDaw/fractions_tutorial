/* room-den-match — №3 The Bottom Number · Stage 3 "Match". The ruler is already
   split into 6 equal pieces; the child COUNTS the pieces and taps the number that
   matches — proving the bottom number equals the piece-count. Snapshot: 6 picked,
   ruler in 6 pieces, first piece is red with label "1/6". */
import { tutor } from "../cookSvg.js";
import { digitGrid } from "../eqBox.js";

const ruler = (n, unit) =>
  Array.from({ length: n }, (_, i) =>
    `<div class="den-seg${i === 0 ? " is-unit" : ""}">${i === 0 ? `<span class="den-seg-lab">${unit}</span>` : ""}</div>`
  ).join("");

export default {
  kind: "lesson",
  lesson: "den",

  stageHTML: `
    <div class="den-play">
      ${digitGrid(6)}
      <div class="den-pick-frac"><div class="bignum"><span class="n">1</span><span class="bar" style="background:var(--ink)"></span><span class="d">6</span></div></div>
      <div class="den-ruler-wrap">
        <div class="den-ruler">${ruler(6, "1/6")}</div>
        <div class="den-ends"><span>0</span><span>1</span></div>
        <div class="den-cap">Count the equal pieces — that count is the bottom number.</div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Match the Number</h3>
      <div class="hint">
        This ruler is already split. <b>Count the equal pieces</b>, then tap the number
        that made it. The bottom number is just <b>how many equal pieces</b> the whole
        was cut into — here, <b>six</b>.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="nl-ans-amt">6 equal pieces, so one piece is</span>
        <span class="nl-ans-eq">→</span>
        <span class="den-pick-frac"><div class="bignum"><span class="n">1</span><span class="bar" style="background:var(--ink)"></span><span class="d">6</span></div></span>
      </div>
      <div class="lbar-cap">the bottom number IS the piece-count</div>
      <div class="lbar-marks"><button class="check" disabled>Next stage ▸</button></div>
    </div>`,

  tutorHTML: tutor("Count the pieces in the ruler. That count is the bottom number — six pieces means the bottom number is 6."),
};
