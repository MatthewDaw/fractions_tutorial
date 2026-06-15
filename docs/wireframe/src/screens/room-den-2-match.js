/* room-den-2-match — №3 The Bottom Number · Stage 2 "Match".
   The reverse of Split: here the ruler is ALREADY split — the child reads the
   picture and picks the bottom number that made it (image → number). Snapshot:
   a ruler in 6 equal pieces; the column shows 6 chosen → the fraction is 1/6. */
import { tutor } from "../cookSvg.js";

const numcol = (on) =>
  Array.from({ length: 9 }, (_, i) => i + 1)
    .map((k) => `<div class="den-num${k === on ? " is-on" : ""}">${k}</div>`)
    .join("");

const ruler = (n, unit) =>
  Array.from({ length: n }, (_, i) =>
    `<div class="den-seg${i === 0 ? " is-unit" : ""}">${i === 0 ? `<span class="den-seg-lab">${unit}</span>` : ""}</div>`
  ).join("");

export default {
  kind: "lesson",
  lesson: "den",

  stageHTML: `
    <div class="den-play">
      <div class="den-numcol">${numcol(6)}</div>
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
        This ruler is already split. <b>Count the equal pieces</b>, then tap the
        number that made it. The bottom number is just <b>how many equal pieces</b>
        the whole was cut into — here, <b>six</b>.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="nl-ans-amt">6 equal pieces, so one piece is</span>
        <span class="nl-ans-eq">→</span>
        <span class="den-pick-frac"><div class="bignum"><span class="n">1</span><span class="bar" style="background:var(--ink)"></span><span class="d">6</span></div></span>
      </div>
      <div class="lbar-cap">tap the bottom number that matches the picture</div>
      <div class="lbar-marks">
        <button class="check" disabled>Check</button>
      </div>
    </div>`,

  tutorHTML: tutor("Count the pieces in the ruler. That count is the bottom number — six pieces means the bottom number is 6."),
};
