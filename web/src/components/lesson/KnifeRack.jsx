// KnifeRack + useKnifeCut — the ONE shared "cut by dragging a knife" template.
//
// Every lesson/tool that splits a strip/ruler/square uses THIS, so the splitting
// tool is identical everywhere and lives in the page's question rail (not the
// play area). A rack of draggable <Knife> sprites; drag one onto a cut target to
// slice it; a portal "ghost" knife follows the cursor; the target highlights
// (.eq-cut-target.is-hot) while a knife hovers; releasing over it fires the cut.
// Knives stay tap/Enter-activatable too (keyboard/touch fallback).
//
//   const knife = useKnifeCut(targetRef, onCut, disabled);
//   // in the rail:  <KnifeRack options={[2,3,4]} onGrab={knife.grabKnife}
//   //                          onTap={knife.tapKnife} disabled={solved} label="…" />
//   // anywhere:     {knife.KnifeGhostPortal}
//
// `targetRef` is the element the knife must land on; `onCut(n)` performs the cut.
// onGrab/onTap are called as (n, e) / (n). For multi-target callers (e.g. two
// strips), pass your own onGrab(n, e) that does its own hit-testing.
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Knife from "../Knife.jsx";
import "../../styles/knife.css";

export function useKnifeCut(targetRef, onCut, disabled) {
  const [knifeDrag, setKnifeDrag] = useState(null); // { n, x, y } while dragging
  const [hotTarget, setHotTarget] = useState(false);
  const suppressClick = useRef(false);
  useEffect(() => () => { setKnifeDrag(null); setHotTarget(false); }, []);

  function isOverTarget(ev) {
    const r = targetRef.current?.getBoundingClientRect();
    if (!r) return false;
    const pad = 28;
    return ev.clientX >= r.left - pad && ev.clientX <= r.right + pad &&
           ev.clientY >= r.top - pad && ev.clientY <= r.bottom + pad;
  }

  function grabKnife(n, e) {
    if (disabled) return;
    if (e && e.preventDefault) e.preventDefault();
    if (!e || e.clientX == null) return;
    const startX = e.clientX, startY = e.clientY;
    let moved = false;
    setKnifeDrag({ n, x: startX, y: startY });
    const move = (ev) => {
      if (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5) moved = true;
      setKnifeDrag((d) => (d ? { ...d, x: ev.clientX, y: ev.clientY } : null));
      setHotTarget(isOverTarget(ev));
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const over = isOverTarget(ev);
      setKnifeDrag(null); setHotTarget(false);
      if (moved) suppressClick.current = true; // a real drag swallows the trailing click
      if (over) onCut(n);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  // tap/Enter fallback on a knife: cut unless we just finished a real drag.
  function tapKnife(n) {
    if (disabled) return;
    if (suppressClick.current) { suppressClick.current = false; return; }
    onCut(n);
  }

  const KnifeGhostPortal = knifeDrag
    ? createPortal(
        <div
          style={{ left: knifeDrag.x, top: knifeDrag.y, position: "fixed", transform: "translate(-50%,-50%)", zIndex: 9999, pointerEvents: "none" }}
          aria-hidden="true"
        >
          <Knife n={knifeDrag.n} dragging scale={0.62} />
        </div>,
        document.body
      )
    : null;

  return { knifeDrag, hotTarget, grabKnife, tapKnife, KnifeGhostPortal };
}

// A rack of draggable Knife sprites — one per N in `options`. The ONE knife
// interaction everywhere: DRAG a knife onto the cut target to slice it into N.
// A tap (or Enter/Space) is only a keyboard/touch ACCESSIBILITY fallback — knives
// are never click-to-select buttons. Calls onGrab(n, e) on grab and onTap(n) on
// the fallback tap (onTap optional → drag-only).
//
//   describe(n) — an optional caption beside each knife (e.g. "cut each cell into 4").
export function KnifeRack({ options, onGrab, onTap, disabled, label = "drag a knife to cut", describe }) {
  return (
    <div className="den-knife-rack">
      {label && <span className="den-knife-rack-lab">{label}</span>}
      <div className="den-knife-row">
        {options.map((n) => (
          <div
            key={n}
            className={"den-knife-tool" + (disabled ? " is-frozen" : "") + (describe ? " has-desc" : "")}
            style={disabled ? undefined : { touchAction: "none" }}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={`knife — cut into ${n}`}
            onKeyDown={disabled || !onTap ? undefined : (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTap(n); } }}
          >
            <Knife n={n} scale={0.5} onGrab={disabled ? undefined : (e) => onGrab(n, e)} />
            {describe && <span className="den-knife-desc">{describe(n)}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default KnifeRack;
