/* room-r1-5-numbers — №3 Same Denominators · Numbers (AppR1, #/nl).
   Data-only module consumed by <LessonScreen>. The chrome (toolbar, topbar,
   tabs, goal, board grid) is the shared component; only the unique content
   below lives here. Interactive markup is verbatim from the original screen. */
export default {
  kind: "lesson",

  lesson: "nl",

  speaker: "cook",

  railW: 396,
  footH: 140,

  goalHTML: `Babushka needs <b>2/7</b> of a tray and <b>3/7</b> of a tray — the pieces are the same size, so add the tops and keep the bottom.`,

  stageHTML: `
          <div class="canvas r1-fz-canvas r1-fz-canvas-center" id="r1canvas">
            <div class="r1-bigeq">
              <div class="bignum"><span class="n">2</span><span class="bar" style="background:#5a4fcf"></span><span class="d">7</span></div>
              <span class="r1-bigeq-op">+</span>
              <div class="bignum"><span class="n">3</span><span class="bar" style="background:#5a4fcf"></span><span class="d">7</span></div>
              <span class="r1-bigeq-op">=</span>
              <div class="bignum"><span class="n">?</span><span class="bar" style="background:var(--ink)"></span><span class="d">?</span></div>
            </div>
            <div class="r1-numbers-cap">No blocks now — add the tops, keep the bottom, and write the whole answer.</div>
          </div>`,

  railHTML: `
          <div class="panel">
            <h3>Write the Whole Answer</h3>
            <div class="hint">Add the tops (2 + 3) and keep the bottom 7. Write both numbers on the Slate.</div>
            <div class="lockcard">
              <div class="bignum">
                <span class="n" style="color:var(--red)">+</span>
                <span class="bar" style="background:#5a4fcf"></span>
                <span class="d-wrap"><span class="d">7</span><span class="lockmark"><svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" style="display:block"><rect x="4" y="11" width="16" height="11" rx="2" fill="none" stroke="var(--ink)" stroke-width="2" /><path d="M8 11 V8 a4 4 0 0 1 8 0 V11" fill="none" stroke="var(--ink)" stroke-width="2" /><circle cx="12" cy="16" r="1.6" fill="var(--ink)" /></svg></span></span>
              </div>
              <div class="lockcard-note">add the tops<br />keep the 7</div>
            </div>
          </div>`,

  answerHTML: `
          <div class="lbar">
            <div class="lbar-eq">
              <span class="r1-fz-frac">2/7</span>
              <span class="r1-fz-op">+</span>
              <span class="r1-fz-frac">3/7</span>
              <span class="r1-fz-op">=</span>
              <span class="r1-fz-slate">
                <div class="slate slate-fraction" role="group" aria-label="write the answer fraction">
                  <div class="slate-slot">
                    <div class="slate-cell"><canvas class="slate-canvas" role="img" aria-label="write the top digit"></canvas><span class="slate-ph" aria-hidden="true">✎</span></div>
                  </div>
                  <span class="slate-bar" style="background:#5a4fcf" aria-hidden="true"></span>
                  <div class="slate-slot">
                    <div class="slate-cell"><canvas class="slate-canvas" role="img" aria-label="write the bottom digit"></canvas></div>
                  </div>
                </div>
              </span>
            </div>
            <div class="lbar-cap">write the whole fraction on the Slate, then Check</div>
            <div class="lbar-marks">
              <span class="check" aria-disabled="true">Check</span>
            </div>
          </div>`,

  tutorHTML: `
          <div class="ltutor">
            <div class="cook-stage">
              <svg width="118" height="156.5306122448" viewBox="0 0 196 260" style="display:block;overflow:visible" aria-hidden="true">
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
                <g><circle cx="83" cy="87" r="3.6" fill="var(--ink)" /><circle cx="113" cy="87" r="3.6" fill="var(--ink)" /></g>
                <path d="M98 92 Q102 99 97 101" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round" />
                <path d="M84 108 Q98 120 112 108" stroke="var(--ink)" stroke-width="2.6" fill="none" stroke-linecap="round" />
                <g stroke="var(--ink)" stroke-width="2.6" stroke-linejoin="round">
                  <rect x="64" y="52" width="68" height="16" rx="3" fill="var(--paper-2)" />
                  <path d="M64 56 Q50 52 52 36 Q40 30 50 18 Q58 6 76 12 Q86 0 104 8 Q124 2 130 18 Q150 22 144 38 Q152 52 132 56 Q132 40 120 44 Q120 30 104 34 Q104 22 88 28 Q84 40 72 38 Q74 52 64 56 Z" fill="var(--paper-1)" />
                </g>
                <path d="M120 44 Q132 40 132 56 L120 56 Z" fill="url(#ck-hatch)" stroke="none" opacity="0.5" />
              </svg>
            </div>
            <div class="ribbon">Just the numbers: 2/7 + 3/7 = ? Write the whole answer on the Slate.</div>
          </div>`,
};
