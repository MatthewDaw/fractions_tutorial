// EqFrac / FracSlots — the big stacked fraction glyph + the fill-in variant.
//
// Port of eqFrac() (docs/wireframe/src/eqBox.js:37) and fracSlots()
// (eqBox.js:78). Uses the shared .bignum markup (red numerator over an ink bar)
// from lesson.css; the fill-in slots add the dashed-ring `eq-slot-active` from
// assets.css. Replaces the per-room BigFrac / EqFrac / BigFracInline copies.
import React from "react";
import { DigitSlot } from "./DigitSlot.jsx";

/**
 * EqFrac — the big fraction glyph: a red numerator over an ink bar over the
 * denominator. Wraps .bignum in an .eq-frac so eq.css/assets.css can size it.
 *
 * Props: n, d, className (extra class on .eq-frac), big (optional px font-size).
 */
export function EqFrac({ n, d, className = "", big }) {
  return (
    <div className={"eq-frac" + (className ? " " + className : "")}>
      <div className="bignum" style={big ? { fontSize: big } : undefined}>
        <span className="n" style={{ color: "var(--red)" }}>{n}</span>
        <span className="bar" style={{ background: "var(--ink)" }} />
        <span className="d">{d}</span>
      </div>
    </div>
  );
}

/**
 * BigFrac — the bare .bignum glyph (no .eq-frac wrapper), for inline use in an
 * equation row / answer bar. Port of the inline bignum builders.
 *
 * Props: n, d, big (optional px font-size), className.
 */
export function BigFrac({ n, d, big, className = "" }) {
  return (
    <span className={"bignum" + (className ? " " + className : "")} style={big ? { fontSize: big } : undefined}>
      <span className="n" style={{ color: "var(--red)" }}>{n}</span>
      <span className="bar" style={{ background: "var(--ink)" }} />
      <span className="d">{d}</span>
    </span>
  );
}

/**
 * FracSlots — a fill-in fraction. TWO input models:
 *   • CLICK (default): pass `onPick(slot)` — tapping a slot makes it `active`.
 *   • DRAG-TO-PLACE: pass `onDropDigit(slot, digit)` — each slot becomes a drop
 *     target for a digit dragged from a <DigitGrid mode="drag">; `armedN`/`armedD`
 *     light up the legal slots while a digit is selected (a denominator is never
 *     a legal target for 0). Tapping an armed slot also places the selected digit.
 *
 * Props:
 *   n, d     — current contents (may be "" / "?" for an empty slot).
 *   active   — which slot is waiting ("n" | "d" | null) — the dashed ring.
 *   big      — glyph px font-size (default 56).
 *   onPick   — optional (slot) => void; click model.
 *   onDropDigit — optional (slot, digit) => void; drag-to-place model.
 *   armedN/armedD — highlight + enable each slot as a drop target (drag model).
 */
export function FracSlots({ n, d, active = "n", big = 56, onPick, onDropDigit, armedN = false, armedD = false }) {
  if (onDropDigit) {
    return (
      <span className="bignum" style={{ fontSize: big }}>
        <DigitSlot armed={armedN} onPlace={(k) => onDropDigit("n", k)} className={active === "n" ? "eq-slot-active" : ""} aria-label="top number — drop a number here">
          <span className="n" style={{ color: "var(--red)" }}>{n}</span>
        </DigitSlot>
        <span className="bar" style={{ background: "var(--ink)" }} />
        <DigitSlot armed={armedD} onPlace={(k) => onDropDigit("d", k)} className={active === "d" ? "eq-slot-active" : ""} aria-label="bottom number — drop a number here">
          <span className="d">{d}</span>
        </DigitSlot>
      </span>
    );
  }
  const slotProps = (slot) =>
    onPick
      ? { onClick: () => onPick(slot), role: "button", tabIndex: 0, style: { cursor: "pointer" } }
      : {};
  return (
    <span className="bignum" style={{ fontSize: big }}>
      <span className={"n" + (active === "n" ? " eq-slot-active" : "")} style={{ color: "var(--red)" }} {...slotProps("n")}>{n}</span>
      <span className="bar" style={{ background: "var(--ink)" }} />
      <span className={"d" + (active === "d" ? " eq-slot-active" : "")} {...slotProps("d")}>{d}</span>
    </span>
  );
}

export default EqFrac;
