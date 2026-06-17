/* kitchen/primitives.jsx — the shared manipulative primitives for Babushka's
 * Kitchen, ported faithfully from the wireframe so the app's kitchen tools can
 * reuse the EXACT same SVG geometry + classes.
 *
 * ── COMPONENT vs STRING-HELPER ────────────────────────────────────────────────
 * Every primitive here is a STRING-RETURNING helper (it returns an HTML/SVG
 * string), exactly as in the wireframe (manip.js / eqBox.js / answer.js). That is
 * a deliberate choice:
 *   • the wireframe authored them as strings, so porting verbatim preserves the
 *     geometry/classes 1:1 (no JSX-translation drift, no SVG-comment issues);
 *   • the kitchen tool stubs render via dangerouslySetInnerHTML, so strings drop
 *     straight in;
 *   • a later tool agent can either (a) keep the string + attach event handlers to
 *     the rendered DOM, or (b) re-author a single primitive as a real React
 *     component WITHOUT touching the others — the call sites all take the same
 *     args. If you convert one to a component, expose it as e.g. `JarC` and leave
 *     the string `jar()` in place for the others.
 *
 * The ONE React component exported is `KitchenHtml` — a thin wrapper that renders
 * any of these strings into the tree. Tool stubs use it.
 *
 * NOTE: these strings use CSS custom properties (var(--red) etc.) and classes
 * (kq-*, eq-*, slate-*, cmp-*, s1-*) styled by styles/kitchen.css plus the app's
 * existing momsroom.css / cmp.css / slate.css. Import styles/kitchen.css wherever
 * a tool renders.
 */

import { prepHtmlSafe } from "./prepHtml.js";

/* ── KitchenHtml — render a primitive string into the React tree ────────────── */
export function KitchenHtml({ html, className, style }) {
  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: prepHtmlSafe(html) }}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * manip.js primitives — jars / plums / trays / pickles
 * ════════════════════════════════════════════════════════════════════════════ */

export const plum = () => `<span class="kq-plum"></span>`;
export const tray = (items) => `<div class="kq-tray">${items}</div>`;
export const rep = (n, fn) => Array.from({ length: n }, fn).join("");

/* a pickle — flat green capsule with a gentle downward bend. */
export const pickle = () =>
  `<svg viewBox="0 0 48 26" class="kq-pickle" aria-hidden="true"><path d="M8 6 Q24 12 40 6 Q47 11 40 17 Q24 23 8 17 Q1 11 8 6 Z" fill="#6f7f3a" stroke="#4f5a26" stroke-width="2" stroke-linejoin="round" /></svg>`;

/* a pebble — small filled circle used in the m3 lesson jar clusters. */
export const pebble = () =>
  `<svg viewBox="0 0 32 32" class="kq-pebble" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="#d1495b" stroke="#a33040" stroke-width="2"/></svg>`;

/* a jar holding k plums (clustered positions) */
const JARPLUMS = {
  0: [], 1: [[28, 52]], 2: [[20, 52], [36, 52]],
  3: [[28, 38], [20, 55], [36, 55]], 4: [[20, 40], [36, 40], [20, 56], [36, 56]],
};
export const jar = (k = 0) => `<svg viewBox="0 0 56 76" class="kq-jar" aria-hidden="true">
  <rect x="9" y="13" width="38" height="9" rx="2" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.2" />
  <path d="M11 22 H45 V66 a8 8 0 0 1 -8 8 H19 a8 8 0 0 1 -8 -8 Z" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2.4" />
  ${(JARPLUMS[k] || []).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="var(--red)" stroke="var(--red-deep)" stroke-width="1.6" />`).join("")}
</svg>`;

/* ════════════════════════════════════════════════════════════════════════════
 * eqBox.js primitives — the shared equivalence square + fraction glyphs + picker
 * ════════════════════════════════════════════════════════════════════════════ */

/* eqBox(cols, rows, shaded, opts) — the equivalence square. The shaded AREA is
 * always shaded/cols of the box; the fraction shown is (shaded*rows)/(cols*rows). */
export function eqBox(cols, rows, shaded, { cls = "", guide = false } = {}) {
  let cells = "";
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      cells += `<div class="eq-cell${c < shaded ? " is-on" : ""}"></div>`;
  const edge = guide
    ? `<div class="eq-guide-edge" style="left:calc(${(shaded / cols) * 100}% - 1px)"></div>`
    : "";
  return `<div class="eq-box ${cls}${guide ? " is-guide" : ""}" style="grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr)">${cells}${edge}</div>`;
}

/* cellBox(n, k) — the "build a fraction" square: n equal cells, the first k inked.
 * Grid is the fewest columns ≥ √n that divide n (so n tiles exactly). */
export function cellBox(n, k, { cls = "" } = {}) {
  let cols = n;
  for (let c = Math.ceil(Math.sqrt(n)); c <= n; c++) { if (n % c === 0) { cols = c; break; } }
  const rows = n / cols;
  let cells = "";
  for (let i = 0; i < n; i++) cells += `<div class="eq-cell${i < k ? " is-on" : ""}"></div>`;
  return `<div class="eq-box is-sm ${cls}" style="grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr)">${cells}</div>`;
}

/* the big fraction glyph (red numerator over an ink bar) */
export function eqFrac(n, d, cls = "") {
  return `<div class="eq-frac ${cls}"><div class="bignum"><span class="n" style="color:var(--red)">${n}</span><span class="bar" style="background:var(--ink)"></span><span class="d">${d}</span></div></div>`;
}

/* digitGrid(on) — the number picker (0–9 in two columns); `on` highlights one. */
export function digitGrid(on = null) {
  const col = (s, e) =>
    Array.from({ length: e - s + 1 }, (_, i) => s + i)
      .map((k) => `<div class="den-num${k === on ? " is-on" : ""}">${k}</div>`)
      .join("");
  return `<div class="eq-numgrid"><div class="den-numcol">${col(0, 4)}</div><div class="den-numcol">${col(5, 9)}</div></div>`;
}

/* fracSlots(n, d, active, big) — an editable fraction; `active` ∈ {"n","d"} marks
 * the slot waiting for the next picked digit (dashed red ring). */
export function fracSlots(n, d, active = "n", big = 56) {
  return `<div class="bignum" style="font-size:${big}px"><span class="n${active === "n" ? " eq-slot-active" : ""}" style="color:var(--red)">${n}</span><span class="bar" style="background:var(--ink)"></span><span class="d${active === "d" ? " eq-slot-active" : ""}">${d}</span></div>`;
}

/* ════════════════════════════════════════════════════════════════════════════
 * answer.js shared builders — ruler / sheetCake / spatula / quarterLine /
 * quarterBlock / cakeVisual / cakeSlice / fracSquare / the cmp symbin
 * ════════════════════════════════════════════════════════════════════════════ */

/* a small stacked fraction — accepts a "n/d" string OR separate (n, d) args */
export const frac = (n, d) => {
  if (d === undefined) [n, d] = String(n).split("/");
  return d
    ? `<span class="kq-frac"><span class="kq-frac-n">${n}</span><span class="kq-frac-d">${d}</span></span>`
    : `<span class="kq-frac">${n}</span>`;
};

/* a big stacked fraction (lesson .bignum style) from a "n/d" string */
export const bignumFrac = (label) => {
  const [n, d] = String(label).split("/");
  return `<div class="bignum" style="font-size:40px"><span class="n" style="color:var(--red)">${n}</span><span class="bar" style="background:var(--ink)"></span><span class="d">${d}</span></div>`;
};

/* the cmp symbin — a bin of < = > symbols to drag into a compare slot. */
export const cmpSymbin = () => {
  const bin = ["&lt;", "=", "&gt;"]
    .map((s) => `<button type="button" class="cmp-sym">${s}</button>`)
    .join("");
  return `<div class="cmp-symbin" role="group" aria-label="drag a comparison symbol">${bin}</div>`;
};

/* the cmp compare row — two big fractions with a drop slot between them. */
export const cmpCompare = (L = "?/?", R = "?/?") =>
  `<div class="cmp-compare">${bignumFrac(L)}<span class="cmp-drop" aria-label="drop a symbol here">?</span>${bignumFrac(R)}</div>`;

/* the shared fraction square + re-cut tools + live glyph — used by r4 & simp. */
export const fracSquare = (n, k, sizes, verb) =>
  `<div class="kq-fraclab">${cellBox(n, k)}<div class="kq-fraclab-side"><div class="kq-splitrow">${sizes
    .map((s) => `<button type="button" class="kq-splitbtn">${verb} ${s}</button>`)
    .join("")}</div>${eqFrac(k, n)}</div></div>`;

/* THE centralized ruler/measuring-stick. 0→`span` wholes, each cut into `den`
 * pieces; the first `lit` pieces (of size 1/den) are shaded red. */
export const ruler = (den, lit = 1, span = 1) => {
  const x0 = 26, x1 = 454, y = 58, band = 28, total = den * span, seg = (x1 - x0) / total;
  let ticks = "", labs = "";
  for (let i = 0; i <= total; i++) {
    const x = (x0 + i * seg).toFixed(1), end = i === 0 || i === total, whole = i % den === 0;
    const h = end ? 30 : whole ? 22 : 13;
    ticks += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - h}" stroke="var(--ink)" stroke-width="${end || whole ? 2.6 : 1.6}" stroke-linecap="round" opacity="${end ? 1 : whole ? 0.85 : 0.6}" />`;
  }
  for (let k = 0; k <= span; k++) {
    const x = (x0 + k * den * seg).toFixed(1);
    labs += `<text x="${x}" y="80" text-anchor="middle" font-style="italic" font-size="15" fill="var(--ink-mute)">${k}</text>`;
  }
  return `<svg class="kq-ruler" viewBox="0 0 480 88" role="img" aria-label="measuring stick">
    <line x1="${x0 - 6}" y1="${y}" x2="${x1 + 6}" y2="${y}" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" />
    <rect x="${x0}" y="${y - band}" width="${(lit * seg).toFixed(1)}" height="${band}" fill="var(--red)" opacity="0.85" />
    ${ticks}${labs}
  </svg>`;
};

/* ── ONE shared cake slice (sponge + cream + chocolate frosting + cherry) ───── */
const SPONGE = "#d8bc84", CHOC = "#5a3a22", CREAM = "#f4e8c6";
const cakeBlock = (frosted = true) => `<svg viewBox="0 0 60 46" preserveAspectRatio="none" class="kq-cakeblock" aria-hidden="true">
  <rect x="0" y="0" width="60" height="46" fill="${SPONGE}" stroke="var(--ink)" stroke-width="1.6" />
  <rect x="0" y="18" width="60" height="6" fill="${CREAM}" />
  ${frosted ? `<rect x="0" y="0" width="60" height="14" fill="${CHOC}" />` : ""}
</svg>`;
const cakeCherry = () => `<svg viewBox="0 0 20 16" class="kq-cherry" aria-hidden="true"><circle cx="10" cy="9" r="5" fill="var(--red)" stroke="var(--red-deep)" stroke-width="1.6" /></svg>`;
export const cakeVisual = (frosted = true) => `${frosted ? cakeCherry() : ""}${cakeBlock(frosted)}`;

/* num — ONE whole cake of `parts` slices; the first `lit` are frosted. */
export const sheetCake = (parts, lit = 0) => {
  let cells = "";
  for (let i = 0; i < parts; i++)
    cells += `<div class="kq-cakecell${i < lit ? " is-frosted" : ""}">${cakeVisual(i < lit)}</div>`;
  return `<div class="kq-cakerow">${cells}</div>`;
};

/* the frosting spatula — the tool the student "holds" to frost / unfrost a slice */
export const spatula = () => `<button type="button" class="kq-spatula" title="Frost or unfrost a slice">
  <svg viewBox="0 0 40 40" width="26" height="26" aria-hidden="true">
    <g transform="rotate(-15 20 20)">
      <path d="M3 31 L25 23 L13 5 Z" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
      <path d="M8 27 L18 15" stroke="${CHOC}" stroke-width="3.4" stroke-linecap="round" />
      <line x1="19" y1="11" x2="35" y2="3" stroke="var(--ink)" stroke-width="3.6" stroke-linecap="round" />
    </g>
  </svg><span>frost / unfrost</span>
</button>`;

/* a ruler under the cake that counts out the slices (1 … parts) */
export const sliceRuler = (parts) =>
  `<div class="kq-cakeruler">${rep(parts, (_, i) => `<span class="kq-cakeruler-tick">${i + 1}</span>`)}</div>`;

/* quarterLine — a 0→span number line in `den`ths with `filled` unit blocks. */
export const quarterLine = (filled, span = 3, den = 4, color = "var(--red)", opts = {}) => {
  const { fracLabels = false, blockLabel = null } = opts;
  const x0 = 26, x1 = 454, y = 78, total = den * span, seg = (x1 - x0) / total;
  let ticks = "", labs = "", blocks = "";
  for (let i = 0; i <= total; i++) {
    const x = (x0 + i * seg).toFixed(1), whole = i % den === 0, end = i === 0 || i === total;
    ticks += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - (end ? 18 : whole ? 13 : 8)}" stroke="var(--ink)" stroke-width="${end || whole ? 2.4 : 1.4}" stroke-linecap="round" opacity="${whole ? 1 : 0.6}" />`;
  }
  if (fracLabels) {
    for (let i = 0; i <= total; i++) {
      const x = (x0 + i * seg).toFixed(1), end = i === 0 || i === total;
      const lab = end ? String(i / den) : `${i}/${den}`;
      labs += `<text x="${x}" y="${y + 24}" text-anchor="middle" font-size="${end ? 18 : 13}" font-weight="${end ? 700 : 400}" font-style="${end ? "normal" : "italic"}" fill="${end ? "var(--red)" : "var(--ink-mute)"}">${lab}</text>`;
    }
  } else {
    for (let k = 0; k <= span; k++)
      labs += `<text x="${(x0 + k * den * seg).toFixed(1)}" y="${y + 24}" text-anchor="middle" font-size="16" fill="var(--ink)">${k}</text>`;
  }
  for (let i = 0; i < filled; i++) {
    const x = +((x0 + i * seg).toFixed(1)), w = +(seg.toFixed(1));
    blocks += `<g>
      <rect x="${x}" y="${y - 40}" width="${w}" height="36" fill="${color}" stroke="var(--ink)" stroke-width="1.8" />
      <rect x="${x}" y="${y - 40}" width="${w}" height="36" fill="url(#kq-blockhatch)" />
      ${blockLabel ? `<text x="${(x + w / 2).toFixed(1)}" y="${y - 18}" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)">${blockLabel}</text>` : ""}
    </g>`;
  }
  return `<svg class="kq-qline-svg" viewBox="0 0 480 108" role="img" aria-label="blocks on a number line">
    <defs><pattern id="kq-blockhatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink)" stroke-width="0.8" opacity="0.32" /></pattern></defs>
    <line x1="${x0 - 6}" y1="${y}" x2="${x1 + 6}" y2="${y}" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" />${blocks}${ticks}${labs}</svg>`;
};

/* a single draggable unit block for the bin */
export const quarterBlock = (color = "var(--red)") =>
  `<svg viewBox="0 0 48 30" class="kq-qblock" aria-hidden="true"><rect x="2" y="2" width="44" height="26" fill="${color}" stroke="var(--ink)" stroke-width="1.8" /><rect x="2" y="2" width="44" height="6" fill="#fff" opacity="0.18" /></svg>`;

/* the kq-tool wrapper — a labelled hint over a tool body. */
export const tool = (hint, body, extra = "") =>
  `<div class="kq-tool ${extra}"><div class="kq-tool-hint">${hint}</div>${body}</div>`;

export const LOCKSVG = `<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style="display:block"><rect x="4" y="11" width="16" height="11" rx="2" fill="none" stroke="var(--ink)" stroke-width="2" /><path d="M8 11 V8 a4 4 0 0 1 8 0 V11" fill="none" stroke="var(--ink)" stroke-width="2" /><circle cx="12" cy="16" r="1.6" fill="var(--ink)" /></svg>`;

/* s1 — a draggable take-away piece = the SAME shared cake slice + its label */
export const cakeSlice = (used = false) => `
  <div class="s1-piece ${used ? "is-used" : "s1-piece-drag"} kq-cakepiece" style="width:74px">
    ${cakeVisual()}
    <span class="s1-piece-lab">1/7</span>
  </div>`;
export const cakeSlot = () => `<div class="s1-piece is-slot kq-cakeslot" style="width:74px"></div>`;
