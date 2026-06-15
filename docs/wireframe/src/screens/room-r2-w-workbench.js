/* room-r2-w-workbench — №7 Cross-Multiply · Workbench (#/r2).
   Data-only module consumed by <LessonScreen>. The chrome (toolbar, topbar,
   tabs, board grid) is the shared component; only the unique content below
   lives here. Interactive markup is verbatim from the original screen. */
export default {
  kind: "lesson",

  lesson: "r2",

  railW: 360,
  footH: 150,

  stageHTML: `
          <div class="canvas sandbox-canvas">
            <div class="sandbox-status">Stack same-size blocks until the row reaches the flag.</div>

            <!-- the work strip — three 1/6 blocks placed (building from sixths) -->
            <div class="sandbox-row" style="left:8px; top:70px; width:600px; height:64px;">
              <button type="button" class="sandbox-piece" style="left:0px; width:100px; background:#caa300; border-right:1.5px solid rgba(20,14,10,.55);" title="tap to take this block off" aria-label="one sixths — tap to remove">
                <span class="sandbox-piece-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(20,14,10,.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(20,14,10,.34) 0 1px, transparent 1px 6px);"></span>
                <span class="sandbox-piece-lab" style="color:#1c1612; font-size:14px;">1/6</span>
              </button>
              <button type="button" class="sandbox-piece" style="left:100px; width:100px; background:#caa300; border-right:1.5px solid rgba(20,14,10,.55);" title="tap to take this block off" aria-label="one sixths — tap to remove">
                <span class="sandbox-piece-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(20,14,10,.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(20,14,10,.34) 0 1px, transparent 1px 6px);"></span>
                <span class="sandbox-piece-lab" style="color:#1c1612; font-size:14px;">1/6</span>
              </button>
              <button type="button" class="sandbox-piece" style="left:200px; width:100px; background:#caa300; border-right:1.5px solid rgba(20,14,10,.55);" title="tap to take this block off" aria-label="one sixths — tap to remove">
                <span class="sandbox-piece-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(20,14,10,.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(20,14,10,.34) 0 1px, transparent 1px 6px);"></span>
                <span class="sandbox-piece-lab" style="color:#1c1612; font-size:14px;">1/6</span>
              </button>
            </div>

            <!-- ruler 0 → 1 with the 5/6 target flag -->
            <div class="sandbox-line" style="left:8px; top:150px; width:600px;"></div>
            <span class="sandbox-tick" style="left:8px;   top:150px;"></span>
            <span class="sandbox-tick-lab" style="left:8px;   top:160px;">0</span>
            <span class="sandbox-tick" style="left:608px; top:150px;"></span>
            <span class="sandbox-tick-lab" style="left:608px; top:160px;">1</span>
            <div class="sandbox-flag" style="left:508px; top:54px; height:128px;">
              <span class="sandbox-flag-lab">1/2 + 1/3</span>
            </div>
          </div>`,

  railHTML: `
          <div class="panel">
            <h3>Workbench</h3>
            <div class="hint">Drag a block from the bin onto the line and stack them up. Build the answer out of same-size pieces, then count them.</div>
            <div class="sandbox-bin" role="group" aria-label="block bin">
              <button type="button" class="sandbox-bin-btn" style="width:116px; touch-action:none;" title="drag a 1/2 block (halves) onto the line" aria-label="add one halves block — drag onto the line, or press to place">
                <span class="sandbox-bin-chip" style="background:#1f6fd6; color:#ede2c8;">
                  <span class="sandbox-bin-hatch" style="background-image:repeating-linear-gradient(0deg, rgba(237,226,200,.34) 0 1px, transparent 1px 6px);"></span>1/2
                </span>
                <span class="sandbox-bin-name">halves</span>
              </button>
              <button type="button" class="sandbox-bin-btn" style="width:77px; touch-action:none;" title="drag a 1/3 block (thirds) onto the line" aria-label="add one thirds block — drag onto the line, or press to place">
                <span class="sandbox-bin-chip" style="background:#e07b00; color:#1c1612;">
                  <span class="sandbox-bin-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(20,14,10,.34) 0 1px, transparent 1px 6px);"></span>1/3
                </span>
                <span class="sandbox-bin-name">thirds</span>
              </button>
              <button type="button" class="sandbox-bin-btn" style="width:39px; touch-action:none;" title="drag a 1/6 block (sixths) onto the line" aria-label="add one sixths block — drag onto the line, or press to place">
                <span class="sandbox-bin-chip" style="background:#caa300; color:#1c1612;">
                  <span class="sandbox-bin-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(20,14,10,.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(20,14,10,.34) 0 1px, transparent 1px 6px);"></span>1/6
                </span>
                <span class="sandbox-bin-name">sixths</span>
              </button>
            </div>

            <div class="sandbox-readout">
              <div class="sandbox-readout-row">
                <span class="sandbox-readout-lab">on the line</span>
                <span class="sandbox-readout-val">
                  <div class="bignum"><span class="n">3</span><span class="bar" style="background:#caa300;"></span><span class="d">6</span></div>
                </span>
              </div>
              <button type="button" class="sandbox-clear">↺ Clear the line</button>
            </div>
          </div>`,

  answerHTML: `
          <div class="marks">
            <button class="check" disabled>Build it ▸</button>
          </div>`,

  tutorHTML: `
          <div class="ltutor">
            <div class="cook-stage">
              <svg width="118" height="156.4" viewBox="0 0 196 260" style="display:block; overflow:visible;" aria-hidden="true">
                <defs>
                  <pattern id="ck-hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.5" /></pattern>
                  <pattern id="ck-hatch-r" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="5" stroke="var(--red-deep)" stroke-width="0.8" opacity="0.45" /></pattern>
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
            <div class="ribbon">The Workbench. Pull blocks from the bin and build the answer out of same-size pieces, then count them up.</div>
          </div>`,
};
