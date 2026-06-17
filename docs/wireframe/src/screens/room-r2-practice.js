/* room-r2-practice — №11 Cross-Multiply · Practice (GenPracticeBoard, #/r2).
   Data-only module consumed by <LessonScreen>. The chrome (toolbar, topbar,
   tabs) is the shared component; the practice frame is unique and rides in
   belowHTML. Interactive markup is verbatim from the original screen. */
export default {
  kind: "lesson",

  lesson: "r2",

  belowHTML: `
      <!-- ══ PRACTICE branch: <GenPracticeBoard skill="ADD_UNLIKE_COPRIME" /> ═ -->
      <div class="gen-practice">
        <div class="gen-practice__q">
          <span class="gen-practice__prompt">1/2 + 1/3</span>
        </div>
        <div class="gen-practice__answer">
          <!-- fraction answer Slate (answerShape "fraction"): top over bottom -->
          <div class="slate slate-fraction" role="group" aria-label="write your answer as a fraction">
            <div class="slate-slot">
              <div class="slate-cell"><canvas class="slate-canvas" role="img" aria-label="write the top digit"></canvas><span class="slate-ph" aria-hidden="true">✎</span></div>
            </div>
            <span class="slate-bar" style="background:#1c1612" aria-hidden="true"></span>
            <div class="slate-slot">
              <div class="slate-cell"><canvas class="slate-canvas" role="img" aria-label="write the bottom digit"></canvas><span class="slate-ph" aria-hidden="true"></span></div>
            </div>
          </div>
        </div>
        <button type="button" class="check">Check</button>
        <!-- the hint ladder (hintRung 0 → just the offer, no revealed list) -->
        <div class="gen-practice__hints">
          <button type="button" class="gen-practice__hint-btn">Need a hint?</button>
        </div>
        <div class="ribbon ribbon--normal">A new pair. Find a common size, then add — same move, new dress.</div>
      </div>
`,
};
