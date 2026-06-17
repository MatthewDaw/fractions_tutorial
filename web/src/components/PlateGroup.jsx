// PlateGroup.jsx — the m1 (Equal Groups) manipulative, now rendered as the SHARED
// kitchen JARS + PLUMS visual (matching the wireframe room-m1, which replaced the
// old plates with jar()/kq-jars + a kq-tray of kq-plum to drag). The component name
// stays `PlateGroup` (and `BowlGroup`) so AppM1's existing call sites are untouched;
// only the VISUAL ASSET changed (plate→jar, pelmeni→plum). All mechanics are
// preserved verbatim: drag-to-fill, equal-group spill-back, ghost fade, and the
// read-only filled/tapped states for the Bind/Fade stages.
//
// THE EQUAL-GROUP INVARIANT IS ENFORCED (the emotional centre of m1):
//   • Every jar may hold AT MOST `cap` (= the target group size M) plums. A drop
//     onto a full jar is REFUSED — the plum "spills back" to the pile (the onAdd
//     handler refuses; nothing is placed). Commutativity is DEFERRED, so jars are
//     NEVER rotated — count × size role order is fixed.
//   • A jar's outline reflects its state against the others:
//       normal      — fewer than `cap`, still being filled  (neutral kitchen tone)
//       equal-ok    — exactly `cap`, matching the target     (ROLE_COLORS.correct)
//       incorrect   — flagged unequal (set via `flagUnequal`) (ROLE_COLORS.incorrect)
//
// LAYOUT / FIT (Issue 1): the jar row is HORIZONTAL and sizes itself from the
// available stage height. The wrapper measures its own height and derives a
// per-jar size + gap so all N jars fit with no scroll/clipping (the fixed
// 1280×800 stage cannot scroll). A CSS var --mg-jar drives jar height; plums scale
// with it.
//
// PROPS (unchanged contract):
//   plates     : number[]   — current count of plums in each jar (length = N groups)
//   cap        : number     — the equal-group target size M (a jar maxes out here)
//   onAdd(i)   : (index) => boolean|void — request to drop one plum on jar i;
//                 a full jar simply refuses — the pile plum then spills back.
//   onClear(i) : (index) => void — request to empty jar i (right-click a jar)
//   flagUnequal: boolean    — paint not-yet-full jars red (used on a failed check)
//   ghost      : boolean    — dim the whole row to a faint check (Fade stage)
//   variant    : "plate" | "bowl" — kept for API compatibility (BowlGroup); both
//                 render the same jar glyph now.
//   readOnly   : boolean    — disable interaction (solved / Fade)
//   pile       : boolean    — show the draggable plum tray + drag-to-fill (Stage 1)
//   pileTotal  : number     — how many plums the tray holds to begin with. The tray
//                 DEPLETES as plums land in jars (remaining = pileTotal − placed),
//                 and refills when a jar is emptied. Defaults to cap × #jars, so the
//                 tray empties to zero exactly when every jar is full.
import React, { useRef, useState, useLayoutEffect, useCallback } from "react";
import { ROLE_COLORS } from "../denominatorColors.js";

// Clustered plum positions inside a jar (matches manip.js JARPLUMS geometry,
// drawn in the jar's 56×76 viewBox coordinate space).
const JARPLUMS = {
  0: [],
  1: [[28, 52]],
  2: [[20, 52], [36, 52]],
  3: [[28, 38], [20, 55], [36, 55]],
  4: [[20, 40], [36, 40], [20, 56], [36, 56]],
};

// one jar holding `k` plums — the verbatim manip.js jar() SVG, as JSX so the
// outline/state ring can be applied via the wrapping button.
function Jar({ k = 0, size = 62 }) {
  const h = Math.round(size * (76 / 56)); // preserve the 56×76 aspect
  return (
    <svg width={size} height={h} viewBox="0 0 56 76" className="kq-jar" aria-hidden="true">
      <rect x="9" y="13" width="38" height="9" rx="2" fill="var(--paper-2)" stroke="var(--ink)" strokeWidth="2.2" />
      <path d="M11 22 H45 V66 a8 8 0 0 1 -8 8 H19 a8 8 0 0 1 -8 -8 Z" fill="var(--paper-1)" stroke="var(--ink)" strokeWidth="2.4" />
      {(JARPLUMS[k] || []).map(([x, y], idx) => (
        <circle key={idx} cx={x} cy={y} r="6" fill="var(--red)" stroke="var(--red-deep)" strokeWidth="1.6" />
      ))}
    </svg>
  );
}

// one loose plum for the tray / drag ghost (the kq-plum disc).
function Plum({ size = 18 }) {
  return <span className="kq-plum" style={{ width: size, height: size }} aria-hidden="true" />;
}

function jarState(count, cap, flagUnequal) {
  if (flagUnequal && count !== cap) return "incorrect";
  if (count === cap && cap > 0) return "equal-ok";
  return "normal";
}

const STATE_OUTLINE = {
  normal: "var(--ink-mute, #6b5a47)",
  "equal-ok": ROLE_COLORS.correct,
  incorrect: ROLE_COLORS.incorrect,
};

// Derive a per-jar height that fits N jars (+ gaps) in `avail` px of height.
// Clamped to a comfortable touch range so it never gets tiny or absurdly large.
function fitJarSize(avail, n) {
  if (!avail) return 116;
  // jars sit in a single ROW, so height is the constraint per jar (the row is
  // wide). Reserve room for the count label below each jar (~30px).
  const raw = avail - 40;
  return Math.max(72, Math.min(150, Math.floor(raw)));
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

  // ── responsive fit ──────────────────────────────────────────────────────────
  // Measure the wrapper's height and size each jar so the row fits with no scroll.
  const wrapRef = useRef(null);
  const [jarH, setJarH] = useState(() => fitJarSize(0, plates.length));
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.clientHeight;
      setJarH(fitJarSize(h, plates.length));
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(el);
    window.addEventListener("resize", measure);
    return () => { if (ro) ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [plates.length]);

  // jar SVG aspect is 56×76, so its rendered WIDTH is jarH * (56/76).
  const jarW = Math.round(jarH * (56 / 76));
  const plumSize = Math.max(14, Math.round(jarW * 0.3));

  // ── drag-to-fill ──────────────────────────────────────────────────────────────
  // A lightweight pointer drag: pressing a tray plum captures the pointer and moves
  // a floating ghost with it; on release we hit-test the jars (by their bounding
  // boxes) and ask the room to place one there. Works with finger/stylus.
  const jarRefs = useRef([]);
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
    // hit-test against each jar's rect → drop into the one under the pointer
    let hit = -1;
    jarRefs.current.forEach((node, i) => {
      if (!node) return;
      const r = node.getBoundingClientRect();
      if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) hit = i;
    });
    if (hit >= 0) onAdd(hit); // room guards cap; a full jar simply refuses (spill-back)
  }, [onAdd]);

  const row = (
    <div
      className={"mg-jars" + (ghost ? " mg-ghost" : "") + (pile ? " mg-with-pile" : "")}
      role="group"
      aria-label={`${plates.length} jars`}
      style={{ "--mg-jar": jarH + "px" }}
    >
      {plates.map((count, i) => {
        const st = jarState(count, cap, flagUnequal);
        const outline = STATE_OUTLINE[st];
        return (
          <div key={i} className={"mg-group mg-jargroup is-" + st} ref={(n) => (jarRefs.current[i] = n)}>
            <button
              type="button"
              className={"mg-jarvessel is-" + st}
              style={{ borderColor: outline, boxShadow: `0 0 0 2px ${outline}22` }}
              disabled={readOnly}
              // RULE 1 (drag-only object placement): in the PILE stage, plums are
              // ONLY placed by DRAGGING from the tray (startDrag→endDrag→onAdd). A
              // plain tap must NEVER place a plum, so the click path is disabled
              // whenever a pile is present. The remaining (!pile) click is the
              // Stage-2 BIND tap: it carries an abstract "+ size" term into a running
              // sum and places NO concrete object (term assembly, click-based).
              onClick={pile ? undefined : () => { if (!readOnly) onAdd(i); }}
              onContextMenu={(e) => { e.preventDefault(); if (!readOnly) onClear(i); }}
              title={readOnly ? `${count} in jar ${i + 1}` : pile ? `drag plums here — ${count}/${cap}` : `tap to add this group's + ${cap} to the sum`}
              aria-label={`jar ${i + 1}: ${count} of ${cap}${readOnly ? "" : pile ? " — drag a plum here" : " — tap to add this group to the sum"}`}
            >
              <Jar k={Math.min(count, 4)} size={jarW} />
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
        {row}
      </div>
    );
  }

  // PILE layout (Stage 1): a draggable tray of plums sits beside the jar row. The
  // tray holds exactly the supply still to be placed: it starts at `pileTotal`
  // (defaulting to cap × #jars) and DEPLETES one plum for each plum already in a
  // jar, so the tray empties to zero as the jars fill (and refills when a jar is
  // cleared). A refused drop onto a full jar places nothing, so the count is
  // unchanged and the plum visibly "spills back".
  const placed = plates.reduce((a, c) => a + c, 0);
  const total = pileTotal != null ? pileTotal : cap * plates.length;
  const remaining = Math.max(0, total - placed);
  const empty = remaining === 0;
  return (
    <div className="mg-fit mg-fit-pile" ref={wrapRef}>
      {row}
      <div className="mg-pile" role="group" aria-label={`tray of plums — ${remaining} left, drag onto a jar`}>
        <div className={"mg-tray kq-tray" + (empty ? " is-empty" : "")}>
          {Array.from({ length: remaining }).map((_, k) => (
            <span
              key={k}
              className="mg-tray-piece"
              role="button"
              tabIndex={readOnly ? -1 : 0}
              aria-label="plum — drag onto a jar"
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              style={{ touchAction: "none" }}
            >
              <Plum size={plumSize} />
            </span>
          ))}
        </div>
        <div className="mg-pile-lab">{empty ? "tray empty — all in the jars ✓" : `${remaining} plums left — drag onto a jar`}</div>
      </div>
      {drag && (
        <span className="mg-drag-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <Plum size={Math.min(28, plumSize + 6)} />
        </span>
      )}
    </div>
  );
}

// BowlGroup — kept for API compatibility (the Workbench prop-variant). Renders the
// same jar glyph; the Workbench stage (4) uses BlockSandbox, not this, so this is
// only a safety alias for any residual import.
export function BowlGroup(props) {
  return <PlateGroup {...props} variant="bowl" />;
}
