/* room-r2-5-ghost — №8 Cross-Multiply · Ghost · #/r2 (beat L5).
   Data-only module consumed by <LessonScreen>. */
export default {
  kind: "lesson",

  lesson: "r2",

  railW: 360,
  footH: 150,

  stageHTML: `
          <div class="canvas lu-canvas" id="r2canvas">
            <div class="eqstate eqfloat"><span class="g">≠</span>blocks differ</div>

            <div class="nline" style="top:256px; left:60px; right:auto; width:600px;"></div>
            <span class="ntick" style="left:60px;  top:256px; height:14px;"></span>
            <span class="ntick" style="left:160px; top:256px; height:6px;"></span>
            <span class="ntick" style="left:260px; top:256px; height:6px;"></span>
            <span class="ntick" style="left:360px; top:256px; height:6px;"></span>
            <span class="ntick" style="left:460px; top:256px; height:6px;"></span>
            <span class="ntick" style="left:560px; top:256px; height:6px;"></span>
            <span class="ntick" style="left:660px; top:256px; height:14px;"></span>
            <span class="nlab ng" style="left:60px;  top:268px;">0</span>
            <span class="nlab"    style="left:160px; top:268px;">1/6</span>
            <span class="nlab"    style="left:260px; top:268px;">2/6</span>
            <span class="nlab"    style="left:360px; top:268px;">3/6</span>
            <span class="nlab"    style="left:460px; top:268px;">4/6</span>
            <span class="nlab"    style="left:560px; top:268px;">5/6</span>
            <span class="nlab ng" style="left:660px; top:268px;">1</span>

            <!-- the ghost backdrop: original strips, dimmed + non-interactive -->
            <div class="ghost-backdrop">
              <!-- strip A · 1/2 (original; blue halves) -->
              <div class="nbar" style="left:60px; top:156px; width:300px;">
                <div class="btag">
                  <div class="bignum"><span class="n">1</span><span class="bar" style="background:#1f6fd6;"></span><span class="d">2</span></div>
                </div>
                <div class="plank" style="width:300px;">
                  <div class="plank-body">
                    <div class="piece" style="width:300px; background:#1f6fd6; border-right:none;">
                      <div class="piece-hatch" style="background-image:repeating-linear-gradient(0deg, rgba(237,226,200,.34) 0 1px, transparent 1px 6px);"></div>
                      <span class="piece-lab" style="color:#ede2c8; font-size:15px;">1/2</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- strip B · 1/3 (original; orange thirds) -->
              <div class="nbar" style="left:60px; top:68px; width:200px;">
                <div class="btag">
                  <div class="bignum"><span class="n">1</span><span class="bar" style="background:#e07b00;"></span><span class="d">3</span></div>
                </div>
                <div class="plank" style="width:200px;">
                  <div class="plank-body">
                    <div class="piece" style="width:200px; background:#e07b00; border-right:none;">
                      <div class="piece-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(20,14,10,.34) 0 1px, transparent 1px 6px);"></div>
                      <span class="piece-lab" style="color:#1c1612; font-size:15px;">1/3</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>`,

  railHTML: `
          <div class="panel">
            <h3>From Memory</h3>
            <div class="hint">The bars are behind, faded — just a reminder. Rename BOTH fractions as equivalent fractions over a common bottom, then add like same-denominators. (The fast way to get that bottom is to multiply each by the other's bottom.)</div>
            <div class="bare-eq">1/2 + 1/3 = <b>?</b></div>
          </div>`,

  answerHTML: `
          <div class="lbar lu-ansbar">
            <div class="lbar-eq">
              <div class="bignum"><span class="n">1</span><span class="bar" style="background:#1f6fd6;"></span><span class="d">2</span></div>
              <span class="lu-op">+</span>
              <div class="bignum"><span class="n">1</span><span class="bar" style="background:#e07b00;"></span><span class="d">3</span></div>
              <span class="lu-op">=</span>
              <span class="lu-ans-slot">
                <span class="lu-slate">
                  <div class="slate slate-fraction" role="group" aria-label="write the total fraction">
                    <div class="slate-slot is-disabled"><div class="slate-cell"></div></div>
                    <span class="slate-bar" style="background:#caa300;" aria-hidden="true"></span>
                    <div class="slate-slot"><div class="slate-cell"><span class="slate-ph" aria-hidden="true">✎</span></div></div>
                  </div>
                </span>
              </span>
            </div>
            <div class="lbar-cap">write the bottom number — how big is each block?</div>
            <div class="lbar-marks">
              <button class="check">Check</button>
            </div>
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
            <div class="ribbon">Just the numbers. The bars are only a memory now — write the whole answer.</div>
          </div>`,
};
