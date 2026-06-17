// DigitGrid — the 0–9 two-column pill picker (Wave F).
//
// Port of digitGrid() (docs/wireframe/src/eqBox.js:67). ALWAYS the full 0–9
// range (so multi-digit answers like 11 are built digit by digit), laid out in
// TWO columns (0–4 · 5–9). Classes (.eq-numgrid / .den-numcol / .den-num) come
// from assets.css. This kills the four inline copies (AppR4, AppR5, AppDen,
// AppNum).
//
// TWO input models:
//   • CLASSIC (default): clicking a digit immediately calls onPick(k).
//   • DRAG-TO-PLACE (mode="drag"): clicking a digit SELECTS it (onSelect), and
//     the digit is draggable. The child then drags it onto a <DigitSlot> drop
//     target (or, as a touch/keyboard fallback, taps the armed slot) to commit
//     it. The board only changes when the number lands in a slot — never on the
//     bare tap. `selected` highlights the armed digit; tapping it again clears.
import React from "react";

// The MIME-ish key we stash the dragged digit under (plus text/plain for native
// drop targets that only read the standard type).
export const DIGIT_DND_TYPE = "text/plain";

export function DigitGrid({
  on = null,
  onPick,
  disabled = false,
  max = 9,
  // drag-to-place mode:
  mode = "click",         // "click" | "drag"
  selected = null,        // highlighted (armed) digit in drag mode
  onSelect,               // (k) => void — select/arm a digit (toggle) in drag mode
}) {
  const drag = mode === "drag";
  const mid = Math.ceil((max + 1) / 2); // split point: first column 0..mid-1

  const handleClick = (k) => {
    if (disabled) return;
    if (drag) onSelect?.(k);
    else onPick?.(k);
  };

  const col = (start, end) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i).map((k) => {
      const isOn = drag ? k === selected : k === on;
      return (
        <div
          key={k}
          className={"den-num" + (isOn ? " is-on" : "") + (drag ? " is-draggable" : "")}
          onClick={disabled ? undefined : () => handleClick(k)}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-pressed={isOn}
          aria-label={String(k)}
          draggable={drag && !disabled}
          onDragStart={drag && !disabled ? (e) => {
            try { e.dataTransfer.setData(DIGIT_DND_TYPE, String(k)); } catch (_) {}
            e.dataTransfer.effectAllowed = "copy";
            onSelect?.(k); // dragging also arms the digit so the slots light up
          } : undefined}
          onKeyDown={disabled ? undefined : (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(k); } }}
        >
          {k}
        </div>
      );
    });

  return (
    <div className="eq-numgrid">
      <div className="den-numcol">{col(0, mid - 1)}</div>
      <div className="den-numcol">{col(mid, max)}</div>
    </div>
  );
}

export default DigitGrid;
