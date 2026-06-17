/* room-num-7-words — №4 The Top Number · Stage 7 "Words" (a plain story problem).
   No digits laid out for them and no picture handed over — the numbers live in
   the prose ("six equal pieces… jam on four"). The child reads, finds the two
   numbers, and writes the fraction. Answer: 4/6. */
import { tutor } from "../cookSvg.js";

export default {
  kind: "lesson",
  lesson: "num",

  stageHTML: `
    <div class="den-play">
      <div class="bs-surface" style="width:560px;height:300px;border:2px dashed var(--paper-3);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--ink-mute);font-family:var(--serif);font-style:italic;">
        scratch space — draw the loaf and shade the jam pieces if it helps
      </div>
    </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Babushka's Loaf</h3>
      <div class="hint">
        Babushka cuts a loaf into <b>six equal pieces</b> and spreads jam on
        <b>four</b> of them. Find the two numbers in the story, then write the
        fraction of the loaf that has jam.
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="nl-ans-amt">fraction with jam →</span>
        <span class="r1-fz-slate">
          <div class="slate slate-fraction" role="group" aria-label="write the fraction with jam">
            <div class="slate-slot"><div class="slate-cell"><canvas class="slate-canvas" role="img" aria-label="write the top digit"></canvas><span class="slate-ph" aria-hidden="true">✎</span></div></div>
            <span class="slate-bar" style="background:var(--ink)" aria-hidden="true"></span>
            <div class="slate-slot"><div class="slate-cell"><canvas class="slate-canvas" role="img" aria-label="write the bottom digit"></canvas></div></div>
          </div>
        </span>
      </div>
      <div class="lbar-cap">read the story, find both numbers, write the fraction</div>
      <div class="lbar-marks"><button class="check" disabled>Check</button></div>
    </div>`,

  tutorHTML: tutor("Read carefully: six pieces in all, jam on four. Total on the bottom, jam on top — 4/6."),
};
