# Tasks — global rebuild plan

The full, dependency-ordered plan to rebuild `fractions_tutorial` from this spec. Build the slices top-to-bottom: the pure engine is the DAG root, then the deterministic generators, then the React runtime + advisory affect layer, then the engine UI surfaces, then the app shell/router, then the lesson rooms + kitchen, then the offline harness, then handwriting recognition, then the build-config leftovers. Within each slice, keep the per-slice task numbering below. Every engine file carries the purity header (no React, no wall-clock); see `gotchas.md` and `constitution.md` §5.

## engine-core
<!-- slice: engine-core — fragment for tasks.md -->

A buildable, dependency-ordered task list to re-create the pure measurement
engine from scratch. All files are TypeScript under `web/src/engine/**`; callers
import them with explicit `.js` specifiers (resolved by `resolveTsFromJs` — see
constitution §2). Each task lands with its named test under
`web/tests/engine/**`. Run via `npm test` (vitest) from `web/`.

> Every engine file MUST carry the purity header (no React, no wall-clock) and
> obey the affect firewall. See gotchas.md.

1. **`types.ts`** — author the wire DTOs (Modality, Actor, ScaffoldLevel, Action,
   Signal, Event, ErrorSignature, Observation, FluencyStats, MasteryEstimate,
   the 7 Decision variants + union, SkillNode). No tests of its own; it is the
   contract every later test imports.

2. **`params.ts`** — `EngineParams`/`BktParams`/`EscalationParams` interfaces +
   the `PARAMS` constant (values per env-and-config.md).

3. **`graph.ts`** — the 10 `SkillNode` defs in topological order, `NODE_MAP`,
   `getNode`/`prereqsOf`/`allNodes`/`mostUpstreamUnmastered`, node constants.
   **PREPEND MULT_FACTS** to the unlike/simplify prereq lists (gotchas.md §1).
   Test: `test_graph` (prereqs, roomId↔rooms.js, mostUpstreamUnmastered, edges).

4. **`bkt.ts`** — `coldStart` (prereq propagation + priorClamp) and `bktUpdate`
   (correct/incorrect + learn step + pKnownClamp + divide-by-zero guard).
   Test: `test_bkt` (incl. golden values to 1e-9, clamps, order-sensitivity).

5. **`dimensions.ts`** — `computeFluency`, `fluencyOk`, `isIndependent`,
   `hasTransferred`, `computeHintDependence` + the module-local thresholds.
   Tests: `test_dimensions`, `test_dimensions_u1` (problem_id / surface_form seam).

6. **`gate.ts`** — `isMastered` (4 conjuncts, default hardMode = live PARAMS) +
   `gateConditions`. Tests: `test_gate`, `test_gate_u1`.

7. **`credit.ts`** — `ERROR_PREREQ_IMPLICATION`, `resolveImplicatedPrereq`
   (`add_across_unlike` → last prereq — `credit.ts:97`), `assignCredit`.
   Test: `test_credit`.

8. **`mastery.ts`** — `buildMasteryEstimate` (assemble 4 dims +
   max_scaffold_passed + the L3 independence reconciliation), re-export as
   `assembleMasteryEstimate`. (Covered via reduce + gate tests.)

9. **`observation.ts`** — `segment` (attempt boundaries, latency, hint rung,
   self-corrections, modality, recognizer_confidence, too_fast_correct, the
   error_signature trust seam + coercion) and `classifyErrorSignature`.
   Tests: `test_observation`, `test_observation_u4`.

10. **`decay.ts`** — `PROBE_DELAYS_MS`, `scheduleRetentionProbe`, `isProbeDue`,
    `applyProbeResult` (pass vs fail demotion). Test: `test_decay`.

11. **`log.ts`** — pure `appendEvent`/`foldLog`; adapter `loadLog`/`saveLog`
    (`moms-engine-log-v1`, error-swallowing); `migrateFromKitchenProgress`
    (legacy `moms-kitchen-progress-v1` → SeedPriors). Test: `test_log`.

12. **`measurementReduce.ts`** — the whole fold (two-pass prior init → segment →
    bind node_id → credit+BKT → mastered_at stamping → assemble → retention-probe
    folding). Tests: `test_measurement_reduce`, `test_measurement_reduce_u1`
    (reachability + replay-stability), `test_retention_u6` (end-to-end decay).

13. **`wall.ts`** — `RecipeShape`, `requiredSkills` (shape → skill inference, no
    momsProblems import), `detectWall`, `detectFirstWall`. Tests: `test_wall`,
    `test_wall_u3` (binding-gap).

14. **`policy.ts`** — `PolicyState`/`RecentBehavior`, `legalMoves`,
    `nextDecision` (7-priority chooser), `checkEscalationTriggers` (stuck +
    disengaged) + handoff packet. Tests: `test_policy`, `test_policy_u9`
    (frustration flag).

15. **`observe/baseline.ts`** — `LatencyBaseline`, `BASELINE_PARAMS`, EWMA
    update, residual + `plausibleFloorMs`. Test: `observe/test_baseline`.

16. **`observe/detectors.ts`** — `DETECTOR_PARAMS`, `BehaviorContext`,
    `contextHash` (FNV-1a), the five detectors. Test: `observe/test_detectors`.

17. **`observe/index.ts`** — `OBSERVE_PARAMS`, span extraction, `observeAttempt`,
    `observeBehavior` (baseline fold + cold-start gating). Test:
    `observe/test_observe`.

18. **`index.ts`** — re-export the public surface (types, PARAMS, graph helpers +
    the 7 re-exported node constants, log/migration). Verified indirectly by every
    consumer import.

## generators
<!-- slice=generators -->

A dependency-ordered rebuild of `web/src/generators/**` (+ `web/tests/generators/**`).
Prerequisite (other slice): the engine skill-node ids and `ErrorSignature` /
`ScaffoldLevel` types from engine-core (`engine/graph.ts`, `engine/types.ts`) must
exist first — generators reference them by id only.

### GEN-T1 — Build the shared kernel `core.js`
- Implement `makeRng(seed)` (mulberry32), `hashStr(s)` (FNV-1a 32-bit),
  `rngFor(skill, index)` (seed = `hashStr(skill) ^ imul(index+1, 2654435761)`).
- Implement numeric helpers: `randInt`, `pick`, `gcd`, `lcm`, `coprime`.
- Implement `tierForLevel(level)` (L0/L1→0, L2/L3→1, L4→2; non-finite→0).
- Implement `resolveSurfaceForm(forms, requested, index)` (honor requested if a
  member; else double-guarded modulo rotation).
- Implement `problemIdFor(skill, level, surfaceForm, index)` →
  `` `${skill}:${level}:${surfaceForm}:${index}` ``.
- Satisfies: GEN-R3, GEN-R4, GEN-R5, GEN-R7.

### GEN-T2 — Implement the 10 per-skill generators
Each module exports `SKILL`, `SURFACE_FORMS` (length 2), `generate(spec)` returning
the GeneratedProblem envelope, computing `answer` from chosen `operands`
(correct-by-construction). Build them with their forms + tier pools per design G.5:
`addSameDen`, `subSameDen`, `addUnlikeNested`, `addUnlikeCoprime`, `simplify`,
`improperToMixed`, `multEqualGroups`, `multFacts`, `fractionOnLine`,
`compareBenchmark`. Satisfies: GEN-R2, GEN-R4, GEN-R5, GEN-R6.

### GEN-T3 — Build the registry `index.js`
- Import all 10 modules, build `REGISTRY = Map(SKILL → module)`.
- Export `hasGenerator`, `generatorSkills`, `surfaceFormsFor` (defensive `.slice()`),
  `generateFor` (throw on unknown; attach `problem_id` if absent).
- Satisfies: GEN-R1, GEN-R5, GEN-R7, GEN-R8.

### GEN-T4 — Build the grader `grade.js`
- `equalValue` (cross-multiply, zero-guarded), `num` (string→int, NaN on garbage),
  `twoOperands` (normalize `{a,b}`/`{start,take}`/`{a,b,den}`/`[[n,d],[n,d]]`),
  `classifyAddError` (→ `add_denominators` / `add_across_unlike`).
- `gradeAnswer(problem, answer)` per-skill switch (SIMPLIFY lowest-terms gate;
  IMPROPER_TO_MIXED exact-whole/forced_leftover; MULT_* integer; COMPARE relation;
  default equal-value fraction).
- `answerShape(skill)`.
- Satisfies: GEN-R9, GEN-R10, GEN-R11, GEN-R12, GEN-R13.

### GEN-T5 — Build the hint ladders `hints.js`
- `HINTS` map: 2 rungs per skill (method, first move), generic across variations.
- `hintsFor(skill)` returns rungs or `[]`.
- Satisfies: GEN-R14, GEN-R15.

### GEN-T6 — Tests
- `test_generators.test.js`: per-skill independent answer validators, registry
  coverage (10 skills, 2 forms each), determinism, explicit + rotated surface
  forms, variety, unknown-skill throw.
- `test_grade.test.js`: canonical-correct = 3★ for every skill; clearly-wrong
  rejected; SIMPLIFY equal-but-unreduced = 2★ not_simplified; IMPROPER_TO_MIXED
  exact-whole accept / forced_leftover reject.
- `test_grade_u4.test.js`: ErrorSignature union membership; add_denominators /
  add_across_unlike detection; not_simplified locked.
- `test_hints.test.js`: every skill ≥1 rung (>8 chars); unknown → `[]`.

## runtime-affect
<!-- slice: runtime-affect -->

Sequenced rebuild plan for the React runtime + advisory affect layer. Each task
traces to a requirement (R-RT-* / R-AF-*). Depends on **engine-core** (the log,
`measurementReduce`, `policy.nextDecision`, `gate.isMastered`, `PARAMS`, the
`Decision`/`MasteryEstimate`/`Observation` DTOs) and **generators**
(`generateFor`, `surfaceFormsFor`) existing first — both by pointer.

### T1 — `scaffoldMap.js` (no deps) → R-RT-10
Implement `toScaffoldLevel(lessonId, beat)` and the inverse
`toBeatForLevel(lessonId, designLevel)` with the per-lesson tables and
`parseStageN`. Conservative mapping; default 0 / `'1'`. Pure JS, no imports.

### T2 — `tier2.js` (no deps) → R-RT-11
Implement `makeTier2Window`, `checkTier2` (priority HINT_OFFER > TAKE_YOUR_TIME >
TRANSFER_PROBE_QUEUED, idempotent per window), and the isolated
`checkOscillation`/`checkLongPause`/`checkTooFastCorrect`. Constants
`PAUSE_THRESHOLD_MS=8000`, `OSCILLATION_THRESHOLD=3`. No engine/React imports;
caller injects timestamps.

### T3 — `engineStore.js` + `useEngineStore.js` → R-RT-12
React-free observable singleton (`subscribe`/`getSnapshot`/`publishDecision`/
`publishNudge`/`clearNudge`/`resetEngineStore`); capped decisionLog (≤50);
`uiChurn` increment on Fade/Raise. Then the `useSyncExternalStore` binding in a
SEPARATE file so the store stays renderer-free. (ADR-RT-003.)

### T4 — `practiceFlow.js` (deps: generators) → R-RT-7
`nextPractice(decision, state, opts)` + `otherSurfaceForm(skill, current)`. Pure;
keep level on `PresentProblem` (gotcha G5); clamp/floor on Fade/Raise.

### T5 — `useLessonEngine.js` (deps: engine-core, scaffoldMap, tier2, engineStore)
→ R-RT-1..6, R16, U2
`emit` (stamp/append/persist; on `problem_present` reset Tier-2 window + sync
policy scaffold WITHOUT resetting consecutiveErrors). `judgeAndAdvance` per the
12-step boundary sequence: emit submit+judged burst, one `measurementReduce`, one
`nextDecision`, U2 `isCertified` from the same fold, `publishDecision`, apply
Fade/Raise. The boundary-once rule (R16) is load-bearing — keep `nextDecision`
out of every effect/render.

### T6 — `useGeneratedPractice.js` (deps: T5, generators, practiceFlow) → R-RT-8
Cursor `{level,index,surfaceForm}`; `useMemo` problem from `generateFor`; emit
`problem_present` once per distinct cursor (guard ref); `submit` grades, calls
`judgeAndAdvance`, maps via `nextPractice`, advances cursor or sets `exit`.

### T7 — `useLessonScaffold.js` (deps: T5, scaffoldMap, tier2, engineStore,
generators, practiceFlow, shell-nav `voice.js` pointer) → R-RT-9
The shared lesson controller: opaque stage keys, outcome state, refs+effects,
guarded mount `problem_present` (skip when `emitMountPresent:false`), unmount
`stopVoice`, Tier-2 idle/oscillation `setInterval` watcher → `publishNudge`,
generated-practice mode (genLevel spanning 0..4), `applyEngineDecision` with the
U2 certified terminator checked FIRST, deferred-advance mode.

### T8 — `affect/composite.js` (no deps) → R-AF-2
`computeComposite` with the corroboration cap (`maxChannelPoints` < `t2`),
`SIGNAL_CHANNEL` map, `hint_spend` channel, observe-only exclusion. (ADR-RT-004.)

### T9 — `affect/affectState.js` (no deps) → R-AF-3
`neutralAffect`/`deriveAffect`/`smoothAffect`; valence pinned `'neutral'`; clamp
[0,1]; EWMA `alpha=0.4`.

### T10 — `affect/governor.js` (no deps) → R-AF-4
Budget + dismissal backoff in ATTEMPTS; immutable `register*`.

### T11 — `affect/ledger.js` (no deps) → R-AF-5
Immutable `record`/`resolve`; `report` with cost-weighted precision
(`SEVERITY_COST {low:1,med:3,high:9}`); pending + observe-only exclusions.

### T12 — `affect/selfReport.js` (deps: ledger shape) → R-AF-6
`evaluateSelfReport` (discard signal on contradiction, always keep goldLabel);
`applySelfReportToLedger` (tricky confirms / easy contradicts pending).

### T13 — `affect/index.js` (deps: T8–T12) → R-AF-1
`composeAffect`: composite → affectState → dominant channel → governor gate →
ledger record. FIREWALL: returns `isDisengaged`/`recommendedTier`/`affectState`
only; never a MasteryEstimate; no `gate.ts` path. (ADR-RT-002.)

### T14 — verify the owned tests pass
Run the slice's owned test files (see checklist). The affect tests are pure and
run as-is; the `.jsx` hook tests rely on the vite `.js→.ts` resolution
(constitution §2; gotcha G9).

## ui-surfaces
<!-- slice: ui-surfaces -->

Rebuild tasks — engine model surfaces (`web/src/ui/**`).

Prereqs (by pointer): the engine store + `useEngineStore` (`runtime-affect`), and
the `MasteryEstimate`/`Decision` shapes (`engine-core`) must exist first — these
surfaces only read them.

1. **`RationaleBanner.jsx`** — pure prop-driven dismissible status bar.
   - Props: `rationale` (string, `''` = hidden), optional `className`.
   - Local state: `dismissed`, `lastRationale`; un-dismiss on a new non-empty
     rationale; reset on empty. `visible = Boolean(rationale) && !dismissed`.
   - `role="status"`, `aria-live="polite"`, `aria-atomic`, `data-testid="rationale-banner"`,
     `×` dismiss button (`aria-label="Dismiss"`). No engine import.

2. **`MasteryInspector.jsx`** — collapsible observer panel.
   - Inline gate mirror: `isMastered` (`P_known≥0.95` ∧ `max_scaffold_passed≥3` ∧
     `transfer_passed`; fluency soft=true), `gateConditions`, `statusLabel`.
   - `NODE_ORDER` mirrors `graph.ts` topo order (5 nodes w/ room-id labels).
   - Sub-components: `GateBadge`, `NodeRow` (P%, 4 badges, status, hint-dep%),
     `DecisionLog` (newest-first), `CounterMetrics` (uiChurn / dependence /
     falsePosRate).
   - Derive `dependence` (avg `hint_dependence` over in-progress) and
     `falsePosRate` (probed nodes no longer mastered) from `masteryMap`; caller
     value overrides when not `undefined`.
   - Toggle button starts collapsed; `data-testid`s: `mastery-inspector`,
     `inspector-toggle`, `inspector-panel`, `status-<nodeId>`, `metric-*`.

3. **`EngineSurfaces.jsx`** — store→surface bridge container.
   - `useEngineStore()` once; fan out `{ decision, rationale, nudge, masteryMap,
     decisionLog, metrics }`.
   - `CHANGE_KINDS` set → `bannerRationale` only for change decisions (anti-churn).
   - Inner `NudgeToast`: `NUDGE_TTL_MS=5000` auto-dismiss via `clearNudge()`, manual
     dismiss, `data-nudge-type`, `data-testid="engine-nudge"`.
   - Props `active` (gates banner + toast), `showInspector` (gates inspector),
     `fallbackMasteryMap` (used when store map is null).
   - Import `engine-surfaces.css`.

4. **`AffectProbe.jsx`** — presentational self-report overlay.
   - Props `open`, `onReport('easy'|'tricky')`, `onDismiss`, `nickname='solnyshko'`.
   - Two face buttons (emoji `aria-hidden` + visible label), Babushka prompt tagged
     `data-vox-speaker="Babushka"`, "Not now" skip. `role="dialog"`,
     `data-testid="affect-probe"`. No engine import. Import `affectprobe.css`.

5. **Stylesheets** — `styles/engine-surfaces.css` (fixed-position banner/toast/
   inspector in viewport space, theme tokens, lifted above the answer bar) and
   `styles/affectprobe.css` (absolute-inset overlay, big tap targets).

6. **Mount** in `Shell.jsx` (slice `shell-nav`): one `<EngineSurfaces>` with
   `active={inLesson || route==='mom'}`, `showInspector={active && import.meta.env.DEV}`,
   `fallbackMasteryMap`. (Documented by `shell-nav`; listed here as the integration
   point.)

7. **Tests** — `tests/runtime/test_engine_surfaces.test.jsx` (store assertions +
   driven render: banner shows for change kinds, hidden for `PresentProblem`,
   hidden when inactive, toast appears, inspector toggle renders, live re-render) and
   `tests/runtime/test_affectProbe.test.jsx` (open/closed, reader-safe labels,
   report routing, in-fiction speaker tag, skip).

## shell-nav
<!-- slice: shell-nav -->

Rebuild tasks for the app shell / router / maps / settings / audio-voice / intros.
Ordered so each task builds on the prior. Engine-core (mastery load),
runtime-affect (scaffoldMap/useLessonEngine), lessons-rooms (room screens), and
ui-surfaces (EngineSurfaces) are dependencies referenced by pointer.

### T1 — Bootstrap & stage
- [ ] Author `index.html` (`#fit > #stage > #root`, locked viewport, Google Fonts).
- [ ] `main.jsx`: `createRoot(#root).render(<Shell/>)`; import tokens/lesson/world CSS.
- [ ] Implement `useStageFit` (visualViewport-based uniform fit; fixed+centered #fit;
      re-fit on resize/orientation/vv events).

### T2 — Hash router + screen switch (`Shell.jsx`)
- [ ] `useHashRoute` (read `#/<route>`, default `title`, `hashchange` sub, `go`).
- [ ] Screen if/else over settings/concepts/title/mom/review/room; keep globals
      mounted by computing a `screen` variable (no early return).
- [ ] Overlay return-to-origin via `prevRouteRef` for settings/concepts.
- [ ] FAB bar (Concepts + Settings) on title/world only.
- [ ] Mount `TapToRead`, `EngineSurfaces` (active in lesson/mom; inspector in DEV),
      `BackgroundMusic` once.

### T3 — Data registries
- [ ] `rooms.js`: ROOMS[] (10), STRANDS[] (3, contiguous), KITCHEN, CENTER.
- [ ] `ccss.js` (CCSS_DENOMINATORS + helpers), `ccssStandards.js` (NODE_STANDARDS),
      `denominatorColors.js` (palette + hatch + contrast helpers).

### T4 — Settings store + screen
- [ ] `settings.js`: `bf_settings_v1` store, normalize/clamp, legacy
      `musicVolume`/`musicMuted` first-run migration, subscribe API.
- [ ] `SettingsScreen.jsx`: 2 VolumeRows + 2 ModeCards, live subscribe, kbd sliders.
- [ ] `SettingsButton.jsx`: gear → `#/settings`.

### T5 — Audio stack
- [ ] `audioBus.js` (count-based voice-active bus).
- [ ] `music.js` (MUSIC scene map + `sceneFor`).
- [ ] `BackgroundMusic.jsx` (UI-less player: loop/rotate, duck under voice, live
      volume, autoplay retry).

### T6 — Voice stack
- [ ] `speechify.js` (number/fraction spell-out, glyph strip; doubles as cache key).
- [ ] `voiceLines.js` (LINES, SPEAKERS w/ voiceEnv names, MEOW_SFX, LINE_SPEAKER,
      `speakerOf`).
- [ ] `voice.js` (single-channel say/stop, clip→exact-text→TTS resolution, toggle,
      audioBus bracketing, NO robotic fallback, `readAloud` yield).
- [ ] `TapToRead.jsx` (MutationObserver speaker-button injection, capture-phase
      toggle, skip-list).

### T7 — Chrome screens
- [ ] `TitleScreen.jsx` (greet-on-load + gesture retry; START → world).
- [ ] `WorldMap.jsx` (two-level shelves/cards, status badges, suggested "Next",
      shelf rollups, no-data fallback).
- [ ] `EmptyRoom.jsx` (unbuilt-room placeholder).

### T8 — Concept map
- [ ] `conceptTree.js` (CONCEPTS, buildConceptTree, getMastery seam live/placeholder,
      rollups, More bucket).
- [ ] `ConceptMap.jsx` (top-nav tabs → node breakdown → atomic cards; Ring/CardBar;
      live-vs-placeholder chip; banding).

### T9 — Intros
- [ ] 10 `intro*.js` cue sheets (STAGE_PERSIST_KEY, INTRO_DURATION, INTRO_CUES).
- [ ] `RoomIntro.jsx` (iframe video, playhead-gated narration, pause/seek, end card,
      watch-again, mute-by-volume, pause-aware completion timer).
- [ ] Wire first-entry gating + `onRewatchIntro` in Shell (`seenIntros` set).

### T10 — Mastery-driven shell wiring (pointer: engine-core / runtime-affect)
- [ ] `loadMasteryMap()` + reload on return to world/title/review.
- [ ] Scaffold entry: `entryScaffoldFor` → `toBeatForLevel` → `initialBeat`.
- [ ] `kitchenProgress.js`: masteryStatusFor / suggestedNextRoom / entryScaffoldFor /
      eligibleMixSkills / dueProbes / recordRetentionProbe / loadMastered /
      saveMastered (legacy) / resetProgress.
- [ ] Retention-probe settle on return (U7); wall→room→return `stumpingRecipeId`
      sessionStorage handoff.

### T11 — Assets
- [ ] Place `public/intros/*.html` (10), `public/music/*.mp3` (5, slugs match
      music.js + fetch-music), `public/voice/*.mp3` (baked clips), `settings-gear.png`.

### Verification (pointer: runtime/e2e tests owned by other slices)
- [ ] Stage fit correct under simulated visualViewport offset.
- [ ] WorldMap badges/suggestion reflect a seeded mastery map; null → no-data render.
- [ ] Settings changes propagate live to music/voice/Slate; persist + reload.
- [ ] Single-voice invariant: a new `say()` cuts the previous; music ducks/resumes.
- [ ] Intro narration never overlaps; pause freezes video+audio+timer; seek works.

## lessons-rooms
<!-- slice: lessons-rooms -->

> Dependency order: `engine-core` → `generators` → `runtime-affect` (the
> `useLessonEngine`/`useLessonScaffold`/`practiceFlow`/`scaffoldMap` backbone) and
> `shell-nav` (`rooms.js`/`kitchenProgress.js`/`denominatorColors.js`/voice) MUST
> exist before this slice's rooms can mount. This slice builds bottom-up:
> manipulative components → shared lesson chrome → rooms → hubs → tests.

### T-LR-1 Shared component library
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

### T-LR-2 Single-skill rooms (use the shared library + `useLessonScaffold`)
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

### T-LR-3 Shared unlike-den rooms
- **T-LR-3.1** Build `unlikeDenMath.js` (pure: lcd/exactSum/multipliersFor/
  commonDenChoices/verify/crossMultiply/generateProblem — NO Math.random/Date).
- **T-LR-3.2** Build the lesson configs `lessons/r2-unit.js` (Cross-Multiply,
  handwriting) + `lessons/r3-nonunit.js` (Scale One).
- **T-LR-3.3** Build `LessonUnlikeDen` — config-driven (framing→node/lessonId),
  the L0→L7 beat ladder (`NEXT_BEAT`), slice-to-match mechanic, the two-stage
  den→num answer gate, `errorSignatureFor`, DEV `/__ink` logging.

### T-LR-4 Hubs
- **T-LR-4.1** Build `momsProblems.js` (CURRICULUM, BANK, recipes, graders,
  flow helpers) + the mom's-room components (`cast`, `props`, `kit`,
  `ScratchCanvas`).
- **T-LR-4.2** Build `MomsRoom` — the engine-driven kitchen (mirror/combine/
  look-ahead, RouteToRoom wall, stumping recipe + ReturnToKitchen, slip→signature
  mapping).
- **T-LR-4.3** Build `MixedReview` — standalone interleaved practice (identify →
  solve), ≥2-recipe eligibility gate.

### T-LR-5 Room CSS
- **T-LR-5.1** Author the owned stylesheets: `r1/r4/r5/s1/m1/m3/nl/cmp.css`,
  `lesson/lesson-board/lesson-unlike.css`, `mixreview/momsroom.css`,
  `sandbox/slate/blankslate/questionband/stagetabs/gen-practice/fitstage.css`.
  Each is the like-named screen/component stylesheet (structure/layout, tokens
  from `styles/tokens.css` in shell-nav, BY POINTER).

### T-LR-6 Tests (owned)
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

## harness
<!-- slice: harness -->

> A dependency-ordered rebuild plan for `web/src/harness/**` + its tests. Mirrors
> the U-numbered plan in the source headers (U1–U11) but reordered for a
> clean-room rebuild. Each task names the file(s), the contract, and the verifying
> test. Engine/generators/runtime are prerequisites (rebuilt by their own slices)
> and consumed only via `engineApi.js`.

### T1 — Engine bind + deterministic RNG + tape codec (foundation)
- **Files:** `engineApi.js`, `rng.js`, `tape.js`, `config.js`, `index.js`.
- **Do:** re-export the engine/generator/runtime public surface from `engineApi.js`
  (the ONE bind point). Implement `personaRng(id, seed, step)` (reusing
  generators' `makeRng`/`hashStr`, NOT shadowing `rngFor`), `randInt`/`pick`/`chance`.
  Implement canonical serialization (`canonicalize`/`canonicalStringify`/`fnv1a`/
  `hashObject`/`serializeSession`/`tapesToJsonl`/`jsonlToTapes`) + the Node-only
  file sink behind a dynamic import. `config.js`: `defaultFlags`/`makeRun`/`paramsHash`.
- **Verify:** `test_tape_replay_determinism` (byte-identical), determinism asserts.

### T2 — Inverse-error map
- **Files:** `personas/inverseErrors.js`.
- **Do:** `misconceptionsFor(skill)` (≥2 per generator skill) + `inverseAnswer`
  computing the planted wrong answer from the real operands; named-signature
  arithmetic for add_denominators/add_across_unlike/scaled_bottom_only/
  forced_leftover/not_simplified, `other`-collapsing cognitive misconceptions, and
  slip fallbacks that never return the correct value.
- **Verify:** `test_personas_inverse_errors`.

### T3 — Persona factory, library, families
- **Files:** `personas/model.js`, `personas/library.js`, `personas/families.js`.
- **Do:** `makePersona(spec)` (default generative emit, per-session mutable state,
  latency-band draw with fatigue). Build the library (archetypes + non-BKT +
  3 audit spoofers). Build train/held-out families with DISJOINT latent ranges,
  fresh seed lineages, and non-BKT held-out emit laws. Keep the disjointness lint
  green (no `engine/params` import anywhere under `personas/`).
- **Verify:** `test_param_disjointness`.

### T4 — Headless session runner
- **Files:** `sessionRunner.js`.
- **Do:** `runSession` (the headless boundary mirror: measurementReduce →
  nextDecision @boundary → nextPractice → generateFor → persona.emit → grade →
  emit the burst segment() reads → update PolicyState exactly as useLessonEngine →
  record the tape). `runSweep` (personas × skills, fresh persona per pair).
  `characterizeScriptedStage` (read-only divergence stub). Mirror the empty
  recentBehavior channel; do NOT invent observations.
- **Verify:** `test_session_runner`.

### T5 — Oracle (latent truth, expected findings, positive control, invariants)
- **Files:** `oracle/latentTruth.js`, `oracle/expectedFindings.js`,
  `oracle/positiveControl.js`, `oracle/invariants.js`.
- **Do:** `labelTape`/`tapeHasAnyLabel` (τ_latent disjoint from gateThreshold);
  the six audit-defect probes (`runExpectedFindings`, each with `flagThatResolves`);
  the verify-first positive control + `blindControl`; the three metamorphic
  invariants (`checkInvariants`).
- **Verify:** `test_expected_findings`, `test_positive_control`, `test_oracle_invariants`.

### T6 — Metrics + counter-pairing + clustering
- **Files:** `metrics.js`.
- **Do:** `MetricsRecord` (constructor throws on an unpaired headline — KTD5),
  `aggregate` (population + per-persona-class), `clusterFailures`
  (persona×skill×decision, severity×count).
- **Verify:** `test_metrics_counter_pairing`.

### T7 — Findings backlog
- **Files:** `findings.js`.
- **Do:** `buildBacklog` (four ranked categories, audit reconciliation suppresses
  harness duplicates, `humanAgreementWith`) + `renderBacklogMarkdown`.
- **Verify:** `test_findings_backlog`.

### T8 — Adversarial search + coverage
- **Files:** `search.js`.
- **Do:** `searchNearestFlip` ((μ,λ) loop inside the plausibility box, replayable
  `{latent, seed}`), `searchCoverage` (novelty-keeping coverage variant), the box
  projection + distance metric (`LATENT_DIMS`, `PLAUSIBILITY_CEILINGS`,
  `distanceToHonest`).
- **Verify:** `test_search`.

### T9 — Recursive loop + champions
- **Files:** `recursiveLoop.js`.
- **Do:** `runLoop` (train + sealed held-out before/after, REAL/GAMING/NO_CHANGE,
  guardrail, deflated pass-rate, regressions, decisionLogEntry; `perturbMetrics`/
  `perturbTapes` test hooks). `distillChampions` + `replayChampions`.
- **Verify:** `test_recursive_loop`.

### T10 — Reports (pure projections)
- **Files:** `report.js`.
- **Do:** build/render split for verdict cards, baseline report, decision log,
  limitations memo, research notes; the `ENGINE_PATH_SCOPE` banner on every
  certification claim.
- **Verify:** `test_report_projections`.

### T11 — Quarantine facets
- **Files:** `quarantine/chaos.js`, `quarantine/llmDiscriminator.js`.
- **Do:** chaos fault-injection on deep clones (steady-state + blast radius, no
  original mutation), the blind LLM discriminator (judge-only, graceful degrade,
  static tells). Keep both isolated from search/recursiveLoop.
- **Verify:** `test_quarantine`.

### T12 — CLI
- **Files:** `cli.js`.
- **Do:** `parseArgs` + the four subcommands (`baseline`/`search`/`loop`/`report`)
  + `--dry` smoke; wire every projection through `writeDoc`/tape/champion sinks at
  the repo-root `docs/harness/` paths; assert determinism in `baseline`.
- **Verify:** manual `npm run harness -- baseline --seed 1`; `report` re-projection.

### T13 — Dashboard
- **Files:** `dashboard/data.js`, `HarnessDashboard.jsx`, `FailureHeatmap.jsx`,
  `RecursivePanel.jsx`, `VerdictCard.jsx`, `index.js`, `dashboard.css`.
- **Do:** pure data projections reusing report/oracle; the master-detail view;
  `runDemoSweep` (small subset), `replaySession` (divergence flag);
  `mountHarnessDashboard` standalone mount. Do NOT wire into `Shell.jsx` (pointer
  only — shell-nav owned).
- **Verify:** `test_dashboard_render`.

### T14 — Proof suite (skeptic-facing, owned tests)
- **Files:** `web/tests/proof/test_proof_engine.test.js`,
  `test_proof_integration.test.jsx`.
- **Do:** deterministic assertions against the REAL engine/runtime, thresholds read
  live from `params.ts`. (Exercises engine/runtime behavior documented by their
  slices; the test files live under this slice's globs.)

## ink-recognition
<!-- slice: ink-recognition -->

> Rebuild order + the one test file owned by this slice.

### Rebuild order
1. **Stage the model asset.** Place the pretrained ONNX-zoo `mnist-12.onnx`
   (~26 KB) at `web/public/mnist-12.onnx` so it is served at `/mnist-12.onnx`.
2. **Configure Vite for onnxruntime-web (pointer: `leftovers`/`vite.config.js`).**
   Add `optimizeDeps: { exclude: ["onnxruntime-web"] }` so ort self-resolves its
   `.wasm`/`.mjs` siblings. Do NOT set `wasmPaths`. Do NOT hand-stage `public/ort`.
3. **Build `web/src/ink/recognizer.js`:**
   - Import `* as ort from "onnxruntime-web/wasm"` (plain WASM build).
   - Set `ort.env.wasm.numThreads = 1`, `ort.env.logLevel = "error"`.
   - Fire `sessionPromise` (fetch → arrayBuffer → `InferenceSession.create`,
     `executionProviders:["wasm"]`), capturing `SESSION`/`LOAD_ERR`, never throwing.
   - `rasterize` (28×28, 20px box, centroid-centered) — §4 of design.
   - `cnnDigit` (Input3 → Plus214_Output_0, ×255, softmax conf, conf>0.5).
   - `$P` fallback: `normalizeStrokes`/`resample(32)`/`scale`/`translateToOrigin`,
     `cloudDistance`/`greedyMatch`, `RAW_TEMPLATES`, `pdollarDigit`.
   - `segment` (densify → occupancy histogram → whitespace cuts → `assignByCuts`
     → `forceSplitWide`), `recognizeDigit`, `recognizeNumber`.
   - `modelStatus`, `classifyDebug` debug probes.
4. **Wire consumers (pointer: `lessons-rooms`):** `InkPad.jsx`, `Slate.jsx` import
   `recognizeNumber`/`recognizeDigit`.
5. **Dev tooling:** `web/tools/dump-ink.mjs` (decode `ink-log.jsonl` → PNGs);
   `web/tools/train_mnist.py` (ad-hoc model retraining — see gotchas re: JSON vs
   ONNX mismatch).

### Tests owned by this slice
- `web/tests/runtime/test_recognizer_segment.test.jsx` — **segmentation tests
  only**. It `vi.mock`s `onnxruntime-web/wasm` so `InferenceSession.create`
  resolves to `null`, forcing the `$P` fallback; the assertions are purely about
  **how many digit groups** `recognizeNumber(...).digits.length` produces. Cases:
  1. "42" with a visible gap → 2 groups.
  2. "42" close together (gap too small for whitespace) → 2 groups (force-split).
  3. single wide "4" → 1 group.
  4. multi-stroke "8" (two loops + stray dot) → 1 group.
  5. three-digit "144" → 3 groups.
  Run via `npm test` (Vitest, jsdom). WHY mock the CNN: segmentation is
  independent of which digit is ultimately read, so the test is deterministic
  without the WASM model.

### Out-of-band tasks (not part of the app build/test)
- `python tools/train_mnist.py` — downloads MNIST to a temp cache, trains, exports
  a model artifact. Ad hoc; `pyproject.toml` (pointer: `leftovers`) declares no
  deps (needs `numpy` installed manually).
- `node tools/dump-ink.mjs` — inspect captured samples after drawing on a tablet.

## leftovers
<!-- slice: leftovers — build-config + repo glue -->

The leftovers slice owns no task list of its own; it is the build/config glue every
other slice references by pointer. When the slices above are in place, ensure these
exist and are consistent (see `_coverage/fragments/leftovers/*` and `env-and-config.md`):

1. **`web/vite.config.js`** — the `resolveTsFromJs` plugin (relative `./x.js` → `./x.ts`
   for dev/build/vitest), `@vitejs/plugin-react`, the dev-only `/__ink` + `/api/tts`
   middleware, `optimizeDeps.exclude: ["onnxruntime-web"]`, strictPort dev/preview.
2. **`web/package.json`** — dependencies/devDependencies + scripts (`dev`, `build`,
   `preview`, `test`, `harness`, voice/music tooling) per constitution §2–3.
3. **`web/tsconfig.json`** — strict TS, `allowJs`, `moduleResolution Bundler`, `noEmit`.
4. **`web/vitest.setup.js`** + test config — jsdom env, testing-library matchers.
5. **`pyproject.toml`** (repo root) — the ad-hoc Python project for `train_mnist.py`.
6. **Contract docs** referenced by source comments: `.ccss-contract.md`,
   `docs/design/fraction-app-state-model.md`, `docs/design/student-state-measurement.md`.
