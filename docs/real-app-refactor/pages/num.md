# Work Order — num (NEW LESSON · The Top Number / Numerator)

- **Component:** `web/src/AppNum.jsx` — **BUILD NEW** · **Route:** `#/num` (ADD to `Shell.jsx`) · **CSS:** new `num.css`
- **Registry:** `web/src/lessons/num.js` (port verbatim from `docs/wireframe/src/lessons/num.js` — already authored)
- **Uses shared shell:** yes (from day one)
- **⚠ ROUTER CONTENTION:** edits `Shell.jsx` + world-map. Serialize after `den` (do den first, then num rebases).

## Target wireframe screens
`docs/wireframe/screens/room-num.html`, `room-num-2-count.html`, `room-num-3-whole.html`, `room-num-5-numbers.html`, `room-num-6-story.html`, `room-num-7-words.html`, `room-num-practice.html`; data `docs/wireframe/src/screens/room-num*.js`.

## Concept / arc (from `lessons/num.js`)
On the 0→1 RULER. Tabs: **Shade** (try different top numbers) → **Count** (top number counts shaded pieces) → **Whole** (fill every piece — n/n = 1) → **Numbers** (more on top — bare symbols) → **Story** (problem with the numbers in it) → **Words** (plain story problem) → **★Practice**. Arc rises from ruler play to real symbolic + word math.

## Build approach
- New `AppNum.jsx` on `LessonShell` + `LessonBoard` + `LessonGoal` + `QuestionBand` + `TutorRibbon` + `HintRail`.
- Reuse `NumberLine`/ruler, `Slate`, `WordProblem` (Story/Words), `BlankSlate` (optional scratch), `GenPracticeBoard`.
- Identity + tabs from `lessons/num.js`; current stage from route/state.
- Engine: register/reuse a numerator skill node (verify before practice wiring).
- Mirror each `room-num-*.js` data module as React.

## Mechanics to BUILD
- Stage 1 Shade: pick a top number → that many pieces shade on the ruler.
- Stage 2 Count: confirm top number counts shaded pieces.
- Stage 3 Whole: fill every piece → n/n = 1.
- Stage 4 Numbers: bare symbols, more on top.
- Stage 6 Story: word problem with the numbers present.
- Stage 7 Words: plain story problem (QuestionBand hidden, like other Words stages).
- Practice: paced generated problems.

## Playwright test plan
1. Load `#/num` → topbar "№4 · Building Fractions · The Top Number", 7 tabs.
2. Stage 1 Shade: pick top number → correct pieces shade.
3. Stage 2 Count: answer count → advance.
4. Stage 3 Whole: fill to n/n → recognize 1 whole.
5. Stage 4 Numbers: bare answer → advance.
6. Story: word problem with numbers, Slate answer → advance.
7. Words: QuestionBand hidden, write answer → end.
8. Practice: solve generated; re-roll.
9. Tabs/reset/back; zero errors. 10. World map: `#/num` reachable.

## Risks
NEW component; engine skill node may be missing (verify/create); router serialize after den; QuestionBand hidden on Words stage; WordProblem layout (wide variant); ruler shade geometry; world-map + mastery wiring.

## Definition of done
Component on shared shell · registry-driven · route + world-map entry · all 7 stages walk via Playwright, zero errors · build clean · vitest green · worktree + PR (rebased after den).
