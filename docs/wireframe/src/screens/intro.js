/* intro — RawScreen (one-off scene). Inner-#stage markup captured
   verbatim from the original static screen. Edit shared chrome in LessonScreen
   does NOT apply here; this scene owns its full body. */
export default {
  kind: "raw",
  title: "Room intro",
  route: "RoomIntro",
  bodyHTML: `
<!-- RoomIntro.jsx root: .intro (+ .has-transcript because this room has cues) -->
    <div class="intro has-transcript" data-novox>
      <div class="intro-main">

        <!-- The real component renders a same-origin <iframe class="intro-frame" src={room.intro}>.
             For the wireframe we render the player frame statically (a representative box) — no
             external iframe src is embedded. -->
        <div class="intro-frame" role="img" aria-label="Lesson 11 — Cross-Multiply intro"
             style="display:grid; place-items:center; text-align:center; color:var(--ink-mute); font-family:var(--serif);">
          <div>
            <div style="font-family:var(--display); letter-spacing:0.18em; text-transform:uppercase; font-size:12px; color:var(--red);">Intro video</div>
            <div style="font-size:18px; margin-top:10px;">Same-Size Pieces — animated intro</div>
            <div style="font-size:14px; font-style:italic; margin-top:6px;">silent video · narration gated to its playhead</div>
          </div>
        </div>

        <!-- intro-bar: shown while the intro is playing (not ended) -->
        <div class="intro-bar">
          <!-- back to the lesson map (onBack → world.html) -->
          <a class="ctrl-btn intro-back" href="world.html" title="Back to the lesson map">←</a>
          <!-- pause/play; playing state shows the PAUSE glyph (two bars) -->
          <a class="ctrl-btn intro-pause" href="#" title="Pause" aria-label="Pause">
            <svg width="13" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="3" y="2" width="3" height="10" fill="currentColor" /><rect x="8" y="2" width="3" height="10" fill="currentColor" /></svg>
          </a>
          <div class="intro-label">Lesson 11 · Cross-Multiply — intro</div>
          <!-- Skip ▸ (onContinue path) → world.html -->
          <a class="intro-continue" href="world.html">Skip ▸</a>
        </div>
      </div>

      <!-- transcript rail (rendered when the room has narration cues) -->
      <aside class="intro-transcript">
        <div class="tr-head">
          <span>Transcript</span>
          <!-- SettingsButton renders with class .tr-mute; real glyph is a gear (inlined as SVG) -->
          <a class="tr-mute" href="../screens/settings.html" title="Settings" aria-label="Settings">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <circle cx="9" cy="9" r="3" fill="none" stroke="currentColor" stroke-width="1.5" />
              <path d="M9 1.5 V3 M9 15 v1.5 M1.5 9 H3 M15 9 h1.5 M3.6 3.6 l1.1 1.1 M13.3 13.3 l1.1 1.1 M14.4 3.6 l-1.1 1.1 M4.7 13.3 l-1.1 1.1" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" />
            </svg>
          </a>
        </div>
        <ol class="tr-list">
          <!-- "start" marker — active highlights the start while activeIdx < 0; here the first cue is active -->
          <li class="tr-line tr-start" title="Start from the beginning">▸ Start of the video</li>
          <li class="tr-line active" title="Jump to this line">One third of a strip, and one half of a strip.</li>
          <li class="tr-line" title="Jump to this line">Different sizes — how can we add them?</li>
          <li class="tr-line" title="Jump to this line">Slice them into matching pieces!</li>
          <li class="tr-line" title="Jump to this line">Every piece is now one sixth — the same size.</li>
          <li class="tr-line" title="Jump to this line">So the bottom number is six.</li>
          <li class="tr-line" title="Jump to this line">Count the pieces…</li>
          <li class="tr-line" title="Jump to this line">One third plus one half makes five sixths.</li>
        </ol>
        <div class="tr-foot">Narrated by the Cook · click a line to jump there</div>
      </aside>
    </div>
`,
};
