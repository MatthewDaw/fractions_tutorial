// Mom.jsx — "Мама": the mother who needs the dough. A vintage two-tone woodcut
// to match the Cook, but built to read as an entirely DIFFERENT character:
//   • a tied polka-dot headscarf (platok) instead of a chef's toque
//   • a long polka-dot apron over a buttoned blouse instead of a chef coat
//   • both hands cupping a round, steaming fresh-baked loaf instead of a spoon
//   • softer, rounder, motherly proportions; drop earrings; a hair fringe
// Expression states swap eyes/mouth + the rising steam/sparkles.
//   expr: 'idle' | 'think' | 'cheer'
export default function Mom({ expr = "idle", width = 196 }) {
  const ink = "var(--ink)";
  const paper = "var(--paper-1)";
  const paper2 = "var(--paper-2)";
  const red = "var(--red)";
  const redDeep = "var(--red-deep)";
  const cheek = "var(--red-soft)";
  const hair = "#5a3a26";

  return (
    <svg width={width} height={width * (260 / 196)} viewBox="0 0 196 260"
      style={{ display: "block", overflow: "visible" }} aria-hidden="true">
      <defs>
        <pattern id="mom-hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke={ink} strokeWidth="0.7" opacity="0.5" />
        </pattern>
        {/* cream polka dots for the scarf + apron */}
        <pattern id="mom-dots" patternUnits="userSpaceOnUse" width="16" height="16">
          <circle cx="4" cy="4" r="1.9" fill={paper} opacity="0.9" />
          <circle cx="12" cy="12" r="1.9" fill={paper} opacity="0.9" />
        </pattern>
      </defs>

      {/* ================= BODY: blouse + flared skirt ================= */}
      <g stroke={ink} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
        <path d="M34 258 Q30 198 56 174 Q72 160 98 160 Q124 160 140 174 Q166 198 162 258 Z" fill={paper} />
        <path d="M34 258 Q30 206 50 182 L66 258 Z" fill="url(#mom-hatch)" stroke="none" opacity="0.6" />
        <path d="M72 176 Q98 186 124 176 L136 258 L60 258 Z" fill={red} />
        <path d="M72 176 Q98 186 124 176 L136 258 L60 258 Z" fill="url(#mom-dots)" stroke="none" />
        <path d="M66 192 Q98 202 130 192" fill="none" stroke={redDeep} strokeWidth="3" />
        <path d="M84 224 h28 v18 h-28 Z" fill="none" stroke={redDeep} strokeWidth="1.8" opacity="0.7" />
        {/* arms curving down to cup the loaf at her belly */}
        <path d="M56 182 Q42 206 60 226" fill="none" />
        <path d="M140 182 Q154 206 136 226" fill="none" />
      </g>

      {/* ================= NECK + collar ================= */}
      <rect x="86" y="140" width="24" height="22" fill={paper} stroke={ink} strokeWidth="2.4" />
      <path d="M80 150 L98 164 L116 150" fill="none" stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="98" cy="162" r="2.6" fill={red} stroke={ink} strokeWidth="1.2" />

      {/* ================= HEAD ================= */}
      {/* scarf (platok) — framing the face, tied under the chin */}
      <g stroke={ink} strokeWidth="2.5" strokeLinejoin="round">
        <path d="M50 96 Q46 44 98 38 Q150 44 146 96 Q150 132 122 142 L128 154 Q98 162 68 154 L74 142 Q46 132 50 96 Z" fill={red} />
        <path d="M50 96 Q46 44 98 38 Q150 44 146 96 Q150 132 122 142 L128 154 Q98 162 68 154 L74 142 Q46 132 50 96 Z" fill="url(#mom-dots)" stroke="none" />
        <path d="M90 150 Q98 142 106 150 Q98 160 90 150 Z" fill={redDeep} />
        <path d="M58 78 Q98 62 138 78" fill="none" stroke={redDeep} strokeWidth="2.6" />
      </g>

      {/* hair fringe peeking out under the scarf edge */}
      <g fill={hair} stroke={ink} strokeWidth="1.4">
        <path d="M64 80 Q72 72 80 80 Q76 84 70 84 Q66 84 64 80 Z" />
        <path d="M116 80 Q124 72 132 80 Q128 84 122 84 Q118 84 116 80 Z" />
      </g>

      {/* face */}
      <circle cx="98" cy="96" r="38" fill={paper} stroke={ink} strokeWidth="2.6" />
      <path d="M120 82 A38 38 0 0 1 122 120 Q112 122 110 100 Z" fill="url(#mom-hatch)" stroke="none" opacity="0.5" />

      {/* drop earrings just below the scarf */}
      <g stroke={ink} strokeWidth="1.4" fill={red}>
        <circle cx="60" cy="118" r="3" />
        <circle cx="136" cy="118" r="3" />
      </g>

      {/* rosy cheeks */}
      <circle cx="74" cy="104" r="7.5" fill={cheek} opacity="0.7" />
      <circle cx="122" cy="104" r="7.5" fill={cheek} opacity="0.7" />

      {/* eyes */}
      {expr === "cheer" ? (
        <g stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round">
          <path d="M76 90 Q83 82 90 90" />
          <path d="M106 90 Q113 82 120 90" />
        </g>
      ) : expr === "think" ? (
        <g stroke={ink} strokeWidth="2.4" strokeLinecap="round">
          <circle cx="84" cy="90" r="3.4" fill={ink} stroke="none" />
          <circle cx="112" cy="90" r="3.4" fill={ink} stroke="none" />
          <path d="M78 84 Q84 81 90 84" fill="none" />
          <path d="M106 84 Q112 81 118 84" fill="none" />
          <path d="M122 78 Q130 76 136 80" fill="none" strokeWidth="2" />
        </g>
      ) : (
        <g stroke={ink} strokeWidth="2.4" strokeLinecap="round">
          <circle cx="84" cy="91" r="3.6" fill={ink} stroke="none" />
          <circle cx="112" cy="91" r="3.6" fill={ink} stroke="none" />
          <path d="M77 86 Q84 83 91 86" fill="none" />
          <path d="M105 86 Q112 83 119 86" fill="none" />
        </g>
      )}

      {/* nose */}
      <path d="M98 96 Q102 103 97 105" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* mouth — fuller red lips */}
      {expr === "cheer" ? (
        <path d="M82 112 Q98 130 116 112 Q108 122 98 122 Q88 122 82 112 Z" fill={redDeep} stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
      ) : expr === "think" ? (
        <path d="M88 116 Q98 112 108 116" stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M84 113 Q98 124 112 113 Q98 119 84 113 Z" fill={red} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
      )}

      {/* ============ ROUND LOAF cradled directly in both hands ============ */}
      {/* steam wisps rising from the loaf */}
      <g stroke={redDeep} strokeWidth="2" fill="none" strokeLinecap="round" opacity={expr === "think" ? 0.3 : 0.65}
         style={{ transition: "opacity .3s" }}>
        <path d={expr === "cheer" ? "M84 190 Q78 180 84 172 Q90 164 84 156" : "M84 194 Q80 186 84 180 Q88 174 84 168"} />
        <path d={expr === "cheer" ? "M112 190 Q118 180 112 172 Q106 164 112 156" : "M112 194 Q116 186 112 180 Q108 174 112 168"} />
      </g>

      {/* the loaf */}
      <ellipse cx="98" cy="214" rx="40" ry="26" fill={paper2} stroke={ink} strokeWidth="2.6" />
      <ellipse cx="98" cy="214" rx="40" ry="26" fill="url(#mom-hatch)" stroke="none" opacity="0.32" />
      {/* curved score marks on the crust */}
      <g stroke={redDeep} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7">
        <path d="M80 206 Q98 198 116 206" />
        <path d="M84 215 Q98 208 112 215" />
      </g>

      {/* both hands cupping the loaf from beneath (drawn on top of it) */}
      <g stroke={ink} strokeWidth="2.4" strokeLinejoin="round">
        <path d="M50 230 Q50 218 64 221 Q78 224 75 234 Q72 243 60 242 Q51 240 50 230 Z" fill={paper} />
        <path d="M146 230 Q146 218 132 221 Q118 224 121 234 Q124 243 136 242 Q145 240 146 230 Z" fill={paper} />
        {/* finger creases */}
        <path d="M57 226 q7 1 10 6 M61 231 q6 1 9 6" fill="none" strokeWidth="1.3" opacity="0.5" />
        <path d="M139 226 q-7 1 -10 6 M135 231 q-6 1 -9 6" fill="none" strokeWidth="1.3" opacity="0.5" />
      </g>

      {/* sparkles when cheering */}
      {expr === "cheer" && (
        <g stroke={red} strokeWidth="2.2" strokeLinecap="round">
          <line x1="40" y1="70" x2="40" y2="82" /><line x1="34" y1="76" x2="46" y2="76" />
          <line x1="158" y1="92" x2="158" y2="104" /><line x1="152" y1="98" x2="164" y2="98" />
        </g>
      )}
    </svg>
  );
}
