/* compare.js — THE one comparison-answer form, shared everywhere a child compares
   two fractions: a dashed bin of < = > symbols to drag from, then the two fractions
   with a dashed "?" slot to drop the chosen symbol into. Used by the Compare & Check
   lesson, the Bottom-Number size stages, and Babushka's Kitchen — so every
   comparison looks and works identically. CSS lives in css/app/cmp.css
   (.cmp-drag / .cmp-symbin / .cmp-sym / .cmp-compare / .cmp-drop). */

const fracGlyph = (n, d, big = 34) =>
  `<div class="bignum" style="font-size:${big}px"><span class="n" style="color:var(--red)">${n}</span><span class="bar" style="background:var(--ink)"></span><span class="d">${d}</span></div>`;

/* the bin of draggable comparison symbols */
export const symbin = () =>
  `<div class="cmp-symbin" role="group" aria-label="drag a comparison symbol">${["&lt;", "=", "&gt;"]
    .map((s) => `<button type="button" class="cmp-sym">${s}</button>`)
    .join("")}</div>`;

/* cmpDrag(n1, d1, n2, d2) — the full form: the symbol bin + the two fractions with
   a "?" drop slot between them. `big` sizes the fraction glyphs. */
export const cmpDrag = (n1, d1, n2, d2, big = 34) =>
  `<div class="cmp-drag">${symbin()}<div class="cmp-compare">${fracGlyph(n1, d1, big)}<span class="cmp-drop" aria-label="drop a symbol here">?</span>${fracGlyph(n2, d2, big)}</div></div>`;
