/* review — RawScreen (one-off scene). Inner-#stage markup captured
   verbatim from the original static screen. Edit shared chrome in LessonScreen
   does NOT apply here; this scene owns its full body. */
export default {
  kind: "raw",
  title: "Mixed Basket",
  route: "#/review",
  bodyHTML: `
<!-- MixedReview.jsx — ready (eligible.length >= 2) -->
    <div class="mixreview">

      <!-- onExit → back to the map -->
      <a class="mixreview__back" href="world.html">←</a>

      <h2 class="mixreview__title">Mixed Basket</h2>
      <p class="mixreview__sub">Babushka mixed the recipes together — solved 4 so far.</p>

      <!-- problem.prompt — rotating equation, rendered as plain text -->
      <div class="mixreview__prompt">3/8 + 1/4</div>

      <!-- PHASE 1 — identify: one choice per introduced recipe (LABEL[s] = room title) -->
      <div class="mixreview__identify">
        <p class="mixreview__q">Which recipe is this?</p>
        <div class="mixreview__choices">
          <button type="button" class="mixreview__choice">Equal Groups</button>
          <button type="button" class="mixreview__choice">Times Facts</button>
          <button type="button" class="mixreview__choice">On the Number Line</button>
          <button type="button" class="mixreview__choice">Same Denominators</button>
          <button type="button" class="mixreview__choice">Taking Away</button>
          <button type="button" class="mixreview__choice">Compare &amp; Check</button>
          <button type="button" class="mixreview__choice">Scale One</button>
        </div>
      </div>

      <!-- PHASE 2 — solve: the answer Slate (shape "fraction" → stacked num/den) -->
      <div class="mixreview__solve">
        <!-- Slate layout="fraction": top cell + denominator bar + bottom cell -->
        <div class="slate slate-fraction" role="group" aria-label="write your answer as a fraction">
          <!-- top (numerator) slot — autoFocusKey "n": shows the ✎ write cue -->
          <div class="slate-slot">
            <div class="slate-cell">
              <canvas class="slate-canvas" role="img" aria-label="write the top digit"></canvas>
              <span class="slate-ph" aria-hidden="true">✎</span>
            </div>
          </div>
          <span class="slate-bar" aria-hidden="true"></span>
          <!-- bottom (denominator) slot -->
          <div class="slate-slot">
            <div class="slate-cell">
              <canvas class="slate-canvas" role="img" aria-label="write the bottom digit"></canvas>
              <span class="slate-ph" aria-hidden="true"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- status ribbon — tone ok after a correct identify -->
      <div class="ribbon ribbon--ok">Yes — now solve it.</div>

    </div>
`,
};
