// FStrip.jsx — a sliced-dough fraction strip glyph: `den` equal pieces, the
// first `num` filled. Pure presentation (no interactive logic), shared so the
// title screen's hero equation and any other scene can render the same woodcut
// strip. Styling lives under the consuming scene's class (e.g.
// `.titlescreen .fstrip`), so this is markup-dedup only.
export default function FStrip({ num, den, width = 150, height = 48 }) {
  return (
    <div className="fstrip" style={{ width, height }}>
      {Array.from({ length: den }).map((_, i) => (
        <div key={i} className={"pc " + (i < num ? "on" : "off")} />
      ))}
    </div>
  );
}
