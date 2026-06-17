// RailInstruction — the rail-as-instruction card (Wave-F shell decision A).
//
// The wireframe DELETED the persistent top goal banner and moved the task copy
// (plus the Read-aloud control) into the FIRST card of the right-hand rail
// column. This component is the app analog of that decision:
//
//   ┌─ rail column ─────────────┐
//   │ [▸ Read aloud]            │  ← compact pill, top-left  (RailReadAloud)
//   │ ┌───────────────────────┐ │
//   │ │ STEP                   │ │  ← heading (uppercased by CSS)
//   │ │ Cut each cell into 2…  │ │  ← the instruction copy (the old goal text)
//   │ └───────────────────────┘ │
//   │  …more rail cards…         │
//   └───────────────────────────┘
//
// Mirrors the wireframe's `READ_ALOUD + railHTML` (LessonScreen.jsx:150) and
// `wf-shell.css:251-257` (the rail speaker pill) + `.panel .hint` instruction.
//
// Props:
//   say        — voice fn; clicking Read-aloud calls say(voiceKey). Omit to hide
//                the Read-aloud pill (e.g. a stage with no narration).
//   speaking   — animate the speaker icon while narration plays.
//   voiceKey   — the line to speak; also the data-vox attribute for tap-to-read.
//   voxSpeaker — data-vox-speaker (which character voice reads it).
//   heading    — the uppercase panel <h3> title (default "Step").
//   children   — the instruction copy (the old goal text; may include <b>…</b>).
//   className  — extra class on the .panel.
//   panelClassName — alias for className (back-compat with HintRail callers).
//   extra      — additional rail content rendered BELOW the instruction card
//                (e.g. a tool rack, a lock card) — kept inside the same column.
import React from "react";
import RailReadAloud from "./RailReadAloud.jsx";

export default function RailInstruction({
  say, speaking, voiceKey, voxSpeaker,
  heading = "Step",
  children,
  className = "",
  panelClassName,
  extra,
}) {
  const panelCls = "panel wf-rail-instruction" + (className || panelClassName ? " " + (className || panelClassName) : "");
  return (
    <>
      {say && (
        <RailReadAloud say={say} speaking={speaking} voiceKey={voiceKey} />
      )}
      <div className={panelCls}>
        {heading && <h3>{heading}</h3>}
        {/* data-novox: the rail already carries its own Read-aloud pill
            (<RailReadAloud>), so the app-wide TapToRead layer must NOT inject a
            second, redundant speaker button INLINE inside the question text. */}
        <div className="hint" data-novox="" data-vox={voiceKey} data-vox-speaker={voxSpeaker}>
          {children}
        </div>
        {extra}
      </div>
    </>
  );
}
