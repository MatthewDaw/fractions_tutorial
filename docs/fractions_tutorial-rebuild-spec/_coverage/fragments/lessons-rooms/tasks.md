<!-- FRAGMENT: lessons-rooms / tasks.md
     Build-order tasks for the lessons-rooms subsystem. Synthesis merges into the
     canonical tasks.md. Tasks reference engine/generators/runtime/shell-nav BY
     POINTER (those slices build them); a rebuild does lessons-rooms AFTER its
     dependencies exist. -->

# Lessons & Rooms — tasks

> Dependency order: `engine-core` → `generators` → `runtime-affect` (the
> `useLessonEngine`/`useLessonScaffold`/`practiceFlow`/`scaffoldMap` backbone) and
> `shell-nav` (`rooms.js`/`kitchenProgress.js`/`denominatorColors.js`/voice) MUST
> exist before this slice's rooms can mount. This slice builds bottom-up:
> manipulative components → shared lesson chrome → rooms → hubs → tests.

## T-LR-1 Shared component library
- **T-LR-1.1** Build the manipulative/scene components (`components/**`):
  display (`BigFrac`, `NumberLine`), blocks/strips (`Stack`, `Plank`, `Knife`,
  `BlockSandbox`, `PlateGroup`/`BowlGroup`, `SkipJar`, `SkipLine`, `Rosette`,
  `Lock`), writing surfaces (`Slate`, `BlankSlate`, `ExpressionSlate`, `InkPad`,
  `DenominatorPicker`, `QuestionBand`, `WordProblem`, `StageTabs`, `FitStage`),
  characters (`Cook`, `Mom`). `Slate`/`InkPad` consume the recognizer
  (ink-recognition, BY POINTER) and `settings.inputMode` (shell-nav, BY POINTER).
- **T-LR-1.2** Build the shared lesson chrome (`components/lesson/**`):
  `LessonShell`, `LessonBoard` (split + wide variants, separate grid tracks),
  `AnswerBar`, `LessonGoal`, `HintRail`, `TutorRibbon` + the `index.js` barrel.
- **T-LR-1.3** Build `GenPracticeBoard` (the `★` practice surface): reads
  `scaffold.prob`, switches input by `answerShape`, drives `award`/`reportAttempt`
  via the controller, renders reteach beats + a hint ladder.

## T-LR-2 Single-skill rooms (use the shared library + `useLessonScaffold`)
- **T-LR-2.1** `AppR1` (ADD_SAME_DEN) — the canonical 7-stage arc (Manipulate →
  Bind → Fade → Workbench → Numbers → Applied → Show Work → Words → Practice),
  the `add_denominators` slip, the stumping-recipe `ReturnToKitchen` path.
- **T-LR-2.2** `AppSubtract` (SUB_SAME_DEN) — decompose + take-away mechanic.
- **T-LR-2.3** `AppNumberLine` (FRACTION_ON_LINE) — `NumberLine` drag/name/past-1.
- **T-LR-2.4** `AppCompare` (COMPARE_BENCHMARK) — choice-button compare/benchmark/
  reason (no Slate).
- **T-LR-2.5** `AppM1` (MULT_EQUAL_GROUPS) — `PlateGroup` arc; `[product,1]` answer.
- **T-LR-2.6** `AppM3` (MULT_FACTS) — `SkipJar`/`SkipLine` fluency arc + ×1/×0.
- **T-LR-2.7** `AppR4` (SIMPLIFY) — `GroupBar` + drag ÷K chips; the anti-false-
  positive `not_simplified` gating rule (R-LR-7.1).
- **T-LR-2.8** `AppR5` (IMPROPER_TO_MIXED) — overflow column → whole frame; the
  EXACT-WHOLE trap; `forced_leftover` slip.

## T-LR-3 Shared unlike-den rooms
- **T-LR-3.1** Build `unlikeDenMath.js` (pure: lcd/exactSum/multipliersFor/
  commonDenChoices/verify/crossMultiply/generateProblem — NO Math.random/Date).
- **T-LR-3.2** Build the lesson configs `lessons/r2-unit.js` (Cross-Multiply,
  handwriting) + `lessons/r3-nonunit.js` (Scale One).
- **T-LR-3.3** Build `LessonUnlikeDen` — config-driven (framing→node/lessonId),
  the L0→L7 beat ladder (`NEXT_BEAT`), slice-to-match mechanic, the two-stage
  den→num answer gate, `errorSignatureFor`, DEV `/__ink` logging.

## T-LR-4 Hubs
- **T-LR-4.1** Build `momsProblems.js` (CURRICULUM, BANK, recipes, graders,
  flow helpers) + the mom's-room components (`cast`, `props`, `kit`,
  `ScratchCanvas`).
- **T-LR-4.2** Build `MomsRoom` — the engine-driven kitchen (mirror/combine/
  look-ahead, RouteToRoom wall, stumping recipe + ReturnToKitchen, slip→signature
  mapping).
- **T-LR-4.3** Build `MixedReview` — standalone interleaved practice (identify →
  solve), ≥2-recipe eligibility gate.

## T-LR-5 Room CSS
- **T-LR-5.1** Author the owned stylesheets: `r1/r4/r5/s1/m1/m3/nl/cmp.css`,
  `lesson/lesson-board/lesson-unlike.css`, `mixreview/momsroom.css`,
  `sandbox/slate/blankslate/questionband/stagetabs/gen-practice/fitstage.css`.
  Each is the like-named screen/component stylesheet (structure/layout, tokens
  from `styles/tokens.css` in shell-nav, BY POINTER).

## T-LR-6 Tests (owned)
- **T-LR-6.1** `tests/runtime/test_momsroom_flow.test.jsx` — engine-driven
  adaptive flow: weak-profile wall → RouteToRoom, banter preserved, happy path,
  `goLearn` routes to the engine-chosen room, slip→ErrorSignature mapping,
  ROOM_TO_NODE/NODE_TO_ROOM coverage, problem_present emission. (Mocks
  `useLessonEngine`/`kitchenProgress`/voice.)
- **T-LR-6.2** `tests/runtime/test_mixreview_u8.test.jsx` — `eligibleMixSkills`
  gate (introduced recipes only) + the type-identification surface + empty state.
- **T-LR-6.3** `tests/e2e/adaptive_flow.test.jsx` (U12) — drives the engine with
  weak/strong scripted streams; asserts gate-defended mastery on ≥2 skills,
  inspector parity, boundary-only decisions. (Spans ui-surfaces by pointer.)
- **T-LR-6.4** `tests/e2e/playability_smoke.test.jsx` (U12) — every room/screen
  mounts without throwing and shows a stable landmark (regression net).
