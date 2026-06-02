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
//     bin         : number[]  — denominators offered in the tray (course set)
//     targetValue : number    — the value a correct row must reach (e.g. 5/6)
//     targetLabel : string    — what we're building, shown on the ruler flag
//     rulerWholes : number     — ruler span in wholes (1, or 2 for >1 answers)
//     solved      : boolean    — freeze the tray once the room has solved
//     onSolve({num, den})      — fired when the row is ONE size AND equals target
//     onPlace() / onRemove()   — optional telemetry for the engine
//     title, hint              — rail copy
import React, { useState, useRef, useEffect } from "react";
import BigFrac from "./BigFrac.jsx";
import { denomColor, denomTextColor, denomTone, denomHatch, denomHatchSize, denomName } from "../denominatorColors.js";
import "../styles/sandbox.css";

const ORIGIN = 8, SPAN = 600, LINE_Y = 150, ROW_Y = 70, ROW_H = 64;
const EPS = 1e-9;

export default function BlockSandbox({
  bin = [],
  targetValue,
  targetLabel,
  rulerWholes = 1,
  solved = false,
  onSolve = () => {},
  onPlace = () => {},
  onRemove = () => {},
  title = "Workbench",
  hint = "Pull blocks from the bin and stack them on the line. Build the answer out of same-size pieces, then count them up.",
}) {
  // The row of placed pieces, in order, as their denominators.
  const [pieces, setPieces] = useState([]);
  const solvedRef = useRef(solved);
  useEffect(() => { solvedRef.current = solved; }, [solved]);

  const UNIT = SPAN / rulerWholes;            // px per whole
  const total = pieces.reduce((s, d) => s + 1 / d, 0);
  const dens = Array.from(new Set(pieces));
  const sameDen = dens.length === 1 ? dens[0] : null;
  const atTarget = targetValue != null && Math.abs(total - targetValue) < EPS;

  // status readout (self-contained — keeps the room decoupled)
  let status = "Stack same-size blocks until the row reaches the flag.";
  let tone = "normal";
  if (pieces.length === 0) status = "Tap a block in the bin to drop it on the line.";
  else if (atTarget && sameDen) { status = `That's ${pieces.length} ${denomName(sameDen)} — read it off: ${pieces.length}/${sameDen}.`; tone = "ok"; }
  else if (atTarget && !sameDen) { status = "Right amount — but the blocks are different sizes, so you can't count them as one. Rebuild the row out of one size."; tone = "warn"; }
  else if (total > (targetValue ?? rulerWholes) + EPS) { status = "That's past the flag — tap a piece to take it back off."; tone = "warn"; }
  else if (!sameDen && pieces.length > 1) status = "These blocks are different sizes — they won't line up evenly. Try building the row from one size.";

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
    // don't allow the row to run off the end of the ruler
    if (total + 1 / d > rulerWholes + EPS) return;
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

  // ruler ticks at each whole
  const wholeTicks = Array.from({ length: rulerWholes + 1 }, (_, k) => k);
  const targetX = targetValue != null ? ORIGIN + targetValue * UNIT : null;

  // lay the placed pieces left to right
  let runX = ORIGIN;

  return (
    <div className="play sandbox-play">
      <div className="diagram">
        <div className="canvas sandbox-canvas">
          <div className={"sandbox-status" + (tone === "warn" ? " warn" : tone === "ok" ? " ok" : "")}>{status}</div>

          {/* the work strip — placed pieces, each tap-to-remove */}
          <div className="sandbox-row" style={{ left: ORIGIN, top: ROW_Y, width: rulerWholes * UNIT, height: ROW_H }}>
            {pieces.map((d, i) => {
              const w = (1 / d) * UNIT;
              const x = runX; runX += w;
              const fill = denomColor(d), cut = denomTone(d, 0.55), labColor = denomTextColor(d);
              return (
                <button
                  key={i}
                  type="button"
                  className="sandbox-piece"
                  style={{ left: x, width: w, background: fill, borderRight: `1.5px solid ${cut}` }}
                  onClick={() => removeAt(i)}
                  title="tap to take this block off"
                  aria-label={`one ${denomName(d)} — tap to remove`}
                >
                  <span className="sandbox-piece-hatch" style={{ backgroundImage: denomHatch(d), backgroundSize: denomHatchSize(d) }} />
                  <span className="sandbox-piece-lab" style={{ color: labColor, fontSize: w < 40 ? 11 : 14 }}>1/{d}</span>
                </button>
              );
            })}
          </div>

          {/* ruler 0 → rulerWholes with a target flag */}
          <div className="sandbox-line" style={{ left: ORIGIN, top: LINE_Y, width: rulerWholes * UNIT }} />
          {wholeTicks.map((k) => (
            <React.Fragment key={k}>
              <span className="sandbox-tick" style={{ left: ORIGIN + k * UNIT, top: LINE_Y }} />
              <span className="sandbox-tick-lab" style={{ left: ORIGIN + k * UNIT, top: LINE_Y + 10 }}>{k}</span>
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
              const full = total + 1 / d > rulerWholes + EPS;
              return (
                <button
                  key={d}
                  type="button"
                  className="sandbox-bin-btn"
                  disabled={solved || full}
                  onClick={() => place(d)}
                  title={`drop a 1/${d} block (${denomName(d)})`}
                  aria-label={`add one ${denomName(d)} block`}
                >
                  <span className="sandbox-bin-chip" style={{ background: fill, color: labColor }}>
                    <span className="sandbox-bin-hatch" style={{ backgroundImage: denomHatch(d), backgroundSize: denomHatchSize(d) }} />
                    1/{d}
                  </span>
                  <span className="sandbox-bin-name">{denomName(d)}</span>
                </button>
              );
            })}
          </div>

          <div className="sandbox-readout">
            <div className="sandbox-readout-row">
              <span className="sandbox-readout-lab">on the line</span>
              <span className="sandbox-readout-val">
                {sameDen ? <BigFrac num={pieces.length} den={sameDen} /> : <em>{pieces.length} block{pieces.length === 1 ? "" : "s"}, mixed sizes</em>}
              </span>
            </div>
            <button type="button" className="sandbox-clear" onClick={clearAll} disabled={solved || pieces.length === 0}>↺ Clear the line</button>
          </div>
        </div>
      </div>
    </div>
  );
}
