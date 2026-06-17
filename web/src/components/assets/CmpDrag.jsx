// CmpDrag / SymBin — the < = > comparison drag form (Wave F).
//
// Port of compare.js symbin() + cmpDrag() (docs/wireframe/src/compare.js). A bin
// of < = > symbols to drag from, then the two fractions with a dashed "?" drop
// slot between them. Shared by Compare & Check, the Bottom-Number size stages,
// and the kitchen. Classes (.cmp-drag / .cmp-symbin / .cmp-sym / .cmp-compare /
// .cmp-drop) come from assets.css. Replaces AppCompare's inline DragAnswer form.
import React from "react";
import { BigFrac } from "./EqFrac.jsx";

/**
 * SymBin — the bin of draggable < = > buttons.
 *
 * Props:
 *   onPick      — (sym:"<"|"="|">") => void (tap fallback for the drag).
 *   onSymDown   — (sym, event) => void (pointer-down to start a drag).
 *   disabled    — make the bin inert.
 */
export function SymBin({ onPick, onSymDown, disabled = false }) {
  const syms = ["<", "=", ">"];
  return (
    <div className="cmp-symbin" role="group" aria-label="drag a comparison symbol">
      {syms.map((s) => (
        <button
          key={s}
          type="button"
          className="cmp-sym"
          disabled={disabled}
          onClick={disabled ? undefined : () => onPick?.(s)}
          onPointerDown={disabled || !onSymDown ? undefined : (e) => onSymDown(s, e)}
          style={onSymDown ? { touchAction: "none" } : undefined}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

/**
 * CmpDrag — the full comparison form: the symbol bin + the two fractions with a
 * "?" drop slot between them.
 *
 * Props:
 *   n1, d1, n2, d2 — the two fractions.
 *   big            — fraction glyph px font-size (default 34).
 *   dropped        — the symbol currently in the slot (null = still "?").
 *   onPick, onSymDown, disabled — forwarded to <SymBin>.
 */
export function CmpDrag({ n1, d1, n2, d2, big = 34, dropped = null, onPick, onSymDown, disabled = false }) {
  return (
    <div className="cmp-drag">
      <SymBin onPick={onPick} onSymDown={onSymDown} disabled={disabled} />
      <div className="cmp-compare">
        <BigFrac n={n1} d={d1} big={big} />
        <span className="cmp-drop" aria-label="drop a symbol here">{dropped ?? "?"}</span>
        <BigFrac n={n2} d={d2} big={big} />
      </div>
    </div>
  );
}

export default CmpDrag;
