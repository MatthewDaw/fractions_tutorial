/* room-num-3-whole — №4 The Top Number · Stage 4 "Whole".
   The child picks the top number that shades EVERY piece, discovering that
   when the top equals the bottom the fraction is 1. Ruler has 7 pieces;
   target top = 7. Snapshot: top = 7, all 7 pieces red, 7/7 = 1. */
import { tutor } from "../cookSvg.js";
import { digitGrid } from "../eqBox.js";

const ruler = (n, k) =>
  Array.from({ length: n }, (_, i) => `<div class="den-seg${i < k ? " is-unit" : ""}"></div>`).join("");

export default {
  kind: "lesson",
  lesson: "num",

  stageHTML: `
    <div class="den-play">
      ${digitGrid(7)}
      <div class="den-pick-frac"><div class="bignum"><span class="n" style="color:var(--red)">7</span><span class="bar" style="background:var(--ink)"></span><span class="d">7</span></div></div>
      <div class="den-ruler-wrap">
        <div class="den-ruler">${ruler(7, 7)}</div>
        <div class="den-ends"><span>0</span><span>1</span></div>
        <div class="den-cap">All 7 pieces are red — when the top equals the bottom, the fraction is 1 whole.</div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Make It Whole</h3>
      <div class="hint">
        Pick a <b>top number</b> that shades <b>every</b> piece. When the
        <b>top number equals the bottom</b> — here <b>7/7</b> — all pieces
        are red: that is <b>one whole</b>.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="den-pick-frac"><div class="bignum"><span class="n" style="color:var(--red)">7</span><span class="bar" style="background:var(--ink)"></span><span class="d">7</span></div></span>
        <span class="nl-ans-eq">=</span>
        <span class="nl-ans-amt"><b>1</b> whole — top equals bottom</span>
      </div>
      <div class="lbar-cap">when the top matches the bottom, the fraction is 1</div>
      <div class="lbar-marks"><button class="check" disabled>Got it</button></div>
    </div>`,

  tutorHTML: tutor("Pick the top number that fills every piece. Seven out of seven — when the top equals the bottom, the fraction equals one whole."),
};
