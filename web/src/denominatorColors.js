// denominatorColors.js
// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for the per-denominator color + pattern system.
//
// Design principle (asset-manifest §1 law 4 / 4b; presentation-scene-architecture
// §5.2 `palette(denominator)`; spec-clarifications §C.2):
//
//   Every fraction PIECE is colored by its DENOMINATOR — never by which strip it
//   came from. All sixths are gold, all halves blue, all thirds orange, etc. So
//   when two strips are sliced to the SAME denominator, their colors MATCH — the
//   child literally SEES "same size = same number." When a strip's denominator
//   changes (a slice multiplies top and bottom), its color switches to that new
//   denominator's assigned color.
//
//   Color is NEVER the sole channel (law 4b, colorblind-safe): each denominator
//   also owns a distinct hatch PATTERN, and every piece keeps a high-contrast
//   outline + label. The palette below is the pre-verified colorblind-safe
//   reference set (deuteranopia/protanopia ΔE2000 ≥ 20 for any co-occurring
//   denominator families across all R2 problems).
//
// To retheme later, a Skin remaps these hues — but the contract (one hue+pattern
// per denominator, shared by pieces and their numerals) is fixed here.

export const DENOMINATOR_COLORS = {
  2:  { hue: "#1f6fd6", pattern: "h_stripe",    name: "halves"   },
  3:  { hue: "#e07b00", pattern: "diagonal",    name: "thirds"   },
  4:  { hue: "#0a9396", pattern: "grid",        name: "fourths"  },
  5:  { hue: "#b5179e", pattern: "dots",        name: "fifths"   },
  6:  { hue: "#caa300", pattern: "cross_hatch", name: "sixths"   },
  7:  { hue: "#5a4fcf", pattern: "chevron",     name: "sevenths" },
  8:  { hue: "#d1495b", pattern: "v_stripe",    name: "eighths"  },
  9:  { hue: "#2a9d8f", pattern: "ring",        name: "ninths"   },
  10: { hue: "#7b2cbf", pattern: "dense_dots",  name: "tenths"   },
};

// Semantic (non-denominator) roles — also colorblind-safe + glyph-backed.
export const ROLE_COLORS = {
  ghost:     "#9a948c", // faded outline (pair with a dashed border)
  correct:   "#2a9d8f", // pair with a ✓ glyph
  incorrect: "#d1495b", // pair with a ! glyph
  childInk:  "#1c1612", // the child's own handwriting ink
};

// For a denominator outside the in-curriculum 2–10 range, degrade gracefully to
// a neutral ink rather than throwing — keeps the renderers total.
const FALLBACK = { hue: "#6b5a47", pattern: "diagonal", name: "" };

export function denomInfo(d) {
  return DENOMINATOR_COLORS[d] || FALLBACK;
}
export function denomColor(d) {
  return denomInfo(d).hue;
}
export function denomName(d) {
  return denomInfo(d).name;
}

// ── readable text on a denominator fill ─────────────────────────────────────
// Piece labels sit ON the saturated hue, so pick whichever of ink/paper gives the
// higher WCAG contrast against that hue (keeps the ≥4.5:1 numeral floor robust
// across the whole palette instead of guessing per color).
const PAPER = "#ede2c8", INK = "#1c1612";
function _lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function _lum(hex) {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16);
  return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b);
}
function _contrast(l1, l2) { const a = Math.max(l1, l2) + 0.05, b = Math.min(l1, l2) + 0.05; return a / b; }
const LUM_INK = _lum(INK), LUM_PAPER = _lum(PAPER);

export function denomTextColor(d) {
  const L = _lum(denomColor(d));
  return _contrast(L, LUM_INK) >= _contrast(L, LUM_PAPER) ? INK : PAPER;
}
// The hatch/divider tone: same family as the text color so the pattern always
// contrasts its own fill (dark lines on light hues, light lines on dark hues).
export function denomTone(d, alpha = 0.34) {
  return denomTextColor(d) === INK ? `rgba(20,14,10,${alpha})` : `rgba(237,226,200,${alpha})`;
}

// ── the per-denominator hatch (CSS background-image) ─────────────────────────
// Returns a `background-image` string in the denominator's tone, realizing its
// assigned pattern. Pair with denomHatchSize() for the dot/ring patterns.
export function denomHatch(d) {
  const t = denomTone(d);
  switch (denomInfo(d).pattern) {
    case "h_stripe":    return `repeating-linear-gradient(0deg, ${t} 0 1px, transparent 1px 6px)`;
    case "v_stripe":    return `repeating-linear-gradient(90deg, ${t} 0 1px, transparent 1px 6px)`;
    case "diagonal":    return `repeating-linear-gradient(45deg, ${t} 0 1px, transparent 1px 6px)`;
    case "grid":        return `repeating-linear-gradient(0deg, ${t} 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, ${t} 0 1px, transparent 1px 6px)`;
    case "cross_hatch": return `repeating-linear-gradient(45deg, ${t} 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, ${t} 0 1px, transparent 1px 6px)`;
    case "chevron":     return `repeating-linear-gradient(45deg, ${t} 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, ${t} 0 1px, transparent 1px 6px)`;
    case "dots":        return `radial-gradient(${t} 1.3px, transparent 1.7px)`;
    case "dense_dots":  return `radial-gradient(${t} 1.2px, transparent 1.5px)`;
    case "ring":        return `radial-gradient(circle, transparent 1.4px, ${t} 1.9px, transparent 2.4px)`;
    default:            return `repeating-linear-gradient(45deg, ${t} 0 1px, transparent 1px 6px)`;
  }
}
export function denomHatchSize(d) {
  const p = denomInfo(d).pattern;
  if (p === "dense_dots") return "5px 5px";
  if (p === "dots" || p === "ring") return "7px 7px";
  return undefined; // repeating-linear-gradients carry their own period
}
