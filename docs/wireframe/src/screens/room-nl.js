/* room-nl — №6 Same Denominators · Stage 1 "Place" (AppNumberLine, #/nl).
   REFACTORED: a single reusable 1/4 block, dragged onto the line over and over
   to GROW the fraction — 1/4, 2/4, 3/4 — stopping at three fourths. Every block
   is the unit fraction "1/4" (identical); only the running TOTAL on the line
   counts up. The block is dragged FROM the side explainer (a little tray) onto
   the line. Snapshot: bar grown to 2/4, a ghost "+1/4" slot showing the next
   drop that reaches 3/4. */
export default {
  kind: "lesson",
  backHref: "shelf-build.html",
  introHref: "intro.html",
  returnHref: "kitchen.html",

  lesson: "nl",

  goalHTML: `Grow a fraction from unit pieces. Drag the <b>1/4</b> block onto the line again
    and again — the bar grows <b>1/4</b>, <b>2/4</b>, <b>3/4</b> — stop at three fourths.`,

  railW: 396,
  footH: 196,

  stageHTML: `
          <div class="canvas nl-blk-canvas" id="nlcanvas">
            <!-- number line: 0 → 1 whole, span 480px from ORIGIN 96, ticks every 1/4 -->
            <div class="nline" style="top:258px;left:96px;right:auto;width:480px"></div>
            <span class="ntick is-major" style="left:96px;top:258px;height:16px"></span>
            <span class="ntick" style="left:216px;top:258px;height:9px"></span>
            <span class="ntick" style="left:336px;top:258px;height:9px"></span>
            <span class="ntick" style="left:456px;top:258px;height:9px"></span>
            <span class="ntick is-major" style="left:576px;top:258px;height:16px"></span>
            <span class="nlab ng" style="left:96px;top:272px">0</span>
            <span class="nlab nl-partlab" style="left:216px;top:272px">1/4</span>
            <span class="nlab nl-partlab" style="left:336px;top:272px">2/4</span>
            <span class="nlab nl-partlab" style="left:456px;top:272px">3/4</span>
            <span class="nlab ng" style="left:576px;top:272px">1</span>

            <!-- grown SO FAR: two identical 1/4 pieces filling 0→2/4 on the line.
                 btag shows the running total (2/4); pieces are each the unit 1/4. -->
            <div class="nbar" style="left:96px;top:186px;width:240px">
              <div class="btag"><div class="bignum"><span class="n">2</span><span class="bar" style="background:#0a9396"></span><span class="d">4</span></div></div>
              <div class="plank lit" style="width:240px">
                <div class="plank-body">
                  <div class="piece" style="width:120px;background:#0a9396;border-right:1.5px solid rgba(237,226,200,0.55)">
                    <div class="piece-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px)"></div>
                    <span class="piece-lab" style="color:#ede2c8;font-size:15px">1/4</span>
                    <span class="cut-tick top" style="background:rgba(237,226,200,0.55)"></span>
                    <span class="cut-tick bot" style="background:rgba(237,226,200,0.55)"></span>
                  </div>
                  <div class="piece" style="width:120px;background:#0a9396;border-right:none">
                    <div class="piece-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px)"></div>
                    <span class="piece-lab" style="color:#ede2c8;font-size:15px">1/4</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ghost slot: where the NEXT 1/4 drops → grows the bar to 3/4 -->
            <div class="nl-ghost-slot" style="left:336px;top:186px;width:120px;height:72px">
              <span class="nl-ghost-lab">+1/4</span>
            </div>
          </div>`,

  railHTML: `
    <div class="panel">
      <h3 class="pick-title">Build Three Fourths</h3>
      <div class="hint">
        Drag the <b>1/4</b> block onto the line, again and again. Each drop grows the
        bar one fourth — <b>1/4</b>, <b>2/4</b>, <b>3/4</b>. Stop when the bar reaches
        <b>three fourths</b>.
      </div>
      <div class="nl-drag-source">
        <div class="nl-src-plank">
          <div class="plank lit" style="width:104px">
            <div class="plank-body" style="height:56px">
              <div class="piece" style="width:104px;background:#0a9396;border-right:none">
                <div class="piece-hatch" style="background-image:repeating-linear-gradient(45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(237,226,200,0.34) 0 1px, transparent 1px 6px)"></div>
                <span class="piece-lab" style="color:#ede2c8;font-size:16px">1/4</span>
              </div>
            </div>
          </div>
          <div class="grip" style="position:static;opacity:.5"><i></i><i></i><i></i></div>
        </div>
        <span class="nl-src-hint">drag onto the line →</span>
      </div>
    </div>`,

  answerHTML: `
    <div class="lbar">
      <div class="lbar-eq">
        <span class="nl-ans-frac"><div class="bignum"><span class="n">3</span><span class="bar" style="background:#0a9396;"></span><span class="d">4</span></div></span>
        <span class="nl-ans-eq">=</span>
        <span class="nl-ans-amt">grow the bar with 1/4 blocks — 2/4 so far</span>
      </div>
      <div class="lbar-cap">drop one more 1/4 to reach three fourths</div>
      <div class="lbar-marks">
        <button class="check" disabled>Add 1/4</button>
      </div>
    </div>`,

  tutorHTML: `
    <div class="ltutor">
      <div class="cook-stage">
        <svg width="118" height="156.5" viewBox="0 0 196 260" style="display:block; overflow:visible;" aria-hidden="true">
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
      <div class="ribbon">Drag the 1/4 block onto the line — 1/4, 2/4, 3/4. Stop when you reach three fourths.</div>
    </div>`,
};
