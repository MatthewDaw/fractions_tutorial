// Stack.jsx — a stack of same-size fraction pieces (a fraction bar laid sideways).
// Every piece is the SAME width (1/den of the whole), because this room's whole
// point is that the pieces already match. Each piece carries its running count
// label (1/7, 2/7 …) so the child can literally count the tops while the bottom
// (the denominator) never changes.
//
// Props: n (how many pieces), den (the locked denominator), unit (px per whole),
//        mergeTick (bump to replay the merge sweep), glow (success pulse), bodyRef,
//        unitLabel (when true every piece reads the unit "1/den" instead of the
//          running count "1/den, 2/den, …" — the running count's last label is
//          the total, so unit labels make the child count rather than read it).
// Color comes from the piece's denominator via the central palette: in this room
// both stacks share the locked denominator, so they correctly render the SAME
// color — the visual echo of "the pieces already match". (`tone` is accepted for
// back-compat but ignored.)
import { denomColor, denomTextColor, denomTone, denomHatch, denomHatchSize } from "../denominatorColors.js";

export default function Stack({ n, den, unit, tone, mergeTick = 0, glow = false, bodyRef = null, unitLabel = false }) {
  const pieceW = unit / den;
  const fillBase = denomColor(den);
  const cutLine = denomTone(den, 0.55);
  const labColor = denomTextColor(den);
  const labSize = pieceW < 40 ? 11 : pieceW < 58 ? 13 : 15;
  const hatch = denomHatch(den);
  const hatchSize = denomHatchSize(den);

  return (
    <div className={`plank lit ${glow ? "is-matched" : ""}`} style={{ width: n * pieceW }}>
      <div className="plank-body" ref={bodyRef}>
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="piece" style={{
            width: pieceW, background: fillBase,
            borderRight: i < n - 1 ? `1.5px solid ${cutLine}` : "none",
          }}>
            <div className="piece-hatch" style={{ backgroundImage: hatch, backgroundSize: hatchSize }} />
            <span className="piece-lab" style={{ color: labColor, fontSize: labSize }}>{unitLabel ? 1 : i + 1}/{den}</span>
            {i < n - 1 && <span className="cut-tick top" style={{ background: cutLine }} />}
            {i < n - 1 && <span className="cut-tick bot" style={{ background: cutLine }} />}
          </div>
        ))}
        <div key={mergeTick} className={mergeTick > 0 ? "sweep" : ""} />
      </div>
    </div>
  );
}
