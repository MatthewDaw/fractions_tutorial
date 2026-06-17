/* cast.js — shared character art + skill index for Babushka's Kitchen.

   Every kitchen question is built from the SAME template (KitchenScreen.jsx); the
   only per-question art is WHO brought the problem to the counter (the "cook"
   portrait) and Babushka herself (the tutor who narrates / nudges). Those SVGs
   live here ONCE and are referenced by id, so a kitchen question file is pure
   data — no markup. */

/* ── Babushka (the tutor, idle) — speaks the question & the hints ─────────── */
export const BABUSHKA = `
<svg width="118" height="156" viewBox="0 0 196 260" style="display:block; overflow:visible" aria-hidden="true">
  <defs>
    <pattern id="mom-hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.5" /></pattern>
    <pattern id="mom-dots" patternUnits="userSpaceOnUse" width="16" height="16"><circle cx="4" cy="4" r="1.9" fill="var(--paper-1)" opacity="0.9" /><circle cx="12" cy="12" r="1.9" fill="var(--paper-1)" opacity="0.9" /></pattern>
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
  <g stroke="var(--ink)" stroke-width="1.4" fill="var(--red)"><circle cx="60" cy="118" r="3" /><circle cx="136" cy="118" r="3" /></g>
  <circle cx="74" cy="104" r="7.5" fill="var(--red-soft)" opacity="0.7" />
  <circle cx="122" cy="104" r="7.5" fill="var(--red-soft)" opacity="0.7" />
  <g stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round">
    <circle cx="84" cy="91" r="3.6" fill="var(--ink)" stroke="none" />
    <circle cx="112" cy="91" r="3.6" fill="var(--ink)" stroke="none" />
    <path d="M77 86 Q84 83 91 86" fill="none" /><path d="M105 86 Q112 83 119 86" fill="none" />
  </g>
  <path d="M98 96 Q102 103 97 105" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round" />
  <path d="M84 113 Q98 124 112 113 Q98 119 84 113 Z" fill="var(--red)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
  <g stroke="var(--red-deep)" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.65">
    <path d="M84 194 Q80 186 84 180 Q88 174 84 168" /><path d="M112 194 Q116 186 112 180 Q108 174 112 168" />
  </g>
  <ellipse cx="98" cy="214" rx="40" ry="26" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.6" />
  <ellipse cx="98" cy="214" rx="40" ry="26" fill="url(#mom-hatch)" stroke="none" opacity="0.32" />
  <g stroke="var(--red-deep)" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.7"><path d="M80 206 Q98 198 116 206" /><path d="M84 215 Q98 208 112 215" /></g>
  <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round">
    <path d="M50 230 Q50 218 64 221 Q78 224 75 234 Q72 243 60 242 Q51 240 50 230 Z" fill="var(--paper-1)" />
    <path d="M146 230 Q146 218 132 221 Q118 224 121 234 Q124 243 136 242 Q145 240 146 230 Z" fill="var(--paper-1)" />
  </g>
</svg>`;

/* ── The Kid (asking) ─────────────────────────────────────────────────────── */
const KID = `
<svg width="116" height="170" viewBox="0 0 150 220" style="display:block; overflow:visible" aria-hidden="true">
  <defs>
    <pattern id="rh-kid" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--red)" /><line x1="0" y1="0" x2="0" y2="6" stroke="var(--red-deep)" stroke-width="1.4" opacity="0.5" /></pattern>
    <pattern id="lh-kid" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.42" /></pattern>
  </defs>
  <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M40 218 Q36 148 52 134 Q64 124 75 124 Q86 124 98 134 Q114 148 110 218 Z" fill="var(--paper-1)" />
    <path d="M58 134 Q75 142 92 134 L100 218 L50 218 Z" fill="url(#rh-kid)" />
    <path d="M98 138 Q120 124 116 104" fill="none" /><path d="M52 138 Q34 160 32 184" fill="none" />
  </g>
  <circle cx="116" cy="100" r="7" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.2" />
  <circle cx="32" cy="186" r="7" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.2" />
  <circle cx="75" cy="78" r="34" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.6" />
  <path d="M96 60 A34 34 0 0 1 98 96 Q88 100 86 70 Z" fill="url(#lh-kid)" stroke="none" opacity="0.5" />
  <circle cx="60" cy="84" r="1.5" fill="var(--red-soft)" /><circle cx="66" cy="88" r="1.5" fill="var(--red-soft)" /><circle cx="84" cy="88" r="1.5" fill="var(--red-soft)" /><circle cx="90" cy="84" r="1.5" fill="var(--red-soft)" />
  <g fill="var(--ink)"><circle cx="65" cy="74" r="3.2" /><circle cx="86" cy="74" r="3.2" /><path d="M78 62 Q86 58 94 63" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round" /></g>
  <path d="M75 80 q3 5 -1 7" stroke="var(--ink)" stroke-width="1.8" fill="none" stroke-linecap="round" />
  <ellipse cx="75" cy="95" rx="5" ry="6" fill="var(--red-deep)" stroke="var(--ink)" stroke-width="2" />
  <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round">
    <path d="M40 72 Q39 64 42 62 Q32 48 44 42 Q46 32 58 37 Q66 28 76 35 Q86 29 94 37 Q107 34 106 48 Q116 54 108 62 Q111 64 110 72 Q75 65 40 72 Z" fill="var(--paper-2)" />
    <path d="M41 63 Q75 56 109 63 Q110 67 110 72 Q75 65 40 72 Q40 67 41 63 Z" fill="var(--paper-3)" stroke="none" />
    <path d="M41 63 Q75 56 109 63" stroke="var(--ink)" stroke-width="1.6" fill="none" />
    <path d="M45 67 Q75 60 105 67" stroke="var(--red)" stroke-width="1.6" fill="none" opacity="0.85" />
  </g>
</svg>`;

/* ── Grandpa (asking) ─────────────────────────────────────────────────────── */
const GRANDPA = `
<svg width="116" height="170" viewBox="0 0 150 220" style="display:block; overflow:visible" aria-hidden="true">
  <defs><pattern id="lh-gp" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.42" /></pattern></defs>
  <g stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M38 218 Q36 136 56 126 Q66 120 75 120 Q84 120 94 126 Q114 136 112 218 Z" fill="var(--paper-1)" />
    <path d="M52 128 Q42 158 40 186" fill="none" /><path d="M98 128 Q108 158 110 186" fill="none" />
  </g>
  <g stroke="var(--red-deep)" stroke-width="6" fill="none" stroke-linecap="round"><path d="M62 128 L60 218" /><path d="M88 128 L90 218" /></g>
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
  <g fill="var(--ink)">
    <circle cx="62" cy="73" r="2.8" /><circle cx="88" cy="73" r="2.8" />
    <path d="M80 58 Q88 54 96 59" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round" />
    <path d="M54 60 Q60 58 66 60" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round" />
  </g>
  <path d="M54 96 Q62 90 75 94 Q88 90 96 96 Q90 106 75 102 Q60 106 54 96 Z" fill="var(--ink-soft)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
  <ellipse cx="75" cy="108" rx="4.5" ry="5" fill="var(--red-deep)" stroke="var(--ink)" stroke-width="1.8" />
</svg>`;

/* ── The Cat (asking, wordless) ───────────────────────────────────────────── */
const CAT = `
<svg width="116" height="170" viewBox="0 0 150 220" style="display:block; overflow:visible" aria-hidden="true">
  <defs><pattern id="lh-cat" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" stroke-width="0.7" opacity="0.42" /></pattern></defs>
  <path d="M112 196 Q140 188 134 158 Q130 138 116 146" fill="none" stroke="var(--ink)" stroke-width="9" stroke-linecap="round" />
  <path d="M44 210 Q40 142 75 138 Q110 142 106 210 Z" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.6" stroke-linejoin="round" />
  <path d="M44 210 Q40 142 75 138 Q110 142 106 210 Z" fill="url(#lh-cat)" stroke="none" opacity="0.4" />
  <ellipse cx="62" cy="208" rx="9" ry="7" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.2" />
  <ellipse cx="92" cy="178" rx="8" ry="7" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.2" />
  <path d="M58 142 Q75 154 92 142" stroke="var(--red)" stroke-width="6" fill="none" stroke-linecap="round" />
  <path d="M50 96 L46 64 L70 80 Z" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" />
  <path d="M100 96 L104 64 L80 80 Z" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" />
  <circle cx="75" cy="100" r="32" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.6" />
  <path d="M96 84 A32 32 0 0 1 97 118 Q88 120 88 92 Z" fill="url(#lh-cat)" stroke="none" opacity="0.45" />
  <g>
    <ellipse cx="66" cy="98" rx="5" ry="7" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2" />
    <ellipse cx="84" cy="98" rx="5" ry="7" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2" />
    <ellipse cx="66" cy="98" rx="3.4" ry="5" fill="var(--ink)" /><ellipse cx="84" cy="98" rx="3.4" ry="5" fill="var(--ink)" />
  </g>
  <path d="M71 108 L79 108 L75 113 Z" fill="var(--red)" stroke="var(--ink)" stroke-width="1.4" stroke-linejoin="round" />
  <path d="M75 113 L75 117 M75 117 Q70 121 66 119 M75 117 Q80 121 84 119" stroke="var(--ink)" stroke-width="1.8" fill="none" stroke-linecap="round" />
  <g stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" opacity="0.7"><path d="M58 110 L34 106 M58 114 L36 118" /><path d="M92 110 L116 106 M92 114 L114 118" /></g>
</svg>`;

export const CAST = {
  kid:     { art: KID,     name: "the Kid",     note: "brought this one to Babushka's counter." },
  grandpa: { art: GRANDPA, name: "Grandpa",     note: "set this one on Babushka's counter." },
  cat:     { art: CAT,     name: "the Cat",     note: "padded up to the counter with this one." },
};

/* Every lesson gets a kitchen question, in curriculum order. The step strip and
   per-question header derive from this list, so adding a question = adding one
   row here and one tiny data file. (Display name / № / "Learn it" room are read
   live from lessons.js — see lessonOf() in KitchenScreen.) */
export const KITCHEN_SKILLS = [
  { id: "m1",   num: "№1",  skill: "Equal Groups",         room: "room-m1.html" },
  { id: "m3",   num: "№2",  skill: "Times Facts",          room: "room-m3.html" },
  { id: "den",  num: "№3",  skill: "The Bottom Number",    room: "room-den.html" },
  { id: "num",  num: "№4",  skill: "The Top Number",       room: "room-num.html" },
  { id: "nl",   num: "№5",  skill: "Same Denominators",    room: "room-nl.html" },
  { id: "s1",   num: "№6",  skill: "Taking Away",          room: "room-s1.html" },
  { id: "r4",   num: "№7",  skill: "Equivalent Fractions", room: "room-r4-2-bind.html" },
  { id: "simp", num: "№8",  skill: "Simplify",             room: "room-simp.html" },
  { id: "r3",   num: "№9",  skill: "Scale One",            room: "room-r3.html" },
  { id: "r2",   num: "№10", skill: "Cross-Multiply",       room: "room-r2.html" },
  { id: "cmp",  num: "№11", skill: "Compare & Check",      room: "room-cmp.html" },
  { id: "r5",   num: "№12", skill: "Mixed Numbers",        room: "room-r5.html" },
];
