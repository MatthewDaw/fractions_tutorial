// Stack.jsx — a stack of same-size fraction pieces (a fraction bar laid sideways).
// Every piece is the SAME width (1/den of the whole), because this room's whole
// point is that the pieces already match. Each piece carries its running count
// label (1/7, 2/7 …) so the child can literally count the tops while the bottom
// (the denominator) never changes.
//
// Props: n (how many pieces), den (the locked denominator), unit (px per whole),
//        tone ('red'|'ink'), startIndex (label offset, for the merged stack),
//        mergeTick (bump to replay the merge sweep), lit, glow, bodyRef
const RED_HATCH = "repeating-linear-gradient(45deg, rgba(40,12,8,0.20) 0 1px, transparent 1px 6px)";
const INK_HATCH = "repeating-linear-gradient(45deg, rgba(28,22,18,0.28) 0 1px, transparent 1px 6px)," +
  "repeating-linear-gradient(-45deg, rgba(28,22,18,0.28) 0 1px, transparent 1px 6px)";

const Stack = ({ n, den, unit, tone = "red", startIndex = 0, mergeTick = 0, lit = true, glow = false, bodyRef = null }) => {
  const pieceW = unit / den;
  const isRed = tone === "red";
  const fillBase = isRed ? "var(--red)" : "var(--paper-1)";
  const cutLine = isRed ? "var(--red-deep)" : "var(--ink)";
  const labColor = isRed ? "var(--paper-1)" : "var(--ink)";
  const labSize = pieceW < 40 ? 11 : pieceW < 58 ? 13 : 15;
  const hatch = isRed ? RED_HATCH : INK_HATCH;

  return (
    <div className={`plank ${lit ? "lit" : ""} ${glow ? "is-matched" : ""}`} style={{ width: n * pieceW }}>
      <div className="plank-body" ref={bodyRef}>
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="piece" style={{
            width: pieceW, background: fillBase,
            borderRight: i < n - 1 ? `1.5px solid ${cutLine}` : "none",
          }}>
            <div className="piece-hatch" style={{ backgroundImage: hatch }} />
            <span className="piece-lab" style={{ color: labColor, fontSize: labSize }}>{startIndex + i + 1}/{den}</span>
            {i < n - 1 && <span className="cut-tick top" style={{ background: cutLine }} />}
            {i < n - 1 && <span className="cut-tick bot" style={{ background: cutLine }} />}
          </div>
        ))}
        <div key={mergeTick} className={mergeTick > 0 ? "sweep" : ""} />
      </div>
    </div>
  );
};
window.Stack = Stack;
window.RED_HATCH = RED_HATCH;
window.INK_HATCH = INK_HATCH;
