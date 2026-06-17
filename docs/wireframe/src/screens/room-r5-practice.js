/* room-r5-practice — №12 Mixed Numbers · Practice. The practice frame
   (GenPracticeBoard) rides the `belowHTML` escape hatch; the shared chrome comes
   from <LessonScreen> via lesson:"r5". Prompt: write the improper fraction as a
   mixed number. */
export default {
  kind: "lesson",
  lesson: "r5",

  belowHTML: `
      <div class="gen-practice">
        <div class="gen-practice__q">
          <span class="gen-practice__prompt">7/4 = ? (mixed number)</span>
        </div>
        <div class="gen-practice__answer" style="display:flex; align-items:center; gap:18px;">
          <!-- the WHOLE-number cell (a mixed number is whole + fraction) -->
          <div class="slate-slot" aria-label="write the whole number">
            <div class="slate-cell" style="width:96px; height:124px;">
              <canvas class="slate-canvas" role="img" aria-label="write the whole number"></canvas>
              <span class="slate-ph" aria-hidden="true">✎</span>
            </div>
          </div>
          <div class="slate slate-fraction" role="group" aria-label="write the fraction part">
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
        <div class="gen-practice__hints">
          <button type="button" class="gen-practice__hint-btn">Need a hint?</button>
        </div>
      </div>
`,
};
