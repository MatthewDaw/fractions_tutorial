// Knife.jsx — a chef's knife marked with the cut it makes (×2, ×3, ×4).
// Straight spine on top, vertical heel, broad belly tapering to the tip,
// thick riveted handle carrying the ×N mark — so it reads as a real knife.
const Knife = ({ n = 2, dragging = false, onGrab, hint = false, scale = 1 }) => {
  const ink = "var(--ink)";
  const paper = "var(--paper-1)";
  const red = "var(--red)";
  const W = 232, H = 84;
  return (
    <svg
      width={W * scale} height={H * scale} viewBox={`0 0 ${W} ${H}`}
      onPointerDown={onGrab}
      className={`knife ${dragging ? "is-drag" : ""} ${hint ? "is-hint" : ""}`}
      style={{ display: "block", touchAction: "none", cursor: dragging ? "grabbing" : "grab", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`kn-blade-${n}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5efdc" />
          <stop offset="0.4" stopColor="#ddd0ad" />
          <stop offset="1" stopColor="#ab9468" />
        </linearGradient>
        <pattern id={`kn-hatch-${n}`} patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke={ink} strokeWidth="0.6" opacity="0.4" />
        </pattern>
      </defs>

      {/* ---- BLADE: straight spine (top), vertical heel (right), belly to tip (left) ---- */}
      <path d="M14 30 L150 18 L150 60 Q80 70 14 30 Z"
        fill={`url(#kn-blade-${n})`} stroke={ink} strokeWidth="2.6" strokeLinejoin="round" />
      {/* spine line + shine */}
      <path d="M22 30 L150 21" stroke={ink} strokeWidth="1.1" opacity="0.4" />
      <path d="M26 34 L148 27" stroke="#ffffff" strokeWidth="1.6" opacity="0.55" />
      {/* sharpened edge highlight along the belly */}
      <path d="M16 31 Q80 66 150 58" stroke="#fffaf0" strokeWidth="1.4" opacity="0.5" fill="none" />
      {/* maker's hatch at the heel */}
      <path d="M126 26 h22 v30 h-22 Z" fill={`url(#kn-hatch-${n})`} stroke="none" opacity="0.4" />

      {/* bolster */}
      <rect x="149" y="16" width="12" height="46" rx="3" fill={paper} stroke={ink} strokeWidth="2.6" />

      {/* ---- HANDLE (thick, riveted), marked with the cut ---- */}
      <path d="M161 18 L214 23 Q226 25 226 39 Q226 53 214 55 L161 60 Z"
        fill={red} stroke={ink} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M161 18 L214 23 Q226 25 226 39 Q226 53 214 55 L161 60 Z"
        fill={`url(#kn-hatch-${n})`} stroke="none" opacity="0.28" />
      <circle cx="173" cy="39" r="2.8" fill={paper} stroke={ink} strokeWidth="1.3" />
      <text x="198" y="46" textAnchor="middle"
        style={{ font: "700 22px var(--display)", fill: paper, letterSpacing: "0.01em" }}>×{n}</text>
    </svg>
  );
};
window.Knife = Knife;
