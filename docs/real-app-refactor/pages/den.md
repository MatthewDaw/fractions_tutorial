# Work Order — den (NEW LESSON · The Bottom Number / Denominator)

- **Component:** `web/src/AppDen.jsx` — **BUILD NEW** · **Route:** `#/den` (ADD to `Shell.jsx`) · **CSS:** new `den.css`
- **Registry:** `web/src/lessons/den.js` (port verbatim from `docs/wireframe/src/lessons/den.js` — already authored)
- **Uses shared shell:** yes (from day one)
- **⚠ ROUTER CONTENTION:** edits `Shell.jsx` + world-map. Serialize router edits with `num` (do den first).

## Target wireframe screens
`docs/wireframe/screens/room-den.html`, `room-den-2-match.html`, `room-den-3-smaller.html`, `room-den-4-numbers.html`, `room-den-practice.html`; data `docs/wireframe/src/screens/room-den*.js`.

## Concept / arc (from `lessons/den.js`)
Taught on the 0→1 RULER. Tabs: **Split** (break ruler into N equal pieces) → **Match** (ruler ↔ number) → **Smaller** (which piece is smaller?) → **Numbers** (smaller from the number alone) → **★Practice**. Core insight: bigger bottom number → smaller piece.

## Build approach
- New `AppDen.jsx` using `LessonShell` + `LessonBoard` (split variant) + `LessonGoal` + `QuestionBand` + `TutorRibbon` + `HintRail`.
- Reuse `NumberLine` (ruler split), `Slate` (number entry), `GenPracticeBoard` (practice).
- Pull identity + tabs from `lessons/den.js`; current stage from route/state.
- Wire `useLessonScaffold`/engine: register or reuse a denominator skill node (verify node id exists before practice wiring; e.g. a `DENOMINATOR_*` skill or the closest existing one).
- Mirror each `room-den-*.js` data module's stageHTML/railHTML/answerHTML/tutorHTML as React.

## Mechanics to BUILD (match wireframe data modules)
- Stage 1 Split: pick a bottom number → ruler splits into N equal pieces (animated); discover smaller-with-bigger-N.
- Stage 2 Match: map ruler image ↔ its number.
- Stage 3 Smaller: compare two pieces, pick smaller.
- Stage 4 Numbers: reason smaller from the number alone (no ruler).
- Practice: paced generated problems.

## Playwright test plan
1. Load `#/den` → topbar "№3 · Building Fractions · The Bottom Number", 5 tabs.
2. Stage 1: choose bottom number → ruler shows N equal ticks; verify piece-size feedback.
3. Stage 2: match ruler to correct number; wrong → warn; correct → advance.
4. Stage 3: pick smaller piece → correct advances.
5. Stage 4: bare number compare → answer → advance.
6. Practice: solve a generated problem; re-roll.
7. Tabs nav; reset; back. Zero console/page errors throughout.
8. World map: `#/den` reachable from its shelf entry.

## Risks
NEW component — no reference React impl; must not regress shared shell. Engine skill node may not exist (verify/create). Router fallthrough to world map if route unregistered. NumberLine geometry must fit LessonBoard. World-map entry + mastery wiring needed. Ruler split animation.

## Definition of done
Component built on shared shell · registry-driven · route + world-map entry added · all stages walk via Playwright with zero errors · build clean · vitest green · worktree + PR.
