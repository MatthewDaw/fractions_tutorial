# Ledger — slice status + resume surface

One row per slice (status starts `todo`, owner-ticket `TBD`). Under each slice, a
per-item checklist: one `[ ]` line per census item that slice owns. As a slice
worker documents an item, tick it `[x]` and append `→ <destination spec section>`.
This is what makes slice workers restartable.

| slice-id | status | owner-ticket | notes |
|---|---|---|---|
| engine-core | todo | TBD | DAG-root subsystem; pure TS; document the firewall + purity constraints. |
| generators | todo | TBD | 10 generators + grade + hints + core. |
| runtime-affect | todo | TBD | boundary-only decisions; advisory affect firewall. |
| lessons-rooms | todo | TBD | 11 lesson screens + 34 components + 2 configs + kitchen + review. |
| shell-nav | todo | TBD | router/map/concept-map/settings/audio/voice/intros + rooms.js. |
| ui-surfaces | todo | TBD | 4 engine model surfaces. |
| harness | todo | TBD | synthetic-learner harness + CLI + dashboard. |
| ink-recognition | todo | TBD | ONNX MNIST recognizer + training. |
| leftovers | todo | TBD | root config, docs, scripts, assets, vite middleware. |

---

## engine-core
- [ ] web/src/engine/index.ts
- [ ] web/src/engine/types.ts
- [ ] web/src/engine/params.ts
- [ ] web/src/engine/graph.ts
- [ ] web/src/engine/bkt.ts
- [ ] web/src/engine/credit.ts
- [ ] web/src/engine/decay.ts
- [ ] web/src/engine/dimensions.ts
- [ ] web/src/engine/gate.ts
- [ ] web/src/engine/log.ts
- [ ] web/src/engine/mastery.ts
- [ ] web/src/engine/measurementReduce.ts
- [ ] web/src/engine/observation.ts
- [ ] web/src/engine/policy.ts
- [ ] web/src/engine/wall.ts
- [ ] web/src/engine/observe/index.ts
- [ ] web/src/engine/observe/baseline.ts
- [ ] web/src/engine/observe/detectors.ts
- [ ] MODEL: 10 SkillNode DAG vertices (graph.ts)
- [ ] MODEL: MasteryEstimate / Observation / Decision / Event DTOs (types.ts)
- [ ] CONFIG: PARAMS table + fluencyHardMode/frustrationScaffold flags (params.ts)
- [ ] PERSISTENCE: moms-engine-log-v1 + migrateFromKitchenProgress (log.ts)
- [ ] tests/engine/** (17 files) covered

## generators
- [ ] web/src/generators/index.js
- [ ] web/src/generators/core.js
- [ ] web/src/generators/hints.js
- [ ] web/src/generators/grade.js
- [ ] web/src/generators/addSameDen.js
- [ ] web/src/generators/subSameDen.js
- [ ] web/src/generators/addUnlikeNested.js
- [ ] web/src/generators/addUnlikeCoprime.js
- [ ] web/src/generators/simplify.js
- [ ] web/src/generators/improperToMixed.js
- [ ] web/src/generators/multEqualGroups.js
- [ ] web/src/generators/multFacts.js
- [ ] web/src/generators/fractionOnLine.js
- [ ] web/src/generators/compareBenchmark.js
- [ ] tests/generators/** (4 files) covered

## runtime-affect
- [ ] web/src/runtime/useLessonEngine.js
- [ ] web/src/runtime/practiceFlow.js
- [ ] web/src/runtime/useGeneratedPractice.js
- [ ] web/src/runtime/useLessonScaffold.js
- [ ] web/src/runtime/scaffoldMap.js
- [ ] web/src/runtime/tier2.js
- [ ] web/src/runtime/engineStore.js
- [ ] web/src/runtime/useEngineStore.js
- [ ] web/src/runtime/affect/index.js
- [ ] web/src/runtime/affect/composite.js
- [ ] web/src/runtime/affect/affectState.js
- [ ] web/src/runtime/affect/governor.js
- [ ] web/src/runtime/affect/ledger.js
- [ ] web/src/runtime/affect/selfReport.js
- [ ] CONSTRAINT: nextDecision only at submit/entry boundary (R16)
- [ ] CONSTRAINT: advisory affect firewall (never mutates MasteryEstimate)
- [ ] tests/runtime/affect/** (6) + the 8 runtime tests owned by this slice

## lessons-rooms
- [ ] web/src/AppR1.jsx (r1 Same Denominators)
- [ ] web/src/AppR4.jsx (r4 Simplify)
- [ ] web/src/AppR5.jsx (r5 Mixed Numbers)
- [ ] web/src/AppM1.jsx (m1 Equal Groups)
- [ ] web/src/AppM3.jsx (m3 Times Facts)
- [ ] web/src/AppNumberLine.jsx (nl)
- [ ] web/src/AppSubtract.jsx (s1 Taking Away)
- [ ] web/src/AppCompare.jsx (cmp Compare & Check)
- [ ] web/src/LessonUnlikeDen.jsx (r2 + r3 shared)
- [ ] web/src/MomsRoom.jsx (kitchen hub)
- [ ] web/src/MixedReview.jsx (Mixed Basket)
- [ ] web/src/lessons/r2-unit.js
- [ ] web/src/lessons/r3-nonunit.js
- [ ] web/src/momsProblems.js
- [ ] web/src/unlikeDenMath.js
- [ ] web/src/components/*.jsx (23 top-level manipulatives/scene parts)
- [ ] web/src/components/lesson/* (7 files)
- [ ] web/src/components/momsroom/* (4 files)
- [ ] STYLES: r1/r4/r5/s1/m1/m3/nl/cmp/lesson*/mixreview/momsroom/sandbox/slate/blankslate/questionband/stagetabs/gen-practice/fitstage css
- [ ] tests/runtime/test_momsroom_flow + test_mixreview_u8
- [ ] tests/e2e/** (2 files)

## shell-nav
- [ ] web/index.html, web/src/main.jsx
- [ ] web/src/Shell.jsx (router + stage fit + mastery load + scaffold entry + probe settle)
- [ ] web/src/TitleScreen.jsx
- [ ] web/src/WorldMap.jsx
- [ ] web/src/EmptyRoom.jsx
- [ ] web/src/RoomIntro.jsx
- [ ] web/src/SettingsScreen.jsx, web/src/SettingsButton.jsx
- [ ] web/src/ConceptMap.jsx
- [ ] web/src/BackgroundMusic.jsx
- [ ] web/src/TapToRead.jsx
- [ ] web/src/rooms.js (ROOMS/STRANDS/KITCHEN/CENTER)
- [ ] web/src/kitchenProgress.js
- [ ] web/src/conceptTree.js
- [ ] web/src/ccss.js, web/src/ccssStandards.js, web/src/denominatorColors.js
- [ ] web/src/settings.js (bf_settings_v1)
- [ ] web/src/music.js, web/src/audioBus.js
- [ ] web/src/voice.js, web/src/voiceLines.js, web/src/speechify.js
- [ ] web/src/intro{Cmp,M1,M3,NL,R1,R2,R3,R4,R5,S1}.js (10 cue sheets)
- [ ] STYLES: title/world/conceptmap/settings/tokens/voicetap css
- [ ] ASSETS: public/intros (10), public/music (5), public/voice (~190), settings-gear.png
- [ ] CONFIG: bf_settings_v1 + legacy music keys + import.meta.env usage

## ui-surfaces
- [ ] web/src/ui/EngineSurfaces.jsx
- [ ] web/src/ui/RationaleBanner.jsx
- [ ] web/src/ui/MasteryInspector.jsx
- [ ] web/src/ui/AffectProbe.jsx
- [ ] STYLES: engine-surfaces.css, affectprobe.css
- [ ] tests/runtime/test_engine_surfaces + test_affectProbe

## harness
- [ ] web/src/harness/index.js, cli.js, config.js, engineApi.js
- [ ] web/src/harness/rng.js, tape.js, sessionRunner.js, metrics.js, findings.js, report.js, search.js, recursiveLoop.js
- [ ] web/src/harness/oracle/* (4 files)
- [ ] web/src/harness/personas/* (4 files)
- [ ] web/src/harness/quarantine/* (2 files)
- [ ] web/src/harness/dashboard/* (7 files incl. dashboard.css)
- [ ] API: harness CLI subcommands (baseline/search/loop/report) + flags + emitted docs/harness artifacts
- [ ] tests/harness/** (17) + tests/proof/** (2)

## ink-recognition
- [ ] web/src/ink/recognizer.js
- [ ] web/tools/train_mnist.py
- [ ] web/tools/dump-ink.mjs
- [ ] web/public/mnist-12.onnx
- [ ] tests/runtime/test_recognizer_segment
- [ ] POINTER: /__ink dev endpoint (vite.config.js) + ink-log.jsonl

## leftovers
- [ ] pyproject.toml, CLAUDE.md, .ccss-contract.md, .gitignore, hiring_partners.csv, uv.lock
- [ ] web/package.json, package-lock.json, vite.config.js, tsconfig.json, vitest.setup.js, .env.example, .gitignore
- [ ] web/scripts/*.mjs (8) + intro-shots
- [ ] web/tools/ink-dump (10 PNGs)
- [ ] web/.ui-sweep/** (artifact tree)
- [ ] .claude/** (skills + scheduler lock)
- [ ] docs/** (existing reference docs — not re-documented, catalogued only)
- [ ] API: /__ink + /api/tts dev middleware; ELEVENLABS env vars
- [ ] web/ink-log.jsonl, web/_fit.png, web/_ink_big.png
