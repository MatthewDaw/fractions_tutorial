// ScratchSurface.jsx — the ONE free-form drawing / "show your work" surface, used
// EVERYWHERE a lesson offers a place to draw or scratch. It wraps the shared
// <BlankSlate> drawing canvas in the standard bordered ".bs-surface" frame at a
// uniform size, so no lesson hand-rolls its own <div className="bs-surface"
// style={{…}}><BlankSlate/></div> (that duplication is what this replaces) — and so
// a "scratch space" is NEVER a dead static placeholder div again.
//
// Two variants:
//   "optional" (default) — ungraded scratch; never gates. Default hint "optional…".
//   "required"           — the mandatory "show your work" step: pass onInkChange and
//                          the caller gates "Next" on ink being present.
//
// Props:
//   variant     — "optional" | "required" (default "optional").
//   hint        — override the faint prompt text (defaults per variant).
//   onInkChange — (hasInk:boolean)=>void; only wired in the "required" variant.
//   ariaLabel   — a11y label for the canvas (defaults per variant).
//   slateKey    — React key on the inner BlankSlate so it remounts/clears (e.g. per
//                 stage/problem). BlankSlate has no internal reset, so this is how a
//                 fresh stage gets a clean slate.
//   width/height — surface size in px (default 800×360, the split-board stage norm).
//   className   — extra classes appended to the .bs-surface wrapper.
//   style       — extra inline styles merged onto the wrapper (e.g. width:"100%").
import React from "react";
import BlankSlate from "../BlankSlate.jsx";

export default function ScratchSurface({
  variant = "optional",
  hint,
  onInkChange,
  ariaLabel,
  slateKey,
  width = "100%",
  height = "100%",
  className = "",
  style,
}) {
  const required = variant === "required";
  const defaultHint = required
    ? "show your work here — write anything you like ✎"
    : "optional — show your work here ✎";
  const defaultAria = required
    ? "show your work on a blank slate"
    : "optional: show your work on the blank slate";
  return (
    <div
      className={"bs-surface scratch-surface" + (className ? " " + className : "")}
      style={{ position: "relative", width, height, ...style }}
    >
      <BlankSlate
        key={slateKey}
        hint={hint ?? defaultHint}
        onInkChange={required ? onInkChange : undefined}
        ariaLabel={ariaLabel ?? defaultAria}
      />
    </div>
  );
}
