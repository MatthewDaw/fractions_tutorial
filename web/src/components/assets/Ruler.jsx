// Ruler — the partition ruler strip (Wave F).
//
// The shared 0 → 1 ruler cut into N equal pieces, with a set of pieces inked red.
// This is the app analog of the per-room ruler helpers (room-den.js / room-num.js
// inline ruler, AppNum Ruler, AppCompare RulerStrip). Classes (.den-ruler-wrap /
// .den-ruler / .den-seg / .den-ends) come from assets.css.
import React from "react";

/**
 * Ruler — a strip split into `parts` equal segments; the segments whose index is
 * in `on` (or 0..on-1 when `on` is a number) are inked red. End labels (0 … 1, or
 * a custom pair) sit under the strip.
 *
 * Props:
 *   parts    — number of equal pieces (the denominator).
 *   on       — which pieces are inked. A number k → the first k pieces; an array
 *              of indices → exactly those; default 0 (none).
 *   labels   — [leftLabel, rightLabel] under the ends (default ["0","1"]).
 *   segLabel — optional (i) => node printed inside each piece.
 *   w        — strip px width (default 560).
 *   small    — the shorter strip variant (is-sm).
 *   onSeg    — optional (i) => void; makes pieces tappable.
 *   className, target — passthrough class + the red "is-target" frame.
 */
export function Ruler({
  parts, on = 0, labels = ["0", "1"], segLabel,
  w = 560, small = false, onSeg, className = "", target = false,
}) {
  const isOn = (i) => (Array.isArray(on) ? on.includes(i) : i < on);
  const segs = [];
  for (let i = 0; i < parts; i++) {
    segs.push(
      <div
        key={i}
        className={"den-seg" + (isOn(i) ? " is-unit" : "")}
        onClick={onSeg ? () => onSeg(i) : undefined}
        style={onSeg ? { cursor: "pointer" } : undefined}
      >
        {segLabel && <span className="den-seg-lab">{segLabel(i)}</span>}
      </div>
    );
  }
  return (
    <div className={"den-ruler-wrap" + (className ? " " + className : "")}>
      <div
        className={"den-ruler" + (small ? " is-sm" : "") + (target ? " is-target" : "")}
        style={{ "--den-ruler-w": `${w}px` }}
      >
        {segs}
      </div>
      {labels && (
        <div className="den-ends" style={{ "--den-ruler-w": `${w}px` }}>
          <span>{labels[0]}</span><span>{labels[1]}</span>
        </div>
      )}
    </div>
  );
}

export default Ruler;
