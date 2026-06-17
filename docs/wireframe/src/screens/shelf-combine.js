/* shelf-combine — RawScreen (one-off scene). Inner-#stage markup captured
   verbatim from the original static screen. Edit shared chrome in LessonScreen
   does NOT apply here; this scene owns its full body. */
export default {
  kind: "raw",
  title: "Shelf · Combining &amp; Renaming",
  route: "#/world",
  bodyHTML: `
<div class="world world--submenu">
      <div class="foxing"></div>

      <a class="world-back" href="world.html" aria-label="Back to all shelves">
        <span aria-hidden="true">←</span> All lessons
      </a>

      <div class="world-head">
        <div class="tag">Shelf · Lessons 8–12</div>
        <h1>Combining &amp; Renaming</h1>
        <div class="sub">Unlike pieces, equivalent names, and whole-and-a-bit.</div>
      </div>

      <!-- chain trail linking the five lessons left→right (under the cards).
           Card centres at 56 · 348 · 640 · 932 · 1224 (CARD_W=250, GAP=42). -->
      <svg class="wedges" viewBox="0 0 1280 800" preserveAspectRatio="none" aria-hidden="true">
        <g>
          <path d="M 56 438 Q 202 416 348 438" fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" opacity="0.75" />
          <path d="M 56 438 Q 202 416 348 438" fill="none" stroke="var(--red)" stroke-width="1.3" stroke-dasharray="1 8" stroke-linecap="round" opacity="0.8" />
        </g>
        <g>
          <path d="M 348 438 Q 494 416 640 438" fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" opacity="0.75" />
          <path d="M 348 438 Q 494 416 640 438" fill="none" stroke="var(--red)" stroke-width="1.3" stroke-dasharray="1 8" stroke-linecap="round" opacity="0.8" />
        </g>
        <g>
          <path d="M 640 438 Q 786 416 932 438" fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" opacity="0.75" />
          <path d="M 640 438 Q 786 416 932 438" fill="none" stroke="var(--red)" stroke-width="1.3" stroke-dasharray="1 8" stroke-linecap="round" opacity="0.8" />
        </g>
        <g>
          <path d="M 932 438 Q 1078 416 1224 438" fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" opacity="0.75" />
          <path d="M 932 438 Q 1078 416 1224 438" fill="none" stroke="var(--red)" stroke-width="1.3" stroke-dasharray="1 8" stroke-linecap="round" opacity="0.8" />
        </g>
      </svg>

      <!-- 5 cards, one row, matching shelf-build layout formula:
           CARD_W=250, GAP=42, total=5*250+4*42=1418, startCx=(1280-1418)/2+125=56
           positions: 56, 348, 640, 932, 1224 → 4.375%, 27.1875%, 50%, 72.8125%, 95.625% -->

      <a class="wcard" href="room-r4-2-bind.html" style="left:4.375%;top:54.75%;" title="Open Lesson 8" data-mastery-status="not-started">
        <div class="whead">
          <span class="wno">№8</span>
          <span class="wtag ready">Ready</span>
        </div>
        <h2>Equivalent Fractions</h2>
        <p>The same amount has many names. Cut each cell in two (1/3 = 2/6) or three (1/3 = 3/9) and hunt for every equivalent.</p>
        <div class="wex">
          <span class="wex-label">Equivalents</span>
          <span class="wex-frac">1/3 = 2/6 = 3/9</span>
        </div>
      </a>

      <a class="wcard" href="room-simp.html" style="left:27.1875%;top:54.75%;" title="Open Lesson 9" data-mastery-status="not-started">
        <div class="whead">
          <span class="wno">№9</span>
          <span class="wtag ready">Ready</span>
        </div>
        <h2>Simplify</h2>
        <p>Run equivalence backwards — bundle cells together to write the same amount with the fewest pieces.</p>
        <div class="wex">
          <span class="wex-label">Simplest</span>
          <span class="wex-frac">8/12 → 2/3</span>
        </div>
      </a>

      <a class="wcard" href="room-r3.html" style="left:50%;top:54.75%;" title="Open Lesson 10" data-mastery-status="not-started">
        <div class="whead">
          <span class="wno">№10</span>
          <span class="wtag ready">Ready</span>
        </div>
        <h2>Scale One</h2>
        <p>One bottom already fits the other — rename one fraction, add, then simplify the answer.</p>
        <div class="wex">
          <span class="wex-label">Adding</span>
          <span class="wex-frac">1/6 + 1/3 → 1/2</span>
        </div>
      </a>

      <a class="wcard" href="room-r2.html" style="left:72.8125%;top:54.75%;" title="Open Lesson 11" data-mastery-status="not-started">
        <div class="whead">
          <span class="wno">№11</span>
          <span class="wtag ready">Ready</span>
        </div>
        <h2>Cross-Multiply</h2>
        <p>Neither bottom fits — rename both over a common bottom, add, then simplify the answer.</p>
        <div class="wex">
          <span class="wex-label">Adding</span>
          <span class="wex-frac">3/10 + 1/6 → 7/15</span>
        </div>
      </a>

      <a class="wcard" href="room-r5.html" style="left:95.625%;top:54.75%;" title="Open Lesson 12" data-mastery-status="not-started">
        <div class="whead">
          <span class="wno">№12</span>
          <span class="wtag ready">Ready</span>
        </div>
        <h2>Mixed Numbers</h2>
        <p>Turn an improper fraction into a whole number and a leftover.</p>
        <div class="wex">
          <span class="wex-label">Converting</span>
          <span class="wex-frac">9/7 → 1 2/7</span>
        </div>
      </a>

      <div class="world-foot">Tap a lesson to begin — or go back to pick another shelf.</div>
    </div>
`,
};
