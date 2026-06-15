/* room-cmp-3-reason — №6 Compare & Check · Reason (AppCompare, #/cmp).
   Data-only module consumed by <LessonScreen>. The chrome (toolbar, topbar,
   tabs, goal, board grid) is the shared component; only the unique content
   below lives here. Interactive markup is verbatim from the original screen. */
export default {
  kind: "lesson",

  lesson: "cmp",

  railW: 396,
  footH: 196,

  stageHTML: `
          <!-- reasonableness canvas: bare sum on top, two lines each vs ½.
               ORIGIN=80, SPAN=560. xOf(v)=80+v*560. -->
          <div class="canvas cmp-canvas" id="cmpcanvas">

            <!-- the bare sum equation, centered top -->
            <div class="cmp-reason-eq">
              <span class="bignum"><span class="n">1</span><span class="bar" style="background:#1f6fd6"></span><span class="d">2</span></span>
              <span class="cmp-reason-op">+</span>
              <span class="bignum"><span class="n">2</span><span class="bar" style="background:#e07b00"></span><span class="d">3</span></span>
              <span class="cmp-reason-op">=</span>
              <span class="cmp-reason-q">?</span>
            </div>

            <!-- line 1 · 1/2 (den=2, lineY=120, ½ benchmark called out) -->
            <span class="cmp-line-tag" style="left:4px; top:106px;"><span class="bignum"><span class="n">1</span><span class="bar" style="background:#1f6fd6"></span><span class="d">2</span></span></span>
            <div class="nline" style="top:120px; left:80px; right:auto; width:560px;"></div>
            <span class="nl-fill" style="position:absolute; left:80px; top:115px; width:280px; height:10px; background:rgba(192,57,43,.16); border-radius:5px; pointer-events:none; z-index:5;"></span>
            <span class="ntick is-major" style="left:80px;  top:120px; height:20px; width:2px;   opacity:1;"></span>
            <span class="ntick"          style="left:360px; top:120px; height:12px; width:1.5px; opacity:.72;"></span>
            <span class="ntick is-major" style="left:640px; top:120px; height:20px; width:2px;   opacity:1;"></span>
            <span class="nlab ng" style="left:80px;  top:136px;">0</span>
            <span class="nlab ng" style="left:640px; top:136px;">1</span>
            <span class="nlab"    style="left:360px; top:136px;">1/2</span>
            <span class="ntick nl-half-tick" style="left:360px; top:112px; height:26px; width:3px; opacity:.95;"></span>
            <span class="nlab nl-half-lab" style="left:360px; top:90px;">½</span>
            <span class="nl-point" style="position:absolute; left:360px; top:120px; width:26px; height:26px; margin-left:-13px; margin-top:-13px; border-radius:50%; background:var(--red); border:3px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,.3); z-index:26;"></span>

            <!-- line 2 · 2/3 (den=3, lineY=240, ½ benchmark called out) -->
            <span class="cmp-line-tag" style="left:4px; top:226px;"><span class="bignum"><span class="n">2</span><span class="bar" style="background:#e07b00"></span><span class="d">3</span></span></span>
            <div class="nline" style="top:240px; left:80px; right:auto; width:560px;"></div>
            <span class="nl-fill" style="position:absolute; left:80px; top:235px; width:373px; height:10px; background:rgba(192,57,43,.16); border-radius:5px; pointer-events:none; z-index:5;"></span>
            <span class="ntick is-major" style="left:80px;     top:240px; height:20px; width:2px;   opacity:1;"></span>
            <span class="ntick"          style="left:266.7px; top:240px; height:12px; width:1.5px; opacity:.72;"></span>
            <span class="ntick"          style="left:453.3px; top:240px; height:12px; width:1.5px; opacity:.72;"></span>
            <span class="ntick is-major" style="left:640px;    top:240px; height:20px; width:2px;   opacity:1;"></span>
            <span class="nlab ng" style="left:80px;  top:256px;">0</span>
            <span class="nlab ng" style="left:640px; top:256px;">1</span>
            <span class="nlab"    style="left:453.3px; top:256px;">2/3</span>
            <span class="ntick nl-half-tick" style="left:360px; top:232px; height:26px; width:3px; opacity:.95;"></span>
            <span class="nlab nl-half-lab" style="left:360px; top:210px;">½</span>
            <span class="nl-point" style="position:absolute; left:453.3px; top:240px; width:26px; height:26px; margin-left:-13px; margin-top:-13px; border-radius:50%; background:var(--red); border:3px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,.3); z-index:26;"></span>

            <div class="cmp-reason-note">Each part sits at or past the half-way mark — so the total clears one whole.</div>
          </div>`,

  railHTML: `
          <div class="panel">
            <h3 class="pick-title">Reason — don't compute</h3>
            <div class="hint">No common bottom, no adding. Look at where each part sits: <b>1/2</b> is exactly a half; <b>2/3</b> is past the half. A half plus more-than-a-half is MORE than one whole.</div>
          </div>`,

  answerHTML: `
          <div class="lbar cmp-answer">
            <div class="cmp-ans-row">
              <span class="cmp-ans-prompt">the sum is</span>
              <div class="cmp-choices is-wide">
                <button class="cmp-choice"><span class="cmp-choice-lab">less than 1</span></button>
                <button class="cmp-choice"><span class="cmp-choice-lab">about 1</span></button>
                <button class="cmp-choice"><span class="cmp-choice-lab">more than 1</span></button>
              </div>
              <div class="cmp-ans-marks">
                <button class="check" disabled>Pick one</button>
              </div>
            </div>
            <div class="cmp-ans-cap">pick the size of the sum — without computing</div>
          </div>`,

  tutorHTML: `
          <div class="ltutor">
            <div class="cook-stage">
              <svg width="118" height="156" viewBox="0 0 196 260" style="display:block; overflow:visible;" aria-hidden="true">
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
            <div class="ribbon">Don't add it up — just reason about its size. Is the sum less than 1, about 1, or more than 1?</div>
          </div>`,
};
