/* room-r5-practice — №9 Mixed Numbers · Practice (lesson r5, #/r5).
   Data-only module consumed by <LessonScreen>. The chrome (toolbar, topbar,
   tabs, board grid) is the shared component. The practice frame does not map
   cleanly onto the 4-zone board, so it lives in `belowHTML` (spec Step 4);
   the inline topbar/tabs and the goal banner are dropped (now central).
   Interactive markup is verbatim. */
export default {
  kind: "lesson",

  lesson: "r5",

  belowHTML: `
      <!-- ══ BODY (isPractice branch: <GenPracticeBoard skill=IMPROPER_TO_MIXED>) ══ -->
      <div class="gen-practice">
        <div class="gen-practice__q">
          <!-- prob.prompt — a fresh generated variation (e.g. 7/4 = ?) -->
          <span class="gen-practice__prompt">7/4 = ?</span>
        </div>
        <div class="gen-practice__answer">
          <!-- answerShape("IMPROPER_TO_MIXED") = "mixed" → whole Slate + "and" + fraction Slate -->
          <div style="display:flex; align-items:center; gap:14px;">
            <!-- Slate layout="row" — the whole-number cell (autofocus ✎) -->
            <div class="slate slate-row" role="group" aria-label="how many wholes">
              <div class="slate-slot">
                <div class="slate-cell">
                  <canvas class="slate-canvas" role="img" aria-label="write a digit"></canvas>
                  <span class="slate-ph" aria-hidden="true">✎</span>
                </div>
              </div>
            </div>
            <span style="font-style:italic;">and</span>
            <!-- Slate layout="fraction" — top / bottom, both writable -->
            <div class="slate slate-fraction" role="group" aria-label="leftover fraction">
              <div class="slate-slot">
                <div class="slate-cell">
                  <canvas class="slate-canvas" role="img" aria-label="write the top digit"></canvas>
                  <span class="slate-ph" aria-hidden="true"></span>
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
        </div>
        <button type="button" class="check">Check</button>
        <!-- hint ladder — a real strategy hint, not the answer -->
        <div class="gen-practice__hints">
          <button type="button" class="gen-practice__hint-btn">Need a hint?</button>
        </div>
        <!-- engine-paced status ribbon -->
        <div class="ribbon ribbon--normal">Fresh problems — paced to your mastery. Write each one as a mixed number.</div>
      </div>`,
};
