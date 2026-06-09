# Checklist — slice `lessons-rooms` (MAT-130)

One line per owned room / screen / component / config / module / CSS / test.
Tick `[x]` once its content is written into the relevant fragment file(s).

## Lesson room screens (11)
- [x] AppR1.jsx — r1 Same Denominators (ADD_SAME_DEN)
- [x] AppSubtract.jsx — s1 Taking Away (SUB_SAME_DEN)
- [x] AppNumberLine.jsx — nl On the Number Line (FRACTION_ON_LINE)
- [x] AppCompare.jsx — cmp Compare & Check (COMPARE_BENCHMARK)
- [x] AppM1.jsx — m1 Equal Groups (MULT_EQUAL_GROUPS)
- [x] AppM3.jsx — m3 Times Facts (MULT_FACTS)
- [x] AppR4.jsx — r4 Simplify (SIMPLIFY)
- [x] AppR5.jsx — r5 Mixed Numbers (IMPROPER_TO_MIXED)
- [x] LessonUnlikeDen.jsx (r2 Cross-Multiply / ADD_UNLIKE_COPRIME)
- [x] LessonUnlikeDen.jsx (r3 Scale One / ADD_UNLIKE_NESTED)
- [x] MomsRoom.jsx — Babushka's Kitchen word-problem transfer hub
- [x] MixedReview.jsx — Mixed Basket interleaved practice (U8)

## Lesson configs (2)
- [x] lessons/r2-unit.js
- [x] lessons/r3-nonunit.js

## Top-level modules (2)
- [x] momsProblems.js
- [x] unlikeDenMath.js

## Shared lesson chrome (components/lesson/, 7)
- [x] lesson/LessonShell.jsx
- [x] lesson/LessonBoard.jsx
- [x] lesson/LessonGoal.jsx
- [x] lesson/AnswerBar.jsx
- [x] lesson/HintRail.jsx
- [x] lesson/TutorRibbon.jsx
- [x] lesson/index.js (barrel)

## Manipulative + scene components (components/, 24)
- [x] BigFrac.jsx
- [x] BlankSlate.jsx
- [x] BlockSandbox.jsx
- [x] Cook.jsx
- [x] DenominatorPicker.jsx
- [x] ExpressionSlate.jsx
- [x] FitStage.jsx
- [x] GenPracticeBoard.jsx
- [x] InkPad.jsx
- [x] Knife.jsx
- [x] Lock.jsx
- [x] Mom.jsx
- [x] NumberLine.jsx
- [x] PlateGroup.jsx
- [x] Plank.jsx
- [x] QuestionBand.jsx
- [x] Rosette.jsx
- [x] SkipJar.jsx
- [x] SkipLine.jsx
- [x] Slate.jsx
- [x] Stack.jsx
- [x] StageTabs.jsx
- [x] WordProblem.jsx

## Mom's-room components (components/momsroom/, 4)
- [x] momsroom/ScratchCanvas.jsx
- [x] momsroom/cast.jsx
- [x] momsroom/kit.jsx
- [x] momsroom/props.jsx

## Owned CSS (21)
- [x] r1.css, r4.css, r5.css, s1.css, m1.css, m3.css, nl.css, cmp.css
- [x] lesson.css, lesson-board.css, lesson-unlike.css
- [x] mixreview.css, momsroom.css
- [x] sandbox.css, slate.css, blankslate.css, questionband.css, stagetabs.css, gen-practice.css, fitstage.css

## Owned tests
- [x] tests/runtime/test_momsroom_flow.test.jsx
- [x] tests/runtime/test_mixreview_u8.test.jsx
- [x] tests/e2e/adaptive_flow.test.jsx
- [x] tests/e2e/playability_smoke.test.jsx

## Fragment files to produce
- [x] requirements.md (per-room learning goals + scaffold ladders)
- [x] ui-wireframes.md (per-screen layouts)
- [x] design.md (lesson-scene architecture, manipulatives, beats)
- [x] tasks.md
- [x] adrs/adr-lessons-shared-lesson-library.md
