# Requirements

The functional + non-functional requirements per subsystem, in dependency order:
engine-core → generators → runtime-affect → ui-surfaces → lessons-rooms → shell-nav →
harness → ink-recognition. RFC-2119 keywords throughout; numbering follows the
source's KTD/R/U references where present. Glossary terms (BKT, scaffold L0–L4, gate,
transfer probe, …) are defined in `glossary.md`; the non-negotiable constraints these
elaborate are in `constitution.md` §5.

---

# Engine requirements (engine-core)

RFC-2119 behavioral requirements for the pure measurement engine, derived from the
source and the tests under `web/tests/engine/**`.

## BKT (`bkt.ts`, test_bkt)
- The engine MUST raise a node's cold-start prior above `P_L0` when a prereq is strong
  (P>0.5) and lower it when weak, with the result clamped to `priorClamp`
  ([0.05, 0.85]).
- A single correct answer MUST strictly increase `P_known`; a single incorrect MUST
  strictly decrease it.
- `P_known` MUST stay in `pKnownClamp` ([0.01, 0.99]): repeated corrects approach but
  never reach 1.0; repeated incorrects never reach 0.0.
- `bktUpdate` MUST be pure and order-sensitive.
- Golden values MUST match measurement §4.1 to 1e-9 (prior 0.3, two corrects).

## Credit assignment (`credit.ts`, test_credit)
- A correct answer MUST credit ONLY the binding node (`weight 1.0`).
- A wrong `add_across_unlike` on `ADD_UNLIKE_COPRIME` MUST produce a full update to
  `ADD_UNLIKE_COPRIME` PLUS a discounted (`creditDiscount` 0.3) incorrect update to
  `ADD_UNLIKE_NESTED` (the last/direct prereq).
- `scaled_bottom_only` and other binding-only signatures MUST NOT propagate.
- `add_denominators` MUST implicate `ADD_SAME_DEN` specifically.
- The discount factor MUST be applied exactly once and be config-driven.

## Mastery dimensions (`dimensions.ts`, test_dimensions, test_dimensions_u1)
- `isIndependent` MUST require ≥2 hint-free corrects at scaffold ≥ L3 on ≥2 distinct
  problems; distinctness MUST use `problem_id` when present.
- `hasTransferred` MUST require ≥2 hint-free, in-band corrects at scaffold ≤ L3 on ≥2
  distinct `surface_form`s.
- `fluencyOk` MUST return true in soft mode (default) regardless of stats; in hard mode
  MUST require `median_latency ≤ fluencyLatencyTargetMs` and `slope ≤ SLOPE_EPS` (true
  on insufficient data).

## Mastery gate (`gate.ts`, test_gate, test_gate_u1)
- `isMastered` MUST pass ONLY when all four conjuncts hold (P_known ≥ 0.95,
  independence L3+, transfer_passed, fluency_ok); flipping any one MUST close it.
- Pre-calibration (hardMode off), a failing soft-fluency MUST NOT block the gate; the
  hard switch MUST make it block.
- `isMastered` MUST default `fluencyHardMode` to the live `PARAMS` value.
- A populated affect-ish extra field MUST NOT change gate output (firewall).
- MASTERED status MUST be reachable only through `isMastered()` — no setter, no
  `DeclareMastered`.

## Skill graph (`graph.ts`, test_graph)
- `ADD_UNLIKE_COPRIME.prereqs` MUST include `ADD_UNLIKE_NESTED`.
- Every node's `roomId` MUST exist in the real `rooms.js` ROOMS array.
- `mostUpstreamUnmastered` MUST return the deepest unmastered node in topological order.

## Decay / retention (`decay.ts`, test_decay; `measurementReduce`, test_retention_u6)
- A scheduled probe MUST become due after the injected delay; spacing MUST follow
  `PROBE_DELAYS_MS`.
- A failed probe MUST demote the node (`transfer_passed=false`, P_known < 0.95) so it
  is wall-routable again.
- A passed probe MUST record the timestamp and keep P_known/transfer_passed.
- No wall-clock — all time MUST be injected via `now`.
- End-to-end: `mastered_at` MUST be tracked and persist; a `retention_probe` with
  explicit `correct: false` MUST really demote; a probe with no `correct` MUST be
  treated as a pass (back-compat).

## Observation (`observation.ts`, test_observation, test_observation_u4)
- `segment` MUST emit one Observation per `problem_present … judged` span with all
  fields featurized.
- `segment` MUST trust an emitted engine `error_signature` and coerce any non-union
  string to `'other'`.

## Measurement reduce (`measurementReduce.ts`, test_measurement_reduce, _u1)
- The reduce MUST be replayable: identical `(log, now, seedPriors)` MUST reduce
  identically.
- Hint-free L3 corrects on distinct `problem_id`s + `surface_form`s MUST satisfy both
  independence and transfer.

## Wall detection (`wall.ts`, test_wall, test_wall_u3)
- A recipe needing two weak skills (Π P_known < 0.6) MUST fire WALL_HIT; one needing
  only strong skills MUST NOT.
- An actual failed attempt MUST fire WALL_HIT even when predicted_success ≥ θ.
- Binding selection MUST return the deepest unmastered prereq and skip a mastered one;
  θ MUST be `PARAMS.wallTheta`.
- After the routed binding node is mastered, the stumping recipe MUST no longer wall;
  a recipe with a second unmastered required skill MUST still wall.

## Policy (`policy.ts`, test_policy, test_policy_u9)
- 3 clean corrects MUST yield `FadeScaffold`; a hinted correct MUST break the streak.
- 2 errors MUST yield `RaiseScaffold` with `preserveWork=true`.
- Dimensions green except transfer MUST yield `TransferProbe`.
- Gate pass with a stumping recipe MUST yield `ReturnToKitchen{recipe}`.
- Re-entry MUST start one level below `max_scaffold_passed`, floored at L0.
- Every returned Decision MUST include a non-empty rationale; `nextDecision` MUST emit
  only moves present in `legalMoves`.
- A stuck profile MUST yield `EscalateToHuman{reason:"stuck"}` with a populated
  `handoff_packet`; a normal-but-slow profile MUST NOT escalate.
- A disengaged profile MUST yield `EscalateToHuman{reason:"disengaged"}`.
- No path MUST emit `DeclareMastered` (R9).
- With `frustrationScaffold` on, the frustration `RaiseScaffold` MUST still fire but
  with a warm rationale; default off MUST give the identical prior rationale.

## Log + migration (`log.ts`, test_log)
- `appendEvent` MUST be immutable/pure.
- A Signal MUST be present in the log but a no-op for any game-state projection.
- `migrateFromKitchenProgress` MUST seed a mastered room's node with 0.80 and fall back
  to 0.10 when absent.

## Behavioral observation (`observe/**`, test_baseline, test_detectors, test_observe)
- `observeBehavior` MUST emit `Signal`s ONLY and never produce/mutate a `MasteryEstimate`.
- The first `driftControlN` (3) attempts MUST be `observeOnly`.
- `latency_stall` MUST stay observe-only until the per-child baseline is established.
- The baseline MUST fold only CORRECT attempts and act on a per-child residual.

---

# Requirements — Generators

## GEN-R1 — One generator per skill node
The system MUST register exactly one problem generator for each of the 10 engine skill
nodes; `generatorSkills()` MUST return all 10. `hasGenerator(s)` MUST be true for every
registered id and false otherwise.

## GEN-R2 — Correct-by-construction content
Every generated problem MUST be mathematically correct by construction: the generator
MUST compute `answer` from the `operands` it chose. An independent re-derivation MUST
match `answer` for all levels 0–4 and many indices.

## GEN-R3 — Determinism / replay
Generators MUST be pure and MUST NOT call `Math.random()` or `Date.now()`.
`generateFor(skill, { level, index })` called twice with the same args MUST return
deep-equal problems.

## GEN-R4 — Difficulty across scaffold levels
A generator MUST produce a valid problem for every ScaffoldLevel 0–4, difficulty
non-decreasing via `tierForLevel` (L0/L1→0, L2/L3→1, L4→2).

## GEN-R5 — Surface forms & transfer selection
Each generator MUST declare exactly two surface forms. `generateFor` MUST honor an
explicitly requested `surfaceForm` (the TransferProbe path) when a member, else rotate
deterministically by `index`. `surfaceFormsFor` MUST return a defensive copy.

## GEN-R6 — Variety
Within a single level, a run of indices MUST yield a variety of distinct prompts (>3
distinct over 20 indices).

## GEN-R7 — Stable structural problem id
`generateFor` MUST attach a stable `problem_id` of the form
`<skill>:<level>:<surfaceForm>:<index>` when the generator did not supply one.

## GEN-R8 — Unknown skill is a hard error
`generateFor('NOPE')` MUST throw.

## GEN-R9 — Single shared grader
`gradeAnswer(problem, answer)` MUST be the single grading function used by both the
live practice board and the synthetic harness. It MUST mark the canonical correct
answer as `{ correct:true, stars:3, errorSignature:null }` for every skill across
levels 0–4.

## GEN-R10 — SIMPLIFY requires lowest terms
For `SIMPLIFY`, an equal-value answer NOT in lowest terms MUST grade
`{ correct:false, stars:2, errorSignature:'not_simplified' }`; only a fully-reduced
equal-value answer earns 3★.

## GEN-R11 — IMPROPER_TO_MIXED exact-whole trap
For an `exact_whole` problem, a bare whole with an empty/zero leftover MUST grade
correct; a non-zero leftover MUST grade `{ correct:false, errorSignature:'forced_leftover' }`.

## GEN-R12 — Misconception fingerprints map to the engine union
`gradeAnswer` MUST classify "added the bottoms too" into `add_denominators` (like) or
`add_across_unlike` (unlike). Every emitted `errorSignature` MUST be a member of the
engine `ErrorSignature` union; no orphan strings.

## GEN-R13 — answerShape drives the input UI
`answerShape(skill)` MUST return `'mixed'` (IMPROPER_TO_MIXED), `'integer'` (MULT_*),
`'relation'` (COMPARE_BENCHMARK), `'fraction'` (default).

## GEN-R14 — Every skill has a hint ladder
`hintsFor(skill)` MUST return ≥1 non-trivial string rung (>8 chars) for every
registered skill, and `[]` for an unknown skill without crashing. Hints MUST be
strategy reminders, generic across variations (no leaked numbers).

## GEN-R15 — Hint use is a gate signal (defined here, recorded elsewhere)
The hint ladder is designed so a hinted correct does not count toward the clean fade
streak or scaffold-independence (the false-positive guard). This slice DEFINES the
rungs; recording lives in runtime-affect / engine-core.

## GEN-R16 — CCSS denominator contract (delegated)
Generated denominators SHOULD stay inside `{2,3,4,5,6,8,10,12,100}` (constitution
§5.6). NOTE: contract enforcement (`ccss.js::isInGrade`) lives in shell-nav and the
lesson banks, NOT this slice — the generator pools are NOT run through
`filterBankInGrade` and several tier pools DO include 7. See `gotchas.md` G-GOTCHA-3.

---

# Requirements — runtime-affect

Each requirement carries Given/When/Then drawn from the owned tests.

## Runtime hooks

### R-RT-1 — emit stamps and persists every event
`emit` MUST stamp `t = Date.now()` and `actor:'human'` (defaulting `modality:'tap'`),
append via the engine log, and persist. On remount, `loadLog` is called so the log
survives.

### R-RT-2 — judgeAndAdvance emits exactly the answer_submit + judged pair
`judgeAndAdvance` MUST append EXACTLY one `answer_submit` and one `judged` per call and
MUST return a `Decision` with string `kind` + non-empty `rationale`.

### R-RT-3 — judged event carries the full KTD3 Observation metadata
The `judged` payload MUST include `correct`, `error_signature`, `hint_max_rung`,
`self_corrections`, `recognizer_confidence`, `modality`, and an `affect_window` array
that MUST be empty `[]` (the firewall stub).

### R-RT-4 — measurementReduce runs exactly once per submit
`judgeAndAdvance` MUST call `measurementReduce` exactly once per call and update
`masteryFor` (null for an unknown node / before the first submit).

### R-RT-5 — boundary-only decisions (R16)
`nextDecision` MUST be called ONLY inside `judgeAndAdvance`, exactly once per call, and
MUST NOT be called on mount, re-render, or by `emit` alone. (Several `emit` calls with
no submit → not called; two `judgeAndAdvance` → called exactly twice.)

### R-RT-6 — scaffold changes apply on Fade/Raise; U2 certification is synchronous
On `FadeScaffold` the level MUST increase by 1 (clamped at 4); on `RaiseScaffold`
decrease by 1 (floored at 0). `isCertified()` MUST reflect `gate.isMastered` on the
freshly-reduced estimate WITHOUT an extra `nextDecision` call.

### R-RT-7 — practiceFlow maps Decision → next problem (pure)
`nextPractice` MUST be pure and map each Decision kind per the design table;
`otherSurfaceForm` MUST return a different surface form for a multi-form skill. Repeated
`PresentProblem` increments `index` monotonically.

### R-RT-8 — useGeneratedPractice runs the estimator-driven loop through the real engine
MUST serve a valid generated problem, hand a fresh variation after each correct, fade
on a clean streak, transfer-probe a too-fast guesser onto a different surface form, and
MUST NOT exit mid-practice.

### R-RT-9 — useLessonScaffold owns the shared lesson controller
MUST own the identical lesson glue, treat stage keys as opaque, pace in place on a
generated stage, and terminate on certification before any endless re-roll.

### R-RT-10 — scaffoldMap is the single beat↔level map
`toScaffoldLevel` and `toBeatForLevel` MUST be the single beat↔level mapping,
conservative (lowest accurate level), defaulting to `0`/`'1'` for unknown lessons.

### R-RT-11 — Tier-2 nudges are deterministic, idempotent, boundary-safe, nudge-only
`tier2` MUST fire each nudge at most once per window, priority HINT_OFFER >
TAKE_YOUR_TIME > TRANSFER_PROBE_QUEUED, MUST NOT mutate game state, MUST NOT return a
Decision (`kind`), and MUST queue (not fire) a transfer probe.

### R-RT-12 — engineStore bridges runtime to surfaces
`engineStore` MUST be a React-free observable singleton with a stable snapshot identity
until a publish. `publishDecision` MUST append a capped (≤50) decision log and increment
`uiChurn` on Fade/Raise. `useEngineStore` MUST bind it via `useSyncExternalStore`.

## Advisory affect (firewall — constitution §5.2)

### R-AF-1 — composeAffect decides a tier by corroboration under a budget
Pure/immutable, returns a new governor + ledger, quiet (`recommendedTier:'none'`) at
band T1; at T2/T3 logs a pending hypothesis and spends the governor only if `canOffer`.
T3 ⇒ `isDisengaged===true`, severity `'high'`. Exhausted budget ⇒ `'none'` and the
ledger entry is `observeOnly`.

### R-AF-2 — corroboration invariant (no single channel intervenes)
`computeComposite` MUST cap any single channel at `maxChannelPoints (2)`, below `t2
(3)`, so one channel CANNOT cross from T1 to T2; ≥2 channels MUST agree. `observeOnly`
signals MUST NOT score. (`idle`+`orphaned_interaction`→T2; +`latency_stall`→T3;
`idle`+`hintState>hintSpendRung`→T2.)

### R-AF-3 — AffectState valence firewall (no emotion inference)
`deriveAffect`/`smoothAffect` MUST keep `valence==='neutral'` regardless of signals;
dimensions in `[0,1]`; engagement drops as the composite rises; smoothing damps a spike.

### R-AF-4 — governor caps and backs off without manufacturing disengagement
MUST exhaust after `maxOffers`, block until the cooldown elapses, grow the cooldown per
dismissal; an accepted offer MUST reset the backoff. `register*` MUST be immutable.

### R-AF-5 — precision ledger is the cost-weighted counter-metric
`record`/`resolve`/`report` MUST be immutable; precision = confirmed over resolved
(pending excluded); cost-weighted precision MUST punish a false HIGH-severity
escalation harder; `observeOnly` logged but excluded; per-trigger precision reported.

### R-AF-6 — self-report is a first-class signal AND the gold label
`evaluateSelfReport` MUST discard the actionable signal when behavior flatly
contradicts the tap, but MUST ALWAYS return the raw `goldLabel`.
`applySelfReportToLedger` MUST resolve pending non-observeOnly hypotheses (`'tricky'`
confirms, `'easy'` contradicts) and leave resolved entries untouched.

---

# Engine model surfaces — requirements (ui-surfaces)

### R-UI-1 — Single mount, universal coverage
The system MUST mount `EngineSurfaces` exactly once (in `Shell.jsx`), outside the
scaled `#stage`, subscribed to the global store, with NO per-lesson wiring.

### R-UI-2 — Rationale banner answers "why did this change?" (KTD8)
WHEN the engine publishes a *change* decision AND the surfaces are `active`, THE system
MUST display the one-line rationale in a dismissible banner. A routine `PresentProblem`
MUST NOT show the banner (but is still recorded in the log). A different non-empty
rationale after dismissal MUST re-appear. Inactive (title / world) MUST NOT show.

### R-UI-3 — Tier-2 nudge toast is transient and work-preserving
WHEN a nudge is published AND active, THE system MUST show a status toast with
`data-nudge-type`, auto-dismiss after 5000 ms, also manually dismissible. It MUST NOT
restructure the workspace.

### R-UI-4 — Mastery inspector exposes the live model + counter-metrics
THE inspector MUST render, per node, P(known), the four gate conditions, a status
label, hint dependence, plus session counter-metrics (UI churn, dependence,
false-positive rate) and the decision log (newest first). MUST start collapsed; MUST
compute mastery status inline (no engine import). Shell MUST gate it to
`import.meta.env.DEV`; the component's toggle remains available in any build.

### R-UI-5 — Affect probe: consented, reader-safe, in-fiction, firewalled
WHEN rendered with `open`, MUST present Babushka's prompt with two large tap targets,
each a visible TEXT label (not emoji alone), plus a skip. Tagged
`data-vox-speaker="Babushka"`. A face tap calls `onReport`; skip calls `onDismiss`. MUST
be purely presentational (no engine read/write).

### R-UI-6 — Surfaces are a pure display layer
NONE of the four surfaces MAY import from `web/src/engine/**`; they MUST consume data
via props or the store and MUST NOT mutate engine state.

### R-UI-7 — Surfaces live in viewport space, above the stage
The stylesheets MUST position banner/toast/inspector with `position: fixed` in viewport
coordinates, clearing the lesson's bottom bar; the probe MUST overlay its parent
(`position: absolute; inset: 0`).

---

# Lessons & Rooms — requirements

## R-LR-0 Cross-cutting room requirements
- **R-LR-0.1** Every room MUST adopt the runtime engine bridge and MUST call
  `policy.nextDecision` ONLY at the submit/entry boundary (R16). A room MUST NOT read or
  write mastery.
- **R-LR-0.2** Every room MUST map its native stages to `ScaffoldLevel` L0..L4 via
  `runtime/scaffoldMap.js`.
- **R-LR-0.3** On a wrong attempt a room MUST report
  `reportAttempt({correct:false, answerValue, errorSignature, stars:0})` with the
  room's target-misconception signature when detectable, else `null`.
- **R-LR-0.4** Every on-screen string MUST be voiced (`say`/`data-vox`) for `TapToRead`.
- **R-LR-0.5** Lessons MUST stay inside the CCSS denominator set in GENERATED practice
  (constitution §5.6). NOTE: R1's fixed worked example uses sevenths deliberately as an
  unfamiliar size for the teaching stages.

## R-LR-1 R1 · Same Denominators (`AppR1`, node `ADD_SAME_DEN`, room `r1`)
**Goal.** Same size → ADD the tops, KEEP the bottom (anchor 2/7 + 3/7 = 5/7).
**Wall.** Adding the denominators too → `error_signature: "add_denominators"`.
**Manipulative.** Two `Stack`s dragged to merge; denominator a visibly LOCKED slot.
**Ladder.** Manipulate(L0) → Bind(L1) → Fade(L2) → Workbench(L2) → Numbers(L3) →
Applied(L3 setup gate) → Show Work(L3 ungraded ink) → Words(L4, QuestionBand
suppressed) → practice.
**G/W/T.** A numerator equal to the denominator (7) → flag `add_denominators`. Stage 6
transcribed setup matching {2/7,3/7} either order → `setupOk` unlocks the answer Slate.
A stumping-recipe entry → certified `ReturnToKitchen`.

## R-LR-2 s1 · Taking Away (`AppSubtract`, node `SUB_SAME_DEN`, room `s1`)
**Goal.** Mirror of R1: keep the bottom, take the tops apart; also decomposition
(4.NF.B.3b). Anchor 5/8 − 2/8 = 3/8. **Prereq** `ADD_SAME_DEN`. **Wall.** Subtracting
the denominators → `add_denominators`. **Manipulative.** `UnitRow`: stage 1 BREAKS a
stack into unit pieces; stage 2 drags pieces into a "used" tray. **Ladder.** Decompose
(L0) → Take Away (L1) → Numbers (L3) → Words (L4) → practice.

## R-LR-3 nl · On the Number Line (`AppNumberLine`, node `FRACTION_ON_LINE`, room `nl`)
**Goal.** A fraction is a NUMBER — a POINT (3.NF.A.2); stage 3 places 5/3 past 1.
**Manipulative.** `NumberLine` with a draggable point. **Ladder.** Place (L0, point IS
the answer) → Write (L1/L2; `flipped` error if num/den swapped) → Numbers (L3) →
practice. Gliding under the finger does NOT judge; release on the target tick judges.

## R-LR-4 cmp · Compare & Check (`AppCompare`, node `COMPARE_BENCHMARK`, room `cmp`)
**Goal.** SEE which is bigger and REASON about a sum's size from benchmarks (3.NF.A.3d,
4.NF.A.2, 5.NF.A.2). **Manipulative.** Stacked `NumberLine`s; answers are plain CHOICE
BUTTONS. **Ladder (3 choice-based).** Compare → Benchmark (nearest of {0,½,1}) → Reason
(1/2 + 2/3 less/about/more than 1, WITHOUT computing) → practice.

## R-LR-5 m1 · Equal Groups (`AppM1`, node `MULT_EQUAL_GROUPS`, room `m1`)
**Goal.** N equal groups of M (anchor 3×4=12). Commutativity DEFERRED; equal-group
invariant ENFORCED (extra taps spill back). **No prereqs.** **Manipulative.**
`PlateGroup` + `BowlGroup`/`BlockSandbox`; engine answer `[product,1]`; misconceptions
fingerprint as `'other'`. **Ladder.** Full 7-stage R1-shaped arc (reversed Applied setup
earns a gentle nudge, not a reject).

## R-LR-6 m3 · Times Facts (`AppM3`, node `MULT_FACTS`, room `m3`)
**Goal.** Skip-count then KNOW BY HEART — the fluency layer (anchor 7×8=56). **Prereq**
`MULT_EQUAL_GROUPS`. **Manipulative.** `SkipJar` (visible tally — anti-drift),
`SkipLine`, `BlockSandbox`. Each stage reports a fixed `surface_form`. **Ladder.**
7-stage arc; Numbers stage carries explicit ×1 and ×0 micro-prompts (re-anchor latency
WITHOUT advancing the stage).

## R-LR-7 r4 · Simplify (`AppR4`, node `SIMPLIFY`, room `r4`)
**Goal.** Same amount; divide top AND bottom by a shared factor (4.NF.A.1; anchor 8/12 →
4/6 → 2/3). **Prereqs** `MULT_FACTS` (prepended, load-bearing), `ADD_UNLIKE_COPRIME`.
**Manipulative.** `GroupBar` (filled run's right EDGE never moves) + drag-and-drop ÷K
chips. **Anti-false-positive (R-LR-7.1).** A same-amount but NOT-fully-reduced answer MUST
be UX-correct with 2 stars + a gentle nudge — but on stages whose GOAL is the simplest
name the ENGINE `correct` MUST be gated on `gcd===1`, recording `not_simplified`
otherwise. `scaled_bottom_only` when top/bottom divided by different numbers.

## R-LR-8 r5 · Mixed Numbers (`AppR5`, node `IMPROPER_TO_MIXED`, room `r5`)
**Goal.** GROUP every `den` pieces into ONE whole, remainder as the fraction part (anchor
9/7 → 1 and 2/7). **Prereq** `ADD_UNLIKE_COPRIME`. **Manipulative.** A `Block` overflow
column dragged into a whole-unit FRAME (locks at DEN) + a leftover TRAY. **Ladder.**
Manipulate → Bind → Fade → Workbench → Numbers (carries the EXACT-WHOLE TRAP 14/7 = 2
with empty leftover) → Applied → Show Work → Words → practice. Writing the improper
numerator as the leftover → `forced_leftover`.

## R-LR-9/10 r2 · Cross-Multiply / r3 · Scale One (`LessonUnlikeDen`, config-driven)
**Shared engine.** `LessonUnlikeDen` is ONE component driven by `lessons/r2-unit.js` /
`lessons/r3-nonunit.js`; it derives node + lessonId from `lesson.framing.kind`
(`crossMultiply`→r2/`ADD_UNLIKE_COPRIME`; `scaleOne`→r3/`ADD_UNLIKE_NESTED`). All math
through pure `unlikeDenMath.js`. **r2 prereqs** `MULT_FACTS`, `ADD_UNLIKE_NESTED`; **r3
prereqs** `ADD_SAME_DEN`. **Goal.** Slice both strips to the SAME-SIZE blocks, join,
count (r2 anchor 1/2 + 1/3; r3 anchor 3/8 + 1/4 = 5/8; some r3 sums exceed 1 on purpose).
**Manipulative.** `Plank` + `Knife` (`DenominatorPicker`) → `Combined`. Handwriting ON.
**Two-stage gate (R-LR-9.1).** The DENOMINATOR is written/checked first; only then the
NUMERATOR unlocks. **Signatures (R-LR-9.2).** `errorSignatureFor` distinguishes
`add_denominators`, `add_across_unlike`, `scaled_bottom_only`, else `other`. In
handwriting mode + DEV, every Check POSTs the ink sample to `/__ink`.

## R-LR-11 Babushka's Kitchen (`MomsRoom`) — word-problem transfer hub
The transfer/assessor layer over the FIVE arithmetic rooms (CURRICULUM = r1, r3, r2, r4,
r5; NL/S1/CMP not in the kitchen).
- **R-LR-11.1** WORDS-ONLY — MUST NOT render the derived recipe equation.
- **R-LR-11.2** Per skill MUST run mirror → combine → look-ahead; look-ahead probes the
  NEXT room's first mirror only if unmastered.
- **R-LR-11.3** At the submit boundary MUST call `judgeAndAdvance` and apply the
  `Decision`: a `RouteToRoom` surfaces a "Learn it" wall to `NODE_TO_ROOM[dec.node]` and
  stashes the stumping recipe id; a `ReturnToKitchen` re-poses the stumping recipe.
- **R-LR-11.4** A correct look-ahead MUST read `masteryFor(node).P_known ≥ 0.6` to
  decide SKIP vs not-yet.
- **R-LR-11.5** `slipToErrorSignature` MUST map slip codes onto the engine union.

## R-LR-12 Mixed Basket (`MixedReview`) — interleaved practice (U8)
- **R-LR-12.1** Only skills in `skills[]` mapping to a `ROOMS` label are eligible;
  requires ≥2 introduced recipes (else empty-state prompt).
- **R-LR-12.2** Each trial MUST run an `identify` phase before the `solve` phase reveals
  the workspace; types rotate per trial.
- **R-LR-12.3** MUST be standalone — `generateFor` + `gradeAnswer`/`answerShape`
  directly, never the per-lesson practice controller.

## R-LR-13 GenPracticeBoard — the engine-paced `★` practice coda (cross-room)
Every room's final `practice`/`★` stage mounts `GenPracticeBoard skill={NODE}
scaffold={sc}`. MUST serve engine-paced auto-generated variations (re-roll on correct,
fade on a clean streak, transfer probe), be purely additive, suppress the QuestionBand,
render the answer input by `answerShape`, and MAY show a misconception-specific RETEACH
beat keyed on the engine `ErrorSignature` plus a strategy HINT ladder; a revealed hint
is recorded as `hint_max_rung` so a hinted-correct does NOT count toward the gate.

---

# Requirements — shell-nav

> Source of truth: `Shell.jsx`, `TitleScreen.jsx`, `WorldMap.jsx`, `EmptyRoom.jsx`,
> `RoomIntro.jsx`, `SettingsScreen.jsx`, `SettingsButton.jsx`, `ConceptMap.jsx`,
> `BackgroundMusic.jsx`, `TapToRead.jsx`, `settings.js`, `music.js`, `audioBus.js`,
> `voice.js`, `voiceLines.js`, `speechify.js`, `kitchenProgress.js`, `rooms.js`,
> `conceptTree.js`.

## SHELL-1 — Bootstrap & mount
The app SHALL bootstrap from `index.html` (`#fit > #stage > #root`) → `main.jsx`
(`createRoot(...).render(<Shell/>)`), importing `tokens.css`/`lesson.css`/`world.css`
first. There SHALL be NO router library; routing is hand-rolled hash routing in
`Shell.jsx`.

## SHELL-2 — Stage scaling (1280×800 fit)
Every screen SHALL render in a fixed 1280×800 space; `useStageFit` scales `#stage`
uniformly by `min(viewportW/1280, viewportH/800)`. The fit MUST use
`window.visualViewport` (NOT `innerHeight`) so iOS/iPadOS dynamic-toolbar correctness
holds. `#fit` is `position:fixed`, sized to the scaled footprint and centered. Re-fits
on `resize`/`orientationchange`/`visualViewport` resize/scroll.

## SHELL-3 — Hash routing
Route = `hash.replace(/^#\/?/, "")` lowercased, default `"title"`. Subscribe to
`hashchange`. `go(r)` sets the hash. Recognized routes: `title`(''), `world`, `mom`,
`review`, `settings`, `concepts`, and the 10 room ids; unrecognized → world map.

## SHELL-4 — Mastery load at the boundary
On mount and every return to `world`/`title`/`review`, `loadMasteryMap()` SHALL recompute
the map: `loadLog()` → `migrateFromKitchenProgress()` seeds →
`measurementReduce(log, Date.now(), seedPriors)`. MUST return `null` on empty/error.
`Date.now()` is injected here.

## SHELL-5 — First-entry room intro gating
The FIRST time a room with an `intro` is entered in a session, the shell SHALL render
`RoomIntro` first. "Seen" state is a session-scoped in-memory `Set` (NOT persisted). A
room with an intro receives `onRewatchIntro` (deletes the room from `seenIntros`).

## SHELL-6 — Scaffold-entry computation
On entering a room, compute `entryScaffoldFor(nodeId, masteryMap)` → `toBeatForLevel(...)`
→ `initialBeat`. No mastery data → `0` (most-supported beat).

## SHELL-7 — Wall→room→return handoff
The kitchen MAY stash a `stumpingRecipeId` in `sessionStorage`; the shell SHALL read it
ONCE on room entry, immediately remove it, and pass it as `stumpingRecipe` (which makes
`ReturnToKitchen` legal). `onReturnToKitchen` SHALL navigate back to `mom`.

## SHELL-8 — Retention probe settle (U7)
A room opened whose node has a probe due → mark it in `probingNodeRef`. On the next
return to world/title/review, re-load the fresh map and call
`recordRetentionProbe(node, isMastered(fresh))` exactly once, then clear the ref.

## SHELL-9 — Always-mounted global surfaces
`BackgroundMusic` SHALL be mounted ONCE and not unmount on navigation; `TapToRead` once
at the root; `EngineSurfaces` with `active` only inside a lesson or `mom`, and
`showInspector` only when `import.meta.env.DEV`. A FAB bar (Concepts + Settings) SHALL
show ONLY on `title`/`world`.

## TITLE — Title screen
Route `''`/`title` renders `TitleScreen`; START → `world`. On mount the Cook greets via
`say("titleWelcome")`; if autoplay blocked, retried once on first gesture (no
double-speak).

## WORLDMAP — Lesson map
TWO levels: three shelf nodes (STRANDS) + a SUBMENU of one strand's lesson cards.
Per-room status from `masteryStatusFor` → "Mastered"/"In progress"/"Cook again"
(needs-review)/Ready/Coming soon. `suggestedNextRoom` highlighted with a "Next" badge.
An all-mastered shelf shows "Done" + `mastered/total`. The kitchen medallion opens `mom`;
a "Mixed Basket" button opens `review`. `masteryMap` null → no-engine-data state.

## EMPTYROOM
An unbuilt room renders `EmptyRoom` (lesson number, title, back to the kitchen map). All
ten are `built: true` today (fallback).

## ROOMINTRO — Intro video + narration
Embeds the room's `intro` HTML in a same-origin `<iframe>`, narration GATED to the
video's playhead (`localStorage[STAGE_PERSIST_KEY + ":t"]`, reset to `"0"` before each
remount). A cue begins only when the playhead passes BOTH its `gate` AND `prevLineEnd +
pause`. Audio plays at `voiceVol/100`; autoplay-blocked clips advance on a duration
estimate. Completion is timer-driven (`introDurationMs`, default 35000ms), pause-aware;
"Skip ▸" ends immediately. Pause/Play freezes BOTH video and clip. The transcript pane
lists every cue; clicking seeks. The end card offers "Watch again"/"Continue". A mute
toggle silences via volume.

## SETTINGS — Settings screen + button
Overlay-style; returns to the last non-overlay route on "Done". Exactly three controls,
persisted via `settings.js` and applied LIVE: Voice lines volume → `voice.js`; Music
volume (0=muted) → `BackgroundMusic`; How you answer (`stylus`/`typing`) →
`components/Slate`. Subscribes to `subscribeSettings`. Sliders keyboard-operable (Arrow
±5, Home=0, End=100) with `role="slider"`. `SettingsButton` navigates to `#/settings`.

## CONCEPTMAP — Concept Mastery Map
Overlay-style. Presents `Concept → Skill node → Atomic card` with NO grade level shown.
Mastery MEASURED only at the atomic-card grain and rolls up. Header indicates live vs
placeholder (`isLiveMastery()`). Banding: strong ≥0.85, partial ≥0.5, weak ≥0.15, else
empty.

## AUDIO-1 — Music routing
`BackgroundMusic` plays the scene's track list (`MUSIC[scene]`; single loops, multi
rotates on `ended`); scene from `sceneFor(route, showingIntro)` (`mom`→kitchen,
rooms→`rooms`, intro→`null`, else `map`). Plays UNLESS muted / no tracks / a voice active;
fades out+pauses under narration and back in. Volume tracks live; autoplay retried on
first gesture.

## AUDIO-2 — Voice channel (single)
Exactly ONE voice plays app-wide; a new line cuts the last. `say(keyOrText, {speaker})`
resolution: baked clip key → exact baked-line text → arbitrary text via dev `/api/tts`.
NO robotic Web Speech fallback — on failure SILENT (constitution §5.9). Re-requesting the
SAME source while playing TOGGLES it off. Brackets each utterance with
`audioBus.voiceStart/voiceEnd`. `readAloud()` MUST NOT speak within 250ms of an
app-driven `say()`.

## AUDIO-3 — Tap-to-read affordance
`TapToRead` injects a speaker button next to each readable copy block in `#stage` (via a
debounced `MutationObserver`), skipping interactive/manipulative surfaces and
`[data-novox]`. Pressing reads the block (`[data-vox]` clip or synthesized own-text,
voiced by nearest `[data-vox-speaker]`, default `cook`); re-press stops; capture-phase.

## VOICE-TEXT — Speech normalization
`speechify()` spells fractions, reads `№`→"number", strips UI glyphs, collapses
whitespace; the normalized string is ALSO the TTS cache key. `voiceLines.js` is the
single source of truth for `LINES`, `SPEAKERS` (with `voiceEnv` env-var pointers),
`MEOW_SFX`, and per-key speaker routing (`speakerOf` prefix rules). The Cat is NOT a
speaker.

---

# Harness — requirements

## R-HARN-1 — Determinism (replay-exact)
NO `Math.random`, NO `Date` anywhere in `web/src/harness/**`. All randomness from
`personaRng(persona_id, seed, step)`; time an injected synthetic clock. A fixed
`(persona, skill, seed, flags)` run twice MUST serialize byte-identically; `baseline
--seed N` runs the sweep twice and sets `process.exitCode = 1` on mismatch.

## R-HARN-2 — Bind to the engine PUBLIC API only
All engine/generator/runtime access MUST go through `engineApi.js`.

## R-HARN-3 — Persona / engine parameter disjointness
No file under `personas/**` may contain the substring `engine/params` (a lint enforces
it). `trainFamily()` and `heldOutFamily()` MUST share NO persona ids; held-out
`learnRate`/`pSlip` minima MUST exceed train maxima.

## R-HARN-4 — Faithful mirror of the live submit boundary
`runSession` MUST call `nextDecision` ONLY at the per-attempt boundary, mirror the EMPTY
`recentBehavior` channel, and MUST NOT invent observations. The disengaged-escalation
trigger MUST remain unreachable (reported as a finding, not patched).

## R-HARN-5 — Inverse-error fingerprinting
`inverseAnswer` MUST compute the wrong answer from the REAL operands so the engine
fingerprints the intended `ErrorSignature`, expose ≥2 misconceptions per skill, and
NEVER return the correct value for a misconception.

## R-HARN-6 — Counter-metric pairing (KTD5)
A `MetricsRecord` MUST throw if a headline metric is present without ALL its required
counters.

## R-HARN-7 — Oracle independence
`τ_latent` MUST be configurable and DISTINCT from `gateThreshold` (0.8 vs 0.95); the
plausible-compute floor distinct from the latency floor (1500 vs 1200). Results SHOULD be
a curve over `τ_latent`.

## R-HARN-8 — Verify-first positive control
MUST catch a KNOWN-present defect (the fluencyOk soft gate) before any red-team claim is
trusted; a blind externally-injected defect MUST be caught by the SAME oracle code path.

## R-HARN-9 — Metamorphic invariants
Surface-form permutation preserves the verdict; one extra correct never lowers final
P_known; a strictly-higher-slip twin never gates earlier.

## R-HARN-10 — Sealed held-out judge (anti-gaming)
`runLoop` MUST bless `REAL` ONLY when the SEALED held-out family improved on a target
metric AND the guardrail did not degrade AND the deflated bar held. Train-only
improvement → `GAMING`. The inert 002 flags → `NO_CHANGE`. The held-out judge runs a
distinct seed lineage.

## R-HARN-11 — Champion replay fixtures
`distillChampions` MUST emit minimal `{latent, seed}` keys; `replayChampions` MUST flag a
champion REGRESSED when its replay reproduces a false-mastery flip. A fixture with no
skill MUST be non-regressing but visibly malformed.

## R-HARN-12 — Pure-projection documents
Every emitted document EXCEPT research notes MUST be a pure projection of the committed
tapes (+ static audit probes); `report --seed N` MUST reproduce them byte-for-byte. Every
certification claim MUST be scoped to "the engine path".

## R-HARN-13 — Quarantine isolation
`quarantine/chaos.js` and `quarantine/llmDiscriminator.js` MUST import nothing from
`search.js`/`recursiveLoop.js`, carry their own seed, feed nothing back. Chaos MUST NOT
mutate the original tape bytes; the LLM discriminator MUST be JUDGE-ONLY and degrade
gracefully.

## R-HARN-14 — Dashboard parity + honesty
MUST render the SAME tape projections the CLI writes, be demonstrable without a live run,
label its scope engine-path-only, and show a divergence banner on a diverging replay
(stored tape stays authoritative).

## R-HARN-15 — Proof suite (skeptic-facing)
The proof suite (`web/tests/proof/**`) MUST assert against the REAL engine with every
cited threshold read live from `params.ts`: support triggers exactly when it should,
goes away once the student course-corrects, and the policy unlocks the next level only on
demonstrated mastery.

---

# Ink-recognition — requirements

## R-INK-1 — Digits-only scope
MUST recognize only the numerals `0–9`. MUST NOT attempt the fraction bar, `+`, `=`, or
any operator/layout (printed by the UI, never drawn). WHY: keeps the problem 1-D with no
expression parser.

## R-INK-2 — Fully on-device and offline
MUST run entirely in the browser; the model + onnxruntime-web WASM MUST be static assets;
NO network at recognition time.

## R-INK-3 — Public API surface
MUST export `recognizeDigit(strokes) -> Promise<{digit, conf, confident}>`,
`recognizeNumber(strokes, opts?) -> Promise<{text, digits, conf, confident}>`, plus debug
`modelStatus()` and `classifyDebug(strokes, scale)`. `strokes` is `Array<Array<[x,y]>>`.

## R-INK-4 — Non-blocking model load with graceful fallback
Before the ONNX session is ready, calls MUST fall back to the `$P` matcher without
blocking. A load failure MUST be captured (`LOAD_ERR`, warn) and MUST NOT throw; `$P`
continues serving.

## R-INK-5 — MNIST-faithful preprocessing
MUST rasterize to a 28×28 grid matching MNIST: white ink on black, ~20px box (aspect
preserved), centered by center-of-mass at (14,14). Pixels fed to mnist-12 MUST be raw
`0..255` (× `INPUT_SCALE`=255). WHY: preprocessing fidelity is the dominant accuracy lever.

## R-INK-6 — Multi-digit segmentation
`recognizeNumber` MUST split a single-box multi-digit scribble left-to-right. "42" with a
gap → 2 groups (whitespace-band cut); "42" with no gap → 2 (`forceSplitWide`); a single
wide digit → 1; a multi-stroke single digit → 1. Whole strokes MUST be kept intact.

## R-INK-7 — Confidence semantics
Each digit carries a `[0,1]` `conf` + boolean `confident`. CNN: `conf` = softmax of
argmax; `confident = conf > 0.5`. `$P`: `confident` requires `bestScore < 0.45` AND
`margin > 0.06`. `recognizeNumber`: `confident` = ALL confident; `conf` = **min**.

## R-INK-8 — Model training reproducibility (ad hoc, out of band)
`train_mnist.py` MUST remain runnable to (re)produce a digit model artifact. NOTE: it
trains a pure-JS MLP and writes `public/mnist.json` — it does NOT emit the
`mnist-12.onnx` actually loaded at runtime (see `gotchas.md` G-INK-3). The runtime model
is the pretrained ONNX-zoo "mnist-12".

## R-INK-9 — Dev ink-capture inspection (pointer)
`tools/dump-ink.mjs` reads `ink-log.jsonl` (written by the dev-only `/__ink` endpoint)
and writes per-cell PNGs + a recognizer-guess-vs-correct summary to `tools/ink-dump/`.
