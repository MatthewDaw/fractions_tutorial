/* room-m1-4-workbench — №1 Equal Groups · Workbench (Stage 4, #/m1).
   Data-only module consumed by <LessonScreen>. The chrome (toolbar, topbar,
   tabs, board grid) is the shared component; only the unique content below
   lives here.

   Real-app: BlockSandbox mode="number", bin=[4,5,3], target=12 (3 groups of 4).
   The child stacks equal-size scoops on a number line until the row reaches the
   flag at 12. Distractor sizes 5 and 3 appear in the bin alongside the correct 4. */
export default {
  kind: "lesson",
  lesson: "m1",

  railW: 360,
  footH: 160,

  goalHTML: `Babushka has <b>3 plates</b>, and she wants the <b>same 4 pelmeni</b> on every plate — add the group again and again, or multiply.`,

  stageHTML: `
          <div class="canvas m1-canvas" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; padding:20px 24px;">
            <div class="m1-board-head">Build <b>3 equal groups of 4</b> — pick a scoop size from the bin</div>

            <!-- BlockSandbox number-line representation -->
            <div style="width:100%; max-width:560px;">
              <!-- Number line track with placed blocks (3 groups of 4 filled) -->
              <div style="position:relative; height:52px; background:var(--paper-2); border:2px solid var(--ink); border-radius:6px; overflow:hidden; margin-bottom:6px;">
                <!-- 3 placed blocks of size 4 (each 4/12 = 33.3% of track) -->
                <div style="position:absolute; left:0; top:6px; width:33.3%; height:40px; background:var(--red); border:2px solid var(--red-deep); border-radius:4px; display:flex; align-items:center; justify-content:center; color:var(--paper-1); font-weight:700; font-size:14px; box-sizing:border-box;">4</div>
                <div style="position:absolute; left:33.3%; top:6px; width:33.3%; height:40px; background:var(--red); border:2px solid var(--red-deep); border-radius:4px; display:flex; align-items:center; justify-content:center; color:var(--paper-1); font-weight:700; font-size:14px; box-sizing:border-box;">4</div>
                <div style="position:absolute; left:66.6%; top:6px; width:33.4%; height:40px; background:var(--red); border:2px solid var(--red-deep); border-radius:4px; display:flex; align-items:center; justify-content:center; color:var(--paper-1); font-weight:700; font-size:14px; box-sizing:border-box;">4</div>
                <!-- target flag -->
                <div style="position:absolute; right:0; top:0; bottom:0; width:3px; background:var(--ink);"></div>
              </div>
              <!-- tick marks / count labels -->
              <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--ink); opacity:0.6; padding:0 2px; max-width:560px;">
                <span>0</span><span>4</span><span>8</span><span>12 ✓</span>
              </div>
            </div>

            <!-- Bin of scoops (size options: 4, 5, 3) -->
            <div style="display:flex; gap:10px; align-items:center; margin-top:6px;">
              <span style="font-size:12px; color:var(--ink); opacity:0.7;">bin:</span>
              <button style="padding:8px 18px; background:var(--red); color:var(--paper-1); border:2px solid var(--red-deep); border-radius:6px; font-weight:700; font-size:15px; cursor:pointer;">+4</button>
              <button style="padding:8px 18px; background:var(--paper-2); color:var(--ink); border:2px solid var(--ink); border-radius:6px; font-weight:700; font-size:15px; cursor:pointer; opacity:0.6;">+5</button>
              <button style="padding:8px 18px; background:var(--paper-2); color:var(--ink); border:2px solid var(--ink); border-radius:6px; font-weight:700; font-size:15px; cursor:pointer; opacity:0.6;">+3</button>
            </div>
            <div style="font-size:12px; color:var(--ink); opacity:0.6;">3 groups of 4 — target reached!</div>
          </div>`,

  railHTML: `
          <div class="panel">
            <h3>Workbench</h3>
            <div class="hint">Build 3 equal groups out of 4-piece scoops, all the same size, until the row reaches the flag.</div>
            <div class="m1-lockcard">
              <span class="m1-lockcard-x">×</span>
              <div class="m1-lockcard-note">count the groups,<br />not the numbers</div>
            </div>
          </div>`,

  answerHTML: `
          <div class="lbar">
            <div class="lbar-marks">
              <button class="check" disabled>Build it ▸</button>
            </div>
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
                <g transform="rotate(-6 168 218)">
                  <line x1="168" y1="216" x2="150" y2="176" stroke="var(--red-deep)" stroke-width="4" stroke-linecap="round" />
                  <ellipse cx="148" cy="170" rx="8" ry="11" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.2" transform="rotate(-18 148 170)" />
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
            <div class="ribbon">The Workbench — build 3 equal groups of 4 from the bin, all the same size, then read the count.</div>
          </div>`,
};
