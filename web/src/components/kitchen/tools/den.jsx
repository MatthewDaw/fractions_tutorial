/* tools/den.jsx — №3 The Bottom Number (INTERACTIVE).
 *
 * Concept: the bigger the BOTTOM number, the more pieces, so each single piece is
 * smaller. The child SELECTS a bottom number from the picker (it highlights), then
 * taps the BOTTOM of the fraction to apply it — and ONE square splits into that
 * many equal pieces (the numerator stays 1 — one shaded piece). Exploring 1/5 vs
 * 1/8 (the question's compare) shows that 8 pieces are each smaller than 5.
 *
 * This tool is a PURE MANIPULATIVE — it never writes the answer (the child reads
 * the squares and enters the compare answer themselves). Number entry uses the
 * app-wide model: click a number to select it, then click the fraction slot to
 * apply it (no instant click-to-change).
 *
 * Uses wireframe classes (kq-fraclab, eq-box/eq-cell, den-num, eq-numgrid, bignum)
 * so styles/kitchen.css applies. Props: see KitchenTool.jsx contract.
 */
import { useState, useMemo } from "react";
import { KitchenHtml, cellBox } from "../../../kitchen/primitives.jsx";
import { DigitSlot } from "../../assets/DigitSlot.jsx";

/* the two bottoms the question (1/5 vs 1/8) is about — highlighted in the picker
 * as a gentle hint of which bottoms to try. */
const Q_LEFT = 5;
const Q_RIGHT = 8;

/* parse the "N" out of a "1/N"-shaped compare operand string. */
function denOf(label) {
  const parts = String(label ?? "").split("/");
  const n = parseInt(parts[1] ?? parts[0], 10);
  return Number.isFinite(n) ? n : null;
}

export default function DenTool({ room, onProgress, disabled = false }) {
  // the two unit fractions the question compares (default to 1/5 vs 1/8)
  const left = denOf(room?.answer?.left) ?? Q_LEFT;
  const right = denOf(room?.answer?.right) ?? Q_RIGHT;

  // the currently-applied bottom number (start on the LEFT operand so there's a
  // square to look at immediately). numerator is always 1.
  const [den, setDen] = useState(left);
  // the digit the child has SELECTED in the picker (or null) — applied when they
  // tap the bottom of the fraction.
  const [picked, setPicked] = useState(null);
  const togglePicked = (k) => setPicked((c) => (c === k ? null : k));
  const denArmed = picked != null && picked >= 1; // a bottom number must be ≥ 1

  // apply the picked digit (drop arg) / the selected digit (tap, no arg) to the
  // bottom of the fraction → re-cut the square.
  const applyDen = (k) => {
    const v = k == null ? picked : k;
    if (disabled || v == null || v < 1) return;
    setDen(v);
    setPicked(null);
    onProgress && onProgress({ kind: "manip_step", tool: "den", den: v });
  };

  // the live square (one shaded piece out of `den`)
  const squareHtml = useMemo(() => cellBox(den, 1), [den]);

  // the two columns of the digit picker (0–4 · 5–9).
  const cols = [
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
  ];

  return (
    <div className={"kq-tool" + (disabled ? " is-disabled" : "")}>
      <div className="kq-tool-hint">
        Tap a bottom number, then tap the bottom of the fraction — the square splits
        into that many equal pieces. More pieces, smaller each one.
      </div>

      <div className="kq-fraclab">
        {/* the number picker — select a bottom number (clicking arms it) */}
        <div className="eq-numgrid" role="group" aria-label="pick the bottom number">
          {cols.map((col, ci) => (
            <div className="den-numcol" key={ci}>
              {col.map((k) => {
                const isOn = k === picked;
                const isQ = k === left || k === right;
                return (
                  <button
                    type="button"
                    key={k}
                    className={"den-num" + (isOn ? " is-on" : "") + (isQ ? " is-hint" : "")}
                    aria-pressed={isOn}
                    aria-label={"select " + k}
                    disabled={disabled || k < 1}
                    onClick={() => togglePicked(k)}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* the live 1/N fraction glyph — the bottom is a slot: select a number,
            then tap here to apply it. */}
        <div className="bignum" style={{ fontSize: 48 }}>
          <span className="n" style={{ color: "var(--red)" }}>1</span>
          <span className="bar" style={{ background: "var(--ink)" }} />
          <DigitSlot armed={denArmed} onPlace={applyDen} aria-label="bottom number — tap to apply the selected number">
            <span className="d">{den}</span>
          </DigitSlot>
        </div>

        {/* the ONE square, freshly cut into `den` equal pieces (one shaded) */}
        <KitchenHtml className="kq-densquare" html={squareHtml} />
      </div>
    </div>
  );
}
