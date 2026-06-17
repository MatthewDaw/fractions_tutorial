// TutorRibbon — the ONE Cook + speech-ribbon block, replacing the identical
// .m1-fz-tutor / .m2-fz-tutor / … / .lu-tutor markup in every lesson.
//
// WAVE-F decision (B): the ribbon is CORRECTIVE-ONLY. The wireframe keeps the
// Cook standing silent by default and only shows his speech ribbon for a
// corrective/feedback hint (wf-shell.css:247-249). The instruction copy now
// lives in the rail (<RailInstruction>), so the resting state shows just the
// Cook — no ribbon.
//
// "Corrective" is driven by the status:
//   - status.tone === "warn"           → wrong answer / corrective hint  (SHOW)
//   - status.show === true             → caller forces the ribbon on     (SHOW)
//   - otherwise                        → idle; ribbon hidden             (HIDE)
// A room that wants the ribbon to stay visible for a non-warn beat passes
// `status={{ tone: "ok", text: "…", show: true }}` (or `forceShow`).
//
// Props:
//   cook      — Cook expression ("idle" | "think" | "cheer" | …). Default "idle".
//   status    — { tone, text, show? }: the ribbon copy; tone "warn" tints+shows it.
//   forceShow — keep the ribbon visible regardless of tone (e.g. a guided beat).
//   narrow    — reserved for callers that want the narrow word-problem tutor.
//   rosette   — show a Rosette beside the ribbon (a few lessons mark "solved" here).
//   stars     — Rosette count.
//   cookWidth — Cook sprite width (default 118).
import React from "react";
import Cook from "../Cook.jsx";
import Rosette from "../Rosette.jsx";

export default function TutorRibbon({
  cook = "idle",
  status,
  forceShow = false,
  narrow = false,
  rosette = false,
  stars = 0,
  cookWidth = 118,
}) {
  const tone = status?.tone;
  const text = status?.text;
  // Corrective-only: the ribbon is shown for a warn/corrective state, when the
  // caller explicitly opts in (status.show / forceShow), or when feedback text is
  // accompanied by a tone the room marks corrective. Idle by default.
  const show = forceShow || status?.show === true || tone === "warn";
  return (
    <div className={"ltutor" + (narrow ? " is-narrow" : "")}>
      <div className="cook-stage"><Cook expr={cook} width={cookWidth} /></div>
      <div className={"ribbon" + (tone === "warn" ? " warn" : "") + (show ? "" : " is-idle")}>{text}</div>
      {rosette && <div className="ltutor-rosette"><Rosette count={stars} /></div>}
    </div>
  );
}
