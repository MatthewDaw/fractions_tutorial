/* tools/m3.jsx — №2 Times Facts helper tool (INTERACTIVE).
 *
 * Drop the +6 jar to ADD a row of 6 pickles; the −6 jar REMOVES a row. Rows are
 * numbered up the side and the grid grows / shrinks one row at a time. The total
 * is always rows × 6, surfaced to the answer surface as { int: rows * 6 }.
 *
 * Builds on the wireframe markup (answer.js TOOLS.m3) but the rows are real React
 * state so the buttons work. Uses the wireframe classes (kq-pickrows, kq-pickrow,
 * kq-rownum, kq-rowtools, kq-rowjar) so styles/kitchen.css applies, plus the
 * shared `tool` / `jar` / `pickle` primitives. Props: see KitchenTool.jsx.
 */
import { useState, useCallback } from "react";
import { KitchenHtml, jar, pickle, rep } from "../../../kitchen/primitives.jsx";

const PER_ROW = 6;     // each jar packs 6 pickles (the "times fact" group size)
const MIN_ROWS = 0;    // can empty the shelf
const MAX_ROWS = 12;   // keep the grid sane

const HINT =
  "Drop the +6 jar to add a row of pickles; use −6 to take one away. Count the rows up.";

export default function M3Tool({ value, onChange, onProgress, disabled = false }) {
  const [rows, setRows] = useState(() => {
    // seed from a controlled integer value if it's a clean multiple of 6
    const n = parseInt(value?.int, 10);
    if (Number.isFinite(n) && n >= 0 && n % PER_ROW === 0) {
      return Math.min(Math.max(n / PER_ROW, MIN_ROWS), MAX_ROWS);
    }
    return 4; // wireframe default: 4 rows of 6
  });

  const commit = useCallback(
    (nextRows) => {
      setRows(nextRows);
      onChange && onChange({ int: String(nextRows * PER_ROW) });
      onProgress &&
        onProgress({ kind: "manip_step", tool: "m3", rows: nextRows, total: nextRows * PER_ROW });
    },
    [onChange, onProgress]
  );

  const addRow = useCallback(() => {
    if (disabled || rows >= MAX_ROWS) return;
    commit(rows + 1);
  }, [disabled, rows, commit]);

  const removeRow = useCallback(() => {
    if (disabled || rows <= MIN_ROWS) return;
    commit(rows - 1);
  }, [disabled, rows, commit]);

  // one row of `PER_ROW` pickles, numbered up the side — built as an HTML string
  // from the shared primitives so the SVG geometry matches the wireframe 1:1.
  const rowHtml = (i) =>
    `<div class="kq-pickrow"><span class="kq-rownum">${i + 1}</span>${rep(PER_ROW, pickle)}</div>`;
  const gridHtml = `<div class="kq-pickrows">${rep(rows, (_, i) => rowHtml(i))}</div>`;

  return (
    <div className={"kq-tool" + (disabled ? " is-disabled" : "")}>
      <div className="kq-tool-hint">{HINT}</div>

      <KitchenHtml html={gridHtml} />

      <div className="kq-rowtools">
        <button
          type="button"
          className="kq-rowjar"
          title="add a row of 6 pickles"
          aria-label="add a row of 6 pickles"
          disabled={disabled || rows >= MAX_ROWS}
          onClick={addRow}
        >
          <KitchenHtml html={jar(0)} />
          <span className="kq-rowjar-lab">+6</span>
        </button>

        <button
          type="button"
          className="kq-rowjar is-del"
          title="remove a row"
          aria-label="remove a row of 6 pickles"
          disabled={disabled || rows <= MIN_ROWS}
          onClick={removeRow}
        >
          <KitchenHtml html={jar(0)} />
          <span className="kq-rowjar-lab">−6</span>
        </button>
      </div>

      <div className="kq-rowcount" aria-live="polite">
        {rows} {rows === 1 ? "row" : "rows"} × {PER_ROW} = <b>{rows * PER_ROW}</b>
      </div>
    </div>
  );
}
