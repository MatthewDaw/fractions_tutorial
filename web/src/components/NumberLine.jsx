import { useRef, useState } from "react";

/* ────────────────────────────────────────────────────────────────────────────
   NumberLine — shared, dependency-free fraction ruler.

   Generalizes the 0→2 ruler lifted out of AppR5 (its UNIT = span/wholes scale
   math + .nline/.ntick/.nlab render). Pure presentational, with an OPTIONAL
   draggable point marker that GLIDES under the finger and snaps to the nearest
   1/den only on release (so it feels like a physical bead on a wire, not a
   value that teleports tick-to-tick).

   Props:
     wholes=1        how many whole units the line spans (0..wholes)
     den             equal partitions per whole (the denominator)
     origin=60       x of the "0" end, in stage-space px
     span=600        total px width of the whole line; UNIT (px/whole)=span/wholes
     lineY=140       y of the line (the .nline top), in stage-space px
     marks           optional extra labels: [{ value, label, ng? }] (value in wholes)
     point           numeric value in wholes (e.g. 0.75) → marker dot
     draggablePoint  if true, the dot is grabbable (pointerdown/move/up)
     onPlace         (value, {live}) → called continuously while dragging with
                     live:true (caption/preview ONLY — do NOT judge), and once on
                     release with live:false (the committed, snapped value to judge)
     benchmarkHalf   draw a tall, labelled ½ reference tick
     labelParts      label every partition tick (¼, 2/4, …), not just the wholes
     fillToPoint     paint a translucent bar from 0→point so the value reads as a
                     LENGTH you can compare at a glance
     fillColor       the fill bar color (default translucent red)
     width           (unused; layout derives from span) — accepted for callers.

   Scale is calibrated by reading #stage width/1280 like AppR1/AppR5, so pointer
   px map correctly into stage-space under the stage's CSS transform.
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
  labelParts = false,
  fillToPoint = false,
  fillColor = "rgba(192,57,43,.16)",
  width,
}) {
  const lineRef = useRef(null);
  // while dragging we track a CONTINUOUS (un-snapped) value so the dot glides;
  // the parent's `point` only updates on release. dragVal===null ⇒ not dragging.
  const [dragVal, setDragVal] = useState(null);

  const UNIT = span / wholes;                 // px per whole
  const TICKS = wholes * den;                 // total tick count (0..TICKS)
  const xOf = (v) => origin + v * UNIT;        // value-in-wholes → stage-space x

  // labels: whole-numbers always; every partition tick too when labelParts.
  const labels = [];
  for (let k = 0; k <= TICKS; k++) {
    const isWhole = k % den === 0;
    if (isWhole) labels.push({ value: k / den, label: String(k / den), ng: true });
    else if (labelParts) labels.push({ value: k / den, label: `${k}/${den}`, part: true });
  }
  if (marks) for (const m of marks) labels.push({ value: m.value, label: m.label, ng: !!m.ng });

  // Guard a non-finite point (e.g. an unplaced NaN handed in by the caller). NaN
  // passes a `!= null` check, so without this the marker/fill would render with
  // left:NaN (a React style warning + a dot at an undefined position). Treat any
  // non-finite value as "no point yet".
  const shownPointRaw = dragVal != null ? dragVal : point;
  const shownPoint = Number.isFinite(shownPointRaw) ? shownPointRaw : null;
  const dragging = dragVal != null;

  // ---- draggable point: glide continuously, snap to nearest 1/den on release ----
  function grabPoint(e) {
    if (!draggablePoint) return;
    if (e && e.preventDefault) e.preventDefault();
    const line = lineRef.current;
    if (!line) return;
    const stage = document.getElementById("stage");
    const k = (stage ? stage.getBoundingClientRect().width / 1280 : 1) || 1;

    const valueAt = (clientX) => {
      const rect = line.getBoundingClientRect();          // live rect (robust to layout)
      const px = (clientX - rect.left) / k;               // px from the line's left edge (=origin)
      return Math.max(0, Math.min(wholes, px / UNIT));     // clamp to [0, wholes], un-snapped
    };

    const move = (ev) => {
      const v = valueAt(ev.clientX);
      setDragVal(v);                                       // smooth, un-snapped dot
      // hand the caller a SNAPPED preview for captions; live:true ⇒ do not judge.
      onPlace && onPlace(Math.round(v * den) / den, { live: true });
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const snapped = Math.round(valueAt(ev.clientX) * den) / den;
      setDragVal(null);                                    // release → settle (CSS eases to tick)
      onPlace && onPlace(snapped, { live: false });        // the committed value to judge
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

      {/* filled sweep 0→point: makes the value a LENGTH you can compare */}
      {fillToPoint && shownPoint != null && (
        <span
          className="nl-fill"
          style={{
            position: "absolute",
            left: origin,
            top: lineY - 5,
            width: Math.max(0, shownPoint * UNIT),
            height: 10,
            background: fillColor,
            borderRadius: 5,
            pointerEvents: "none",
            transition: dragging ? "none" : "width .08s ease",
            zIndex: 5,
          }}
        />
      )}

      {/* ticks: major (taller, solid) on whole boundaries, partition ticks shorter */}
      {Array.from({ length: TICKS + 1 }).map((_, k) => {
        const major = k % den === 0;
        return (
          <span
            key={"t" + k}
            className={"ntick" + (major ? " is-major" : "")}
            style={{
              left: xOf(k / den),
              top: lineY,
              height: major ? 20 : 12,
              width: major ? 2 : 1.5,
              opacity: major ? 1 : 0.72,
            }}
          />
        );
      })}

      {/* whole-number + partition + extra labels (whole numbers get the .ng class) */}
      {labels.filter((l) => Number.isFinite(l.value)).map((l, i) => (
        <span
          key={"l" + i}
          className={"nlab" + (l.ng ? " ng" : "") + (l.part ? " nl-partlab" : "")}
          style={{ left: xOf(l.value), top: lineY + 16, opacity: l.part ? 0.7 : 1 }}
        >
          {l.label}
        </span>
      ))}

      {/* optional ½ benchmark reference tick (tall + labelled) */}
      {benchmarkHalf && (
        <>
          <span
            className="ntick nl-half-tick"
            style={{ left: xOf(0.5 * wholes), top: lineY - 8, height: 26, width: 3, opacity: 0.95 }}
          />
          <span className="nlab nl-half-lab" style={{ left: xOf(0.5 * wholes), top: lineY - 30 }}>
            ½
          </span>
        </>
      )}

      {/* the point marker dot — a grabbable bead that lifts when held */}
      {shownPoint != null && (
        <span
          className={"nl-point" + (draggablePoint ? " is-drag" : "") + (dragging ? " is-grabbing" : "")}
          onPointerDown={grabPoint}
          style={{
            position: "absolute",
            left: xOf(shownPoint),
            top: lineY,
            width: 26,
            height: 26,
            marginLeft: -13,
            marginTop: -13,
            borderRadius: "50%",
            background: "var(--red, #c0392b)",
            border: "3px solid #fff",
            boxShadow: dragging ? "0 5px 14px rgba(0,0,0,.42)" : "0 2px 6px rgba(0,0,0,.3)",
            transform: dragging ? "scale(1.16)" : "scale(1)",
            // 1:1 tracking while dragging; ease into the snapped tick on release
            transition: dragging ? "none" : "left .09s ease, transform .12s ease, box-shadow .12s ease",
            cursor: draggablePoint ? (dragging ? "grabbing" : "grab") : "default",
            touchAction: "none",
            zIndex: 26,
          }}
        />
      )}
    </>
  );
}

// Support BOTH import styles:
//   import { NumberLine } from "./components/NumberLine.jsx"
//   import NumberLine    from "./components/NumberLine.jsx"
export default NumberLine;
