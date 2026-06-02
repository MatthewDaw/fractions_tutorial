// Plank.jsx — a strip of dough (a fraction bar). Its length encodes its value
// and never changes; a knife only adds more, equal cut-lines. Each block is
// labelled with the running count (1/6, 2/6, 3/6 …) so the child can count.
//
// Props: baseNum, baseDen, m, unit, tone ('red'|'ink'), sliceTick, matched,
//        hoverCut, bodyRef
const Plank = ({ baseNum, baseDen, m, unit, tone = "red", sliceTick = 0, matched = false, hoverCut = false, bodyRef = null }) => {
  const value = baseNum / baseDen;
  const totalW = value * unit;
  const pieces = baseNum * m;
  const pieceW = totalW / pieces;
  const D = baseDen * m;
  const isRed = tone === "red";

  const fillBase = isRed ? "var(--red)" : "var(--paper-1)";
  const cutLine = isRed ? "var(--red-deep)" : "var(--ink)";
  const labColor = isRed ? "var(--paper-1)" : "var(--ink)";
  const labSize = pieceW < 40 ? 11 : pieceW < 58 ? 13 : 15;

  const hatch = isRed
    ? "repeating-linear-gradient(45deg, rgba(40,12,8,0.20) 0 1px, transparent 1px 6px)"
    : "repeating-linear-gradient(45deg, rgba(28,22,18,0.28) 0 1px, transparent 1px 6px)," +
      "repeating-linear-gradient(-45deg, rgba(28,22,18,0.28) 0 1px, transparent 1px 6px)";

  return (
    <div className={`plank ${matched ? "is-matched" : ""}`} style={{ width: totalW }}>
      <div className="plank-body" ref={bodyRef}>
        {Array.from({ length: pieces }).map((_, i) => (
          <div key={i} className="piece" style={{
            width: pieceW, background: fillBase,
            borderRight: i < pieces - 1 ? `1.5px solid ${cutLine}` : "none",
          }}>
            <div className="piece-hatch" style={{ backgroundImage: hatch }} />
            <span className="piece-lab" style={{ color: labColor, fontSize: labSize }}>{i + 1}/{D}</span>
            {i < pieces - 1 && <span className="cut-tick top" style={{ background: cutLine }} />}
            {i < pieces - 1 && <span className="cut-tick bot" style={{ background: cutLine }} />}
          </div>
        ))}
        <div key={sliceTick} className={sliceTick > 0 ? "sweep" : ""} />
        {hoverCut && <div className="cut-ghost" />}
      </div>
    </div>
  );
};
window.Plank = Plank;
