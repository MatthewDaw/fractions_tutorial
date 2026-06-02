// FitStage.jsx — a shared "everything must always fit" wrapper.
//
// THE RULE (user, locked): "Everything must always fit in the screen no matter
// what." The app already scales the whole 1280×800 stage to the viewport (see
// Shell.useStageFit), so the OUTER fit is solved. What this component solves is
// the INNER fit: a lesson's manipulative (a baking tray spun to 6×4, a 9×9 build,
// a tall 11/4 stack, a big skip-line) can be larger than the FIXED proof-zone
// rectangle it lives in (e.g. m2.css's .m2-fz-stage is 800×348 with
// overflow:hidden). When that happens the content is CLIPPED top/bottom (the
// confirmed AppM2 "Bind" bug: the rotated tray's top and bottom get cut off).
//
// FitStage measures its CONTENT's natural (unscaled) size against the AVAILABLE
// box it's mounted in, and applies a single uniform downscale
// `transform: scale(s)` (s ≤ 1, origin = center) so the content always shrinks to
// fit — it NEVER clips, and it never scales UP past 1 (so a small manipulative
// keeps its designed size). A ResizeObserver re-fits on any size change (the
// tray spinning, rows being added, the viewport resizing, fonts settling).
//
// This unifies the bespoke per-lesson fit hacks: AppM1's PlateGroup already does a
// one-off ResizeObserver `--mg-plate` scale; new lessons can instead just wrap
// their stage content in <FitStage>…</FitStage> and stop hand-tuning sizes.
//
// USAGE (per-lesson agents only import + wrap; do not re-implement):
//
//   import FitStage from "../components/FitStage.jsx";
//   …
//   <div className="m2-fz-stage">
//     <FitStage className="m2-fz-canvas m2-fz-canvas-center">
//       <BakingTray rows={effRows} cols={effCols} … />
//       <div className="m2-cap">…</div>
//     </FitStage>
//   </div>
//
// Notes for integrators:
//   • Put FitStage as the direct child of the FIXED-SIZE zone (the box with the
//     border + overflow:hidden). FitStage fills that box (width/height:100%) and
//     measures the box as the "available" area, the children as the "content".
//   • The children render at their natural size, then get visually scaled. Layout
//     space is reserved by FitStage itself (it fills the zone), so scaling the
//     content does not disturb anything outside the zone.
//   • Interactions still work: pointer/drag math that reads getBoundingClientRect
//     (e.g. PlateGroup, BakingTray taps) is unaffected because the rects already
//     reflect the applied transform.
//   • `extraScale` (default 0.98) leaves a hair of breathing room so a 1px
//     rounding never re-clips at the exact fit boundary.
import React, { useRef, useState, useLayoutEffect, useCallback } from "react";
import "../styles/fitstage.css";

export default function FitStage({
  children,
  className = "",
  // Never scale content larger than its natural size (a small manipulative keeps
  // its designed dimensions). Set >1 only if a lesson explicitly wants upscaling.
  maxScale = 1,
  // A hair of slack so sub-pixel rounding never re-clips at the fit boundary.
  extraScale = 0.98,
  // Horizontal | vertical fit: by default we fit BOTH axes (contain). A lesson
  // whose zone is wide but short and whose content only overflows vertically can
  // pass axis="y" to ignore width, etc. "both" is the safe default.
  axis = "both",
  style,
  ...rest
}) {
  const boxRef = useRef(null);     // the available area (fills the parent zone)
  const contentRef = useRef(null); // the natural-size content we scale
  const [scale, setScale] = useState(1);

  const measure = useCallback(() => {
    const box = boxRef.current;
    const content = contentRef.current;
    if (!box || !content) return;
    const availW = box.clientWidth;
    const availH = box.clientHeight;
    // scrollWidth/Height = the content's natural overflowing size, independent of
    // the transform we apply (the transform doesn't change scroll metrics).
    const natW = content.scrollWidth;
    const natH = content.scrollHeight;
    if (!availW || !availH || !natW || !natH) return;
    const sX = availW / natW;
    const sY = availH / natH;
    let s;
    if (axis === "x") s = sX;
    else if (axis === "y") s = sY;
    else s = Math.min(sX, sY);
    s = Math.min(maxScale, s * extraScale);
    // Clamp to a sane floor so a pathological content size never collapses to 0.
    s = Math.max(0.2, s);
    // Avoid thrashing on sub-pixel deltas.
    setScale((prev) => (Math.abs(prev - s) > 0.002 ? s : prev));
  }, [axis, maxScale, extraScale]);

  useLayoutEffect(() => {
    measure();
    const RO = typeof ResizeObserver !== "undefined" ? ResizeObserver : null;
    let ro = null;
    if (RO) {
      ro = new RO(() => measure());
      if (boxRef.current) ro.observe(boxRef.current);
      if (contentRef.current) ro.observe(contentRef.current);
    }
    window.addEventListener("resize", measure);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return (
    <div ref={boxRef} className={"fit-stage" + (className ? " " + className : "")} style={style} {...rest}>
      <div
        ref={contentRef}
        className="fit-stage-content"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
