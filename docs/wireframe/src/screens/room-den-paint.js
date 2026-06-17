/* room-den-paint — №3 The Bottom Number · Stage 1 "Paint". The first thing the
   child does: take a whole strip and CUT it by clicking the right divide button
   (the bottom number), then paint the unit piece red. "Paint 1/4" → cut into 4,
   paint 1. Snapshot: ÷4 chosen, strip in 4 pieces, one painted. */
import { tutor } from "../cookSvg.js";

const RW = 460;
const ruler = (n, k, cls = "") =>
  `<div class="den-ruler ${cls}" style="--den-ruler-w:${RW}px">` +
  Array.from({ length: n }, (_, i) => `<div class="den-seg${i < k ? " is-unit" : ""}"></div>`).join("") +
  `</div>`;
const divBtns = (on) =>
  [2, 3, 4, 6].map((d) => `<button class="sq-divbtn${d === on ? " is-on" : ""}">${d}</button>`).join("");

export default {
  kind: "lesson",
  lesson: "den",

  stageHTML: `
    <div class="sq-game sq-paint">
      <div class="eq-col" style="gap:14px">
        <span class="sq-side-lab">paint 1/4 red</span>
        <div class="den-ruler-wrap" style="gap:6px">
          ${ruler(4, 1, "is-paint")}
          <div class="den-ends" style="--den-ruler-w:${RW}px"><span>0</span><span>1</span></div>
        </div>
        <div class="sq-divide">
          <span class="sq-divide-lab">cut the strip into:</span>
          ${divBtns(4)}
        </div>
      </div>
      <div class="sq-tool">
        <div class="sq-tool-h">Fill</div>
        <div class="sq-swatches">
          <span class="sq-swatch is-red is-on"></span>
          <span class="sq-swatch is-ink"></span>
        </div>
        <button class="sq-reset">Reset</button>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Cut, Then Paint</h3>
      <div class="hint">
        <b>Paint 1/4 of the strip red.</b> First, <b>cut the strip</b> — click the
        <b>÷4</b> button so the bottom number is <b>4</b> (four equal pieces). Then
        <b>paint 1</b> of those pieces red. Tap a piece to fill it; <b>Reset</b> to
        start over.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="nl-ans-amt">cut into <b>4</b>, then paint</span>
        <span class="sq-frac"><div class="bignum"><span class="n">1</span><span class="bar" style="background:var(--ink)"></span><span class="d">4</span></div></span>
        <span class="nl-ans-amt">— <b>1</b> piece of <b>4</b></span>
      </div>
      <div class="lbar-cap">divide into the bottom number first, then paint the top</div>
      <div class="lbar-marks"><button class="check" disabled>Got it</button></div>
    </div>`,

  tutorHTML: tutor("First cut the strip into four — that's the bottom number. Then paint one of the four pieces red. One over four."),
};
