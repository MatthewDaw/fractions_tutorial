<!-- FRAGMENT: lessons-rooms / design.md
     Lesson-scene architecture, manipulatives, beats. Synthesis assembles into
     the canonical design.md. The top-level engine⇄runtime⇄lessons⇄surfaces
     layering intro and spanning ADRs are SYNTHESIS-OWNED; this fragment documents
     only the lessons-rooms subsystem (room scenes, shared lesson chrome,
     manipulative components, beat/scaffold ladders). Engine, generators,
     runtime hooks (useLessonEngine/practiceFlow/scaffoldMap), and shell-nav
     (rooms.js/kitchenProgress.js) are referenced BY POINTER. -->

# Lessons & Rooms — design

## 0. What this subsystem IS

The lesson layer is the **manipulative-first teaching surface**: the ten lesson
rooms (`AppR1`, `AppSubtract`, `AppNumberLine`, `AppCompare`, `AppM1`, `AppM3`,
`AppR4`, `AppR5`, and the shared `LessonUnlikeDen` for r2/r3), the word-problem
**transfer hub** (`MomsRoom` — Babushka's Kitchen) and the **interleaved review**
(`MixedReview` — the Mixed Basket). Each room renders a teaching SCENE built from
a small library of **manipulative components** (`components/**`) and a shared
**lesson chrome** (`components/lesson/**`), and adopts the runtime engine bridge
(`runtime/useLessonEngine.js` + `useLessonScaffold.js` → `practiceFlow.js` →
`generators/**`) by pointer. WHY: the room is presentation only — it owns the
manipulative, the stage arc, and the copy; the engine owns *what to present next*
and *whether the skill is mastered*, and the room never reads or writes mastery
(constitution §5.3/§5.4). A room never calls `policy.nextDecision`; that happens
only inside the hook at the submit/entry boundary (R16, constitution §5.3).

## 1. The room scene grammar (play-space-first)

Every room follows the same scene grammar (sourced from
`docs/design/presentation-scene-architecture.md`): a **play space** where the
manipulative IS the problem, a **goal banner** that states the task in
Babushka's-kitchen language, a **question band** carrying the bare equation in a
fixed spot, a **tutor ribbon** (the Cook character + a coaching line), and a
**hint rail** holding the room's signature rule (e.g. R1's locked denominator).
WHY play-space-first: the manipulative must dominate; symbols and chrome stay
secondary so the block↔number bridge reads before the notation does.

### 1.1 The two-channel fade (the pedagogical spine)

Each room runs a **scaffold ladder** that fades support in two opposite
directions at once: the **block/touch channel shrinks** (drag → dim → gone) while
the **stylus/writing channel grows** (copy one numeral → write the changed line →
write the whole solution → read prose and extract the math). This is the L0→L4
ladder of the constitution (§6) made concrete per room. The native per-room
"stages" map onto the canonical `ScaffoldLevel` L0..L4 via
`runtime/scaffoldMap.js::toBeatForLevel` (BY POINTER) — a room numbers its stages
for the child; the engine sees only the mapped level. WHY: the gate's
`max_scaffold_passed` dimension needs a stable L0..L4 reading regardless of how
many native beats a room shows.

## 2. Shared lesson chrome (`components/lesson/**`)

A single layout library, imported as
`import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, HintRail, LessonGoal } from "./components/lesson"`.
It replaces the byte-identical hand-rolled chrome each room used to inline. WHY: a
deterministic, reuse-once layout kills the historical "answer bar overlaps the
play area" bug structurally, and makes every room read the same.

| Component | What it IS / WHY |
|---|---|
| `LessonShell` | The ONE page chrome: `.page[data-vox-speaker]` → `.foxing` texture → `.topbar` (№ mark · "Lesson {no} · {tag}" · title · Back/Rewatch-intro/Settings/Reset controls) → `StageTabs` → `band` → `goal` → `children` (body) → `extra`. Only the tag string, reset handler, title, tabs, band, goal and body ever differed between rooms, so those are props; everything else renders once. `onBack`/`onRewatchIntro`/`onReset` controls render only when their handler is provided. |
| `LessonBoard` | The ONE play-area layout. Two variants. `split` (default): a CSS grid with stage (top-left), rail (top-right), answer (bottom-left), tutor (bottom-right) in SEPARATE tracks — the answer bar can NEVER overlap the interaction area (the bug it was built to kill). `rail={null}` makes the stage span full width (rail-less Workbench). `wide`: a full-width word-problem `content` column + a narrow `tutor` column (Applied/Words stages). Sizing props (`railWidth`/`footHeight`/`tutorWidth`/`colGap`/`rowGap`/`marginTop`) map to `--lboard-*` CSS custom properties. |
| `AnswerBar` | The ONE equation + Check card. The room supplies the equation row (`eq`: fractions · operator · Slate/input), an italic `cap`, and Check state (`solved`/`ready`/`stars`/`onCheck`/`checkLabel`/`checkDisabled`). The card frame, the Rosette-on-solve, and the Check button (with `done`/`ready` styling) live here. `ready` pulses the button once the answer is committed. |
| `LessonGoal` | The ONE goal banner: a "Read aloud" speaker button (`say(voiceKey)`, animates while `speaking`) + the bold voiced caption. Carries `data-vox`/`data-vox-speaker` so `TapToRead` (shell-nav, BY POINTER) can read it in-character. |
| `TutorRibbon` | The ONE Cook + speech-ribbon block: `Cook expr={cook}` + a `.ribbon` whose `tone==="warn"` tints it red. `narrow` is the word-problem variant; `rosette`+`stars` optionally mark "solved" beside the ribbon. |
| `HintRail` | The common single-panel rail card: `.panel` with an uppercase heading + an italic hint + extra children. For multi-card rails a room passes a custom node to `LessonBoard.rail` instead. |
| `lesson/index.js` | Barrel re-export of the six above. |

## 3. The canonical 7-stage arc (R1 as the template)

`AppR1` is the fullest expression of the arc; the other single-skill rooms are
variations on it. Its stage model (the `STAGES` array) is:

1. **Manipulate** — the blocks ARE the problem; drag two same-size stacks
   together and count. No writing (numeric box only).
2. **Bind** — the merged stack PLUS the written fraction beside it ("this one
   stack *is* 5/7"); the child writes the answer on the stylus `Slate`.
3. **Fade** — the blocks dim to a faint check; the equation leads; the child
   writes only the changed line (numerator; denominator slot locked).
4. **Workbench** — the shared `BlockSandbox`: a bin of correct + distractor sizes
   the child chooses from, stacks on a ruler, and counts to the target.
5. **Numbers** — a BARE equation, no blocks; write the whole fraction.
6. **Applied** — an applied sentence with a REQUIRED word→math **setup gate**: the
   child first transcribes the question as a sum on an `ExpressionSlate`; only
   then does the answer `Slate` unlock (`setupOk`).
7. **Show Work** (string-keyed `sw`, inserted between Applied and Words so the
   numeric stages never renumber) — a mandatory UNGRADED free-form `BlankSlate`;
   advancing is gated purely on ink presence (`onInkChange`), never a graded
   answer. `scaffoldMap` maps `"showwork"` → level 3 (BY POINTER).
8. **Words** — a plain-language story with no equation shown (the `QuestionBand`
   is suppressed at stage 7 so the child must extract the math); an OPTIONAL
   ungraded scratch `BlankSlate`; read, pull the numbers, write the total.
9. **Practice** (`★` badge) — `GenPracticeBoard` serves auto-generated
   `ADD_SAME_DEN` variations PACED BY THE ENGINE (re-roll on correct, fade on a
   clean streak, transfer probe). Purely additive — no teaching stage is touched.

A **stage selector** (`StageTabs`) jumps to any stage in one click; a correct
answer auto-advances. WHY string-keyed `sw`/`practice`: inserting a mandatory or
generated step must not renumber the child-facing numeric stages, and the engine
reads the scaffold KEY (mapped to L0..L4) not the display number.

### 3.1 Engine wiring per stage (R1)

The room composes the engine ONLY through `useLessonScaffold` (BY POINTER to
runtime-affect): it supplies `nodeId`, `lessonId`, `initialStage`, ordered
`advance`/`back` (by STAGES order, not arithmetic — so `sw` sits between 6 and 7),
`scaffoldKeyFor`, `generatedStages`/`generatorSkill` (the Practice stage),
`introFor`, `resetStage`, and `onEnd`. The hook returns
`stage/goStage/nextStage`, `emit/reportAttempt/award/flashBad`,
`solved/solvedRef/stars/badInput`, `cook/setCook/status/setStatus`,
`say/speaking/selfCorrectionsRef`. The room calls `reportAttempt({ correct,
answerValue, errorSignature, stars })` on a wrong answer (e.g. the
`add_denominators` slip when the child adds the bottoms) and `award(...)` on a
correct one; `emit(...)` records manipulative micro-actions (`place_block`,
`remove_block`) and self-corrections (place→remove oscillation increments
`selfCorrectionsRef`). The `error_signature` strings the rooms produce
(`add_denominators`, etc.) are the engine's `ErrorSignature` contract (BY POINTER
to engine-core), and feed credit assignment.

### 3.2 The Stumping recipe / kitchen return (U3)

A room accepts `stumpingRecipe` + `onReturnToKitchen`: when opened from a
"stumping" kitchen recipe, the hook's `onEnd` receives a `ReturnToKitchen`
Decision and routes the child back to `MomsRoom` instead of the end-of-arc
celebration. WHY: a room entered from the kitchen as a remediation must hand the
child back to the word problem that stumped them.

## 4. Manipulative & scene component library (`components/**`)

The shared, read-only building blocks every room composes. WHY a library: the
block↔number bridge must look and behave identically across rooms, and the
manipulatives are pure presentation (no engine coupling) so a room can swap them
freely. Denominator colors come from `denominatorColors.js` (shell-nav, BY
POINTER) so a given piece size always reads the same hue.

### 4.1 Fraction / number display
- **`BigFrac`** — a large rendered fraction (num over den), optional `locked`
  padlock affordance and a `children` slot (e.g. R4's ÷K `DivChips`). WHY: the
  canonical big-symbol fraction so notation reads the same everywhere.
- **`NumberLine`** — the number-line manipulative: a 0→`wholes` ruler cut into
  `den` parts, absolutely-positioned ticks/labels, an optional draggable `point`
  (`onPlace` fires in WHOLES, snapped to 1/den; `info.live` glides without
  judging), `fillToPoint`, `benchmarkHalf` (the ½ reference tick). Used by nl
  (drag/name a point), cmp (compare/benchmark/reason). WHY: one ruler object
  carries every "a fraction is a point" interaction.

### 4.2 Block / strip manipulatives
- **`Stack`** — a stack of same-size unit pieces (R1's addends). **`Plank`** — a
  strip/bar of pieces (LessonUnlikeDen strips). **`Knife`** — the slice tool
  dragged onto a strip to cut it into more pieces (unlike-den slicing).
- **`BlockSandbox`** — the shared draggable fraction-block **Workbench**: a bin of
  sizes (correct + distractors) the child pulls from, stacks on a ruler, and
  counts to a `targetValue`; fires `onSolve({num,den})` only for a clean same-size
  row that reaches the target; `mode="number"` switches it to whole-number groups
  (m1/m3). `onPlace`/`onRemove` feed self-correction tracking. WHY: one reusable
  free-build stage every room's "Workbench" rung mounts.
- **`PlateGroup`** + `BowlGroup` — equal-groups manipulative (m1): N plates each
  capped at SIZE; extra taps spill back (the equal-group invariant). **`SkipJar`**
  / **`SkipLine`** — skip-count manipulatives (m3): scoop groups into a jar with a
  visible running tally (anti-drift), or fill blank interior terms on a
  skip-count line. **`Rosette`** — the circular fraction / star-reward bloom shown
  on solve. **`Lock`** — the padlock affordance for a locked denominator/whole.

### 4.3 Writing surfaces (the stylus channel)
- **`Slate`** — THE answer slate: stylus handwriting vs typed digits per
  `settings.inputMode` (BY POINTER to shell-nav); `slots` define fraction/row
  layout with per-slot `locked`/`digit` (the two-stage gate + locked denominator);
  `onSubmit` is the boundary commit. **`BlankSlate`** — a 100%-free-form scratch
  slate; `onInkChange` drives the ungraded "Show Work" presence gate.
  **`ExpressionSlate`** — the word→math setup surface (write `a/d + b/d`) for the
  Applied gate. **`InkPad`** — raw handwriting capture feeding the recognizer
  (ink-recognition slice, BY POINTER); `getSample()` exposes recognizer confidence.
- **`DenominatorPicker`** — symbolic common-size chooser (LessonUnlikeDen L2/L4).
- **`QuestionBand`** — the fixed full-width band carrying the bare equation
  (`lead`/`expr`/`answer`), suppressed on words-only stages so the child extracts
  the math. **`WordProblem`** — the word-problem card (story + tag + read-aloud +
  optional `setup` gate + answer `slots`/Check). **`StageTabs`** — the
  stage-selector strip (jump to any stage). **`FitStage`** — a uniform-scale
  wrapper that shrinks a fixed-geometry scene to fit a flexible stage track
  (`axis="y"` for word columns).
- **`Cook`** / **`Mom`** — the tutor characters (Cook = male tutor in lessons,
  Mom = Babushka in the kitchen).

## 5. Babushka's Kitchen (`MomsRoom`) — the engine-driven transfer hub

`MomsRoom` is the **word-problem transfer / assessment layer** over the five
arithmetic rooms (r1, r3, r2, r4, r5 — NL/S1/CMP are deliberately NOT in the
kitchen CURRICULUM; see momsProblems note). It is WORDS-ONLY: no bare equation is
shown (rendering the derived recipe would give the structure away); the child
reads the prose, works it out on a `ScratchCanvas`, and writes the final value.

WHY engine-driven: unlike a fixed binary look-ahead, the kitchen consults the same
`useLessonEngine` (BY POINTER) the rooms use. Per skill (in CURRICULUM order) it
runs **mirror** (bare real-world check of that skill) → **combine** (recipes
chaining earlier skills) → **look-ahead** (the NEXT room's first mirror, only if
unmastered). A wrong answer at the submit boundary lets the engine return a
**RouteToRoom** Decision → a "go learn it" wall pointing at the most-upstream
unmastered node (`wallNodeId` → `NODE_TO_ROOM`), stashing the **stumping recipe**
id (sessionStorage across the hash route) so the routed lesson can later certify
mastery and `ReturnToKitchen` re-poses the exact recipe. A correct look-ahead
reads `masteryFor(node).P_known ≥ 0.6` to decide whether to SKIP that room. The
pip row + `mastered` localStorage list (kitchenProgress, BY POINTER) drive the
progress UI and `firstTask`/`enterStage` navigation.

`slipToErrorSignature` maps the bank's slip codes (`sameBottom`→`add_denominators`,
`leftoverOnly`/`notMixed`→`forced_leftover`, `notSimplified`→`not_simplified`,
coprime `wrongValue`→`add_across_unlike`) onto the engine `ErrorSignature` union.

### 5.1 Mom's-room components (`components/momsroom/**`)
- **`momsProblems.js`** (top-level module) — the kitchen's question bank:
  `CURRICULUM` (r1,r3,r2,r4,r5 order), `ROOM_SKILL` (labels/blurbs), `CHARACTERS`,
  the `Q` recipe objects (each: prop + initState/solvedState + caption + op +
  operands + target + nudgeKey + banter[]), `BANK[roomId]={mirror[],combine[]}`,
  the pure `gradeAnswer`/`targetLabel` graders, and the `enterStage`/`firstTask`/
  `nextRoomOf` flow helpers. WHY pure: grading and flow are deterministic and
  testable.
- **`momsroom/cast.jsx`** — the counter cast SVG characters (`Kid`, `Grandpa`,
  `Cat`) in the shared woodcut skin, plus the `CAST` registry (`expr`:
  idle/asking/happy). The banter owners.
- **`momsroom/props.jsx`** — the state-driven kitchen story-prop SVGs (assets
  1–12: ChocolateBar, CrackerSheet, SausageChain, EggCarton, …), each prop-driven
  by `state` and drawing the shared `Ruler` so the math reads on a number line;
  exposed via the `PROPS[q.prop]` registry.
- **`momsroom/kit.jsx`** — the shared drawing kit: the `C` palette (CSS-var
  backed woodcut skin), `useUID`, `AssetDefs` (hatch patterns/bevels), `Ruler`,
  `Twine`, `STAGE` geometry. WHY: one place locking the kitchen art skin.
- **`momsroom/ScratchCanvas.jsx`** — a thin wrapper over `BlankSlate` with the
  `.mr-*` class names; the per-recipe scratch space (remounted by `key` to reset).

## 6. Mixed Review (`MixedReview`) — interleaved practice (U8)

`MixedReview` is the **Mixed Basket**: interleaved practice across skills the
learner has already met. WHY interleaving: blocked practice lets a child bypass
the hardest real step — deciding WHICH method a problem needs — so each trial
first asks a **type-identification** step ("which recipe is this?") before the
workspace appears; types rotate trial-to-trial (Taylor & Rohrer: interleaving
~doubles delayed-test performance). It is STANDALONE — it calls `generateFor` +
`gradeAnswer`/`answerShape` (generators slice, BY POINTER) directly and does NOT
touch the per-lesson practice controller. Only skills in `skills[]` that map to a
`ROOMS` label are eligible; it needs ≥2 introduced recipes (else an empty-state
prompt). `renderInput` switches on `answerShape` (integer/relation/mixed/
fraction) to render the right Slate or choice buttons.
