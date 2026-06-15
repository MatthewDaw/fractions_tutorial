/* room-m1-practice — №1 Equal Groups · Practice. Data-only module consumed by
   <LessonScreen>. The chrome (toolbar, topbar, tabs) is the shared component.
   The generated-practice frame doesn't map to the 4-zone board grid, so it
   stays via the belowHTML escape hatch (spec Step 4); the inline topbar /
   stage-tabs / goal banner are stripped. Interactive markup verbatim. */
export default {
  kind: "lesson",

  lesson: "m1",

  belowHTML: `
      <!-- ── GenPracticeBoard (skill MULT_EQUAL_GROUPS, integer answer) ──── -->
      <div class="gen-practice">
        <div class="gen-practice__q">
          <span class="gen-practice__prompt">2 × 5</span>
        </div>
        <div class="gen-practice__answer">
          <div class="slate slate-row" role="group" aria-label="type the product">
            <div class="slate-slot">
              <div class="slate-cell">
                <canvas class="slate-canvas" role="img" aria-label="write the answer digit"></canvas>
                <span class="slate-ph" aria-hidden="true">✎</span>
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="check">Check</button>
        <div class="gen-practice__hints">
          <button type="button" class="gen-practice__hint-btn">Need a hint?</button>
        </div>
      </div>`,
};
