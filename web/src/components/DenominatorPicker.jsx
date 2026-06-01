// DenominatorPicker.jsx — the L2 ("blocks fade") affordance.
//
// In L0/L1 the child DRAGS a knife to slice each strip. In L2 the physical
// drag is replaced by a SYMBOLIC choice: the child picks a common denominator
// from a small grid, sees the per-strip multipliers light up (×N on top AND
// bottom binds "cut into more = multiply top and bottom the same"), then taps
// "Slice & Check" — which drives the SAME applyCommon/match path as the knife.
//
// Math is owned by App.jsx / r2problems.js; this component only presents the
// candidate common denominators for the CURRENT problem and the multipliers
// each implies, then hands the chosen denominator back via onApply(denom).
//
// Props:
//   matched  — true once the strips already share a block size (picker locks)
//   D        — current common denominator (the matched denominator) for readout
//   choices  — candidate common denominators, derived from the problem (LCD…)
//   aDen,bDen — the two piece denominators, so multipliers = denom/aDen, denom/bDen
//   aNum,aDen / bNum,bDen used only for the "1/2 strip" labels
//   onApply(denom) — apply the chosen common size to both strips
import { useState, useEffect } from "react";

export default function DenominatorPicker({ matched, D, choices, aNum, aDen, bNum, bDen, onApply }) {
  const [pick, setPick] = useState(null); // chosen common denominator (number)

  // Mirror the strips' state: once matched, lock the readout to D; when a fresh
  // problem resets matched to false, clear the choice so the child must pick the
  // common denominator again (the whole point of the L2 beat). `choices` is part
  // of the dependency so switching problems also clears a stale pick.
  useEffect(() => { setPick(matched ? D : null); }, [matched, D, choices]);

  // For a chosen common denominator d, each strip multiplies by d / its own den.
  const multA = pick ? pick / aDen : null;
  const multB = pick ? pick / bDen : null;
  const ready = pick != null && !matched;

  function choose(d) { if (matched) return; setPick(d); }
  function sliceAndCheck() { if (!ready) return; onApply(pick); }

  return (
    <div className={"denpicker" + (matched ? " is-locked" : "")}>
      <div className="denpicker-hint">
        Choose a common denominator — pick a size both strips can become.
      </div>

      <div className="picker-grid" role="group" aria-label="common denominator">
        {choices.map((d) => {
          const sel = pick === d;
          return (
            <button
              key={d}
              type="button"
              className={"picker-choice" + (sel ? " sel" : "")}
              aria-pressed={sel}
              disabled={matched}
              onClick={() => choose(d)}
            >
              {/* No "LCD" tag — labelling the right answer would defeat the
                  point of choosing the common size. */}
              <span className="pc-num">{d}</span>
            </button>
          );
        })}
      </div>

      {/* per-strip multiplier readouts — pure display, ×N in red on top+bottom */}
      <div className="picker-readouts">
        <div className={"pread" + (pick ? " on" : "")}>
          The <b>{aNum}/{aDen}</b> strip: multiply by <span className="pxn">×{multA ?? "?"}</span>
        </div>
        <div className={"pread" + (pick ? " on" : "")}>
          The <b>{bNum}/{bDen}</b> strip: multiply by <span className="pxn">×{multB ?? "?"}</span>
        </div>
      </div>

      <button
        type="button"
        className="slicecheck"
        disabled={!ready}
        onClick={sliceAndCheck}
      >
        ✂ Slice &amp; Check
      </button>
    </div>
  );
}
