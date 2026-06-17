// HeaderLayout.jsx — shared scene header: a left identity block (kicker + title +
// bilingual subtitle) and a right control slot (e.g. a "Done" PrimaryButton).
// Mirrors the wireframe's `.st-head / .st-head-l` markup so every standalone
// scene wires its header identically.
//
// Pure presentation. The styling (`.st-head`, `.st-kicker`, `.st-h-title`, …)
// stays scoped under the consuming scene in its own stylesheet.
//
// Props:
//   kicker   — small uppercased label above the title (string or node)
//   title    — the big scene title
//   subCyr   — Cyrillic subtitle text
//   subLat   — Latin transliteration
//   right    — control node rendered on the right (e.g. <PrimaryButton>)
//   revealKicker / revealTitle — reveal-stagger class for kicker / title rows
export default function HeaderLayout({
  kicker,
  title,
  subCyr,
  subLat,
  right,
  revealKicker = "rv d1",
  revealTitle = "rv d2",
}) {
  return (
    <div className="st-head">
      <div className="st-head-l">
        <div className={"st-kicker " + revealKicker}><span className="st-k-dot" />{kicker}</div>
        <h1 className={"st-h-title " + revealTitle}>{title}</h1>
        {(subCyr || subLat) && (
          <div className={"st-h-sub " + revealTitle}>
            <span className="cyr">{subCyr}</span><span className="lat">{subLat}</span>
          </div>
        )}
      </div>
      {right}
    </div>
  );
}
