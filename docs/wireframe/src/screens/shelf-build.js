/* shelf-build — RawScreen (one-off scene). Inner-#stage markup captured
   verbatim from the original static screen. Edit shared chrome in LessonScreen
   does NOT apply here; this scene owns its full body. */
export default {
  kind: "raw",
  title: "Shelf · Building Fractions",
  route: "#/world",
  bodyHTML: `
<div class="world world--submenu">
      <div class="foxing"></div>

      <a class="world-back" href="world.html" aria-label="Back to all shelves">
        <span aria-hidden="true">←</span> All lessons
      </a>

      <div class="world-head">
        <div class="tag">Shelf · Lessons 3–6</div>
        <h1>Building Fractions</h1>
        <div class="sub">What the two numbers in a fraction mean, then adding or taking away same-size pieces.</div>
      </div>

      <!-- chain trail linking the four lessons left→right (under the cards).
           CARD_W=250, GAP=42, total=4*250+3*42=1126, startCx=(1280-1126)/2+125=202
           Card centres at 202 · 494 · 786 · 1078 → 15.78% · 38.59% · 61.41% · 84.22%. -->
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

      <a class="wcard" href="room-den-paint.html" style="left:15.78125%;top:54.75%;" title="Open Lesson 3" data-mastery-status="not-started">
        <div class="whead">
          <span class="wno">№3</span>
          <span class="wtag ready">Ready</span>
        </div>
        <h2>The Bottom Number</h2>
        <p>Split a ruler into equal pieces — and discover that a bigger bottom number makes each piece smaller.</p>
        <div class="wex">
          <span class="wex-label">Denominator</span>
          <span class="wex-frac">1/8 &lt; 1/3</span>
        </div>
      </a>

      <a class="wcard" href="room-num-paint.html" style="left:38.59375%;top:54.75%;" title="Open Lesson 4" data-mastery-status="not-started">
        <div class="whead">
          <span class="wno">№4</span>
          <span class="wtag ready">Ready</span>
        </div>
        <h2>The Top Number</h2>
        <p>Shade pieces on the ruler — the top number counts how many are filled — then read and write the fraction.</p>
        <div class="wex">
          <span class="wex-label">Numerator</span>
          <span class="wex-frac">5/8</span>
        </div>
      </a>

      <a class="wcard" href="room-nl.html" style="left:61.40625%;top:54.75%;" title="Open Lesson 5" data-mastery-status="not-started">
        <div class="whead">
          <span class="wno">№5</span>
          <span class="wtag ready">Ready</span>
        </div>
        <h2>Same Denominators</h2>
        <p>Place a fraction on the number line by growing it from unit pieces — then add fractions that share a bottom.</p>
        <div class="wex">
          <span class="wex-label">Line → Add</span>
          <span class="wex-frac">2/7 + 3/7</span>
        </div>
      </a>

      <a class="wcard" href="room-s1.html" style="left:84.21875%;top:54.75%;" title="Open Lesson 6" data-mastery-status="not-started">
        <div class="whead">
          <span class="wno">№6</span>
          <span class="wtag ready">Ready</span>
        </div>
        <h2>Taking Away</h2>
        <p>Same-size pieces — break the stack, take some off, keep the bottom.</p>
        <div class="wex">
          <span class="wex-label">Subtracting</span>
          <span class="wex-frac">5/8 − 2/8</span>
        </div>
      </a>

      <div class="world-foot">Tap a lesson to begin — or go back to pick another shelf.</div>
    </div>
`,
};
