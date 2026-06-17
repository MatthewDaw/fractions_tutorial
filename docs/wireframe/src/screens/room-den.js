/* room-den — №3 The Bottom Number · Stage 1 "Split" (the play stage).
   Pick a number from the 1–9 column and the 0→1 ruler splits into that many
   EQUAL pieces; one unit piece (1/N) is inked red. Free play: change the number,
   watch the pieces get smaller as the number grows. Snapshot: 4 is picked → 1/4,
   ruler in four equal pieces. Ruler layout (not a 2-D box). */
import { tutor } from "../cookSvg.js";
import { digitGrid } from "../eqBox.js";


// a ruler split into n equal pieces; the first piece is the red unit 1/n
const ruler = (n, unit) =>
  Array.from({ length: n }, (_, i) =>
    `<div class="den-seg${i === 0 ? " is-unit" : ""}">${i === 0 ? `<span class="den-seg-lab">${unit}</span>` : ""}</div>`
  ).join("");

export default { kind: "lesson",
  lesson: "den",

  stageHTML: `
    <div class="den-play">
      ${digitGrid(4)}
      <div class="den-pick-frac"><div class="bignum"><span class="n">1</span><span class="bar" style="background:var(--ink)"></span><span class="d">4</span></div></div>
      <div class="den-ruler-wrap">
        <div class="den-ruler">${ruler(4, "1/4")}</div>
        <div class="den-ends"><span>0</span><span>1</span></div>
        <div class="den-cap">Pick a bottom number — the ruler from 0 to 1 splits into that many equal pieces.</div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Split the Ruler</h3>
      <div class="hint">
        Tap a number in the column. The ruler from <b>0</b> to <b>1</b> breaks into
        that many <b>equal</b> pieces — and one piece is <b>1 over that number</b>.
        Try a few: watch the pieces get <b>smaller</b> as the number gets <b>bigger</b>.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="den-pick-frac"><div class="bignum"><span class="n">1</span><span class="bar" style="background:var(--ink)"></span><span class="d">4</span></div></span>
        <span class="nl-ans-eq">=</span>
        <span class="nl-ans-amt">one piece of a ruler split into <b>4</b> equal parts</span>
      </div>
      <div class="lbar-cap">change the bottom number and keep playing — then move on</div>
      <div class="lbar-marks">
        <button class="check" disabled>Keep playing</button>
      </div>
    </div>`,

  tutorHTML: tutor("Pick a number and watch the ruler split. The bottom number says how many equal pieces the whole is cut into.") };
