// FractionBuilder.jsx — the ONE reusable "build a fraction on a bar" control.
//
// Composes the shared <Ruler> (a 0→1 strip cut into `den` equal pieces, the first
// `num` inked red) with a TWO-COLOUR numerator/denominator stepper: the numerator
// reads RED ("filled / top") and the denominator reads INK ("pieces / bottom").
// Tapping a bar segment shades up to it; the ± steppers nudge each number. ANY
// change redraws the bar live and reports the new {num, den} via onChange.
//
// Use this everywhere a learner BUILDS or ADJUSTS a fraction and the rectangle/bar
// should redraw to match — instead of hand-wiring Ruler + digit inputs per lesson.
//
// Props:
//   num, den   — current fraction (controlled).
//   onChange   — ({num, den}) => void, fired on any tap/step.
//   minDen/maxDen — denominator bounds for the stepper (default 1…12).
//   maxNum     — numerator cap (default = den; you can't fill more than the whole).
//   w          — bar width px (default 520).
//   disabled   — freeze all interaction (e.g. after solved).
//   tappableBar/showStepper — turn either input affordance off.
import React from "react";
import { Ruler } from "./Ruler.jsx";

export default function FractionBuilder({
  num = 0,
  den = 1,
  onChange,
  minDen = 1,
  maxDen = 12,
  maxNum,
  w = 520,
  disabled = false,
  tappableBar = true,
  showStepper = true,
  className = "",
}) {
  const cap = maxNum == null ? den : maxNum;
  const emit = (n, d) => { if (!disabled && onChange) onChange({ num: n, den: d }); };
  const setNum = (n) => emit(Math.max(0, Math.min(cap, n)), den);
  const setDen = (d) => {
    const nd = Math.max(minDen, Math.min(maxDen, d));
    emit(Math.min(num, nd), nd);     // a fraction never shades more than the whole
  };
  // Tap a segment: fill up to it (i+1); tapping the current top edge unfills it.
  const onSeg = tappableBar && !disabled
    ? (i) => setNum(num === i + 1 ? i : i + 1)
    : undefined;

  const Stepper = ({ kind, value, label, onMinus, onPlus, minusOff, plusOff }) => (
    <div className={"fbuild-step fbuild-step--" + kind}>
      <button type="button" className="fbuild-pm" onClick={onMinus} disabled={disabled || minusOff} aria-label={"one fewer " + label}>−</button>
      <span className={"fbuild-val fbuild-val--" + kind}>{value}</span>
      <button type="button" className="fbuild-pm" onClick={onPlus} disabled={disabled || plusOff} aria-label={"one more " + label}>+</button>
      <span className="fbuild-lab">{label}</span>
    </div>
  );

  return (
    <div className={"fbuild" + (className ? " " + className : "")}>
      <Ruler parts={den} on={num} w={w} onSeg={onSeg} />
      {showStepper && (
        <div className="fbuild-steppers">
          <Stepper
            kind="num" value={num} label="filled"
            onMinus={() => setNum(num - 1)} onPlus={() => setNum(num + 1)}
            minusOff={num <= 0} plusOff={num >= cap}
          />
          <span className="fbuild-over">out of</span>
          <Stepper
            kind="den" value={den} label="pieces"
            onMinus={() => setDen(den - 1)} onPlus={() => setDen(den + 1)}
            minusOff={den <= minDen} plusOff={den >= maxDen}
          />
        </div>
      )}
    </div>
  );
}
