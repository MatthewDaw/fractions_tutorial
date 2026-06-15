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
        <div class="tag">Shelf · Lessons 7–10</div>
        <h1>Combining &amp; Renaming</h1>
        <div class="sub">Unlike pieces, simplest names, and whole-and-a-bit.</div>
      </div>

      <!-- chain trail linking the strand's lessons left→right (under the cards) -->
      <svg class="wedges" viewBox="0 0 1280 800" preserveAspectRatio="none" aria-hidden="true">
        <g>
          <path d="M 202 438 Q 348 416 494 438" fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" opacity="0.75" />
          <path d="M 202 438 Q 348 416 494 438" fill="none" stroke="var(--red)" stroke-width="1.3" stroke-dasharray="1 8" stroke-linecap="round" opacity="0.8" />
        </g>
        <g>
          <path d="M 494 438 Q 640 416 786 438" fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" opacity="0.75" />
          <path d="M 494 438 Q 640 416 786 438" fill="none" stroke="var(--red)" stroke-width="1.3" stroke-dasharray="1 8" stroke-linecap="round" opacity="0.8" />
        </g>
        <g>
          <path d="M 786 438 Q 932 416 1078 438" fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" opacity="0.75" />
          <path d="M 786 438 Q 932 416 1078 438" fill="none" stroke="var(--red)" stroke-width="1.3" stroke-dasharray="1 8" stroke-linecap="round" opacity="0.8" />
        </g>
      </svg>

      <a class="wcard" href="room-r3.html" style="left:202px;top:438px;" title="Open Lesson 6" data-mastery-status="not-started">
        <div class="whead">
          <span class="wno">№6</span>
          <span class="wtag ready">Ready</span>
        </div>
        <h2>Scale One</h2>
        <p>One bottom already fits the other — rename just one fraction, then add.</p>
        <div class="wex">
          <span class="wex-label">Adding</span>
          <span class="wex-frac">3/8 + 1/4</span>
        </div>
      </a>

      <a class="wcard" href="room-r2.html" style="left:494px;top:438px;" title="Open Lesson 7" data-mastery-status="not-started">
        <div class="whead">
          <span class="wno">№7</span>
          <span class="wtag ready">Ready</span>
        </div>
        <h2>Cross-Multiply</h2>
        <p>Neither bottom fits — rename both to equivalent fractions over a common bottom, then add.</p>
        <div class="wex">
          <span class="wex-label">Adding</span>
          <span class="wex-frac">1/2 + 1/3</span>
        </div>
      </a>

      <a class="wcard" href="room-r4.html" style="left:786px;top:438px;" title="Open Lesson 8" data-mastery-status="not-started">
        <div class="whead">
          <span class="wno">№8</span>
          <span class="wtag ready">Ready</span>
        </div>
        <h2>Simplify</h2>
        <p>8/12 and 2/3 are the same amount — divide top and bottom by the same number (that's dividing by 1) to reach its simplest name.</p>
        <div class="wex">
          <span class="wex-label">Simplifying</span>
          <span class="wex-frac">8/12 → 2/3</span>
        </div>
      </a>

      <a class="wcard" href="room-r5.html" style="left:1078px;top:438px;" title="Open Lesson 9" data-mastery-status="not-started">
        <div class="whead">
          <span class="wno">№9</span>
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
