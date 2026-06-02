export const meta = {
  name: 'ui-deterministic-propagate',
  description: 'Roll out the R1 stage-1 deterministic-zone exemplar (fixed zones, equation+answer+Check as one card with Check beside the write area, ready-to-check glow) to every other stage and room — one agent per room-component',
  phases: [{ title: 'Propagate', detail: 'one agent per room: apply the exemplar, verify every stage via screenshots' }],
}

const SHOTS = 'web/.ui-sweep/shots'
const SPECS = 'web/.ui-sweep/specs'

const REFERENCE = `THE EXEMPLAR TO COPY (already built & approved) = R1 stage 1:
- JSX: web/src/AppR1.jsx, the \`stage === 1\` body (the <div className="r1-s1"> block) — four FIXED zones: .r1-s1-blocks (top-left), .r1-s1-rail (top-right), .r1-s1-answer (equation + Slate + Check + Rosette as ONE bordered card, pinned bottom, Check immediately right of the Slate), .r1-s1-tutor (Cook + ribbon, bottom-right).
- CSS: web/src/styles/r1.css, the .r1-s1* rules (~lines 60-160). Study how each zone is an absolutely-positioned fixed rectangle with clamped text and a guaranteed gap between the block zone (top) and the answer card (bottom), so nothing can reflow/overlap on any screen/font.
- The "ready to check" glow: AppR1 computes \`answerReady\` (committed answer for the stage) and adds class "ready" to the Check button; the .check.ready glow is ALREADY defined in shared lesson.css — just compute the per-stage answerReady and apply the class.`

const CONTRACT = `RULES:
- Fixed 1280x800 stage, scaled uniformly to any screen, NO scrolling. The layout must be DETERMINISTIC: every region a fixed-size rectangle with clamped text + guaranteed gaps, so a longer string or a different font (Safari vs Chromium) can NEVER reflow one zone onto another. This is the whole point — the user's tablet currently has the block/dragging area covering the fractions because of content-driven reflow.
- Respect the EXISTING paper/ink design system (tokens.css, lesson.css). Match it; introduce no new fonts/colors.
- The answer/equation and the Check button must read as ONE unit, with the write area (Slate) clearly SEPARATED BELOW the block-manipulation space, and the Check button IMMEDIATELY TO THE RIGHT of where the student writes.
- Add the "ready to check" glow to this room's Check button(s): compute an answerReady boolean (true when the stage's required handwritten answer is committed and not solved) and add class "ready" (shared .check.ready already exists).
- The Slate is a HANDWRITING canvas — keep its cells comfortably large for a child's digit (see .r1-s1-slate cell sizing ~96x78).
- Do NOT edit shared lesson.css / slate.css / world.css (the glow + clamps are already there). Scope new zone classes to THIS room's CSS file. You own ONLY your room's files (listed below).
- The Cook/character being "half inside" a zone is acceptable; do not fight it.
- EQUATION ALIGNMENT (applies to every bare-equation / "numbers" style stage): the answer placeholder "?/?" (and the filled answer) MUST be the SAME size as the other stacked fractions in the equation and VERTICALLY CENTERED with them — the fraction bars of "2/7", "3/7" and the "?/?" answer must sit on the same midline, and the "=" sign centered to that midline. Currently the "?/?" renders smaller and floats high (bar misaligned). Fix the equation row to align-items:center with a consistent fraction size for all terms including the answer placeholder.`

const HARNESS = `VERIFY with the screenshot harness (project Playwright). Run from repo ROOT:
  node web/scripts/shoot.mjs <specPath> <outPath.png>
Specs already exist in ${SPECS}/ for every state (they encode intro-skip + stage clicks). Read the output PNG with the Read tool and check the three rules: (1) no overlapping text, (2) no text over the tutor characters, (3) no overlapping shapes — plus: nothing off the 1280x800 stage, equation+answer is one unit, Check beside the write area, and the layout is structurally deterministic (zone sizes do NOT depend on text content). To confirm cross-screen determinism, copy a spec and set different "w"/"h" (e.g. 1024x768, 1366x1024) — the internal layout must be identical, only scaled. If a shot comes back blank, it caught an HMR reload — wait ~1s and re-shoot. Iterate edit->shoot->assess until every one of your stages is clean and deterministic.`

const ROOMS = [
  {
    label: 'r1-stages-2-5',
    files: 'web/src/AppR1.jsx (stages 2,3,4,5 only — DO NOT touch stage 1, it is the approved exemplar) and web/src/styles/r1.css',
    detail: `Convert R1 stages 2-5 (Bind / Fade / Numbers / Words) to the same deterministic fixed-zone layout as stage 1, with the equation+answer+Check as one card and Check beside the Slate. Stages 2-4 currently mount the Slate in the right rail with Check in the bottom HUD (far apart) — regroup them. The WordProblem stage keeps the story card on top, answer Slate + Check together below it, all in fixed clamped zones. ALSO FIX the bare-equation answer-placeholder alignment: in the "Numbers"/"Applied" stages the "2/7 + 3/7 = ?/?" row renders the "?/?" smaller and floating high — its bar doesn't line up with the 2/7 and 3/7 bars (see r1.css .r1-bigeq / .r1-bigeq-q). Make all fraction terms (including the ?/? answer and the filled answer) the same size and vertically centered on one midline. NOTE: R1 now has ~7 stages (Manipulate, Bind, Fade, Workbench, Numbers, Applied, Words) — re-read the current STAGES array + body before editing, and DO NOT touch stage 1 (the approved exemplar). Verify the current specs for each stage (re-derive labels from .r1-stage-tab order).`,
  },
  {
    label: 'r2-r3',
    files: 'web/src/LessonUnlikeDen.jsx (used by BOTH r2 and r3) and web/src/styles/lesson-unlike.css',
    detail: `Convert every beat of LessonUnlikeDen (L0/L2/L4/L5/L6/L7) to deterministic fixed zones: block-manipulation area (strips/knife/picker) as a fixed top zone; the worked equation + the handwriting answer (InkPad/Slate) + Check as ONE card below, Check beside the write area; the Cook/ribbon in a fixed tutor zone. Clamp the picker/worksheet/cross-rule text. This component drives both r2 (cross-multiply) and r3 (scale-one) — verify BOTH. Specs: r2-beat0,r2-beat2,r2-beat3,r2-beat4,r2-beat5 and r3-beat0,r3-beat2,r3-beat4,r3-beat5.`,
  },
  {
    label: 'r4',
    files: 'web/src/AppR4.jsx and web/src/styles/r4.css',
    detail: `Convert R4 (Simplify) stages 1-5 to deterministic fixed zones. The rail currently stacks fuse-tool + answer Slate + pieces-remaining and overruns toward the HUD Check; instead make the bar/fuse a fixed top zone and put the equation + answer Slate + Check together as one card below with Check beside the Slate. Words stage: story + answer+Check below. Specs: r4-s1,r4-s2,r4-s3,r4-s4,r4-s5.`,
  },
  {
    label: 'r5',
    files: 'web/src/AppR5.jsx and web/src/styles/r5.css',
    detail: `Convert R5 (Mixed Numbers) stages 1-5 to deterministic fixed zones. The block area (overflow column + whole-unit frame + leftover tray + ruler) is a fixed top zone; the mixed-number write composer (whole + "and" + fraction Slate) + Check as one card below, Check beside the write composer. The R5 composer is tall — ensure the fixed answer-card zone fits it with a guaranteed gap below the block zone (this room previously had the diagram corner clipping the composer). Specs: r5-s1,r5-s2,r5-s3,r5-s4,r5-s5.`,
  },
  {
    label: 'mom',
    files: 'web/src/MomsRoom.jsx and web/src/styles/momsroom.css',
    detail: `Apply the same deterministic-zone discipline to Mom's word-problem room: fixed zones for the prop/story area and a grouped answer (write area + Check together, Check beside the write area) below, with clamped text so different problem strings/characters can't reflow zones. Add the ready-to-check glow. Spec: mom (the room cycles problems; verify the entry state and, if you can reach later problems via clicks, spot-check one more).`,
  },
]

phase('Propagate')
const results = (await parallel(ROOMS.map((r) => () => agent(
  `Apply the approved deterministic-layout exemplar to ONE room. You own ONLY these files: ${r.files}. Do not edit any other file (read others for reference).

${REFERENCE}

YOUR ROOM: ${r.label}
${r.detail}

${CONTRACT}

${HARNESS}

When done, return structured output: the files+rules you changed, how determinism is guaranteed for this room, which stage specs you verified (and at which viewport sizes), and any residual you could not resolve from your own files.`,
  { label: `prop:${r.label}`, phase: 'Propagate', agentType: 'general-purpose', schema: {
    type: 'object', additionalProperties: false,
    required: ['room', 'pass', 'changes', 'stagesVerified', 'residual'],
    properties: {
      room: { type: 'string' },
      pass: { type: 'boolean', description: 'true if all this room\'s stages are deterministic + clean (Check beside write area, no overlaps, nothing off-stage)' },
      changes: { type: 'array', items: { type: 'string' } },
      stagesVerified: { type: 'string', description: 'which specs/viewports you screenshotted and the verdict' },
      residual: { type: 'string', description: 'anything not fully resolved from your own files; empty if clean' },
    },
  } }
)))).filter(Boolean)

const open = results.filter((r) => r && (!r.pass || (r.residual && r.residual.trim())))
log(`Propagated ${results.length - open.length}/${results.length} rooms cleanly; ${open.length} have residuals`)
return { results, open }
