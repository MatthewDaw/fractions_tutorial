// PlateGroup.jsx — the m1 (Equal Groups) manipulative: a row of N plates, each
// holding 0..M identical pelmeni, plus a serving bowl the child taps to drop one
// pelmeni at a time onto a plate.
//
// THE EQUAL-GROUP INVARIANT IS ENFORCED (the emotional centre of m1):
//   • Every plate may hold AT MOST `cap` (= the target group size M) pieces. A tap
//     that would push a plate past `cap` is REFUSED (the extra "spills back" — the
//     onAdd handler simply returns; nothing is placed). Commutativity is DEFERRED,
//     so plates are NEVER rotated — count × size role order is fixed.
//   • A plate's outline reflects its state against the others:
//       normal      — fewer than `cap`, still being filled  (neutral kitchen tone)
//       equal-ok    — exactly `cap`, matching the target     (ROLE_COLORS.correct)
//       incorrect   — flagged unequal (set via `flagUnequal`) (ROLE_COLORS.incorrect)
//
// Pieces use a FIXED neutral kitchen food tone (R-M3) — never denomTone/denomColor.
//
// PROPS:
//   plates     : number[]   — current count of pelmeni on each plate (length = N groups)
//   cap        : number     — the equal-group target size M (a plate maxes out here)
//   onAdd(i)   : (index) => void — request to drop one pelmeni on plate i (room guards cap)
//   onClear(i) : (index) => void — request to empty plate i (optional; tap a full plate)
//   flagUnequal: boolean    — paint not-yet-full plates red (used on a failed check)
//   ghost      : boolean    — dim the whole row to a faint check (Fade stage)
//   variant    : "plate" | "bowl" — "bowl" is the Workbench prop-variant (BowlGroup)
//   readOnly   : boolean    — disable tapping (solved / Fade)
import React from "react";
import { ROLE_COLORS } from "../denominatorColors.js";

// A fixed neutral kitchen food tone for every piece (R-M3: no denominator hue).
const FOOD = "#c9a36b";       // golden pelmeni dough
const FOOD_EDGE = "#9a7740";  // a darker crimp edge

// Lay pelmeni in a tidy 2-column grid inside the plate so 0..M reads at a glance.
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

export default function PlateGroup({
  plates = [],
  cap = 0,
  onAdd = () => {},
  onClear = () => {},
  flagUnequal = false,
  ghost = false,
  variant = "plate",
  readOnly = false,
}) {
  const isBowl = variant === "bowl";
  return (
    <div className={"mg-plates" + (ghost ? " mg-ghost" : "")} role="group" aria-label={`${plates.length} ${isBowl ? "bowls" : "plates"}`}>
      {plates.map((count, i) => {
        const st = plateState(count, cap, flagUnequal);
        const outline = STATE_OUTLINE[st];
        return (
          <div key={i} className={"mg-group mg-" + variant + " is-" + st}>
            <button
              type="button"
              className={"mg-vessel is-" + st}
              style={{ borderColor: outline, boxShadow: `0 0 0 2px ${outline}22` }}
              disabled={readOnly}
              onClick={() => { if (!readOnly) onAdd(i); }}
              onContextMenu={(e) => { e.preventDefault(); if (!readOnly) onClear(i); }}
              title={readOnly ? `${count} on ${isBowl ? "bowl" : "plate"} ${i + 1}` : `tap to add — ${count}/${cap}`}
              aria-label={`${isBowl ? "bowl" : "plate"} ${i + 1}: ${count} of ${cap}${readOnly ? "" : " — tap to add one"}`}
            >
              <span className="mg-vessel-pieces">
                {pieceLayout(count).map((_, k) => (
                  <span key={k} className="mg-piece-slot"><Pelmeni size={isBowl ? 22 : 24} /></span>
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
}

// BowlGroup — the Workbench prop-variant (scoops into bowls). Same equal-group
// guard, rendered as bowls instead of plates.
export function BowlGroup(props) {
  return <PlateGroup {...props} variant="bowl" />;
}
