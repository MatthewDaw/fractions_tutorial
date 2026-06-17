// DigitSlot — a DROP TARGET for a digit dragged from a <DigitGrid mode="drag">.
//
// The drag-to-place number model: the child selects a digit in the grid (it
// arms), then DRAGS it onto a slot here (numerator/denominator) to commit it.
// A tap on an armed slot also commits the selected digit, so touch and keyboard
// users aren't locked out. The board state only changes when a digit LANDS in a
// slot — never on the bare tap of a number.
//
// Props:
//   value       — the digit currently in the slot (shown when no children given).
//   placeholder — what to show when value is null/undefined (default "?").
//   armed       — true when a digit is selected AND this slot is a legal target
//                 (e.g. a denominator slot is NOT armed while 0 is selected).
//   disabled    — inert.
//   onPlace     — (k) => void. On DROP we pass the dropped digit; on a tap we
//                 call it with no argument (the parent supplies the selected one).
//   className/style/children — passthrough for the slot's look (reuse the
//                 lesson's own n/d/bignum slot classes).
import React, { useState } from "react";
import { DIGIT_DND_TYPE } from "./DigitGrid.jsx";

export function DigitSlot({
  value,
  placeholder = "?",
  armed = false,
  disabled = false,
  onPlace,
  className = "",
  style,
  children,
  "aria-label": ariaLabel,
}) {
  const [over, setOver] = useState(false);

  const allowDrop = (e) => {
    if (disabled || !armed) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const onDrop = (e) => {
    if (disabled || !armed) return;
    e.preventDefault();
    setOver(false);
    let k = NaN;
    try { k = parseInt(e.dataTransfer.getData(DIGIT_DND_TYPE), 10); } catch (_) {}
    if (!Number.isNaN(k)) onPlace?.(k);
  };

  return (
    <button
      type="button"
      className={
        "digit-slot" +
        (armed ? " is-armed" : "") +
        (over && armed ? " is-over" : "") +
        (className ? " " + className : "")
      }
      style={style}
      disabled={disabled}
      aria-label={ariaLabel}
      onDragOver={allowDrop}
      onDragEnter={(e) => { if (!disabled && armed) { e.preventDefault(); setOver(true); } }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      onClick={() => { if (!disabled && armed) onPlace?.(); }}
    >
      {children ?? (value == null ? placeholder : value)}
    </button>
  );
}

export default DigitSlot;
