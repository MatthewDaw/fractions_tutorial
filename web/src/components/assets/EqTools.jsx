// EqTools — the ×k / ÷k knife rack (Wave F).
//
// Port of eqTools() (docs/wireframe/src/eqBox.js:89). Default = splitting knives
// (×k, "cut each cell into k", the equivalence room). With divide → bundling
// tools (÷k, "bundle every k cells", the inverse used by the simplify room).
// Classes (.eq-tools / .eq-tool / .eq-tool-x / .eq-tool-lab) come from assets.css.
// Replaces the per-room EqTool copies (AppR4, AppSimp).
import React from "react";

/**
 * EqTools — a column of tool buttons, one per cut/bundle size.
 *
 * Props:
 *   sizes    — array of k values (e.g. [2,3,4]).
 *   on       — the chosen k (highlights its tool).
 *   frozen   — grey the whole rack (the "pick the numbers instead" stages).
 *   divide   — bundling mode (÷k) instead of splitting (×k).
 *   onPick   — (k) => void; tap a tool.
 *   renderTool — optional (k, { on, frozen, divide }) => node for a drag-capable
 *                tool (e.g. AppR4's draggable knife). Falls back to a tap button.
 */
export function EqTools({ sizes, on = null, frozen = false, divide = false, onPick, renderTool }) {
  const sym = divide ? "÷" : "×";
  const lab = (k) => (divide ? `bundle every ${k} cells` : `cut each cell into ${k}`);
  return (
    <div className="eq-tools">
      {sizes.map((k) => {
        if (renderTool) return <React.Fragment key={k}>{renderTool(k, { on: k === on, frozen, divide })}</React.Fragment>;
        return (
          <div
            key={k}
            className={"eq-tool" + (k === on ? " is-on" : "") + (frozen ? " is-frozen" : "")}
            onClick={frozen ? undefined : () => onPick?.(k)}
            role={frozen ? undefined : "button"}
            tabIndex={frozen ? -1 : 0}
            onKeyDown={frozen ? undefined : (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick?.(k); } }}
          >
            <span className="eq-tool-x">{sym}{k}</span>
            <span className="eq-tool-lab">{lab(k)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default EqTools;
