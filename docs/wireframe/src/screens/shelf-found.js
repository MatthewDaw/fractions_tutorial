/* shelf-found — RawScreen (one-off scene). Inner-#stage markup captured
   verbatim from the original static screen. Edit shared chrome in LessonScreen
   does NOT apply here; this scene owns its full body. */
export default {
  kind: "raw",
  title: "Shelf · Counting &amp; Times",
  route: "#/world",
  bodyHTML: `
<div class="world world--submenu">
      <div class="foxing"></div>

      <a class="world-back" href="world.html" aria-label="Back to all shelves">
        <span aria-hidden="true">←</span> All lessons
      </a>

      <div class="world-head">
        <div class="tag">Shelf · Lessons 1–2</div>
        <h1>Counting &amp; Times</h1>
        <div class="sub">Whole-number groups — the floor every fraction stands on.</div>
      </div>

      <!-- chain trail linking the strand's lessons left→right (under the cards) -->
      <svg class="wedges" viewBox="0 0 1280 800" preserveAspectRatio="none" aria-hidden="true">
        <g>
          <path d="M 494 438 Q 640 416 786 438" fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" opacity="0.75" />
          <path d="M 494 438 Q 640 416 786 438" fill="none" stroke="var(--red)" stroke-width="1.3" stroke-dasharray="1 8" stroke-linecap="round" opacity="0.8" />
        </g>
      </svg>

      <a class="wcard" href="room-m1.html" style="left:38.59%;top:54.75%;" title="Open Lesson 1" data-mastery-status="not-started">
        <div class="whead">
          <span class="wno">№1</span>
          <span class="wtag ready">Ready</span>
        </div>
        <h2>Equal Groups</h2>
        <p>Same count on every plate — add the group again and again, or multiply.</p>
        <div class="wex">
          <span class="wex-label">Multiplying</span>
          <span class="wex-frac">3 × 4</span>
        </div>
      </a>

      <a class="wcard" href="room-m3.html" style="left:61.41%;top:54.75%;" title="Open Lesson 2" data-mastery-status="not-started">
        <div class="whead">
          <span class="wno">№2</span>
          <span class="wtag ready">Ready</span>
        </div>
        <h2>Times Facts</h2>
        <p>Skip-count the jar to the answer, then know it by heart.</p>
        <div class="wex">
          <span class="wex-label">Multiplying</span>
          <span class="wex-frac">7 × 8</span>
        </div>
      </a>

      <div class="world-foot">Tap a lesson to begin — or go back to pick another shelf.</div>
    </div>
`,
};
