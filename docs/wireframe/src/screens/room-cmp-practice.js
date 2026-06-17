/* room-cmp-practice — №5 Compare & Check · Practice (#/cmp). The practice frame
   (GenPracticeBoard) rides the belowHTML escape hatch. The answer is the same
   DRAG-A-SYMBOL form the lesson steps use: a < = > bin, then the two fractions with
   a ? slot to drop the symbol into — no "is less than / is greater than" buttons. */
import { cmpDrag } from "../compare.js";

export default {
  kind: "lesson",
  lesson: "cmp",

  belowHTML: `
      <div class="gen-practice">
        <div class="gen-practice__q">
          <span class="gen-practice__prompt">3/4 ? 1/4</span>
        </div>
        <div class="gen-practice__answer">
          ${cmpDrag(3, 4, 1, 4)}
        </div>
        <div class="gen-practice__hints">
          <button type="button" class="gen-practice__hint-btn">Need a hint?</button>
        </div>
      </div>
`,
};
