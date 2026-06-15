/* room-r3-practice — №6 Scale One · Practice. Converted to a thin
   kind:"lesson" module so it flows through the shared chrome (toolbar + topbar +
   tab strip). The GenPracticeBoard frame does not map cleanly to the 4-zone
   grid, so it stays via the belowHTML escape hatch (spec Step 4). The inline
   chrome and the top goal banner are removed. Interactive markup is verbatim. */
export default {
  kind: "lesson",

  lesson: "r3",

  belowHTML: `
      <!-- Practice branch: GenPracticeBoard (ADD_UNLIKE_NESTED, fraction shape) -->
      <div class="gen-practice">
        <div class="gen-practice__q">
          <span class="gen-practice__prompt">2/3 + 3/4 = ?</span>
        </div>
        <div class="gen-practice__answer">
          <!-- fraction-shape Slate: write the answer as a fraction -->
          <div class="slate slate-fraction" role="group" aria-label="write your answer as a fraction">
            <div class="slate-slot"><div class="slate-cell"><span class="slate-ph" aria-hidden="true">✎</span></div></div>
            <span class="slate-bar" style="background:#1c1612;" aria-hidden="true"></span>
            <div class="slate-slot"><div class="slate-cell"><span class="slate-ph" aria-hidden="true"></span></div></div>
          </div>
        </div>
        <button type="button" class="check">Check</button>
        <div class="gen-practice__hints">
          <button type="button" class="gen-practice__hint-btn">Need a hint?</button>
        </div>
        <div class="ribbon ribbon--normal">Fresh problems — paced to your mastery. Find a common size, then add.</div>
      </div>`,
};
