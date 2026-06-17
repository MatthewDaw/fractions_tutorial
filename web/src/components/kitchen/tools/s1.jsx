/* tools/s1.jsx — №6 Taking Away — INTERACTIVE helper tool.
 *
 * Concept: 6/7 − 2/7 = 4/7. Babushka set out six sevenths of a honey cake; the
 * Cat batted two sevenths onto the floor. The child works it out by hand:
 *
 *   • Six cake slices (sevenths) sit ON THE LINE.
 *   • A TRAY sits below — "used by Babushka / batted off by the Cat".
 *   • The child DRAGS the slices that were taken off the line INTO the tray
 *     (drag-and-drop, with click-to-move as a touch/keyboard-friendly fallback).
 *   • The bottom stays /7 (locked) — only the count of slices LEFT changes.
 *   • Fraction left = (slices still on the line) / 7.
 *
 * Every move calls onChange({ num: leftOnLine, den: 7 }) so driving the tool
 * fills the written fraction answer (KitchenAnswer value shape { num, den }).
 *
 * Self-contained: local state only, wireframe classes (kq-takebox, s1-canvas,
 * s1-takeline, s1-tray, s1-piece, eqstate locked) so styles/kitchen.css applies.
 * Props: { room, value, onChange, onProgress, disabled } — see KitchenTool.jsx.
 */
import { useState, useCallback, useRef } from "react";
import { cakeVisual, LOCKSVG } from "../../../kitchen/primitives.jsx";

const DEN = 7;        // bottom stays /7 (locked)
const TOTAL = 6;      // six sevenths start on the table (6/7)

/* one cake slice — the SAME shared cake visual + its 1/7 label. `where` is
 * "line" (draggable, frosted look) or "tray" (used, dragged off). */
function Slice({ id, where, disabled, dragging, onPick, onDragStart, onDragEnd }) {
  const used = where === "tray";
  const cls =
    "s1-piece kq-cakepiece " +
    (used ? "is-used" : "s1-piece-drag") +
    (dragging ? " is-dragging" : "");
  return (
    <div
      className={cls}
      style={{ width: 74 }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={
        used
          ? "a slice the Cat batted off — tap to put it back on the line"
          : "a slice on the line — drag into the tray, or tap to take it away"
      }
      draggable={!disabled}
      onDragStart={(e) => {
        if (disabled) return;
        e.dataTransfer.effectAllowed = "move";
        try { e.dataTransfer.setData("text/plain", String(id)); } catch (_) {}
        onDragStart(id);
      }}
      onDragEnd={onDragEnd}
      onClick={() => !disabled && onPick(id)}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(id); }
      }}
    >
      <SliceVisual />
    </div>
  );
}

/* render the shared cake-slice SVG string + the 1/7 label into the tree */
function SliceVisual() {
  return (
    <>
      <span
        style={{ display: "contents" }}
        dangerouslySetInnerHTML={{ __html: cakeVisual() }}
      />
      <span className="s1-piece-lab">1/{DEN}</span>
    </>
  );
}

export default function S1Tool({ onProgress, disabled = false }) {
  // each of the 6 starting slices is "line" or "tray"; ids 0..5 are stable and
  // map to a FIXED home position on the 7-slot line, so taking one away leaves a
  // hole where it was (the others never slide). This is a pure manipulative — it
  // never writes the answer; the child reads what's left and types it themselves.
  const [places, setPlaces] = useState(() => Array.from({ length: TOTAL }, () => "line"));
  const [dragId, setDragId] = useState(null);
  const lastEmit = useRef(null);

  const leftOnLine = places.filter((p) => p === "line").length;
  const taken = TOTAL - leftOnLine;

  // fine-grained progress only (telemetry) — NOT the answer surface.
  const emit = useCallback(
    (next) => {
      const left = next.filter((p) => p === "line").length;
      const sig = left + "/" + DEN;
      if (lastEmit.current !== sig) {
        lastEmit.current = sig;
        onProgress &&
          onProgress({ kind: "manip_step", tool: "s1", left, taken: TOTAL - left, den: DEN });
      }
    },
    [onProgress]
  );

  const move = useCallback(
    (id, dest) => {
      setPlaces((prev) => {
        if (id == null || prev[id] === dest) return prev;
        const next = prev.slice();
        next[id] = dest;
        emit(next);
        return next;
      });
    },
    [emit]
  );

  // tap a slice: toggle it between line and tray
  const pick = useCallback(
    (id) => move(id, places[id] === "line" ? "tray" : "line"),
    [move, places]
  );

  const onDragStart = useCallback((id) => setDragId(id), []);
  const onDragEnd = useCallback(() => setDragId(null), []);

  const dropTo = useCallback(
    (dest) => (e) => {
      e.preventDefault();
      let id = dragId;
      if (id == null) {
        const raw = e.dataTransfer && e.dataTransfer.getData("text/plain");
        if (raw !== "" && raw != null) id = Number(raw);
      }
      if (id != null && !Number.isNaN(id)) move(id, dest);
      setDragId(null);
    },
    [dragId, move]
  );

  const allowDrop = (e) => {
    if (disabled) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  };

  const traySlices = places.map((p, id) => (p === "tray" ? id : null)).filter((id) => id != null);

  return (
    <div className="kq-tool">
      <div className="kq-tool-hint">
        Drag the slices the Cat batted off into the tray — count the cake that's left.
      </div>

      <div className="kq-takebox">
        <div className="canvas s1-canvas s1-canvas-takeaway">
          <div className="eqstate eqfloat locked">
            <span
              className="g"
              dangerouslySetInnerHTML={{ __html: LOCKSVG }}
            />
            bottom stays /{DEN}
          </div>

          <div className="s1-line-label">on the line — what's left</div>

          {/* THE LINE — DEN (7) fixed slots. Slices 0..TOTAL-1 each have a home
              slot; the last slot is the empty seventh. Taking a slice away leaves
              its slot as a hole in place — the other slices never slide. Dropping
              a slice back returns it to its own slot. */}
          <div
            className="s1-takeline"
            onDragOver={allowDrop}
            onDrop={dropTo("line")}
            aria-label="the cake on the line"
          >
            {Array.from({ length: DEN }).map((_, pos) => {
              const onLine = pos < TOTAL && places[pos] === "line";
              return onLine ? (
                <Slice
                  key={pos}
                  id={pos}
                  where="line"
                  disabled={disabled}
                  dragging={dragId === pos}
                  onPick={pick}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                />
              ) : (
                <div key={"slot" + pos} className="s1-piece is-slot kq-cakeslot" style={{ width: 74 }} />
              );
            })}
          </div>

          {/* THE TRAY — drop here to take a slice away */}
          <div
            className={"s1-tray" + (taken > 0 ? " has-pieces" : "")}
            onDragOver={allowDrop}
            onDrop={dropTo("tray")}
          >
            <span className="s1-tray-label">batted off by the Cat — drag slices here</span>
            <div className="s1-tray-row">
              {traySlices.map((id) => (
                <Slice
                  key={id}
                  id={id}
                  where="tray"
                  disabled={disabled}
                  dragging={dragId === id}
                  onPick={pick}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                />
              ))}
            </div>
          </div>

          <div className="s1-count-cap">
            {leftOnLine} left on the line · {taken} taken away
          </div>
        </div>
      </div>
    </div>
  );
}
