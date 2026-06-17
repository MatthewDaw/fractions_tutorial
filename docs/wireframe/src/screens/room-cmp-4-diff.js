/* room-cmp-4-diff — №5 Compare & Check · Stage 4 "Rulers · Different". Now the
   bottoms differ, so the pieces are DIFFERENT sizes. Both strips span the same
   whole (0→1), so compare the red lengths. 1/2 > 1/3.
   Answer area uses < = > choice buttons (not drag). */
import { tutor } from "../cookSvg.js";
import { mixRuler } from "../eqBox.js";

const frac = (n, d, big = 34) =>
  `<div class="bignum" style="font-size:${big}px;min-width:48px"><span class="n" style="color:var(--red)">${n}</span><span class="bar" style="background:var(--ink)"></span><span class="d">${d}</span></div>`;

const cmpChoices = (n1, d1, n2, d2) =>
  `<div class="cmp-ans-row" style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">
    <span style="display:flex;align-items:center;gap:10px">${frac(n1, d1)}<span style="font-size:28px;color:var(--ink)">?</span>${frac(n2, d2)}</span>
    <div style="display:flex;gap:10px">
      <button class="cmp-choice" style="min-width:52px;padding:8px 14px;font-size:22px;border:2px solid var(--ink);border-radius:8px;background:none">&lt;</button>
      <button class="cmp-choice" style="min-width:52px;padding:8px 14px;font-size:22px;border:2px solid var(--ink);border-radius:8px;background:none">=</button>
      <button class="cmp-choice is-correct" style="min-width:52px;padding:8px 14px;font-size:22px;border:2px solid var(--red);border-radius:8px;background:rgba(230,80,60,.12)">&gt;</button>
    </div>
    <button class="check" disabled style="opacity:.5">Pick one</button>
  </div>`;

/* Two ruler strips stacked with their fraction labels */
const stageRulers = `
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;height:100%">
    <div style="display:flex;align-items:center;gap:20px">
      ${frac(1, 2)}
      ${mixRuler(1, 2, 1, { w: 460 })}
    </div>
    <div style="display:flex;align-items:center;gap:20px">
      ${frac(1, 3)}
      ${mixRuler(1, 3, 1, { w: 460 })}
    </div>
  </div>`;

export default {
  kind: "lesson",
  lesson: "cmp",

  stageHTML: stageRulers,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Different Base — Line Them Up</h3>
      <div class="hint">
        Different bottoms means <b>different-size pieces</b> — you can't just count.
        But both strips are the <b>same whole</b> (0→1), so line them up and compare
        the <b>red lengths</b>: one <b>half</b> reaches further than one <b>third</b>.
        So <b>1/2 &gt; 1/3</b>. (Fewer, bigger pieces can beat more, smaller ones.)
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">${cmpChoices(1, 2, 1, 3)}</div>
      <div class="lbar-cap">pick the sign — compare how far the red reaches on each strip</div>
      <div class="lbar-marks"></div>
    </div>`,

  tutorHTML: tutor("Different bottoms, different-size pieces — so line the strips up. A half reaches further than a third, so 1/2 is greater than 1/3."),
};
