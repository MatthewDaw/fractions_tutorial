/* room-m3-practice — №2 Times Facts · Practice (#/m3). The GenPracticeBoard
   frame does not map onto the 4-zone grid, so it rides the `belowHTML` escape
   hatch under the shared chrome (toolbar + topbar + tab strip). Interactive
   markup is verbatim from the original screen. */
export default {
  kind: "lesson",

  lesson: "m3",

  belowHTML: `
      <!-- GenPracticeBoard skill="MULT_FACTS" — rendered directly as the LessonShell body.
           answerShape "integer" → one multi-digit Slate cell + Check. Snapshot: a fresh
           generated fact, unsolved, hint affordance available. -->
      <div class="gen-practice">
        <div class="gen-practice__q">
          <span class="gen-practice__prompt">7 × 8</span>
        </div>
        <div class="gen-practice__answer">
          <div class="slate slate-row" role="group" aria-label="type the product">
            <div class="slate-slot">
              <div class="slate-cell">
                <canvas class="slate-canvas" role="img" aria-label="write a digit"></canvas>
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
