# Work Order — nl (Lesson 3 · On the Number Line)

- **Component:** `web/src/AppNumberLine.jsx` · **Route:** `#/nl` · **Effort:** XL
- **Registry:** `web/src/lessons/nl.js` — **AUTHOR NEW** (no wireframe `lessons/nl.js` exists). Use `{ id:"nl", num:"№3", tag:"On the Number Line", title:"Same Denominators", route:"#/nl", tabs:[Place, Write, Numbers, ★Practice] }` reconciled with the component's STAGES.
- **Uses shared shell:** yes

## Target wireframe screens
`docs/wireframe/screens/room-nl-2-write.html`, `room-nl-3-numbers.html`, `room-nl-practice.html`; data `docs/wireframe/src/screens/room-nl.js`, `room-nl-2-write.js`. (No `room-nl-practice.js` data module yet.)

## Design gaps to close (LARGEST — mechanic redesign)
- **Stage 1 paradigm change:** real app uses a draggable POINT on 0→1; wireframe uses BLOCK-STACKING — drag 1/4 unit pieces from a rail tray to GROW a bar to target (ghost drop slot). This is a fundamental Stage-1 redesign, not a CSS fix.
- Stage 1 goal/rail/answer/canvas all reframed around growing a bar from unit pieces.
- Stage 2 (write): wireframe shows block-built bar (not raw point) + Slate; mechanics align.
- Stage 3 (numbers): drag point past 1 on 0→2 line — aligns with wireframe.
- Geometry divergence: real ORIGIN=60/SPAN=600/LINE_Y=150 vs wireframe ORIGIN=96/SPAN=480/LINE_Y=258 — reconcile to one set.

## Dedup moves
- STAGES array + `probFor()` (`:47-65`) → `lessons/nl.js` (the 4 stage defs currently live in AppNumberLine + room-nl.js + room-nl-2-write.js + practice HTML — collapse to one).
- Identity/tabs from registry.
- Chrome already 100% via LessonShell/LessonBoard — keep.

## Mechanics to PRESERVE
- Stage 2 Slate fraction write (`submitWrite`, flip-error detection); Stage 3 point drag past 1; snap to nearest 1/den; `solvedRef` gating; star reporting; reset clears pointK/placed/slate; `GenPracticeBoard FRACTION_ON_LINE`; QuestionBand hidden on practice.
- If implementing the block-stack Stage-1 redesign: NEW drag-source + bar-growth canvas; preserve 3/4 progression + ghost slot UX without spoiling the answer.

## Playwright test plan
1. Stage 1 (current): drag point to 2/4 → "Not far enough"; to 3/4 → "Right on it!", solved.
1b. Stage 1 (if redesigned): drag 1/4 block → bar grows, total updates; reach 3/4 → win.
2. Stage 2: point fixed at 2/3; write 2 and 3 on Slate; Check → solved; write 4/3 → "flipped" error.
3. Stage 3: 0→2 line; drag to 5/3 → "past 1" correct.
4. Practice: QuestionBand null; solve generated FRACTION_ON_LINE problem.
5. Tabs reset state; reset button; star counts; answer-bar Check states.

## Risks
Stage-1 mechanic overhaul (high regression — new drag/canvas/state); visual redesign (bar/tick alignment); geometry reconciliation; missing `room-nl-practice.js`; GenPracticeBoard integration; dynamic TutorRibbon feedback must survive; block-count validation must not spoil answer; fill-bar animation smoothness.

## Definition of done
Wireframe match (incl. Stage-1 decision documented + implemented) · registry-driven · Playwright passes, zero errors · build clean · vitest green · worktree + PR. **Highest effort — schedule generous time.**
