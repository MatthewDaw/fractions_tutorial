/* room-m3-5-numbers — №2 Times Facts · Numbers · Stage 5 (AppM3, #/m3).
   Data-only module consumed by <LessonScreen>. The chrome (toolbar, topbar,
   tabs, goal, board grid) is the shared component; only the unique content
   below lives here. Interactive markup is verbatim from the original screen. */
export default {
  kind: "lesson",

  lesson: "m3",

  railW: 360,
  footH: 158,

  stageHTML: `
          <div class="fit-stage canvas m3-fz-canvas m3-fz-canvas-center" id="m3canvas">
            <div class="fit-stage-content" style="transform:scale(1);">
              <div class="m3-bigeq">
                <span class="m3-bigeq-term">7</span>
                <span class="m3-bigeq-op">×</span>
                <span class="m3-bigeq-term">8</span>
                <span class="m3-bigeq-op">=</span>
                <span class="m3-bigeq-q">?</span>
              </div>
              <div class="m3-numbers-cap">From memory now — and skip-count by 8 if you need a way back.</div>
              <div class="m3-prompt-dots" aria-hidden="true">
                <span class="m3-prompt-dot is-active"></span>
                <span class="m3-prompt-dot"></span>
                <span class="m3-prompt-dot"></span>
              </div>
            </div>
          </div>`,

  railHTML: `
          <div class="panel">
            <h3>Know It By Heart</h3>
            <div class="hint">The fluency target: answer from recall. After 7 × 8, two quick ones — times-one and times-zero.</div>
            <div class="m3-factcard">
              <span class="m3-factcard-eq">7 × 8</span>
              <div class="m3-factcard-note">1 of 3</div>
            </div>
          </div>`,

  answerHTML: `
          <div class="lbar">
            <div class="lbar-eq">
              <span class="m3-fz-fact">7 × 8</span>
              <span class="m3-fz-op">=</span>
              <span class="m3-fz-slate">
                <div class="slate slate-row" role="group" aria-label="write the product">
                  <div class="slate-slot">
                    <div class="slate-cell">
                      <canvas class="slate-canvas" role="img" aria-label="write the product digit"></canvas>
                      <span class="slate-ph" aria-hidden="true">✎</span>
                    </div>
                  </div>
                </div>
              </span>
            </div>
            <div class="lbar-cap">write the product from memory, then Check</div>
            <div class="lbar-marks">
              <button class="check">Check</button>
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
                <g transform="rotate(-6 168 218)">
                  <line x1="168" y1="216" x2="150" y2="176" stroke="var(--red-deep)" stroke-width="4" stroke-linecap="round"></line>
                  <ellipse cx="148" cy="170" rx="8" ry="11" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.2" transform="rotate(-18 148 170)"></ellipse>
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
            <div class="ribbon">Just the numbers: 7 × 8 = ? Write it from memory — then a quick times-one and times-zero.</div>
          </div>`,
};
