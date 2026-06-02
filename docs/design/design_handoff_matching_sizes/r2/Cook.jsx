// Cook.jsx — the tutor: a vintage two-tone woodcut of a friendly cook ("Кухарка").
// Drawn as engraved line-art (ink on paper + a red apron/kerchief) so it sits
// inside the Moscow-Puzzles printed-page world. Expression states swap the
// eyes/mouth and a small prop.
//   expr: 'idle' | 'think' | 'cheer'
const Cook = ({ expr = "idle", width = 196 }) => {
  const ink = "var(--ink)";
  const paper = "var(--paper-1)";
  const paper2 = "var(--paper-2)";
  const red = "var(--red)";
  const redDeep = "var(--red-deep)";
  const cheek = "var(--red-soft)";

  return (
    <svg width={width} height={width * (260 / 196)} viewBox="0 0 196 260"
      style={{ display: "block", overflow: "visible" }} aria-hidden="true">
      <defs>
        <pattern id="ck-hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke={ink} strokeWidth="0.7" opacity="0.5" />
        </pattern>
        <pattern id="ck-hatch-r" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(-45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke={redDeep} strokeWidth="0.8" opacity="0.45" />
        </pattern>
      </defs>

      {/* ---- BODY: chef coat ---- */}
      <g stroke={ink} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
        {/* coat */}
        <path d="M44 258 Q40 188 58 168 Q72 154 98 154 Q124 154 138 168 Q156 188 152 258 Z"
          fill={paper} />
        {/* apron front (red) */}
        <path d="M74 168 Q98 178 122 168 L130 258 L66 258 Z" fill={red} />
        <path d="M74 168 Q98 178 122 168 L130 258 L66 258 Z" fill="url(#ck-hatch-r)" stroke="none" />
        {/* coat lapel + buttons */}
        <path d="M98 156 L98 258" stroke={ink} strokeWidth="1.4" opacity="0.5" fill="none" />
        {/* shading hatch on left of coat */}
        <path d="M44 258 Q40 200 54 176 L70 258 Z" fill="url(#ck-hatch)" stroke="none" opacity="0.7" />
        {/* arms */}
        <path d="M58 172 Q34 186 30 214" fill="none" />
        <path d="M138 172 Q162 186 166 214" fill="none" />
      </g>
      {/* coat buttons */}
      {[182, 200, 218].map((y) => (
        <circle key={y} cx="98" cy={y} r="2.6" fill={paper} stroke={ink} strokeWidth="1.4" />
      ))}

      {/* hands */}
      <circle cx="28" cy="218" r="9" fill={paper} stroke={ink} strokeWidth="2.4" />
      <circle cx="168" cy="218" r="9" fill={paper} stroke={ink} strokeWidth="2.4" />

      {/* a wooden spoon in the right hand (raised when cheering) */}
      <g transform={expr === "cheer" ? "rotate(-26 168 218)" : "rotate(6 168 218)"}
         style={{ transition: "transform .35s cubic-bezier(.34,1.56,.64,1)" }}>
        <line x1="168" y1="216" x2="186" y2="176" stroke={redDeep} strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="188" cy="170" rx="8" ry="11" fill={paper2} stroke={ink} strokeWidth="2.2"
          transform="rotate(18 188 170)" />
      </g>

      {/* ---- NECK ---- */}
      <rect x="86" y="138" width="24" height="22" fill={paper} stroke={ink} strokeWidth="2.4" />
      {/* red kerchief */}
      <path d="M78 150 Q98 166 118 150 L112 138 Q98 146 84 138 Z" fill={red} stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />

      {/* ---- HEAD ---- */}
      {/* hair tufts */}
      <g fill={redDeep} stroke={ink} strokeWidth="2">
        <path d="M58 92 Q50 104 56 116 Q62 108 66 110 Z" />
        <path d="M138 92 Q146 104 140 116 Q134 108 130 110 Z" />
      </g>
      {/* face */}
      <circle cx="98" cy="92" r="40" fill={paper} stroke={ink} strokeWidth="2.6" />
      {/* cheek shading hatch (right side) */}
      <path d="M122 78 A40 40 0 0 1 124 116 Q112 120 110 96 Z" fill="url(#ck-hatch)" stroke="none" opacity="0.55" />

      {/* cheeks */}
      <circle cx="74" cy="100" r="7" fill={cheek} opacity="0.7" />
      <circle cx="122" cy="100" r="7" fill={cheek} opacity="0.7" />

      {/* eyes */}
      {expr === "cheer" ? (
        <g stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round">
          <path d="M76 86 Q83 78 90 86" />
          <path d="M106 86 Q113 78 120 86" />
        </g>
      ) : expr === "think" ? (
        <g>
          <circle cx="83" cy="86" r="3.4" fill={ink} />
          <circle cx="113" cy="86" r="3.4" fill={ink} />
          {/* raised brow */}
          <path d="M104 74 Q113 70 122 74" stroke={ink} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <circle cx="83" cy="87" r="3.6" fill={ink} />
          <circle cx="113" cy="87" r="3.6" fill={ink} />
        </g>
      )}

      {/* nose */}
      <path d="M98 92 Q102 99 97 101" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* mouth */}
      {expr === "cheer" ? (
        <path d="M82 108 Q98 126 116 108 Q108 116 98 116 Q88 116 82 108 Z" fill={redDeep} stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
      ) : expr === "think" ? (
        <ellipse cx="98" cy="112" rx="6" ry="7" fill={redDeep} stroke={ink} strokeWidth="2.2" />
      ) : (
        <path d="M84 108 Q98 120 112 108" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      )}

      {/* ---- TOQUE (chef hat) ---- */}
      <g stroke={ink} strokeWidth="2.6" strokeLinejoin="round">
        {/* band */}
        <rect x="64" y="52" width="68" height="16" rx="3" fill={paper2} />
        {/* puffs */}
        <path d="M64 56 Q50 52 52 36 Q40 30 50 18 Q58 6 76 12 Q86 0 104 8 Q124 2 130 18 Q150 22 144 38 Q152 52 132 56 Q132 40 120 44 Q120 30 104 34 Q104 22 88 28 Q84 40 72 38 Q74 52 64 56 Z"
          fill={paper} />
      </g>
      {/* toque shading */}
      <path d="M120 44 Q132 40 132 56 L120 56 Z" fill="url(#ck-hatch)" stroke="none" opacity="0.5" />

      {/* sparkle when cheering */}
      {expr === "cheer" && (
        <g stroke={red} strokeWidth="2.2" strokeLinecap="round" style={{ transformOrigin: "152px 30px" }}>
          <line x1="152" y1="20" x2="152" y2="32" />
          <line x1="146" y1="26" x2="158" y2="26" />
          <line x1="36" y1="74" x2="36" y2="84" />
          <line x1="31" y1="79" x2="41" y2="79" />
        </g>
      )}
    </svg>
  );
};
window.Cook = Cook;
