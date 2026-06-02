// ScratchCanvas.jsx — a free-form drawing layer for Babushka's Room. The story
// problems are open-ended, so the child gets a real scratch space to work things
// out (finger / stylus / mouse) right over the prop + ruler. The FINAL answer
// still goes in the HUD answer boxes — this is only for showing work.
//
// This is now a THIN WRAPPER around the shared <BlankSlate> (web/src/components/
// BlankSlate.jsx). It passes the room's existing .mr-* class names so the look
// and behavior in the kitchen are byte-for-byte unchanged, while every lesson
// reuses the same blank-slate input path. Mount with a `key` that changes per
// problem so it resets each time (BlankSlate has no internal reset).
import BlankSlate from "../BlankSlate.jsx";

const MR_CLASSES = {
  canvas: "mr-scratch",
  tools: "mr-tools",
  tool: "mr-tool",
  toolSep: "mr-tool-sep",
  toolClear: "mr-tool-clear",
  hint: "mr-scratch-hint",
};

export default function ScratchCanvas() {
  return (
    <BlankSlate
      classNames={MR_CLASSES}
      hint="scratch space — show your work here ✎"
      ariaLabel="scratch space for working out the problem"
    />
  );
}
