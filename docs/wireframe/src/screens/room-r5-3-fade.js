/* room-r5-3-fade — №10 Mixed Numbers · Fade · Stage 3 (#/r5).
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
              <div class="canvas r5-canvas r5-ghost-board" id="r5canvas">
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

                <div class="r5-overflow" style="left:60px; top:24px; width:100px;">
                  <div class="r5-col-tag">
                    <div class="bignum"><span class="n">9</span><span class="bar" style="background:#5a4fcf;"></span><span class="d">7</span></div>
                  </div>
                  <div class="r5-dropcue" style="position:static; transform:none; margin-top:8px; opacity:.7;">all grouped ✓</div>
                </div>

                <div id="r5-frame" class="r5-frame is-locked" style="left:340px; top:92px; width:300px; height:88px;">
                  <div class="r5-frame-lab"><span class="r5-whole-stamp">1 whole</span></div>
                  <div class="r5-frame-fill">
                    <div class="r5-block is-locked" style="background:#5a4fcf;"><div class="r5-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div></div>
                    <div class="r5-block is-locked" style="background:#5a4fcf;"><div class="r5-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div></div>
                    <div class="r5-block is-locked" style="background:#5a4fcf;"><div class="r5-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div></div>
                    <div class="r5-block is-locked" style="background:#5a4fcf;"><div class="r5-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div></div>
                    <div class="r5-block is-locked" style="background:#5a4fcf;"><div class="r5-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div></div>
                    <div class="r5-block is-locked" style="background:#5a4fcf;"><div class="r5-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div></div>
                    <div class="r5-block is-locked" style="background:#5a4fcf;"><div class="r5-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div></div>
                  </div>
                </div>

                <div class="r5-tray is-hot" style="left:340px; top:260px; width:300px; height:72px;">
                  <div class="r5-tray-lab">
                    <div class="bignum"><span class="n">2</span><span class="bar" style="background:#5a4fcf;"></span><span class="d-wrap"><span class="d">7</span><span class="lockmark"><svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="1.5" fill="none" stroke="var(--ink-mute)" stroke-width="2"/><path d="M8 11 V8 a4 4 0 0 1 8 0 V11" fill="none" stroke="var(--ink-mute)" stroke-width="2"/></svg></span></span></div>
                  </div>
                  <div class="r5-tray-fill">
                    <div class="r5-block is-locked" style="width:42.857px; background:#5a4fcf;"><div class="r5-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div><span class="r5-lab" style="color:#ede2c8;">1/7</span></div>
                    <div class="r5-block is-locked" style="width:42.857px; background:#5a4fcf;"><div class="r5-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px);"></div><span class="r5-lab" style="color:#ede2c8;">1/7</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>`,

  railHTML: `
          <div class="panel">
            <h3>How Many Wholes?</h3>
            <div class="hint">The blocks are just a faint check now. 7 pieces make one whole — how many whole units fit inside 9/7?</div>
            <div class="r5-pick" role="group" aria-label="how many wholes fit">
              <button class="r5-pick-btn" aria-pressed="false">0</button>
              <button class="r5-pick-btn" aria-pressed="false">1</button>
              <button class="r5-pick-btn" aria-pressed="false">2</button>
            </div>
            <div class="r5-card-note">9 ÷ 7 = 1 remainder 2. The wholes are the whole number; the remainder over 7 is the leftover.</div>
          </div>`,

  answerHTML: `
          <div class="lbar">
            <div class="lbar-eq">
              <div class="r5-ans-eqrow">
                <span class="r5-ans-frac">9/7</span>
                <span class="r5-ans-op">=</span>
                <div class="r5-write">
                  <div class="r5-write-whole">
                    <div class="slate slate-row is-disabled" role="group" aria-label="how many wholes">
                      <div class="slate-slot is-disabled">
                        <div class="slate-cell">
                          <canvas class="slate-canvas" role="img" aria-label="write the wholes digit"></canvas>
                          <span class="slate-ph" aria-hidden="true"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span class="r5-and">and</span>
                  <div class="r5-write-frac">
                    <div class="slate slate-fraction is-disabled" role="group" aria-label="leftover fraction">
                      <div class="slate-slot is-disabled">
                        <div class="slate-cell">
                          <canvas class="slate-canvas" role="img" aria-label="write the leftover digit"></canvas>
                          <span class="slate-ph" aria-hidden="true"></span>
                        </div>
                      </div>
                      <span class="slate-bar" style="background:#5a4fcf;" aria-hidden="true"></span>
                      <div class="slate-slot is-locked">
                        <div class="slate-cell" aria-label="size: 7"><span class="slate-fixed">7</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="lbar-cap">choose how many wholes fit, then write</div>
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
            <div class="ribbon">"The blocks are just a faint check now. Choose how many wholes fit, then write the mixed number."</div>
          </div>`,
};
