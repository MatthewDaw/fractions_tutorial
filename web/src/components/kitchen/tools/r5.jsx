/* tools/r5.jsx — №12 Mixed Numbers helper tool (INTERACTIVE).
 *
 * A 0→3 stick marked in quarters. The child DRAGS ¼ blocks from the bin onto the
 * stick (or taps a block / the stick to add one), then counts the WHOLE sticks
 * that fill and the leftover quarters → a mixed number.
 *
 * For `blocks` placed quarters:
 *   whole   = floor(blocks / 4)   (how many whole sticks filled up)
 *   num     = blocks % 4          (the leftover quarters)
 *   den     = 4
 * On every count change we call onChange({ whole, num, den }) — the SAME mixed
 * value shape KitchenAnswer uses — so driving the tool fills the answer surface.
 *
 * Re-authored from wireframe answer.js TOOLS.r5 + the quarterLine/quarterBlock
 * builders as real JSX so the SVG can be interactive, while keeping the exact
 * wireframe classes (kq-qline, kq-qbin, kq-qbin-lab, kq-qline-svg, kq-qblock,
 * red quarters) so styles/kitchen.css applies. Props: see KitchenTool.jsx.
 */
import { useState, useCallback } from "react";
import { frac } from "../../../kitchen/primitives.jsx";

const DEN = 4;              // quarters — each whole stick is cut into four pieces
const SPAN = 3;            // the stick runs 0 → 3 wholes
const COLOR = "var(--red)"; // Mixed-Numbers red quarters (matches wireframe)
const TOTAL = DEN * SPAN;   // 12 quarter-cells in all

/* ruler geometry — mirrors primitives.quarterLine (span = 3 wholes, den = 4) */
const X0 = 26, X1 = 454, Y = 78;
const SEG = (X1 - X0) / TOTAL; // pixel width of one ¼ block

/* An interactive 0→3 quarters stick. It is a DROP TARGET: the child drags one ¼
 * block from the bin and drops it on the stick to place a single block (one drop
 * = one block — no "click the stick to fill to that line"). Tapping a placed
 * block takes one back off. */
function Stick({ filled, disabled, onRemoveBlock }) {
  // ticks: 0..TOTAL — whole marks (multiples of 4) bolder; the ends bolder still
  const ticks = [];
  for (let i = 0; i <= TOTAL; i++) {
    const x = +(X0 + i * SEG).toFixed(1);
    const whole = i % DEN === 0;
    const end = i === 0 || i === TOTAL;
    ticks.push(
      <line key={`t${i}`} x1={x} y1={Y} x2={x} y2={Y - (end ? 18 : whole ? 13 : 8)}
        stroke="var(--ink)" strokeWidth={end || whole ? 2.4 : 1.4}
        strokeLinecap="round" opacity={whole ? 1 : 0.6} />
    );
  }

  // whole-number labels (0,1,2,3) under each whole mark
  const labs = [];
  for (let k = 0; k <= SPAN; k++) {
    const x = +(X0 + k * DEN * SEG).toFixed(1);
    labs.push(
      <text key={`l${k}`} x={x} y={Y + 24} textAnchor="middle" fontSize={16}
        fill="var(--ink)">{k}</text>
    );
  }

  // placed blocks (the first `filled` quarter cells). Tapping a placed block
  // takes one back off (one at a time) — there is NO click-to-fill on the empty
  // stick; blocks are added only by DRAGGING one from the bin and dropping it.
  const blocks = [];
  for (let i = 0; i < filled; i++) {
    const x = +(X0 + i * SEG).toFixed(1);
    const w = +SEG.toFixed(1);
    const isLast = i === filled - 1;
    blocks.push(
      <g key={`b${i}`} style={{ cursor: disabled ? "default" : "pointer" }}
        onClick={disabled || !isLast ? undefined : onRemoveBlock}>
        <rect x={x} y={Y - 40} width={w} height={36} fill={COLOR}
          stroke="var(--ink)" strokeWidth={1.8} />
        <rect x={x} y={Y - 40} width={w} height={36} fill="url(#kq-blockhatch)" />
        {!disabled && isLast && <title>take a ¼ block off</title>}
      </g>
    );
  }

  return (
    <svg className="kq-qline-svg" viewBox="0 0 480 108" role="img"
      aria-label={`stick from 0 to 3 with ${filled} of ${TOTAL} quarter blocks placed`}>
      <defs>
        <pattern id="kq-blockhatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink)" strokeWidth={0.8} opacity={0.32} />
        </pattern>
      </defs>
      <line x1={X0 - 6} y1={Y} x2={X1 + 6} y2={Y} stroke="var(--ink)" strokeWidth={3} strokeLinecap="round" />
      {blocks}{ticks}{labs}
    </svg>
  );
}

/* a single draggable ¼ block in the bin (same geometry/classes as
 * primitives.quarterBlock, but as JSX so it can carry drag/click handlers). */
function BinBlock({ disabled, onAdd, onDragStart }) {
  return (
    <div className="kq-qblock-drag" role="button" tabIndex={disabled ? -1 : 0}
      aria-label="drag a ¼ block onto the stick"
      draggable={!disabled}
      style={{ cursor: disabled ? "default" : "grab", display: "inline-flex" }}
      onClick={disabled ? undefined : onAdd}
      onDragStart={disabled ? undefined : onDragStart}
      onKeyDown={disabled ? undefined : (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onAdd(); }
      }}>
      <svg viewBox="0 0 48 30" className="kq-qblock" aria-hidden="true" style={{ pointerEvents: "none" }}>
        <rect x="2" y="2" width="44" height="26" fill={COLOR} stroke="var(--ink)" strokeWidth={1.8} />
        <rect x="2" y="2" width="44" height="6" fill="#fff" opacity={0.18} />
      </svg>
    </div>
  );
}

export default function R5Tool({ onProgress, disabled = false }) {
  // Pure manipulative — local count only; it never reads or writes the answer.
  const [count, setCount] = useState(0);

  const whole = Math.floor(count / DEN);
  const leftover = count % DEN;

  const change = useCallback((next) => {
    const c = Math.max(0, Math.min(TOTAL, next));
    setCount(c);
    onProgress && onProgress({ kind: "manip_step", tool: "r5", count: c, den: DEN });
  }, [onProgress]);

  const addOne = useCallback(() => change(count + 1), [count, change]);
  const removeOne = useCallback(() => change(count - 1), [count, change]);

  return (
    <div className="kq-tool">
      <div className="kq-tool-hint">
        Drag ¼ blocks onto the stick — count the whole sticks that fill and the leftover.
      </div>

      {/* The stick is the DROP ZONE — handlers on this HTML wrapper (not the inner
          <svg>) so the drop fires reliably. One drop = one block. */}
      <div
        className="kq-qline"
        onDragOver={disabled ? undefined : (e) => e.preventDefault()}
        onDrop={disabled ? undefined : (e) => { e.preventDefault(); addOne(); }}
      >
        <Stick
          filled={count}
          disabled={disabled}
          onRemoveBlock={removeOne}
        />
      </div>

      <div className="kq-qbin">
        <span className="kq-qbin-lab">drag a quarter onto the stick</span>
        <BinBlock
          disabled={disabled || count >= TOTAL}
          onAdd={addOne}
          onDragStart={(e) => { e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData("text/plain", "1/4"); }}
        />
        <span dangerouslySetInnerHTML={{ __html: frac(1, DEN) }} />
        <span className="kq-qcount" aria-live="polite">
          {count} / {DEN} = {whole} and {leftover}/{DEN}
        </span>
      </div>
    </div>
  );
}
