/* room-den-paint — №3 The Bottom Number · Stage "Paint" (the Synthesis
   "paint the square red" game, on OUR 2-D box). Scoped to the bottom number:
   the box is already cut into N equal pieces and the child paints the single
   unit piece (1/N) red — proving they can build a unit fraction by hand.
   Snapshot: "Paint 1/4 of this square red", a 2×2 box with one cell painted. */
import { tutor } from "../cookSvg.js";

const cols = (n) => (n <= 3 ? n : n === 4 ? 2 : 3);
const box = (n, k, cls = "") => {
  const cells = Array.from({ length: n }, (_, i) => `<div class="sq-cell${i < k ? " is-fill" : ""}"></div>`).join("");
  return `<div class="sq-box ${cls}" style="grid-template-columns:repeat(${cols(n)},1fr)">${cells}</div>`;
};

export default {
  kind: "lesson",
  lesson: "den",

  stageHTML: `
    <div class="sq-game sq-paint">
      <div class="sq-side">
        <span class="sq-side-lab">paint 1/4 red</span>
        ${box(4, 1, "is-paint")}
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
        This square is cut into <b>4</b> equal pieces — that is the bottom number.
        <b>Paint 1/4 red</b>: the top number is <b>1</b>, so fill in exactly
        <b>one</b> of the four pieces. Tap a piece to fill it; use <b>Reset</b> to
        start over.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="nl-ans-amt">Paint</span>
        <span class="sq-frac"><div class="bignum"><span class="n">1</span><span class="bar" style="background:var(--ink)"></span><span class="d">4</span></div></span>
        <span class="nl-ans-amt">of the square red — <b>1</b> piece of <b>4</b></span>
      </div>
      <div class="lbar-cap">fill exactly one of the four pieces</div>
      <div class="lbar-marks"><button class="check" disabled>Got it</button></div>
    </div>`,

  tutorHTML: tutor("One over four means one piece out of four. The square is in four equal pieces — paint just one of them red."),
};
