// MixRuler / MixedNum / MixedSlots — the Mixed-Numbers primitives (Wave F).
//
// Port of mixRuler() / mixedNum() / mixedSlots() (docs/wireframe/src/eqBox.js:45,
// 60, 81). Classes (.mix-ruler-wrap / .mix-ruler / .mix-seg / .mix-labels /
// .mix-num / .mix-whole / .mix-frac / .mix-n / .mix-d) come from assets.css.
// Replaces AppR5's inline MixRuler / MixedNumDisplay.
import React from "react";
import { DigitSlot } from "./DigitSlot.jsx";

/**
 * MixRuler — a number-line strip running 0 → `wholes`, each whole cut into `den`
 * pieces, the first `num` pieces shaded. Whole boundaries get a heavier divider;
 * 0,1,2 … labels sit under the line.
 *
 * Props: num, den, wholes, w (strip px width, default 560), className.
 */
export function MixRuler({ num, den, wholes, w = 560, className = "" }) {
  const total = wholes * den;
  const segs = [];
  for (let i = 0; i < total; i++) {
    const wholeEnd = (i + 1) % den === 0 && i + 1 < total;
    segs.push(<div key={i} className={"mix-seg" + (i < num ? " is-on" : "") + (wholeEnd ? " whole-end" : "")} />);
  }
  const labels = Array.from({ length: wholes + 1 }, (_, i) => <span key={i}>{i}</span>);
  return (
    <div className={"mix-ruler-wrap" + (className ? " " + className : "")}>
      <div className="mix-ruler" style={{ "--mix-w": `${w}px` }}>{segs}</div>
      <div className="mix-labels" style={{ "--mix-w": `${w}px` }}>{labels}</div>
    </div>
  );
}

/**
 * MixedNum — the mixed-number glyph: a big whole number next to a small stacked
 * fraction (e.g. 1¾). Port of mixedNum().
 *
 * Props: whole, n, d.
 */
export function MixedNum({ whole, n, d }) {
  return (
    <span className="mix-num">
      <span className="mix-whole">{whole}</span>
      <span className="mix-frac"><span className="mix-n">{n}</span><span className="mix-d">{d}</span></span>
    </span>
  );
}

/**
 * MixedSlots — the FILL-IN mixed number. TWO input models (like FracSlots):
 *   • CLICK (default): pass `onPick(slot)` — tapping a slot makes it `active`.
 *   • DRAG-TO-PLACE: pass `onDropDigit(slot, digit)` — each slot becomes a drop
 *     target for a digit dragged from a <DigitGrid mode="drag">; `armed` (a map
 *     { w, n, d } of booleans) lights up the legal slots while a digit is
 *     selected. Tapping an armed slot also places the selected digit.
 * active ∈ {"w","n","d"}.
 */
export function MixedSlots({ whole, n, d, active = "w", onPick, onDropDigit, armed = {} }) {
  if (onDropDigit) {
    return (
      <span className="mix-num">
        <DigitSlot armed={!!armed.w} onPlace={(k) => onDropDigit("w", k)} className={"mix-whole" + (active === "w" ? " eq-slot-active" : "")} aria-label="whole number — drop a number here">{whole}</DigitSlot>
        <span className="mix-frac">
          <DigitSlot armed={!!armed.n} onPlace={(k) => onDropDigit("n", k)} className={"mix-n" + (active === "n" ? " eq-slot-active" : "")} aria-label="top number — drop a number here">{n}</DigitSlot>
          <DigitSlot armed={!!armed.d} onPlace={(k) => onDropDigit("d", k)} className={"mix-d" + (active === "d" ? " eq-slot-active" : "")} aria-label="bottom number — drop a number here">{d}</DigitSlot>
        </span>
      </span>
    );
  }
  const slotProps = (slot) =>
    onPick ? { onClick: () => onPick(slot), role: "button", tabIndex: 0, style: { cursor: "pointer" } } : {};
  return (
    <span className="mix-num">
      <span className={"mix-whole" + (active === "w" ? " eq-slot-active" : "")} {...slotProps("w")}>{whole}</span>
      <span className="mix-frac">
        <span className={"mix-n" + (active === "n" ? " eq-slot-active" : "")} {...slotProps("n")}>{n}</span>
        <span className={"mix-d" + (active === "d" ? " eq-slot-active" : "")} {...slotProps("d")}>{d}</span>
      </span>
    </span>
  );
}

export default MixRuler;
