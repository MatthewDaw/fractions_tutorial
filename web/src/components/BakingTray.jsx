// BakingTray.jsx — the m2 (MULT_ARRAYS) manipulative: a rows × columns baking
// tray the child fills with buns. It serves THREE of the room's teaching beats
// from one component:
//
//   • FILL (Stage 1 · Manipulate) — DRAG a bun onto INTERIOR cells to drop it; only
//     the interior accepts a bun so the child fills the rectangle of cells, never
//     the frame. This is the perimeter-vs-interior guard: the tray's outer rim is a
//     border, not a countable cell. (Keyboard Enter/Space on a focused cell is the
//     non-pointer a11y path; a plain pointer tap no longer places a bun.)
//   • ROTATE (Stage 2 · Bind) — `onRotate` spins the tray 90° (rows↔cols). The
//     COUNT is unchanged (commutativity): 4 rows of 6 or 6 rows of 4, still 24.
//   • SCORE / CUT (Stage 3 · Fade) — `scoreAt` draws a knife line after column
//     `scoreAt`, splitting R×C into R×scoreAt + R×(C−scoreAt). Each part is
//     tinted so the child reads the two partial products (distributivity).
//
// Color policy (R-M3): pieces use a FIXED NEUTRAL kitchen-food tone — never the
// denominator palette (these are whole-number objects). Guard / correct /
// incorrect states use ROLE_COLORS only.
//
// CONTROLLED: the room owns which cells are filled and the score column. The tray
// reports cell activations up via `onFill` (drag-drop from AppM2, or keyboard).
//
// `filled` accepts EITHER model:
//   • a Set (or array) of filled cell indices — the per-cell model used by the
//     Manipulate stage, where the child must fill EACH cell individually by dragging
//     a bun onto it. Dragging onto an empty cell fills only it; dragging onto a
//     filled cell clears only it.
//   • a plain number N — a prefix count painted row-major (0 … rows*cols). Used by
//     the read-only stages (Bind/Fade/Workbench) that simply show a full tray.
//
//   props:
//     rows, cols : grid dimensions (the array's R × C)
//     filled     : Set/array of filled indices, OR a number (prefix count)
//     onFill(index) : a cell was activated (bun dragged onto it, or keyboard
//                  Enter/Space) — the room toggles that single cell
//     onRotate() : optional — the spin-the-tray button (Stage 2). If absent, no
//                  spin control renders.
//     ghost      : dim the whole tray to a faint check (Stage 3 — numbers lead)
//     dim        : alias kept for symmetry; treated like `ghost`
//     scoreAt    : optional column index (1 … cols−1). When set, a knife line is
//                  drawn after that column and the two partial regions are tinted.
//     readOnly   : when true (or ghost), cells are not tappable.
import React from "react";
import { ROLE_COLORS } from "../denominatorColors.js";

// Fixed neutral kitchen-food tones (R-M3): warm bun on a tray; NOT denomColor.
const BUN = "#caa46a";          // a baked bun
const BUN_EDGE = "#8a6a3a";     // bun outline / cut between buns
const EMPTY = "#efe3c6";        // an empty greased cup
const TRAY = "#7a5230";         // the tray's metal frame
const SCORE_A = "#d7b074";      // the left/first partial region tint
const SCORE_B = "#bfe0d6";      // the right/second partial region tint (teal-ish)

const CELL = 52;   // interior cell edge (px)
const GAP = 6;     // gap between cells
const RIM = 14;    // tray rim thickness (the non-tappable frame)

export default function BakingTray({
  rows = 1,
  cols = 1,
  filled = 0,
  onFill = () => {},
  onRotate = null,
  ghost = false,
  dim = false,
  scoreAt = null,
  readOnly = false,
}) {
  const faded = ghost || dim;
  const tappable = !readOnly && !faded;
  const total = rows * cols;

  // `filled` is either a Set/array of indices (per-cell model) or a prefix count.
  const isSet = filled instanceof Set;
  const isArr = Array.isArray(filled);
  const filledSet = isSet ? filled : isArr ? new Set(filled) : null;
  const prefixN = filledSet ? null : Math.max(0, Math.min(total, filled | 0));
  const cellIsFilled = (i) => (filledSet ? filledSet.has(i) : i < prefixN);

  // Per-cell toggle: activating a cell flips ONLY that cell. The child is forced to
  // fill each individual cell (no fill-the-rest shortcut) by DRAGGING a bun onto it,
  // and can self-correct by dragging onto a filled cell to clear it. The placement
  // gesture is owned by AppM2's drag handler (grabBun → onFill). This component only
  // exposes a non-pointer keyboard activation (Enter/Space) for a11y; a plain
  // pointer tap does NOT place a bun.
  function activateCell(index) {
    if (!tappable) return;
    onFill(index);
  }

  // Tray inner board dimensions.
  const boardW = cols * CELL + (cols - 1) * GAP;
  const boardH = rows * CELL + (rows - 1) * GAP;

  // The knife line sits in the gap-channel after column `scoreAt`.
  const scoreValid = scoreAt != null && scoreAt > 0 && scoreAt < cols;
  const scoreX = scoreValid
    ? scoreAt * CELL + (scoreAt - 1) * GAP + GAP / 2
    : null;

  return (
    <div
      className={"m2-tray" + (faded ? " is-ghost" : "")}
      style={{ opacity: faded ? 0.32 : 1, filter: faded ? "grayscale(0.5)" : "none" }}
    >
      <div
        className="m2-tray-frame"
        style={{
          padding: RIM,
          background: TRAY,
          borderRadius: 12,
          boxShadow: "inset 0 2px 6px rgba(0,0,0,0.35), 3px 3px 0 rgba(28,22,18,0.18)",
        }}
      >
        <div
          className="m2-tray-board"
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${CELL}px)`,
            gridTemplateRows: `repeat(${rows}, ${CELL}px)`,
            gap: GAP,
            width: boardW,
            height: boardH,
          }}
        >
          {Array.from({ length: total }).map((_, i) => {
            const r = Math.floor(i / cols);
            const c = i % cols;
            const isFilled = cellIsFilled(i);
            // distributive tint: which side of the score line this cell is on
            const inFirst = scoreValid && c < scoreAt;
            const tint = scoreValid ? (inFirst ? SCORE_A : SCORE_B) : null;
            return (
              <button
                key={i}
                type="button"
                className={"m2-tray-cell" + (isFilled ? " is-filled" : "")}
                disabled={!tappable}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    activateCell(i);
                  }
                }}
                aria-label={
                  isFilled
                    ? `bun at row ${r + 1}, column ${c + 1} — drag a bun here (or press Enter) to remove`
                    : `empty cup at row ${r + 1}, column ${c + 1} — drag a bun here (or press Enter) to add a bun`
                }
                style={{
                  width: CELL,
                  height: CELL,
                  borderRadius: 8,
                  border: `2px solid ${BUN_EDGE}`,
                  background: isFilled ? BUN : (tint || EMPTY),
                  cursor: tappable ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  transition: "background .18s ease, transform .12s ease",
                }}
              >
                {isFilled && (
                  <span
                    aria-hidden="true"
                    style={{
                      width: CELL * 0.62,
                      height: CELL * 0.62,
                      borderRadius: "50%",
                      background: "radial-gradient(circle at 38% 32%, #e8c98a, #b8893f 70%)",
                      boxShadow: "inset 0 -2px 3px rgba(120,80,30,0.5)",
                    }}
                  />
                )}
              </button>
            );
          })}

          {/* the score / cut line (Stage 3 distributivity) */}
          {scoreValid && (
            <div
              className="m2-tray-score"
              aria-hidden="true"
              style={{
                position: "absolute",
                left: scoreX,
                top: -RIM,
                width: 0,
                height: boardH + RIM * 2,
                borderLeft: `3px dashed ${ROLE_COLORS.incorrect}`,
                transform: "translateX(-1.5px)",
              }}
            />
          )}
        </div>
      </div>

      {/* the spin-the-tray control (Stage 2 commutativity) */}
      {typeof onRotate === "function" && (
        <button
          type="button"
          className="m2-tray-spin"
          onClick={onRotate}
          title="Spin the tray — rows become columns"
          aria-label="Spin the tray ninety degrees"
        >
          ⟳ Spin the tray
        </button>
      )}
    </div>
  );
}
