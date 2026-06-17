/* room-simp-5-pick — №9 Simplify · Stage 5 "Pick". No picture: two independent
   MC chip columns for the top number and the bottom number. The child picks the
   SIMPLEST top & bottom (2 and 3) that still match the target amount — 8/12.
   Any equivalent matches, but only 2/3 uses the fewest pieces. */
import { tutor } from "../cookSvg.js";

export default { kind: "lesson",
  lesson: "simp",

  stageHTML: `
    <div class="eq-stage" style="align-items:center;gap:32px">
      <div class="eq-col" style="gap:8px">
        <span class="eq-lab">Top number</span>
        <div class="den-choices" style="flex-direction:column;gap:8px">
          <span class="den-choice is-on">2</span>
          <span class="den-choice">4</span>
          <span class="den-choice">8</span>
          <span class="den-choice">3</span>
        </div>
      </div>
      <div class="eq-col" style="gap:8px">
        <div class="bignum" style="font-size:64px">
          <span class="n" style="color:var(--red)">2</span>
          <span class="bar" style="background:var(--ink)"></span>
          <span class="d">3</span>
        </div>
      </div>
      <div class="eq-col" style="gap:8px">
        <span class="eq-lab">Bottom number</span>
        <div class="den-choices" style="flex-direction:column;gap:8px">
          <span class="den-choice is-on">3</span>
          <span class="den-choice">6</span>
          <span class="den-choice">12</span>
          <span class="den-choice">4</span>
        </div>
      </div>
      <div class="eq-eq">=</div>
      <div class="eq-col" style="gap:4px">
        <span class="eq-lab">target</span>
        <div class="bignum" style="font-size:64px">
          <span class="n" style="color:var(--red)">8</span>
          <span class="bar" style="background:var(--ink)"></span>
          <span class="d">12</span>
        </div>
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Pick the Simplest Name</h3>
      <div class="hint">
        The <b>target</b> is <b>8/12</b>. Choose a top and bottom that keep the
        <b>same red amount</b> but use the <b>fewest pieces</b>. 4/6 matches too —
        but <b>2/3</b> is as low as it goes. Pick the <b>simplest</b> pair.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="nl-ans-amt">simplest name for 8/12:</span>
        <span class="bignum" style="font-size:36px"><span class="n" style="color:var(--red)">2</span><span class="bar" style="background:var(--ink)"></span><span class="d">3</span></span>
        <span class="nl-ans-amt">— same amount, fewest pieces — simplest</span>
      </div>
      <div class="lbar-cap">pick the top and bottom that match 8/12 with the fewest pieces</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("Match the target with the fewest pieces. 4/6 works, but 2/3 is the smallest pair that still fills the same red amount — that's simplest.") };
