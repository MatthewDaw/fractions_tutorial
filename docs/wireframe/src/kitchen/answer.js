/* answer.js — the answer-entry surface for a kitchen question, as an HTML string.

   Babushka's Kitchen is "show what you know": the child reads the story and
   writes the answer. Every lesson's final question reduces to one of a few
   answer shapes, so they all live here and a question just declares its type:

     { type: "fraction" }                     two stacked write cells (num / den)
     { type: "integer" }                       one write cell (a whole count)
     { type: "mixed" }                          whole "and" a fraction
     { type: "compare" }                        tap  <   =   >
     { type: "choice", options: ["2/3", …] }    tap one fraction chip
*/

const CELL = (aria, ph = "") => `
  <div class="slate-slot"><div class="slate-cell">
    <canvas class="slate-canvas" role="img" aria-label="${aria}"></canvas>
    <span class="slate-ph" aria-hidden="true">${ph}</span>
  </div></div>`;

const FRACTION = `
  <div class="slate slate-fraction" role="group" aria-label="your fraction answer">
    ${CELL("write the top digit", "✎")}
    <span class="slate-bar" style="background: var(--ink);" aria-hidden="true"></span>
    ${CELL("write the bottom digit")}
  </div>`;

/* a small stacked fraction — accepts a "n/d" string OR separate (n, d) args */
const frac = (n, d) => {
  if (d === undefined) [n, d] = String(n).split("/");
  return d
    ? `<span class="kq-frac"><span class="kq-frac-n">${n}</span><span class="kq-frac-d">${d}</span></span>`
    : `<span class="kq-frac">${n}</span>`;
};

/* a big stacked fraction (lesson .bignum style) from a "n/d" string */
const bignumFrac = (label) => {
  const [n, d] = String(label).split("/");
  return `<div class="bignum" style="font-size:40px"><span class="n" style="color:var(--red)">${n}</span><span class="bar" style="background:var(--ink)"></span><span class="d">${d}</span></div>`;
};

export function renderAnswer(answer = { type: "fraction" }) {
  // No eyebrow label above the entry — the boxes are large enough on their own.
  if (answer.type === "compare") {
    // symbols in a bin on the LEFT; drag one into the slot between the fractions
    const L = answer.left || "?/?", R = answer.right || "?/?";
    const bin = ["&lt;", "=", "&gt;"].map((s) => `<button type="button" class="cmp-sym">${s}</button>`).join("");
    return `
      <div class="kq-write">
        <div class="cmp-drag">
          <div class="cmp-symbin" role="group" aria-label="drag a comparison symbol">${bin}</div>
          <div class="cmp-compare">${bignumFrac(L)}<span class="cmp-drop" aria-label="drop a symbol here">?</span>${bignumFrac(R)}</div>
        </div>
      </div>`;
  }

  if (answer.type === "choice") {
    const chips = (answer.options || [])
      .map((o) => `<button type="button" class="kq-chip">${frac(o)}</button>`)
      .join("");
    return `
      <div class="kq-write">
        <div class="kq-choices" role="group" aria-label="choose the answer">${chips}</div>
      </div>`;
  }

  if (answer.type === "integer") {
    return `
      <div class="kq-write">
        <div class="kq-slate">
          <div class="slate slate-int" role="group" aria-label="your answer">${CELL("write your answer", "✎")}</div>
        </div>
      </div>`;
  }

  if (answer.type === "mixed") {
    return `
      <div class="kq-write">
        <div class="kq-slate is-mixed">
          <div class="slate slate-int slate-row" role="group" aria-label="write the whole number">${CELL("write the whole number", "✎")}</div>
          <span class="mr-and">and</span>
          ${FRACTION}
        </div>
      </div>`;
  }

  // default: a plain fraction
  return `
    <div class="kq-write">
      <div class="kq-slate">${FRACTION}</div>
    </div>`;
}

/* ── the HELPER TOOL state ──────────────────────────────────────────────────
   A second way to answer: instead of writing the answer cold, the student drives
   a small manipulative. Each tool is UNIQUE to its question's concept — keyed by
   lesson id below — so no two questions share a tool. Inert in the wireframe (the
   real app wires the interactions); here it exists so the toggle can show both. */

import roomR2 from "../screens/room-r2.js";
import roomR3 from "../screens/room-r3.js";
import { cellBox, eqFrac, digitGrid, eqBox, fracSlots } from "../eqBox.js";
import { jar, plum, tray, rep, pickle } from "../manip.js";
/* lesson canvases reused verbatim as the kitchen helper tools for those
   questions (so the kitchen tool IS the lesson tool). */
const R2_CANVAS = roomR2.stageHTML;
const R3_CANVAS = roomR3.stageHTML;

// ── shared primitives ──────────────────────────────────────────────────────
/* Every helper is a hands-on MANIPULATIVE — a tool to work the problem out with,
   never a number pad or a picture of the answer (the answer goes in the slate
   below). Jars / plums / trays / pickles all come from the shared manip.js. */
/* a shared fraction square: n cells, k shaded, with tools to re-cut / bundle it
   and a live fraction glyph — used by BOTH Equivalent Fractions and Simplify so
   the student can SEE how a fraction breaks down. */
const fracSquare = (n, k, sizes, verb) =>
  `<div class="kq-fraclab">${cellBox(n, k)}<div class="kq-fraclab-side"><div class="kq-splitrow">${sizes
    .map((s) => `<button type="button" class="kq-splitbtn">${verb} ${s}</button>`)
    .join("")}</div>${eqFrac(k, n)}</div></div>`;
/* THE centralized ruler/measuring-stick — every tool that needs to show an
   amount uses this, never a plain segmented block. 0→`span` wholes, each whole
   split into `den` pieces; the first `lit` pieces (of size 1/den) are shaded. */
const ruler = (den, lit = 1, span = 1) => {
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
/* ── ONE shared cake slice (ported from the real app's SheetCake) ───────────
   A single full-bleed slice: sponge + cream layer + chocolate frosting, with a
   round cherry on top. Every cake in the kitchen is built from THIS — the num
   sheet-cake (a row of slices) and the s1 take-away pieces (draggable slices) —
   so they always look identical. */
const SPONGE = "#d8bc84", CHOC = "#5a3a22", CREAM = "#f4e8c6";
/* a cake slice block — always sponge + cream; the chocolate FROSTING only appears
   when the slice is frosted, so an unfrosted slice is still real cake (not a gap). */
const cakeBlock = (frosted = true) => `<svg viewBox="0 0 60 46" preserveAspectRatio="none" class="kq-cakeblock" aria-hidden="true">
  <rect x="0" y="0" width="60" height="46" fill="${SPONGE}" stroke="var(--ink)" stroke-width="1.6" />
  <rect x="0" y="18" width="60" height="6" fill="${CREAM}" />
  ${frosted ? `<rect x="0" y="0" width="60" height="14" fill="${CHOC}" />` : ""}
</svg>`;
const cakeCherry = () => `<svg viewBox="0 0 20 16" class="kq-cherry" aria-hidden="true"><circle cx="10" cy="9" r="5" fill="var(--red)" stroke="var(--red-deep)" stroke-width="1.6" /></svg>`;
const cakeVisual = (frosted = true) => `${frosted ? cakeCherry() : ""}${cakeBlock(frosted)}`;

/* num — ONE whole cake of `parts` slices spanning the row; the first `lit` are
   frosted (chocolate + cherry), the rest are plain sponge. Tap a slice to frost it. */
const sheetCake = (parts, lit = 0) => {
  let cells = "";
  for (let i = 0; i < parts; i++)
    cells += `<div class="kq-cakecell${i < lit ? " is-frosted" : ""}">${cakeVisual(i < lit)}</div>`;
  return `<div class="kq-cakerow">${cells}</div>`;
};
/* the frosting spatula — the tool the student "holds" to frost / unfrost a slice */
const spatula = () => `<button type="button" class="kq-spatula" title="Frost or unfrost a slice">
  <svg viewBox="0 0 40 40" width="26" height="26" aria-hidden="true">
    <g transform="rotate(-15 20 20)">
      <!-- triangular cake-server blade -->
      <path d="M3 31 L25 23 L13 5 Z" fill="var(--paper-1)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
      <!-- chocolate frosting smeared on the blade -->
      <path d="M8 27 L18 15" stroke="${CHOC}" stroke-width="3.4" stroke-linecap="round" />
      <!-- handle off the top corner -->
      <line x1="19" y1="11" x2="35" y2="3" stroke="var(--ink)" stroke-width="3.6" stroke-linecap="round" />
    </g>
  </svg><span>frost / unfrost</span>
</button>`;
/* a ruler under the cake that counts out the slices (1 … parts) */
const sliceRuler = (parts) => `<div class="kq-cakeruler">${rep(parts, (_, i) => `<span class="kq-cakeruler-tick">${i + 1}</span>`)}</div>`;

/* a 0→span number line marked in `den`ths, with `filled` unit blocks placed on it
   from 0 — the "drag blocks onto the ruler" manipulative (Mixed Numbers in red
   quarters, Same Denominators in blue sixths, …). */
const quarterLine = (filled, span = 3, den = 4, color = "var(--red)", opts = {}) => {
  const { fracLabels = false, blockLabel = null } = opts;
  const x0 = 26, x1 = 454, y = 78, total = den * span, seg = (x1 - x0) / total;
  let ticks = "", labs = "", blocks = "";
  for (let i = 0; i <= total; i++) {
    const x = (x0 + i * seg).toFixed(1), whole = i % den === 0, end = i === 0 || i === total;
    ticks += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - (end ? 18 : whole ? 13 : 8)}" stroke="var(--ink)" stroke-width="${end || whole ? 2.4 : 1.4}" stroke-linecap="round" opacity="${whole ? 1 : 0.6}" />`;
  }
  if (fracLabels) {
    // label every mark as a fraction (1/6, 2/6 …); the ends are the bold whole numbers
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
const quarterBlock = (color = "var(--red)") => `<svg viewBox="0 0 48 30" class="kq-qblock" aria-hidden="true"><rect x="2" y="2" width="44" height="26" fill="${color}" stroke="var(--ink)" stroke-width="1.8" /><rect x="2" y="2" width="44" height="6" fill="#fff" opacity="0.18" /></svg>`;

const tool = (hint, body, extra = "") => `<div class="kq-tool ${extra}"><div class="kq-tool-hint">${hint}</div>${body}</div>`;
const LOCKSVG = `<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style="display:block"><rect x="4" y="11" width="16" height="11" rx="2" fill="none" stroke="var(--ink)" stroke-width="2" /><path d="M8 11 V8 a4 4 0 0 1 8 0 V11" fill="none" stroke="var(--ink)" stroke-width="2" /><circle cx="12" cy="16" r="1.6" fill="var(--ink)" /></svg>`;
/* s1 — a draggable take-away piece = the SAME shared cake slice + its label */
const cakeSlice = (used = false) => `
  <div class="s1-piece ${used ? "is-used" : "s1-piece-drag"} kq-cakepiece" style="width:74px">
    ${cakeVisual()}
    <span class="s1-piece-lab">1/7</span>
  </div>`;
const cakeSlot = () => `<div class="s1-piece is-slot kq-cakeslot" style="width:74px"></div>`;

/* one builder per question — keyed by lesson id, so each is genuinely distinct */
const TOOLS = {
  // №1 Equal Groups — drop the same plums into each jar, then count them all up
  m1: () => tool("Drop the same number of plums into each jar, then count them all up.",
    `<div class="kq-jars">${jar(3)}${jar(3)}${jar(3)}${jar(3)}</div>` + tray(rep(6, plum))),

  // №2 Times Facts — drop a jar of 6 pickles to ADD a row; rows are numbered up the
  // side; the −6 jar REMOVES a row. The grid grows/shrinks a row at a time.
  m3: () => tool("Drop the +6 jar to add a row of pickles; use −6 to take one away. Count the rows up.",
    `<div class="kq-pickrows">${rep(4, (_, i) => `<div class="kq-pickrow"><span class="kq-rownum">${i + 1}</span>${rep(6, pickle)}</div>`)}</div>` +
    `<div class="kq-rowtools">
       <button type="button" class="kq-rowjar" title="add a row of 6 pickles">${jar(0)}<span class="kq-rowjar-lab">+6</span></button>
       <button type="button" class="kq-rowjar is-del" title="remove a row">${jar(0)}<span class="kq-rowjar-lab">−6</span></button>
     </div>`),

  // №3 The Bottom Number — ONE square + a number picker; tap a bottom number and the
  // square splits into that many equal pieces (numerator stays 1). Smaller pieces as
  // the bottom number grows — try 1/5 vs 1/8.
  den: () => tool("Tap a bottom number — the square splits into that many equal pieces. More pieces, smaller each one.",
    `<div class="kq-fraclab">${digitGrid(5)}${eqFrac(1, 5)}${cellBox(5, 1)}</div>`),

  // №4 The Top Number — one wide sheet cake stretched across the stage; tap slices to
  // frost them with cherries. The cherries are the top number over a fixed bottom.
  num: () => tool("Take the spatula and frost the slices — the ruler counts them out below.",
    `<div class="kq-cakewide"><div class="kq-caketools">${spatula()}</div>${sheetCake(7, 4)}${sliceRuler(7)}</div>`),

  // №3 Same Denominators — drag 1/6 blocks onto the labelled sixths line, count up.
  nl: () => tool("Drag the 1/6 blocks onto the ruler, then count them up.",
    `<div class="kq-qline">${quarterLine(3, 1, 6, "#caa300", { fracLabels: true, blockLabel: "1/6" })}</div>` +
    `<div class="kq-qbin"><span class="kq-qbin-lab">drag a 1/6 block onto the ruler</span>${quarterBlock("#caa300")}${frac(1, 6)}</div>`),

  // №4 Taking Away — reuse the lesson's take-away tool (pieces on a line + a tray
  // you drag the used pieces into), but the pieces are cake slices.
  s1: () => tool("Drag the slices Babushka used into the tray — count the cake that's left.",
    `<div class="kq-takebox"><div class="canvas s1-canvas s1-canvas-takeaway">
      <div class="eqstate eqfloat locked"><span class="g">${LOCKSVG}</span>bottom stays /7</div>
      <div class="s1-line-label">on the line — what's left</div>
      <div class="s1-takeline">${cakeSlice()}${cakeSlice()}${cakeSlot()}${cakeSlot()}${cakeSlice()}${cakeSlice()}</div>
      <div class="s1-tray has-pieces">
        <span class="s1-tray-label">used by Babushka — drag slices here</span>
        <div class="s1-tray-row">${cakeSlice(true)}${cakeSlice(true)}</div>
      </div>
      <div class="s1-count-cap">4 left on the line · 2 taken away</div>
    </div></div>`),

  // №5 Compare & Check — a number pad + two EDITABLE sticks. Tap a number, drop it
  // on a stick's top or bottom and the stick re-divides itself; then compare the
  // red lengths. (Not a static answer — the child builds each fraction.)
  cmp: () => tool("Tap a number, then a stick's top or bottom — the stick re-divides. Compare the red lengths.",
    `<div class="kq-manip">${digitGrid(7)}
      <div class="kq-sticks">
        <div class="kq-cutrow">${fracSlots(3, 5, "n", 30)}${ruler(5, 3)}</div>
        <div class="kq-cutrow">${fracSlots(7, 10, "d", 30)}${ruler(10, 7)}</div>
      </div>
    </div>`),

  // №6 Scale One — reuse the lesson's own re-cut-one-fraction canvas (room-r3):
  // block stacks on a number line with the ×n multiplier, so it can be divided up.
  r3: () => tool("Re-cut the bigger pieces so both stacks match, then add.",
    `<div class="kq-r2box">${R3_CANVAS}</div>`),

  // №7 Cross-Multiply — reuse the lesson's own re-cut-to-a-common-bottom canvas
  // (room-r2): yellow block stacks on a number line with the ×n multipliers.
  r2: () => tool("Re-cut both fractions to the same bottom — line the stacks up.",
    `<div class="kq-r2box">${R2_CANVAS}</div>`),

  // №8 Equivalent Fractions — the shared fraction square: cut it FINER and shade
  // to see equivalent names appear.
  // №8 Equivalent Fractions — reuse the lesson's Find·Pick manipulative: a number
  // pad, an EDITABLE fraction (tap to set the top or bottom), YOUR box, and the
  // fixed TARGET (2/3). The child builds an equivalent until the boxes match.
  r4: () => tool("Tap a number, then the top or bottom — your box re-cuts to match the target 2/3.",
    `<div class="kq-manip" style="gap:22px">${digitGrid(4)}
      ${fracSlots(4, 6, "n", 46)}
      <div class="eq-col"><span class="eq-lab">your box</span>${eqBox(3, 2, 2, { guide: true, cls: "is-sm" })}</div>
      <div class="eq-eq">match<br>→</div>
      <div class="eq-col"><span class="eq-lab">target — 2/3</span>${eqBox(3, 1, 2, { guide: true, cls: "is-sm is-target" })}</div>
    </div>`),

  // №9 Simplify — a number pad and an EMPTY box: the child sets any top and bottom
  // and the box fills to match, so they can try names (6/9, 4/6, 2/3 …) and see which
  // fills the same amount — the simplest is 2/3.
  simp: () => tool("Tap numbers to set the top and bottom — the box fills to match. Try names for 6/9 and find the simplest.",
    `<div class="kq-manip" style="gap:22px">${digitGrid(6)}
      ${fracSlots(6, 9, "n", 46)}
      <div class="eq-col"><span class="eq-lab">your box</span>${eqBox(3, 3, 2, { guide: true, cls: "is-sm" })}</div>
    </div>`),

  // №10 Mixed Numbers — drag ¼ blocks onto a 0→3 stick; count the whole sticks
  // that fill and the leftover quarters.
  r5: () => tool("Drag ¼ blocks onto the stick — count the whole sticks that fill and the leftover.",
    `<div class="kq-qline">${quarterLine(11, 3, 4)}</div>` +
    `<div class="kq-qbin"><span class="kq-qbin-lab">drag a quarter onto the stick</span>${quarterBlock()}${frac(1, 4)}</div>`),
};

export function renderTool(data = {}) {
  const build = TOOLS[data.id];
  if (build) return build(data);
  // fallback: a single measuring stick to shade
  return tool("Mark the stick into pieces and shade the fraction.", ruler(4, 0));
}
