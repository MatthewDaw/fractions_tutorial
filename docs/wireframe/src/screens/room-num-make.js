/* room-num-make — №4 The Top Number · Stage "Make" (the match-two-squares game,
   step 2 — recreate BOTH numbers). On a SQUARE, nothing fixed: the child reads the
   TARGET square, then taps numbers and drops them on the bottom slot (how many
   cells) AND the top slot (how many to shade) to rebuild it exactly. Snapshot:
   target = 5/8; both slots set to match. */
import { tutor } from "../cookSvg.js";
import { cellBox, digitGrid } from "../eqBox.js";


export default { kind: "lesson",
  lesson: "num",

  stageHTML: `
    <div class="sq-game">
      ${digitGrid(5)}
      <div class="sq-frac sq-frac-pick">
        <div class="bignum"><span class="n sq-slot-active" style="color:var(--red)">5</span><span class="bar" style="background:var(--ink)"></span><span class="d">8</span></div>
        <div class="sq-frac-hint">tap a number, then tap the top or bottom</div>
      </div>
      <div class="eq-col">
        <span class="eq-lab">your square</span>
        ${cellBox(8, 5)}
      </div>
      <div class="eq-eq">match<br>→</div>
      <div class="eq-col">
        <span class="eq-lab">target</span>
        ${cellBox(8, 5, { cls: "is-target" })}
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Rebuild Both Numbers</h3>
      <div class="hint">
        Now <b>nothing is fixed</b>. Read the <b>target</b>: count <b>all</b> the
        cells to set the <b>bottom number</b>, then count the <b>red</b> ones to set
        the <b>top number</b>. Get both right and <b>your</b> square will match the
        target exactly.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="bignum"><span class="n" style="color:var(--red)">5</span><span class="bar" style="background:var(--ink)"></span><span class="d">8</span></span>
        <span class="nl-ans-eq">=</span>
        <span class="nl-ans-amt"><b>8</b> cells, <b>5</b> red — the squares match</span>
      </div>
      <div class="lbar-cap">set the bottom (all cells) and the top (red cells) to match the target</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("Count every cell in the target for the bottom number, then count the red cells for the top number. Set both to rebuild the square.") };
