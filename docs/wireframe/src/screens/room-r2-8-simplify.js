/* room-r2-8-simplify — №11 Cross-Multiply · Stage "Simplify". The capstone: after
   the cross-multiply add, simplify the answer (Lesson 7). Example 3/10 + 1/6 over a
   common bottom of 30 is 9/30 + 5/30 = 14/30 — not lowest terms. The greatest
   common factor of 14 and 30 is 2, so ÷2 gives 7/15. A sum isn't done until it's
   simplest. (Shown as numbers: a 30-cell box would be too fine to read.) */
import { tutor } from "../cookSvg.js";

const frac = (n, d, big = 56) => `<div class="bignum" style="font-size:${big}px"><span class="n" style="color:var(--red)">${n}</span><span class="bar" style="background:var(--ink)"></span><span class="d">${d}</span></div>`;

export default {
  kind: "lesson",
  lesson: "r2",

  stageHTML: `
    <div class="eq-stage" style="flex-direction:column; gap:22px">
      <div class="eq-stage" style="padding:0; gap:20px">
        ${frac(3, 10, 48)}
        <span class="eq-eq" style="font-style:normal">+</span>
        ${frac(1, 6, 48)}
        <span class="eq-eq" style="font-style:normal">=</span>
        ${frac(14, 30, 48)}
      </div>
      <div class="eq-eq">÷2 ↓</div>
      ${frac(7, 15, 64)}
      <div class="eq-cap">14 and 30 share the factor <b>2</b> — divide both to reach <b>7/15</b></div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Now Simplify the Answer</h3>
      <div class="hint">
        Over a common bottom of <b>30</b>, the sum is <b>14/30</b> — but that isn't
        in <b>lowest terms</b>. Find the <b>greatest common factor</b> of <b>14</b>
        and <b>30</b> — it's <b>2</b> — and divide both: <b>7/15</b>. <b>Always
        simplify your answer.</b>
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="bignum"><span class="n" style="color:var(--red)">14</span><span class="bar" style="background:var(--ink)"></span><span class="d">30</span></span>
        <span class="nl-ans-eq">=</span>
        <span class="nl-ans-amt">simplest answer:</span>
        <span class="den-choices"><span class="den-choice is-on">7/15</span><span class="den-choice">14/30</span><span class="den-choice">7/30</span></span>
      </div>
      <div class="lbar-cap">add, then reduce by the GCF — 14/30 = 7/15</div>
      <div class="lbar-marks"><button class="check">Next ▸</button></div>
    </div>`,

  tutorHTML: tutor("Fourteen over thirty isn't finished — both divide by two, so simplify to seven fifteenths. Always reduce your answer to lowest terms."),
};
