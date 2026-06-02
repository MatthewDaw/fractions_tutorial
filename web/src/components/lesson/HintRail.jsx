// HintRail — the common single-panel rail card. Renders the .panel (heading +
// italic hint + any extra children) that goes inside <LessonBoard>'s rail slot.
//
// For a stage with several stacked rail cards, skip this and pass a custom node as
// LessonBoard's `rail` (wrap the cards yourself); the rail slot accepts any node.
//
// Props:
//   heading   — the uppercase <h3> title (optional).
//   hint      — the italic hint line (optional; node or string).
//   children  — extra rail content rendered below the hint.
//   className — extra classes on the .panel.
import React from "react";

export default function HintRail({ heading, hint, children, className = "" }) {
  return (
    <div className={"panel" + (className ? " " + className : "")}>
      {heading && <h3>{heading}</h3>}
      {hint != null && <div className="hint">{hint}</div>}
      {children}
    </div>
  );
}
