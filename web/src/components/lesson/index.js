// The shared lesson-layout library. Import everything a lesson needs to build its
// page chrome + play area from one place:
//   import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, HintRail,
//            RailInstruction, RailReadAloud } from "./components/lesson";
export { default as LessonShell } from "./LessonShell.jsx";
export { default as LessonBoard } from "./LessonBoard.jsx";
export { default as AnswerBar } from "./AnswerBar.jsx";
export { default as TutorRibbon } from "./TutorRibbon.jsx";
export { default as HintRail } from "./HintRail.jsx";
// Wave-F: the rail-as-instruction model (replaces the deleted goal banner).
export { default as RailInstruction } from "./RailInstruction.jsx";
export { default as RailReadAloud } from "./RailReadAloud.jsx";
// The ONE free-form drawing / "show your work" surface (wraps BlankSlate). Use this
// everywhere a scratch/drawing space appears — never hand-roll a .bs-surface wrapper.
export { default as ScratchSurface } from "./ScratchSurface.jsx";
// The ONE "undo this split" chip. Render it above any knife-cut target so a cut
// can be put back together. Lives wherever a knife is used (den, num, r4, …).
export { default as UndoSplitButton } from "./UndoSplitButton.jsx";
