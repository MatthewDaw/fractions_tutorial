/* room-m1-6-applied — №1 Equal Groups · Applied (Stage 6, #/m1).
   Word-problem step using the wide word-problem layout: story card + setup gate
   in the stage column (matches real-app AppM1 Applied beat which uses WordProblem
   in variant="wide" LessonBoard). The Cook + ribbon remain in the tutor slot. */
export default {
  kind: "lesson",
  lesson: "m1",

  stageHTML: `
          <!-- WordProblem card: story text + count×size setup gate (mirrors real-app Applied beat) -->
          <div class="wp-card" style="margin:20px 24px;border:1px solid var(--ink);border-radius:6px;padding:18px 20px;background:var(--paper-2);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <div class="wp-tag" style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.55;">Babushka's Kitchen</div>
              <button type="button" class="speaker" style="font-size:12px;display:flex;align-items:center;gap:5px;">
                <svg width="14" height="12" viewBox="0 0 16 14"><path d="M1 5 H4 L8 1 V13 L4 9 H1 Z" fill="var(--red)"></path><path d="M11 4 Q14 7 11 10" stroke="var(--red)" stroke-width="1.4" fill="none"></path></svg>
                Read aloud
              </button>
            </div>
            <p class="wp-story" style="font-size:16px;line-height:1.5;margin:0 0 16px;">The little cook set out <b>3 plates</b>, then put <b>4 pelmeni</b> on every plate. How many pelmeni in all?</p>
          </div>
          <div class="wp-setup" style="padding:0 24px 12px;">
            <div class="wp-setup-lead" style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.55;margin-bottom:8px;">First, write it as count × size</div>
            <div class="wp-setup-row" style="display:flex;align-items:center;gap:12px;">
              <div class="m1-setup-row">
                <div class="slate slate-row" role="group" aria-label="how many groups">
                  <div class="slate-slot">
                    <div class="slate-cell">
                      <canvas class="slate-canvas" role="img" aria-label="write the groups digit"></canvas>
                      <span class="slate-ph" aria-hidden="true">✎</span>
                    </div>
                  </div>
                </div>
                <span class="m1-setup-times">×</span>
                <div class="slate slate-row" role="group" aria-label="how many in each group">
                  <div class="slate-slot">
                    <div class="slate-cell">
                      <canvas class="slate-canvas" role="img" aria-label="write the in each digit"></canvas>
                      <span class="slate-ph" aria-hidden="true">✎</span>
                    </div>
                  </div>
                </div>
                <button type="button" class="wp-check">Check the setup</button>
              </div>
            </div>
          </div>`,

  answerHTML: `
            <div class="wp-answer" style="padding:8px 24px 12px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.55;margin-bottom:8px;">Now write the total</div>
              <div class="wp-answer-row">
                <div class="slate slate-row is-disabled" role="group" aria-label="write the total">
                  <div class="slate-slot is-disabled">
                    <div class="slate-cell">
                      <canvas class="slate-canvas" role="img" aria-label="write the total digit"></canvas>
                      <span class="slate-ph" aria-hidden="true"></span>
                    </div>
                  </div>
                </div>
                <button type="button" class="wp-check" disabled>Check</button>
              </div>
            </div>`,

  tutorHTML: `
          <div class="ltutor">
            <div class="cook-stage">
              <svg width="118" height="156.5" viewBox="0 0 196 260" style="display:block;overflow:visible" aria-hidden="true">
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
            <div class="ribbon">A question in words, with the numbers shown. Write it as count × size first (3 × 4), then give the total.</div>
          </div>`,
};
