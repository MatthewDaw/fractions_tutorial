// PlateGroup.jsx — the m1 (Equal Groups) manipulative: a VERTICAL stack of N
// plates, each holding 0..M identical pelmeni. On the Manipulate stage a draggable
// PILE of pelmeni sits beside the stack — the child DRAGS a dumpling from the pile
// onto a plate to place one (touch/stylus-first via pointer events). On the later
// stages the plates are shown read-only (filled / ghosted) with no pile.
//
// THE EQUAL-GROUP INVARIANT IS ENFORCED (the emotional centre of m1):
//   • Every plate may hold AT MOST `cap` (= the target group size M) pieces. A drop
//     onto a full plate is REFUSED — the dumpling "spills back" to the pile (the
//     onAdd handler returns false; nothing is placed). Commutativity is DEFERRED,
//     so plates are NEVER rotated — count × size role order is fixed.
//   • A plate's outline reflects its state against the others:
//       normal      — fewer than `cap`, still being filled  (neutral kitchen tone)
//       equal-ok    — exactly `cap`, matching the target     (ROLE_COLORS.correct)
//       incorrect   — flagged unequal (set via `flagUnequal`) (ROLE_COLORS.incorrect)
//
// LAYOUT / FIT (Issue 1): the stack is VERTICAL and sizes itself from the available
// stage height. The wrapper measures its own height and derives a per-plate size +
// gap so all N plates fit with no scroll/clipping (the fixed 1280×800 stage cannot
// scroll). A CSS var --mg-plate drives plate height; pieces scale with it.
//
// Pieces use a FIXED neutral kitchen food tone (R-M3) — never denomTone/denomColor.
//
// PROPS:
//   plates     : number[]   — current count of pelmeni on each plate (length = N groups)
//   cap        : number     — the equal-group target size M (a plate maxes out here)
//   onAdd(i)   : (index) => boolean|void — request to drop one pelmeni on plate i;
//                 return false (or leave plate full) to reject — the pile dumpling
//                 then spills back. The room still guards cap internally.
//   onClear(i) : (index) => void — request to empty plate i (tap a full plate)
//   flagUnequal: boolean    — paint not-yet-full plates red (used on a failed check)
//   ghost      : boolean    — dim the whole stack to a faint check (Fade stage)
//   variant    : "plate" | "bowl" — "bowl" is the Workbench prop-variant (BowlGroup)
//   readOnly   : boolean    — disable interaction (solved / Fade)
//   pile       : boolean    — show the draggable pelmeni pile + drag-to-fill (Stage 1)
//   pileTotal  : number     — how many pelmeni the pile holds to begin with. The pile
//                 DEPLETES as pieces land on plates (remaining = pileTotal − placed),
//                 and refills when a plate is emptied. Defaults to cap × #plates, so
//                 the bowl empties to zero exactly when every plate is full.
import React, { useRef, useState, useLayoutEffect, useCallback } from "react";
import { ROLE_COLORS } from "../denominatorColors.js";

// A fixed neutral kitchen food tone for every piece (R-M3: no denominator hue).
const FOOD = "#c9a36b";       // golden pelmeni dough
const FOOD_EDGE = "#9a7740";  // a darker crimp edge

// Lay pelmeni in a tidy grid inside the plate so 0..M reads at a glance.
function pieceLayout(n) {
  return Array.from({ length: n });
}

// one pelmeni dumpling (a small pinched-dough glyph) — purely decorative
function Pelmeni({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true" className="mg-pelmeni">
      <path
        d="M3 15 Q3 7 13 7 Q23 7 23 15 Q23 21 13 21 Q3 21 3 15 Z"
        fill={FOOD} stroke={FOOD_EDGE} strokeWidth="1.6"
      />
      <path d="M5 13 Q13 9 21 13" fill="none" stroke={FOOD_EDGE} strokeWidth="1.1" opacity="0.7" />
    </svg>
  );
}

function plateState(count, cap, flagUnequal) {
  if (flagUnequal && count !== cap) return "incorrect";
  if (count === cap && cap > 0) return "equal-ok";
  return "normal";
}

const STATE_OUTLINE = {
  normal:    "var(--ink-mute, #6b5a47)",
  "equal-ok": ROLE_COLORS.correct,
  incorrect: ROLE_COLORS.incorrect,
};

// Derive a per-plate height that fits N plates (+ gaps) in `avail` px of height.
// Clamped to a comfortable touch range so it never gets tiny or absurdly large.
function fitPlateSize(avail, n) {
  if (!avail || !n) return 92;
  const gap = 10;                       // px between plates
  const raw = (avail - gap * (n - 1)) / n;
  return Math.max(54, Math.min(108, Math.floor(raw)));
}

export default function PlateGroup({
  plates = [],
  cap = 0,
  onAdd = () => {},
  onClear = () => {},
  flagUnequal = false,
  ghost = false,
  variant = "plate",
  readOnly = false,
  pile = false,
  pileTotal = null,
}) {
  const isBowl = variant === "bowl";

  // ── responsive vertical fit (Issue 1) ──────────────────────────────────────
  // Measure the wrapper's height and size each plate so all N fit with no scroll.
  const wrapRef = useRef(null);
  const [plateH, setPlateH] = useState(() => fitPlateSize(0, plates.length));
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.clientHeight;
      setPlateH(fitPlateSize(h, plates.length));
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(el);
    window.addEventListener("resize", measure);
    return () => { if (ro) ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [plates.length]);

  const pieceSize = Math.max(12, Math.round(plateH * 0.26));

  // ── drag-to-fill (Issue 2) ──────────────────────────────────────────────────
  // A lightweight pointer drag: pressing a pile dumpling captures the pointer and
  // moves a floating ghost with it; on release we hit-test the plates (by their
  // bounding boxes) and ask the room to place one there. Works with finger/stylus.
  const plateRefs = useRef([]);
  const [drag, setDrag] = useState(null); // { x, y } while dragging, else null
  const dragRef = useRef(false);

  // Position the floating drag ghost in the wrapper's LOCAL (CSS) coordinate space,
  // not viewport px — the stage is CSS-transform-scaled, so the wrapper's rect width
  // differs from its layout width; we divide by that scale to undo it.
  const toLocal = (clientX, clientY) => {
    const el = wrapRef.current;
    if (!el) return { x: clientX, y: clientY };
    const r = el.getBoundingClientRect();
    const sx = (r.width / el.offsetWidth) || 1, sy = (r.height / el.offsetHeight) || 1;
    return { x: (clientX - r.left) / sx, y: (clientY - r.top) / sy };
  };

  const startDrag = useCallback((e) => {
    if (readOnly || !pile) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    dragRef.current = true;
    setDrag(toLocal(e.clientX, e.clientY));
  }, [readOnly, pile]);

  const moveDrag = useCallback((e) => {
    if (!dragRef.current) return;
    e.preventDefault();
    setDrag(toLocal(e.clientX, e.clientY));
  }, []);

  const endDrag = useCallback((e) => {
    if (!dragRef.current) return;
    e.preventDefault();
    dragRef.current = false;
    const px = e.clientX, py = e.clientY;
    setDrag(null);
    // hit-test against each plate's rect → drop onto the one under the pointer
    let hit = -1;
    plateRefs.current.forEach((node, i) => {
      if (!node) return;
      const r = node.getBoundingClientRect();
      if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) hit = i;
    });
    if (hit >= 0) onAdd(hit); // room guards cap; a full plate simply refuses (spill-back)
  }, [onAdd]);

  const stack = (
    <div
      className={"mg-plates" + (ghost ? " mg-ghost" : "") + (pile ? " mg-with-pile" : "")}
      role="group"
      aria-label={`${plates.length} ${isBowl ? "bowls" : "plates"}`}
      style={{ "--mg-plate": plateH + "px", "--mg-piece": pieceSize + "px" }}
    >
      {plates.map((count, i) => {
        const st = plateState(count, cap, flagUnequal);
        const outline = STATE_OUTLINE[st];
        return (
          <div key={i} className={"mg-group mg-" + variant + " is-" + st} ref={(n) => (plateRefs.current[i] = n)}>
            <button
              type="button"
              className={"mg-vessel is-" + st}
              style={{ borderColor: outline, boxShadow: `0 0 0 2px ${outline}22` }}
              disabled={readOnly}
              // RULE 1 (drag-only object placement): in the PILE stage, pelmeni are
              // ONLY placed by DRAGGING from the pile (startDrag→endDrag→onAdd). A
              // plain tap must NEVER place a pelmeni, so the click path is disabled
              // whenever a pile is present. The remaining (!pile) click is the Stage-2
              // BIND tap: it carries an abstract "+ size" term into a running sum and
              // places NO concrete object (term assembly, permitted to stay click-based).
              onClick={pile ? undefined : () => { if (!readOnly) onAdd(i); }}
              onContextMenu={(e) => { e.preventDefault(); if (!readOnly) onClear(i); }}
              title={readOnly ? `${count} on ${isBowl ? "bowl" : "plate"} ${i + 1}` : pile ? `drag pelmeni here — ${count}/${cap}` : `tap to add this group's + ${cap} to the sum`}
              aria-label={`${isBowl ? "bowl" : "plate"} ${i + 1}: ${count} of ${cap}${readOnly ? "" : pile ? " — drag a pelmeni here" : " — tap to add this group to the sum"}`}
            >
              <span className="mg-vessel-pieces">
                {pieceLayout(count).map((_, k) => (
                  <span key={k} className="mg-piece-slot"><Pelmeni size={pieceSize} /></span>
                ))}
              </span>
              {st === "equal-ok" && <span className="mg-tick" aria-hidden="true">✓</span>}
            </button>
            <div className="mg-count" style={{ color: outline }}>{count}</div>
          </div>
        );
      })}
    </div>
  );

  if (!pile) {
    return (
      <div className="mg-fit" ref={wrapRef}>
        {stack}
      </div>
    );
  }

  // PILE layout (Stage 1): the draggable bowl of pelmeni sits left, the plate
  // stack right. The pile holds exactly the supply still to be placed: it starts at
  // `pileTotal` (defaulting to cap × #plates) and DEPLETES one dumpling for each
  // pelmeni already on a plate, so the bowl empties to zero as the plates fill (and
  // refills when a plate is cleared). A refused drop onto a full plate places nothing,
  // so the count is unchanged and the dumpling visibly "spills back".
  const placed = plates.reduce((a, c) => a + c, 0);
  const total = pileTotal != null ? pileTotal : cap * plates.length;
  const remaining = Math.max(0, total - placed);
  const empty = remaining === 0;
  return (
    <div className="mg-fit mg-fit-pile" ref={wrapRef}>
      <div className="mg-pile" role="group" aria-label={`pile of pelmeni — ${remaining} left, drag onto a plate`}>
        <div className={"mg-pile-bowl" + (empty ? " is-empty" : "")}>
          {Array.from({ length: remaining }).map((_, k) => (
            <span
              key={k}
              className="mg-pile-piece"
              role="button"
              tabIndex={readOnly ? -1 : 0}
              aria-label="pelmeni — drag onto a plate"
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              style={{ touchAction: "none" }}
            >
              <Pelmeni size={Math.min(34, pieceSize + 6)} />
            </span>
          ))}
        </div>
        <div className="mg-pile-lab">{empty ? "bowl empty — all on the plates ✓" : `🥟 ${remaining} left — drag onto a plate`}</div>
      </div>
      {stack}
      {drag && (
        <span className="mg-drag-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <Pelmeni size={Math.min(38, pieceSize + 8)} />
        </span>
      )}
    </div>
  );
}

// BowlGroup — the Workbench prop-variant (scoops into bowls). Same equal-group
// guard, rendered as bowls instead of plates.
export function BowlGroup(props) {
  return <PlateGroup {...props} variant="bowl" />;
}
