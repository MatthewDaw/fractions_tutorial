# Partition — MECE slices

The census, grouped into mutually-exclusive, collectively-exhaustive slices along
the repo's natural module boundaries. Every census source file is assigned to
exactly ONE slice (a `leftovers` slice catches orphans). Ownership is expressed
as non-overlapping path globs; where two slices could match the same file the
globs are tightened so they cannot.

**Glob precedence rule (resolves any residual ambiguity):** a more-specific glob
wins over a broader one. Specifically: `web/src/harness/dashboard/**` belongs to
`harness`, NOT `ui-surfaces`; `web/src/components/lesson/**` and
`web/src/components/momsroom/**` belong to `lessons-rooms`, same as the rest of
`components/`. The top-level `web/src/*.jsx` screens are split by name between
`shell-nav` (chrome/router/map) and `lessons-rooms` (the `App*`/`Lesson*`/`Moms`/
`MixedReview` screens) — the exact name lists are enumerated per slice below so
there is no overlap.

---

## Slice index

| id | title | rough size |
|---|---|---|
| `engine-core` | Mastery / measurement engine (pure TS) | 18 src + ~17 tests |
| `generators` | Problem generators, grading, hints | 14 src + 4 tests |
| `runtime-affect` | React runtime hooks + advisory affect layer | 14 src + ~13 tests |
| `lessons-rooms` | Lesson screens, room components, lesson configs, kitchen | ~55 src |
| `shell-nav` | App shell, router, map, concept map, settings, audio/voice/intros | ~40 src |
| `ui-surfaces` | Engine model surfaces (banner/inspector/nudge/probe) | 4 src + ~3 tests |
| `harness` | Synthetic-learner red-team harness + dashboard | 29 src + 17 tests |
| `ink-recognition` | On-device handwriting digit recognition + training | 2 src + 1 test |
| `leftovers` | Root config, docs, scripts, assets, generated artifacts | everything else |

---

## Slices

### `engine-core`
- **title:** Mastery / measurement engine (pure, deterministic, wall-clock-free)
- **owned-globs:**
  - `web/src/engine/**/*.ts`
  - `web/tests/engine/**`
- **entry-points:** `engine/index.ts` (public wire-DTO surface), `policy.ts::nextDecision`, `gate.ts::isMastered`, `measurementReduce.ts`, `log.ts` (appendEvent/foldLog/loadLog/saveLog/migrateFromKitchenProgress), `graph.ts::allNodes`.
- **documents:** `data-model.md` (DTOs, MasteryEstimate, Decision, SkillNode), `design.md` (engine purity, BKT, credit assignment, decay, gate/policy), `env-and-config.md` (PARAMS table + flags), `requirements.md`, `tasks.md`, `gotchas.md` (prereq-ordering credit.ts:97 constraint).
- **depends-on:** none (DAG root subsystem). Referenced by `generators` (skill ids), `runtime-affect`, `shell-nav`, `harness` by pointer.

### `generators`
- **title:** Deterministic problem generators, answer grading, hint ladders
- **owned-globs:**
  - `web/src/generators/**`
  - `web/tests/generators/**`
- **entry-points:** `generators/index.js` (`generateFor`, `surfaceFormsFor`, `generatorSkills`, `hasGenerator`), `grade.js` (judging + error_signature), `hints.js`.
- **documents:** `design.md` (generator core, determinism, problem envelope, hint ladders, grading→error_signature mapping), `requirements.md`, `tasks.md`.
- **depends-on:** `engine-core` (skill ids + ScaffoldLevel + ErrorSignature) by pointer.

### `runtime-affect`
- **title:** React runtime hooks (lesson engine bridge) + advisory affect layer
- **owned-globs:**
  - `web/src/runtime/**`
  - `web/tests/runtime/affect/**`
  - `web/tests/runtime/test_practiceFlow.test.js`
  - `web/tests/runtime/test_tier2.test.js`
  - `web/tests/runtime/test_useLessonEngine.test.jsx`
  - `web/tests/runtime/test_flow_integration.test.jsx`
  - `web/tests/runtime/test_generatedPractice.test.jsx`
  - `web/tests/runtime/test_retention_probe_u7.test.js`
  - `web/tests/runtime/test_stage_lessons_emission.test.jsx`
  - `web/tests/runtime/test_unlikeden_emission.test.jsx`
- **entry-points:** `useLessonEngine.js`, `practiceFlow.js`, `engineStore.js`/`useEngineStore.js`, `scaffoldMap.js` (`toBeatForLevel`), `tier2.js`, `affect/index.js` (`composeAffect`).
- **documents:** `design.md` (boundary-only decision calls R16, store bridge, scaffold-map, Tier-2 nudges, affect corroboration + advisory firewall), `requirements.md`, `tasks.md`, `gotchas.md` (firewall — affect never reaches gate).
- **depends-on:** `engine-core`, `generators` by pointer.
- **note:** the remaining `web/tests/runtime/*` files (`test_affectProbe`, `test_engine_surfaces`, `test_momsroom_flow`, `test_mixreview_u8`, `test_recognizer_segment`) are owned by other slices — see those slices' globs below to keep `web/tests/runtime/` non-overlapping.

### `lessons-rooms`
- **title:** Lesson screens, room manipulative components, lesson configs, kitchen, mixed review
- **owned-globs:**
  - `web/src/AppR1.jsx`, `web/src/AppR4.jsx`, `web/src/AppR5.jsx`, `web/src/AppM1.jsx`, `web/src/AppM3.jsx`, `web/src/AppNumberLine.jsx`, `web/src/AppSubtract.jsx`, `web/src/AppCompare.jsx`, `web/src/LessonUnlikeDen.jsx`, `web/src/MomsRoom.jsx`, `web/src/MixedReview.jsx`
  - `web/src/components/**`
  - `web/src/lessons/**`
  - `web/src/momsProblems.js`, `web/src/unlikeDenMath.js`
  - `web/src/styles/r1.css`, `r4.css`, `r5.css`, `s1.css`, `m1.css`, `m3.css`, `nl.css`, `cmp.css`, `lesson.css`, `lesson-board.css`, `lesson-unlike.css`, `mixreview.css`, `momsroom.css`, `sandbox.css`, `slate.css`, `blankslate.css`, `questionband.css`, `stagetabs.css`, `gen-practice.css`, `fitstage.css`
  - `web/tests/runtime/test_momsroom_flow.test.jsx`
  - `web/tests/runtime/test_mixreview_u8.test.jsx`
  - `web/tests/e2e/**`
- **entry-points:** the room `App*`/`Lesson*` screens (rendered by `Shell.jsx`), `MomsRoom`, `MixedReview`, `lessons/r2-unit.js` + `r3-nonunit.js`, manipulative components.
- **documents:** `requirements.md` (per-room learning goals + scaffold ladders), `ui-wireframes.md` (room layouts — but the NAV GRAPH itself is synthesis-owned), `design.md` (lesson scene architecture, manipulatives, beats), `tasks.md`.
- **depends-on:** `runtime-affect` (useLessonEngine/practiceFlow/scaffoldMap), `generators`, `engine-core`, `shell-nav` (rooms.js metadata) by pointer.

### `shell-nav`
- **title:** App shell + hash router + lesson map + concept map + settings + audio/voice/intros
- **owned-globs:**
  - `web/index.html`, `web/src/main.jsx`
  - `web/src/Shell.jsx`, `web/src/TitleScreen.jsx`, `web/src/WorldMap.jsx`, `web/src/EmptyRoom.jsx`, `web/src/RoomIntro.jsx`, `web/src/SettingsScreen.jsx`, `web/src/SettingsButton.jsx`, `web/src/ConceptMap.jsx`, `web/src/BackgroundMusic.jsx`, `web/src/TapToRead.jsx`
  - `web/src/rooms.js`, `web/src/kitchenProgress.js`, `web/src/conceptTree.js`, `web/src/ccss.js`, `web/src/ccssStandards.js`, `web/src/denominatorColors.js`
  - `web/src/settings.js`, `web/src/music.js`, `web/src/audioBus.js`, `web/src/voice.js`, `web/src/voiceLines.js`, `web/src/speechify.js`
  - `web/src/intro*.js` (introCmp, introM1, introM3, introNL, introR1, introR2, introR3, introR4, introR5, introS1)
  - `web/src/styles/title.css`, `world.css`, `conceptmap.css`, `settings.css`, `tokens.css`, `voicetap.css`
  - `web/public/intros/**`, `web/public/music/**`, `web/public/voice/**`, `web/public/settings-gear.png`
- **entry-points:** `main.jsx`→`Shell.jsx` (router + stage fit + mastery load), `WorldMap`, `ConceptMap`, `SettingsScreen`, `rooms.js` (ROOMS/STRANDS), `kitchenProgress.js`.
- **documents:** `requirements.md` (navigation, settings, intros, audio), `ui-wireframes.md` (chrome screens — nav graph is synthesis-owned), `env-and-config.md` (settings record, localStorage keys, build env), `data-model.md` (rooms/strands shapes, settings record), `design.md` (router, stage scaling, concept tree, audio routing), `tasks.md`.
- **depends-on:** `engine-core` (mastery load), `lessons-rooms` (renders them) by pointer.

### `ui-surfaces`
- **title:** Always-mounted engine model surfaces (rationale banner, inspector, nudge toast, affect probe)
- **owned-globs:**
  - `web/src/ui/**`
  - `web/src/styles/engine-surfaces.css`, `web/src/styles/affectprobe.css`
  - `web/tests/runtime/test_engine_surfaces.test.jsx`
  - `web/tests/runtime/test_affectProbe.test.jsx`
- **entry-points:** `ui/EngineSurfaces.jsx` (mounted by Shell), `RationaleBanner`, `MasteryInspector`, `AffectProbe`.
- **documents:** `design.md` (model surfaces, KTD8 rationale display, counter-metrics inspector, affect self-report), `requirements.md`, `tasks.md`.
- **depends-on:** `runtime-affect` (engineStore), `engine-core` (MasteryEstimate) by pointer.

### `harness`
- **title:** Synthetic-learner red-team harness + CLI + dashboard
- **owned-globs:**
  - `web/src/harness/**`
  - `web/tests/harness/**`
  - `web/tests/proof/**`
- **entry-points:** `harness/cli.js` (`npm run harness --` baseline/search/loop/report), `harness/index.js`, `sessionRunner.js::runSweep`, `recursiveLoop.js::runLoop`, `search.js::searchNearestFlip`, `oracle/expectedFindings.js`, dashboard (`dashboard/HarnessDashboard.jsx`).
- **documents:** `design.md` (harness architecture: personas, oracle, tapes, determinism, recursive loop, champions, dashboard), `requirements.md`, `tasks.md`, `api-contracts.md` (CLI subcommands + flags + emitted artifacts).
- **depends-on:** `engine-core`, `generators` by pointer.

### `ink-recognition`
- **title:** On-device handwritten-digit recognition + model training
- **owned-globs:**
  - `web/src/ink/**`
  - `web/tools/train_mnist.py`
  - `web/tools/dump-ink.mjs`
  - `web/public/mnist-12.onnx`
  - `web/tests/runtime/test_recognizer_segment.test.jsx`
- **entry-points:** `ink/recognizer.js` (ONNX MNIST + $P fallback + rasterize), `tools/train_mnist.py` (produces the onnx model).
- **documents:** `design.md` (recognizer pipeline, preprocessing, fallback), `requirements.md`, `tasks.md`, `gotchas.md` (onnxruntime-web Vite exclude, digits-only scope).
- **depends-on:** consumed by `lessons-rooms` (Slate/InkPad) by pointer.
- **note:** the `/__ink` dev endpoint + `ink-log.jsonl` live in `vite.config.js` (owned by `leftovers`), but are documented by this slice via pointer.

### `leftovers`
- **title:** Root config, project docs, build/dev scripts, static assets, generated artifacts
- **owned-globs:**
  - `pyproject.toml`, `CLAUDE.md`, `.ccss-contract.md`, `.gitignore`, `hiring_partners.csv`, `uv.lock`
  - `docs/**` (EXCEPT the new `docs/fractions_tutorial-rebuild-spec/**`)
  - `web/package.json`, `web/package-lock.json`, `web/vite.config.js`, `web/tsconfig.json`, `web/vitest.setup.js`, `web/.env.example`, `web/.gitignore`, `web/ink-log.jsonl`, `web/_fit.png`, `web/_ink_big.png`
  - `web/scripts/**` (voice/music/screenshot build scripts + intro-shots)
  - `web/tools/ink-dump/**`
  - `web/.ui-sweep/**`
  - `.claude/**`
- **entry-points:** npm scripts (`vite.config.js` dev middleware `/__ink`, `/api/tts`), `scripts/*.mjs`.
- **documents:** `env-and-config.md` (build config, vite middleware endpoints, env vars), `constitution.md` (already filled), `gotchas.md` (resolveTsFromJs, dev-only endpoints). The bundled docs/ are reference material, not re-documented.
- **depends-on:** none (orphan catch-all).

---

## Synthesis-owned (do NOT document in any slice)

A single later synthesis step owns these cross-cutting artifacts so no two slice
workers describe the same shared thing:

- **Top-level architecture overview** — the engine ⇄ runtime ⇄ lessons ⇄ surfaces
  layering and the engine-purity / advisory-affect-firewall boundary (spans
  `engine-core`, `runtime-affect`, `ui-surfaces`, `lessons-rooms`). → `design.md` intro + `diagrams/`.
- **The glossary** — BKT, scaffold L0–L4, mastery gate, transfer probe, surface
  form, error signature, KTD/R numbering, Tier-1/2/3, strand/room/recipe. → `glossary.md`.
- **Spanning ADRs** — engine purity & wire-DTO contract; advisory affect firewall;
  stylus-handwriting/ONNX decision; TS-authored engine imported via `.js`
  (resolveTsFromJs); the prereq-prepend credit-assignment constraint. → `adrs/`.
- **Wireframe navigation graph** — the route graph across all screens (title →
  world → strand → room/intro → lesson → kitchen/review, plus settings/concepts
  overlays). Per-screen layouts are slice-owned; the GRAPH connecting them is
  synthesis-owned. → `ui-wireframes.md` (nav graph) + `diagrams/`.
- **Overall data-flow diagram** — Action/Signal event → log → measurementReduce →
  MasteryEstimate → policy Decision → practiceFlow → next problem / surfaces.
  → `diagrams/` + `data-model.md` flow section.
- **The constitution** — `constitution.md` (already authored by CENSUS).

---

## Exhaustiveness check

Every census source path is covered:
- `web/src/engine/**` → engine-core
- `web/src/generators/**` → generators
- `web/src/runtime/**` → runtime-affect
- `web/src/harness/**` → harness
- `web/src/ink/**` → ink-recognition
- `web/src/ui/**` → ui-surfaces
- `web/src/components/**`, `web/src/lessons/**`, room `App*`/`Lesson*`/`Moms*`/`MixedReview` screens, `momsProblems.js`, `unlikeDenMath.js` → lessons-rooms
- remaining `web/src/*.jsx` + `web/src/*.js` (shell/map/settings/audio/voice/intros/rooms/ccss/conceptTree) → shell-nav
- `web/src/styles/**` → split between lessons-rooms / shell-nav / ui-surfaces / harness by the per-file lists above
- `web/tests/**` → split by subsystem (engine/generators/runtime-affect/lessons-rooms/ui-surfaces/harness/ink) per the globs above
- `web/public/**` → split: intros/music/voice/settings-gear → shell-nav; mnist-12.onnx → ink-recognition
- `web/scripts/**`, `web/tools/ink-dump/**`, `web/.ui-sweep/**`, root config + docs + `.claude/**` → leftovers
- `web/tools/train_mnist.py`, `web/tools/dump-ink.mjs` → ink-recognition; `web/vite.config.js` et al → leftovers
