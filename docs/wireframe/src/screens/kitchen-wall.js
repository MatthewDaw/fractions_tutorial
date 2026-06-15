/* kitchen-wall — RawScreen (one-off scene). Inner-#stage markup captured
   verbatim from the original static screen. Edit shared chrome in LessonScreen
   does NOT apply here; this scene owns its full body. */
export default {
  kind: "raw",
  title: "Babushka's Kitchen · Wall (go learn)",
  route: "#/mom",
  bodyHTML: `
<div class="page momsroom" data-vox-speaker="mom">
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
        <!-- mastery pips: CURRICULUM r1, r3, r2, r4, r5 — r1+r3 mastered (done),
             r2 the current (on) recipe being assessed, rest todo → 2/5 -->
        <div class="mr-progress" aria-label="2 of 5 skills mastered">
          <span class="mr-pip done" title="Same Denominators"></span>
          <span class="mr-pip done" title="Scale One"></span>
          <span class="mr-pip on" title="Cross-Multiply"></span>
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
        <div class="goal-text" data-vox="mr_mom_goal_trays" data-vox-speaker="mom">You cut your tray into halves and Ben cut his into thirds. Babushka needs one half plus one third. How much is that altogether?</div>
      </div>

      <!-- ══ DETERMINISTIC FIXED-ZONE LAYOUT (.mr-s) ═════════════════════════ -->
      <div class="mr-s">

        <!-- ── PROP / STORY ZONE (fixed rect, top-left) ── -->
        <div class="mr-s-stage">
          <!-- quiet stage tag (mirror stage → the skill label) -->
          <div class="mr-stage-tag">
            <span class="g">Cross-Multiply</span>
          </div>

          <!-- prop: SheetCake, cuts=6, state "cut_n" (the trays recipe).
               Resolved verbatim from props.jsx SheetCake + kit.jsx AssetDefs/Ruler.
               (uid "sc" substituted for React.useId(); merge anim disabled — cut_n.) -->
          <div class="mr-stage">
            <svg viewBox="0 0 340 220" width="100%" style="display:block">
              <defs>
                <pattern id="rh-sc" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill="var(--red)" />
                  <line x1="0" y1="0" x2="0" y2="6" stroke="var(--red-deep)" stroke-width="1.4" opacity="0.5" />
                </pattern>
                <pattern id="ih-sc" patternUnits="userSpaceOnUse" width="6" height="6">
                  <rect width="6" height="6" fill="var(--paper-2)" />
                  <path d="M0 0 L6 6 M0 6 L6 0" stroke="var(--ink)" stroke-width="0.8" opacity="0.45" />
                </pattern>
                <pattern id="lh-sc" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.42" />
                </pattern>
                <pattern id="dot-sc" patternUnits="userSpaceOnUse" width="13" height="13">
                  <circle cx="6.5" cy="6.5" r="1.1" fill="var(--ink)" opacity="0.5" />
                </pattern>
                <pattern id="stip-sc" patternUnits="userSpaceOnUse" width="7" height="7">
                  <rect width="7" height="7" fill="var(--paper-2)" />
                  <circle cx="2" cy="2" r="0.8" fill="var(--ink)" opacity="0.32" />
                  <circle cx="5.5" cy="5" r="0.7" fill="var(--ink)" opacity="0.26" />
                </pattern>
                <linearGradient id="bevelT-sc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="#ffffff" stop-opacity="0.30" />
                  <stop offset="0.18" stop-color="#ffffff" stop-opacity="0" />
                  <stop offset="0.82" stop-color="#000000" stop-opacity="0" />
                  <stop offset="1" stop-color="#000000" stop-opacity="0.22" />
                </linearGradient>
              </defs>

              <!-- sponge body -->
              <rect x="30" y="112" width="280" height="53" fill="#d8bc84" stroke="var(--ink)" stroke-width="2.4" />
              <rect x="30" y="112" width="280" height="53" fill="url(#lh-sc)" opacity="0.22" />
              <!-- cream filling band -->
              <rect x="30" y="139" width="280" height="9" fill="#f4e8c6" />
              <line x1="30" y1="139" x2="310" y2="139" stroke="var(--ink)" stroke-width="1" opacity="0.45" />
              <line x1="30" y1="148" x2="310" y2="148" stroke="var(--ink)" stroke-width="1" opacity="0.45" />
              <!-- crumb speckle (26 dots) -->
              <circle cx="38" cy="122" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="91" cy="159" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="144" cy="148" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="197" cy="137" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="250" cy="126" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="303" cy="159" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="92" cy="148" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="145" cy="137" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="198" cy="126" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="251" cy="159" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="40" cy="148" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="93" cy="137" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="146" cy="126" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="199" cy="159" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="252" cy="148" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="41" cy="137" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="94" cy="126" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="147" cy="159" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="200" cy="148" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="253" cy="137" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="42" cy="126" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="95" cy="159" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="148" cy="148" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="201" cy="137" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="254" cy="126" r="1.1" fill="var(--ink)" opacity="0.3" />
              <circle cx="43" cy="159" r="1.1" fill="var(--ink)" opacity="0.3" />

              <!-- chocolate frosting top with drip edge -->
              <path d="M30 98 Q50 93 70 98 Q90 97 110 98 Q130 93 150 98 Q170 97 190 98 Q210 93 230 98 Q250 97 270 98 Q290 93 310 98 L310 114 Q294.44 119 278.89 114 Q263.33 129 247.78 114 Q232.22 121 216.67 114 Q201.11 133 185.56 114 Q170 123 154.44 114 Q138.89 127 123.33 114 Q107.78 120 92.22 114 Q76.67 131 61.11 114 Q45.56 121 30 114 Z"
                fill="#5a3a22" stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" />
              <path d="M30 98 Q50 93 70 98 Q90 97 110 98 Q130 93 150 98 Q170 97 190 98 Q210 93 230 98 Q250 97 270 98 Q290 93 310 98 L310 114 Q294.44 119 278.89 114 Q263.33 129 247.78 114 Q232.22 121 216.67 114 Q201.11 133 185.56 114 Q170 123 154.44 114 Q138.89 127 123.33 114 Q107.78 120 92.22 114 Q76.67 131 61.11 114 Q45.56 121 30 114 Z"
                fill="url(#lh-sc)" opacity="0.35" />
              <path d="M46 99 Q108.4 94 170 99" stroke="#fff" stroke-width="2" fill="none" opacity="0.22" stroke-linecap="round" />

              <!-- 6 frosting toppers (cherries at i=1,4) -->
              <g>
                <circle cx="56" cy="89" r="7.5" fill="#5a3a22" stroke="var(--ink)" stroke-width="1.8" />
                <path d="M51.5 89 Q56 84 60.5 89" stroke="#f4e8c6" stroke-width="1.5" fill="none" opacity="0.65" />
              </g>
              <g>
                <circle cx="101.6" cy="89" r="6" fill="var(--red)" stroke="var(--red-deep)" stroke-width="1.8" />
                <circle cx="99.6" cy="87" r="1.4" fill="var(--paper-1)" opacity="0.6" />
                <path d="M101.6 83 q3 -6 7 -7" stroke="var(--ink)" stroke-width="1.5" fill="none" stroke-linecap="round" />
              </g>
              <g>
                <circle cx="147.2" cy="89" r="7.5" fill="#5a3a22" stroke="var(--ink)" stroke-width="1.8" />
                <path d="M142.7 89 Q147.2 84 151.7 89" stroke="#f4e8c6" stroke-width="1.5" fill="none" opacity="0.65" />
              </g>
              <g>
                <circle cx="192.8" cy="89" r="7.5" fill="#5a3a22" stroke="var(--ink)" stroke-width="1.8" />
                <path d="M188.3 89 Q192.8 84 197.3 89" stroke="#f4e8c6" stroke-width="1.5" fill="none" opacity="0.65" />
              </g>
              <g>
                <circle cx="238.4" cy="89" r="6" fill="var(--red)" stroke="var(--red-deep)" stroke-width="1.8" />
                <circle cx="236.4" cy="87" r="1.4" fill="var(--paper-1)" opacity="0.6" />
                <path d="M238.4 83 q3 -6 7 -7" stroke="var(--ink)" stroke-width="1.5" fill="none" stroke-linecap="round" />
              </g>
              <g>
                <circle cx="284" cy="89" r="7.5" fill="#5a3a22" stroke="var(--ink)" stroke-width="1.8" />
                <path d="M279.5 89 Q284 84 288.5 89" stroke="#f4e8c6" stroke-width="1.5" fill="none" opacity="0.65" />
              </g>

              <!-- 5 cut lines (n=6, state cut_n → dashed, no merge) -->
              <line x1="76.67"  y1="86" x2="76.67"  y2="165" stroke="var(--ink)" stroke-width="1.8" stroke-dasharray="4 3" opacity="0.8" />
              <line x1="123.33" y1="86" x2="123.33" y2="165" stroke="var(--ink)" stroke-width="1.8" stroke-dasharray="4 3" opacity="0.8" />
              <line x1="170"    y1="86" x2="170"    y2="165" stroke="var(--ink)" stroke-width="1.8" stroke-dasharray="4 3" opacity="0.8" />
              <line x1="216.67" y1="86" x2="216.67" y2="165" stroke="var(--ink)" stroke-width="1.8" stroke-dasharray="4 3" opacity="0.8" />
              <line x1="263.33" y1="86" x2="263.33" y2="165" stroke="var(--ink)" stroke-width="1.8" stroke-dasharray="4 3" opacity="0.8" />

              <!-- shared Ruler (x0=30, x1=310, y=182, n=6, labels) -->
              <g>
                <line x1="26" y1="182" x2="314" y2="182" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" />
                <line x1="30"     y1="182" x2="30"     y2="169" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" opacity="1" />
                <line x1="76.67"  y1="182" x2="76.67"  y2="175" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.62" />
                <line x1="123.33" y1="182" x2="123.33" y2="175" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.62" />
                <line x1="170"    y1="182" x2="170"    y2="175" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.62" />
                <line x1="216.67" y1="182" x2="216.67" y2="175" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.62" />
                <line x1="263.33" y1="182" x2="263.33" y2="175" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.62" />
                <line x1="310"    y1="182" x2="310"    y2="169" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" opacity="1" />
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
            <!-- skill = ROOM_SKILL.r2 (Lesson 3 · Cross-Multiply) -->
            <div class="hint">
              This recipe uses <b>Lesson 3 · Cross-Multiply</b> — rename both to a shared bottom.
            </div>
            <div class="mr-recipe-row">
              <span class="mr-recipe-no">2/5</span>
              <span class="mr-recipe-of">skills mastered</span>
            </div>
          </div>
        </div>

        <!-- ── ANSWER CARD — write area + Check as ONE unit (bottom-left) ── -->
        <div class="mr-s-answer">
          <div class="mr-s-write">
            <div class="mr-final-label">Write your answer</div>
            <!-- plain fraction (answerType "fraction") → one frinput, two stacked cells.
                 Unsolved + wall; the wrong answer that raised the wall is still in the
                 cells (child added across: ½ + ⅓ → 2/5). -->
            <div class="mr-s-slate">
              <span class="frinput">
                <div class="slate slate-fraction" role="group" aria-label="your fraction answer">
                  <!-- top cell (num) — committed handwritten digit (no canvas while committed) -->
                  <div class="slate-slot is-committed">
                    <div class="slate-cell committed">
                      <button type="button" class="slate-committed-digit" title="Tap to rewrite">2</button>
                    </div>
                  </div>
                  <span class="slate-bar" style="background: var(--ink);" aria-hidden="true"></span>
                  <!-- bottom cell (den) — committed -->
                  <div class="slate-slot is-committed">
                    <div class="slate-cell committed">
                      <button type="button" class="slate-committed-digit" title="Tap to rewrite">5</button>
                    </div>
                  </div>
                </div>
              </span>
            </div>
            <div class="mr-s-cap"></div>
          </div>

          <div class="mr-s-marks">
            <!-- ENGINE WALL (decision RouteToRoom / goLearn): the REAL .mr-wallbtn.
                 wall && !solved && wallSkill → shown. wallSkill = ROOM_SKILL.r2
                 (Lesson 3 · Cross-Multiply); goLearn routes to NODE_TO_ROOM →
                 room-r2.html. This is the "go learn this recipe first" invite. -->
            <a class="mr-wallbtn" href="room-r2.html" title="Open Lesson 3">
              ▸ Learn it: Cross-Multiply
            </a>
            <!-- Check stays (the "stay / try again" affordance — re-tap to re-check;
                 unsolved & not answerReady → plain base state, no .ready/.done) -->
            <button class="check">Check</button>
          </div>
        </div>

        <!-- ── TUTOR ZONE — speaking character + ribbon (bottom-right) ── -->
        <div class="mr-s-tutor">
          <!-- bubble.who = "mom", mood "think" (wrong answer) → Mom expr "think" -->
          <div class="cook-stage">
            <svg width="118" height="156" viewBox="0 0 196 260" style="display:block; overflow:visible" aria-hidden="true">
              <defs>
                <pattern id="mom-hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.5" />
                </pattern>
                <pattern id="mom-dots" patternUnits="userSpaceOnUse" width="16" height="16">
                  <circle cx="4" cy="4" r="1.9" fill="var(--paper-1)" opacity="0.9" />
                  <circle cx="12" cy="12" r="1.9" fill="var(--paper-1)" opacity="0.9" />
                </pattern>
              </defs>

              <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
                <path d="M34 258 Q30 198 56 174 Q72 160 98 160 Q124 160 140 174 Q166 198 162 258 Z" fill="var(--paper-1)" />
                <path d="M34 258 Q30 206 50 182 L66 258 Z" fill="url(#mom-hatch)" stroke="none" opacity="0.6" />
                <path d="M72 176 Q98 186 124 176 L136 258 L60 258 Z" fill="var(--red)" />
                <path d="M72 176 Q98 186 124 176 L136 258 L60 258 Z" fill="url(#mom-dots)" stroke="none" />
                <path d="M66 192 Q98 202 130 192" fill="none" stroke="var(--red-deep)" stroke-width="3" />
                <path d="M84 224 h28 v18 h-28 Z" fill="none" stroke="var(--red-deep)" stroke-width="1.8" opacity="0.7" />
                <path d="M56 182 Q42 206 60 226" fill="none" />
                <path d="M140 182 Q154 206 136 226" fill="none" />
              </g>

              <rect x="86" y="140" width="24" height="22" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.4" />
              <path d="M80 150 L98 164 L116 150" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round" />
              <circle cx="98" cy="162" r="2.6" fill="var(--red)" stroke="var(--ink)" stroke-width="1.2" />

              <g stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round">
                <path d="M50 96 Q46 44 98 38 Q150 44 146 96 Q150 132 122 142 L128 154 Q98 162 68 154 L74 142 Q46 132 50 96 Z" fill="var(--red)" />
                <path d="M50 96 Q46 44 98 38 Q150 44 146 96 Q150 132 122 142 L128 154 Q98 162 68 154 L74 142 Q46 132 50 96 Z" fill="url(#mom-dots)" stroke="none" />
                <path d="M90 150 Q98 142 106 150 Q98 160 90 150 Z" fill="var(--red-deep)" />
                <path d="M58 78 Q98 62 138 78" fill="none" stroke="var(--red-deep)" stroke-width="2.6" />
              </g>

              <g fill="#5a3a26" stroke="var(--ink)" stroke-width="1.4">
                <path d="M64 80 Q72 72 80 80 Q76 84 70 84 Q66 84 64 80 Z" />
                <path d="M116 80 Q124 72 132 80 Q128 84 122 84 Q118 84 116 80 Z" />
              </g>

              <circle cx="98" cy="96" r="38" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.6" />
              <path d="M120 82 A38 38 0 0 1 122 120 Q112 122 110 100 Z" fill="url(#mom-hatch)" stroke="none" opacity="0.5" />

              <g stroke="var(--ink)" stroke-width="1.4" fill="var(--red)">
                <circle cx="60" cy="118" r="3" />
                <circle cx="136" cy="118" r="3" />
              </g>

              <circle cx="74" cy="104" r="7.5" fill="var(--red-soft)" opacity="0.7" />
              <circle cx="122" cy="104" r="7.5" fill="var(--red-soft)" opacity="0.7" />

              <!-- think eyes (Mom expr "think": raised, considering brow + soft gaze) -->
              <g stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round">
                <circle cx="84" cy="92" r="3.4" fill="var(--ink)" stroke="none" />
                <circle cx="112" cy="92" r="3.4" fill="var(--ink)" stroke="none" />
                <path d="M77 84 Q84 80 91 83" fill="none" />
                <path d="M105 83 Q112 80 119 84" fill="none" />
              </g>

              <path d="M98 96 Q102 103 97 105" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round" />

              <!-- think mouth (small pursed, considering) -->
              <path d="M90 114 Q98 111 106 114" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" />

              <!-- steam (idle/think) -->
              <g stroke="var(--red-deep)" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.65">
                <path d="M84 194 Q80 186 84 180 Q88 174 84 168" />
                <path d="M112 194 Q116 186 112 180 Q108 174 112 168" />
              </g>

              <!-- the loaf -->
              <ellipse cx="98" cy="214" rx="40" ry="26" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.6" />
              <ellipse cx="98" cy="214" rx="40" ry="26" fill="url(#mom-hatch)" stroke="none" opacity="0.32" />
              <g stroke="var(--red-deep)" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.7">
                <path d="M80 206 Q98 198 116 206" />
                <path d="M84 215 Q98 208 112 215" />
              </g>

              <!-- both hands cupping the loaf -->
              <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round">
                <path d="M50 230 Q50 218 64 221 Q78 224 75 234 Q72 243 60 242 Q51 240 50 230 Z" fill="var(--paper-1)" />
                <path d="M146 230 Q146 218 132 221 Q118 224 121 234 Q124 243 136 242 Q145 240 146 230 Z" fill="var(--paper-1)" />
                <path d="M57 226 q7 1 10 6 M61 231 q6 1 9 6" fill="none" stroke-width="1.3" opacity="0.5" />
                <path d="M139 226 q-7 1 -10 6 M135 231 q-6 1 -9 6" fill="none" stroke-width="1.3" opacity="0.5" />
              </g>
            </svg>
          </div>
          <!-- ribbon tone "warn" (the wrong-answer nudge that raised the wall:
               mr_mom_nudge_cross). The wall invite itself reads on the .mr-wallbtn. -->
          <div class="ribbon warn" data-vox-speaker="mom">Neither bottom fits the other — rename both fractions to a shared bottom, then add.</div>
        </div>
      </div>
    </div>
`,
};
