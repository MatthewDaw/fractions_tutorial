/* room-cmp-practice — №5 Compare & Check · Practice (AppCompare, #/cmp).
   Data-only module consumed by <LessonScreen>. The chrome (toolbar, topbar,
   tabs) is the shared component. The practice frame (GenPracticeBoard surface)
   does not map to the 4-zone board grid, so it stays via the belowHTML escape
   hatch. Interactive markup is verbatim from the original screen. */
export default {
  kind: "lesson",

  lesson: "cmp",

  belowHTML: `
      <!-- ── GenPracticeBoard surface (replaces LessonBoard; skill answer = relation) ── -->
      <div class="gen-practice">
        <div class="gen-practice__q">
          <span class="gen-practice__prompt">3/4 ? 1/4</span>
        </div>
        <div class="gen-practice__answer">
          <!-- relation shape → two .check relation buttons, NO separate Check -->
          <div style="display:flex; gap:12px; justify-content:center;">
            <button type="button" class="check">is less than</button>
            <button type="button" class="check">is greater than</button>
          </div>
        </div>
        <!-- Hint ladder — quiet affordance, collapsed (no rung revealed yet) -->
        <div class="gen-practice__hints">
          <button type="button" class="gen-practice__hint-btn">Need a hint?</button>
        </div>
      </div>
`,
};
