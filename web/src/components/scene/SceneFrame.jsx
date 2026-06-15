// SceneFrame.jsx — shared "backdrop surface" chrome for every standalone scene
// (Settings, Title, Intro, Mom, Review …). It draws the vintage-print page
// backdrop the wireframe standardised on:
//   • .paper-fill   — cream paper + foxing noise (the BackdropSurface)
//   • .foxing       — age-spot blotches
//   • .frame        — engraved double border
//   • 4 .corner     — woodcut filigree (tl/tr/bl/br)
//
// This component is DATA-ONLY chrome: it renders no interactive logic. The
// visual styling lives in the consuming scene's stylesheet, scoped under the
// scene class (e.g. `.settings-scene .paper-fill`), so adopting SceneFrame is a
// pure markup-dedup — no global CSS is introduced and no other scene's styles
// are touched. A scene wraps its body in <SceneFrame className="settings-scene">.
//
// `ready` toggles the `.ready` class that the scene's reveal-stagger CSS keys
// off of (see useRevealStagger). Extra props (data-vox-speaker, etc.) pass
// straight through to the root element.

/* engraved corner filigree (woodcut line style). The 4 corners are identical;
   CSS flips them via .corner.tr/.bl/.br transforms. */
export function SceneCorner() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <path d="M2 28 L2 9 Q2 2 9 2 L28 2" fill="none" stroke="#1c1612" strokeWidth="1.8" />
      <path d="M6 28 L6 12 Q6 6 12 6 L28 6" fill="none" stroke="#a32a22" strokeWidth="1.2" opacity="0.7" />
      <circle cx="6" cy="6" r="2.4" fill="#a32a22" />
    </svg>
  );
}

/* the cream paper backdrop (paper-fill + foxing). Split out so a scene can drop
   in just the surface without the frame if it ever wants to. */
export function BackdropSurface() {
  return (
    <>
      <div className="paper-fill" style={{ position: "absolute", inset: 0 }} />
      <div className="foxing" />
    </>
  );
}

export default function SceneFrame({ className = "", ready = false, children, ...rest }) {
  return (
    <div className={"scene " + className + (ready ? " ready" : "")} {...rest}>
      <BackdropSurface />
      <div className="frame" />
      <div className="corner tl"><SceneCorner /></div>
      <div className="corner tr"><SceneCorner /></div>
      <div className="corner bl"><SceneCorner /></div>
      <div className="corner br"><SceneCorner /></div>
      {children}
    </div>
  );
}
