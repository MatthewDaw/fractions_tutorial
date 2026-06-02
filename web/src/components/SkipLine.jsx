// SkipLine.jsx — the m3 (Times Facts) number-line "ladle" for the Fade stage.
// A row of equal hops along a number line shows the skip-count sequence
// (8, 16, 24, … 56); a few INTERIOR terms are blanked and the child fills them
// from the rhythm of the count. This fades the concrete jar to the symbolic
// sequence one step before the bare fact.
//
// INTERACTION: the child DRAGS a number chip from the tray and DROPS it onto a
// blank slot on the line (tablet-friendly pointer events). A correct drop snaps
// into the slot and locks (the chip leaves the tray); a wrong number — or a drop
// that misses every slot — bounces back and the parent fires the "not quite"
// nudge. Keyboard/click fallback: tapping a chip fills the first open blank.
//
// CONTROLLED COMPONENT: the room owns the sequence + which indices are blanked
// + the values typed so far; SkipLine just renders, hit-tests the drop, and
// reports fills up via onFill(index, value). The room decides whether a value
// persists (correct) or is rejected (wrong → bounce), so this stays presentation.
//
//   props:
//     sequence : number[]  — the full skip-count (e.g. [8,16,24,32,40,48,56])
//     blanks   : number[]  — indices into `sequence` the child must fill
//     values   : { [index]: string }  — committed fills (controlled)
//     onFill(index, value) — drop (or tap) a number chip onto a blank
//     ghost    : boolean   — dim (rarely used; the jar above is the ghost)
//
// Whole-number objects: a fixed neutral tone; correct/incorrect use ROLE_COLORS
// (handled by the parent via the `state` map it passes through className hints).
import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function SkipLine({
  sequence = [],
  blanks = [],
  values = {},
  onFill = () => {},
  ghost = false,
}) {
  const blankSet = new Set(blanks);
  // Candidate chips the child can drag to fill a blank: the blanked values plus a
  // couple of near-miss distractors (so it isn't trivially "drag the only chip").
  const blankVals = blanks.map((i) => sequence[i]);
  const step = sequence.length > 1 ? sequence[1] - sequence[0] : 1;
  const distractors = [];
  for (const v of blankVals) {
    const d = v + step - 1; // an off-by-one drift distractor
    if (!blankVals.includes(d) && !distractors.includes(d) && d > 0) distractors.push(d);
  }
  const allChips = Array.from(new Set([...blankVals, ...distractors])).sort((a, b) => a - b);

  // A chip is "consumed" once its value has been correctly placed in a blank.
  const placedCorrectVals = new Set(
    blanks
      .filter((i) => values[i] != null && values[i] !== "" && parseInt(values[i], 10) === sequence[i])
      .map((i) => sequence[i])
  );
  const chips = allChips.filter((c) => !placedCorrectVals.has(c));

  // Which blank (the first not-yet-correctly-filled) is the active drop hint.
  const activeBlank = blanks.find((i) => !(values[i] != null && values[i] !== "" && parseInt(values[i], 10) === sequence[i]));

  // refs to each blank slot element, keyed by sequence index, for drop hit-testing
  const slotRefs = useRef({});
  // live drag state: the chip value being dragged + pointer position + hovered slot
  const [drag, setDrag] = useState(null); // { val, x, y, overIndex }

  function slotIndexAt(clientX, clientY) {
    for (const i of blanks) {
      const el = slotRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const pad = 18;
      if (clientX >= r.left - pad && clientX <= r.right + pad && clientY >= r.top - pad && clientY <= r.bottom + pad) {
        return i;
      }
    }
    return null;
  }

  function grabChip(val, e) {
    if (ghost) return;
    if (e && e.preventDefault) e.preventDefault();
    // No pointer info (keyboard/Enter) → fill the active blank directly.
    if (!e || e.clientX == null) {
      if (activeBlank != null) onFill(activeBlank, String(val));
      return;
    }
    setDrag({ val, x: e.clientX, y: e.clientY, overIndex: slotIndexAt(e.clientX, e.clientY) });
    const move = (ev) => setDrag({ val, x: ev.clientX, y: ev.clientY, overIndex: slotIndexAt(ev.clientX, ev.clientY) });
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const idx = slotIndexAt(ev.clientX, ev.clientY);
      setDrag(null);
      // Drop onto a blank slot → report the fill (parent grades + decides persist).
      // Miss → nothing reported; the chip simply bounces back (stays in the tray).
      if (idx != null) onFill(idx, String(val));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div className={"m3-skipline" + (ghost ? " is-ghost" : "")}>
      <div className="m3-skipline-track" aria-label="skip-count number line">
        <div className="m3-skipline-rail" aria-hidden="true" />
        {sequence.map((val, i) => {
          const isBlank = blankSet.has(i);
          const filled = values[i] != null && values[i] !== "";
          const correct = filled && parseInt(values[i], 10) === val;
          const isHotSlot = isBlank && drag && drag.overIndex === i && !correct;
          return (
            <div key={i} className="m3-skipline-stop">
              <span className="m3-skipline-tick" aria-hidden="true" />
              <span
                ref={isBlank ? (el) => { slotRefs.current[i] = el; } : undefined}
                className={
                  "m3-skipline-term" +
                  (isBlank ? " is-blank is-slot" : " is-given") +
                  (isBlank && correct ? " is-correct" : "") +
                  (isHotSlot ? " is-hot" : "") +
                  (isBlank && !correct && i === activeBlank ? " is-active" : "")
                }
                aria-label={isBlank ? (correct ? `filled with ${val}` : "drop the missing number here") : String(val)}
              >
                {isBlank ? (correct ? val : "?") : val}
              </span>
            </div>
          );
        })}
      </div>

      {activeBlank != null && chips.length > 0 && (
        <div className="m3-skipline-chips" role="group" aria-label="drag the missing number onto the line">
          <span className="m3-skipline-chips-lead">drag the missing number onto the line</span>
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              className={"m3-skipline-chip" + (drag && drag.val === c ? " is-dragging" : "")}
              onPointerDown={(e) => grabChip(c, e)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); grabChip(c, null); } }}
              disabled={ghost}
              aria-label={`number ${c} — drag onto the line`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* the drag ghost chip that follows the pointer. Portaled to <body> so its
          position:fixed resolves against the VIEWPORT — the app's #stage carries a
          transform: scale() (Shell.useStageFit), which would otherwise become the
          containing block for this fixed ghost and drift it up-left of the cursor. */}
      {drag && createPortal(
        <div className="m3-skipline-ghost" style={{ left: drag.x - 26, top: drag.y - 20 }} aria-hidden="true">
          {drag.val}
        </div>,
        document.body
      )}
    </div>
  );
}
