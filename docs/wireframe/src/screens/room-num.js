/* room-num — №4 The Top Number · Stage 1 "Shade" (the play stage).
   Bottom number fixed at 8. Pick a TOP number from the column and that many
   pieces of the ruler shade red — the top number counts the shaded pieces.
   (Synthesis "try some different top numbers, see what happens.") Snapshot: top
   = 3 → 3/8, three pieces red. Ruler layout, consistent with the den lesson. */
import { tutor } from "../cookSvg.js";
import { digitGrid } from "../eqBox.js";


// ruler of n equal pieces with the first k shaded (the numerator)
const ruler = (n, k) =>
  Array.from({ length: n }, (_, i) => `<div class="den-seg${i < k ? " is-unit" : ""}"></div>`).join("");

export default { kind: "lesson",
  lesson: "num",

  stageHTML: `
    <div class="den-play">
      ${digitGrid(3)}
      <div class="den-pick-frac"><div class="bignum"><span class="n" style="color:var(--red)">3</span><span class="bar" style="background:var(--ink)"></span><span class="d">8</span></div></div>
      <div class="den-ruler-wrap">
        <div class="den-ruler">${ruler(8, 3)}</div>
        <div class="den-ends"><span>0</span><span>1</span></div>
        <div class="den-cap">Bottom number is 8 — eight equal pieces. The top number says how many to shade.</div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Shade the Pieces</h3>
      <div class="hint">
        The ruler is split into <b>8</b> equal pieces (the bottom number). Now tap a
        <b>top number</b> — that many pieces turn <b>red</b>. Try a few: a
        <b>bigger</b> top number shades <b>more</b> pieces.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="den-pick-frac"><div class="bignum"><span class="n" style="color:var(--red)">3</span><span class="bar" style="background:var(--ink)"></span><span class="d">8</span></div></span>
        <span class="nl-ans-eq">=</span>
        <span class="nl-ans-amt"><b>3</b> of the <b>8</b> equal pieces are shaded</span>
      </div>
      <div class="lbar-cap">change the top number and watch the red grow — then move on</div>
      <div class="lbar-marks"><button class="check" disabled>Keep playing</button></div>
    </div>`,

  tutorHTML: tutor("Pick a top number and that many pieces shade red. The top number counts how many of the equal pieces are filled.") };
