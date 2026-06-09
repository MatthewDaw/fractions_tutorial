// BakingTray.jsx — the m2 (Arrays / Area model) manipulative: a baking tray laid
// out as an R rows × C columns grid of cells inside a raised rim. The same tray
// serves the whole arc:
//
//   • FILL (stage 1)  — the child taps cells to drop a bun into each. Buns go INSIDE
//     the tray (the rim is a frame, never a bun) — the array is the rectangle's
//     INTERIOR area, not its edge; tapping the rim is refused (the array_perimeter
//     inoculation). The full tray holds rows × cols buns.
//   • ROTATE (stage 2) — a spin chip swaps rows ↔ columns (4×6 → 6×4); the filled
//     count is unchanged, making COMMUTATIVITY visible.
//   • SCORE / CUT (stage 3) — a vertical score line after `scoreAt` columns splits
//     the tray into two sub-rectangles (R×scoreAt and R×(C−scoreAt)); the two
//     partials are tinted so DISTRIBUTIVITY reads (R×C = R×a + R×b).
//
// Per R-M3 these are whole-number food objects: a FIXED neutral kitchen tone for the
// buns; guard / correct states via ROLE_COLORS only — never denomTone/denomColor.
//
// CONTROLLED: the room owns rows/cols/filled (a Set of "r,c" cell keys) and the
// callbacks; the tray owns only the grid render + the rim/interior guard.
//
//   props:
//     rows      : number              — tray rows (R)
//     cols      : number              — tray columns (C)
//     filled    : Set<string>|object  — cell keys "r,c" that hold a bun (a plain
//                                        object map { "r,c": true } also works)
//     onFill(r,c) : (r,c)=>void        — tap a cell to (un)fill it with a bun
//     onRotate()  : ()=>void           — spin chip (commutativity); omit to hide it
//     ghost     : boolean             — dim the whole tray to a faint check (Fade)
//     scoreAt   : number|null         — if set, draw a cut after this many columns and
//                                        tint the two halves (distributivity)
//     readOnly  : boolean             — disable tapping (solved / later stages)
//     fillAll   : boolean             — render every cell filled (display-only stages
//                                        2/3 where the tray is already full)
const FOOD = "#c9a36b";       // golden bun dough (neutral kitchen tone, R-M3)
const FOOD_EDGE = "#9a7740";

import React from "react";
import { ROLE_COLORS } from "../denominatorColors.js";

// Is (r,c) an INTERIOR cell of an R×C grid? Interior = not on the outer ring. Kept
// as a pure exported helper for the area/perimeter guard reasoning and its test. For
// a tray with a dimension < 3 there is no interior ring, so EVERY cell is interior.
export function isInterior(r, c, rows, cols) {
  if (rows < 3 || cols < 3) return true;
  return r > 0 && r < rows - 1 && c > 0 && c < cols - 1;
}

/** Count of interior cells in an R×C tray. */
export function interiorCount(rows, cols) {
  if (rows < 3 || cols < 3) return rows * cols;
  return (rows - 2) * (cols - 2);
}

function hasKey(filled, key) {
  if (!filled) return false;
  if (filled instanceof Set) return filled.has(key);
  return Boolean(filled[key]);
}

export default function BakingTray({
  rows = 1,
  cols = 1,
  filled = null,
  onFill = () => {},
  onRotate = null,
  ghost = false,
  scoreAt = null,
  readOnly = false,
  fillAll = false,
}) {
  const cut = scoreAt != null && scoreAt > 0 && scoreAt < cols ? scoreAt : null;

  return (
    <div className={"m2-tray-wrap" + (ghost ? " is-ghost" : "")}>
      <div className="m2-tray-rim" aria-hidden="true" />
      <div
        className="m2-tray"
        role="group"
        aria-label={`baking tray, ${rows} rows by ${cols} columns`}
        style={{
          gridTemplateColumns: `repeat(${cols}, var(--m2-cell))`,
          gridTemplateRows: `repeat(${rows}, var(--m2-cell))`,
        }}
      >
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => {
            const key = `${r},${c}`;
            const lit = fillAll || hasKey(filled, key);
            // distributive tint: cells left of the cut vs. right of it
            const side = cut == null ? "" : c < cut ? " m2-cell--left" : " m2-cell--right";
            const tappable = !readOnly && !ghost && !fillAll;
            return (
              <button
                key={key}
                type="button"
                className={"m2-cell" + (lit ? " is-filled" : "") + side}
                disabled={!tappable}
                onClick={tappable ? () => onFill(r, c) : undefined}
                title={lit ? "bun — tap to remove" : "tap to add a bun"}
                aria-label={`row ${r + 1}, column ${c + 1}` + (lit ? " — bun" : " — empty, tap to fill")}
              >
                {lit && (
                  <span
                    className="m2-bun"
                    style={{ background: FOOD, borderColor: FOOD_EDGE }}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })
        )}
        {cut != null && (
          <div
            className="m2-scoreline"
            aria-hidden="true"
            style={{ left: `calc(${cut} * var(--m2-cell) + ${cut} * var(--m2-gap))` }}
          />
        )}
      </div>

      {/* dimension labels: R rows down the side, C columns across the top */}
      <div className="m2-dim m2-dim-cols" aria-hidden="true">{cols} columns</div>
      <div className="m2-dim m2-dim-rows" aria-hidden="true">{rows} rows</div>

      {onRotate && !ghost && (
        <button
          type="button"
          className="m2-spin"
          onClick={onRotate}
          disabled={readOnly}
          title="spin the tray a quarter turn"
          aria-label="spin the tray — rows and columns swap"
          style={{ borderColor: ROLE_COLORS.childInk }}
        >
          ⟳ spin the tray
        </button>
      )}
    </div>
  );
}
