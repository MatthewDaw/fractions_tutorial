// TutorRibbon — the ONE Cook + speech-ribbon block, replacing the identical
// .m1-fz-tutor / .m2-fz-tutor / … / .lu-tutor markup in every lesson.
//
// Props:
//   cook      — Cook expression ("idle" | "think" | "cheer" | …). Default "idle".
//   status    — { tone, text }: the ribbon copy; tone "warn" tints it red.
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
  narrow = false,
  rosette = false,
  stars = 0,
  cookWidth = 118,
}) {
  const tone = status?.tone;
  const text = status?.text;
  return (
    <div className={"ltutor" + (narrow ? " is-narrow" : "")}>
      <div className="cook-stage"><Cook expr={cook} width={cookWidth} /></div>
      <div className={"ribbon" + (tone === "warn" ? " warn" : "")}>{text}</div>
      {rosette && <div className="ltutor-rosette"><Rosette count={stars} /></div>}
    </div>
  );
}
