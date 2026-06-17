// LessonShell — the ONE page chrome shared by every lesson. Renders:
//   <div className="page" data-vox-speaker="cook">
//     <div className="foxing" />
//     <div className="topbar">… num-mark · tag · title · controls …</div>
//     <StageTabs … />
//     {children}              ← usually a <LessonBoard>
//     {extra}
//   </div>
//
// WAVE-F SHELL DECISIONS (mirror the wireframe's three chrome choices):
//   (A) NO persistent top goal banner. The wireframe deleted it
//       (LessonScreen.jsx:129-131) and moved the task copy + Read-aloud into the
//       FIRST rail card. Rooms now stop passing `goal` and instead render a
//       <RailInstruction> as the first node of LessonBoard's `rail` slot.
//       For backward-compat during migration, an explicitly-passed `goal` node is
//       still honored — but migrated rooms MUST NOT pass it.
//   (B) The tutor ribbon is CORRECTIVE-ONLY (hidden by default; shown on a
//       corrective/feedback status). Enforced in TutorRibbon.jsx + lesson.css.
//   (C) The 4-zone LessonBoard grid is unchanged (it already matches).
//
// Props:
//   no, tag, title          — header identity ("Lesson {no} · {tag}", big title)
//   onBack, onRewatchIntro  — optional header controls (rendered only if provided)
//   onReset, resetTitle     — the ⟲ control (title defaults to "Start over")
//   speaker                 — data-vox-speaker on .page (default "cook")
//   tabs                    — { stages, current, onSelect, label } for <StageTabs>
//   band                    — DEPRECATED. The wireframe has no QuestionBand; pass
//                             null (rooms fold the question into the rail/stage).
//   goal                    — DEPRECATED back-compat escape hatch (the old
//                             <LessonGoal> node). Migrated rooms pass nothing and
//                             use <RailInstruction> in the rail instead.
//   children                — the stage body (usually a <LessonBoard>)
//   extra                   — anything mounted after the body (drag ghosts, etc.)
import React from "react";
import StageTabs from "../StageTabs.jsx";
import SettingsButton from "../../SettingsButton.jsx";
import "../../styles/lesson-board.css";

/**
 * LessonShell — canonical page chrome contract (Foundation F2).
 *
 * Identity (header): `№{no}` badge, "Lesson {no} · {tag}", big {title}. These
 * come straight from the lesson registry (`web/src/lessons/<id>.js`):
 *   no = L.num.replace('№','')   tag = L.tag   title = L.title
 *
 * Tabs contract (the stage strip — fed to <StageTabs>):
 *   tabs: {
 *     stages:  [{ key, badge, title, sub }],   // one item per stage, IN ORDER
 *     current: <key of the active stage>,
 *     onSelect: (key) => void,                  // jump to a stage
 *     label?:  <aria-label for the tablist>
 *   }
 *   - key   · stable stage id; compared against `current`, passed back to onSelect
 *   - badge · the square glyph (number / letter / ★)
 *   - title · short stage NAME (uppercased by CSS)
 *   - sub   · one-line description (italic; also the hover tooltip)
 *   Canonical mapping FROM the registry's tabs (`L.tabs = [{n,name,sub}]`):
 *     stages = L.tabs.map(t => ({ key:t.n, badge:t.n, title:t.name, sub:t.sub }))
 *   "done" (stages before `current`) is derived from list order inside StageTabs;
 *   callers never compute completion themselves.
 *
 * band — DEPRECATED (no wireframe analog). Pass null. Kept only so un-migrated
 *        rooms still compile; migrated rooms omit it entirely.
 * goal — DEPRECATED back-compat escape hatch (the old <LessonGoal> node). The
 *        wireframe removed the goal banner; migrated rooms pass nothing and put
 *        the task copy in a <RailInstruction> at the top of the rail column.
 */
export default function LessonShell({
  no, tag, title,
  onBack, onRewatchIntro,
  onReset, resetTitle = "Start over",
  speaker = "cook",
  tabs, band, goal, children, extra,
}) {
  return (
    <div className="page" data-vox-speaker={speaker}>
      <div className="foxing" />

      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="num-mark">№{no}</span>
          <div>
            <div className="puzzle-tag">Lesson {no} · {tag}</div>
            <div className="puzzle-title">{title}</div>
          </div>
        </div>
        <div aria-hidden="true" />
        <div className="controls">
          {onBack && <button className="ctrl-btn" title="Back to the lesson map" onClick={onBack}>←</button>}
          {onRewatchIntro && (
            <button className="ctrl-btn" title="Rewatch the intro video" aria-label="Rewatch the intro video" onClick={onRewatchIntro}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M10 8.4 L16 12 L10 15.6 Z" fill="currentColor" /></svg>
            </button>
          )}
          <SettingsButton />
          {onReset && <button className="ctrl-btn" title={resetTitle} onClick={onReset}>⟲</button>}
        </div>
      </div>

      {tabs && (
        <StageTabs
          stages={tabs.stages}
          current={tabs.current}
          onSelect={tabs.onSelect}
          label={tabs.label}
        />
      )}

      {band}
      {goal}
      {children}
      {extra}
    </div>
  );
}
