/* room-num-paint — №4 The Top Number · Stage "Paint" (the Synthesis "paint the
   square red" game, on OUR 2-D box). The general case: a square cut into N equal
   pieces, paint K of them red to make K/N. Snapshot: "Paint 3/4 of this square
   red", a 2×2 box with three cells painted (mirrors the Synthesis screenshot). */
import { tutor } from "../cookSvg.js";

const cols = (n) => (n <= 3 ? n : n === 4 ? 2 : 3);
const box = (n, k, cls = "") => {
  const cells = Array.from({ length: n }, (_, i) => `<div class="sq-cell${i < k ? " is-fill" : ""}"></div>`).join("");
  return `<div class="sq-box ${cls}" style="grid-template-columns:repeat(${cols(n)},1fr)">${cells}</div>`;
};

export default {
  kind: "lesson",
  lesson: "num",

  stageHTML: `
    <div class="sq-game sq-paint">
      <div class="sq-side">
        <span class="sq-side-lab">paint 3/4 red</span>
        ${box(4, 3, "is-paint")}
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
      <h3 class="pick-title">Paint the Fraction</h3>
      <div class="hint">
        The square is cut into <b>4</b> equal pieces (the bottom number).
        <b>Paint 3/4 red</b>: the top number is <b>3</b>, so fill in <b>three</b>
        of the four pieces. Tap pieces to fill them; use <b>Reset</b> to start
        over.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="nl-ans-amt">Paint</span>
        <span class="sq-frac"><div class="bignum"><span class="n" style="color:var(--red)">3</span><span class="bar" style="background:var(--ink)"></span><span class="d">4</span></div></span>
        <span class="nl-ans-amt">of the square red — <b>3</b> pieces of <b>4</b></span>
      </div>
      <div class="lbar-cap">fill three of the four pieces</div>
      <div class="lbar-marks"><button class="check" disabled>Got it</button></div>
    </div>`,

  tutorHTML: tutor("Three over four means three pieces out of four. Paint three of the four equal pieces red."),
};
