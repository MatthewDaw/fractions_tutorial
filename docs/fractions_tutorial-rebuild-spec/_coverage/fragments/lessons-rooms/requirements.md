<!-- FRAGMENT: lessons-rooms / requirements.md
     Per-room learning goals + scaffold ladders (L0–L4). RFC-2119 + Given/When/Then.
     Synthesis assembles into canonical requirements.md. Engine/generators/runtime
     referenced BY POINTER. Each room: skill node, learning goal, the manipulative,
     the L0→L4 ladder, the target misconception, and the engine wiring. -->

# Lessons & Rooms — requirements

## R-LR-0 Cross-cutting room requirements

- **R-LR-0.1** Every lesson room MUST adopt the runtime engine bridge
  (`useLessonScaffold`/`useLessonEngine`, BY POINTER) and MUST call
  `policy.nextDecision` ONLY at the submit/entry boundary (R16). A room MUST NOT
  read or write mastery; mastery is READ via `gate.isMastered` outside the room.
- **R-LR-0.2** Every room MUST map its native stages to `ScaffoldLevel` L0..L4 via
  `runtime/scaffoldMap.js` so the engine sees a stable `max_scaffold_passed`.
- **R-LR-0.3** On a wrong attempt a room MUST report
  `reportAttempt({ correct:false, answerValue, errorSignature, stars:0 })` with
  the room's target-misconception `error_signature` when detectable, else `null`.
- **R-LR-0.4** Every on-screen string MUST be voiced (`say`/`data-vox`) so
  `TapToRead` can read it in-character (constitution §5.9, BY POINTER).
- **R-LR-0.5** Lessons MUST stay inside the CCSS denominator set
  `{2,3,4,5,6,8,10,12,100}` — never 7 or 9 in GENERATED practice (constitution
  §5.6). NOTE: the fixed worked example in R1 uses sevenths deliberately as an
  unfamiliar size for the teaching stages (the contract governs the in-grade
  generator banks, not the single hand-authored anchor).

---

## R-LR-1 R1 · Same Denominators (`AppR1`, node `ADD_SAME_DEN`, room `r1`)

**Learning goal.** When the pieces are the same size, ADD the tops and KEEP the
bottom. After the room the child names a same-denominator sum at a glance
(2/7 + 3/7 = 5/7) without stacking. Worked anchor: **2/7 + 3/7 = 5/7**.

**The wall / target misconception.** The child can stack but can't *say the total
first*; the classic slip is adding the denominators too (2/7 + 3/7 → 5/14),
reported as `error_signature: "add_denominators"`.

**The manipulative.** Two stacks of same-size unit pieces (`Stack`/`Combined`)
dragged together to merge; the denominator is a visibly LOCKED slot (`Lock` +
`BigFrac locked`). The signature rule lives in the hint rail: "add the tops, keep
the bottom".

**Scaffold ladder (native stages → L0..L4).**

| Native stage | Block channel | Write channel | ~Level |
|---|---|---|---|
| 1 Manipulate | drag & merge two stacks; numeric box | none | L0 |
| 2 Bind | merged stack solid | write whole 5/7 on Slate | L1 |
| 3 Fade | blocks dimmed to a check | write only the numerator (den locked) | L2 |
| 4 Workbench | choose pieces from a bin (distractor sizes) | (built, not written) | L2 |
| 5 Numbers | no blocks | write the whole fraction | L3 |
| 6 Applied | none | setup gate (transcribe sum) → write total | L3 |
| sw Show Work | none | ungraded free-form ink (gate on presence) | L3 |
| 7 Words | none | read prose, extract, write total (no equation shown) | L4 |
| practice | engine-paced generated variations | write | (engine) |

**Given/When/Then.**
- **GIVEN** stage 1 with the two stacks apart, **WHEN** the child drags them
  within the merge threshold, **THEN** they merge into one uniform-color stack and
  the tutor asks for the top count; **WHEN** the child writes a numerator equal to
  the denominator (7) **THEN** the room flags `add_denominators` and coaches "the
  bottom is locked".
- **GIVEN** stage 6, **WHEN** the transcribed setup matches {2/7, 3/7} in either
  order, **THEN** `setupOk` unlocks the answer Slate; the answer Slate stays
  disabled until then.
- **GIVEN** stage 7, **THEN** the `QuestionBand` MUST be suppressed (no equation
  shown) so the child extracts the math from prose.
- **GIVEN** the room was opened from a stumping kitchen recipe, **WHEN** the arc
  certifies mastery, **THEN** `onEnd` routes `ReturnToKitchen` back to `MomsRoom`.

---

## R-LR-2 s1 · Taking Away (`AppSubtract`, node `SUB_SAME_DEN`, room `s1`)

**Learning goal.** Subtraction is the mirror of R1: keep the bottom, take the
tops apart. Also teaches decomposition (CCSS 4.NF.B.3b: a fraction is a sum of
unit fractions). Anchor: **5/8 − 2/8 = 3/8** (Numbers stage uses 7/8 − 3/8).
**Prereq:** `ADD_SAME_DEN` (engine graph, BY POINTER).

**The wall / target misconception.** Changing the locked bottom (subtracting the
denominators) → `error_signature: "add_denominators"`.

**The manipulative.** A `UnitRow` of unit pieces: stage 1 BREAKS one solid stack
into 5 separate 1/8 pieces (decompose); stage 2 drags pieces OFF into a "used"
tray (take-away). Denominator visibly LOCKED.

**Scaffold ladder.** 1 Decompose (L0, break the stack — solving IS the break) →
2 Take Away (L1, drag off, write numerator on locked-den Slate) → 3 Numbers (L3,
bare 7/8 − 3/8, numerator only) → 4 Words (L4, story, full Slate) → practice.

**G/W/T.** GIVEN stage 2, WHEN exactly TAKE_N pieces are dragged into the tray
AND the written numerator equals the remainder, THEN award; WHEN the child writes
a changed bottom, THEN flag `add_denominators`. GIVEN stage 4, THEN the
`QuestionBand` is suppressed.

---

## R-LR-3 nl · On the Number Line (`AppNumberLine`, node `FRACTION_ON_LINE`, room `nl`)

**Learning goal.** A fraction is a NUMBER — a single POINT located by cutting 0→1
into `den` equal parts and counting `num` from 0 (CCSS 3.NF.A.2). Stage 3 kills
the "fractions only live between 0 and 1" misconception by placing 5/3 past 1.

**The manipulative.** The shared `NumberLine` with a draggable point. Stage 1
drags the point to 3/4 (snaps to the tick); stage 2 names a fixed point at 2/3
(write on Slate); stage 3 drags 5/3 on a 0→2 line.

**Scaffold ladder.** 1 Place (L0, drag — placed point IS the answer) → 2 Write
(L1/L2, name the marked point; `flipped` error if num/den swapped) → 3 Numbers
(L3, place past 1) → practice.

**G/W/T.** GIVEN stage 1, WHEN the point is released (`info.live===false`) on the
target tick, THEN award + `applyEngineDecision` after a 1.5s celebration; gliding
under the finger does NOT judge. GIVEN stage 2 with num/den flipped, THEN report
`error_signature:"flipped"`.

---

## R-LR-4 cmp · Compare & Check (`AppCompare`, node `COMPARE_BENCHMARK`, room `cmp`)

**Learning goal.** SEE which fraction is bigger and REASON about a sum's size
from benchmarks BEFORE finding a common denominator — the antidote to "added the
denominators" (CCSS 3.NF.A.3d, 4.NF.A.2, 5.NF.A.2 estimate-for-reasonableness).

**The manipulative.** Stacked `NumberLine`s; answers are plain CHOICE BUTTONS
(`< = >` / benchmark / size category), never a Slate.

**Scaffold ladder (3 stages, choice-based).** 1 Compare (two items: same-den
3/8<5/8, then same-num 1/3>1/4) → 2 Benchmark (5/8 nearest of {0, ½, 1}) →
3 Reason (1/2 + 2/3 less/about/more than 1, WITHOUT computing; anchor "more") →
practice.

**G/W/T.** GIVEN stage 1, WHEN both comparison items are answered correctly (only
the LAST reports to the engine), THEN solve the stage. GIVEN a wrong pick, THEN
report a stage-specific signature (`compared_wrong_count`/`ignored_piece_size`/
`wrong_benchmark`/`summed_too_small`/`underestimated_sum`). GIVEN stage 3, the
sum MUST NOT be computed — only its size category is asked.

---

## R-LR-5 m1 · Equal Groups (`AppM1`, node `MULT_EQUAL_GROUPS`, room `m1`)

**Learning goal.** What multiplication MEANS: N equal groups of M, counted by
repeated addition or multiplied. Anchor **3 × 4 = 12**. Commutativity is DEFERRED
(plates never rotated); the equal-group invariant is ENFORCED (extra taps spill
back). **No prereqs** (graph root).

**The manipulative.** `PlateGroup` (tap pelmeni onto plates; cap at SIZE) +
`BowlGroup`/`BlockSandbox` (number mode). Engine answer is `[product, 1]` (whole,
not a fraction — R-B5); multiplication misconceptions fingerprint as `'other'`.

**Scaffold ladder (full 7-stage R1-shaped arc).** 1 Manipulate (fill plates) →
2 Bind (assemble 4+4+4) → 3 Fade (collapse to 3×4) → 4 Workbench → 5 Numbers →
6 Applied (count × size setup gate; REVERSED order earns a gentle nudge, not a
reject — R-M4) → sw Show Work → 7 Words → practice.

**G/W/T.** GIVEN stage 1, WHEN a plate already holds SIZE, THEN extra taps spill
back; WHEN the tally equals GROUPS+SIZE (added the factors), THEN coach
"count the groups". GIVEN stage 6 reversed setup, THEN unlock with a nudge.

---

## R-LR-6 m3 · Times Facts (`AppM3`, node `MULT_FACTS`, room `m3`)

**Learning goal.** Skip-count to the product, then KNOW IT BY HEART — the fluency
layer (a prereq of r2 and r4). Anchor **7 × 8 = 56**. **Prereq:**
`MULT_EQUAL_GROUPS`.

**The manipulative.** `SkipJar` (scoop groups; visible running tally — the
anti-drift device), `SkipLine` (fill blank interior skip-count terms),
`BlockSandbox` (number mode). Each stage reports a fixed `surface_form`
(`facts_visual`/`facts_guided`/`facts_partial`/`facts_bare`/`facts_transfer`) —
the latency/fluency channel.

**Scaffold ladder (7-stage arc).** 1 Manipulate (scoop & read jar) → 2 Bind
(ribbon + write 56) → 3 Fade (fill skip-line) → 4 Workbench → 5 Numbers (bare
fact + explicit ×1 and ×0 micro-prompts, the fluency edge cases) → 6 Applied
(setup gate) → sw Show Work → 7 Words → practice.

**G/W/T.** GIVEN stage 5, WHEN a micro-prompt is cleared, THEN report it as a
correct fluency attempt and re-anchor latency (`problem_present`) WITHOUT
advancing the stage; only the final prompt's award drives stage flow.

---

## R-LR-7 r4 · Simplify (`AppR4`, node `SIMPLIFY`, room `r4`)

**Learning goal.** 8/12 and 2/3 are the SAME amount; simplest form divides top
AND bottom by a shared factor (= dividing by n/n = 1, so the value can't change —
CCSS 4.NF.A.1). Anchor **8/12 → 4/6 → 2/3**. **Prereqs:** `MULT_FACTS` (prepended,
load-bearing), `ADD_UNLIKE_COPRIME` (constitution §5.7, BY POINTER).

**The manipulative.** `GroupBar`: a fixed-width whole partitioned into cells, the
filled run's right EDGE never moving across 8/12, 4/6, 2/3 (the "same amount"
proof). DRAG-and-drop ÷K group/factor chips (portaled drag ghost).

**Scaffold ladder.** 1 Group (L0, drag a group size; reach gcd 1) → 2 Bind (group
+ write equivalent) → 3 Fade (pick shared factor, write) → 4 Numbers (bare 8/12,
lowest terms) → 5 Applied (setup gate: write 8/12 first) → sw Show Work →
6 Words → practice.

**Anti-false-positive rule (R-LR-7.1).** A same-amount but NOT-fully-reduced
answer (e.g. 4/8 for 1/2) MUST be accepted as UX-correct with 2 stars and a gentle
nudge — but on stages whose GOAL is the simplest name (Numbers/Applied/Words) the
ENGINE `correct` MUST be gated on full reduction (`gcd===1`), recording
`error_signature:"not_simplified"` otherwise, so P_known is not inflated.
`scaled_bottom_only` is reported when top/bottom are divided by different numbers.

---

## R-LR-8 r5 · Mixed Numbers (`AppR5`, node `IMPROPER_TO_MIXED`, room `r5`)

**Learning goal.** An improper fraction (>1 whole) becomes a mixed number by
GROUPING every `den` pieces into ONE whole, leaving the remainder as the fraction
part. Anchor **9/7 → 1 and 2/7**. **Prereq:** `ADD_UNLIKE_COPRIME`.

**The manipulative.** A `Block` overflow column dragged into a whole-unit FRAME
(locks at DEN pieces) + a leftover TRAY, on a 0→2 ruler; `BlockSandbox` (Workbench).
Portaled drag ghost.

**Scaffold ladder (non-contiguous arc).** 1 Manipulate (group by touch) → 2 Bind
(group + write mixed number) → 3 Fade (pick how many wholes, write) → W Workbench
→ 4 Numbers (bare 9/7; carries the EXACT-WHOLE TRAP 14/7 = 2 with empty leftover)
→ A Applied (improper-fraction setup gate; 11/4) → sw Show Work → 5 Words (11/4) →
practice.

**G/W/T.** GIVEN any writing stage, WHEN the child writes the improper numerator
as the leftover, THEN report `error_signature:"forced_leftover"`. GIVEN stage 4
with 14/7, WHEN the leftover is left empty (or 0), THEN that is CORRECT (exact
whole). GIVEN a stumping-recipe entry, a certified `ReturnToKitchen` navigates
back to `MomsRoom`.

---

## R-LR-9 r2 · Cross-Multiply (`LessonUnlikeDen` + `r2-unit`, node `ADD_UNLIKE_COPRIME`, room `r2`)
## R-LR-10 r3 · Scale One (`LessonUnlikeDen` + `r3-nonunit`, node `ADD_UNLIKE_NESTED`, room `r3`)

**Shared engine, config-driven.** `LessonUnlikeDen` is ONE component driven by a
lesson config (`lessons/r2-unit.js` / `lessons/r3-nonunit.js`). It derives the
engine node + lessonId from `lesson.framing.kind` (`crossMultiply`→r2/
`ADD_UNLIKE_COPRIME`; `scaleOne`→r3/`ADD_UNLIKE_NESTED`). All math runs through the
pure `unlikeDenMath.js` (BY POINTER below). **r2 prereqs:** `MULT_FACTS`,
`ADD_UNLIKE_NESTED`. **r3 prereqs:** `ADD_SAME_DEN`.

**Learning goal.** Slice both strips to the SAME-SIZE blocks (a common
denominator), join, count. r2 (unit fractions, coprime bottoms — anchor 1/2 + 1/3)
renames BOTH (cross-multiply crossing-arrows). r3 (non-unit, one bottom already
divides the other — anchor 3/8 + 1/4 = 5/8) renames JUST ONE (no crossing arrows).
Some r3 bank sums exceed 1 (improper on purpose — seeds r5).

**The manipulative.** `Plank` strips + a `Knife` to slice (`DenominatorPicker` for
the symbolic common-size choice) → `Combined` joined strip. Handwriting is ON
(answer digits via `InkPad`/`Slate`).

**Scaffold ladder (the L0→L7 rung map `NEXT_BEAT`).** L0 Manipulate (knife slice +
drag-join) → L2 Bind (pick size, join by hand, write) → L4 Fade (generated transfer
pairs; numbers lead, auto-join) → LW Workbench → L5 Ghost (dimmed backdrop, write
all) → L6 Numbers (bare slate) → LA Applied (transcribe-the-sum setup gate) →
SW Show Work → L7 Words (config word-problem bank) → practice. `scaffoldMap` maps
`"showwork"` → L3.

**Two-stage answer gate (R-LR-9.1).** The DENOMINATOR is written and checked first
(must be a common size both strips reach); only then does the NUMERATOR unlock.

**Error signatures (R-LR-9.2).** `errorSignatureFor` distinguishes
`add_denominators` (n=aNum+bNum, d=aDen+bDen), `add_across_unlike` (straight
across), `scaled_bottom_only` (common bottom but numerator not scaled), else
`other`. These feed engine credit assignment (BY POINTER).

**G/W/T.** GIVEN a beat with strips, WHEN the child writes the total before the
blocks match (matched=false), THEN block with "slice both strips first". GIVEN
the LA setup, WHEN the two transcribed fractions equal the addends (either order),
THEN unlock the answer. GIVEN handwriting mode + DEV, every Check POSTs the ink
sample to `/__ink` (ink-recognition slice, BY POINTER).

---

## R-LR-11 Babushka's Kitchen (`MomsRoom`) — word-problem transfer hub

**Learning goal.** Apply each room's skill in real-world word problems (transfer).
The kitchen is the assessor/transfer layer over the FIVE arithmetic rooms
(CURRICULUM = r1, r3, r2, r4, r5). NL/S1/CMP are NOT in the kitchen (no BANK entry).

- **R-LR-11.1** The room MUST be WORDS-ONLY — it MUST NOT render the derived recipe
  equation; the child reads the prose and extracts the math.
- **R-LR-11.2** Per skill the kitchen MUST run mirror → combine → look-ahead beats
  via `enterStage`/`firstTask`; look-ahead probes the NEXT room's first mirror only
  if that room is unmastered.
- **R-LR-11.3** At the submit boundary the room MUST call `judgeAndAdvance` and
  apply the engine `Decision`: a `RouteToRoom` MUST surface a "Learn it" wall to
  `NODE_TO_ROOM[dec.node]` and stash the stumping recipe id; a `ReturnToKitchen`
  MUST re-pose the stumping recipe.
- **R-LR-11.4** A correct look-ahead MUST read `masteryFor(node).P_known ≥ 0.6` to
  decide SKIP vs not-yet.
- **R-LR-11.5** `slipToErrorSignature` MUST map slip codes onto the engine
  `ErrorSignature` union (`sameBottom`→`add_denominators`, etc.).

**G/W/T.** GIVEN a wrong mirror answer, WHEN the engine returns `RouteToRoom`,
THEN show the wall + stash the recipe; GIVEN the routed room certifies mastery and
returns, WHEN re-entering the kitchen, THEN the exact stumping recipe is re-posed.

---

## R-LR-12 Mixed Basket (`MixedReview`) — interleaved practice (U8)

**Learning goal.** Interleave met skills so the child must DISCRIMINATE which
method a problem needs (the type-identification step), not just execute a blocked
drill.

- **R-LR-12.1** Only skills in `skills[]` mapping to a `ROOMS` label are eligible;
  the room MUST require ≥2 introduced recipes (else an empty-state prompt).
- **R-LR-12.2** Each trial MUST run a `identify` phase (pick the recipe type)
  before the `solve` phase reveals the workspace; types rotate per trial.
- **R-LR-12.3** It MUST be standalone — using `generateFor` + `gradeAnswer`/
  `answerShape` directly (generators slice, BY POINTER), never the per-lesson
  practice controller.

**G/W/T.** GIVEN the identify phase, WHEN the wrong type is picked, THEN coach and
stay; WHEN the correct type is picked, THEN reveal the shape-appropriate input.
GIVEN a correct solve, THEN increment the solved count and advance to the next
interleaved trial.

---

## R-LR-13 GenPracticeBoard — the engine-paced `★` practice coda (cross-room)

Every room's final `practice`/`★` stage mounts `GenPracticeBoard skill={NODE}
scaffold={sc}` (component, BY POINTER to runtime via `sc`). It MUST serve
auto-generated variations of the room's skill PACED BY THE ENGINE (re-roll on
correct, fade on a clean streak, transfer probe) and MUST be purely additive — no
teaching stage is touched. The `QuestionBand` MUST be suppressed on this stage
(each minted problem carries its own prompt). It reads `scaffold.prob`, renders the
answer input by `answerShape` (fraction/mixed/integer/relation), and on a wrong
answer MAY show a misconception-specific RETEACH beat (keyed on the engine
`ErrorSignature`) once per problem plus a strategy HINT ladder; a revealed hint is
recorded as `hint_max_rung` so a hinted-correct does NOT count toward the
independence gate / clean fade streak (BY POINTER to engine-core).
