import React from "react";

/**
 * The ONE shared "undo this split" affordance. Wherever a knife cuts something,
 * this chip appears ABOVE the thing being split so the child can put it back
 * together after a cut has been applied.
 *
 * It positions itself absolutely against its nearest positioned ancestor, so the
 * element framing the split target must be `position: relative` (the shared
 * `.eq-cut-target` already is — see knife.css). Render this as a child of that
 * frame and it will float just above it.
 *
 *   <div className="eq-cut-target" style={{ position: "relative" }}>
 *     <UndoSplitButton show={isCut} onUndo={putBackTogether} />
 *     …the strip / ruler / box being cut…
 *   </div>
 */
export default function UndoSplitButton({
  show = true,
  onUndo,
  label = "put it back together",
  disabled = false,
}) {
  if (!show) return null;
  return (
    <button
      type="button"
      className="undo-split"
      title={label}
      disabled={disabled}
      // Knife sites listen for pointer-down to start a drag — keep the click here.
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); if (!disabled) onUndo && onUndo(); }}
    >
      <span aria-hidden="true">↺</span> {label}
    </button>
  );
}
