/* components/kitchen/KitchenAnswer.jsx — the ONE interactive answer surface for a
 * Babushka's Kitchen question.
 *
 * Renders the correct entry UI for answer.type ∈
 *   { integer, fraction, mixed, compare, choice }
 * matching the wireframe markup/classes (slate-int, slate-fraction,
 * cmp-symbin/cmp-sym/cmp-compare/cmp-drop, kq-chip/kq-choices, kq-frac…). It
 * consolidates the integer/compare/choice work the prior pass added inside
 * MomsRoom.jsx (cmpSym / choiceIdx / intStr) into one reusable component.
 *
 * ── API (the answer-surface contract) ─────────────────────────────────────────
 *   <KitchenAnswer
 *     answer={room.answer}        // { type, left, right, options, … } from rooms.js
 *     value={value}              // controlled value (see SHAPE below); optional
 *     onChange={(next) => …}     // called with the full next value object
 *     onReady={(ready) => …}     // called when completeness changes (boolean)
 *     disabled={false}           // lock the surface (e.g. after solved)
 *   />
 *
 * VALUE SHAPE (a single object; only the keys for the active type are used):
 *   integer  → { int: string }                       e.g. { int: "12" }
 *   fraction → { num: string, den: string }
 *   mixed    → { whole: string, num: string, den: string }
 *   compare  → { sym: "<" | "=" | ">" | "" }
 *   choice   → { choiceIdx: number }                 (-1 = nothing picked)
 *
 * "ready/complete" signal — `isAnswerComplete(answer, value)` is exported for
 * callers that grade on a button; the component also fires onReady on every
 * change. Completeness rules match MomsRoom's `answerReady`:
 *   integer  → int !== ""
 *   fraction → num !== "" && den !== ""
 *   mixed    → whole !== "" && num !== "" && den !== ""
 *   compare  → sym !== ""
 *   choice   → choiceIdx >= 0
 *
 * UNCONTROLLED FALLBACK: if `value` is omitted the component keeps its own state,
 * so it works standalone for stubs/tests. If `value` is provided it is fully
 * controlled by the parent.
 */

import { useState, useEffect, useCallback } from "react";
import CompareInput from "../lesson/CompareInput.jsx";

/* ── completeness rule (exported so graders can reuse it) ──────────────────── */
export function isAnswerComplete(answer = {}, v = {}) {
  switch (answer.type) {
    case "integer": return (v.int ?? "") !== "";
    case "mixed":   return (v.whole ?? "") !== "" && (v.num ?? "") !== "" && (v.den ?? "") !== "";
    case "compare": return (v.sym ?? "") !== "";
    case "choice":  return typeof v.choiceIdx === "number" && v.choiceIdx >= 0;
    case "fraction":
    default:        return (v.num ?? "") !== "" && (v.den ?? "") !== "";
  }
}

const EMPTY = { int: "", num: "", den: "", whole: "", sym: "", choiceIdx: -1 };

/* a small stacked fraction glyph for compare/choice (operands are shown, not
 * handwritten). Accepts a "n/d" string via `label` or [n,d] via `pair`. */
function FracGlyph({ label, pair }) {
  let n, d;
  if (Array.isArray(pair)) { [n, d] = pair; }
  else { [n, d] = String(label ?? "").split("/"); }
  if (d === undefined || d === "" || d == null) {
    return <span className="kq-frac"><span className="kq-frac-n">{n}</span></span>;
  }
  return (
    <span className="kq-frac">
      <span className="kq-frac-n">{n}</span>
      <span className="kq-frac-d">{d}</span>
    </span>
  );
}

/* one digit cell — a controlled text input styled as a slate cell. The wireframe
 * uses a handwriting canvas; a numeric input is the simplest interactive surface
 * and a later pass can swap in the canvas slate without changing this API. */
function DigitCell({ ariaLabel, ph, value, onChange, disabled }) {
  return (
    <div className="slate-slot"><div className="slate-cell">
      <input
        className="slate-input"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        maxLength={2}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
      />
      {value === "" && ph ? <span className="slate-ph" aria-hidden="true">{ph}</span> : null}
    </div></div>
  );
}

function FractionCells({ v, set, disabled }) {
  return (
    <div className="slate slate-fraction" role="group" aria-label="your fraction answer">
      <DigitCell ariaLabel="write the top digit" ph="✎" value={v.num} disabled={disabled}
                 onChange={(x) => set({ num: x })} />
      <span className="slate-bar" style={{ background: "var(--ink)" }} aria-hidden="true"></span>
      <DigitCell ariaLabel="write the bottom digit" value={v.den} disabled={disabled}
                 onChange={(x) => set({ den: x })} />
    </div>
  );
}

export default function KitchenAnswer({ answer = { type: "fraction" }, value, onChange, onReady, disabled = false }) {
  const controlled = value != null;
  const [inner, setInner] = useState(EMPTY);
  const v = controlled ? { ...EMPTY, ...value } : inner;

  const set = useCallback((patch) => {
    const next = { ...v, ...patch };
    if (!controlled) setInner(next);
    onChange && onChange(next);
  }, [v, controlled, onChange]);

  // fire onReady whenever completeness changes
  const ready = isAnswerComplete(answer, v);
  useEffect(() => { onReady && onReady(ready); }, [ready, onReady]);

  const type = answer.type || "fraction";

  if (type === "compare") {
    const L = answer.left || "?/?", R = answer.right || "?/?";
    // The ONE shared compare input — drag a < = > symbol into the ? slot (or tap),
    // re-selectable, drag-not-click. Same component used by the lessons.
    return (
      <div className="kq-write">
        <CompareInput
          left={<FracGlyph label={L} />}
          right={<FracGlyph label={R} />}
          value={v.sym}
          onChange={(sym) => set({ sym })}
          disabled={disabled}
        />
      </div>
    );
  }

  if (type === "choice") {
    const opts = answer.options || [];
    return (
      <div className="kq-write">
        <div className="kq-choices" role="group" aria-label="choose the answer">
          {opts.map((o, i) => (
            <button key={i} type="button"
                    className={"kq-chip" + (v.choiceIdx === i ? " is-picked" : "")}
                    aria-pressed={v.choiceIdx === i} disabled={disabled}
                    onClick={() => !disabled && set({ choiceIdx: i })}>
              <FracGlyph label={o} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (type === "integer") {
    return (
      <div className="kq-write">
        <div className="kq-slate">
          <div className="slate slate-int" role="group" aria-label="your answer">
            <DigitCell ariaLabel="write your answer" ph="✎" value={v.int} disabled={disabled}
                       onChange={(x) => set({ int: x })} />
          </div>
        </div>
      </div>
    );
  }

  if (type === "mixed") {
    return (
      <div className="kq-write">
        <div className="kq-slate is-mixed">
          <div className="slate slate-int slate-row" role="group" aria-label="write the whole number">
            <DigitCell ariaLabel="write the whole number" ph="✎" value={v.whole} disabled={disabled}
                       onChange={(x) => set({ whole: x })} />
          </div>
          <span className="mr-and">and</span>
          <FractionCells v={v} set={set} disabled={disabled} />
        </div>
      </div>
    );
  }

  // default: a plain fraction
  return (
    <div className="kq-write">
      <div className="kq-slate">
        <FractionCells v={v} set={set} disabled={disabled} />
      </div>
    </div>
  );
}
