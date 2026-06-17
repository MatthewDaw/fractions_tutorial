/* StripCutter — the lesson's strip + knife cutting tool, reusable in kitchen tools.
 *
 * Renders one or two dough STRIPS (the shared <Plank>) and a rack of chef's
 * KNIVES (the shared <Knife>) — the SAME tools the unlike-denominator lesson uses.
 * The child GRABS a ×n knife from the rack and DROPS it on a strip; that strip's
 * blocks slice into n equal pieces (its multiplier becomes n), exactly like the
 * lesson. When two strips reach the same denominator they light up as matched.
 *
 * This is a PURE MANIPULATIVE — it reports progress only and never writes the
 * answer; the child reads the strips and enters the answer themselves.
 *
 * Props:
 *   strips     — [{ num, den }] (1 or 2) base fractions to lay out.
 *   knives     — ×n values for the rack (default [2,3,4]).
 *   unit       — px per whole (strip length scale; default 230).
 *   labelFor   — optional (i) => string shown beside each strip.
 *   disabled / onProgress — KitchenTool contract.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Plank from "../Plank.jsx";
import Knife from "../Knife.jsx";
import UndoSplitButton from "../lesson/UndoSplitButton.jsx";
import "../../styles/lesson.css";
import "../../styles/knife.css";

// The kitchen renders a slot beside the bonus-character (the mr-asker box) where
// the knife rack should live — so the rack sits in the question rail, NOT stacked
// under the strips (which would overflow the tight kitchen play area). We portal
// the rack there when the slot exists; otherwise it falls back to inline.
const KNIFE_SLOT_ID = "kq-knife-slot";

export default function StripCutter({
  strips,
  knives = [2, 3, 4],
  unit = 230,
  labelFor,
  onProgress,
  disabled = false,
}) {
  const [mults, setMults] = useState(() => strips.map(() => 1));
  const [ticks, setTicks] = useState(() => strips.map(() => 0));
  const [drag, setDrag] = useState(null); // { n, x, y } while dragging a knife
  const [hover, setHover] = useState(-1); // index of the strip under the knife
  const [slot, setSlot] = useState(null); // the mr-asker knife slot (portal target)
  const bodyRefs = useRef([]);

  // find the rack's home slot (beside the bonus character) once mounted.
  useEffect(() => { setSlot(document.getElementById(KNIFE_SLOT_ID)); }, []);

  // which strip body (if any) the client point is over.
  const hitStrip = (cx, cy) => {
    for (let i = 0; i < bodyRefs.current.length; i++) {
      const el = bodyRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) return i;
    }
    return -1;
  };

  const cut = useCallback((i, n) => {
    setMults((prev) => { const next = prev.slice(); next[i] = n; return next; });
    setTicks((prev) => { const next = prev.slice(); next[i] = next[i] + 1; return next; });
    onProgress && onProgress({ kind: "manip_step", tool: "stripcut", strip: i, cut: n });
  }, [onProgress]);

  // UNDO a slice — put that strip back together (multiplier → 1), matching the
  // lesson's "↺ put it back together" affordance. Available on every knife level.
  const undo = useCallback((i) => {
    if (disabled) return;
    setMults((prev) => { const next = prev.slice(); next[i] = 1; return next; });
    setTicks((prev) => { const next = prev.slice(); next[i] = 0; return next; });
    onProgress && onProgress({ kind: "manip_step", tool: "stripcut", strip: i, cut: 1, undo: true });
  }, [disabled, onProgress]);

  const grab = (n) => (e) => {
    if (disabled) return;
    e.preventDefault(); e.stopPropagation();
    setDrag({ n, x: e.clientX, y: e.clientY });
    const move = (ev) => { setDrag({ n, x: ev.clientX, y: ev.clientY }); setHover(hitStrip(ev.clientX, ev.clientY)); };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const h = hitStrip(ev.clientX, ev.clientY);
      setDrag(null); setHover(-1);
      if (h >= 0) cut(h, n);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const dens = strips.map((s, i) => s.den * mults[i]);
  const matched = strips.length > 1 && dens.every((d) => d === dens[0]);
  const pristine = mults.every((m) => m === 1);

  // The knife rack — lives BESIDE the bonus character (portaled into the mr-asker
  // slot) when the kitchen provides it; otherwise renders inline as a fallback.
  const rack = (
    <div className="knife-rack kq-stripcut-rack" style={{ opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? "none" : "auto" }}>
      {knives.map((n) => (
        <div className="knife-row" key={n} style={{ opacity: drag && drag.n === n ? 0.18 : 1 }}>
          <Knife n={n} onGrab={grab(n)} hint={!drag && pristine} scale={0.48} />
          <span className="krow-lab">→ {n} pieces</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="kq-tool kq-stripcut">
      <div className="kq-tool-hint">
        Drag a knife onto a strip — it slices every block into that many equal
        pieces{strips.length > 1 ? " (cut both strips to the same size)" : ""}.
      </div>

      {/* extra top + inter-row room so the "undo split" chip floating above each
          strip never collides with the hint above or the strip stacked over it. */}
      <div className="kq-stripcut-strips" style={{ display: "flex", flexDirection: "column", gap: 34, alignItems: "flex-start", marginTop: 28 }}>
        {strips.map((s, i) => (
          <div className="kq-stripcut-row" key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="kq-stripcut-lab" style={{ fontFamily: "var(--display)", fontSize: 15, minWidth: 44 }}>
              {labelFor ? labelFor(i) : `${s.num}/${s.den}`}
            </span>
            <div className="kq-stripcut-plank" style={{ position: "relative", display: "inline-flex" }}>
              <UndoSplitButton
                show={mults[i] > 1 && !disabled}
                onUndo={() => undo(i)}
                label="put the strip back together"
              />
              <Plank
                baseNum={s.num}
                baseDen={s.den}
                m={mults[i]}
                unit={unit}
                sliceTick={ticks[i]}
                matched={matched}
                hoverCut={hover === i && !!drag}
                bodyRef={(el) => { bodyRefs.current[i] = el; }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* rack: portaled next to the bonus character when the slot exists, else inline */}
      {slot ? createPortal(rack, slot) : <div style={{ marginTop: 14 }}>{rack}</div>}

      {/* the knife that follows the pointer while dragging (fixed to the viewport) */}
      {drag && (
        <div
          className="knife-wrap"
          style={{ position: "fixed", left: 0, top: 0, transform: `translate(${drag.x - 60}px, ${drag.y - 30}px)`, pointerEvents: "none", zIndex: 2000 }}
        >
          <Knife n={drag.n} dragging scale={0.6} />
        </div>
      )}
    </div>
  );
}
