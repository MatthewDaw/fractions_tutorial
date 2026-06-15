/* room-num-3-whole — №4 The Top Number · Stage 3 "Whole".
   (Synthesis: "pick a top number to make all the pieces red.") When the top
   number equals the bottom number, every piece is shaded — that is one whole.
   Snapshot: top picker on 7, ruler of 7 all red → 7/7 = 1. */
import { tutor } from "../cookSvg.js";

const numcol = (on, max) =>
  Array.from({ length: max }, (_, i) => i + 1)
    .map((k) => `<div class="den-num${k === on ? " is-on" : ""}">${k}</div>`)
    .join("");

const ruler = (n, k) =>
  Array.from({ length: n }, (_, i) => `<div class="den-seg${i < k ? " is-unit" : ""}"></div>`).join("");

export default {
  kind: "lesson",
  lesson: "num",

  stageHTML: `
    <div class="den-play">
      <div class="den-numcol">${numcol(7, 7)}</div>
      <div class="den-pick-frac"><div class="bignum"><span class="n" style="color:var(--red)">7</span><span class="bar" style="background:var(--ink)"></span><span class="d">7</span></div></div>
      <div class="den-ruler-wrap">
        <div class="den-ruler">${ruler(7, 7)}</div>
        <div class="den-ends"><span>0</span><span>1</span></div>
        <div class="den-cap">Every one of the 7 pieces is red — the whole ruler is filled.</div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Make It Whole</h3>
      <div class="hint">
        Pick a top number that shades <b>every</b> piece. When the <b>top number
        equals the bottom number</b> — here <b>7/7</b> — all the pieces are red:
        that is <b>one whole</b>.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="den-pick-frac"><div class="bignum"><span class="n" style="color:var(--red)">7</span><span class="bar" style="background:var(--ink)"></span><span class="d">7</span></div></span>
        <span class="nl-ans-eq">=</span>
        <span class="nl-ans-amt"><b>1</b> whole — top equals bottom</span>
      </div>
      <div class="lbar-cap">when the top number matches the bottom, the fraction is 1</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("All seven pieces red means 7 out of 7 — the whole ruler. When top equals bottom, the fraction is one whole."),
};
