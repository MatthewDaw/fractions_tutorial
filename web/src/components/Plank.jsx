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
            {/* Every block reads the UNIT (1/D), never the running count — the
                child must count the blocks up themselves, not read a tally. */}
            <span className="piece-lab" style={{ color: labColor, fontSize: labSize }}>1/{D}</span>
            {!faded && i < pieces - 1 && <span className="cut-tick top" style={{ background: cutLine }} />}
            {!faded && i < pieces - 1 && <span className="cut-tick bot" style={{ background: cutLine }} />}
          </div>
        ))}
        <div key={sliceTick} className={!faded && sliceTick > 0 ? "sweep" : ""} />
        {hoverCut && <div className="cut-ghost" />}
      </div>
    </div>
  );
}
