/* room-r4-7-sort — №8 Equivalent Fractions · Stage 7 "Sort". A pile of new
   fractions on the left; four bins on the right, each headed by a simplest-form
   fraction (1/2, 1/3, 1/4, 1/5). The child drags each card into the bin it is
   equal to — 3/6 → 1/2, 2/6 → 1/3, 2/8 → 1/4, and so on. Snapshot: three cards
   already sorted, one mid-drag toward the 1/2 bin, two still in the pile. */
import { tutor } from "../cookSvg.js";

const frac = (n, d) => `<div class="bignum"><span class="n" style="color:var(--red)">${n}</span><span class="bar" style="background:var(--ink)"></span><span class="d">${d}</span></div>`;
const card = (n, d, cls = "") => `<div class="eq-card ${cls}">${frac(n, d)}</div>`;
const bin = (n, d, cards, cls = "") => `
        <div class="eq-bin ${cls}">
          <div class="eq-bin-head">${frac(n, d)}</div>
          <div class="eq-bin-body">${cards.map(([cn, cd]) => card(cn, cd)).join("")}</div>
        </div>`;

export default {
  kind: "lesson",
  lesson: "r4",

  stageHTML: `
    <div class="eq-sort">
      <div class="eq-pile">
        <span class="eq-lab">drag each fraction to its bin</span>
        ${card(2, 4, "is-drag")}
        ${card(5, 15)}
        ${card(3, 12)}
      </div>
      <div class="eq-bins">
        ${bin(1, 2, [[3, 6]], "is-hot")}
        ${bin(1, 3, [[2, 6]])}
        ${bin(1, 4, [[2, 8]])}
        ${bin(1, 5, [])}
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Sort the Fractions</h3>
      <div class="hint">
        Each bin is labelled with a <b>simplest</b> fraction. A new fraction appears
        on the left — drag it into the bin it is <b>equal to</b>. <b>2/4</b> goes to
        <b>1/2</b>; <b>5/15</b> goes to <b>1/3</b>; <b>3/12</b> goes to <b>1/4</b>.
        Think: does the top fit into the bottom the same number of times?
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="nl-ans-amt">sorted <b>3</b> of <b>6</b> — drag <b>2/4</b> into the <b>1/2</b> bin</span>
      </div>
      <div class="lbar-cap">drop each fraction in the bin equal to it</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("Each bin is a simplest fraction. Drag the new fraction into the bin it equals — 2/4 is the same as 1/2, so it goes in the 1/2 bin."),
};
