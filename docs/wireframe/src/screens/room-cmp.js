/* room-cmp — №5 Compare & Check · Stage 1 "Boxes". Two cell-box grids, same base
   (eighths), so the cells are the same size. Six shaded beats three shaded.
   3/8 < 6/8. The answer area uses < = > choice buttons (not drag). */
import { tutor } from "../cookSvg.js";
import { cellBox } from "../eqBox.js";

const frac = (n, d, big = 34) =>
  `<div class="bignum" style="font-size:${big}px;min-width:48px"><span class="n" style="color:var(--red)">${n}</span><span class="bar" style="background:var(--ink)"></span><span class="d">${d}</span></div>`;

const cmpChoices = (n1, d1, n2, d2) =>
  `<div class="cmp-ans-row" style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">
    <span style="display:flex;align-items:center;gap:10px">${frac(n1, d1)}<span style="font-size:28px;color:var(--ink)">?</span>${frac(n2, d2)}</span>
    <div style="display:flex;gap:10px">
      <button class="cmp-choice is-correct" style="min-width:52px;padding:8px 14px;font-size:22px;border:2px solid var(--red);border-radius:8px;background:rgba(230,80,60,.12)">&lt;</button>
      <button class="cmp-choice" style="min-width:52px;padding:8px 14px;font-size:22px;border:2px solid var(--ink);border-radius:8px;background:none">=</button>
      <button class="cmp-choice" style="min-width:52px;padding:8px 14px;font-size:22px;border:2px solid var(--ink);border-radius:8px;background:none">&gt;</button>
    </div>
    <button class="check" disabled style="opacity:.5">Pick one</button>
  </div>`;

/* Two cell boxes side by side with a "?" between them */
const stageBoxes = `
  <div style="display:flex;align-items:center;justify-content:center;gap:40px;height:100%">
    <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
      <span style="font-size:13px;color:var(--ink);font-weight:600">3/8</span>
      ${cellBox(8, 3)}
      ${frac(3, 8)}
    </div>
    <span style="font-size:48px;color:var(--ink);font-weight:300">?</span>
    <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
      <span style="font-size:13px;color:var(--ink);font-weight:600">6/8</span>
      ${cellBox(8, 6)}
      ${frac(6, 8)}
    </div>
  </div>`;

export default {
  kind: "lesson",
  lesson: "cmp",

  stageHTML: stageBoxes,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Which Square Has More?</h3>
      <div class="hint">
        Both squares are cut into <b>eighths</b> — the cells are the <b>same size</b>.
        So the bigger fraction is the one with <b>more shaded</b>: <b>6/8</b> has
        more red than <b>3/8</b>. When the <b>bottoms match</b>, the bigger <b>top</b>
        wins: <b>3/8 &lt; 6/8</b>.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">${cmpChoices(3, 8, 6, 8)}</div>
      <div class="lbar-cap">pick the sign between the two fractions — same bottom, more on top is bigger</div>
      <div class="lbar-marks"></div>
    </div>`,

  tutorHTML: tutor("Both boxes are eighths — same-size cells. Six shaded beats three shaded, so 3/8 is less than 6/8."),
};
