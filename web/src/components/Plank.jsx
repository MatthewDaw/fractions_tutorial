// Plank.jsx — a strip of dough (a fraction bar). Its length encodes its value
// and never changes; a knife only adds more, equal cut-lines. Each block is
// labelled with the running count (1/6, 2/6, 3/6 …) so the child can count.
//
// Props: baseNum, baseDen, m, unit, sliceTick, matched, hoverCut, bodyRef, faded
// Color is driven ENTIRELY by the strip's CURRENT denominator (D = baseDen·m) via
// the central denominator palette — never by which strip this is. Slice the strip
// (m changes) and its color switches to the new denominator's hue; two strips that
// reach the same denominator therefore render the same color. (`tone` is accepted
// for back-compat but ignored.)
// `faded` (L2 "blocks fade"): the strip is still FILLED with its denominator color
// (so 1/2 reads blue, 1/3 orange, etc.) — `faded` only suppresses the knife-slice
// affordances (sweep animation, cut-ticks, hover-cut ghost), since in L2 the child
// chooses the size via the picker instead of dragging a knife.
import { denomColor, denomTextColor, denomTone, denomHatch, denomHatchSize } from "../denominatorColors.js";
import Knife from "./Knife.jsx";

export default function Plank({ baseNum, baseDen, m, unit, tone, sliceTick = 0, matched = false, hoverCut = false, bodyRef = null, faded = false }) {
  const value = baseNum / baseDen;
  const totalW = value * unit;
  const pieces = baseNum * m;
  const pieceW = totalW / pieces;
  const D = baseDen * m;

  const fillBase = denomColor(D);
  const cutLine = denomTone(D, 0.55);     // divider in the denominator's own tone
  const labColor = denomTextColor(D);
  const labSize = pieceW < 40 ? 11 : pieceW < 58 ? 13 : 15;
  // Only label a piece when the "1/D" actually FITS its width. Past a fine cut the
  // pieces are too narrow for the text, so labelling every one just smears them
  // into an unreadable blur (and over the strip's fraction tag / ×N chip). Below
  // the fit threshold we drop the per-piece labels — the strip's value still reads
  // off its fraction tag (the .btag), and the pieces stay countable by eye.
  const showLabels = pieceW >= 26;
  const hatch = denomHatch(D);
  const hatchSize = denomHatchSize(D);

  // The block is always filled with its denominator color (incl. L2). `faded` only
  // turns off the knife-slice flourishes below.
  const pieceBg = fillBase;

  return (
    <div className={`plank ${matched ? "is-matched" : ""} ${faded ? "is-faded" : ""}`} style={{ width: totalW }}>
      <div className="plank-body" ref={bodyRef}>
        {Array.from({ length: pieces }).map((_, i) => (
          <div key={i} className="piece" style={{
            width: pieceW, background: pieceBg,
            borderRight: i < pieces - 1 ? `1px solid ${cutLine}` : "none",
          }}>
            <div className="piece-hatch" style={{ backgroundImage: hatch, backgroundSize: hatchSize }} />
            {/* Each block reads the UNIT (1/D) — but only when the piece is wide
                enough to hold the text (past a fine cut the labels would smear). */}
            {showLabels && <span className="piece-lab" style={{ color: labColor, fontSize: labSize, background: pieceBg }}>1/{D}</span>}
            {!faded && i < pieces - 1 && <span className="cut-tick top" style={{ background: cutLine }} />}
            {!faded && i < pieces - 1 && <span className="cut-tick bot" style={{ background: cutLine }} />}
          </div>
        ))}
        <div key={sliceTick} className={!faded && sliceTick > 0 ? "sweep" : ""} />
        {hoverCut && <div className="cut-ghost" />}
      </div>
      {/* The knife visibly travels ACROSS the strip on each cut — tip-leading,
          right→left — so the child SEES it slice the blocks into pieces. Lives
          OUTSIDE .plank-body (which clips) so the whole knife shows above the
          strip; keyed by sliceTick so every fresh cut re-triggers the sweep. */}
      {!faded && sliceTick > 0 && (
        <div key={`slice-${sliceTick}`} className="plank-slice" style={{ "--plankW": `${totalW}px` }} aria-hidden="true">
          <span className="slice-blade"><Knife n={m} dragging scale={0.62} /></span>
        </div>
      )}
    </div>
  );
}
