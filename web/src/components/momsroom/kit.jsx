// kit.jsx — shared drawing kit for Babushka's Room prop assets.
// Locks the woodcut two-tone skin: warm paper, ink line-art, muted-red accent.
// Ported from the design contact-sheet bundle (window globals → ES exports).
//
// Exports: C (palette), useUID, AssetDefs, Ruler, Twine, STAGE (shared viewBox).
import { useId } from "react";

// ── palette (CSS-var backed) ─────────────────────────────────────────────
export const C = {
  paper1: "var(--paper-1)", paper2: "var(--paper-2)", paper3: "var(--paper-3)",
  ink: "var(--ink)", inkSoft: "var(--ink-soft)", inkMute: "var(--ink-mute)",
  red: "var(--red)", redDeep: "var(--red-deep)", redSoft: "var(--red-soft)",
};

// Shared stage geometry every prop draws on (was window.__stage in the bundle).
export const STAGE = { VB: "0 0 340 220", X0: 30, X1: 310, RY: 182, LEN: 280 };

// React.useId, colon-stripped so it's a valid SVG id fragment.
export function useUID() {
  return useId().replace(/[:]/g, "");
}

// ── shared <defs>: hatch patterns + bevels, namespaced by uid ─────────────
// Place <AssetDefs uid={u}/> once inside the <svg>, then fill with
// url(#rh-${u}) (red diag hatch), ih (ink cross), lh (light ink), dot, stip,
// and the bevelT gradient.
export function AssetDefs({ uid }) {
  const ink = C.ink, red = C.redDeep;
  return (
    <defs>
      {/* red diagonal hatch (one quantity) */}
      <pattern id={`rh-${uid}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
        <rect width="6" height="6" fill={C.red} />
        <line x1="0" y1="0" x2="0" y2="6" stroke={red} strokeWidth="1.4" opacity="0.5" />
      </pattern>
      {/* ink cross-hatch (the other quantity) on paper */}
      <pattern id={`ih-${uid}`} patternUnits="userSpaceOnUse" width="6" height="6">
        <rect width="6" height="6" fill={C.paper2} />
        <path d="M0 0 L6 6 M0 6 L6 0" stroke={ink} strokeWidth="0.8" opacity="0.45" />
      </pattern>
      {/* light single ink hatch (shading) */}
      <pattern id={`lh-${uid}`} patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="5" stroke={ink} strokeWidth="0.7" opacity="0.42" />
      </pattern>
      {/* docking dots (crackers / pastry) */}
      <pattern id={`dot-${uid}`} patternUnits="userSpaceOnUse" width="13" height="13">
        <circle cx="6.5" cy="6.5" r="1.1" fill={ink} opacity="0.5" />
      </pattern>
      {/* a warm fill for dough/pastry */}
      <pattern id={`stip-${uid}`} patternUnits="userSpaceOnUse" width="7" height="7">
        <rect width="7" height="7" fill={C.paper2} />
        <circle cx="2" cy="2" r="0.8" fill={ink} opacity="0.32" />
        <circle cx="5.5" cy="5" r="0.7" fill={ink} opacity="0.26" />
      </pattern>
      <linearGradient id={`bevelT-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.30" />
        <stop offset="0.18" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="0.82" stopColor="#000000" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.22" />
      </linearGradient>
    </defs>
  );
}

// ── Ruler / number-line — the shared element the pieces sit on ────────────
// one full length (x0→x1) = one whole. Ticks at each i/n; 0 and 1 are taller.
export function Ruler({ x0 = 30, x1 = 310, y = 182, n = 8, labels = true }) {
  const len = x1 - x0;
  const ticks = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + (len * i) / n;
    const big = i === 0 || i === n;
    ticks.push(
      <line key={i} x1={x} y1={y} x2={x} y2={y - (big ? 13 : 7)}
        stroke={C.ink} strokeWidth={big ? 2.4 : 1.4} strokeLinecap="round"
        opacity={big ? 1 : 0.62} />
    );
  }
  return (
    <g>
      <line x1={x0 - 4} y1={y} x2={x1 + 4} y2={y} stroke={C.ink} strokeWidth="2.4" strokeLinecap="round" />
      {ticks}
      {labels && (
        <g style={{ font: "italic 12px var(--serif)", fill: C.inkMute }}>
          <text x={x0} y={y + 18} textAnchor="middle">0</text>
          <text x={x1} y={y + 18} textAnchor="middle">1</text>
        </g>
      )}
    </g>
  );
}

// ── Twine band — wraps a bundle (assets 9, 10) ────────────────────────────
export function Twine({ x, y, w, h = 12 }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="2" fill={C.red} stroke={C.redDeep} strokeWidth="1.6" />
      <path d={`M${x} ${y + 2} q${w / 2} 5 ${w} 0 M${x} ${y + h - 2} q${w / 2} 5 ${w} 0`}
        stroke={C.redDeep} strokeWidth="0.9" fill="none" opacity="0.55" />
      <path d={`M${x + w / 2 - 7} ${y - 6} l7 6 l7 -6`} stroke={C.redDeep} strokeWidth="1.6" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
}
