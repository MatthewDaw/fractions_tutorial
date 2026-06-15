/* room-r1-practice — lesson step of №3 (rendered by LessonScreen).
   Centralized chrome: toolbar + the shared <StageTabs> (see lessons.js) come from
   the component; this module declares only its identity and the markup BELOW the
   tabs (belowHTML), so it carries no copy of the tab strip. */
export default {
  kind: "lesson",
  lesson: "nl",
  belowHTML: `
<!-- QuestionBand HIDDEN on the practice stage (band=null) -->

      <!-- ══ GenPracticeBoard (skill ADD_SAME_DEN) — fresh, unsolved problem ══ -->
      <div class="gen-practice">
        <div class="gen-practice__q">
          <span class="gen-practice__prompt">2/7 + 3/7</span>
        </div>

        <div class="gen-practice__answer">
          <!-- fraction-shape answer: a Slate (slots n/d) -->
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

        <button type="button" class="check">Check</button>

        <!-- hint ladder — collapsed to the entry rung -->
        <div class="gen-practice__hints">
          <button type="button" class="gen-practice__hint-btn">Need a hint?</button>
        </div>

        <!-- status ribbon (stage intro line) -->
        <div class="ribbon ribbon--normal">Fresh problems, paced to your mastery — keep the bottom, add the tops.</div>
      </div>
`,
};
