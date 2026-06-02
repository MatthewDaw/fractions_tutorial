export const meta = {
  name: 'ui-bug-residual-fix',
  description: 'Converge the 5 residual UI overlaps — one agent per file, each iterating edit->screenshot->adjust on its own page(s) until the three rules hold',
  phases: [{ title: 'Converge', detail: 'one agent per file, iterate with screenshots to a clean page' }],
}

const SHOTS = 'web/.ui-sweep/shots'
const SPECS = 'web/.ui-sweep/specs'

const CONTRACT = `LAYOUT CONTRACT: the stage is a FIXED 1280x800 box, no scrolling (kids' tablet). THREE GOVERNING RULES — never violate: (1) no overlapping text; (2) no text overlapping the tutor characters (Cook/Babushka/Grandpa); (3) no overlapping shapes (blocks/bars/panels/boxes/frames/trays/cards/buttons/diagram border) — intentional faded/ghost layers excepted. Also: nothing may spill off the 1280x800 edges. Make MINIMAL edits in YOUR file only; do not touch lesson.css or any other file (you may READ others for context). Preserve pages that already pass.`

const ITERATE = (label) => `ITERATE TO CONVERGENCE (this is the develop-web-game loop):
1. Edit your file (Edit tool).
2. Re-shoot (Bash, from repo root): node web/scripts/shoot.mjs ${SPECS}/${label}.json ${SHOTS}/${label}.fix.png
3. Read ${SHOTS}/${label}.fix.png and judge against the three rules + off-stage. Compare to the BEFORE at ${SHOTS}/${label}.after.png (the state before this round) and ${SHOTS}/${label}.png (original).
4. If not clean, adjust and repeat. Up to 6 rounds. Stop as soon as the page is clean (all three rules hold, nothing off-stage) — or you've clearly converged.
The dev server is running at http://localhost:5173 with HMR; your CSS/JSX edit is live before each shoot.`

const TASKS = [
  {
    file: 'web/src/styles/r1.css',
    label: 'r1-s5-words',
    symptom: `R1 Stage 5 (Words): the word-problem column is too TALL, so the Cook + its speech ribbon at the bottom are CLIPPED off the bottom edge of the 1280x800 stage. Confirmed in ${SHOTS}/r1-s5-words.after.png (chef head at the very bottom, cut off).`,
    where: `The stage-5 body is <div className="play r1-words-play"> containing a <WordProblem> card + answer Slate, then a CookHud (cook-zone + ribbon) — see AppR1.jsx ~lines 689-709. The container rule .r1-words-play is in your file (r1.css ~line 168): currently display:flex; flex-direction:column; align-items:center; gap:20px; padding:18px 22px. The R2/R3 word mounts solve the same height problem in lesson-unlike.css .lu-wp-mount by tightening gap/padding and shrinking the embedded card+Slate (wp scale 0.92, wp-story 21px, slate-fraction scale 0.78) — mirror that approach here, SCOPED to .r1-words-play, so the whole column (card + answer + Cook + ribbon) fits within 800px with the Cook fully visible. Reduce gap/padding first; if still tall, shrink the WordProblem card (.r1-words-play .wp-story font-size, .wp-card padding) and/or the embedded Slate. Note slate.css already caps .slate-fraction cells at 90px.`,
  },
  {
    file: 'web/src/styles/r4.css',
    label: 'r4-s2',
    extraLabels: ['r4-s3', 'r4-s4', 'r4-s5'],
    symptom: `Two R4 residuals:
(A) r4-s2 (Bind): the right RAIL (FUSE TOOL panel + COPY THE TIDIED FRACTION panel with the stacked answer Slate + PIECES REMAINING meter) is too tall and overruns DOWN into the HUD, so the lower Slate card paints over the left edge of the dark "Check" button (it reads "heck"). See ${SHOTS}/r4-s2.after.png (bottom-right).
(B) r4-s5 (Words): the Cook in the right column overhangs UPWARD and its white hat occludes the goal-banner text ("...write the s[implest] form..."). See ${SHOTS}/r4-s5.after.png (top-right) — a text-over-character (Rule 2) violation.`,
    where: `(A) The R4 rail panels/spacings are yours in r4.css: .r4-fuse-tray (~l30, gap/margin-top), .r4-slate-wrap (~l121, margin-top:12), .r4-meter (~l46, margin-top:12 + padding), plus .r4-slate-panel. The answer Slate is mounted in the rail (AppR4.jsx ~l579-599) and stacks tall. To make the rail fit ABOVE the HUD/Check: tighten those margins AND shrink the rail's answer Slate specifically — add e.g. .r4-slate-wrap .slate-cell { height: ~72px; width: ~100px } and matching .r4-slate-wrap .slate-bar width, and compact the meter, until the whole rail ends clear above the Check button. Don't touch lesson.css's .check/.hud — solve it by shrinking the rail content. Re-check r4-s3 and r4-s4 (same rail family) don't regress.
(B) The words-stage Cook lives in .r4-words-side (r4.css ~l129) at the top of the right column (AppR4.jsx ~l458-466); the cook art overhangs up into the goal banner. Drop it clear with a top offset on .r4-words-side (e.g. margin-top so the hat starts below the goal banner ~y95) — or otherwise contain the figure — without pushing the rosette off-stage. Verify ${SHOTS}/r4-s5.fix.png shows the goal text fully readable and the Cook clear.`,
  },
  {
    file: 'web/src/styles/r5.css',
    label: 'r5-s3',
    extraLabels: ['r5-s1', 'r5-s2'],
    symptom: `R5 Stage 3 (Fade): the bottom-right corner of the bordered ghost-board diagram cuts through the TOP-LEFT of the mixed-number answer composer's leftover-fraction numerator box (the "and _/7" Slate). The HUD composer's tall fraction box pokes up into the diagram footprint. See ${SHOTS}/r5-s3.after.png. ~57x33px shape overlap (Rule 3).`,
    where: `R5's canvas is taller than other rooms: .r5-canvas { height: 392px } (r5.css ~l9). The mixed-number write composer (.r5-write / .r5-write-frac, r5.css ~l152-155) is in the HUD (AppR5.jsx ~l597-604) and its stacked fraction box is tall, so on the Fade stage the diagram bottom and the composer top collide. Reduce the vertical collision — e.g. trim .r5-canvas height enough that the diagram clears the composer, and/or shrink the composer's fraction Slate (scope a smaller .r5-write .slate-cell). IMPORTANT: re-shoot r5-s1 AND r5-s2 too (they share .r5-canvas and PASSED before) to confirm the overflow stack + whole-unit frame + leftover tray + ruler still fit and nothing regresses.`,
  },
  {
    file: 'web/src/AppR1.jsx',
    label: 'r1-s1-merged',
    extraLabels: ['r1-s1-manipulate'],
    symptom: `R1 Stage 1 after "Count them up": the long status ribbon's top edge rides into the lower-left corner of the merged blue block stack (and its 5/7 tag). See ${SHOTS}/r1-s1-merged.after.png. Rule 3 (shapes) — ribbon box over the tiles.`,
    where: `The merged stack is rendered low in the canvas: the merged bar div at AppR1.jsx ~line 476 uses style={{ left: HOME.A.x, top: HOME.A.y }} where HOME.A.y = 250 (near the canvas bottom, the band the HUD ribbon rises into). RAISE the merged bar so it sits in the upper-middle of the canvas, clear of the ribbon — change that inline top to a higher fixed value (try ~140; the btag sits 58px above it so keep it >70, and the number line is at LINE_Y=322 so keep the bar above it). Edit ONLY AppR1.jsx. This must NOT change Stage 1 BEFORE merge (separate stacks use HOME.A/HOME.B for dragging) — re-shoot r1-s1-manipulate to confirm it's unchanged/clean, and r1-s1-merged to confirm the overlap is gone.`,
  },
]

phase('Converge')
const results = (await parallel(TASKS.map((t) => () => agent(
  `You are converging ONE residual UI overlap by editing EXACTLY ONE file: ${t.file}. You own this file; no other agent edits it.

${CONTRACT}

SYMPTOM:
${t.symptom}

WHERE / HOW:
${t.where}

${ITERATE(t.label)}
${t.extraLabels ? `\nREGRESSION/RELATED PAGES — also re-shoot these (same spec files exist) and confirm they stay clean: ${t.extraLabels.join(', ')}. Shoot each with: node web/scripts/shoot.mjs ${SPECS}/<label>.json ${SHOTS}/<label>.fix.png` : ''}

When converged, return structured output: which selectors/lines you changed, the final round count, whether the target page (and any related pages) pass all three rules with nothing off-stage, and any residual you could NOT fix in this file alone (note which other file it needs).`,
  { label: `fix:${t.label}`, phase: 'Converge', agentType: 'general-purpose', schema: {
    type: 'object', additionalProperties: false,
    required: ['file', 'label', 'pass', 'rounds', 'changes', 'relatedPagesOk', 'residual'],
    properties: {
      file: { type: 'string' },
      label: { type: 'string' },
      pass: { type: 'boolean', description: 'true if the target page now passes all three rules with nothing off-stage' },
      rounds: { type: 'number' },
      changes: { type: 'array', items: { type: 'string' } },
      relatedPagesOk: { type: 'string', description: 'status of extraLabels regression pages (e.g. "r4-s3,r4-s4 clean")' },
      residual: { type: 'string', description: 'any remaining problem you could not fix from this file alone, and which file it needs; empty if fully clean' },
    },
  } }
)))).filter(Boolean)

const stillFailing = results.filter((r) => r && (!r.pass || (r.residual && r.residual.trim())))
log(`Converged ${results.length - stillFailing.length}/${results.length} cleanly; ${stillFailing.length} have notes/residuals`)

return { results, stillFailing }
