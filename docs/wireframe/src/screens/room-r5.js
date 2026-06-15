/* room-r5 — №10 Mixed Numbers · Manipulate, Stage 1 (AppR5, #/r5).
   Data-only module consumed by <LessonScreen>. The chrome (toolbar, topbar,
   tabs, goal, board grid) is the shared component; only the unique content
   below lives here. Interactive markup is verbatim from the original screen. */
export default {
  kind: "lesson",
  lesson: "r5",

  railW: 372,
  footH: 198,

  stageHTML: `
          <div class="fit-stage r5-board-fit">
            <div class="fit-stage-content" style="transform: scale(1);">
              <div class="canvas r5-canvas" id="r5canvas">
                <!-- ruler 0→2 (the answer overflows past 1); UNIT=300, ORIGIN=60, LINE_Y=322 -->
                <div class="nline" style="top:322px; left:60px; right:auto; width:600px;"></div>
                <span class="ntick" style="left:60px;  top:322px; height:14px;"></span>
                <span class="ntick" style="left:103px; top:322px; height:7px;"></span>
                <span class="ntick" style="left:146px; top:322px; height:7px;"></span>
                <span class="ntick" style="left:189px; top:322px; height:7px;"></span>
                <span class="ntick" style="left:231px; top:322px; height:7px;"></span>
                <span class="ntick" style="left:274px; top:322px; height:7px;"></span>
                <span class="ntick" style="left:317px; top:322px; height:7px;"></span>
                <span class="ntick" style="left:360px; top:322px; height:14px;"></span>
                <span class="ntick" style="left:403px; top:322px; height:7px;"></span>
                <span class="ntick" style="left:446px; top:322px; height:7px;"></span>
                <span class="ntick" style="left:489px; top:322px; height:7px;"></span>
                <span class="ntick" style="left:531px; top:322px; height:7px;"></span>
                <span class="ntick" style="left:574px; top:322px; height:7px;"></span>
                <span class="ntick" style="left:617px; top:322px; height:7px;"></span>
                <span class="ntick" style="left:660px; top:322px; height:14px;"></span>
                <span class="nlab ng" style="left:60px;  top:334px;">0</span>
                <span class="nlab"    style="left:446px; top:334px;">9/7</span>
                <span class="nlab ng" style="left:360px; top:334px;">1</span>
                <span class="nlab ng" style="left:660px; top:334px;">2</span>

                <!-- OVERFLOW COLUMN — 9 sevenths still to be grouped (placed=0) -->
                <div class="r5-overflow" style="left:60px; top:24px; width:100px;">
                  <div class="r5-col-tag">
                    <div class="bignum"><span class="n">9</span><span class="bar" style="background:#5a4fcf;"></span><span class="d">7</span></div>
                  </div>
                  <!-- first block is the grabbable one; the rest read as locked stack -->
                  <div class="r5-block is-grabbing" style="width:100px; background:#5a4fcf;" role="button" tabindex="0" aria-label="one 7th — move into the whole unit">
                    <div class="r5-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div>
                    <span class="r5-lab" style="color:#ede2c8;">1/7</span>
                  </div>
                  <div class="r5-block is-grabbing is-locked" style="width:100px; background:#5a4fcf;"><div class="r5-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div><span class="r5-lab" style="color:#ede2c8;">1/7</span></div>
                  <div class="r5-block is-grabbing is-locked" style="width:100px; background:#5a4fcf;"><div class="r5-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div><span class="r5-lab" style="color:#ede2c8;">1/7</span></div>
                  <div class="r5-block is-grabbing is-locked" style="width:100px; background:#5a4fcf;"><div class="r5-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div><span class="r5-lab" style="color:#ede2c8;">1/7</span></div>
                  <div class="r5-block is-grabbing is-locked" style="width:100px; background:#5a4fcf;"><div class="r5-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div><span class="r5-lab" style="color:#ede2c8;">1/7</span></div>
                  <div class="r5-block is-grabbing is-locked" style="width:100px; background:#5a4fcf;"><div class="r5-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div><span class="r5-lab" style="color:#ede2c8;">1/7</span></div>
                  <div class="r5-block is-grabbing is-locked" style="width:100px; background:#5a4fcf;"><div class="r5-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div><span class="r5-lab" style="color:#ede2c8;">1/7</span></div>
                  <div class="r5-block is-grabbing is-locked" style="width:100px; background:#5a4fcf;"><div class="r5-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div><span class="r5-lab" style="color:#ede2c8;">1/7</span></div>
                  <div class="r5-block is-grabbing is-locked" style="width:100px; background:#5a4fcf;"><div class="r5-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div><span class="r5-lab" style="color:#ede2c8;">1/7</span></div>
                </div>

                <!-- WHOLE-UNIT FRAME — empty (placed=0), the "fill with 7 pieces" hint -->
                <div id="r5-frame" class="r5-frame" style="left:340px; top:92px; width:300px; height:88px;">
                  <div class="r5-frame-lab"><span class="r5-frame-hint">whole-unit frame — fill with 7 pieces</span></div>
                  <div class="r5-frame-fill"></div>
                  <div class="r5-dropcue">drop a piece here</div>
                </div>

                <!-- LEFTOVER TRAY — empty until the whole locks -->
                <div class="r5-tray" style="left:340px; top:260px; width:300px; height:72px;">
                  <div class="r5-tray-lab"><span class="r5-frame-hint">leftover tray</span></div>
                </div>

                <!-- "Group a piece" affordance (keyboard-assist; pointer drags the block) -->
                <button class="joinbtn" style="left:60px; top:310px;">▸ Drag a piece into the whole</button>
              </div>
            </div>
          </div>`,

  railHTML: `
          <div class="panel">
            <h3>Group into Wholes</h3>
            <div class="hint">7 same-size pieces make one whole. Fill the frame to lock a whole; the pieces left over are the fraction part.</div>
            <div class="r5-card">
              <div class="r5-card-row">
                <span class="r5-mini-frame">
                  <span class="r5-mini-block"></span><span class="r5-mini-block"></span><span class="r5-mini-block"></span><span class="r5-mini-block"></span><span class="r5-mini-block"></span><span class="r5-mini-block"></span><span class="r5-mini-block"></span>
                </span>
                <span>= 1 whole</span>
              </div>
              <div class="r5-card-note">9 ÷ 7 = 1 remainder 2. The wholes are the whole number; the remainder over 7 is the leftover fraction.</div>
            </div>
          </div>`,

  answerHTML: `
          <div class="lbar">
            <div class="lbar-eq">
              <div class="r5-ans-eqrow">
                <span class="r5-ans-frac">9/7</span>
                <span class="r5-ans-op">=</span>
                <span class="r5-mixed"><span class="r5-touch-cue">group the blocks</span></span>
              </div>
            </div>
            <div class="lbar-cap">group every 7 pieces into a whole — by touch</div>
            <div class="lbar-marks">
              <button class="check" disabled>Group it ▸</button>
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
            <div class="ribbon">"Nine sevenths — more than one whole. Drag pieces into the whole-unit frame until it fills. No writing yet."</div>
          </div>`,
};
