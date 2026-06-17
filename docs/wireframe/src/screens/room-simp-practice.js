/* room-simp-practice — №9 Simplify · Practice. The practice frame (GenPracticeBoard)
   rides the `belowHTML` escape hatch; the shared chrome comes from <LessonScreen>
   via lesson:"simp". Prompt: simplify to lowest terms. */
export default {
  kind: "lesson",
  lesson: "simp",

  belowHTML: `
      <!-- ══ PRACTICE branch: <GenPracticeBoard skill="SIMPLIFY" /> ══ -->
      <div class="gen-practice">
        <div class="gen-practice__q">
          <span class="gen-practice__prompt">8/12 = ? (simplest)</span>
        </div>
        <div class="gen-practice__answer">
          <!-- fraction answer Slate (answerShape "fraction"): top over bottom -->
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
        <!-- status ribbon -->
        <div class="ribbon ribbon--normal">Fresh problems, paced to your mastery — find the greatest common factor and divide both top and bottom by it.</div>
      </div>
`,
};
