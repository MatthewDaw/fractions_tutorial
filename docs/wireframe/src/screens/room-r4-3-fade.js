/* room-r4-3-fade — №9 Simplify · Fade · Stage 3 (AppR4, #/r4).
   Data-only module consumed by <LessonScreen>. The chrome (toolbar, topbar,
   tabs, goal, board grid) is the shared component; only the unique content
   below lives here. Interactive markup is verbatim from the original screen. */
export default {
  kind: "lesson",

  lesson: "r4",

  railW: 452,
  footH: 150,

  goalHTML: `The bar is fading. <b>Pick the number</b> that divides BOTH 8 and 12, then <b>write</b> the equivalent line yourself. Same number top and bottom — that's dividing by 1.`,

  stageHTML: `
          <div class="canvas r4-s-canvas" id="r3canvas">
            <div class="eqstate eqfloat r4-simplestflag">group it down</div>

            <div class="r4-guide" style="left:530px; top:38px; height:184px;">
              <span class="r4-guide-cap">same amount</span>
            </div>

            <!-- ruler 0 → 1, a tick every 1/12 -->
            <div class="nline" style="top:198px; left:90px; right:auto; width:660px;"></div>
            <span class="ntick" style="left:90px;  top:198px; height:14px;"></span>
            <span class="ntick" style="left:145px; top:198px; height:8px;"></span>
            <span class="ntick" style="left:200px; top:198px; height:8px;"></span>
            <span class="ntick" style="left:255px; top:198px; height:8px;"></span>
            <span class="ntick" style="left:310px; top:198px; height:8px;"></span>
            <span class="ntick" style="left:365px; top:198px; height:8px;"></span>
            <span class="ntick" style="left:420px; top:198px; height:8px;"></span>
            <span class="ntick" style="left:475px; top:198px; height:8px;"></span>
            <span class="ntick" style="left:530px; top:198px; height:8px;"></span>
            <span class="ntick" style="left:585px; top:198px; height:8px;"></span>
            <span class="ntick" style="left:640px; top:198px; height:8px;"></span>
            <span class="ntick" style="left:695px; top:198px; height:8px;"></span>
            <span class="ntick" style="left:750px; top:198px; height:14px;"></span>
            <span class="nlab ng" style="left:90px;  top:210px;">0</span>
            <span class="nlab ng" style="left:750px; top:210px;">1</span>

            <div class="r4-bar" style="left:90px; top:64px;">
              <div class="btag">
                <div class="bignum"><span class="n">8</span><span class="bar" style="background:#386641;"></span><span class="d">12</span></div>
              </div>

              <!-- GroupBar dimmed: wrapper .is-ghost, 12 cells of 55px, first 8 filled -->
              <div class="r4-groupbar is-ghost">
                <div class="r4-gb-track" style="width:660px;">
                  <div class="r4-gb-cell is-filled" style="width:55px; background:#386641; border-right:1.5px solid rgba(237,226,200,0.55);"><div class="piece-hatch" style="background-image:repeating-linear-gradient(0deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div><span class="r4-gb-cut"></span><span class="piece-lab" style="color:#ede2c8; font-size:13px;">1/12</span></div>
                  <div class="r4-gb-cell is-filled" style="width:55px; background:#386641; border-right:1.5px solid rgba(237,226,200,0.55);"><div class="piece-hatch" style="background-image:repeating-linear-gradient(0deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div><span class="r4-gb-cut"></span><span class="piece-lab" style="color:#ede2c8; font-size:13px;">1/12</span></div>
                  <div class="r4-gb-cell is-filled" style="width:55px; background:#386641; border-right:1.5px solid rgba(237,226,200,0.55);"><div class="piece-hatch" style="background-image:repeating-linear-gradient(0deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div><span class="r4-gb-cut"></span><span class="piece-lab" style="color:#ede2c8; font-size:13px;">1/12</span></div>
                  <div class="r4-gb-cell is-filled" style="width:55px; background:#386641; border-right:1.5px solid rgba(237,226,200,0.55);"><div class="piece-hatch" style="background-image:repeating-linear-gradient(0deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div><span class="r4-gb-cut"></span><span class="piece-lab" style="color:#ede2c8; font-size:13px;">1/12</span></div>
                  <div class="r4-gb-cell is-filled" style="width:55px; background:#386641; border-right:1.5px solid rgba(237,226,200,0.55);"><div class="piece-hatch" style="background-image:repeating-linear-gradient(0deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div><span class="r4-gb-cut"></span><span class="piece-lab" style="color:#ede2c8; font-size:13px;">1/12</span></div>
                  <div class="r4-gb-cell is-filled" style="width:55px; background:#386641; border-right:1.5px solid rgba(237,226,200,0.55);"><div class="piece-hatch" style="background-image:repeating-linear-gradient(0deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div><span class="r4-gb-cut"></span><span class="piece-lab" style="color:#ede2c8; font-size:13px;">1/12</span></div>
                  <div class="r4-gb-cell is-filled" style="width:55px; background:#386641; border-right:1.5px solid rgba(237,226,200,0.55);"><div class="piece-hatch" style="background-image:repeating-linear-gradient(0deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div><span class="r4-gb-cut"></span><span class="piece-lab" style="color:#ede2c8; font-size:13px;">1/12</span></div>
                  <div class="r4-gb-cell is-filled" style="width:55px; background:#386641; border-right:1.5px solid rgba(237,226,200,0.55);"><div class="piece-hatch" style="background-image:repeating-linear-gradient(0deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div><span class="r4-gb-cut"></span><span class="piece-lab" style="color:#ede2c8; font-size:13px;">1/12</span></div>
                  <div class="r4-gb-cell is-empty" style="width:55px; background:transparent; border-right:1.5px solid rgba(20,14,10,0.34);"><span class="r4-gb-cut"></span><span class="piece-lab" style="color:rgba(20,14,10,0.34); font-size:13px;">1/12</span></div>
                  <div class="r4-gb-cell is-empty" style="width:55px; background:transparent; border-right:1.5px solid rgba(20,14,10,0.34);"><span class="r4-gb-cut"></span><span class="piece-lab" style="color:rgba(20,14,10,0.34); font-size:13px;">1/12</span></div>
                  <div class="r4-gb-cell is-empty" style="width:55px; background:transparent; border-right:1.5px solid rgba(20,14,10,0.34);"><span class="r4-gb-cut"></span><span class="piece-lab" style="color:rgba(20,14,10,0.34); font-size:13px;">1/12</span></div>
                  <div class="r4-gb-cell is-empty" style="width:55px; background:transparent; border-right:none;"><span class="r4-gb-cut"></span><span class="piece-lab" style="color:rgba(20,14,10,0.34); font-size:13px;">1/12</span></div>

                  <span class="r4-gb-filledge" style="left:440px;">
                    <span class="r4-gb-edgecap">same amount</span>
                  </span>
                  <span class="r4-gb-counttag" style="left:220px;">8 of 12</span>
                </div>
              </div>

              <div class="r4-valnote">same amount: 8/12 of a tray</div>
            </div>
          </div>`,

  railHTML: `
          <div class="panel">
            <h3 class="pick-title">Shared Factor</h3>
            <div class="hint">The bar is fading — choose with numbers now. <b>Drag</b> the ÷ number that divides <b>both</b> 8 and 12 onto the equation. Same number top and bottom is dividing by 1, so the amount stays the same.</div>
            <div class="r4-factor-tray">
              <button class="r4-factor-btn" aria-pressed="false" title="Drag onto the equation to divide top and bottom by 2">÷2</button>
              <button class="r4-factor-btn" aria-pressed="false" title="Drag onto the equation to divide top and bottom by 3">÷3</button>
              <button class="r4-factor-btn" aria-pressed="false" title="Drag onto the equation to divide top and bottom by 4">÷4</button>
              <button class="r4-factor-btn" aria-pressed="false" title="Drag onto the equation to divide top and bottom by 5">÷5</button>
            </div>
            <div class="r4-fade-eq">
              <span class="r4-fade-frac">8/12</span>
              <span class="r4-fade-op">=</span>
              <span class="r4-fade-frac r4-fade-out">?/?</span>
            </div>
          </div>`,

  answerHTML: `
          <div class="lbar r4-s-answer">
            <div class="r4-s-eqrow">
              <span class="r4-s-frac"><div class="bignum"><span class="n">8</span><span class="bar" style="background:#386641;"></span><span class="d">12</span></div></span>
              <span class="r4-s-eq">=</span>
              <span class="r4-s-slate">
                <div class="slate slate-fraction" role="group" aria-label="write the equivalent fraction">
                  <div class="slate-slot">
                    <div class="slate-cell">
                      <canvas class="slate-canvas" role="img" aria-label="write the top digit"></canvas>
                      <span class="slate-ph" aria-hidden="true">✎</span>
                    </div>
                  </div>
                  <span class="slate-bar" style="background:#e07b00;" aria-hidden="true"></span>
                  <div class="slate-slot">
                    <div class="slate-cell">
                      <canvas class="slate-canvas" role="img" aria-label="write the bottom digit"></canvas>
                      <span class="slate-ph" aria-hidden="true"></span>
                    </div>
                  </div>
                </div>
              </span>
              <div class="r4-s-marks">
                <button class="check">Check</button>
              </div>
            </div>
            <div class="r4-s-cap">pick a shared factor, then write the equivalent line</div>
          </div>`,

  tutorHTML: `
          <div class="ltutor">
            <div class="cook-stage">
              <svg width="118" height="156" viewBox="0 0 196 260" style="display:block; overflow:visible" aria-hidden="true">
                <defs>
                  <pattern id="ck-hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.5" />
                  </pattern>
                  <pattern id="ck-hatch-r" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(-45)">
                    <line x1="0" y1="0" x2="0" y2="5" stroke="var(--red-deep)" stroke-width="0.8" opacity="0.45" />
                  </pattern>
                </defs>
                <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
                  <path d="M44 258 Q40 188 58 168 Q72 154 98 154 Q124 154 138 168 Q156 188 152 258 Z" fill="var(--paper-1)" />
                  <path d="M74 168 Q98 178 122 168 L130 258 L66 258 Z" fill="var(--red)" />
                  <path d="M74 168 Q98 178 122 168 L130 258 L66 258 Z" fill="url(#ck-hatch-r)" stroke="none" />
                  <path d="M98 156 L98 258" stroke="var(--ink)" stroke-width="1.4" opacity="0.5" fill="none" />
                  <path d="M44 258 Q40 200 54 176 L70 258 Z" fill="url(#ck-hatch)" stroke="none" opacity="0.7" />
                  <path d="M58 172 Q34 186 30 214" fill="none" />
                  <path d="M138 172 Q162 186 166 214" fill="none" />
                </g>
                <circle cx="98" cy="182" r="2.6" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="1.4" />
                <circle cx="98" cy="200" r="2.6" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="1.4" />
                <circle cx="98" cy="218" r="2.6" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="1.4" />
                <circle cx="28" cy="218" r="9" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.4" />
                <circle cx="168" cy="218" r="9" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.4" />
                <g transform="rotate(6 168 218)">
                  <line x1="168" y1="216" x2="186" y2="176" stroke="var(--red-deep)" stroke-width="4" stroke-linecap="round" />
                  <ellipse cx="188" cy="170" rx="8" ry="11" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.2" transform="rotate(18 188 170)" />
                </g>
                <rect x="86" y="138" width="24" height="22" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.4" />
                <path d="M78 150 Q98 166 118 150 L112 138 Q98 146 84 138 Z" fill="var(--red)" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round" />
                <g fill="var(--red-deep)" stroke="var(--ink)" stroke-width="2">
                  <path d="M58 92 Q50 104 56 116 Q62 108 66 110 Z" />
                  <path d="M138 92 Q146 104 140 116 Q134 108 130 110 Z" />
                </g>
                <circle cx="98" cy="92" r="40" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.6" />
                <path d="M122 78 A40 40 0 0 1 124 116 Q112 120 110 96 Z" fill="url(#ck-hatch)" stroke="none" opacity="0.55" />
                <circle cx="74" cy="100" r="7" fill="var(--red-soft)" opacity="0.7" />
                <circle cx="122" cy="100" r="7" fill="var(--red-soft)" opacity="0.7" />
                <g>
                  <circle cx="83" cy="87" r="3.6" fill="var(--ink)" />
                  <circle cx="113" cy="87" r="3.6" fill="var(--ink)" />
                </g>
                <path d="M98 92 Q102 99 97 101" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round" />
                <path d="M84 108 Q98 120 112 108" stroke="var(--ink)" stroke-width="2.6" fill="none" stroke-linecap="round" />
                <g stroke="var(--ink)" stroke-width="2.6" stroke-linejoin="round">
                  <rect x="64" y="52" width="68" height="16" rx="3" fill="var(--paper-2)" />
                  <path d="M64 56 Q50 52 52 36 Q40 30 50 18 Q58 6 76 12 Q86 0 104 8 Q124 2 130 18 Q150 22 144 38 Q152 52 132 56 Q132 40 120 44 Q120 30 104 34 Q104 22 88 28 Q84 40 72 38 Q74 52 64 56 Z" fill="var(--paper-1)" />
                </g>
                <path d="M120 44 Q132 40 132 56 L120 56 Z" fill="url(#ck-hatch)" stroke="none" opacity="0.5" />
              </svg>
            </div>
            <div class="ribbon">"The bar is fading. Pick the number that divides BOTH 8 and 12, then write the equivalent line. Same number on top and bottom is dividing by 1."</div>
          </div>`,
};
