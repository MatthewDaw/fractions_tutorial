export const meta = {
  name: 'ui-bug-fix',
  description: 'Fix every confirmed UI bug — one agent per file (no shared files → no edit conflicts) — then re-screenshot every affected page to verify the three rules hold',
  phases: [
    { title: 'Fix', detail: 'one agent per file: apply all fixes rooted in that file' },
    { title: 'Verify', detail: 'one agent per affected page: re-shoot + confirm no overlaps / no regressions' },
  ],
}

const REPORT = 'web/.ui-sweep/REPORT.md'
const SHOTS = 'web/.ui-sweep/shots'

// Shared layout contract every fix agent must respect.
const CONTRACT = `SHARED LAYOUT CONTRACT (all fix agents obey this):
- The stage is a FIXED 1280x800 box (id #stage), scaled to fit. There is NO scrolling — this is a kids' tablet game. Everything must FIT inside 800px tall and 1280px wide, and nothing may overlap.
- The lesson page (.page) is a vertical flex column: topbar -> goal banner -> stage/beat selector -> .play (the flex-grow middle: .diagram on the left + .rail on the right) -> .hud (Cook + equation/Slate + marks) -> Check button row.
- THREE GOVERNING RULES (never violate, never introduce): (1) no overlapping text; (2) no text overlapping the tutor characters (Cook/Babushka/Grandpa); (3) no overlapping shapes (blocks, bars, panels, boxes, frames, trays, cards, buttons, diagram border) — intentional faded/ghost layers excepted.
- COORDINATION TARGET (Issue 1): the dominant root cause is the stacked handwriting Slate being too TALL, which inflates the fixed-height HUD and starves/overflows the .play row. The slate.css agent caps the cell height (~84-96px per cell, matching the 94px InkPad cap) and trims width; the lesson.css agent independently clips the diagram and disciplines the rail so any residual can't paint over neighbors. Both must hold for the band to fit — make your change assuming the OTHER file's change also lands.
- Make MINIMAL, surgical edits. Do not restyle beyond the fix. Preserve every page currently listed as clean in the report. Do not introduce new overlaps.`

// ---- one agent per file ----
const FILES = [
  {
    file: 'web/src/styles/slate.css',
    label: 'fix:slate.css',
    directive: `Fix Issue 1 (the user's reported write-area bug) AT ITS CORE: the handwriting Slate cell has no height cap, so the stacked fraction Slate (.slate.slate-fraction is flex-direction:column) is ~253-308px tall and blows the vertical budget.
- Cap the Slate cell HEIGHT and trim WIDTH so a stacked fraction (top cell + bar + bottom cell + slot labels) is short enough to live in the HUD/rail band without pushing into or off the stage. Target each fraction-stacked cell to ~84-96px tall (the InkPad cap is 94px) and ~108-120px wide. Keep tap targets comfortable for a child; keep the committed-digit button, the recognizer "I read N" guess chip, and the clear (x) button all readable and non-overlapping inside the smaller cell.
- The cell is used in BOTH layouts: 'fraction' (stacked) and 'row' (side-by-side whole-number boxes). Make sure your cap does not crop digits in either. If a global cap is too blunt, scope it so the stacked fraction shrinks while row cells stay usable.
- Read web/src/components/Slate.jsx to see the markup (.slate, .slate-fraction, .slate-slot, .slate-cell, .slate-bar, .slate-canvas, .slate-committed-digit, .slate-guess, .slate-slot-lab) before editing slate.css. Inspect before-screenshots in ${SHOTS}/ (r1-s2-bind.png, r4-s2.png, r2-beat3.png, r5-s2.png) to see the oversized/overflowing Slate.`,
  },
  {
    file: 'web/src/styles/lesson.css',
    label: 'fix:lesson.css',
    directive: `Fix Issues 1, 2, 3, and 4 — all rooted in this file. Read the report for each, view the cited before-screenshots, then:
- ISSUE 1 (overflow): the fixed-height .canvas (720x346, line ~104) inside .diagram (line ~93) can overflow its compressed .play track (line ~92) downward onto the HUD/write area. Clip it: add min-height:0 + overflow:hidden to .diagram (and/or a max-height discipline) so the diagram can never paint outside its track. Give .rail (line ~162) min-height:0 so R4's three-panel rail (with the now-shorter Slate) fits without spilling off the 800px bottom; only add overflow as a last resort (no scrollbars in a kids' game — prefer that the capped Slate from slate.css makes it fit). Assume slate.css caps the Slate height.
- ISSUE 2 (Cook+ribbon over blocks): the .cook-zone/.ribbon (lines ~189-192) sit in the HUD band that the overflowing diagram invaded. Clipping the diagram (Issue 1) is the primary fix; ADDITIONALLY guarantee the Cook+ribbon row can never share Y-space with .diagram (e.g. a margin-top gap on .hud, or a min-height floor so .play+.hud always sum within budget). The ribbon must sit clear of the blocks/number-line.
- ISSUE 3 (Cook art overhangs onto the Check button): .cook-stage (line ~190) is position:absolute; bottom:-18px; the ~157px art overhangs its 92px .cook-zone (line ~189) down onto the .marks/.check row (lines ~201-202). Give clearance so the figure never touches the Check button — e.g. set bottom:0 and grow .cook-zone, add margin to .marks, and/or clip. Verify the Cook still reads well.
- ISSUE 4 (.joinbtn mispositioned): .joinbtn (line ~157) declares position:absolute; z-index:22 and THEN 'all: unset' which RESETS position->static and z-index->auto, so the inline left/top from JSX are ignored and the button flows to the container's top-left. FIX: move 'all: unset' to the FRONT of the rule (before position/z-index) — or replace it with explicit per-property resets — so the absolute positioning + inline top/left win. This affects R5 (bug), and ALSO R1 "Count them up" and R2/R3 "Join the strips" — after the fix those become truly absolute at their JSX-provided left/top; confirm via the report's coordinates that none lands on a block/tag. (R1's button JSX: AppR1.jsx:501 left=ORIGIN+stackW(2)+40 top=HOME.A.y+22; R5: AppR5.jsx:512; R2/R3: LessonUnlikeDen.jsx:789.)
Before-screenshots to view: ${SHOTS}/r1-s1-manipulate.png, r1-s1-merged.png, r1-s2-bind.png, r1-s4-numbers.png, r4-s2.png, r5-s1.png, r5-s3.png.`,
  },
  {
    file: 'web/src/styles/lesson-unlike.css',
    label: 'fix:lesson-unlike.css',
    directive: `Fix Issue 1's word-problem variant: .lu-wp-mount (lines ~77-85) uses position:absolute; inset:0 and centers an over-tall <WordProblem> recipe card inside the un-clipped 346px canvas, so the card overflows UP into the goal banner and the answer block overflows DOWN below the diagram frame (seen on r2-beat5, r3-beat5).
- Replace the inset:0 dead-centering with a top-aligned, height-clamped layout (e.g. align to top with a sane max-height and internal spacing) and add overflow:hidden so the card + its embedded Slate stay inside the canvas/diagram. Coordinate with the capped Slate (slate.css) — assume the embedded answer Slate is now shorter.
- Also scan this file for any other beat layouts (.lu-* ) that the report ties to Issue 1 around the picker/worksheet/cross visuals and the rail; only touch what's needed to stop overlaps. View ${SHOTS}/r2-beat5.png and r3-beat5.png (word-problem) and r2-beat2.png/r2-beat3.png/r2-beat4.png (block+write beats).`,
  },
  {
    file: 'web/src/styles/r4.css',
    label: 'fix:r4.css',
    directive: `Fix Issue 5: .r4-valnote (line ~61, position:absolute; top:78px relative to .r4-bar) lands in only a ~10px gap between the bar bottom and the number line, so the ruler runs THROUGH the gray italic note "same amount: 8/12 of a tray".
- Reposition the note so it has clear space — move it BELOW the number line + its labels (increase top past LINE_Y and the label row) or ABOVE the bar — whichever keeps it clear of both the bar and the ruler/labels and stays on-stage. The relevant geometry constants live in web/src/AppR4.jsx:40 (BAR_Y=150, LINE_Y=232) — read them but fix in r4.css. View ${SHOTS}/r4-s1-fused.png. Don't disturb the other R4 stages.`,
  },
  {
    file: 'web/src/BackgroundMusic.jsx',
    label: 'fix:BackgroundMusic.jsx',
    directive: `Fix Issue 6 (non-visual, every page): the audio fade ramp drives HTMLMediaElement.volume out of [0,1] -> "IndexSizeError: Failed to set the 'volume' property ... outside the range [0,1]", and one render threw "BASE_VOL is not defined".
- Clamp every assignment to .volume with Math.max(0, Math.min(1, v)) (add a small clamp helper if it's set in multiple places). Find and fix the BASE_VOL reference (define/scope it correctly, or replace with the intended constant). Do NOT change the musical behavior (fade timings, scene logic) beyond making the volume safe and BASE_VOL defined. Read the whole file first.`,
  },
]

const FIX_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['file', 'changes', 'issuesFixed'],
  properties: {
    file: { type: 'string' },
    changes: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['selectorOrLocation', 'summary'], properties: {
      selectorOrLocation: { type: 'string' }, summary: { type: 'string', description: 'what changed and why' } } } },
    issuesFixed: { type: 'array', items: { type: 'string' }, description: 'e.g. ["Issue 1","Issue 4"]' },
    crossFileAssumptions: { type: 'string', description: 'what you assumed another file would do' },
    regressionRisks: { type: 'string', description: 'pages that share this rule and must be re-checked' },
  },
}

phase('Fix')
const fixResults = (await parallel(FILES.map((f) => () => agent(
  `You are fixing UI bugs in EXACTLY ONE file: ${f.file}. You own this file; no other agent will touch it. Do not edit any other file (you may READ others for context).

First READ the full report: ${REPORT} — it has every issue, root cause (file:line), and recommended fix. Then READ your file and the markup/screenshots referenced below.

${CONTRACT}

YOUR FILE'S FIXES:
${f.directive}

Apply the fixes with the Edit tool. Keep changes minimal and well-commented in the house style. When done, return structured output describing exactly what you changed. Do NOT run screenshots (other files are being edited in parallel; verification is a separate phase).`,
  { label: f.label, phase: 'Fix', agentType: 'general-purpose', schema: FIX_SCHEMA }
)))).filter(Boolean)

log(`Fixed ${fixResults.length}/${FILES.length} files`)

// ---- one agent per affected page: re-shoot + verify ----
// Each page already has a spec at web/.ui-sweep/specs/<label>.json from the sweep.
const AFFECTED = [
  ['mom', 'Issue 1a: write/answer area must not overlap the prop/board.'],
  ['r1-s1-manipulate', 'Issue 2 (KNOWN): Cook+ribbon must NOT cover the blocks/5-7 tag/number-line; Issue 4: "Count them up" joinbtn must sit clear, not over a stack.'],
  ['r1-s1-merged', 'Issue 2 (KNOWN): ribbon must not overprint the merged stack/tag.'],
  ['r1-s2-bind', 'Issue 3: Cook figure must not touch the Check button; write Slate must be cleanly placed (below/clear of the block space).'],
  ['r1-s4-numbers', 'Issue 3: Cook must not touch Check; equation/ghost/Slate clear.'],
  ['r1-s5-words', 'Issue 1: word-problem card + answer Slate must be fully on-stage, not jammed at the bottom edge.'],
  ['r2-beat2', 'Issue 1: write area vs diagram; Check must not cover the "New problem" button.'],
  ['r2-beat3', 'Issue 1: write cell must not ride up through the diagram border.'],
  ['r2-beat4', 'Issue 1: write cell vs diagram.'],
  ['r2-beat5', 'Issue 1 word-problem: recipe card must not overflow up into the goal banner or below the frame.'],
  ['r3-beat2', 'Issue 1: Check must not cover the "New problem" button; write area clear.'],
  ['r3-beat4', 'Issue 1: write cell vs diagram.'],
  ['r3-beat5', 'Issue 1 word-problem: recipe card contained; minor caption issue resolved.'],
  ['r4-s2', 'Issue 1b: rail + Slate must fit within 800px; Check must not paint over the Slate.'],
  ['r4-s3', 'Issue 1b: rail/Slate on-stage; factor picker + equation + Slate no overlap.'],
  ['r4-s4', 'Issue 1b: rail/Slate on-stage; Check not over Slate.'],
  ['r4-s5', 'Issue 1 word-problem: card + Slate contained on-stage.'],
  ['r4-s1-fused', 'Issue 5: the value-note must be clear of the number-line ruler.'],
  ['r5-s1', 'Issue 4: the group/join button must sit below the column, not over the blocks or "9/7" tag.'],
  ['r5-s2', 'Issue 1 + Issue 4: write area + join button placement.'],
  ['r5-s3', 'Issue 1/2 (blocker): ghost board, picker, Slate, Cook+ribbon — no overlaps.'],
  // regression controls — must STAY clean:
  ['r1-s3-fade', 'REGRESSION CONTROL — was clean. Confirm still clean (no new overlaps from shared-CSS edits).'],
  ['r2-beat0', 'REGRESSION CONTROL — was clean. Confirm still clean.'],
  ['r3-beat3', 'REGRESSION CONTROL — was clean. Confirm still clean.'],
  ['r5-s5', 'REGRESSION CONTROL — was clean. Confirm still clean.'],
  ['r5-s1-grouped', 'REGRESSION CONTROL + Issue 4: grouped frame/tray fine AND the join button now correctly placed/clickable.'],
  ['title', 'REGRESSION CONTROL — confirm clean + audio console error is GONE (Issue 6).'],
]

const VERIFY_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['label', 'pass', 'rulesHold', 'symptomResolved', 'details', 'consoleErrors'],
  properties: {
    label: { type: 'string' },
    pass: { type: 'boolean', description: 'true if all three rules hold AND the known symptom is resolved AND no new overlap' },
    rulesHold: { type: 'object', additionalProperties: false, required: ['noOverlappingText', 'noTextOverCharacters', 'noOverlappingShapes'], properties: {
      noOverlappingText: { type: 'boolean' }, noTextOverCharacters: { type: 'boolean' }, noOverlappingShapes: { type: 'boolean' } } },
    symptomResolved: { type: 'boolean' },
    details: { type: 'string', description: 'what the re-shot screenshot shows; any residual overlap with region + likely file:rule' },
    consoleErrors: { type: 'array', items: { type: 'string' } },
  },
}

phase('Verify')
const verifyResults = (await parallel(AFFECTED.map(([label, symptom]) => () => agent(
  `Verify the UI fix on ONE page after a round of CSS/JS edits. The dev server is running at http://localhost:5173 (Vite HMR already has the new styles). Do NOT edit any source file — this is verification only.

PAGE: ${label}
WHAT TO CONFIRM: ${symptom}

1. Re-run the screenshot from the existing spec (Bash, from repo root):
   node web/scripts/shoot.mjs web/.ui-sweep/specs/${label}.json ${SHOTS}/${label}.after.png
2. Read ${SHOTS}/${label}.after.png. (You may also Read ${SHOTS}/${label}.png — the BEFORE — to compare.)
3. Judge against the THREE GOVERNING RULES at 1280x800: (1) no overlapping text; (2) no text overlapping the Cook/Babushka/Grandpa characters; (3) no overlapping shapes (blocks/bars/panels/boxes/frames/trays/cards/buttons/diagram border) — intentional faded/ghost layers are fine. Also confirm the specific symptom above is resolved and nothing spills off the 1280x800 stage.
4. If a residual overlap remains, pinpoint the region (approx coords) and the likely offending file + rule so it can be fixed.
Return structured output. pass=true only if all three rules hold, the symptom is resolved, and you see no new overlap. Report any console errors printed by the shoot command (the audio IndexSizeError should be GONE).`,
  { label: `verify:${label}`, phase: 'Verify', agentType: 'general-purpose', schema: VERIFY_SCHEMA }
)))).filter(Boolean)

const failed = verifyResults.filter((v) => v && !v.pass)
log(`Verify: ${verifyResults.length - failed.length}/${verifyResults.length} pass; ${failed.length} need attention`)

return { fixResults, verifyResults, failed }
