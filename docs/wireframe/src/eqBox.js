/* eqBox.js — the shared SQUARE used by the Equivalent-Fractions rooms (×2 / ×3).
   One helper, so every stage (and both rooms) draws the box identically.

   eqBox(cols, rows, shaded, opts):
     cols   — base pieces across (the original denominator), e.g. 3 for thirds
     rows   — how many times each cell has been cut (the split factor), 1 = uncut
     shaded — how many LEFT columns are inked (the original numerator)
   The shaded AREA is always shaded/cols of the box (it never moves); the fraction
   the picture shows is (shaded*rows) / (cols*rows). opts.guide draws the fixed red
   "same amount" edge on the shaded boundary; opts.cls adds box classes. */
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
   Unlike eqBox (which shades whole columns to show a fixed AREA), this fills cell
   by cell so the child can BUILD a numerator k out of n. The grid is a clean
   rectangle that EXACTLY tiles n (e.g. 8 → 4×2, never a 3×3 with a blacked-out
   leftover): the fewest columns ≥ √n that divide n. */
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

/* mixRuler(num, den, wholes) — a number-line strip for the Mixed Numbers room.
   It runs 0 → `wholes`, each whole cut into `den` pieces, with the first `num`
   pieces shaded. Whole boundaries get a heavier divider, and 0,1,2 … labels sit
   under the line — so a value past 1 reads as "this many wholes + a leftover". */
export function mixRuler(num, den, wholes, { cls = "", w = 560 } = {}) {
  const total = wholes * den;
  let segs = "";
  for (let i = 0; i < total; i++) {
    const wholeEnd = (i + 1) % den === 0 && i + 1 < total;
    segs += `<div class="mix-seg${i < num ? " is-on" : ""}${wholeEnd ? " whole-end" : ""}"></div>`;
  }
  const labels = Array.from({ length: wholes + 1 }, (_, i) => `<span>${i}</span>`).join("");
  return `<div class="mix-ruler-wrap ${cls}">
      <div class="mix-ruler" style="--mix-w:${w}px">${segs}</div>
      <div class="mix-labels" style="--mix-w:${w}px">${labels}</div>
    </div>`;
}

/* the mixed-number glyph: a big whole number next to a small stacked fraction. */
export function mixedNum(whole, n, d) {
  return `<span class="mix-num"><span class="mix-whole">${whole}</span><span class="mix-frac"><span class="mix-n">${n}</span><span class="mix-d">${d}</span></span></span>`;
}

/* digitGrid(on) — the number picker for the fill-in stages. ALWAYS the full digit
   range 0–9 (so multi-digit answers like 11 are built digit by digit), laid out in
   TWO columns (0–4 · 5–9) of rounded pills. `on` highlights the picked digit. */
export function digitGrid(on = null) {
  const col = (s, e) =>
    Array.from({ length: e - s + 1 }, (_, i) => s + i)
      .map((k) => `<div class="den-num${k === on ? " is-on" : ""}">${k}</div>`)
      .join("");
  return `<div class="eq-numgrid"><div class="den-numcol">${col(0, 4)}</div><div class="den-numcol">${col(5, 9)}</div></div>`;
}

/* FILL-IN glyphs — the child picks a number from the column and drops it into a
   slot. `active` marks the slot currently waiting (a dashed red ring). For a plain
   fraction active ∈ {"n","d"}; for a mixed number active ∈ {"w","n","d"}. */
export function fracSlots(n, d, active = "n", big = 56) {
  return `<div class="bignum" style="font-size:${big}px"><span class="n${active === "n" ? " eq-slot-active" : ""}" style="color:var(--red)">${n}</span><span class="bar" style="background:var(--ink)"></span><span class="d${active === "d" ? " eq-slot-active" : ""}">${d}</span></div>`;
}
export function mixedSlots(whole, n, d, active = "w") {
  return `<span class="mix-num"><span class="mix-whole${active === "w" ? " eq-slot-active" : ""}">${whole}</span><span class="mix-frac"><span class="mix-n${active === "n" ? " eq-slot-active" : ""}">${n}</span><span class="mix-d${active === "d" ? " eq-slot-active" : ""}">${d}</span></span></span>`;
}

/* the tool rack. Default = splitting knives (×k, "cut each cell into k", used by
   the equivalence room). With { divide:true } it becomes bundling tools (÷k,
   "bundle every k cells", the INVERSE used by the simplify room). `on` marks the
   chosen tool; `frozen` greys them all (the "pick the numbers instead" stages). */
export function eqTools(sizes, { on = null, frozen = false, divide = false } = {}) {
  const sym = divide ? "÷" : "×";
  const lab = (k) => (divide ? `bundle every ${k} cells` : `cut each cell into ${k}`);
  return `<div class="eq-tools">${sizes
    .map(
      (k) =>
        `<div class="eq-tool${k === on ? " is-on" : ""}${frozen ? " is-frozen" : ""}"><span class="eq-tool-x">${sym}${k}</span><span class="eq-tool-lab">${lab(k)}</span></div>`
    )
    .join("")}</div>`;
}
