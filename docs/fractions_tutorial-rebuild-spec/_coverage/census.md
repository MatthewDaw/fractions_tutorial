# Census — fractions_tutorial (ground truth inventory)

Authoritative, exhaustive inventory of the repository. Produced by the CENSUS
worker (MAT-126) for reverse-prompt run rp-260608-2215. Document what IS; an
unlisted file is a coverage hole by construction. Counts at the top are the
denominator the final audit reconciles against.

> Scope note: `node_modules/`, `dist/`, lockfile internals, `.git/`, and the
> large `web/.ui-sweep/` and `web/tools/ink-dump/` and `web/scripts/intro-shots/`
> screenshot/artifact piles are listed at the GROUP level (not file-by-file) — they
> are generated QA/debug artifacts, not source. Source code is enumerated in full.

## Counts (the audit denominator)

| Metric | Count |
|---|---|
| Source code files (`web/src/**` .js/.jsx/.ts/.css) | 190 |
| — engine (`web/src/engine/**/*.ts`) | 18 |
| — generators (`web/src/generators/*.js`) | 14 |
| — harness (`web/src/harness/**` .js/.jsx/.css) | 29 |
| — runtime (`web/src/runtime/**/*.js`) | 14 |
| — components (`web/src/components/**` .jsx/.js) | 34 |
| — top-level screens (`web/src/*.jsx`) | 22 |
| — top-level src modules (`web/src/*.js`) | 24 |
| — engine-surface UI (`web/src/ui/*.jsx`) | 4 |
| — styles (`web/src/styles/*.css`) | 28 |
| — lessons configs (`web/src/lessons/*.js`) | 2 |
| Test files (`web/tests/**`) | 62 |
| Build/dev scripts (`web/scripts/*.mjs`) | 8 |
| Intro-video HTML (`web/public/intros/*.html`) | 10 |
| UI screens / rooms (see UI SCREENS section) | 10 lesson rooms + 8 chrome/overlay screens = 18 routes |
| Engine skill-graph nodes (models) | 10 |
| Problem generators (one per skill) | 10 |
| HTTP endpoints (dev-only Vite middleware) | 3 (`/__ink`, `/api/tts`, plus the `inkLogger` GET/DELETE on `/__ink`) |
| External integrations | 1 (ElevenLabs TTS, dev-only) + ONNX MNIST model (local file) |
| localStorage keys (persistence "schemas") | 4 (`moms-engine-log-v1`, `moms-kitchen-progress-v1`, `bf_settings_v1`, legacy `musicVolume`/`musicMuted`) |

---

## ENTRY POINTS (summary)

- **App bootstrap:** `web/index.html` → `web/src/main.jsx` → renders `<Shell/>`.
- **Router / screen switch:** `web/src/Shell.jsx` — hash routing (`#/<route>`),
  stage scaling, engine-mastery load, scaffold-entry computation. Routes:
  `title` (''), `world`, `mom`, `review`, `settings`, `concepts`, and the 10
  per-room ids (`m1 m3 nl r1 s1 cmp r3 r2 r4 r5`).
- **CLI:** `web/src/harness/cli.js` — `npm run harness -- <baseline|search|loop|report>`.
- **Engine public API surface:** `web/src/engine/index.ts` (wire-DTO contract:
  types, PARAMS, graph helpers, append-only log + persistence).
- **Build/dev scripts (Node, via npm):** `scripts/generate-voice.mjs` (voice),
  `audition-voices.mjs`, `fetch-music.mjs`, `fetch-music-audition.mjs`,
  `bake-all-voice.mjs`, `bake-intro-voice.mjs`, `shoot.mjs`, `shoot-intros.mjs`.
- **Dev-only HTTP endpoints (Vite middleware, `vite.config.js`):**
  `/__ink` (POST append / DELETE clear / GET count handwriting samples),
  `/api/tts` (POST `{text,speaker}` → ElevenLabs synthesis, cached to `public/voice/cache/`).
- **ML training (Python, ad hoc):** `web/tools/train_mnist.py`.
- **No background jobs / cron / server-side runtime.** The app is a static SPA;
  all "background" loops (music rotation, retention probes) run in-browser.

---

## REPOSITORY ROOT

| File | What it is |
|---|---|
| `.ccss-contract.md` | Contract doc: lessons must stay inside CCSS grade-3–5 denominator set {2,3,4,5,6,8,10,12,100}; never 7 or 9. |
| `.gitignore` | Root git ignore. |
| `CLAUDE.md` | Project instructions — gstack tooling + browsing policy + available skills. No app-level engineering constraints. |
| `pyproject.toml` | Python project stub (`fractions-tutorial`, requires-python >=3.13, no deps). Only used by `web/tools/train_mnist.py`. |
| `hiring_partners.csv` | Stray data file at repo root (hiring partners list). Non-application. |
| `uv.lock` | Python uv lockfile (untracked at census time per git status; treated as leftover). |

---

## `docs/` (curriculum, design, plans, harness reports, wireframes)

### `docs/` top-level
| File | What it is |
|---|---|
| `docs/HANDOFF-engine-surfaces.md` | Engineering handoff describing the engine UI surfaces. |

### `docs/design/`
| File | What it is |
|---|---|
| `2026-05-31-spec-clarifications.md` | Spec clarification notes. |
| `asset-generation-prompt-test.md` | Asset-generation prompt test notes. |
| `asset-manifest.md` | Manifest of art assets. |
| `fraction-app-state-model.md` | The state-model design doc — drives policy/affect/UI-churn semantics (referenced throughout engine comments as "state-model §X"). |
| `presentation-scene-architecture.md` | Presentation/scene architecture design. |
| `student-state-measurement.md` | Student-state measurement design (referenced as "measurement §4.x"). |
| `themed-load-isomorphism-rubric.md` | Rubric for themed-load isomorphism. |
| `design_handoff_matching_sizes/` | Design-handoff bundle (R2 "matching sizes"): `README.md`, two HTML mockups, `r2/{Cook,Knife,Plank,Rosette,app}.jsx`, `styles/base.css`. |
| `design_handoff_same_pieces/` | Design-handoff bundle (R1 "same pieces"): `README.md`, one HTML mockup, `r1/{Cook,Rosette,Stack,app}.jsx`, `styles/base.css`. |
| `prompts/` | Design-brief / generation prompts: `R2-matching-sizes-design-brief.md`, `asset-generation-prompt.md`, `counting_room_handoff_prompt.md`, `moms-room-asset-generation-prompt.md`, `moms-room-word-problems-design-brief.md`, `synthetic-challenger-plan-prompt.md`. |

### `docs/harness/` (synthetic-harness output artifacts)
| File | What it is |
|---|---|
| `baseline-report.md` | Generated baseline sweep report (re-projectable from tapes). |
| `decision-log.md` | Generated recursive-loop decision log. |
| `improvement-backlog.md` | Generated improvement backlog from findings. |
| `limitations-memo.md` | Generated limitations memo. |
| `research-notes.md` | Generated research notes. |
| `verdict-cards.md` | Generated verdict cards. |
| `champions/champions-ADD_SAME_DEN-seed4.json` | Frozen adversarial champion fixture (search output). |
| `tapes/baseline-seed1.jsonl` | Committed signed baseline tape (replay determinism source). |

### `docs/ideation/`, `docs/inspiration/`, `docs/plans/`, `docs/proof/`
| Path | What it is |
|---|---|
| `ideation/*.md` (5 files) | Ideation notes: russian-background-music, student-observation, ccss-alignment, pedagogical-correctness, synthetic-challenger-harness. |
| `inspiration/app_philosophy.md` | App philosophy. |
| `inspiration/hyper_responsive_ui.pdf` | Inspiration PDF (hyper-responsive UI). |
| `inspiration/synthetic_challenger.pdf` | Inspiration PDF (synthetic challenger). |
| `plans/*.md` (9 files) | Implementation plans 001–006 + readiness/typed-requests docs (playable shell, mastery-adaptive flow, split-unlike-den, student-observation-affect, multiplication-foundations, synthetic-challenger-harness, activate-dormant-pedagogy). |
| `proof/adaptive-engine-proof.md` | Proof write-up of the adaptive engine. |

### `docs/room_break_down/`
| File | What it is |
|---|---|
| `README.md`, `_TEMPLATE.md` | Room-breakdown index + template. |
| `00_kitchen_hub.md` | Kitchen hub breakdown. |
| `03_R1_add_same_denominator.md` | R1 room spec. |
| `04_R2_add_unlike_denominator.md` | R2 room spec. |
| `05_R3_simplify.md` | R3 (simplify) room spec. |
| `06_R4_improper_to_mixed.md` | R4 (improper→mixed) room spec. |
| `ASSET_CATALOG.md` | Asset catalog. |

### `docs/wireframes/`
| File | What it is |
|---|---|
| `index.html`, `kitchen.html`, `R1.html`–`R4.html`, `styles.css` | Static HTML wireframes for the kitchen hub and rooms R1–R4. |

---

## `web/` ROOT + CONFIG

| File | What it is |
|---|---|
| `web/index.html` | SPA HTML entry; mounts `#root`. |
| `web/package.json` | npm manifest; scripts (dev/build/preview/voice/audition/music/test/harness); deps (react 18, react-dom 18, onnxruntime-web). |
| `web/package-lock.json` | npm lockfile. |
| `web/vite.config.js` | Vite config: react plugin, `resolveTsFromJs` (.js→.ts resolution), `inkLogger` + `ttsServer` dev middleware, onnxruntime-web exclude, host/port, vitest config. |
| `web/tsconfig.json` | TypeScript config (engine is TS-authored). |
| `web/vitest.setup.js` | Vitest/jsdom test setup. |
| `web/.env.example` | Env template (ElevenLabs API key + per-character voice ids). |
| `web/.gitignore` | web git ignore. |
| `web/ink-log.jsonl` | Dev capture log of real tablet handwriting samples (written by `/__ink`). |
| `web/_fit.png`, `web/_ink_big.png` | Stray debug screenshots. |

---

## `web/src/` — TOP-LEVEL SCREENS (`*.jsx`)

| File | What it is |
|---|---|
| `Shell.jsx` | Root router: stage scaling, hash routing, engine-mastery load, scaffold-entry, retention-probe settle, mounts global surfaces. |
| `TitleScreen.jsx` | Landing/title screen; START → world map. |
| `WorldMap.jsx` | The lesson map (two-level: strands → rooms); per-room mastery badges + suggestion badge. |
| `EmptyRoom.jsx` | Placeholder screen for rooms without a built lesson. |
| `RoomIntro.jsx` | Plays a room's hand-animated intro video (HTML) before first lesson entry; rewatch support. |
| `SettingsScreen.jsx` | Settings overlay: voice/music volume + answer input mode. |
| `SettingsButton.jsx` | Settings FAB button component. |
| `ConceptMap.jsx` | Concept Mastery Map overlay (CCSS → cluster → node → atomic card, rolled-up mastery). |
| `BackgroundMusic.jsx` | Always-mounted background-music player; scene-driven track rotation. |
| `TapToRead.jsx` | Global "tap any text to hear it read aloud" affordance. |
| `AppR1.jsx` | Room r1 lesson: Same Denominators (add the tops). |
| `AppR4.jsx` | Room r4 lesson: Simplify. |
| `AppR5.jsx` | Room r5 lesson: Mixed Numbers (improper→mixed). |
| `AppM1.jsx` | Room m1 lesson: Equal Groups (multiplication meaning). |
| `AppM3.jsx` | Room m3 lesson: Times Facts (multiplication fluency). |
| `AppNumberLine.jsx` | Room nl lesson: Fraction on the Number Line. |
| `AppSubtract.jsx` | Room s1 lesson: Taking Away (subtract same denominator). |
| `AppCompare.jsx` | Room cmp lesson: Compare & Check (benchmark comparison). |
| `LessonUnlikeDen.jsx` | Shared lesson engine for rooms r2 (Cross-Multiply) and r3 (Scale One); config-driven by `lessons/`. |
| `MomsRoom.jsx` | Babushka's Kitchen hub: story/word-problem transfer layer over the rooms. |
| `MixedReview.jsx` | U8 interleaved "Mixed Basket" practice across met skills. |
| `Shell.jsx` | (listed above) |

## `web/src/` — TOP-LEVEL MODULES (`*.js`)

| File | What it is |
|---|---|
| `rooms.js` | Room registry: ROOMS[] (id/nodeId/no/title/concept/intro/pos), STRANDS[], KITCHEN, CENTER. The map's source of truth. |
| `ccss.js` | CCSS grade-3–5 denominator set + in-grade helpers. |
| `ccssStandards.js` | Per-node CCSS standard codes (NODE_STANDARDS map + lookups). |
| `conceptTree.js` | Builds Concept-Map hierarchy from graph + rooms + standards; `getMastery(key)` seam. |
| `denominatorColors.js` | Color palette keyed by denominator (the "denomTone" per-room color). |
| `kitchenProgress.js` | Facade over engine mastery: loadMastered/saveMastered, status strings, suggestedNextRoom, mix-eligibility, due retention probes, recordRetentionProbe, entryScaffoldFor. |
| `momsProblems.js` | Babushka's Kitchen word-problem bank (per-room mirror/combine recipes) + CURRICULUM + ROOM_SKILL. |
| `unlikeDenMath.js` | Pure unlike-denominator math: gcd/lcm/lcd, exactSum, deterministic bank-indexed generator + verifier. |
| `music.js` | Scene→track mapping + `sceneFor(route, showingIntro)`. |
| `audioBus.js` | Shared audio bus (mute/ducking coordination between music + voice). |
| `voice.js` | Voice channel: `say(key)` plays a pre-baked clip or Web Speech fallback; volume from settings. |
| `voiceLines.js` | Single source of truth for every spoken line (LINES, SPEAKERS, MEOW_SFX, LINE_SPEAKER). |
| `speechify.js` | Text → speech helper utilities (number/fraction spell-out for TTS). |
| `settings.js` | Preference store: `bf_settings_v1` in localStorage (voiceVol/musicVol/inputMode) + subscribe API + legacy migration. |
| `introM1.js`, `introM3.js`, `introNL.js`, `introCmp.js` (introCmp.js), `introR1.js`, `introR2.js`, `introR3.js`, `introR4.js`, `introR5.js`, `introS1.js` | Per-room intro-video cue sheets (timing cues that sync narration to the HTML intro animation). 10 files. |

> Note: `introCmp.js` is `web/src/introCmp.js` (cmp room). The 10 intro cue files
> are: introCmp, introM1, introM3, introNL, introR1, introR2, introR3, introR4,
> introR5, introS1.

---

## `web/src/engine/` — mastery / measurement engine (TypeScript, PURE)

> ENGINE PURITY (declared in every file header): NO React imports, NO wall-clock
> calls. Time enters only as injected event timestamps. This is the wire-DTO
> contract that could relocate behind a Python FastAPI backend with a fetch swap.

| File | What it is |
|---|---|
| `index.ts` | Public API surface: re-exports types, PARAMS, graph helpers + node constants, log/persistence/migration. |
| `types.ts` | THE CONTRACT — wire DTOs: Modality, Actor, ScaffoldLevel, Action, Signal, Event, ErrorSignature, Observation, FluencyStats, MasteryEstimate, Decision union (7 kinds), SkillNode. |
| `params.ts` | Centralized tunables: PARAMS (bkt P_T/P_S/P_G, gateThreshold, wallTheta, fade/raise streaks, fluency, escalation), feature-flag-like booleans. |
| `graph.ts` | Skill DAG: 10 SkillNode defs + edges, getNode/prereqsOf/allNodes/mostUpstreamUnmastered, node constants. |
| `bkt.ts` | Bayesian Knowledge Tracing posterior update (P_known). |
| `credit.ts` | DAG credit assignment: docks a prereq's belief when an error_signature implicates it (load-bearing prereq-ordering). |
| `decay.ts` | Spaced-retention decay + PROBE_DELAYS_MS schedule. |
| `dimensions.ts` | Per-dimension mastery sub-measures (scaffold/transfer/fluency/hint-dependence). |
| `gate.ts` | The mastery gate: `isMastered(estimate)` (Chain A threshold + conjuncts). The single firewall boundary affect never crosses. |
| `log.ts` | Append-only Event log (pure appendEvent/foldLog) + localStorage adapter (`moms-engine-log-v1`) + `migrateFromKitchenProgress`. |
| `mastery.ts` | `buildMasteryEstimate(observations, P_known)` assembles all four dimensions. Affect firewall enforced structurally. |
| `measurementReduce.ts` | The top-level reduce: folds the log into a `{ mastery: Record<nodeId, MasteryEstimate> }` map. |
| `observation.ts` | `segment(log)` → rich per-attempt Observation between problem_present and judged. |
| `policy.ts` | Deterministic policy: `legalMoves` + `nextDecision` (the Decision chooser); EscalateToHuman triggers. |
| `wall.ts` | Wall detection: WALL_HIT when predicted success < wallTheta. |
| `observe/index.ts` | Behavioral-observation pipeline entry (signals from interaction). |
| `observe/baseline.ts` | Per-learner behavioral baseline. |
| `observe/detectors.ts` | Behavioral detectors (latency stall, idle, orphaned interaction, rapid submit, hint spend). |

---

## `web/src/generators/` — deterministic problem generators (one per skill)

| File | What it is |
|---|---|
| `index.js` | Public registry: `generateFor(skill, spec)`, `surfaceFormsFor`, `generatorSkills`, `hasGenerator`; attaches stable `problem_id`. |
| `core.js` | Shared generator core: pure RNG, `problemIdFor`, validated problem envelope. |
| `hints.js` | Hint-ladder definitions per skill (hint rungs surfaced in lessons). |
| `grade.js` | Answer grading / judging logic (correctness + error_signature fingerprinting). |
| `addSameDen.js` | Generator: ADD_SAME_DEN (r1). |
| `subSameDen.js` | Generator: SUB_SAME_DEN (s1). |
| `addUnlikeNested.js` | Generator: ADD_UNLIKE_NESTED (r3, one bottom fits). |
| `addUnlikeCoprime.js` | Generator: ADD_UNLIKE_COPRIME (r2, cross-multiply). |
| `simplify.js` | Generator: SIMPLIFY (r4). |
| `improperToMixed.js` | Generator: IMPROPER_TO_MIXED (r5). |
| `multEqualGroups.js` | Generator: MULT_EQUAL_GROUPS (m1). |
| `multFacts.js` | Generator: MULT_FACTS (m3). |
| `fractionOnLine.js` | Generator: FRACTION_ON_LINE (nl). |
| `compareBenchmark.js` | Generator: COMPARE_BENCHMARK (cmp). |

---

## `web/src/runtime/` — React runtime / affect layer (advisory firewall)

| File | What it is |
|---|---|
| `useLessonEngine.js` | The shared lesson runtime backbone: emits the per-attempt event burst, persists the log, calls `nextDecision` ONLY at the submit/entry boundary, applies the Decision. |
| `practiceFlow.js` | Maps an engine Decision onto the next generated problem (continue/fade/raise/transfer/return/route). |
| `useGeneratedPractice.js` | Hook driving generator-fed practice within a lesson. |
| `useLessonScaffold.js` | Hook managing per-lesson scaffold level. |
| `scaffoldMap.js` | Maps each lesson's native beats/stages ↔ design ScaffoldLevel L0–L4 (`toBeatForLevel`). |
| `tier2.js` | Tier-2 nudges (deterministic, boundary-safe, idempotent): long-pause hint, etc. |
| `engineStore.js` | Observable singleton bridging the lesson engine to global surfaces (decision/rationale/masteryMap/decisionLog/metrics/nudge). |
| `useEngineStore.js` | `useSyncExternalStore` hook over engineStore. |
| `affect/index.js` | `composeAffect()` — corroboration engine entry; ADVISORY-ONLY firewall (never mutates MasteryEstimate, valence stays neutral). |
| `affect/composite.js` | Composite corroboration across behavioral channels (T1/T2/T3 banding). |
| `affect/affectState.js` | AffectState derive/smooth/neutral. |
| `affect/governor.js` | Nudge-fatigue budget (canOffer/registerOffer). |
| `affect/ledger.js` | Precision ledger (records every raised hypothesis for later corroboration). |
| `affect/selfReport.js` | Self-report corroboration channel. |

---

## `web/src/ui/` — engine model surfaces (always-mounted)

| File | What it is |
|---|---|
| `EngineSurfaces.jsx` | Container mounting the banner + Tier-2 nudge toast + (DEV) inspector. |
| `RationaleBanner.jsx` | Shows the engine's one-line Decision rationale (KTD8). |
| `AffectProbe.jsx` | Affect self-report probe surface (advisory). |
| `MasteryInspector.jsx` | DEV inspector: live MasteryEstimate map + counter-metrics (uiChurn). |

---

## `web/src/components/` — shared lesson + scene components

| File | What it is |
|---|---|
| `BigFrac.jsx` | Large rendered fraction display. |
| `BlankSlate.jsx` | Blank scratch/answer slate. |
| `BlockSandbox.jsx` | Draggable fraction-block sandbox manipulative. |
| `Cook.jsx` | The Cook (male tutor) character. |
| `DenominatorPicker.jsx` | Denominator selection control. |
| `ExpressionSlate.jsx` | Expression-building slate. |
| `FitStage.jsx` | Fit/scaling stage wrapper for a lesson scene. |
| `GenPracticeBoard.jsx` | Generated-practice board (renders generator-fed problems). |
| `InkPad.jsx` | Handwriting ink-capture pad (feeds the recognizer). |
| `Knife.jsx` | Knife manipulative (cut a strip into pieces). |
| `Lock.jsx` | Lock affordance (locked denominator / whole). |
| `Mom.jsx` | Babushka ("Mom") character. |
| `NumberLine.jsx` | Number-line manipulative. |
| `PlateGroup.jsx` | Plate-group manipulative (equal groups). |
| `Plank.jsx` | Plank/strip manipulative. |
| `QuestionBand.jsx` | Question/prompt band. |
| `Rosette.jsx` | Rosette (circular fraction) manipulative. |
| `SkipJar.jsx` | Skip-count jar (times-facts). |
| `SkipLine.jsx` | Skip-count line (times-facts). |
| `Slate.jsx` | Answer slate: stylus handwriting vs typed digits (reads inputMode). |
| `Stack.jsx` | Stack manipulative (same-size pieces). |
| `StageTabs.jsx` | Stage/beat navigation tabs. |
| `WordProblem.jsx` | Word-problem renderer. |
| `lesson/AnswerBar.jsx` | Lesson answer-input bar. |
| `lesson/HintRail.jsx` | Hint-ladder rail. |
| `lesson/LessonBoard.jsx` | Lesson board layout. |
| `lesson/LessonGoal.jsx` | Lesson goal/objective banner. |
| `lesson/LessonShell.jsx` | Shared lesson chrome shell (header, back, rewatch-intro). |
| `lesson/TutorRibbon.jsx` | Tutor-speech ribbon. |
| `lesson/index.js` | Barrel export for `lesson/` components. |
| `momsroom/ScratchCanvas.jsx` | Mom's-room scratch canvas. |
| `momsroom/cast.jsx` | Mom's-room character cast (Kid/Grandpa/Cat banter). |
| `momsroom/kit.jsx` | Mom's-room shared kit/props helpers. |
| `momsroom/props.jsx` | Mom's-room scene props. |

---

## `web/src/lessons/` — lesson configs (consumed by LessonUnlikeDen)

| File | What it is |
|---|---|
| `r2-unit.js` | r2 (Cross-Multiply) lesson config: beats, banks, anchors. |
| `r3-nonunit.js` | r3 (Scale One) lesson config. |

---

## `web/src/ink/` — handwriting recognition

| File | What it is |
|---|---|
| `recognizer.js` | On-device handwritten-DIGIT recognizer: ONNX MNIST-12 CNN via onnxruntime-web + $P geometric fallback + rasterize preprocessing. |

---

## `web/src/harness/` — synthetic-learner red-team harness

| File | What it is |
|---|---|
| `index.js` | Public harness surface (re-exports engineApi, rng, tape, config). |
| `cli.js` | CLI entry (`npm run harness --`): baseline/search/loop/report subcommands; writes docs/harness artifacts. |
| `config.js` | Run config: makeRun, defaultFlags, paramsHash. |
| `engineApi.js` | The single binding to the engine (allNodes, generatorSkills, run-the-engine helpers). |
| `rng.js` | Deterministic persona RNG (personaRng, randInt, pick, chance). |
| `tape.js` | Canonical serialization: canonicalize/hashObject/serializeSession + tapesToJsonl/jsonlToTapes (signed replayable tapes). |
| `sessionRunner.js` | Runs a full seeded sweep (personas × skills) → tapes. |
| `metrics.js` | Aggregate metrics (false_mastery_rate, missed_escalation_rate, counter-pairing). |
| `findings.js` | Builds the improvement backlog from tapes + renders markdown. |
| `report.js` | Builds/renders baseline report, verdict cards, decision log, limitations memo, research notes. |
| `search.js` | Adversarial nearest-decision-flip evolutionary search (champion discovery). |
| `recursiveLoop.js` | Recursive certification loop + distillChampions (held-out seal verification). |
| `oracle/expectedFindings.js` | The seeded-defect oracle: runs the known-defect audit. |
| `oracle/invariants.js` | Oracle invariants the engine must satisfy. |
| `oracle/latentTruth.js` | Latent-truth model for synthetic learners. |
| `oracle/positiveControl.js` | Positive-control harness check. |
| `personas/library.js` | Persona library (the synthetic learners). |
| `personas/model.js` | Persona behavioral model. |
| `personas/families.js` | Persona families/taxonomy. |
| `personas/inverseErrors.js` | Inverse-error persona behaviors (misconception injection). |
| `quarantine/chaos.js` | Chaos/quarantine perturbations. |
| `quarantine/llmDiscriminator.js` | LLM-based discriminator (optional, behind availability flag). |
| `dashboard/index.js` | Harness dashboard barrel. |
| `dashboard/HarnessDashboard.jsx` | Dashboard root view. |
| `dashboard/FailureHeatmap.jsx` | Failure heatmap viz. |
| `dashboard/RecursivePanel.jsx` | Recursive-loop panel. |
| `dashboard/VerdictCard.jsx` | Verdict-card component. |
| `dashboard/data.js` | Dashboard data adapter. |
| `dashboard/dashboard.css` | Dashboard styles. |

---

## `web/src/styles/` — CSS (28 files)

`affectprobe.css`, `blankslate.css`, `cmp.css`, `conceptmap.css`,
`engine-surfaces.css`, `fitstage.css`, `gen-practice.css`, `lesson-board.css`,
`lesson-unlike.css`, `lesson.css`, `m1.css`, `m3.css`, `mixreview.css`,
`momsroom.css`, `nl.css`, `questionband.css`, `r1.css`, `r4.css`, `r5.css`,
`s1.css`, `sandbox.css`, `settings.css`, `slate.css`, `stagetabs.css`,
`title.css`, `tokens.css` (design tokens), `voicetap.css`, `world.css`.
Each is the stylesheet for the like-named screen/component.

---

## `web/scripts/` — Node build/dev scripts (`*.mjs`)

| File | What it is |
|---|---|
| `generate-voice.mjs` | Bake voice clips from voiceLines via ElevenLabs (`npm run voice`). |
| `audition-voices.mjs` | Audition candidate voices (`npm run audition`). |
| `bake-all-voice.mjs` | Bake the full voice library. |
| `bake-intro-voice.mjs` | Bake intro-narration voice. |
| `fetch-music.mjs` | Download + transcode public-domain music tracks (`npm run music-fetch`). |
| `fetch-music-audition.mjs` | Fetch music-audition candidates (`npm run music-audition`). |
| `shoot.mjs` | Playwright screenshot tool (room screenshots). |
| `shoot-intros.mjs` | Playwright intro-video screenshot tool. |
| `intro-shots/*.png` | Generated intro screenshots (9 PNGs). Artifact group. |

---

## `web/tools/` — misc tooling

| File | What it is |
|---|---|
| `dump-ink.mjs` | Dump captured ink samples to PNGs. |
| `train_mnist.py` | Python: train/export the MNIST digit model (produces `public/mnist-12.onnx`). |
| `ink-dump/*.png` | Generated ink-dump PNGs (10 files). Artifact group. |

---

## `web/public/` — static assets

| Path | What it is |
|---|---|
| `intros/*.html` (10) | Hand-animated intro "videos" (HTML/CSS/JS): cmp-compare-check, m1-equal-groups, m3-times-facts, nl-number-line, r1-same-denominators, r2-same-size-pieces-v2, r3-scale-one, r4-simplify, r5-mixed-numbers, s1-taking-away. |
| `mnist-12.onnx` | Pretrained MNIST digit-recognition ONNX model (loaded by `ink/recognizer.js`). |
| `music/*.mp3` (5) | Background music tracks (Borodin/Mussorgsky/Tchaikovsky, public domain) + `_audition/index.html`. |
| `voice/*.mp3` (~190) | Pre-baked character voice clips (Cook/Mom/Kid/Grandpa + per-room narration + nudges + goals). Asset group. |
| `voice/README.md` | Voice-asset README. |
| `settings-gear.png` | Settings icon. |

---

## `web/tests/` — test suites (62 files; Vitest + Testing Library)

| Group | Files | What they cover |
|---|---|---|
| `tests/engine/` | `test_bkt`, `test_credit`, `test_decay`, `test_dimensions(+_u1)`, `test_gate(+_u1)`, `test_graph`, `test_log`, `test_measurement_reduce(+_u1)`, `test_observation(+_u4)`, `test_policy(+_u9)`, `test_retention_u6`, `test_wall(+_u3)` | Pure engine unit tests. |
| `tests/engine/observe/` | `test_baseline`, `test_detectors`, `test_observe` | Behavioral-observation pipeline. |
| `tests/generators/` | `test_generators`, `test_grade(+_u4)`, `test_hints` | Generator + grading + hint-ladder. |
| `tests/runtime/` | `test_practiceFlow`, `test_tier2`, `test_useLessonEngine`, `test_flow_integration`, `test_generatedPractice`, `test_mixreview_u8`, `test_momsroom_flow`, `test_recognizer_segment`, `test_retention_probe_u7`, `test_stage_lessons_emission`, `test_unlikeden_emission`, `test_affectProbe`, `test_engine_surfaces` | Runtime hooks + lesson integration + surfaces. |
| `tests/runtime/affect/` | `test_affectState`, `test_compose`, `test_composite`, `test_governor`, `test_ledger`, `test_selfReport` | Affect corroboration engine. |
| `tests/harness/` | 17 files: `test_dashboard_render`, `test_expected_findings`, `test_findings_backlog`, `test_metrics_counter_pairing`, `test_oracle_invariants`, `test_param_disjointness`, `test_personas_inverse_errors`, `test_positive_control`, `test_quarantine`, `test_recursive_loop`, `test_report_projections`, `test_search`, `test_session_runner`, `test_tape_replay_determinism` | Harness correctness + determinism. |
| `tests/proof/` | `test_proof_engine`, `test_proof_integration` | Adaptive-engine proof tests. |
| `tests/e2e/` | `adaptive_flow.test.jsx`, `playability_smoke.test.jsx` | End-to-end flow + playability smoke. |

---

## GENERATED / ARTIFACT GROUPS (listed at group level — not source)

| Path | What it is |
|---|---|
| `web/.ui-sweep/` | Large UI-QA artifact tree (~250 files): screenshot PNGs, fit-audit JSON, feel-specs, intro-align before/after, plus the sweep scripts (`measure.mjs`, `console-sweep.mjs`, `cstyle.mjs`, `fix.workflow.mjs`, `assert-m2-*.mjs`, `REPORT.md`). Generated QA evidence + tooling. |
| `web/scripts/intro-shots/` | 9 intro screenshot PNGs. |
| `web/tools/ink-dump/` | 10 ink-dump PNGs. |
| `.claude/skills/` | Bundled skill definitions (game-dev, motion, spec tooling, etc.) — tooling, not application. |
| `.claude/scheduled_tasks.lock` | Scheduler lock. |

---

## DATA MODELS / SCHEMAS / IMPORTANT TYPES

### Engine wire DTOs (`engine/types.ts`)
- **Modality** = `'tap' | 'type' | 'handwriting' | 'voice'`
- **Actor** = `'human' | 'synthetic:<persona>'`
- **ScaffoldLevel** = `0|1|2|3|4` (L0 max support → L4 independent)
- **Action**, **Signal**, **Event** (Action | Signal) — append-only log entries
- **ErrorSignature** = `add_denominators | add_across_unlike | scaled_bottom_only | forced_leftover | not_simplified | other | null`
- **Observation** — rich per-attempt record (correct, answer_value, error_signature, latency, hint_max_rung, self_corrections, scaffold_level, modality, recognizer_confidence, too_fast_correct, problem_id?, surface_form?, affect_window[])
- **FluencyStats** — median_latency, slope, n
- **MasteryEstimate** — P_known, fluency_stats, max_scaffold_passed, transfer_passed, hint_dependence, last_retention_probe, mastered_at
- **Decision** (discriminated union, 7 kinds): PresentProblem, RouteToRoom, ReturnToKitchen, FadeScaffold, RaiseScaffold, TransferProbe, EscalateToHuman
- **SkillNode** — id, roomId, prereqs[], scaffold_ladder[][], transfer_forms[], bkt_params?, standards?, grade?

### Skill-graph nodes (`engine/graph.ts`) — the 10 "models" (DAG vertices)
| Node id | roomId | prereqs | CCSS grade |
|---|---|---|---|
| MULT_EQUAL_GROUPS | m1 | [] | 3 |
| MULT_FACTS | m3 | [MULT_EQUAL_GROUPS] | 3 |
| FRACTION_ON_LINE | nl | [] | 3 |
| ADD_SAME_DEN | r1 | [] | 4 |
| SUB_SAME_DEN | s1 | [ADD_SAME_DEN] | 4 |
| COMPARE_BENCHMARK | cmp | [FRACTION_ON_LINE] | 4 |
| ADD_UNLIKE_NESTED | r3 | [ADD_SAME_DEN] | 5 |
| ADD_UNLIKE_COPRIME | r2 | [MULT_FACTS, ADD_UNLIKE_NESTED] | 5 |
| SIMPLIFY | r4 | [MULT_FACTS, ADD_UNLIKE_COPRIME] | 4 |
| IMPROPER_TO_MIXED | r5 | [ADD_UNLIKE_COPRIME] | 4 |

### Engine parameters (`engine/params.ts` — the config "schema")
PARAMS: bkt{P_T 0.20, P_S 0.10, P_G 0.20}, P_L0 0.10, prereqWeight 0.3,
priorClamp [0.05,0.85], pKnownClamp [0.01,0.99], gateThreshold 0.95,
wallTheta 0.6, fadeStreakK 3, raiseErrorsM 2, fluencyMinN 5, creditDiscount 0.3,
latencyFloorMs 1200, fluencyHardMode false, fluencyLatencyTargetMs 15000,
frustrationScaffold false, escalation{nStuck 6, nDiseng 5}.

### Settings record (`settings.js`) — `bf_settings_v1`
`{ voiceVol: 0-100, musicVol: 0-100, inputMode: "stylus"|"typing" }`; defaults `{80,55,"stylus"}`.

### Persistence keys (localStorage)
- `moms-engine-log-v1` — the append-only engine Event log (authoritative).
- `moms-kitchen-progress-v1` — legacy binary `{ mastered: string[] }` (migration source + still written for back-compat).
- `bf_settings_v1` — settings record.
- legacy `musicVolume` (0-1) / `musicMuted` ("1") — pre-settings music prefs (one-time migrated).

### Room registry (`rooms.js`)
ROOMS[] entries: `{ id, nodeId, no, title, concept, built, pos{x,y}, intro, introDurationMs, verb, example }`.
STRANDS[]: `{ id, title, blurb, lessons[], pos{x,y} }` — `found`, `build`, `combine`.

---

## API ENDPOINTS (dev-only Vite middleware — no production server)

| Method + Path | What it is |
|---|---|
| `POST /__ink` | Append a handwriting sample (stroke points + PNG thumbnail + recognizer guess) to `ink-log.jsonl`. |
| `DELETE /__ink` | Clear `ink-log.jsonl`. |
| `GET /__ink` | Return `{ entries: N }` count. |
| `POST /api/tts` | `{ text, speaker }` → synthesize via ElevenLabs, cache mp3 to `public/voice/cache/`, return audio/mpeg (silent on missing key/voice). |

## EXTERNAL INTEGRATIONS
- **ElevenLabs** (text-to-speech), dev-only via `/api/tts` and `scripts/*voice*.mjs`. Model `eleven_multilingual_v2`.
- **ONNX Runtime Web** (`onnxruntime-web`) running a local `public/mnist-12.onnx` model in-browser.
- **Playwright** (devDependency) — screenshot scripts + the `.ui-sweep` tooling.

## CONFIG KEYS / ENV VARS / FEATURE FLAGS
- **Env vars** (`web/.env.example`, names only): `ELEVENLABS_API_KEY`, `ELEVEN_VOICE_COOK`, `ELEVEN_VOICE_MOM`, `ELEVEN_VOICE_KID`, `ELEVEN_VOICE_GRANDPA`. Purpose: API auth + per-character voice ids for voice baking and the dev TTS service.
- **Build env (Vite):** `import.meta.env.DEV` (gates the DEV MasteryInspector + dev middleware), `import.meta.env.BASE_URL` (asset base for music).
- **Feature flags (engine PARAMS — runtime tunables, not env):** `fluencyHardMode`, `frustrationScaffold`; harness-only flags `delayedProbe`, `unifiedTaxonomy` (plan-002 flags, inert by default).
- **Vite server:** host `0.0.0.0` (`host: true`), dev port 5173, preview port 4173 (strictPort).

## UI SCREENS / ROUTES (seeds the wireframe)

Hash routes via `Shell.jsx` (`#/<route>`):
| Route | Screen | Component |
|---|---|---|
| `''` / `title` | Title screen | TitleScreen |
| `world` | Lesson map (strands → rooms) | WorldMap |
| `mom` | Babushka's Kitchen hub (word problems) | MomsRoom |
| `review` | Mixed Basket interleaved practice | MixedReview |
| `settings` | Settings overlay | SettingsScreen |
| `concepts` | Concept Mastery Map overlay | ConceptMap |
| `m1` | Equal Groups | AppM1 |
| `m3` | Times Facts | AppM3 |
| `nl` | On the Number Line | AppNumberLine |
| `r1` | Same Denominators | AppR1 |
| `s1` | Taking Away | AppSubtract |
| `cmp` | Compare & Check | AppCompare |
| `r3` | Scale One | LessonUnlikeDen (r3-nonunit) |
| `r2` | Cross-Multiply | LessonUnlikeDen (r2-unit) |
| `r4` | Simplify | AppR4 |
| `r5` | Mixed Numbers | AppR5 |
| (any room before first watch) | Room intro video | RoomIntro |
| (unbuilt room) | Empty room | EmptyRoom |

Plus always-mounted overlays: EngineSurfaces (RationaleBanner + Tier-2 nudge +
DEV MasteryInspector + AffectProbe), BackgroundMusic, TapToRead, the FAB bar
(Concepts + Settings buttons on title/world).
