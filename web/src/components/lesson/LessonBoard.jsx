// LessonBoard — the ONE play-area layout, replacing the seven hand-rolled
// "four fixed rectangles" layouts. See styles/lesson-board.css for the full why.
//
// The deterministic guarantee: stage and answer live in SEPARATE CSS-grid tracks,
// so the answer bar can never overlap the interaction area — the bug this library
// was built to kill, fixed once, everywhere.
//
// Two variants:
//   "split" (default) — stage (top-left) · rail (top-right) · answer (bottom-left)
//                       · tutor (bottom-right). Pass rail={null} and the stage
//                       spans the full width (a rail-less Workbench stage).
//   "wide"            — a full-width word-problem column (`content`) + a narrow
//                       tutor column. Used by the Applied/Words stages.
//
// Sizing props map to CSS custom properties (all optional; sensible defaults live
// in the stylesheet): railWidth, footHeight, tutorWidth, colGap, rowGap, marginTop.
import React from "react";
import "../../styles/lesson-board.css";

const px = (v) => (typeof v === "number" ? `${v}px` : v);

export default function LessonBoard({
  variant = "split",
  stage, rail, answer, tutor, content,
  railWidth, footHeight, tutorWidth, colGap, rowGap, marginTop,
  className = "",
  stageClassName = "",
  style,
}) {
  const vars = {
    ...(railWidth != null ? { "--lboard-rail-w": px(railWidth) } : null),
    ...(footHeight != null ? { "--lboard-foot-h": px(footHeight) } : null),
    ...(tutorWidth != null ? { "--lboard-tutor-w": px(tutorWidth) } : null),
    ...(colGap != null ? { "--lboard-col-gap": px(colGap) } : null),
    ...(rowGap != null ? { "--lboard-row-gap": px(rowGap) } : null),
    ...(marginTop != null ? { "--lboard-mt": px(marginTop) } : null),
    ...style,
  };

  if (variant === "wide") {
    return (
      <div className={"lboard is-wide" + (className ? " " + className : "")} style={vars}>
        <div className="lboard-wp">{content}</div>
        <div className="lboard-tutor">{tutor}</div>
      </div>
    );
  }

  const norail = rail == null;
  return (
    <div className={"lboard" + (norail ? " is-norail" : "") + (className ? " " + className : "")} style={vars}>
      <div className={"lboard-stage" + (stageClassName ? " " + stageClassName : "")}>{stage}</div>
      {!norail && <div className="lboard-rail">{rail}</div>}
      <div className="lboard-answer">{answer}</div>
      <div className="lboard-tutor">{tutor}</div>
    </div>
  );
}
