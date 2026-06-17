/* room-simp-6-numbers — №9 Simplify · Stage 6 "Numbers". No picture: simplify from
   the symbols alone. Find the greatest common factor of top and bottom, divide
   both by it, write the simplest name on the Slate. Snapshot: 8/12 = ? */
import { tutor } from "../cookSvg.js";

export default {
  kind: "lesson",
  lesson: "simp",

  stageHTML: `
    <div class="eq-stage" style="align-items:center;gap:32px">
      <div class="eq-col">
        <span class="eq-lab">simplify</span>
        <div class="bignum" style="font-size:72px"><span class="n" style="color:var(--red)">8</span><span class="bar" style="background:var(--ink)"></span><span class="d">12</span></div>
      </div>
      <div class="eq-eq">=</div>
      <div class="eq-col">
        <span class="eq-lab">lowest terms</span>
        <div class="bignum" style="font-size:72px;opacity:0.35"><span class="n" style="color:var(--red)">?</span><span class="bar" style="background:var(--ink)"></span><span class="d">?</span></div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Lowest Terms</h3>
      <div class="hint">
        No tools — just the numbers. To simplify <b>8/12</b>: find the <b>greatest common
        factor</b> of the top and bottom — the biggest number that divides
        <b>both</b>. Here it is <b>4</b>. Divide both by it: 8 ÷ 4 = <b>2</b>,
        12 ÷ 4 = <b>3</b>. Write the simplest name on the Slate.
      </div>
      <div class="r4-card" style="margin-top:16px;display:flex;align-items:center;gap:16px;padding:12px 16px;background:var(--parchment-1);border-radius:6px">
        <span class="bignum" style="font-size:32px"><span class="n" style="color:var(--red)">8</span><span class="bar" style="background:var(--ink)"></span><span class="d">12</span></span>
        <span style="font-size:13px;color:var(--ink-2)">write this in<br><b>lowest terms</b></span>
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="bignum" style="font-size:36px"><span class="n" style="color:var(--red)">8</span><span class="bar" style="background:var(--ink)"></span><span class="d">12</span></span>
        <span class="nl-ans-eq">=</span>
        <!-- Slate: two canvas cells stacked as a fraction -->
        <div class="slate slate-fraction" role="group" aria-label="write your answer as a fraction">
          <div class="slate-slot">
            <div class="slate-cell">
              <canvas class="slate-canvas" role="img" aria-label="write the top digit"></canvas>
              <span class="slate-ph" aria-hidden="true">✎</span>
            </div>
          </div>
          <span class="slate-bar" style="background:var(--ink);" aria-hidden="true"></span>
          <div class="slate-slot">
            <div class="slate-cell">
              <canvas class="slate-canvas" role="img" aria-label="write the bottom digit"></canvas>
              <span class="slate-ph" aria-hidden="true"></span>
            </div>
          </div>
        </div>
      </div>
      <div class="lbar-cap">write the equivalent fraction on the Slate, then Check</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("No picture now. The biggest number that divides both 8 and 12 is 4. Eight over four is two, twelve over four is three — so 8/12 simplifies to 2/3."),
};
