/* room-m3-4-workbench — №2 Times Facts · Workbench (BlockSandbox, #/m3).
   Data-only module consumed by <LessonScreen>. The chrome (toolbar, topbar,
   tabs, goal, board grid) is the shared component; only the unique content
   below lives here. Interactive markup is verbatim from the original screen. */
export default {
  kind: "lesson",

  lesson: "m3",

  lboardClass: "is-norail",

  footH: 158,

  stageHTML: `
          <div class="play sandbox-play">
            <div class="diagram">
              <div class="canvas sandbox-canvas">
                <div class="sandbox-status">Drag a block from the bin onto the line.</div>

                <!-- empty work strip (no pieces placed yet) -->
                <div class="sandbox-row" style="left:8px; top:70px; width:600px; height:64px;"></div>

                <!-- ruler 0 → 56 -->
                <div class="sandbox-line" style="left:8px; top:150px; width:600px;"></div>
                <span class="sandbox-tick" style="left:8px; top:150px;"></span>
                <span class="sandbox-tick-lab" style="left:8px; top:160px;">0</span>
                <span class="sandbox-tick" style="left:608px; top:150px;"></span>
                <span class="sandbox-tick-lab" style="left:608px; top:160px;">56</span>

                <!-- target flag at 56 -->
                <div class="sandbox-flag" style="left:608px; top:54px; height:112px;">
                  <span class="sandbox-flag-lab">7 groups of 8</span>
                </div>
              </div>
            </div>

            <!-- the bin rail: blocks 8 / 5 / 6 + live count + clear -->
            <div class="rail">
              <div class="panel">
                <h3>Workbench</h3>
                <div class="hint">Build 7 groups of 8 — drop "8" blocks onto the line until they reach 56, then write the product below.</div>
                <div class="sandbox-bin" role="group" aria-label="block bin">
                  <button type="button" class="sandbox-bin-btn" style="width:116px;" title="drag a group of 8 onto the line" aria-label="add one group of 8 — drag onto the line, or press to place">
                    <span class="sandbox-bin-chip" style="background:#d1495b; color:#ede2c8;">
                      <span class="sandbox-bin-hatch" style="background-image:repeating-linear-gradient(90deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px); background-size:6px 6px;"></span>
                      <span class="sandbox-seg" style="background-image:repeating-linear-gradient(90deg, transparent 0, transparent calc(100%/8 - 1.5px), rgba(20,14,10,0.5) calc(100%/8 - 1.5px), rgba(20,14,10,0.5) calc(100%/8));"></span>
                      8
                    </span>
                    <span class="sandbox-bin-name">group of 8</span>
                  </button>
                  <button type="button" class="sandbox-bin-btn" style="width:73px;" title="drag a group of 5 onto the line" aria-label="add one group of 5 — drag onto the line, or press to place">
                    <span class="sandbox-bin-chip" style="background:#b5179e; color:#ede2c8;">
                      <span class="sandbox-bin-hatch" style="background-image:radial-gradient(rgba(237,226,200,0.34) 1px, transparent 1px); background-size:7px 7px;"></span>
                      <span class="sandbox-seg" style="background-image:repeating-linear-gradient(90deg, transparent 0, transparent calc(100%/5 - 1.5px), rgba(20,14,10,0.5) calc(100%/5 - 1.5px), rgba(20,14,10,0.5) calc(100%/5));"></span>
                      5
                    </span>
                    <span class="sandbox-bin-name">group of 5</span>
                  </button>
                  <button type="button" class="sandbox-bin-btn" style="width:87px;" title="drag a group of 6 onto the line" aria-label="add one group of 6 — drag onto the line, or press to place">
                    <span class="sandbox-bin-chip" style="background:#caa300; color:#1c1612;">
                      <span class="sandbox-bin-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(20,14,10,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(20,14,10,0.34) 0 1px, transparent 1px 6px);"></span>
                      <span class="sandbox-seg" style="background-image:repeating-linear-gradient(90deg, transparent 0, transparent calc(100%/6 - 1.5px), rgba(20,14,10,0.5) calc(100%/6 - 1.5px), rgba(20,14,10,0.5) calc(100%/6));"></span>
                      6
                    </span>
                    <span class="sandbox-bin-name">group of 6</span>
                  </button>
                </div>

                <div class="sandbox-readout">
                  <div class="sandbox-readout-row">
                    <span class="sandbox-readout-lab">on the line</span>
                    <span class="sandbox-readout-val"><em>0 blocks, mixed sizes</em></span>
                  </div>
                  <button type="button" class="sandbox-clear" disabled>↺ Clear the line</button>
                </div>
              </div>
            </div>
          </div>`,

  answerHTML: `
          <div class="lbar">
            <div class="lbar-eq">
              <span class="m3-fz-fact">7 × 8</span>
              <span class="m3-fz-op">=</span>
              <span class="m3-fz-slate">
                <div class="slate slate-row is-disabled" role="group" aria-label="write the product">
                  <div class="slate-slot is-disabled">
                    <div class="slate-cell">
                      <canvas class="slate-canvas" role="img" aria-label="write the product digit"></canvas>
                      <span class="slate-ph" aria-hidden="true"></span>
                    </div>
                  </div>
                </div>
              </span>
            </div>
            <div class="lbar-cap">build the groups first</div>
            <div class="lbar-marks">
              <button class="check" disabled>Check</button>
            </div>
          </div>`,

  tutorHTML: `
          <div class="ltutor">
            <div class="cook-stage">
              <svg width="118" height="156.5" viewBox="0 0 196 260" style="display:block; overflow:visible;" aria-hidden="true">
                <defs>
                  <pattern id="ck-hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.5"></line></pattern>
                  <pattern id="ck-hatch-r" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="5" stroke="var(--red-deep)" stroke-width="0.8" opacity="0.45"></line></pattern>
                </defs>
                <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
                  <path d="M44 258 Q40 188 58 168 Q72 154 98 154 Q124 154 138 168 Q156 188 152 258 Z" fill="var(--paper-1)"></path>
                  <path d="M74 168 Q98 178 122 168 L130 258 L66 258 Z" fill="var(--red)"></path>
                  <path d="M74 168 Q98 178 122 168 L130 258 L66 258 Z" fill="url(#ck-hatch-r)" stroke="none"></path>
                  <path d="M98 156 L98 258" stroke="var(--ink)" stroke-width="1.4" opacity="0.5" fill="none"></path>
                  <path d="M44 258 Q40 200 54 176 L70 258 Z" fill="url(#ck-hatch)" stroke="none" opacity="0.7"></path>
                  <path d="M58 172 Q34 186 30 214" fill="none"></path>
                  <path d="M138 172 Q162 186 166 214" fill="none"></path>
                </g>
                <circle cx="98" cy="182" r="2.6" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="1.4"></circle>
                <circle cx="98" cy="200" r="2.6" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="1.4"></circle>
                <circle cx="98" cy="218" r="2.6" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="1.4"></circle>
                <circle cx="28" cy="218" r="9" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.4"></circle>
                <circle cx="168" cy="218" r="9" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.4"></circle>
                <g transform="rotate(6 168 218)">
                  <line x1="168" y1="216" x2="186" y2="176" stroke="var(--red-deep)" stroke-width="4" stroke-linecap="round"></line>
                  <ellipse cx="188" cy="170" rx="8" ry="11" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.2" transform="rotate(18 188 170)"></ellipse>
                </g>
                <rect x="86" y="138" width="24" height="22" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.4"></rect>
                <path d="M78 150 Q98 166 118 150 L112 138 Q98 146 84 138 Z" fill="var(--red)" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round"></path>
                <g fill="var(--red-deep)" stroke="var(--ink)" stroke-width="2">
                  <path d="M58 92 Q50 104 56 116 Q62 108 66 110 Z"></path>
                  <path d="M138 92 Q146 104 140 116 Q134 108 130 110 Z"></path>
                </g>
                <circle cx="98" cy="92" r="40" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.6"></circle>
                <path d="M122 78 A40 40 0 0 1 124 116 Q112 120 110 96 Z" fill="url(#ck-hatch)" stroke="none" opacity="0.55"></path>
                <circle cx="74" cy="100" r="7" fill="var(--red-soft)" opacity="0.7"></circle>
                <circle cx="122" cy="100" r="7" fill="var(--red-soft)" opacity="0.7"></circle>
                <g>
                  <circle cx="83" cy="87" r="3.6" fill="var(--ink)"></circle>
                  <circle cx="113" cy="87" r="3.6" fill="var(--ink)"></circle>
                </g>
                <path d="M98 92 Q102 99 97 101" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round"></path>
                <path d="M84 108 Q98 120 112 108" stroke="var(--ink)" stroke-width="2.6" fill="none" stroke-linecap="round"></path>
                <g stroke="var(--ink)" stroke-width="2.6" stroke-linejoin="round">
                  <rect x="64" y="52" width="68" height="16" rx="3" fill="var(--paper-2)"></rect>
                  <path d="M64 56 Q50 52 52 36 Q40 30 50 18 Q58 6 76 12 Q86 0 104 8 Q124 2 130 18 Q150 22 144 38 Q152 52 132 56 Q132 40 120 44 Q120 30 104 34 Q104 22 88 28 Q84 40 72 38 Q74 52 64 56 Z" fill="var(--paper-1)"></path>
                </g>
                <path d="M120 44 Q132 40 132 56 L120 56 Z" fill="url(#ck-hatch)" stroke="none" opacity="0.5"></path>
              </svg>
            </div>
            <div class="ribbon">The Workbench — drop "8" blocks onto the line until they reach 56. That's 7 groups of 8: 7 × 8 = 56.</div>
          </div>`,
};
