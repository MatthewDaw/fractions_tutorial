/* room-s1-practice — №4 Taking Away · Practice (AppSubtract, #/s1 stage ★).
   Data-only module consumed by <LessonScreen>. The chrome (toolbar, topbar,
   tabs, board grid) is the shared component; the practice frame does not map
   onto the 4-zone board, so it rides the belowHTML escape hatch. Interactive
   markup is verbatim from the original screen. */
export default {
  kind: "lesson",

  lesson: "s1",

  belowHTML: `
      <div class="gen-practice">
        <div class="gen-practice__q">
          <span class="gen-practice__prompt">6/8 − 1/8</span>
        </div>
        <div class="gen-practice__answer">
          <div class="slate slate-fraction" role="group" aria-label="write your answer as a fraction">
            <div class="slate-slot">
              <div class="slate-cell">
                <canvas class="slate-canvas" role="img" aria-label="write the top digit"></canvas>
                <span class="slate-ph" aria-hidden="true">✎</span>
              </div>
            </div>
            <span class="slate-bar" style="background:#d1495b" aria-hidden="true"></span>
            <div class="slate-slot">
              <div class="slate-cell">
                <canvas class="slate-canvas" role="img" aria-label="write the bottom digit"></canvas>
                <span class="slate-ph" aria-hidden="true"></span>
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="check">Check</button>
        <div class="gen-practice__hints">
          <button type="button" class="gen-practice__hint-btn">Need a hint?</button>
        </div>
      </div>
`,
};
