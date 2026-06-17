/* tools/r4.jsx — №7 Equivalent Fractions helper tool (INTERACTIVE).
 *
 * Concept: build a fraction equal to 2/3. Number entry uses the app-wide model:
 *   • Nothing is active on load.
 *   • Tap a digit → that digit AND the two fraction slots activate together.
 *   • Tap the top or bottom slot → the digit is applied there, then the digit and
 *     the slots deactivate.
 *   • A 0 can never be assigned to the bottom (its slot doesn't activate for 0).
 * YOUR box re-cuts to match whatever the child has built; a fixed TARGET shows 2/3.
 *
 * This is a PURE MANIPULATIVE — it never writes the answer; the child reads the
 * boxes and enters the compare/choice answer themselves.
 *
 * Ported markup/classes from wireframe answer.js TOOLS.r4 (kq-manip, eq-box,
 * eq-col, eq-lab, is-target) so styles/kitchen.css (+ r4.css) apply.
 * Props: see KitchenTool.jsx contract.
 */
import { useState } from "react";
import { DigitGrid, FracSlots } from "../../assets";

/* greatest common divisor — used to test equivalence to 2/3 robustly. */
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

/* an equivalence square as React. A `cells` boolean array says EXACTLY which of
 * the cols × rows tiles are inked (so the count always equals the numerator —
 * never an over-rounded "all filled"). `guideAt` (0..1) places the red "same
 * amount" edge. */
function EqBox({ cols, rows, cells, shaded, guideAt, guide = false, target = false }) {
  const tiles = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const on = cells ? !!cells[idx] : c < shaded;
      tiles.push(<div key={r + "-" + c} className={"eq-cell" + (on ? " is-on" : "")} />);
    }
  const edge = guideAt != null ? guideAt : shaded / cols;
  return (
    <div
      className={"eq-box is-sm" + (guide ? " is-guide" : "") + (target ? " is-target" : "")}
      style={{
        gridTemplateColumns: `repeat(${cols},1fr)`,
        gridTemplateRows: `repeat(${rows},1fr)`,
      }}
    >
      {tiles}
      {guide && (
        <div className="eq-guide-edge" style={{ left: `calc(${edge * 100}% - 1px)` }} />
      )}
    </div>
  );
}

/* fewest columns ≥ √n that divide n, so n tiles a tidy rectangle. */
function gridFor(n) {
  if (n <= 0) return { cols: 1, rows: 1 };
  for (let c = Math.ceil(Math.sqrt(n)); c <= n; c++) if (n % c === 0) return { cols: c, rows: n / c };
  return { cols: n, rows: 1 };
}

/* Render the child's built n/d. The numerator shaded is ALWAYS exactly n cells.
 *  • When n/d lands on whole THIRDS-columns (d a multiple of 3 and n a multiple
 *    of d/3) we draw a clean 3-column block so equivalents line up with the 2/3
 *    target (e.g. 4/6 → 2 of 3 columns, 6/9 → 2 of 3 columns).
 *  • Otherwise we draw the LITERAL fraction as a single row of d cells with the
 *    first n inked, so the shaded amount is exactly n/d (5/6 = 5 of 6, NOT all 6).
 * Returns null until the fraction is fully/validly built. */
function buildBox(n, d) {
  const ni = parseInt(n, 10), di = parseInt(d, 10);
  if (!Number.isFinite(ni) || !Number.isFinite(di) || di <= 0) return null;
  const k = Math.max(0, Math.min(di, ni));
  if (di % 3 === 0 && k % (di / 3) === 0) {
    const rows = di / 3;
    const shadedCols = k / rows; // whole columns, 0..3
    const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < 3; c++) cells.push(c < shadedCols);
    return { cols: 3, rows, cells, guideAt: k / di };
  }
  const cells = [];
  for (let i = 0; i < di; i++) cells.push(i < k);
  return { cols: di, rows: 1, cells, guideAt: k / di };
}

export default function R4Tool({ onProgress, disabled = false }) {
  // built fraction as strings (seeded from the wireframe starting guess 4/6).
  const [n, setN] = useState("4");
  const [d, setD] = useState("6");
  // the digit the child has SELECTED (or null). Nothing is active until a digit
  // is picked; picking arms the digit AND the legal slots together.
  const [picked, setPicked] = useState(null);
  const togglePicked = (k) => setPicked((c) => (c === k ? null : k));
  const numArmed = picked != null;            // numerator accepts any digit
  const denArmed = picked != null && picked >= 1; // a bottom number can't be 0

  // apply the selected digit to a slot, then deactivate everything.
  const place = (slot, k) => {
    const v = k == null ? picked : k;
    if (disabled || v == null) return;
    if (slot === "d" && v < 1) return;
    if (slot === "n") setN(String(v)); else setD(String(v));
    setPicked(null);
    onProgress && onProgress({ kind: "manip_step", tool: "r4", slot, digit: v });
  };

  const ni = parseInt(n, 10), di = parseInt(d, 10);
  const built = n !== "" && d !== "" && Number.isFinite(ni) && Number.isFinite(di) && di > 0;
  const matches = built && (() => {
    const g = gcd(ni, di) || 1;
    return ni / g === 2 && di / g === 3;
  })();

  const yourBox = buildBox(n, d);
  const builtLabel = built ? `${ni}/${di}` : null;

  return (
    <div className="kq-tool">
      <div className="kq-tool-hint">
        Tap a number, then the top or bottom — your box re-cuts to match the target 2/3.
      </div>
      <div className="kq-manip" style={{ gap: "22px" }}>
        <DigitGrid mode="drag" selected={picked} onSelect={togglePicked} disabled={disabled} />

        <FracSlots
          n={n === "" ? "?" : n}
          d={d === "" ? "?" : d}
          active={null}
          big={46}
          onDropDigit={place}
          armedN={numArmed}
          armedD={denArmed}
        />

        <div className="eq-col">
          <span className="eq-lab">your box{builtLabel ? ` — ${builtLabel}` : ""}</span>
          {yourBox ? (
            <EqBox cols={yourBox.cols} rows={yourBox.rows} cells={yourBox.cells} guideAt={yourBox.guideAt} guide />
          ) : (
            <EqBox cols={3} rows={1} shaded={0} guideAt={0} guide />
          )}
        </div>

        <div className="eq-eq" aria-hidden="true">
          {matches ? "match!" : "match"}
          <br />→
        </div>

        <div className="eq-col">
          <span className="eq-lab">target — 2/3</span>
          <EqBox cols={3} rows={1} shaded={2} guide target />
        </div>
      </div>

      <div
        className="kq-tool-hint"
        role="status"
        aria-live="polite"
        style={{ marginTop: "8px" }}
      >
        {!built
          ? "Pick a top and a bottom to fill your box."
          : matches
          ? `${builtLabel} fills the same amount as 2/3 — that scoop matches!`
          : `${builtLabel} is not the same as 2/3 yet — keep re-cutting.`}
      </div>
    </div>
  );
}
