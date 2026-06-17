// EqBox / CellBox — the shared equal-area SQUARE primitive (Wave F).
//
// Faithful port of the wireframe builders eqBox() and cellBox()
// (docs/wireframe/src/eqBox.js:11,27). Same geometry, same classes (.eq-box /
// .eq-cell / .eq-guide-edge), so every room draws the box identically. Styling
// lives in styles/assets.css (auto-imported by the assets index).
//
// Rooms that re-coded these inline (AppR4 EqBox, AppDen SquareBox, AppNum,
// AppCompare CellBox, AppSimp SimpBox) import these instead.
import React from "react";

/**
 * EqBox — a cols×rows grid of cells; the LEFT `shaded` columns are inked red.
 * The shaded AREA is fixed (shaded/cols); `rows` cuts each cell into more pieces
 * without moving the area — the equivalence picture (1/3 = 2/6 = …).
 *
 * Props:
 *   cols     — base pieces across (the original denominator).
 *   rows     — how many times each cell has been cut (split factor; 1 = uncut).
 *   shaded   — how many LEFT columns are inked (the original numerator).
 *   guide    — draw the fixed red "same amount" dashed edge on the shaded boundary.
 *   target   — add the red "is-target" glow (marks a reference box).
 *   small    — the smaller box variant (is-sm).
 *   className, style — passthrough.
 */
export function EqBox({ cols, rows = 1, shaded, guide = false, target = false, small = false, className = "", style }) {
  const cells = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      cells.push(<div key={`${r}-${c}`} className={"eq-cell" + (c < shaded ? " is-on" : "")} />);
  const cls = ["eq-box", small ? "is-sm" : "", guide ? "is-guide" : "", target ? "is-target" : "", className]
    .filter(Boolean).join(" ");
  return (
    <div
      className={cls}
      style={{
        gridTemplateColumns: `repeat(${cols},1fr)`,
        gridTemplateRows: `repeat(${rows},1fr)`,
        ...style,
      }}
    >
      {cells}
      {guide && (
        <div className="eq-guide-edge" style={{ left: `calc(${(shaded / cols) * 100}% - 1px)` }} />
      )}
    </div>
  );
}

/**
 * CellBox — the "build a fraction" square: n equal cells, the FIRST k inked. The
 * grid EXACTLY tiles n (fewest cols ≥ √n that divide n), so no blacked-out
 * leftover. Port of cellBox() (eqBox.js:27).
 *
 * Props: n, k, className, style.
 */
export function CellBox({ n, k, className = "", style }) {
  let cols = n;
  for (let c = Math.ceil(Math.sqrt(n)); c <= n; c++) { if (n % c === 0) { cols = c; break; } }
  const rows = n / cols;
  const cells = [];
  for (let i = 0; i < n; i++) cells.push(<div key={i} className={"eq-cell" + (i < k ? " is-on" : "")} />);
  return (
    <div
      className={"eq-box is-sm" + (className ? " " + className : "")}
      style={{ gridTemplateColumns: `repeat(${cols},1fr)`, gridTemplateRows: `repeat(${rows},1fr)`, ...style }}
    >
      {cells}
    </div>
  );
}

export default EqBox;
