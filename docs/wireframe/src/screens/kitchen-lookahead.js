/* kitchen-lookahead — RawScreen (one-off scene). Inner-#stage markup captured
   verbatim from the original static screen. Edit shared chrome in LessonScreen
   does NOT apply here; this scene owns its full body. */
export default {
  kind: "raw",
  title: "Babushka's Kitchen · Lookahead",
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
        <!-- mastery pips: CURRICULUM r1, r3, r2, r4, r5 — r3 active (skillRoom===r3 → on), 0 mastered -->
        <div class="mr-progress" aria-label="0 of 5 skills mastered">
          <span class="mr-pip" title="Same Denominators"></span>
          <span class="mr-pip on" title="Scale One"></span>
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

      <!-- ══ GOAL BAND — the look-ahead word problem IS the question ══════════ -->
      <div class="goal mr-goal-primary">
        <button class="speaker">
          <svg width="16" height="14" viewBox="0 0 16 14"><path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)" /><path d="M11 4 Q14 7 11 10" stroke="var(--red)" stroke-width="1.4" fill="none" /></svg>
          Read aloud
        </button>
        <div class="goal-text" data-vox="mr_mom_goal_doughbacon" data-vox-speaker="mom">Grandpa has half a strip of dough and one fourth of a strip of bacon. Laid end to end on the ruler, how much is that altogether?</div>
      </div>

      <!-- ══ DETERMINISTIC FIXED-ZONE LAYOUT (.mr-s) ═════════════════════════ -->
      <div class="mr-s">

        <!-- ── PROP / STORY ZONE (fixed rect, top-left) ── -->
        <div class="mr-s-stage">
          <!-- look-ahead → mr-stage-tag carries .mr-peek (red-outlined "sneak peek" chip) -->
          <div class="mr-stage-tag mr-peek">
            <span class="g">sneak peek</span>
          </div>

          <!-- prop: DoughBacon, state "sliced" — dough strip (stippled) over bacon
               strip (red, streaked); each cut into n=4 segments (seg=67, gap=4),
               x = 30 + i*71. Ruler n=6. -->
          <div class="mr-stage">
            <svg viewBox="0 0 340 220" width="100%" style="display:block">
              <defs>
                <pattern id="rh-db" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill="var(--red)" />
                  <line x1="0" y1="0" x2="0" y2="6" stroke="var(--red-deep)" stroke-width="1.4" opacity="0.5" />
                </pattern>
                <pattern id="stip-db" patternUnits="userSpaceOnUse" width="7" height="7">
                  <rect width="7" height="7" fill="var(--paper-2)" />
                  <circle cx="2" cy="2" r="0.8" fill="var(--ink)" opacity="0.32" />
                  <circle cx="5.5" cy="5" r="0.7" fill="var(--ink)" opacity="0.26" />
                </pattern>
              </defs>

              <!-- DOUGH strip (top, y=92) — sliced into 4 segments -->
              <g>
                <g><rect x="30"  y="92" width="67" height="30" rx="4" fill="url(#stip-db)" stroke="var(--ink)" stroke-width="2.4" /></g>
                <g><rect x="101" y="92" width="67" height="30" rx="4" fill="url(#stip-db)" stroke="var(--ink)" stroke-width="2.4" /></g>
                <g><rect x="172" y="92" width="67" height="30" rx="4" fill="url(#stip-db)" stroke="var(--ink)" stroke-width="2.4" /></g>
                <g><rect x="243" y="92" width="67" height="30" rx="4" fill="url(#stip-db)" stroke="var(--ink)" stroke-width="2.4" /></g>
              </g>

              <!-- BACON strip (bottom, y=132) — sliced into 4 segments, with streaks -->
              <g>
                <g>
                  <rect x="30" y="132" width="67" height="30" rx="4" fill="var(--red)" stroke="var(--red-deep)" stroke-width="2.4" />
                  <path d="M30 141.6 q16.75 -6 33.5 0 t33.5 0" fill="none" stroke="var(--paper-1)" stroke-width="3.4" opacity="0.8" stroke-linecap="round" />
                  <path d="M30 150 q16.75 6 33.5 0 t33.5 0" fill="none" stroke="var(--paper-1)" stroke-width="3.4" opacity="0.8" stroke-linecap="round" />
                  <path d="M30 157.2 q16.75 -6 33.5 0 t33.5 0" fill="none" stroke="var(--paper-1)" stroke-width="3.4" opacity="0.8" stroke-linecap="round" />
                </g>
                <g>
                  <rect x="101" y="132" width="67" height="30" rx="4" fill="var(--red)" stroke="var(--red-deep)" stroke-width="2.4" />
                  <path d="M101 141.6 q16.75 -6 33.5 0 t33.5 0" fill="none" stroke="var(--paper-1)" stroke-width="3.4" opacity="0.8" stroke-linecap="round" />
                  <path d="M101 150 q16.75 6 33.5 0 t33.5 0" fill="none" stroke="var(--paper-1)" stroke-width="3.4" opacity="0.8" stroke-linecap="round" />
                  <path d="M101 157.2 q16.75 -6 33.5 0 t33.5 0" fill="none" stroke="var(--paper-1)" stroke-width="3.4" opacity="0.8" stroke-linecap="round" />
                </g>
                <g>
                  <rect x="172" y="132" width="67" height="30" rx="4" fill="var(--red)" stroke="var(--red-deep)" stroke-width="2.4" />
                  <path d="M172 141.6 q16.75 -6 33.5 0 t33.5 0" fill="none" stroke="var(--paper-1)" stroke-width="3.4" opacity="0.8" stroke-linecap="round" />
                  <path d="M172 150 q16.75 6 33.5 0 t33.5 0" fill="none" stroke="var(--paper-1)" stroke-width="3.4" opacity="0.8" stroke-linecap="round" />
                  <path d="M172 157.2 q16.75 -6 33.5 0 t33.5 0" fill="none" stroke="var(--paper-1)" stroke-width="3.4" opacity="0.8" stroke-linecap="round" />
                </g>
                <g>
                  <rect x="243" y="132" width="67" height="30" rx="4" fill="var(--red)" stroke="var(--red-deep)" stroke-width="2.4" />
                  <path d="M243 141.6 q16.75 -6 33.5 0 t33.5 0" fill="none" stroke="var(--paper-1)" stroke-width="3.4" opacity="0.8" stroke-linecap="round" />
                  <path d="M243 150 q16.75 6 33.5 0 t33.5 0" fill="none" stroke="var(--paper-1)" stroke-width="3.4" opacity="0.8" stroke-linecap="round" />
                  <path d="M243 157.2 q16.75 -6 33.5 0 t33.5 0" fill="none" stroke="var(--paper-1)" stroke-width="3.4" opacity="0.8" stroke-linecap="round" />
                </g>
              </g>

              <!-- shared Ruler (x0=30, x1=310, y=182, n=6) -->
              <g>
                <line x1="26" y1="182" x2="314" y2="182" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" />
                <line x1="30"  y1="182" x2="30"  y2="169" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" opacity="1" />
                <line x1="77"  y1="182" x2="77"  y2="175" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.62" />
                <line x1="123" y1="182" x2="123" y2="175" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.62" />
                <line x1="170" y1="182" x2="170" y2="175" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.62" />
                <line x1="217" y1="182" x2="217" y2="175" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.62" />
                <line x1="263" y1="182" x2="263" y2="175" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.62" />
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
            <!-- owner = grandpa → Portrait Grandpa; mood "happy" (probe solved on skip path) → expr "happy" -->
            <div class="mr-asker-art">
              <svg width="120" height="176" viewBox="0 0 150 220" style="display:block; overflow:visible">
                <defs>
                  <pattern id="lh-gp" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.42" />
                  </pattern>
                </defs>
                <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
                  <path d="M38 218 Q36 136 56 126 Q66 120 75 120 Q84 120 94 126 Q114 136 112 218 Z" fill="var(--paper-1)" />
                  <path d="M52 128 Q42 158 40 186" fill="none" />
                  <path d="M98 128 Q108 158 110 186" fill="none" />
                </g>
                <g stroke="var(--red-deep)" stroke-width="6" fill="none" stroke-linecap="round">
                  <path d="M62 128 L60 218" /><path d="M88 128 L90 218" />
                </g>
                <circle cx="38" cy="188" r="7" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.2" />
                <circle cx="112" cy="188" r="7" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.2" />
                <circle cx="75" cy="76" r="35" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.6" />
                <path d="M98 58 A35 35 0 0 1 99 96 Q90 100 88 70 Z" fill="url(#lh-gp)" stroke="none" opacity="0.5" />
                <path d="M54 56 Q44 53 41 61 Q32 60 33 70 Q27 73 32 81 Q31 90 41 88 Q49 86 50 77 Q48 67 54 60 Z" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round" />
                <path d="M40 64 q2 9 0 18 M46 62 q1 9 0 17" stroke="var(--ink)" stroke-width="1.2" fill="none" opacity="0.5" stroke-linecap="round" />
                <path d="M96 56 Q106 53 109 61 Q118 60 117 70 Q123 73 118 81 Q119 90 109 88 Q101 86 100 77 Q102 67 96 60 Z" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round" />
                <path d="M110 64 q-2 9 0 18 M104 62 q-1 9 0 17" stroke="var(--ink)" stroke-width="1.2" fill="none" opacity="0.5" stroke-linecap="round" />
                <g stroke="var(--ink)" stroke-width="2.2" fill="none">
                  <circle cx="62" cy="72" r="11" fill="var(--paper-1)" fill-opacity="0.4" />
                  <circle cx="88" cy="72" r="11" fill="var(--paper-1)" fill-opacity="0.4" />
                  <line x1="73" y1="72" x2="77" y2="72" />
                </g>
                <!-- happy eyes -->
                <g stroke="var(--ink)" stroke-width="2.2" fill="none" stroke-linecap="round">
                  <path d="M56 73 Q62 68 68 73" /><path d="M82 73 Q88 68 94 73" />
                </g>
                <!-- moustache -->
                <path d="M54 96 Q62 90 75 94 Q88 90 96 96 Q90 106 75 102 Q60 106 54 96 Z" fill="var(--ink-soft)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
                <path d="M54 96 Q62 90 75 94 Q88 90 96 96 Q90 106 75 102 Q60 106 54 96 Z" fill="url(#lh-gp)" stroke="none" opacity="0.6" />
                <!-- happy mouth -->
                <path d="M64 104 Q75 114 86 104" stroke="var(--red-deep)" stroke-width="2.6" fill="none" stroke-linecap="round" />
                <!-- happy spark -->
                <g stroke="var(--red)" stroke-width="2" stroke-linecap="round">
                  <line x1="118" y1="44" x2="118" y2="54" /><line x1="113" y1="49" x2="123" y2="49" />
                </g>
              </svg>
            </div>
            <div class="mr-asker-note"><b>Grandpa</b> brought this one to Babushka's counter.</div>
          </div>
          <div class="panel mr-skill-panel">
            <h3>The Skill</h3>
            <!-- isLook branch copy -->
            <div class="hint">
              <b>Sneak peek:</b> this is from the next lesson — <b>Scale One</b>. Nail it and you can skip that room!
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
            <!-- probe SOLVED → Slate disabled with both digits committed. A committed
                 cell renders a <button class="slate-committed-digit"> over a
                 .slate-cell.committed inside .slate-slot.is-committed.is-disabled; the
                 root .slate-fraction also carries .is-disabled. layout="fraction",
                 den=4 → bar color = denomColor(4) = #0a9396 (fourths teal). -->
            <div class="mr-s-slate">
              <span class="frinput">
                <div class="slate slate-fraction is-disabled" role="group" aria-label="your fraction answer">
                  <!-- top cell (num) = committed 3 -->
                  <div class="slate-slot is-committed is-disabled">
                    <div class="slate-cell committed">
                      <button type="button" class="slate-committed-digit" title="Tap to rewrite" disabled>3</button>
                    </div>
                  </div>
                  <span class="slate-bar" style="background: #0a9396;" aria-hidden="true"></span>
                  <!-- bottom cell (den) = committed 4 -->
                  <div class="slate-slot is-committed is-disabled">
                    <div class="slate-cell committed">
                      <button type="button" class="slate-committed-digit" title="Tap to rewrite" disabled>4</button>
                    </div>
                  </div>
                </div>
              </span>
            </div>
            <!-- solved caption: \`that's \${targetLabel(q)}\` → targetLabel([3,4]) = "3/4" -->
            <div class="mr-s-cap">that's 3/4</div>
          </div>

          <div class="mr-s-marks">
            <!-- probe solved with stars>0 → Rosette: a flex row of 3 engraved stars
                 (count filled). Real markup = <div style="display:flex;gap:6"> with one
                 <svg viewBox="0 0 24 24"> per star. Here count=3 (all filled). -->
            <div style="display:flex; gap:6px;">
              <svg width="30" height="30" viewBox="0 0 24 24" style="display:block"><path d="M12 2.6 L14.7 9.2 L21.8 9.7 L16.3 14.2 L18.1 21.1 L12 17.2 L5.9 21.1 L7.7 14.2 L2.2 9.7 L9.3 9.2 Z" fill="var(--red)" stroke="var(--red-deep)" stroke-width="1.4" stroke-linejoin="round" opacity="1" /></svg>
              <svg width="30" height="30" viewBox="0 0 24 24" style="display:block"><path d="M12 2.6 L14.7 9.2 L21.8 9.7 L16.3 14.2 L18.1 21.1 L12 17.2 L5.9 21.1 L7.7 14.2 L2.2 9.7 L9.3 9.2 Z" fill="var(--red)" stroke="var(--red-deep)" stroke-width="1.4" stroke-linejoin="round" opacity="1" /></svg>
              <svg width="30" height="30" viewBox="0 0 24 24" style="display:block"><path d="M12 2.6 L14.7 9.2 L21.8 9.7 L16.3 14.2 L18.1 21.1 L12 17.2 L5.9 21.1 L7.7 14.2 L2.2 9.7 L9.3 9.2 Z" fill="var(--red)" stroke="var(--red-deep)" stroke-width="1.4" stroke-linejoin="round" opacity="1" /></svg>
            </div>
            <!-- THE SKIP / NOT-YET CONTROL — solved look-ahead: the single Check button
                 flips to "check done" with label "Continue ▸". On the 'skip' outcome
                 (shown) it returns to a normal problem AND marks Scale One mastered;
                 on 'notyet' it just returns. Either way → kitchen.html. -->
            <a class="check done" href="kitchen.html" title="Continue">Continue ▸</a>
          </div>
        </div>

        <!-- ── TUTOR ZONE — speaking character + ribbon (bottom-right) ── -->
        <!-- SKIP outcome (shown): bubble.who="mom", mood "happy" → Mom expr "cheer";
             ribbon = LINES.mr_mom_skip.
             NOT-YET variant: bubble.who="mom", mood "think" → Mom expr "think";
             ribbon text = "Not yet — but that one is the next lesson. Let us go and
             learn it together!" (LINES.mr_mom_notyet). Same Continue ▸ control. -->
        <div class="mr-s-tutor">
          <!-- Mom expr "cheer" (happy skip mood) — verbatim from Mom.jsx cheer branch -->
          <div class="cook-stage">
            <svg width="118" height="156" viewBox="0 0 196 260" style="display:block; overflow:visible" aria-hidden="true">
              <defs>
                <pattern id="mom-hatch-l" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.5" />
                </pattern>
                <pattern id="mom-dots-l" patternUnits="userSpaceOnUse" width="16" height="16">
                  <circle cx="4" cy="4" r="1.9" fill="var(--paper-1)" opacity="0.9" />
                  <circle cx="12" cy="12" r="1.9" fill="var(--paper-1)" opacity="0.9" />
                </pattern>
              </defs>

              <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
                <path d="M34 258 Q30 198 56 174 Q72 160 98 160 Q124 160 140 174 Q166 198 162 258 Z" fill="var(--paper-1)" />
                <path d="M34 258 Q30 206 50 182 L66 258 Z" fill="url(#mom-hatch-l)" stroke="none" opacity="0.6" />
                <path d="M72 176 Q98 186 124 176 L136 258 L60 258 Z" fill="var(--red)" />
                <path d="M72 176 Q98 186 124 176 L136 258 L60 258 Z" fill="url(#mom-dots-l)" stroke="none" />
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
                <path d="M50 96 Q46 44 98 38 Q150 44 146 96 Q150 132 122 142 L128 154 Q98 162 68 154 L74 142 Q46 132 50 96 Z" fill="url(#mom-dots-l)" stroke="none" />
                <path d="M90 150 Q98 142 106 150 Q98 160 90 150 Z" fill="var(--red-deep)" />
                <path d="M58 78 Q98 62 138 78" fill="none" stroke="var(--red-deep)" stroke-width="2.6" />
              </g>

              <g fill="#5a3a26" stroke="var(--ink)" stroke-width="1.4">
                <path d="M64 80 Q72 72 80 80 Q76 84 70 84 Q66 84 64 80 Z" />
                <path d="M116 80 Q124 72 132 80 Q128 84 122 84 Q118 84 116 80 Z" />
              </g>

              <circle cx="98" cy="96" r="38" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.6" />
              <path d="M120 82 A38 38 0 0 1 122 120 Q112 122 110 100 Z" fill="url(#mom-hatch-l)" stroke="none" opacity="0.5" />

              <g stroke="var(--ink)" stroke-width="1.4" fill="var(--red)">
                <circle cx="60" cy="118" r="3" />
                <circle cx="136" cy="118" r="3" />
              </g>

              <circle cx="74" cy="104" r="7.5" fill="var(--red-soft)" opacity="0.7" />
              <circle cx="122" cy="104" r="7.5" fill="var(--red-soft)" opacity="0.7" />

              <!-- cheer eyes -->
              <g stroke="var(--ink)" stroke-width="2.6" fill="none" stroke-linecap="round">
                <path d="M76 90 Q83 82 90 90" />
                <path d="M106 90 Q113 82 120 90" />
              </g>

              <path d="M98 96 Q102 103 97 105" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round" />

              <!-- cheer mouth -->
              <path d="M82 112 Q98 130 116 112 Q108 122 98 122 Q88 122 82 112 Z" fill="var(--red-deep)" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round" />

              <!-- cheer steam -->
              <g stroke="var(--red-deep)" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.65">
                <path d="M84 190 Q78 180 84 172 Q90 164 84 156" />
                <path d="M112 190 Q118 180 112 172 Q106 164 112 156" />
              </g>

              <!-- the loaf -->
              <ellipse cx="98" cy="214" rx="40" ry="26" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.6" />
              <ellipse cx="98" cy="214" rx="40" ry="26" fill="url(#mom-hatch-l)" stroke="none" opacity="0.32" />
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

              <!-- cheer sparkles -->
              <g stroke="var(--red)" stroke-width="2.2" stroke-linecap="round">
                <line x1="40" y1="70" x2="40" y2="82" /><line x1="34" y1="76" x2="46" y2="76" />
                <line x1="158" y1="92" x2="158" y2="104" /><line x1="152" y1="98" x2="164" y2="98" />
              </g>
            </svg>
          </div>
          <!-- ribbon = LINES.mr_mom_skip (the 'skip' outcome) -->
          <div class="ribbon" data-vox-speaker="mom">Look at you! You already know the next lesson. Let us skip right ahead!</div>
        </div>
      </div>
    </div>
`,
};
