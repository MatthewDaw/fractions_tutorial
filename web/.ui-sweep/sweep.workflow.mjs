export const meta = {
  name: 'ui-bug-sweep',
  description: 'One agent per game-state page: screenshot via headless Chromium, rigorously review for UI bugs, root-cause in code, then synthesize a prioritized report',
  phases: [
    { title: 'Sweep', detail: 'one thread per page — capture + visual review + code root-cause' },
    { title: 'Synthesize', detail: 'dedup by root cause, rank, write fix plan' },
  ],
}

// ---- intro-skip prefix: every room (#/r1..r5) plays an intro on fresh load.
// Skip ▸ (.intro-continue) → end card → Continue (.intro-continue again).
const SKIP = [
  { waitFor: '.intro-continue' },
  { click: '.intro-continue' },
  { wait: 500 },
  { click: '.intro-continue' },
]

// reach a room's stage/beat by clicking the nth tab in its selector strip
const stage = (route, selector, n) => ({
  route,
  steps: [...SKIP, { waitFor: selector }, { clickNth: { selector, n } }, { wait: 800 }],
})

// PAGES — each becomes exactly one agent (one thread per page).
const PAGES = [
  { label: 'title',  watch: 'Title/landing. START button, Babushka motif. Nothing clipped off the 1280x800 stage; centered.', spec: { route: '', steps: [{ waitFor: '#stage' }, { wait: 900 }] } },
  { label: 'world',  watch: 'World map: kitchen medallion + 5 room nodes radially. No node/label overlap; all on-stage.', spec: { route: 'world', steps: [{ waitFor: '#stage' }, { wait: 900 }] } },
  { label: 'mom',    watch: 'Babushka word-problem room entry: character, prop, story caption, answer area. Watch dialog covering the prop/answer.', spec: { route: 'mom', steps: [{ waitFor: '#stage' }, { wait: 1200 }] } },
  { label: 'intro-r1', watch: 'Intro video iframe + transcript sidebar + control bar. iframe fills its area; transcript not overflowing; controls on-stage.', spec: { route: 'r1', steps: [{ waitFor: '.intro-frame' }, { wait: 1500 }] } },

  // R1 — 5 stages via .r1-stage-tab  (KNOWN reported bugs live here)
  { label: 'r1-s1-manipulate', watch: 'Stage 1 blocks. KNOWN BUG: Cook+ribbon (tutor dialog) overlaps the diagram/number-line; answer boxes on the right look oversized/detached. Confirm + root-cause.', spec: stage('r1', '.r1-stage-tab', 0) },
  { label: 'r1-s1-merged', watch: 'Stage 1 after "Count them up": merged stack + answer slate. Watch dialog/slate overlapping the merged stack or each other.', spec: { route: 'r1', steps: [...SKIP, { waitFor: '.r1-stage-tab' }, { clickNth: { selector: '.r1-stage-tab', n: 0 } }, { wait: 400 }, { click: '.joinbtn' }, { wait: 800 }] } },
  { label: 'r1-s2-bind',     watch: 'Stage 2 Bind. KNOWN BUG: Cook+ribbon overlaps the Check button; write Slate placement vs blocks. The write area should be cleanly separated/below the block space, not overlapping other boxes.', spec: stage('r1', '.r1-stage-tab', 1) },
  { label: 'r1-s3-fade',     watch: 'Stage 3 Fade. Dimmed blocks + lead equation + numerator-only Slate (locked den). Watch leadeq overlapping blocks; dialog overlap; write area placement.', spec: stage('r1', '.r1-stage-tab', 2) },
  { label: 'r1-s4-numbers',  watch: 'Stage 4 Numbers. Big centered equation + ghost rail + Slate. Watch equation/ghost/Slate/dialog collisions.', spec: stage('r1', '.r1-stage-tab', 3) },
  { label: 'r1-s5-words',    watch: 'Stage 5 Words. WordProblem story card + embedded Slate + Cook HUD. Watch card overlapping HUD/dialog; write area placement.', spec: stage('r1', '.r1-stage-tab', 4) },

  // R2 — 6 beats via .beat-btn
  ...[0, 1, 2, 3, 4, 5].map((n) => ({ label: `r2-beat${n}`, watch: `R2 (Cross-Multiply) beat index ${n}. Strips/knife/picker/equation/Slate + Cook dialog. Watch dialog covering blocks; write area (InkPad/Slate) overlapping rail or equation; crossing-arrows overlap; off-stage spill.`, spec: stage('r2', '.beat-btn', n) })),

  // R3 — 6 beats via .beat-btn
  ...[0, 1, 2, 3, 4, 5].map((n) => ({ label: `r3-beat${n}`, watch: `R3 (Scale One) beat index ${n}. Same family as R2 but rename-one framing. Watch dialog covering blocks; write area overlap; off-stage spill.`, spec: stage('r3', '.beat-btn', n) })),

  // R4 — 5 stages via .r4-stagechip
  ...[0, 1, 2, 3, 4].map((n) => ({ label: `r4-s${n + 1}`, watch: `R4 (Simplify) stage index ${n}. Fuse bar / factor picker / equation / Slate + Cook dialog. Watch dialog covering bar; write area overlap; fuse tray collisions; off-stage spill.`, spec: stage('r4', '.r4-stagechip', n) })),
  { label: 'r4-s1-fused', watch: 'R4 stage 1 after two fuse clicks: bar should show fewer/bigger blocks + ÷ chips. Watch chips/dialog overlapping the bar.', spec: { route: 'r4', steps: [...SKIP, { waitFor: '.r4-stagechip' }, { clickNth: { selector: '.r4-stagechip', n: 0 } }, { wait: 400 }, { click: '.r4-fuse-btn' }, { wait: 700 }, { click: '.r4-fuse-btn' }, { wait: 800 }] } },

  // R5 — 5 stages via .beat-btn
  ...[0, 1, 2, 3, 4].map((n) => ({ label: `r5-s${n + 1}`, watch: `R5 (Mixed Numbers) stage index ${n}. Overflow column / whole-frame / leftover tray / picker / Slate + Cook dialog. Watch frame/tray/column overlap; dialog covering blocks; mixed-number write area overlap; off-stage spill.`, spec: stage('r5', '.beat-btn', n) })),
  { label: 'r5-s1-grouped', watch: 'R5 stage 1 after grouping pieces into the frame (joinbtn x7): frame fills, leftover tray fills. Watch frame/tray/column collisions and dialog overlap.', spec: { route: 'r5', steps: [...SKIP, { waitFor: '.beat-btn' }, { clickNth: { selector: '.beat-btn', n: 0 } }, { wait: 400 }, { click: '.joinbtn' }, { wait: 350 }, { click: '.joinbtn' }, { wait: 350 }, { click: '.joinbtn' }, { wait: 350 }, { click: '.joinbtn' }, { wait: 350 }, { click: '.joinbtn' }, { wait: 350 }, { click: '.joinbtn' }, { wait: 350 }, { click: '.joinbtn' }, { wait: 800 }] } },
]

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['label', 'route', 'reached', 'screenshot', 'stateNote', 'findings'],
  properties: {
    label: { type: 'string' },
    route: { type: 'string' },
    reached: { type: 'boolean', description: 'true if the intended state was actually captured' },
    screenshot: { type: 'string', description: 'path to the PNG produced' },
    stateNote: { type: 'string', description: 'one line: what the screenshot actually shows' },
    shootWarnings: { type: 'array', items: { type: 'string' } },
    consoleErrors: { type: 'array', items: { type: 'string' } },
    findings: {
      type: 'array',
      description: 'confirmed UI bugs on this page (empty if clean)',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['severity', 'title', 'whatYouSee', 'rootCause', 'confidence'],
        properties: {
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
          title: { type: 'string' },
          whatYouSee: { type: 'string', description: 'the visible symptom in the screenshot (region/coords)' },
          rootCause: { type: 'string', description: 'file:line + the offending CSS rule / JSX, and WHY it happens' },
          confidence: { type: 'string', enum: ['high', 'med', 'low'] },
        },
      },
    },
  },
}

const WEB = 'web' // paths are relative to the repo root (agent shells start there)

function promptFor(p) {
  return `You are reviewing ONE page/state of a fixed-size (1280x800) React fractions-tutoring game for UI bugs. A Vite dev server is ALREADY RUNNING at http://localhost:5173 — do NOT start one.

PAGE: ${p.label}   ROUTE: #/${p.spec.route}
WHAT TO WATCH FOR HERE: ${p.watch}

== STEP 1: capture the screenshot ==
Write this EXACT JSON to ${WEB}/.ui-sweep/specs/${p.label}.json (use the Write tool, verbatim):
${JSON.stringify(p.spec, null, 2)}

Then run (Bash, from the repo root):
  node ${WEB}/scripts/shoot.mjs ${WEB}/.ui-sweep/specs/${p.label}.json ${WEB}/.ui-sweep/shots/${p.label}.png
The command prints JSON with "warnings" and "consoleErrors". The shoot harness clicks a stage/beat selector by index; the intro-skip prefix clicks ".intro-continue" twice.

== STEP 2: confirm you reached the right state ==
Read the PNG (${WEB}/.ui-sweep/shots/${p.label}.png) with the Read tool. If warnings report a missing selector, or the image is clearly the wrong screen (e.g. still on the intro video, or a blank/error page), inspect the source to find the correct selector — Grep/Read these files as needed: web/src/AppR1.jsx, web/src/LessonUnlikeDen.jsx, web/src/AppR4.jsx, web/src/AppR5.jsx, web/src/MomsRoom.jsx, web/src/Shell.jsx, web/src/RoomIntro.jsx — fix the spec JSON and re-run shoot (at most 2 retries). Set reached=false only if you truly cannot get the intended state.

== STEP 3: rigorous visual UI-bug review ==
Examine the 1280x800 image like a designer. THREE TOP-PRIORITY RULES — any violation is a real bug, report it:
  1. NO OVERLAPPING TEXT: two pieces of text (captions, ribbons, labels, equations, hints, titles, piece labels) must NEVER overlap or collide with each other. Each text run sits in clear space.
  2. NO TEXT OVERLAPPING CHARACTERS: text must NEVER overlap the tutor CHARACTERS (the Cook / Babushka / Grandpa figures), and the characters must not cover any text. The speech ribbon and the character must be cleanly separated.
  3. NO OVERLAPPING SHAPES: blocks, strips, bars, panels, boxes, frames, trays, cards, buttons, and the diagram border must NOT overlap or sit on top of one another (unless it is an intentional faded/ghost layer).
Then also check:
  - TUTOR DIALOG OVERLAP: the Cook + speech ribbon (.hud/.cook-zone/.ribbon) covering the blocks/fractions/equation/diagram/Check button. KNOWN PROBLEM AREA — rules 2 & 3.
  - WRITE-AREA PLACEMENT: the handwriting Slate / InkPad / WordProblem answer boxes overlapping other boxes (rule 3). Design intent: the write area should be cleanly separated and sit BELOW the block-manipulation space, not crammed against / overlapping the rail, equation, or diagram.
  - OFF-STAGE / CLIPPING: any element spilling past the 1280x800 edges or clipped by a container.
  - MISALIGNMENT / awkward spacing that reads as broken.
Ignore intentional design (faded/ghosted blocks behind an equation, decorative texture/foxing, dimmed disabled controls). When a shape is deliberately a faint ghost layer it is NOT a violation; a solid element colliding with another solid element IS.

== STEP 4: root-cause every suspected bug in code ==
For each real bug, open the governing CSS/JSX (web/src/styles/lesson.css, lesson-unlike.css, r1.css, r4.css, r5.css, slate.css, momsroom.css, world.css; and the room JSX). Identify the offending rule with file:line and explain WHY it produces the symptom. Drop anything you cannot substantiate or that is a false positive.

== STEP 5: return structured findings ==
Return via the StructuredOutput tool. screenshot = "${WEB}/.ui-sweep/shots/${p.label}.png". Be precise and conservative: only report bugs you can SEE in the image AND tie to a rule in the code. severity: blocker = unusable/illegible/covers the core task; major = clearly wrong/unprofessional but usable; minor = polish. If the page is clean, return an empty findings array.`
}

// ---- PHASE 1: one agent per page (the fan-out the user asked for) ----
phase('Sweep')
const results = (await parallel(
  PAGES.map((p) => () => agent(promptFor(p), {
    label: p.label,
    phase: 'Sweep',
    agentType: 'general-purpose',
    schema: FINDINGS_SCHEMA,
  }))
)).filter(Boolean)

log(`Captured + reviewed ${results.length}/${PAGES.length} pages`)

// ---- PHASE 2: synthesize one deduped, ranked report ----
phase('Synthesize')
const report = await agent(
  `You are synthesizing a UI-bug sweep of a 1280x800 React fractions-tutoring game. Below are per-page review results (JSON). Each has a label, route, screenshot path, and confirmed findings (severity/title/whatYouSee/rootCause/confidence).

PER-PAGE RESULTS:
${JSON.stringify(results, null, 2)}

Do this:
1. Collect every finding across all pages.
2. DEDUPLICATE by shared root cause — many stages reuse the same shared CSS (e.g. .hud/.cook-zone/.ribbon overlap, the Slate/write-area rules). Group findings that stem from the same rule into ONE issue, and list every affected page label under it.
3. RANK issues by severity x breadth (how many pages affected). Blockers and broadly-shared issues first.
4. The user set THREE governing rules — organize the report so violations of each are easy to see: (1) no overlapping text, (2) no text overlapping the tutor characters, (3) no overlapping shapes. The user also reported two specific bugs to anchor on: (a) on "Same Denominators" (R1) the tutor's dialog box covers the fractions; (b) the fraction write area is poorly placed and slightly overlaps other boxes — it should be fully contained below the block-manipulation space. Make sure both are represented (or explain if not reproduced).
5. For each issue give a concrete FIX recommendation: the file(s)+rule(s) to change and the approach.

Write the full report as markdown to ${WEB}/.ui-sweep/REPORT.md (use the Write tool), then return the SAME markdown as your final message. Structure: ## Summary (counts by severity, top issues), ## Issues (ranked; each with affected pages, root cause file:line, fix), ## Per-page index (label → screenshot path → finding count), ## Clean pages.`,
  { label: 'synthesize', phase: 'Synthesize', agentType: 'general-purpose' }
)

return { pagesReviewed: results.length, totalPages: PAGES.length, report }
