/* kitchen-done — RawScreen (one-off scene). Inner-#stage markup captured
   verbatim from the original static screen. Edit shared chrome in LessonScreen
   does NOT apply here; this scene owns its full body. */
export default {
  kind: "raw",
  title: "Babushka's Kitchen",
  route: "All Done · #/mom",
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
        <!-- mastery pips: CURRICULUM r1, r3, r2, r4, r5 — ALL done, none \`on\` -->
        <div class="mr-progress" aria-label="5 of 5 skills mastered">
          <span class="mr-pip done" title="Same Denominators"></span>
          <span class="mr-pip done" title="Scale One"></span>
          <span class="mr-pip done" title="Cross-Multiply"></span>
          <span class="mr-pip done" title="Simplify"></span>
          <span class="mr-pip done" title="Mixed Numbers"></span>
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

      <!-- ══ GOAL BAND — q is null → JSX fallback string, speaker disabled ════ -->
      <div class="goal mr-goal-primary">
        <button class="speaker" disabled>
          <svg width="16" height="14" viewBox="0 0 16 14"><path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)" /><path d="M11 4 Q14 7 11 10" stroke="var(--red)" stroke-width="1.4" fill="none" /></svg>
          Read aloud
        </button>
        <div class="goal-text" data-vox="mr_mom_finale" data-vox-speaker="mom">Every recipe, solved! You are the smartest cook in this whole kitchen.</div>
      </div>

      <!-- ══ DETERMINISTIC FIXED-ZONE LAYOUT (.mr-s) ═════════════════════════ -->
      <div class="mr-s">

        <!-- ── PROP / STORY ZONE (fixed rect, top-left) — done finale ── -->
        <div class="mr-s-stage">
          <!-- q null: no .mr-stage-tag, no <Prop>, no <ScratchCanvas>. -->
          <!-- {done && …} → the celebration block -->
          <div class="mr-finale">
            <div class="mr-finale-art">
              <!-- <Mom expr="cheer" width={150} /> -->
              <svg width="150" height="198.97959183673466" viewBox="0 0 196 260" style="display:block; overflow:visible" aria-hidden="true">
                <defs>
                  <pattern id="mom-hatch-a" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.5" />
                  </pattern>
                  <pattern id="mom-dots-a" patternUnits="userSpaceOnUse" width="16" height="16">
                    <circle cx="4" cy="4" r="1.9" fill="var(--paper-1)" opacity="0.9" />
                    <circle cx="12" cy="12" r="1.9" fill="var(--paper-1)" opacity="0.9" />
                  </pattern>
                </defs>

                <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
                  <path d="M34 258 Q30 198 56 174 Q72 160 98 160 Q124 160 140 174 Q166 198 162 258 Z" fill="var(--paper-1)" />
                  <path d="M34 258 Q30 206 50 182 L66 258 Z" fill="url(#mom-hatch-a)" stroke="none" opacity="0.6" />
                  <path d="M72 176 Q98 186 124 176 L136 258 L60 258 Z" fill="var(--red)" />
                  <path d="M72 176 Q98 186 124 176 L136 258 L60 258 Z" fill="url(#mom-dots-a)" stroke="none" />
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
                  <path d="M50 96 Q46 44 98 38 Q150 44 146 96 Q150 132 122 142 L128 154 Q98 162 68 154 L74 142 Q46 132 50 96 Z" fill="url(#mom-dots-a)" stroke="none" />
                  <path d="M90 150 Q98 142 106 150 Q98 160 90 150 Z" fill="var(--red-deep)" />
                  <path d="M58 78 Q98 62 138 78" fill="none" stroke="var(--red-deep)" stroke-width="2.6" />
                </g>

                <g fill="#5a3a26" stroke="var(--ink)" stroke-width="1.4">
                  <path d="M64 80 Q72 72 80 80 Q76 84 70 84 Q66 84 64 80 Z" />
                  <path d="M116 80 Q124 72 132 80 Q128 84 122 84 Q118 84 116 80 Z" />
                </g>

                <circle cx="98" cy="96" r="38" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.6" />
                <path d="M120 82 A38 38 0 0 1 122 120 Q112 122 110 100 Z" fill="url(#mom-hatch-a)" stroke="none" opacity="0.5" />

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

                <!-- steam (cheer) -->
                <g stroke="var(--red-deep)" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.65">
                  <path d="M84 190 Q78 180 84 172 Q90 164 84 156" />
                  <path d="M112 190 Q118 180 112 172 Q106 164 112 156" />
                </g>

                <!-- the loaf -->
                <ellipse cx="98" cy="214" rx="40" ry="26" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.6" />
                <ellipse cx="98" cy="214" rx="40" ry="26" fill="url(#mom-hatch-a)" stroke="none" opacity="0.32" />
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

                <!-- sparkles (cheer) -->
                <g stroke="var(--red)" stroke-width="2.2" stroke-linecap="round">
                  <line x1="40" y1="70" x2="40" y2="82" /><line x1="34" y1="76" x2="46" y2="76" />
                  <line x1="158" y1="92" x2="158" y2="104" /><line x1="152" y1="98" x2="164" y2="98" />
                </g>
              </svg>
            </div>
            <div class="mr-finale-text">Every recipe, solved! You, solnyshko, are the smartest cook in this whole noisy kitchen. Now — who is hungry?</div>
            <!-- restart (inert in the static snapshot) -->
            <button class="check">▸ Play again</button>
          </div>
        </div>

        <!-- ── RAIL (fixed rect, top-right) ── -->
        <div class="mr-s-rail">
          <div class="panel mr-asker">
            <h3>Today's Cook</h3>
            <!-- owner falls back to "mom" (q null); Portrait mood={solved?…:"think"} → Mom expr "think" -->
            <div class="mr-asker-art">
              <svg width="120" height="159.18367346938777" viewBox="0 0 196 260" style="display:block; overflow:visible" aria-hidden="true">
                <defs>
                  <pattern id="mom-hatch-b" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.5" />
                  </pattern>
                  <pattern id="mom-dots-b" patternUnits="userSpaceOnUse" width="16" height="16">
                    <circle cx="4" cy="4" r="1.9" fill="var(--paper-1)" opacity="0.9" />
                    <circle cx="12" cy="12" r="1.9" fill="var(--paper-1)" opacity="0.9" />
                  </pattern>
                </defs>

                <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
                  <path d="M34 258 Q30 198 56 174 Q72 160 98 160 Q124 160 140 174 Q166 198 162 258 Z" fill="var(--paper-1)" />
                  <path d="M34 258 Q30 206 50 182 L66 258 Z" fill="url(#mom-hatch-b)" stroke="none" opacity="0.6" />
                  <path d="M72 176 Q98 186 124 176 L136 258 L60 258 Z" fill="var(--red)" />
                  <path d="M72 176 Q98 186 124 176 L136 258 L60 258 Z" fill="url(#mom-dots-b)" stroke="none" />
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
                  <path d="M50 96 Q46 44 98 38 Q150 44 146 96 Q150 132 122 142 L128 154 Q98 162 68 154 L74 142 Q46 132 50 96 Z" fill="url(#mom-dots-b)" stroke="none" />
                  <path d="M90 150 Q98 142 106 150 Q98 160 90 150 Z" fill="var(--red-deep)" />
                  <path d="M58 78 Q98 62 138 78" fill="none" stroke="var(--red-deep)" stroke-width="2.6" />
                </g>

                <g fill="#5a3a26" stroke="var(--ink)" stroke-width="1.4">
                  <path d="M64 80 Q72 72 80 80 Q76 84 70 84 Q66 84 64 80 Z" />
                  <path d="M116 80 Q124 72 132 80 Q128 84 122 84 Q118 84 116 80 Z" />
                </g>

                <circle cx="98" cy="96" r="38" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.6" />
                <path d="M120 82 A38 38 0 0 1 122 120 Q112 122 110 100 Z" fill="url(#mom-hatch-b)" stroke="none" opacity="0.5" />

                <g stroke="var(--ink)" stroke-width="1.4" fill="var(--red)">
                  <circle cx="60" cy="118" r="3" />
                  <circle cx="136" cy="118" r="3" />
                </g>

                <circle cx="74" cy="104" r="7.5" fill="var(--red-soft)" opacity="0.7" />
                <circle cx="122" cy="104" r="7.5" fill="var(--red-soft)" opacity="0.7" />

                <!-- think eyes -->
                <g stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round">
                  <circle cx="84" cy="90" r="3.4" fill="var(--ink)" stroke="none" />
                  <circle cx="112" cy="90" r="3.4" fill="var(--ink)" stroke="none" />
                  <path d="M78 84 Q84 81 90 84" fill="none" />
                  <path d="M106 84 Q112 81 118 84" fill="none" />
                  <path d="M122 78 Q130 76 136 80" fill="none" stroke-width="2" />
                </g>

                <path d="M98 96 Q102 103 97 105" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round" />

                <!-- think mouth -->
                <path d="M88 116 Q98 112 108 116" stroke="var(--ink)" stroke-width="2.4" fill="none" stroke-linecap="round" />

                <!-- steam (think → dimmer) -->
                <g stroke="var(--red-deep)" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.3">
                  <path d="M84 194 Q80 186 84 180 Q88 174 84 168" />
                  <path d="M112 194 Q116 186 112 180 Q108 174 112 168" />
                </g>

                <!-- the loaf -->
                <ellipse cx="98" cy="214" rx="40" ry="26" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.6" />
                <ellipse cx="98" cy="214" rx="40" ry="26" fill="url(#mom-hatch-b)" stroke="none" opacity="0.32" />
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
            <div class="mr-asker-note"><b>Babushka</b> brought this one to Babushka's counter.</div>
          </div>
          <div class="panel mr-skill-panel">
            <h3>The Skill</h3>
            <!-- skill is null (skillRoom undefined) → no .hint block -->
            <div class="mr-recipe-row">
              <span class="mr-recipe-no">5/5</span>
              <span class="mr-recipe-of">skills mastered</span>
            </div>
          </div>
        </div>

        <!-- ── ANSWER CARD (bottom-left) — Slate present, Check NOT rendered ── -->
        <div class="mr-s-answer">
          <div class="mr-s-write">
            <div class="mr-final-label">Write your answer</div>
            <!-- not mixed, not solved → plain fraction, two empty cells -->
            <div class="mr-s-slate">
              <span class="frinput">
                <div class="slate slate-fraction" role="group" aria-label="your fraction answer">
                  <div class="slate-slot">
                    <div class="slate-cell">
                      <canvas class="slate-canvas" role="img" aria-label="write the top digit"></canvas>
                      <span class="slate-ph" aria-hidden="true">✎</span>
                    </div>
                  </div>
                  <span class="slate-bar" style="background: var(--ink);" aria-hidden="true"></span>
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
            <!-- solved=false → no Rosette; wall=false → no wallbtn;
                 {!done && …} is FALSE → the Check button is NOT rendered. -->
          </div>
        </div>

        <!-- ── TUTOR ZONE (bottom-right) — finale bubble: Mom expr "cheer" ── -->
        <div class="mr-s-tutor">
          <!-- bubble.who = "mom", mood "happy" → Portrait maps to Mom expr "cheer" -->
          <div class="cook-stage">
            <svg width="118" height="156.5306122448979" viewBox="0 0 196 260" style="display:block; overflow:visible" aria-hidden="true">
              <defs>
                <pattern id="mom-hatch-c" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.5" />
                </pattern>
                <pattern id="mom-dots-c" patternUnits="userSpaceOnUse" width="16" height="16">
                  <circle cx="4" cy="4" r="1.9" fill="var(--paper-1)" opacity="0.9" />
                  <circle cx="12" cy="12" r="1.9" fill="var(--paper-1)" opacity="0.9" />
                </pattern>
              </defs>

              <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
                <path d="M34 258 Q30 198 56 174 Q72 160 98 160 Q124 160 140 174 Q166 198 162 258 Z" fill="var(--paper-1)" />
                <path d="M34 258 Q30 206 50 182 L66 258 Z" fill="url(#mom-hatch-c)" stroke="none" opacity="0.6" />
                <path d="M72 176 Q98 186 124 176 L136 258 L60 258 Z" fill="var(--red)" />
                <path d="M72 176 Q98 186 124 176 L136 258 L60 258 Z" fill="url(#mom-dots-c)" stroke="none" />
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
                <path d="M50 96 Q46 44 98 38 Q150 44 146 96 Q150 132 122 142 L128 154 Q98 162 68 154 L74 142 Q46 132 50 96 Z" fill="url(#mom-dots-c)" stroke="none" />
                <path d="M90 150 Q98 142 106 150 Q98 160 90 150 Z" fill="var(--red-deep)" />
                <path d="M58 78 Q98 62 138 78" fill="none" stroke="var(--red-deep)" stroke-width="2.6" />
              </g>

              <g fill="#5a3a26" stroke="var(--ink)" stroke-width="1.4">
                <path d="M64 80 Q72 72 80 80 Q76 84 70 84 Q66 84 64 80 Z" />
                <path d="M116 80 Q124 72 132 80 Q128 84 122 84 Q118 84 116 80 Z" />
              </g>

              <circle cx="98" cy="96" r="38" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.6" />
              <path d="M120 82 A38 38 0 0 1 122 120 Q112 122 110 100 Z" fill="url(#mom-hatch-c)" stroke="none" opacity="0.5" />

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

              <!-- steam (cheer) -->
              <g stroke="var(--red-deep)" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.65">
                <path d="M84 190 Q78 180 84 172 Q90 164 84 156" />
                <path d="M112 190 Q118 180 112 172 Q106 164 112 156" />
              </g>

              <!-- the loaf -->
              <ellipse cx="98" cy="214" rx="40" ry="26" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.6" />
              <ellipse cx="98" cy="214" rx="40" ry="26" fill="url(#mom-hatch-c)" stroke="none" opacity="0.32" />
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

              <!-- sparkles (cheer) -->
              <g stroke="var(--red)" stroke-width="2.2" stroke-linecap="round">
                <line x1="40" y1="70" x2="40" y2="82" /><line x1="34" y1="76" x2="46" y2="76" />
                <line x1="158" y1="92" x2="158" y2="104" /><line x1="152" y1="98" x2="164" y2="98" />
              </g>
            </svg>
          </div>
          <div class="ribbon" data-vox-speaker="mom">Every recipe, solved! You, solnyshko, are the smartest cook in this whole noisy kitchen. Now — who is hungry?</div>
        </div>
      </div>
    </div>
`,
};
