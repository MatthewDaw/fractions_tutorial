// CompareInput — the ONE shared "compare two numbers" input, used everywhere a
// child drags a < = > symbol into a "?" slot (the den Numbers stage, the kitchen
// compare questions, …).
//
// A dashed bin of three symbol tiles ("<", "=", ">") on the LEFT, then the two
// operands with a dashed "?" DROP SLOT between them. The child DRAGS a tile onto
// the "?" slot to place it; a tap on a tile (then a tap on the slot) and keyboard
// Enter/Space are fallbacks. The selection is RE-SELECTABLE — dropping a different
// symbol replaces the one in the slot (never locks after the first pick).
//
// DRAG IMPLEMENTATION — pointer events, NOT HTML5 drag-and-drop. The earlier HTML5
// `draggable`/dataTransfer version could not actually drop a symbol into the slot
// (HTML5 DnD is unreliable on touch and inside the app's CSS-scaled #stage). This
// uses the same pointer-drag + portal-ghost pattern as SkipJar / BlockSandbox /
// the knife: pointerdown on a tile starts a drag, a position:fixed ghost (portaled
// to <body> so the stage transform never offsets it) follows the cursor, the slot
// lights up while hovered, and release over the slot places the symbol. Works with
// mouse and touch, and the live getBoundingClientRect hit-test stays correct under
// the stage scale.
//
// Presentational only — the PARENT owns grading. Picks set `value` via onChange.
//
// Props:
//   left, right — each operand. Either a React node, OR a {num,den} object
//                 (small stacked fraction), OR a {num}/bare value (plain number).
//   value       — the placed symbol ("<" | "=" | ">") or "" / null for empty.
//   onChange    — (sym) => void when a symbol is dropped/tapped/keyed. No grading.
//   disabled    — make the whole surface inert.
//   big         — operand glyph px font-size (default 34).
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import "../../styles/compare.css";

const SYMS = ["<", "=", ">"];

// Render one operand: a {num,den} fraction, a {num}/number, or a raw node.
function Operand({ value, big }) {
  if (value == null) return <span className="cmp-num" style={{ fontSize: big }}>?</span>;
  if (React.isValidElement(value)) return value;
  if (typeof value === "object") {
    const { num, den } = value;
    if (den == null || den === "") {
      return <span className="cmp-num" style={{ fontSize: big }}>{num}</span>;
    }
    return (
      <span className="cmp-frac" style={{ fontSize: big }}>
        <span className="cmp-frac-n">{num}</span>
        <span className="cmp-frac-bar" />
        <span className="cmp-frac-d">{den}</span>
      </span>
    );
  }
  return <span className="cmp-num" style={{ fontSize: big }}>{value}</span>;
}

export function CompareInput({ left, right, value = "", onChange, disabled = false, big = 34 }) {
  const slotRef = useRef(null);
  const movedRef = useRef(false);
  const [armed, setArmed] = useState(null);   // tap-to-place fallback selection
  const [drag, setDrag] = useState(null);     // { sym, x, y } while dragging
  const [over, setOver] = useState(false);    // pointer is over the slot

  const place = (sym) => { if (disabled || !sym) return; onChange?.(sym); setArmed(null); };

  // live hit-test of the "?" slot (a forgiving band so dropping is easy on a tablet)
  function overSlot(ev) {
    const el = slotRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const pad = 30;
    return ev.clientX >= r.left - pad && ev.clientX <= r.right + pad &&
           ev.clientY >= r.top - pad && ev.clientY <= r.bottom + pad;
  }

  function grab(sym, e) {
    if (disabled) return;
    // keyboard / no-pointer activation → arm for the tap fallback
    if (!e || e.clientX == null) { setArmed((c) => (c === sym ? null : sym)); return; }
    e.preventDefault();
    movedRef.current = false;
    const startX = e.clientX, startY = e.clientY;
    setArmed(sym);
    setDrag({ sym, x: startX, y: startY });
    setOver(overSlot(e));
    const move = (ev) => {
      if (Math.abs(ev.clientX - startX) > 4 || Math.abs(ev.clientY - startY) > 4) movedRef.current = true;
      setDrag({ sym, x: ev.clientX, y: ev.clientY });
      setOver(overSlot(ev));
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const dropped = overSlot(ev);
      setDrag(null); setOver(false);
      if (movedRef.current) movedRef.current = false; // a real drag swallows the trailing click
      if (dropped) place(sym);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  // clean up listeners if we unmount mid-drag
  useEffect(() => () => { setDrag(null); setOver(false); }, []);

  // tap a tile: arm it (toggle). A no-move pointer tap (not a drag) lands here.
  const tapTile = (sym) => {
    if (disabled) return;
    if (movedRef.current) { movedRef.current = false; return; }
    setArmed((cur) => (cur === sym ? null : sym));
  };
  // tap the slot: place the armed tile (touch/keyboard fallback)
  const tapSlot = () => { if (!disabled && armed) place(armed); };

  return (
    <div className={"cmp-input" + (disabled ? " is-disabled" : "")}>
      <div className="cmp-symbin" role="group" aria-label="drag a comparison symbol into the slot">
        {SYMS.map((s) => (
          <span
            key={s}
            className={"cmp-sym" + (armed === s ? " is-armed" : "") + (value === s ? " is-picked" : "") + (drag && drag.sym === s ? " is-dragging" : "")}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-pressed={armed === s}
            aria-label={s === "<" ? "less than" : s === ">" ? "greater than" : "equal to"}
            style={{ touchAction: "none" }}
            onPointerDown={(e) => grab(s, e)}
            onClick={() => tapTile(s)}
            onKeyDown={disabled ? undefined : (e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tapTile(s); }
            }}
          >
            {s}
          </span>
        ))}
      </div>
      <div className="cmp-compare">
        <Operand value={left} big={big} />
        <span
          ref={slotRef}
          className={"cmp-drop" + (armed ? " is-armed" : "") + (over && (drag || armed) ? " is-over" : "") + (value ? " is-filled" : "")}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={value ? `comparison symbol ${value} — drop another to replace` : "drop a symbol here"}
          onClick={tapSlot}
          onKeyDown={disabled ? undefined : (e) => {
            if ((e.key === "Enter" || e.key === " ") && armed) { e.preventDefault(); place(armed); }
          }}
        >
          {value || "?"}
        </span>
        <Operand value={right} big={big} />
      </div>

      {/* the symbol ghost that follows the pointer while dragging — portaled to
          <body> so its position:fixed resolves against the viewport, not the
          CSS-scaled #stage (which would otherwise drift it off the cursor). */}
      {drag && createPortal(
        <div className="cmp-sym cmp-sym-ghost" aria-hidden="true"
             style={{ position: "fixed", left: drag.x, top: drag.y }}>
          {drag.sym}
        </div>,
        document.body
      )}
    </div>
  );
}

export default CompareInput;
