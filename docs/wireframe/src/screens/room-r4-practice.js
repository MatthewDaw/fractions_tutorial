/* room-r4-practice — №8 Simplify · Practice. The practice frame (GenPracticeBoard)
   doesn't map onto the 4-zone board grid, so its body rides the `belowHTML`
   escape hatch; the shared chrome (toolbar + topbar + tab strip) still comes from
   <LessonScreen> via lesson:"r4". Interactive markup verbatim from the original. */
export default {
  kind: "lesson",

  lesson: "r4",

  belowHTML: `
      <!-- ── QUESTION BAND DELIBERATELY OMITTED on the practice stage ──────── -->

      <!-- ── BODY: GenPracticeBoard (skill SIMPLIFY) — the LessonShell body ─── -->
      <div class="gen-practice">
        <div class="gen-practice__q">
          <span class="gen-practice__prompt">8/12 = ?</span>
        </div>
        <div class="gen-practice__answer">
          <!-- fraction answer shape → stacked Slate (uncommitted write cells) -->
          <div class="slate slate-fraction" role="group" aria-label="write your answer as a fraction">
            <div class="slate-slot">
              <div class="slate-cell">
                <canvas class="slate-canvas" role="img" aria-label="write the top digit"></canvas>
                <span class="slate-ph" aria-hidden="true">✎</span>
              </div>
            </div>
            <span class="slate-bar" style="background:#1c1612;" aria-hidden="true"></span>
            <div class="slate-slot">
              <div class="slate-cell">
                <canvas class="slate-canvas" role="img" aria-label="write the bottom digit"></canvas>
                <span class="slate-ph" aria-hidden="true"></span>
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="check">Check</button>
        <!-- hint ladder collapsed (hintRung=0): the "Need a hint?" rung -->
        <div class="gen-practice__hints">
          <button type="button" class="gen-practice__hint-btn">Need a hint?</button>
        </div>
      </div>
`,
};
