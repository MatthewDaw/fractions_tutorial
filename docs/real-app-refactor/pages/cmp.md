# Work Order — cmp (Lesson 6 · Comparing Fractions)

- **Component:** `web/src/AppCompare.jsx` · **Route:** `#/cmp` · **CSS:** `cmp.css` · **Effort:** M
- **Registry:** `web/src/lessons/cmp.js` (port from `docs/wireframe/src/lessons/cmp.js`)
- **Uses shared shell:** yes · Disjoint; parallel-safe.

## Target wireframe screens
`docs/wireframe/screens/room-cmp.html` (Compare), `room-cmp-2-benchmark.html`, `room-cmp-3-reason.html`, `room-cmp-practice.html`.

## Design gaps to close
- Lesson number №6 (wireframe cmp.js says №5 — outdated; use real №6, reconcile in renumber pass).
- QuestionBand via LessonShell (already correct).
- ChoiceAnswer card (< = >) already a component — keep.
- Practice GenPracticeBoard standalone (no LessonBoard).

## Dedup moves
- Identity/tabs (4 stages: compare, benchmark, reason, practice) → `lessons/cmp.js`.
- ChoiceAnswer card structure (inline in 3 wireframe screens) → shared `<ChoiceAnswer>` (real app already has it).
- Item-progress dots (Stage 1 only) → sub-component.
- NumberLine via component (already declarative).

## Mechanics to PRESERVE
- `pickRel` (Stage 1, < = >), `pickBench` (Stage 2, 0/½/1), `pickReason` (Stage 3, less/about/more, wide variant); wrong → flash red+shake, correct → lock green+pop; Stage 1 two items (advance on first, solve on second) with setTimeout (1400/1500ms); reset; `useLessonScaffold`; practice COMPARE_BENCHMARK relations.

## Playwright test plan
1. Stage 1 Compare: two 0→1 lines (3/8, 5/8), 3 choice buttons, item dots; wrong → red shake; item1 correct → green pop, advance to item2; item2 correct → solved, 3 stars, Next → stage 2.
2. Stage 2 Benchmark: one line + ½ tick, buttons 0/½/1; wrong → "not closest"; ½ → success, Next.
3. Stage 3 Reason: bare 1/2+2/3, two lines; wrong → guidance; "more than 1" → success, Done.
4. Done → practice.
5. Practice: GenPracticeBoard relation buttons, immediate submit (no Check); reteach beat.
6. Reset (itemIdx 0, pick null); reset on practice → scaffold.resetStage.
7. Tab nav; QuestionBand reflects stage + solve state, null on practice.

## Risks
Engine scaffold not mirrored in wireframe (test real engine attempt recording); item-progression setTimeout state machine; GenPracticeBoard variation (relation vs benchmark buttons depend on prob shape); cook emotion states; NumberLine black-box props; audio say(); error-flow keyframe animations from React className.

## Definition of done
Wireframe match (№6) · registry tabs/identity · Playwright passes, zero errors · build clean · vitest green · worktree + PR.
