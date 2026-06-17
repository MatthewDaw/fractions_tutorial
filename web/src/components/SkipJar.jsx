// SkipJar.jsx — the m3 (Times Facts) skip-counting manipulative. A jar fills one
// SCOOP at a time; every scoop drops the SAME group of DISTINCT, COUNTABLE CUBES
// (e.g. 8 cubes). The child SEES "N groups of M" as concrete grouped objects: each
// scoop adds one visible cluster of `groupSize` cubes, so the jar accumulates into
// `groups` clusters = groups × groupSize distinct cubes. A small running tally sits
// beside the jar as a SECONDARY readout (the anti-drift guard) — the cubes, not the
// number, are the primary visual.
//
// CONTROLLED-ISH: the room owns groupSize/groups/filled and the onScoop callback;
// the jar owns the visual cubes + the running tally derived from `filled`.
//
//   props:
//     groupSize : number   — cubes per scoop (the "size" factor, e.g. 8)
//     groups    : number   — how many scoops make a full jar (the "count", e.g. 7)
//     filled    : number   — how many scoops are currently in (0..groups)
//     onScoop() : ()=>void — fired when the child taps the scoop (add one cluster)
//     ghost     : boolean  — dim the jar to a faint check (Fade stage)
//
// Cubes are colored by the group SIZE using the shared denominator palette
// (colorblind-safe hue + hatch + readable outline) so all "groups of 8" share one
// distinct, glyph-backed color — same visual approach as BlockSandbox's number mode.
import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { denomColor, denomTone } from "../denominatorColors.js";

export default function SkipJar({
  groupSize = 1,
  groups = 1,
  filled = 0,
  onScoop = () => {},
  ghost = false,
  showScoop = true,
}) {
  const clampedFilled = Math.max(0, Math.min(groups, filled));
  const tally = clampedFilled * groupSize;            // the small running total
  const full = clampedFilled >= groups;

  // DRAG-TO-SCOOP (drag-only): the child drags the scoop bowl and drops it INTO the
  // jar; a ghost bowl follows the pointer in real time and the jar body lights up as
  // the drop target. Mirrors AppR5's grabBlock / SkipLine's grabChip. A plain pointer
  // tap does NOT scoop — only a real drag-into-jar places a group. Keyboard
  // Enter/Space on the <button> still scoops (non-pointer a11y path only).
  const jarBodyRef = useRef(null);
  const movedRef = useRef(false);
  const [drag, setDrag] = useState(null); // { x, y } | null
  const [hotJar, setHotJar] = useState(false);

  function overJar(ev) {
    const el = jarBodyRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const pad = 36; // a forgiving drop band around the jar mouth
    return ev.clientX >= r.left - pad && ev.clientX <= r.right + pad &&
           ev.clientY >= r.top - pad && ev.clientY <= r.bottom + pad;
  }

  function grabScoop(e) {
    if (full || ghost) return;
    // No pointer info (keyboard/Enter via the button) → let the click handler scoop.
    if (!e || e.clientX == null) return;
    e.preventDefault();
    movedRef.current = false;
    const startX = e.clientX, startY = e.clientY;
    setDrag({ x: e.clientX, y: e.clientY });
    setHotJar(overJar(e));
    const move = (ev) => {
      if (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5) movedRef.current = true;
      setDrag({ x: ev.clientX, y: ev.clientY });
      setHotJar(overJar(ev));
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const dropped = overJar(ev);
      setDrag(null); setHotJar(false);
      // Only a real drag that ends over the jar scoops. A no-move press does NOT
      // scoop (no tap fallback); a drag that misses the jar cancels.
      if (movedRef.current && dropped) onScoop();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  // Each poured scoop is one CLUSTER of `groupSize` distinct cubes, oldest → newest.
  const clusters = Array.from({ length: clampedFilled }, (_, i) => i);

  // Scoop bowl color (squares in the draggable scoop).
  const cubeFill = denomColor(groupSize);
  const cubeEdge = denomTone(groupSize, 0.6);

  return (
    <div className={"m3-jarwrap" + (ghost ? " is-ghost" : "")}>
      {/* BIG scoop-count to the LEFT of the jar — how many scoops (groups) are in
          right now. The prominent readout; grows as the child pours. Shown on
          every jar stage (manipulate / bind / fade). */}
      <div className="m3-jar-scoopnum" aria-label={`${clampedFilled} scoop${clampedFilled === 1 ? "" : "s"} in the jar`}>
        <span className="m3-jar-scoopnum-n">{clampedFilled}</span>
        <span className="m3-jar-scoopnum-lab">scoop{clampedFilled === 1 ? "" : "s"}</span>
      </div>

      {/* the jar itself — the poured clusters of cubes pile up inside it */}
      <div className="m3-jar" aria-label={`jar holding ${clampedFilled} groups of ${groupSize} — ${tally} cubes`}>
        <div className="m3-jar-neck" aria-hidden="true" />
        <div ref={jarBodyRef} className={"m3-jar-body" + (hotJar ? " is-hot" : "")}>
          <div className="m3-jar-cubes">
            {clusters.length === 0 ? (
              <div className="m3-jar-empty" aria-hidden="true">empty</div>
            ) : (
              clusters.map((ci) => (
                <div key={ci} className="m3-cluster" title={`group ${ci + 1} of ${groupSize}`} style={{ gridTemplateColumns: `repeat(${groupSize}, 1fr)` }}>
                  {Array.from({ length: groupSize }, (_, k) => (
                    <svg key={k} viewBox="0 0 32 32" className="kq-pebble" aria-hidden="true">
                      <circle cx="16" cy="16" r="13" fill="#d1495b" stroke="#a33040" strokeWidth="2" />
                    </svg>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
        {/* small SECONDARY running-tally label under the jar */}
        <div className="m3-jar-tally">
          <span className="m3-jar-tally-n">{tally}</span>
          <span className="m3-jar-tally-label">cubes ({clampedFilled} group{clampedFilled === 1 ? "" : "s"} of {groupSize})</span>
        </div>
      </div>

      {/* the side scale: each poured scoop, its running total stamped on it */}
      <div className="m3-scale" aria-label="skip-count so far">
        {clusters.length === 0 ? (
          <div className="m3-scale-empty">empty — start scooping</div>
        ) : (
          clusters.map((ci) => (
            <div key={ci} className="m3-scale-step">
              <span className="m3-scale-step-num" aria-label={`row ${ci + 1}`}>{ci + 1}</span>
              <span className="m3-scale-step-add">+{groupSize}</span>
              <span className="m3-scale-step-tot">{(ci + 1) * groupSize}</span>
            </div>
          ))
        )}
      </div>

      {/* the scoop bowl — DRAG it into the jar to pour ONE group of `groupSize`
          cubes (drag-only; keyboard Enter/Space also scoops for a11y). Hidden when
          `showScoop` is false (e.g. the Bind stage, where pouring is disabled). */}
      {showScoop && (
      <div className="m3-scoopzone">
        <button
          type="button"
          className={"m3-scoop" + (drag ? " is-dragging" : "")}
          style={{ touchAction: "none" }}
          onPointerDown={grabScoop}
          onClick={(e) => {
            // Reset the synthetic-click guard left by a real pointer-drag.
            if (movedRef.current) { movedRef.current = false; return; }
            // POINTER taps do NOT scoop (no tap-to-place fallback). Only a keyboard
            // activation (Enter/Space → e.detail === 0) places a group.
            if (e.detail !== 0) return;
            if (!full && !ghost) onScoop();
          }}
          disabled={full || ghost}
          title={full ? "the jar is full" : `drag the scoop into the jar — ${groupSize} cubes`}
          aria-label={`scoop ${groupSize} more cubes into the jar`}
        >
          <span className="m3-scoop-bowl" aria-hidden="true">
            {Array.from({ length: groupSize }, (_, k) => (
              <span key={k} className="m3-scoop-cube" style={{ background: cubeFill, borderColor: cubeEdge }} />
            ))}
          </span>
          <span className="m3-scoop-lab">scoop {groupSize}</span>
        </button>
        <div className="m3-scoop-count">
          {clampedFilled} / {groups} scoops
        </div>
        {!full && !ghost && (
          <div className="m3-scoop-dragcue" aria-hidden="true">drag into the jar ↑</div>
        )}
      </div>
      )}

      {/* the scoop ghost that follows the pointer while dragging into the jar.
          Portaled to <body> so its position:fixed resolves against the VIEWPORT —
          the app's #stage carries a transform: scale() (Shell.useStageFit), which
          would otherwise become the containing block for this fixed ghost and drift
          it up-left of the real cursor. */}
      {drag && createPortal(
        <div className="m3-scoop-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <span className="m3-scoop-bowl">
            {Array.from({ length: groupSize }, (_, k) => (
              <span key={k} className="m3-scoop-cube" style={{ background: cubeFill, borderColor: cubeEdge }} />
            ))}
          </span>
          <span className="m3-scoop-ghost-lab">+{groupSize}</span>
        </div>,
        document.body
      )}
    </div>
  );
}
