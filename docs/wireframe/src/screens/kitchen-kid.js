/* kitchen-kid — RawScreen (one-off scene). Inner-#stage markup captured
   verbatim from the original static screen. Edit shared chrome in LessonScreen
   does NOT apply here; this scene owns its full body. */
export default {
  kind: "raw",
  title: "Babushka's Kitchen · Kid",
  route: "#/mom",
  bodyHTML: `
<div class="page momsroom" data-vox-speaker="kid">
      <div class="foxing"></div>

      <!-- ══ TOPBAR ══════════════════════════════════════════════════════════ -->
      <div class="topbar">
        <div style="display:flex; align-items:center; gap:14px;">
          <span class="num-mark mr-heart">★</span>
          <div>
            <div class="puzzle-tag">Babushka's Kitchen · Story Problems</div>
            <div class="puzzle-title">Show Babushka What You Know</div>
          </div>
        </div>
        <!-- mastery pips: CURRICULUM r1, r3, r2, r4, r5 — r1 active (on), 0 mastered -->
        <div class="mr-progress" aria-label="0 of 5 skills mastered">
          <span class="mr-pip on" title="Same Denominators"></span>
          <span class="mr-pip" title="Scale One"></span>
          <span class="mr-pip" title="Cross-Multiply"></span>
          <span class="mr-pip" title="Simplify"></span>
          <span class="mr-pip" title="Mixed Numbers"></span>
        </div>
        <div class="controls">
          <!-- onBack → world map -->
          <a class="ctrl-btn" href="world.html" title="Back to the kitchen map">←</a>
          <!-- SettingsButton (inert) -->
          <span class="ctrl-btn" title="Settings">⚙</span>
          <!-- restart / clears progress (inert) -->
          <span class="ctrl-btn" title="Start over (clears progress)">⟲</span>
        </div>
      </div>

      <!-- ══ GOAL BAND — the word problem IS the question (prose only) ════════ -->
      <div class="goal mr-goal-primary">
        <button class="speaker">
          <svg width="16" height="14" viewBox="0 0 16 14"><path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)" /><path d="M11 4 Q14 7 11 10" stroke="var(--red)" stroke-width="1.4" fill="none" /></svg>
          Read aloud
        </button>
        <div class="goal-text" data-vox="mr_mom_goal_choc" data-vox-speaker="kid">You snapped off three eighths of the chocolate bar, and your brother snapped off two eighths. How much of the bar is gone?</div>
      </div>

      <!-- ══ DETERMINISTIC FIXED-ZONE LAYOUT (.mr-s) ═════════════════════════ -->
      <div class="mr-s">

        <!-- ── PROP / STORY ZONE (fixed rect, top-left) ── -->
        <div class="mr-s-stage">
          <!-- quiet stage tag (mirror stage → the skill label) -->
          <div class="mr-stage-tag">
            <span class="g">Same Denominators</span>
          </div>

          <!-- prop: ChocolateBar, state "full" (8 inked squares on the ruler) -->
          <div class="mr-stage">
            <svg viewBox="0 0 340 220" width="100%" style="display:block">
              <defs>
                <pattern id="rh-choc" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill="var(--red)" />
                  <line x1="0" y1="0" x2="0" y2="6" stroke="var(--red-deep)" stroke-width="1.4" opacity="0.5" />
                </pattern>
                <pattern id="ih-choc" patternUnits="userSpaceOnUse" width="6" height="6">
                  <rect width="6" height="6" fill="var(--paper-2)" />
                  <path d="M0 0 L6 6 M0 6 L6 0" stroke="var(--ink)" stroke-width="0.8" opacity="0.45" />
                </pattern>
                <pattern id="lh-choc" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.42" />
                </pattern>
                <pattern id="dot-choc" patternUnits="userSpaceOnUse" width="13" height="13">
                  <circle cx="6.5" cy="6.5" r="1.1" fill="var(--ink)" opacity="0.5" />
                </pattern>
                <pattern id="stip-choc" patternUnits="userSpaceOnUse" width="7" height="7">
                  <rect width="7" height="7" fill="var(--paper-2)" />
                  <circle cx="2" cy="2" r="0.8" fill="var(--ink)" opacity="0.32" />
                  <circle cx="5.5" cy="5" r="0.7" fill="var(--ink)" opacity="0.26" />
                </pattern>
                <linearGradient id="bevelT-choc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="#ffffff" stop-opacity="0.30" />
                  <stop offset="0.18" stop-color="#ffffff" stop-opacity="0" />
                  <stop offset="0.82" stop-color="#000000" stop-opacity="0" />
                  <stop offset="1" stop-color="#000000" stop-opacity="0.22" />
                </linearGradient>
              </defs>

              <!-- outer bar tray -->
              <rect x="26" y="106" width="288" height="62" rx="5" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.6" />

              <!-- 8 inked squares (state "full": present = 8) -->
              <!-- cell i: x = 30 + i*35, cw = 35, top = 112, h = 50 -->
              <g>
                <g><rect x="32" y="114" width="31" height="46" rx="3" fill="var(--ink-soft)" stroke="var(--ink)" stroke-width="2" /><rect x="32" y="114" width="31" height="46" rx="3" fill="url(#lh-choc)" /><rect x="37" y="119" width="21" height="36" rx="2" fill="none" stroke="#000" stroke-opacity="0.28" stroke-width="2" /><rect x="36" y="118" width="21" height="36" rx="2" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-width="1.4" /></g>
                <g><rect x="67" y="114" width="31" height="46" rx="3" fill="var(--ink-soft)" stroke="var(--ink)" stroke-width="2" /><rect x="67" y="114" width="31" height="46" rx="3" fill="url(#lh-choc)" /><rect x="72" y="119" width="21" height="36" rx="2" fill="none" stroke="#000" stroke-opacity="0.28" stroke-width="2" /><rect x="71" y="118" width="21" height="36" rx="2" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-width="1.4" /></g>
                <g><rect x="102" y="114" width="31" height="46" rx="3" fill="var(--ink-soft)" stroke="var(--ink)" stroke-width="2" /><rect x="102" y="114" width="31" height="46" rx="3" fill="url(#lh-choc)" /><rect x="107" y="119" width="21" height="36" rx="2" fill="none" stroke="#000" stroke-opacity="0.28" stroke-width="2" /><rect x="106" y="118" width="21" height="36" rx="2" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-width="1.4" /></g>
                <g><rect x="137" y="114" width="31" height="46" rx="3" fill="var(--ink-soft)" stroke="var(--ink)" stroke-width="2" /><rect x="137" y="114" width="31" height="46" rx="3" fill="url(#lh-choc)" /><rect x="142" y="119" width="21" height="36" rx="2" fill="none" stroke="#000" stroke-opacity="0.28" stroke-width="2" /><rect x="141" y="118" width="21" height="36" rx="2" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-width="1.4" /></g>
                <g><rect x="172" y="114" width="31" height="46" rx="3" fill="var(--ink-soft)" stroke="var(--ink)" stroke-width="2" /><rect x="172" y="114" width="31" height="46" rx="3" fill="url(#lh-choc)" /><rect x="177" y="119" width="21" height="36" rx="2" fill="none" stroke="#000" stroke-opacity="0.28" stroke-width="2" /><rect x="176" y="118" width="21" height="36" rx="2" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-width="1.4" /></g>
                <g><rect x="207" y="114" width="31" height="46" rx="3" fill="var(--ink-soft)" stroke="var(--ink)" stroke-width="2" /><rect x="207" y="114" width="31" height="46" rx="3" fill="url(#lh-choc)" /><rect x="212" y="119" width="21" height="36" rx="2" fill="none" stroke="#000" stroke-opacity="0.28" stroke-width="2" /><rect x="211" y="118" width="21" height="36" rx="2" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-width="1.4" /></g>
                <g><rect x="242" y="114" width="31" height="46" rx="3" fill="var(--ink-soft)" stroke="var(--ink)" stroke-width="2" /><rect x="242" y="114" width="31" height="46" rx="3" fill="url(#lh-choc)" /><rect x="247" y="119" width="21" height="36" rx="2" fill="none" stroke="#000" stroke-opacity="0.28" stroke-width="2" /><rect x="246" y="118" width="21" height="36" rx="2" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-width="1.4" /></g>
                <g><rect x="277" y="114" width="31" height="46" rx="3" fill="var(--ink-soft)" stroke="var(--ink)" stroke-width="2" /><rect x="277" y="114" width="31" height="46" rx="3" fill="url(#lh-choc)" /><rect x="282" y="119" width="21" height="36" rx="2" fill="none" stroke="#000" stroke-opacity="0.28" stroke-width="2" /><rect x="281" y="118" width="21" height="36" rx="2" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-width="1.4" /></g>
              </g>

              <!-- 7 inner snap lines between the 8 squares -->
              <line x1="65"  y1="112" x2="65"  y2="162" stroke="var(--ink)" stroke-width="1.2" opacity="0.5" />
              <line x1="100" y1="112" x2="100" y2="162" stroke="var(--ink)" stroke-width="1.2" opacity="0.5" />
              <line x1="135" y1="112" x2="135" y2="162" stroke="var(--ink)" stroke-width="1.2" opacity="0.5" />
              <line x1="170" y1="112" x2="170" y2="162" stroke="var(--ink)" stroke-width="1.2" opacity="0.5" />
              <line x1="205" y1="112" x2="205" y2="162" stroke="var(--ink)" stroke-width="1.2" opacity="0.5" />
              <line x1="240" y1="112" x2="240" y2="162" stroke="var(--ink)" stroke-width="1.2" opacity="0.5" />
              <line x1="275" y1="112" x2="275" y2="162" stroke="var(--ink)" stroke-width="1.2" opacity="0.5" />

              <!-- shared Ruler (x0=30, x1=310, y=182, n=8) -->
              <g>
                <line x1="26" y1="182" x2="314" y2="182" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" />
                <line x1="30"  y1="182" x2="30"  y2="169" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" opacity="1" />
                <line x1="65"  y1="182" x2="65"  y2="175" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.62" />
                <line x1="100" y1="182" x2="100" y2="175" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.62" />
                <line x1="135" y1="182" x2="135" y2="175" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.62" />
                <line x1="170" y1="182" x2="170" y2="175" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.62" />
                <line x1="205" y1="182" x2="205" y2="175" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.62" />
                <line x1="240" y1="182" x2="240" y2="175" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.62" />
                <line x1="275" y1="182" x2="275" y2="175" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.62" />
                <line x1="310" y1="182" x2="310" y2="169" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" opacity="1" />
                <g style="font: italic 12px var(--serif); fill: var(--ink-mute);">
                  <text x="30"  y="200" text-anchor="middle">0</text>
                  <text x="310" y="200" text-anchor="middle">1</text>
                </g>
              </g>
            </svg>
          </div>

          <!-- ScratchCanvas (BlankSlate with .mr-* classes) — free-form work surface -->
          <canvas class="mr-scratch" role="img" aria-label="scratch space for working out the problem"></canvas>
          <div class="mr-tools">
            <button type="button" class="mr-tool on" title="Pencil" aria-pressed="true">
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 15 L4 11 L12 3 L15 6 L7 14 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /><line x1="11" y1="4" x2="14" y2="7" stroke="currentColor" stroke-width="1.6" /></svg>
            </button>
            <button type="button" class="mr-tool" title="Red pen" aria-pressed="false">
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 15 L4 11 L12 3 L15 6 L7 14 Z" fill="none" stroke="var(--red)" stroke-width="1.8" stroke-linejoin="round" /></svg>
            </button>
            <button type="button" class="mr-tool" title="Eraser" aria-pressed="false">
              <svg width="18" height="18" viewBox="0 0 18 18"><rect x="3" y="9" width="9" height="6" rx="1.5" transform="rotate(-32 7 12)" fill="none" stroke="currentColor" stroke-width="1.6" /></svg>
            </button>
            <span class="mr-tool-sep"></span>
            <button type="button" class="mr-tool" title="Undo">
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M6 5 L3 8 L6 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" /><path d="M3 8 H11 a4 4 0 0 1 0 8 H7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
            </button>
            <button type="button" class="mr-tool mr-tool-clear" title="Clear all">clear</button>
          </div>
          <div class="mr-scratch-hint">scratch space — show your work here ✎</div>
        </div>

        <!-- ── RAIL (fixed rect, top-right) ── -->
        <div class="mr-s-rail">
          <div class="panel mr-asker">
            <h3>Today's Cook</h3>
            <!-- owner = kid → Portrait Kid, unsolved → mood "think" → expr "asking" -->
            <div class="mr-asker-art">
              <svg width="120" height="176" viewBox="0 0 150 220" style="display:block; overflow:visible">
                <defs>
                  <pattern id="rh-kid" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                    <rect width="6" height="6" fill="var(--red)" />
                    <line x1="0" y1="0" x2="0" y2="6" stroke="var(--red-deep)" stroke-width="1.4" opacity="0.5" />
                  </pattern>
                  <pattern id="lh-kid" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.42" />
                  </pattern>
                </defs>
                <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
                  <path d="M40 218 Q36 148 52 134 Q64 124 75 124 Q86 124 98 134 Q114 148 110 218 Z" fill="var(--paper-1)" />
                  <path d="M58 134 Q75 142 92 134 L100 218 L50 218 Z" fill="url(#rh-kid)" />
                  <path d="M98 138 Q120 124 116 104" fill="none" />
                  <path d="M52 138 Q34 160 32 184" fill="none" />
                </g>
                <circle cx="116" cy="100" r="7" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.2" />
                <circle cx="32" cy="186" r="7" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.2" />
                <circle cx="75" cy="78" r="34" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.6" />
                <path d="M96 60 A34 34 0 0 1 98 96 Q88 100 86 70 Z" fill="url(#lh-kid)" stroke="none" opacity="0.5" />
                <circle cx="60" cy="84" r="1.5" fill="var(--red-soft)" /><circle cx="66" cy="88" r="1.5" fill="var(--red-soft)" /><circle cx="84" cy="88" r="1.5" fill="var(--red-soft)" /><circle cx="90" cy="84" r="1.5" fill="var(--red-soft)" />
                <g fill="var(--ink)">
                  <circle cx="65" cy="74" r="3.2" /><circle cx="86" cy="74" r="3.2" />
                  <path d="M78 62 Q86 58 94 63" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round" />
                </g>
                <path d="M75 80 q3 5 -1 7" stroke="var(--ink)" stroke-width="1.8" fill="none" stroke-linecap="round" />
                <ellipse cx="75" cy="95" rx="5" ry="6" fill="var(--red-deep)" stroke="var(--ink)" stroke-width="2" />
                <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round">
                  <path d="M40 72 Q39 64 42 62 Q32 48 44 42 Q46 32 58 37 Q66 28 76 35 Q86 29 94 37 Q107 34 106 48 Q116 54 108 62 Q111 64 110 72 Q75 65 40 72 Z" fill="var(--paper-2)" />
                  <path d="M40 72 Q39 64 42 62 Q32 48 44 42 Q46 32 58 37 Q66 28 76 35 Q86 29 94 37 Q107 34 106 48 Q116 54 108 62 Q111 64 110 72 Q75 65 40 72 Z" fill="url(#lh-kid)" stroke="none" opacity="0.26" />
                  <path d="M41 63 Q75 56 109 63 Q110 67 110 72 Q75 65 40 72 Q40 67 41 63 Z" fill="var(--paper-3)" stroke="none" />
                  <path d="M41 63 Q75 56 109 63" stroke="var(--ink)" stroke-width="1.6" fill="none" />
                  <path d="M45 67 Q75 60 105 67" stroke="var(--red)" stroke-width="1.6" fill="none" opacity="0.85" />
                  <path d="M60 39 Q61 49 59 57 M76 36 Q73 48 75 57 M93 39 Q92 49 92 57" stroke="var(--ink)" stroke-width="1.2" fill="none" opacity="0.45" />
                </g>
              </svg>
            </div>
            <div class="mr-asker-note"><b>the Kid</b> brought this one to Babushka's counter.</div>
          </div>
          <div class="panel mr-skill-panel">
            <h3>The Skill</h3>
            <div class="hint">
              This recipe uses <b>Lesson 1 · Same Denominators</b> — add the tops, keep the bottom.
            </div>
            <div class="mr-recipe-row">
              <span class="mr-recipe-no">0/5</span>
              <span class="mr-recipe-of">skills mastered</span>
            </div>
          </div>
        </div>

        <!-- ── ANSWER CARD — write area + Check as ONE unit (bottom-left) ── -->
        <div class="mr-s-answer">
          <div class="mr-s-write">
            <div class="mr-final-label">Write your answer</div>
            <!-- plain fraction (answerType "fraction") → one frinput, two stacked cells -->
            <div class="mr-s-slate">
              <span class="frinput">
                <div class="slate slate-fraction" role="group" aria-label="your fraction answer">
                  <!-- top cell (num) — empty, autofocus placeholder ✎ -->
                  <div class="slate-slot">
                    <div class="slate-cell">
                      <canvas class="slate-canvas" role="img" aria-label="write the top digit"></canvas>
                      <span class="slate-ph" aria-hidden="true">✎</span>
                    </div>
                  </div>
                  <span class="slate-bar" style="background: var(--ink);" aria-hidden="true"></span>
                  <!-- bottom cell (den) — empty -->
                  <div class="slate-slot">
                    <div class="slate-cell">
                      <canvas class="slate-canvas" role="img" aria-label="write the bottom digit"></canvas>
                      <span class="slate-ph" aria-hidden="true"></span>
                    </div>
                  </div>
                </div>
              </span>
            </div>
            <div class="mr-s-cap"></div>
          </div>

          <div class="mr-s-marks">
            <!-- engine wall (RouteToRoom / goLearn): "Learn it" → matching room file.
                 Shown for the current recipe's skill → room-r1.html (Same Denominators). -->
            <a class="mr-wallbtn" href="room-r1.html" title="Open Lesson 1">
              ▸ Learn it: Same Denominators
            </a>
            <!-- Check (unsolved, answer not ready → base state); inert -->
            <button class="check">Check</button>
          </div>
        </div>

        <!-- ── TUTOR ZONE — speaking character + ribbon (bottom-right) ──
             KID VARIANT: the KID poses the problem here (not Mom). Portrait who="kid",
             unsolved → expr "asking"; ribbon = the problem caption, the Kid's voice.
             Kid SVG inlined verbatim from cast.jsx (expr "asking"); pattern ids
             suffixed -kid2 to stay unique vs the rail Kid. -->
        <div class="mr-s-tutor">
          <div class="cook-stage">
            <svg width="118" height="173" viewBox="0 0 150 220" style="display:block; overflow:visible" aria-hidden="true">
              <defs>
                <pattern id="rh-kid2" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill="var(--red)" />
                  <line x1="0" y1="0" x2="0" y2="6" stroke="var(--red-deep)" stroke-width="1.4" opacity="0.5" />
                </pattern>
                <pattern id="lh-kid2" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.42" />
                </pattern>
              </defs>
              <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
                <path d="M40 218 Q36 148 52 134 Q64 124 75 124 Q86 124 98 134 Q114 148 110 218 Z" fill="var(--paper-1)" />
                <path d="M58 134 Q75 142 92 134 L100 218 L50 218 Z" fill="url(#rh-kid2)" />
                <path d="M98 138 Q120 124 116 104" fill="none" />
                <path d="M52 138 Q34 160 32 184" fill="none" />
              </g>
              <circle cx="116" cy="100" r="7" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.2" />
              <circle cx="32" cy="186" r="7" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.2" />
              <circle cx="75" cy="78" r="34" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.6" />
              <path d="M96 60 A34 34 0 0 1 98 96 Q88 100 86 70 Z" fill="url(#lh-kid2)" stroke="none" opacity="0.5" />
              <circle cx="60" cy="84" r="1.5" fill="var(--red-soft)" /><circle cx="66" cy="88" r="1.5" fill="var(--red-soft)" /><circle cx="84" cy="88" r="1.5" fill="var(--red-soft)" /><circle cx="90" cy="84" r="1.5" fill="var(--red-soft)" />
              <g fill="var(--ink)">
                <circle cx="65" cy="74" r="3.2" /><circle cx="86" cy="74" r="3.2" />
                <path d="M78 62 Q86 58 94 63" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round" />
              </g>
              <path d="M75 80 q3 5 -1 7" stroke="var(--ink)" stroke-width="1.8" fill="none" stroke-linecap="round" />
              <ellipse cx="75" cy="95" rx="5" ry="6" fill="var(--red-deep)" stroke="var(--ink)" stroke-width="2" />
              <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round">
                <path d="M40 72 Q39 64 42 62 Q32 48 44 42 Q46 32 58 37 Q66 28 76 35 Q86 29 94 37 Q107 34 106 48 Q116 54 108 62 Q111 64 110 72 Q75 65 40 72 Z" fill="var(--paper-2)" />
                <path d="M40 72 Q39 64 42 62 Q32 48 44 42 Q46 32 58 37 Q66 28 76 35 Q86 29 94 37 Q107 34 106 48 Q116 54 108 62 Q111 64 110 72 Q75 65 40 72 Z" fill="url(#lh-kid2)" stroke="none" opacity="0.26" />
                <path d="M41 63 Q75 56 109 63 Q110 67 110 72 Q75 65 40 72 Q40 67 41 63 Z" fill="var(--paper-3)" stroke="none" />
                <path d="M41 63 Q75 56 109 63" stroke="var(--ink)" stroke-width="1.6" fill="none" />
                <path d="M45 67 Q75 60 105 67" stroke="var(--red)" stroke-width="1.6" fill="none" opacity="0.85" />
                <path d="M60 39 Q61 49 59 57 M76 36 Q73 48 75 57 M93 39 Q92 49 92 57" stroke="var(--ink)" stroke-width="1.2" fill="none" opacity="0.45" />
              </g>
            </svg>
          </div>
          <div class="ribbon" data-vox-speaker="kid">You snapped off three eighths of the chocolate bar, and your brother snapped off two eighths. How much of the bar is gone?</div>
        </div>
      </div>
    </div>
`,
};
