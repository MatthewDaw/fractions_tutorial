/* showWork.js — the ONE "show your work" scratch surface, shared by every
   show-your-work step (and the optional word-problem scratch). The BlankSlate
   sheet (canvas + the pen/red/eraser/undo/clear tool strip + the faint hint) was
   previously copy-pasted into ~9 screens, each wrapped differently (.play,
   .wp-setup, FitStage, fixed-px boxes) — which is exactly why they each filled
   the stage incorrectly. Now the markup lives ONCE here and ALWAYS renders as a
   full-bleed sheet that fills the whole stage (.showwork-sheet → 100% × 100%).

   Usage in a screen data module:
     import { showWork } from "../showWork.js";
     stageHTML: showWork(),                       // default hint
     stageHTML: showWork("optional — show your work here ✎"),  // word-problem variant
*/

// the tool strip — identical on every show-work surface, so it lives here once
const TOOLS = `
      <div class="bs-tools">
        <button type="button" class="bs-tool on" title="Pencil" aria-pressed="true">
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 15 L4 11 L12 3 L15 6 L7 14 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /><line x1="11" y1="4" x2="14" y2="7" stroke="currentColor" stroke-width="1.6" /></svg>
        </button>
        <button type="button" class="bs-tool" title="Red pen" aria-pressed="false">
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 15 L4 11 L12 3 L15 6 L7 14 Z" fill="none" stroke="var(--red)" stroke-width="1.8" stroke-linejoin="round" /></svg>
        </button>
        <button type="button" class="bs-tool" title="Eraser" aria-pressed="false">
          <svg width="18" height="18" viewBox="0 0 18 18"><rect x="3" y="9" width="9" height="6" rx="1.5" transform="rotate(-32 7 12)" fill="none" stroke="currentColor" stroke-width="1.6" /></svg>
        </button>
        <span class="bs-tool-sep"></span>
        <button type="button" class="bs-tool" title="Undo">
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M6 5 L3 8 L6 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" /><path d="M3 8 H11 a4 4 0 0 1 0 8 H7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
        </button>
        <button type="button" class="bs-tool bs-tool-clear" title="Clear all">clear</button>
      </div>`;

export const SHOW_WORK_HINT = "show your work here — write anything you like ✎";

/* The full-bleed scratch sheet. Pass a custom hint for the optional/word-problem
   variant; omit it for the standard "Show Your Work" step. */
export function showWork(hint = SHOW_WORK_HINT) {
  return `
    <div class="bs-surface showwork-sheet">
      <canvas class="bs-canvas" aria-label="show your work on a blank slate"></canvas>${TOOLS}
      <div class="bs-hint">${hint}</div>
    </div>`;
}
