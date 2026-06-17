/* tools/simp.jsx — №8 Simplify helper tool (INTERACTIVE).
 *
 * The child builds an editable fraction with the app-wide number model: tap a
 * digit (it AND the two slots activate), then tap the top or bottom slot to apply
 * it (then everything deactivates; a 0 can't go on the bottom). A square box fills
 * to match the name they set, and a fixed red guide edge marks the target amount
 * (the Kid filled 6/9 of the tray). When a name pours out the SAME amount as 6/9
 * its edge lands on the guide; the simplest such name — 2/3 — is the answer.
 *
 * PURE MANIPULATIVE — it never writes the answer; the child enters the choice
 * answer themselves. Props: see KitchenTool.jsx contract.
 */
import { useState, useMemo } from "react";
import { DigitGrid, FracSlots } from "../../assets";

/* The fixed amount the Kid filled — 6/9 of the tray (value 2/3). */
const TARGET_NUM = 6;
const TARGET_DEN = 9;
const TARGET_VALUE = TARGET_NUM / TARGET_DEN; // 2/3

/* grid layout for `n` cells: fewest columns >= sqrt(n) that divide n. */
function gridFor(n) {
  if (n <= 0) return { cols: 1, rows: 1 };
  let cols = n;
  for (let c = Math.ceil(Math.sqrt(n)); c <= n; c++) {
    if (n % c === 0) { cols = c; break; }
  }
  return { cols, rows: n / cols };
}

const NEARLY = 1e-9;

export default function SimpTool({ onProgress, disabled = false }) {
  // the editable fraction the child is building (starts at 6/9).
  const [num, setNum] = useState(6);
  const [den, setDen] = useState(9);
  // the digit the child has SELECTED (or null). Nothing is active on load.
  const [picked, setPicked] = useState(null);
  const togglePicked = (k) => setPicked((c) => (c === k ? null : k));
  const numArmed = picked != null;
  const denArmed = picked != null && picked >= 1; // a bottom number can't be 0

  // apply the selected digit to a slot, then deactivate.
  const place = (slot, k) => {
    const v = k == null ? picked : k;
    if (disabled || v == null) return;
    if (slot === "d" && v < 1) return;
    const nextNum = slot === "n" ? v : num;
    const nextDen = slot === "d" ? v : den;
    if (slot === "n") setNum(v); else setDen(v);
    setPicked(null);
    onProgress && onProgress({ kind: "manip_step", tool: "simp", num: nextNum, den: nextDen });
  };

  const reset = () => { if (!disabled) { setNum(6); setDen(9); setPicked(null); } };

  // derived facts about the current name vs the fixed 6/9 amount.
  const { fillsSame, isSimplest, value: curVal } = useMemo(() => {
    const v = den > 0 ? num / den : NaN;
    const same = den > 0 && Math.abs(v - TARGET_VALUE) < NEARLY;
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    const g = num > 0 && den > 0 ? gcd(num, den) : 0;
    return { fillsSame: same, isSimplest: same && g === 1, value: v };
  }, [num, den]);

  // ── the fill-to-match box ──────────────────────────────────────────────────
  const drawDen = Math.max(1, Math.min(den || 1, 24));
  const drawNum = Math.max(0, Math.min(num || 0, drawDen));
  const { cols, rows } = gridFor(drawDen);
  const cells = [];
  for (let i = 0; i < drawDen; i++) {
    cells.push(<div key={i} className={"eq-cell" + (i < drawNum ? " is-on" : "")} />);
  }

  const boxCls = "eq-box is-sm is-guide" + (isSimplest ? " is-target" : "");
  const boxStyle = {
    gridTemplateColumns: `repeat(${cols},1fr)`,
    gridTemplateRows: `repeat(${rows},1fr)`,
    ...(fillsSame && !isSimplest
      ? { boxShadow: "0 0 0 2px #3a7d44, 0 3px 0 var(--shade)" }
      : null),
  };

  return (
    <div className="kq-manip" data-tool="simp" style={{ gap: 22 }}>
      {/* number pad — tap a digit to select it (it + the slots activate) */}
      <DigitGrid mode="drag" selected={picked} onSelect={togglePicked} disabled={disabled} />

      {/* the editable fraction — tap the top or bottom to apply the selected digit */}
      <FracSlots
        n={num}
        d={den}
        active={null}
        big={46}
        onDropDigit={place}
        armedN={numArmed}
        armedD={denArmed}
      />

      {/* your box — fills to match; the red guide edge is the fixed 6/9 amount */}
      <div className="eq-col">
        <span className="eq-lab">your box</span>
        <div
          className={boxCls}
          style={boxStyle}
          role="img"
          aria-label={`${drawNum} of ${drawDen} filled`}
        >
          {cells}
          <div className="eq-guide-edge" style={{ left: `calc(${TARGET_VALUE * 100}% - 1px)` }} />
        </div>
        <span className="eq-cap">
          {isSimplest
            ? "Same amount — and the simplest name!"
            : fillsSame
              ? "Same amount as 6/9 — can it go simpler?"
              : den > 0 && curVal > TARGET_VALUE
                ? "Too full — try a smaller amount."
                : "Fill it to the red line (the 6/9 amount)."}
        </span>
        {!disabled && (
          <button
            type="button"
            className="kq-splitbtn"
            onClick={reset}
            aria-label="reset to 6/9"
            style={{ marginTop: 2 }}
          >
            reset to 6/9
          </button>
        )}
      </div>
    </div>
  );
}
