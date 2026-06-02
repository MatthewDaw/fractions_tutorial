// BlockSandbox.jsx — the WORKBENCH: a free bin of every fraction block the course
// covers. Unlike a lesson's Stage-1 blocks (pre-arranged INTO the problem), here
// the child must CHOOSE the right pieces from the full set, stack them on the
// ruler, and count them out to solve. It is the last concrete support before the
// numbers-only stages, and a manipulative the child can always fall back to.
//
// The teaching beat: lay the two addends with their own sizes, SEE they don't line
// up, then rebuild the row out of one common size and read the count. The sandbox
// only celebrates a SAME-SIZE row that reaches the target — mixed sizes get a
// "rebuild them the same size" nudge — so the count it reports is always a clean
// num/den the room can grade and advance on.
//
// CONTROLLED-ISH: the room owns the problem + outcome; the sandbox owns the row of
// placed pieces and reports up:
//   props:
//     mode        : "fraction" | "number"  — fraction blocks (1/d wide, the R-lesson
//                   default) OR whole-number "group" scoops (s units wide, for M1's
//                   whole-number multiplication workbench). Default "fraction".
//     bin         : number[]  — fraction mode: denominators offered in the tray;
//                   number mode: group SIZES offered (e.g. a "4" scoop + distractors)
//     targetValue : number    — fraction mode: value a correct row must reach (5/6);
//                   number mode: the total COUNT a correct row must reach (e.g. 12)
//     targetLabel : string    — what we're building, shown on the ruler flag
//     rulerWholes : number     — fraction mode: ruler span in wholes (1, or 2…);
//                   number mode: ignored — the line spans 0→targetValue (the count)
//     solved      : boolean    — freeze the tray once the room has solved
//     onSolve({num, den})      — fired when the row is ONE size AND equals target.
//                   number mode reports num = #scoops (groups), den = scoop size, so
//                   the room can read groups×size; AppM1 reads num*den = the product.
//     onPlace() / onRemove()   — optional telemetry for the engine
//     title, hint              — rail copy
import React, { useState, useRef, useEffect } from "react";
import BigFrac from "./BigFrac.jsx";
import { denomColor, denomTextColor, denomTone, denomHatch, denomHatchSize, denomName } from "../denominatorColors.js";
import "../styles/sandbox.css";

const ORIGIN = 8, SPAN = 600, LINE_Y = 150, ROW_Y = 70, ROW_H = 64;
const EPS = 1e-9;
// Bin-chip width (px): a chip's width is TRULY proportional to its block value
// (number mode: ∝ size; fraction mode: ∝ 1/d) so the tray itself teaches relative
// magnitude — the largest block in the bin maps to BIN_CHIP_MAX, every smaller
// block scales down linearly, and a small absolute MIN keeps a tiny piece (e.g.
// 1/12) tappable without ever inverting the proportional order.
const BIN_CHIP_MIN = 30, BIN_CHIP_MAX = 116;

// Number ("group") mode reuses the denominator palette + hatch for distinct,
// colorblind-safe block colors keyed by the scoop's SIZE (so all "4" scoops match,
// all "5" scoops match, etc.). Group sizes name themselves "groups of N".
function groupName(s) { return `group of ${s}`; }

// Number mode: draw N evenly-spaced divider lines across a block of size N so the
// child can literally COUNT the N unit cells inside an "N" block (the 8-block reads
// as eight cells, the 5-block as five). Proportional (100%/N), so it stays correct
// at any pixel width — bin chip, placed piece, or drag ghost. Skipped for N=1.
function segLines(n) {
  const a = `calc(100% / ${n} - 1.5px)`, b = `calc(100% / ${n})`;
  return `repeating-linear-gradient(90deg, transparent 0, transparent ${a}, rgba(20,14,10,0.5) ${a}, rgba(20,14,10,0.5) ${b})`;
}

export default function BlockSandbox({
  mode = "fraction",
  bin = [],
  targetValue,
  targetLabel,
  rulerWholes = 1,
  solved = false,
  onSolve = () => {},
  onPlace = () => {},
  onRemove = () => {},
  title = "Workbench",
  hint = "Drag a block from the bin onto the line and stack them up. Build the answer out of same-size pieces, then count them.",
}) {
  const isNumber = mode === "number";
  // The row of placed pieces, in order, as their denominators.
  const [pieces, setPieces] = useState([]);
  const solvedRef = useRef(solved);
  useEffect(() => { solvedRef.current = solved; }, [solved]);

  // DRAG state: while a bin block is being dragged, `drag` holds the live ghost
  // (the block's denominator + the pointer position), and `hotLine` lights the
  // ruler as a drop target. A block is placed ONLY by dropping it on the line;
  // keyboard activation is the only non-pointer accessibility path.
  const [drag, setDrag] = useState(null);      // { d, x, y } | null
  const [hotLine, setHotLine] = useState(false);
  const lineRef = useRef(null);                 // the ruler/row drop zone

  // VALUE of one block: in number mode a scoop of size `d` is worth `d` of the count
  // (so the line is the running total); in fraction mode it's worth 1/d of a whole.
  const blockVal = (d) => (isNumber ? d : 1 / d);
  // The line spans the COUNT (0→targetValue) in number mode, else rulerWholes wholes.
  const lineSpan = isNumber ? (targetValue ?? 1) : rulerWholes;
  const UNIT = SPAN / lineSpan;               // px per count-unit (number) / per whole (fraction)
  const total = pieces.reduce((s, d) => s + blockVal(d), 0);
  const dens = Array.from(new Set(pieces));
  const sameDen = dens.length === 1 ? dens[0] : null;   // the one common size, if any
  const atTarget = targetValue != null && Math.abs(total - targetValue) < EPS;
  // largest block VALUE offered in the bin — the reference for proportional chip width
  const binMaxVal = bin.length ? Math.max(...bin.map(blockVal)) : 1;

  // status readout (self-contained — keeps the room decoupled)
  let status = "Stack same-size blocks until the row reaches the flag.";
  let tone = "normal";
  if (pieces.length === 0) status = "Drag a block from the bin onto the line.";
  else if (atTarget && sameDen) {
    status = isNumber
      ? `That's ${pieces.length} groups of ${sameDen} — count them up: ${pieces.length} × ${sameDen} = ${pieces.length * sameDen}.`
      : `That's ${pieces.length} ${denomName(sameDen)} — read it off: ${pieces.length}/${sameDen}.`;
    tone = "ok";
  }
  else if (atTarget && !sameDen) { status = "Right amount — but the groups are different sizes, so they aren't equal groups. Rebuild the row out of one size."; tone = "warn"; }
  else if (total > targetValue + EPS) { status = "That's past the flag — tap a piece to take it back off."; tone = "warn"; }
  else if (!sameDen && pieces.length > 1) status = isNumber
    ? "These groups are different sizes — equal groups must all match. Try building the row from one size."
    : "These blocks are different sizes — they won't line up evenly. Try building the row from one size.";

  // celebrate a clean, same-size, on-target row exactly once
  const firedRef = useRef(false);
  useEffect(() => {
    if (solved) return;
    if (atTarget && sameDen && !firedRef.current) {
      firedRef.current = true;
      onSolve({ num: pieces.length, den: sameDen });
    }
    if (!(atTarget && sameDen)) firedRef.current = false;
  }, [atTarget, sameDen, pieces.length, solved, onSolve]);

  function place(d) {
    if (solvedRef.current) return;
    // don't allow the row to run off the end of the line
    if (total + blockVal(d) > lineSpan + EPS) return;
    setPieces((p) => [...p, d]);
    onPlace();
  }
  function removeAt(i) {
    if (solvedRef.current) return;
    setPieces((p) => p.filter((_, k) => k !== i));
    onRemove();
  }
  function clearAll() {
    if (solvedRef.current) return;
    if (pieces.length) onRemove();
    setPieces([]);
  }

  // ---- DRAG a bin block onto the line --------------------------------------
  // Pointer-events pattern (mirrors AppR5 grabBlock): pointerdown on a bin chip
  // captures the block; a ghost follows the pointer via a GLOBAL pointermove; the
  // line highlights while the pointer is over it; pointerup drops — on the line we
  // place(d) (identical placement/snap), elsewhere we cancel (a bare tap that never
  // reaches the line does NOT place). touch-action:none on the chips keeps a touch
  // drag from scrolling the page. If the event carries no coordinates
  // (keyboard/synthetic), we fall straight through to a plain place() for a11y.
  function overLine(ev) {
    const el = lineRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    // a generous band around the row/ruler so dropping is forgiving on a tablet
    return ev.clientX >= r.left - 24 && ev.clientX <= r.right + 24 &&
           ev.clientY >= r.top - 40 && ev.clientY <= r.bottom + 40;
  }
  function grabBlock(e, d) {
    if (solvedRef.current) return;
    // a bin chip that would overflow the line is disabled — never starts a drag
    if (total + blockVal(d) > lineSpan + EPS) return;
    if (e && e.preventDefault) e.preventDefault();
    // no pointer coordinates (keyboard Enter / Space) → keyboard a11y placement
    if (!e || e.clientX == null) { place(d); return; }
    const startX = e.clientX, startY = e.clientY;
    let moved = false;                            // did this become a real drag?
    setDrag({ d, x: startX, y: startY });
    setHotLine(overLine(e));
    const move = (ev) => {
      if (Math.abs(ev.clientX - startX) > 6 || Math.abs(ev.clientY - startY) > 6) moved = true;
      setDrag({ d, x: ev.clientX, y: ev.clientY });
      setHotLine(overLine(ev));
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const onLine = overLine(ev);
      setDrag(null); setHotLine(false);
      // Drag-only: a block is placed ONLY when the pointer is released over the
      // line. A bare pointer tap (no movement, not over the line) does NOT place.
      // Keyboard activation is handled separately (grabBlock's no-coordinate path).
      void moved;
      if (onLine) place(d);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }
  // clean up listeners if we unmount mid-drag (defensive)
  useEffect(() => () => { setDrag(null); setHotLine(false); }, []);

  // ruler ticks: number mode marks each unit of the count (labelling only 0 and the
  // flag so 0→12 doesn't get noisy); fraction mode marks each whole.
  const wholeTicks = isNumber
    ? Array.from({ length: lineSpan + 1 }, (_, k) => k)
    : Array.from({ length: rulerWholes + 1 }, (_, k) => k);
  const tickLabel = (k) => (isNumber ? (k === 0 || k === lineSpan ? String(k) : "") : String(k));
  const targetX = targetValue != null ? ORIGIN + targetValue * UNIT : null;

  // lay the placed pieces left to right
  let runX = ORIGIN;

  return (
    <div className="play sandbox-play">
      <div className="diagram">
        <div className="canvas sandbox-canvas" ref={lineRef}>
          <div className={"sandbox-status" + (tone === "warn" ? " warn" : tone === "ok" ? " ok" : "")}>{status}</div>

          {/* DROP-TARGET highlight band — lights up the row/ruler region while a bin
              block is being dragged over it, so the child sees where it lands. */}
          {drag && (
            <div className={"sandbox-droptarget" + (hotLine ? " is-hot" : "")}
              style={{ left: ORIGIN - 8, top: ROW_Y - 8, width: lineSpan * UNIT + 16, height: (LINE_Y - ROW_Y) + ROW_H }}
              aria-hidden="true" />
          )}

          {/* the work strip — placed pieces, each tap-to-remove */}
          <div className="sandbox-row" style={{ left: ORIGIN, top: ROW_Y, width: lineSpan * UNIT, height: ROW_H }}>
            {pieces.map((d, i) => {
              const w = blockVal(d) * UNIT;
              const x = runX; runX += w;
              const fill = denomColor(d), cut = denomTone(d, 0.55), labColor = denomTextColor(d);
              const lab = isNumber ? String(d) : "1/" + d;
              return (
                <button
                  key={i}
                  type="button"
                  className="sandbox-piece"
                  style={{ left: x, width: w, background: fill, borderRight: `1.5px solid ${cut}` }}
                  onClick={() => removeAt(i)}
                  title="tap to take this block off"
                  aria-label={`one ${isNumber ? groupName(d) : denomName(d)} — tap to remove`}
                >
                  <span className="sandbox-piece-hatch" style={{ backgroundImage: denomHatch(d), backgroundSize: denomHatchSize(d) }} />
                  {isNumber && d > 1 && (
                    <span className="sandbox-seg" style={{ backgroundImage: segLines(d) }} />
                  )}
                  <span className="sandbox-piece-lab" style={{ color: labColor, fontSize: w < 40 ? 11 : 14 }}>{lab}</span>
                </button>
              );
            })}
          </div>

          {/* ruler 0 → end with a target flag */}
          <div className="sandbox-line" style={{ left: ORIGIN, top: LINE_Y, width: lineSpan * UNIT }} />
          {wholeTicks.map((k) => (
            <React.Fragment key={k}>
              <span className="sandbox-tick" style={{ left: ORIGIN + k * UNIT, top: LINE_Y }} />
              <span className="sandbox-tick-lab" style={{ left: ORIGIN + k * UNIT, top: LINE_Y + 10 }}>{tickLabel(k)}</span>
            </React.Fragment>
          ))}
          {targetX != null && (
            <div className="sandbox-flag" style={{ left: targetX, top: ROW_Y - 16, height: (LINE_Y - ROW_Y) + 32 }}>
              <span className="sandbox-flag-lab">{targetLabel || "answer"}</span>
            </div>
          )}
        </div>
      </div>

      {/* the rail: the bin of every block + a live count + clear */}
      <div className="rail">
        <div className="panel">
          <h3>{title}</h3>
          <div className="hint">{hint}</div>
          <div className="sandbox-bin" role="group" aria-label="block bin">
            {bin.map((d) => {
              const fill = denomColor(d), labColor = denomTextColor(d);
              const full = total + blockVal(d) > lineSpan + EPS;
              // The bin chip's WIDTH is TRULY proportional to the block's value so the
              // tray itself teaches relative size: the biggest block hits BIN_CHIP_MAX
              // and everything smaller scales straight down by value (an "8" chip is
              // clearly wider than a "5"; a 1/2 chip clearly wider than a 1/8). Only a
              // small absolute MIN keeps a tiny piece tappable — the order never flips.
              const chipW = Math.max(BIN_CHIP_MIN, Math.round(BIN_CHIP_MAX * (blockVal(d) / binMaxVal)));
              return (
                <button
                  key={d}
                  type="button"
                  className={"sandbox-bin-btn" + (drag && drag.d === d ? " is-dragging" : "")}
                  style={{ width: chipW, touchAction: "none" }}
                  disabled={solved || full}
                  onPointerDown={(e) => grabBlock(e, d)}
                  onClick={(e) => {
                    // KEYBOARD-ONLY accessibility path. Pointer placement is
                    // drag-only (grabBlock/pointerup, drop on the line). A pointer
                    // tap fires a synthetic click with e.detail>=1, which we ignore
                    // so a plain tap never places. Keyboard Enter/Space fires a
                    // click with e.detail===0 — that (and only that) places here.
                    if (e.detail === 0) place(d);
                  }}
                  title={isNumber ? `drag a ${groupName(d)} onto the line` : `drag a 1/${d} block (${denomName(d)}) onto the line`}
                  aria-label={isNumber ? `add one ${groupName(d)} — drag onto the line, or press to place` : `add one ${denomName(d)} block — drag onto the line, or press to place`}
                >
                  <span className="sandbox-bin-chip" style={{ background: fill, color: labColor }}>
                    <span className="sandbox-bin-hatch" style={{ backgroundImage: denomHatch(d), backgroundSize: denomHatchSize(d) }} />
                    {isNumber && d > 1 && (
                      <span className="sandbox-seg" style={{ backgroundImage: segLines(d) }} />
                    )}
                    {isNumber ? d : "1/" + d}
                  </span>
                  <span className="sandbox-bin-name">{isNumber ? groupName(d) : denomName(d)}</span>
                </button>
              );
            })}
          </div>

          <div className="sandbox-readout">
            <div className="sandbox-readout-row">
              <span className="sandbox-readout-lab">on the line</span>
              <span className="sandbox-readout-val">
                {sameDen
                  ? (isNumber
                      ? <b>{pieces.length} × {sameDen} = {pieces.length * sameDen}</b>
                      : <BigFrac num={pieces.length} den={sameDen} />)
                  : <em>{pieces.length} block{pieces.length === 1 ? "" : "s"}, mixed sizes</em>}
              </span>
            </div>
            <button type="button" className="sandbox-clear" onClick={clearAll} disabled={solved || pieces.length === 0}>↺ Clear the line</button>
          </div>
        </div>
      </div>

      {/* the DRAG GHOST — a copy of the grabbed block that follows the pointer in
          real time while dragging (fixed-positioned, pointer-events:none). */}
      {drag && (
        <div className="sandbox-ghost" aria-hidden="true"
          style={{ left: drag.x, top: drag.y, background: denomColor(drag.d), color: denomTextColor(drag.d) }}>
          <span className="sandbox-ghost-hatch" style={{ backgroundImage: denomHatch(drag.d), backgroundSize: denomHatchSize(drag.d) }} />
          {isNumber && drag.d > 1 && (
            <span className="sandbox-seg" style={{ backgroundImage: segLines(drag.d) }} />
          )}
          <span className="sandbox-ghost-lab">{isNumber ? drag.d : "1/" + drag.d}</span>
        </div>
      )}
    </div>
  );
}
