/* tools/nl.jsx — №5 Same Denominators helper tool (INTERACTIVE).
 *
 * A 0→1 ruler marked in sixths. The child DRAGS 1/6 blocks from the bin onto the
 * ruler (or taps a block / the ruler to add one), and counts them up. The
 * fraction is blocks / 6. On every count change we call onChange({ num, den:6 }).
 *
 * Re-authored from wireframe answer.js TOOLS.nl + the quarterLine builder as real
 * JSX so the SVG can be interactive, while keeping the exact wireframe classes
 * (kq-qline, kq-qbin, kq-qbin-lab, kq-qline-svg, the sixths color #caa300) so
 * styles/kitchen.css applies. Props: see KitchenTool.jsx contract.
 */
import { useState, useCallback } from "react";
import { frac } from "../../../kitchen/primitives.jsx";

const DEN = 6; // sixths — the 0→1 ruler is one whole cut into six pieces
const COLOR = "#caa300"; // the Same-Denominators sixths color (matches wireframe)

/* ruler geometry — mirrors primitives.quarterLine (span = 1 whole, den = 6) */
const X0 = 26, X1 = 454, Y = 78, SPAN = 1;
const TOTAL = DEN * SPAN; // 6 pieces
const SEG = (X1 - X0) / TOTAL; // pixel width of one 1/6 block

/* An interactive 0→1 sixths ruler. It is a DROP TARGET: the child drags one 1/6
 * block from the bin and drops it on the ruler to place a single block (one drop
 * = one block — no "click the ruler to fill to that line"). Tapping a placed
 * block takes one back off. */
function Ruler({ filled, disabled, onRemoveBlock }) {
  // ticks: 0..TOTAL, whole marks (0 and 6) bolder; ends bolder still
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

  // fraction labels under each mark (1/6, 2/6 …); ends are bold whole numbers
  const labs = [];
  for (let i = 0; i <= TOTAL; i++) {
    const x = +(X0 + i * SEG).toFixed(1);
    const end = i === 0 || i === TOTAL;
    const lab = end ? String(i / DEN) : `${i}/${DEN}`;
    labs.push(
      <text key={`l${i}`} x={x} y={Y + 24} textAnchor="middle"
        fontSize={end ? 18 : 13} fontWeight={end ? 700 : 400}
        fontStyle={end ? "normal" : "italic"}
        fill={end ? "var(--red)" : "var(--ink-mute)"}>{lab}</text>
    );
  }

  // placed blocks (the first `filled` cells), each labelled 1/6. Tapping a placed
  // block takes one back off (one at a time) — there is NO click-to-fill on the
  // empty ruler; blocks are added only by DRAGGING one from the bin and dropping.
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
        <text x={+(x + w / 2).toFixed(1)} y={Y - 18} textAnchor="middle"
          fontSize={13} fontWeight={700} fill="var(--ink)">1/6</text>
        {!disabled && isLast && <title>take a 1/6 block off</title>}
      </g>
    );
  }

  return (
    <svg className="kq-qline-svg" viewBox="0 0 480 108" role="img"
      aria-label={`number line with ${filled} of ${DEN} blocks placed`}>
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

/* a single draggable 1/6 block in the bin. The DRAGGABLE element is an HTML <div>
 * (browsers don't reliably drag inline <svg>, which is why this needs the wrapper
 * — same approach as the m1 plums). The svg inside is presentational. */
function BinBlock({ disabled, onAdd, onDragStart }) {
  return (
    <div className="kq-qblock-drag" role="button" tabIndex={disabled ? -1 : 0}
      aria-label="drag a 1/6 block onto the ruler"
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

export default function NlTool({ onProgress, disabled = false }) {
  // Pure manipulative — local count only; it never reads or writes the answer.
  const [count, setCount] = useState(0);

  const change = useCallback((next) => {
    const c = Math.max(0, Math.min(TOTAL, next));
    setCount(c);
    onProgress && onProgress({ kind: "manip_step", tool: "nl", count: c, den: DEN });
  }, [onProgress]);

  const addOne = useCallback(() => change(count + 1), [count, change]);
  const removeOne = useCallback(() => change(count - 1), [count, change]);

  return (
    <div className="kq-tool">
      <div className="kq-tool-hint">Drag the 1/6 blocks onto the ruler, then count them up.</div>

      {/* The ruler is the DROP ZONE. The handlers live on this HTML wrapper (not
          the inner <svg>) so the drop works reliably — dragover preventDefault on
          the container is what marks it a valid drop target. One drop = one block. */}
      <div
        className="kq-qline"
        onDragOver={disabled ? undefined : (e) => e.preventDefault()}
        onDrop={disabled ? undefined : (e) => { e.preventDefault(); addOne(); }}
      >
        <Ruler
          filled={count}
          disabled={disabled}
          onRemoveBlock={removeOne}
        />
      </div>

      <div className="kq-qbin">
        <span className="kq-qbin-lab">drag a 1/6 block onto the ruler</span>
        <BinBlock
          disabled={disabled || count >= TOTAL}
          onAdd={addOne}
          onDragStart={(e) => { e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData("text/plain", "1/6"); }}
        />
        <span dangerouslySetInnerHTML={{ __html: frac(1, DEN) }} />
        <span className="kq-qcount" aria-live="polite">
          {count} / {DEN}
        </span>
      </div>
    </div>
  );
}
