/* title — RawScreen (one-off scene). Inner-#stage markup captured
   verbatim from the original static screen. Edit shared chrome in LessonScreen
   does NOT apply here; this scene owns its full body. */
export default {
  kind: "raw",
  title: "Title",
  route: "#/",
  bodyHTML: `
<div class="scene titlescreen ready" data-vox-speaker="cook">
      <div class="paper-fill" style="position:absolute;inset:0"></div>
      <div class="foxing"></div>
      <div class="frame"></div>

      <!-- Corners() -->
      <div class="corner tl">
        <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
          <path d="M2 28 L2 9 Q2 2 9 2 L28 2" fill="none" stroke="var(--ink)" stroke-width="1.8" />
          <path d="M6 28 L6 12 Q6 6 12 6 L28 6" fill="none" stroke="var(--red)" stroke-width="1.2" opacity="0.7" />
          <circle cx="6" cy="6" r="2.4" fill="var(--red)" />
          <path d="M11 6 q5 0 6 5" fill="none" stroke="var(--ink)" stroke-width="1" opacity="0.5" />
        </svg>
      </div>
      <div class="corner tr">
        <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
          <path d="M2 28 L2 9 Q2 2 9 2 L28 2" fill="none" stroke="var(--ink)" stroke-width="1.8" />
          <path d="M6 28 L6 12 Q6 6 12 6 L28 6" fill="none" stroke="var(--red)" stroke-width="1.2" opacity="0.7" />
          <circle cx="6" cy="6" r="2.4" fill="var(--red)" />
          <path d="M11 6 q5 0 6 5" fill="none" stroke="var(--ink)" stroke-width="1" opacity="0.5" />
        </svg>
      </div>
      <div class="corner bl">
        <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
          <path d="M2 28 L2 9 Q2 2 9 2 L28 2" fill="none" stroke="var(--ink)" stroke-width="1.8" />
          <path d="M6 28 L6 12 Q6 6 12 6 L28 6" fill="none" stroke="var(--red)" stroke-width="1.2" opacity="0.7" />
          <circle cx="6" cy="6" r="2.4" fill="var(--red)" />
          <path d="M11 6 q5 0 6 5" fill="none" stroke="var(--ink)" stroke-width="1" opacity="0.5" />
        </svg>
      </div>
      <div class="corner br">
        <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
          <path d="M2 28 L2 9 Q2 2 9 2 L28 2" fill="none" stroke="var(--ink)" stroke-width="1.8" />
          <path d="M6 28 L6 12 Q6 6 12 6 L28 6" fill="none" stroke="var(--red)" stroke-width="1.2" opacity="0.7" />
          <circle cx="6" cy="6" r="2.4" fill="var(--red)" />
          <path d="M11 6 q5 0 6 5" fill="none" stroke="var(--ink)" stroke-width="1" opacity="0.5" />
        </svg>
      </div>

      <!-- giant ghosted fraction motif behind everything -->
      <div class="ghost-half rv d3">½</div>

      <!-- left type block -->
      <div class="title-block">
        <div class="kicker rv d1"><span class="k-dot"></span>Moscow Puzzles · No.&nbsp;1</div>
        <h1 class="ru-title rv d2" style="font-size:82px;margin-top:16px">Babushka&rsquo;s</h1>
        <h1 class="ru-title rv d3" style="font-size:120px;color:var(--red);margin-top:-8px" data-vox="titleWelcome">Fractions</h1>
        <div class="subtitle-row rv d4">
          <span class="cyr-sub">Бабушкины доли</span>
          <span class="latin-sub">Babushkiny Doli</span>
        </div>
        <div class="gloss rv d4" style="font-size:21px;margin-top:12px;max-width:540px">
          Slice the dough and <span class="gloss-em">add up the shares.</span>
        </div>

        <!-- hero strip equation -->
        <div class="strip-eq rv pop d5">
          <div class="fstrip" style="width:150px;height:48px">
            <div class="pc on"></div>
            <div class="pc off"></div>
          </div>
          <span class="op">+</span>
          <div class="fstrip" style="width:150px;height:48px">
            <div class="pc on"></div>
            <div class="pc off"></div>
            <div class="pc off"></div>
          </div>
          <span class="op">=</span>
          <span class="q"><span class="qbounce">?</span></span>
        </div>

        <div class="rv pop d6" style="margin-top:34px">
          <a class="start" href="world.html">
            <span class="s-ru">Let&rsquo;s Slice!</span>
            <span class="s-en">Начать · let&rsquo;s add fractions</span>
          </a>
        </div>
      </div>

      <!-- character cluster bottom-right (Babushka front; Kid offset right of the Cat) -->
      <div class="grp-floor"></div>

      <!-- Cook expr="idle" width=120 -->
      <div class="fig rv figIn d5 bob3" style="left:828px;bottom:104px;width:120px;z-index:1">
        <svg width="120" height="159.18" viewBox="0 0 196 260" style="display:block;overflow:visible" aria-hidden="true">
          <defs>
            <pattern id="ck-hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.5" />
            </pattern>
            <pattern id="ck-hatch-r" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(-45)">
              <line x1="0" y1="0" x2="0" y2="5" stroke="var(--red-deep)" stroke-width="0.8" opacity="0.45" />
            </pattern>
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

      <!-- Grandpa expr="happy" width=150 -->
      <div class="fig rv figIn d5 bob2" style="left:876px;bottom:86px;width:150px;z-index:3">
        <svg width="150" height="220" viewBox="0 0 150 220" style="display:block;overflow:visible">
          <defs>
            <pattern id="rh-gp" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="var(--red)" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--red-deep)" stroke-width="1.4" opacity="0.5" />
            </pattern>
            <pattern id="lh-gp" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.42" />
            </pattern>
          </defs>
          <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
            <path d="M38 218 Q36 136 56 126 Q66 120 75 120 Q84 120 94 126 Q114 136 112 218 Z" fill="var(--paper-1)" />
            <path d="M52 128 Q42 158 40 186" fill="none" />
            <path d="M98 128 Q108 158 110 186" fill="none" />
          </g>
          <g stroke="var(--red-deep)" stroke-width="6" fill="none" stroke-linecap="round">
            <path d="M62 128 L60 218" /><path d="M88 128 L90 218" />
          </g>
          <circle cx="38" cy="188" r="7" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.2" />
          <circle cx="112" cy="188" r="7" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.2" />
          <circle cx="75" cy="76" r="35" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.6" />
          <path d="M98 58 A35 35 0 0 1 99 96 Q90 100 88 70 Z" fill="url(#lh-gp)" stroke="none" opacity="0.5" />
          <path d="M54 56 Q44 53 41 61 Q32 60 33 70 Q27 73 32 81 Q31 90 41 88 Q49 86 50 77 Q48 67 54 60 Z" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round" />
          <path d="M40 64 q2 9 0 18 M46 62 q1 9 0 17" stroke="var(--ink)" stroke-width="1.2" fill="none" opacity="0.5" stroke-linecap="round" />
          <path d="M96 56 Q106 53 109 61 Q118 60 117 70 Q123 73 118 81 Q119 90 109 88 Q101 86 100 77 Q102 67 96 60 Z" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round" />
          <path d="M110 64 q-2 9 0 18 M104 62 q-1 9 0 17" stroke="var(--ink)" stroke-width="1.2" fill="none" opacity="0.5" stroke-linecap="round" />
          <g stroke="var(--ink)" stroke-width="2.2" fill="none">
            <circle cx="62" cy="72" r="11" fill="var(--paper-1)" fill-opacity="0.4" />
            <circle cx="88" cy="72" r="11" fill="var(--paper-1)" fill-opacity="0.4" />
            <line x1="73" y1="72" x2="77" y2="72" />
          </g>
          <g stroke="var(--ink)" stroke-width="2.2" fill="none" stroke-linecap="round">
            <path d="M56 73 Q62 68 68 73" /><path d="M82 73 Q88 68 94 73" />
          </g>
          <path d="M54 96 Q62 90 75 94 Q88 90 96 96 Q90 106 75 102 Q60 106 54 96 Z" fill="var(--ink-soft)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
          <path d="M54 96 Q62 90 75 94 Q88 90 96 96 Q90 106 75 102 Q60 106 54 96 Z" fill="url(#lh-gp)" stroke="none" opacity="0.6" />
          <path d="M64 104 Q75 114 86 104" stroke="var(--red-deep)" stroke-width="2.6" fill="none" stroke-linecap="round" />
          <g stroke="var(--red)" stroke-width="2" stroke-linecap="round">
            <line x1="118" y1="44" x2="118" y2="54" /><line x1="113" y1="49" x2="123" y2="49" />
          </g>
        </svg>
      </div>

      <!-- Kid expr="happy" width=116 -->
      <div class="fig rv figIn d6 bob3" style="left:1140px;bottom:92px;width:116px;z-index:3">
        <svg width="116" height="170.13" viewBox="0 0 150 220" style="display:block;overflow:visible">
          <defs>
            <pattern id="rh-kid" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="var(--red)" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--red-deep)" stroke-width="1.4" opacity="0.5" />
            </pattern>
            <pattern id="lh-kid" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.42" />
            </pattern>
          </defs>
          <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
            <path d="M40 218 Q36 148 52 134 Q64 124 75 124 Q86 124 98 134 Q114 148 110 218 Z" fill="var(--paper-1)" />
            <path d="M58 134 Q75 142 92 134 L100 218 L50 218 Z" fill="url(#rh-kid)" />
            <path d="M98 138 Q118 158 120 184" fill="none" />
            <path d="M52 138 Q34 160 32 184" fill="none" />
          </g>
          <circle cx="120" cy="186" r="7" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.2" />
          <circle cx="32" cy="186" r="7" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.2" />
          <circle cx="75" cy="78" r="34" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.6" />
          <path d="M96 60 A34 34 0 0 1 98 96 Q88 100 86 70 Z" fill="url(#lh-kid)" stroke="none" opacity="0.5" />
          <circle cx="60" cy="84" r="1.5" fill="var(--red-soft)" />
          <circle cx="66" cy="88" r="1.5" fill="var(--red-soft)" />
          <circle cx="84" cy="88" r="1.5" fill="var(--red-soft)" />
          <circle cx="90" cy="84" r="1.5" fill="var(--red-soft)" />
          <g stroke="var(--ink)" stroke-width="2.4" fill="none" stroke-linecap="round">
            <path d="M58 74 Q64 67 70 74" /><path d="M80 74 Q86 67 92 74" />
          </g>
          <path d="M75 80 q3 5 -1 7" stroke="var(--ink)" stroke-width="1.8" fill="none" stroke-linecap="round" />
          <path d="M62 92 Q75 106 88 92 Q80 99 75 99 Q70 99 62 92 Z" fill="var(--red-deep)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
          <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round">
            <path d="M40 72 Q39 64 42 62 Q32 48 44 42 Q46 32 58 37 Q66 28 76 35 Q86 29 94 37 Q107 34 106 48 Q116 54 108 62 Q111 64 110 72 Q75 65 40 72 Z" fill="var(--paper-2)" />
            <path d="M40 72 Q39 64 42 62 Q32 48 44 42 Q46 32 58 37 Q66 28 76 35 Q86 29 94 37 Q107 34 106 48 Q116 54 108 62 Q111 64 110 72 Q75 65 40 72 Z" fill="url(#lh-kid)" stroke="none" opacity="0.26" />
            <path d="M41 63 Q75 56 109 63 Q110 67 110 72 Q75 65 40 72 Q40 67 41 63 Z" fill="var(--paper-3)" stroke="none" />
            <path d="M41 63 Q75 56 109 63" stroke="var(--ink)" stroke-width="1.6" fill="none" />
            <path d="M45 67 Q75 60 105 67" stroke="var(--red)" stroke-width="1.6" fill="none" opacity="0.85" />
            <path d="M60 39 Q61 49 59 57 M76 36 Q73 48 75 57 M93 39 Q92 49 92 57" stroke="var(--ink)" stroke-width="1.2" fill="none" opacity="0.45" />
          </g>
          <g stroke="var(--red)" stroke-width="2" stroke-linecap="round">
            <line x1="120" y1="40" x2="120" y2="50" /><line x1="115" y1="45" x2="125" y2="45" />
          </g>
        </svg>
      </div>

      <!-- Cat expr="happy" width=130 -->
      <div class="fig rv figIn d6 bob2" style="left:1064px;bottom:50px;width:130px;z-index:6">
        <svg width="130" height="190.67" viewBox="0 0 150 220" style="display:block;overflow:visible">
          <defs>
            <pattern id="lh-cat" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.42" />
            </pattern>
          </defs>
          <path d="M112 196 Q140 188 134 158 Q130 138 116 146" fill="none" stroke="var(--ink)" stroke-width="9" stroke-linecap="round" />
          <path d="M112 196 Q140 188 134 158 Q130 138 116 146" fill="none" stroke="url(#lh-cat)" stroke-width="5" stroke-linecap="round" opacity="0.5" />
          <path d="M44 210 Q40 142 75 138 Q110 142 106 210 Z" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.6" stroke-linejoin="round" />
          <path d="M44 210 Q40 142 75 138 Q110 142 106 210 Z" fill="url(#lh-cat)" stroke="none" opacity="0.4" />
          <ellipse cx="62" cy="208" rx="9" ry="7" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.2" />
          <ellipse cx="90" cy="208" rx="9" ry="7" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.2" />
          <path d="M58 142 Q75 154 92 142" stroke="var(--red)" stroke-width="6" fill="none" stroke-linecap="round" />
          <circle cx="75" cy="151" r="3.4" fill="var(--red-deep)" stroke="var(--ink)" stroke-width="1.4" />
          <path d="M50 96 L46 64 L70 80 Z" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" />
          <path d="M100 96 L104 64 L80 80 Z" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" />
          <path d="M52 70 L50 86 M98 70 L100 86" stroke="var(--red-soft)" stroke-width="3" stroke-linecap="round" />
          <circle cx="75" cy="100" r="32" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.6" />
          <path d="M96 84 A32 32 0 0 1 97 118 Q88 120 88 92 Z" fill="url(#lh-cat)" stroke="none" opacity="0.45" />
          <g stroke="var(--ink)" stroke-width="2.4" fill="none" stroke-linecap="round">
            <path d="M60 98 Q66 92 72 98" /><path d="M78 98 Q84 92 90 98" />
          </g>
          <path d="M71 108 L79 108 L75 113 Z" fill="var(--red)" stroke="var(--ink)" stroke-width="1.4" stroke-linejoin="round" />
          <path d="M75 113 Q68 120 62 116 M75 113 Q82 120 88 116" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round" />
          <g stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.7">
            <path d="M58 110 L34 106 M58 114 L36 118" />
            <path d="M92 110 L116 106 M92 114 L114 118" />
          </g>
          <g stroke="var(--red)" stroke-width="2" stroke-linecap="round">
            <line x1="116" y1="62" x2="116" y2="72" /><line x1="111" y1="67" x2="121" y2="67" />
          </g>
        </svg>
      </div>

      <!-- Mom expr="cheer" width=248 -->
      <div class="fig rv figIn d5 bob" style="left:944px;bottom:66px;width:248px;z-index:5">
        <svg width="248" height="328.98" viewBox="0 0 196 260" style="display:block;overflow:visible" aria-hidden="true">
          <defs>
            <pattern id="mom-hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.5" />
            </pattern>
            <pattern id="mom-dots" patternUnits="userSpaceOnUse" width="16" height="16">
              <circle cx="4" cy="4" r="1.9" fill="var(--paper-1)" opacity="0.9" />
              <circle cx="12" cy="12" r="1.9" fill="var(--paper-1)" opacity="0.9" />
            </pattern>
          </defs>
          <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
            <path d="M34 258 Q30 198 56 174 Q72 160 98 160 Q124 160 140 174 Q166 198 162 258 Z" fill="var(--paper-1)" />
            <path d="M34 258 Q30 206 50 182 L66 258 Z" fill="url(#mom-hatch)" stroke="none" opacity="0.6" />
            <path d="M72 176 Q98 186 124 176 L136 258 L60 258 Z" fill="var(--red)" />
            <path d="M72 176 Q98 186 124 176 L136 258 L60 258 Z" fill="url(#mom-dots)" stroke="none" />
            <path d="M66 192 Q98 202 130 192" fill="none" stroke="var(--red-deep)" stroke-width="3" />
            <path d="M84 224 h28 v18 h-28 Z" fill="none" stroke="var(--red-deep)" stroke-width="1.8" opacity="0.7" />
            <path d="M56 182 Q42 206 60 226" fill="none" />
            <path d="M140 182 Q154 206 136 226" fill="none" />
          </g>
          <rect x="86" y="140" width="24" height="22" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.4" />
          <path d="M80 150 L98 164 L116 150" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round" />
          <circle cx="98" cy="162" r="2.6" fill="var(--red)" stroke="var(--ink)" stroke-width="1.2" />
          <g stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round">
            <path d="M50 96 Q46 44 98 38 Q150 44 146 96 Q150 132 122 142 L128 154 Q98 162 68 154 L74 142 Q46 132 50 96 Z" fill="var(--red)" />
            <path d="M50 96 Q46 44 98 38 Q150 44 146 96 Q150 132 122 142 L128 154 Q98 162 68 154 L74 142 Q46 132 50 96 Z" fill="url(#mom-dots)" stroke="none" />
            <path d="M90 150 Q98 142 106 150 Q98 160 90 150 Z" fill="var(--red-deep)" />
            <path d="M58 78 Q98 62 138 78" fill="none" stroke="var(--red-deep)" stroke-width="2.6" />
          </g>
          <g fill="#5a3a26" stroke="var(--ink)" stroke-width="1.4">
            <path d="M64 80 Q72 72 80 80 Q76 84 70 84 Q66 84 64 80 Z" />
            <path d="M116 80 Q124 72 132 80 Q128 84 122 84 Q118 84 116 80 Z" />
          </g>
          <circle cx="98" cy="96" r="38" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.6" />
          <path d="M120 82 A38 38 0 0 1 122 120 Q112 122 110 100 Z" fill="url(#mom-hatch)" stroke="none" opacity="0.5" />
          <g stroke="var(--ink)" stroke-width="1.4" fill="var(--red)">
            <circle cx="60" cy="118" r="3" />
            <circle cx="136" cy="118" r="3" />
          </g>
          <circle cx="74" cy="104" r="7.5" fill="var(--red-soft)" opacity="0.7" />
          <circle cx="122" cy="104" r="7.5" fill="var(--red-soft)" opacity="0.7" />
          <g stroke="var(--ink)" stroke-width="2.6" fill="none" stroke-linecap="round">
            <path d="M76 90 Q83 82 90 90" />
            <path d="M106 90 Q113 82 120 90" />
          </g>
          <path d="M98 96 Q102 103 97 105" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round" />
          <path d="M82 112 Q98 130 116 112 Q108 122 98 122 Q88 122 82 112 Z" fill="var(--red-deep)" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round" />
          <g stroke="var(--red-deep)" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.65">
            <path d="M84 190 Q78 180 84 172 Q90 164 84 156" />
            <path d="M112 190 Q118 180 112 172 Q106 164 112 156" />
          </g>
          <ellipse cx="98" cy="214" rx="40" ry="26" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.6" />
          <ellipse cx="98" cy="214" rx="40" ry="26" fill="url(#mom-hatch)" stroke="none" opacity="0.32" />
          <g stroke="var(--red-deep)" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.7">
            <path d="M80 206 Q98 198 116 206" />
            <path d="M84 215 Q98 208 112 215" />
          </g>
          <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round">
            <path d="M50 230 Q50 218 64 221 Q78 224 75 234 Q72 243 60 242 Q51 240 50 230 Z" fill="var(--paper-1)" />
            <path d="M146 230 Q146 218 132 221 Q118 224 121 234 Q124 243 136 242 Q145 240 146 230 Z" fill="var(--paper-1)" />
            <path d="M57 226 q7 1 10 6 M61 231 q6 1 9 6" fill="none" stroke-width="1.3" opacity="0.5" />
            <path d="M139 226 q-7 1 -10 6 M135 231 q-6 1 -9 6" fill="none" stroke-width="1.3" opacity="0.5" />
          </g>
          <g stroke="var(--red)" stroke-width="2.2" stroke-linecap="round">
            <line x1="40" y1="70" x2="40" y2="82" /><line x1="34" y1="76" x2="46" y2="76" />
            <line x1="158" y1="92" x2="158" y2="104" /><line x1="152" y1="98" x2="164" y2="98" />
          </g>
        </svg>
      </div>

      <!-- Shell .fab-bar (appears on title screen) -->
      <div class="fab-bar">
        <a class="settings-fab concepts-fab" href="concepts.html" title="Concept Mastery Map" aria-label="Concepts">
          <span class="settings-fab-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style="display:block">
              <rect x="2" y="3" width="20" height="6" rx="1" fill="none" stroke="#1c1612" stroke-width="2" />
              <rect x="5" y="13" width="14" height="5" rx="1" fill="none" stroke="#a32a22" stroke-width="2" />
              <rect x="8" y="20" width="8" height="3" rx="1" fill="#a32a22" />
            </svg>
          </span>
          <span class="settings-fab-label">Concepts</span>
        </a>
        <a class="settings-fab" href="settings.html" title="Settings" aria-label="Settings">
          <span class="settings-fab-label">Settings</span>
        </a>
      </div>

    </div>
`,
};
