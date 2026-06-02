import { useRef } from "react";

/* ────────────────────────────────────────────────────────────────────────────
   NumberLine — shared, dependency-free fraction ruler.

   Generalizes the 0→2 ruler lifted out of AppR5 (its UNIT = span/wholes scale
   math + .nline/.ntick/.nlab render). Pure presentational, with an OPTIONAL
   draggable point marker.

   Props:
     wholes=1        how many whole units the line spans (0..wholes)
     den             equal partitions per whole (the denominator)
     origin=60       x of the "0" end, in stage-space px
     span=600        px width of ONE whole unit's worth? NO — total px width of
                     the whole line is `span`; UNIT (px per whole) = span/wholes.
     lineY=140       y of the line (the .nline top), in stage-space px
     marks           optional extra labels: [{ value, label, ng? }]
                     value is in wholes (e.g. 0.5), drawn as a .nlab
     point           numeric value in wholes (e.g. 0.75) → marker dot
     draggablePoint  if true, the dot is grabbable (pointerdown/move/up)
     onPlace         called on pointer-up with the dropped value, snapped to
                     the nearest 1/den (in wholes)
     benchmarkHalf   if true, draw a labelled ½ reference tick
     width           (unused override; layout derives from span) — accepted so
                     callers can pass a measured value without breaking.

   The line must live inside an element with id="r5canvas"/"nlcanvas" etc — it
   only needs a positioned ancestor; the drag reads its OWN .nline rect, so it
   is container-agnostic. Scale is calibrated by reading #stage width/1280 like
   AppR1/AppR5, so pointer px map correctly into stage-space.
   ──────────────────────────────────────────────────────────────────────────── */
export function NumberLine({
  wholes = 1,
  den,
  origin = 60,
  span = 600,
  lineY = 140,
  marks,
  point,
  draggablePoint = false,
  onPlace,
  benchmarkHalf = false,
  width,
}) {
  const lineRef = useRef(null);
  const UNIT = span / wholes;                 // px per whole
  const TICKS = wholes * den;                 // total tick count (0..TICKS)
  const xOf = (v) => origin + v * UNIT;       // value-in-wholes → stage-space x

  // whole-number labels + any extra `marks`
  const labels = [];
  for (let k = 0; k <= TICKS; k++) {
    if (k % den === 0) labels.push({ value: k / den, label: String(k / den), ng: true });
  }
  if (marks) for (const m of marks) labels.push({ value: m.value, label: m.label, ng: !!m.ng });

  // ---- draggable point: snap to nearest 1/den, scale-calibrated by #stage ----
  function grabPoint(e) {
    if (!draggablePoint) return;
    if (e && e.preventDefault) e.preventDefault();
    const line = lineRef.current;
    if (!line) return;
    const rect = line.getBoundingClientRect();
    const stage = document.getElementById("stage");
    const k = (stage ? stage.getBoundingClientRect().width / 1280 : 1) || 1;

    const valueAt = (clientX) => {
      // clientX → stage-space px (÷k) → wholes from origin (÷UNIT), then clamp.
      const px = (clientX - rect.left) / k;     // px from the line's left edge (= origin)
      let v = px / UNIT;
      return Math.max(0, Math.min(wholes, v));
    };

    const move = (ev) => {
      const v = valueAt(ev.clientX);
      // live snap-to-tick so the dot tracks tick centers while dragging
      const snapped = Math.round(v * den) / den;
      onPlace && onPlace(snapped, { live: true });
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const snapped = Math.round(valueAt(ev.clientX) * den) / den;
      onPlace && onPlace(snapped, { live: false });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <>
      {/* the line itself */}
      <div
        ref={lineRef}
        className="nline"
        style={{ top: lineY, left: origin, right: "auto", width: span }}
      />

      {/* ticks: major (height 14) on whole boundaries, minor (7) elsewhere */}
      {Array.from({ length: TICKS + 1 }).map((_, k) => (
        <span
          key={"t" + k}
          className="ntick"
          style={{ left: xOf(k / den), top: lineY, height: k % den === 0 ? 14 : 7 }}
        />
      ))}

      {/* whole-number + extra labels (whole numbers get the .ng class) */}
      {labels.map((l, i) => (
        <span
          key={"l" + i}
          className={"nlab" + (l.ng ? " ng" : "")}
          style={{ left: xOf(l.value), top: lineY + 12 }}
        >
          {l.label}
        </span>
      ))}

      {/* optional ½ benchmark reference tick (tall + labelled) */}
      {benchmarkHalf && (
        <>
          <span
            className="ntick nl-half-tick"
            style={{ left: xOf(0.5 * wholes), top: lineY - 6, height: 20, width: 2, opacity: 0.85 }}
          />
          <span
            className="nlab"
            style={{ left: xOf(0.5 * wholes), top: lineY - 26 }}
          >
            ½
          </span>
        </>
      )}

      {/* the point marker dot */}
      {point != null && (
        <span
          className={"nl-point" + (draggablePoint ? " is-drag" : "")}
          onPointerDown={grabPoint}
          style={{
            position: "absolute",
            left: xOf(point),
            top: lineY,
            width: 16,
            height: 16,
            marginLeft: -8,
            marginTop: -8,
            borderRadius: "50%",
            background: "var(--red, #c0392b)",
            border: "2px solid #fff",
            boxShadow: "0 1px 4px rgba(0,0,0,.35)",
            cursor: draggablePoint ? "grab" : "default",
            touchAction: "none",
            zIndex: 26,
          }}
        />
      )}
    </>
  );
}

// Support BOTH import styles in the new lessons:
//   AppNumberLine.jsx  →  import { NumberLine } from "./components/NumberLine.jsx"
//   AppCompare.jsx     →  import NumberLine from "./components/NumberLine.jsx"
export default NumberLine;
