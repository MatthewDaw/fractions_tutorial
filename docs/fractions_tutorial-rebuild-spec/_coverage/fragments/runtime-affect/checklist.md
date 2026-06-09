# Slice checklist — `runtime-affect`

Tracks every owned census item and the fragment that documents it. Tick `[x]`
when covered. On restart, do only `[ ]` rows.

## Owned source — `web/src/runtime/**`

- [x] `useLessonEngine.js` → design.md §2, requirements R-RT-1..6, gotchas G1/G3/G4
- [x] `practiceFlow.js` → design.md §3, requirements R-RT-7, gotchas G5
- [x] `useGeneratedPractice.js` → design.md §4, requirements R-RT-8
- [x] `useLessonScaffold.js` → design.md §5, requirements R-RT-9, gotchas G6/G7
- [x] `scaffoldMap.js` (`toScaffoldLevel`, `toBeatForLevel`) → design.md §6, requirements R-RT-10
- [x] `tier2.js` → design.md §7, requirements R-RT-11, gotchas G2
- [x] `engineStore.js` → design.md §8, requirements R-RT-12
- [x] `useEngineStore.js` → design.md §8
- [x] `affect/index.js` (`composeAffect`) → design.md §9.1, requirements R-AF-1, gotchas G8 (FIREWALL)
- [x] `affect/composite.js` → design.md §9.2, requirements R-AF-2 (corroboration invariant)
- [x] `affect/affectState.js` → design.md §9.3, requirements R-AF-3 (valence firewall)
- [x] `affect/governor.js` → design.md §9.4, requirements R-AF-4
- [x] `affect/ledger.js` → design.md §9.5, requirements R-AF-5
- [x] `affect/selfReport.js` → design.md §9.6, requirements R-AF-6

## Owned tests (this slice only — per partition.md)

- [x] `tests/runtime/affect/test_compose.test.js` → design.md §9.1 + requirements R-AF-1
- [x] `tests/runtime/affect/test_composite.test.js` → design.md §9.2 + R-AF-2
- [x] `tests/runtime/affect/test_affectState.test.js` → design.md §9.3 + R-AF-3
- [x] `tests/runtime/affect/test_governor.test.js` → design.md §9.4 + R-AF-4
- [x] `tests/runtime/affect/test_ledger.test.js` → design.md §9.5 + R-AF-5
- [x] `tests/runtime/affect/test_selfReport.test.js` → design.md §9.6 + R-AF-6
- [x] `tests/runtime/test_practiceFlow.test.js` → requirements R-RT-7 G/W/T
- [x] `tests/runtime/test_tier2.test.js` → requirements R-RT-11 G/W/T
- [x] `tests/runtime/test_useLessonEngine.test.jsx` → requirements R-RT-1..6 + R16/U2 G/W/T
- [x] `tests/runtime/test_flow_integration.test.jsx` → design.md §6 (toBeatForLevel); kitchenProgress = shell-nav (pointer)
- [x] `tests/runtime/test_generatedPractice.test.jsx` → requirements R-RT-8 G/W/T
- [x] `tests/runtime/test_retention_probe_u7.test.js` → design.md §10 (pointer to shell-nav kitchenProgress + engine decay)
- [x] `tests/runtime/test_stage_lessons_emission.test.jsx` → design.md §11 (emission contract; lesson screens = lessons-rooms)
- [x] `tests/runtime/test_unlikeden_emission.test.jsx` → design.md §11 (emission contract)

## Fragments written

- [x] `checklist.md` (this file)
- [x] `design.md`
- [x] `requirements.md`
- [x] `tasks.md`
- [x] `gotchas.md`
- [x] `adrs/ADR-RT-001-boundary-only-decisions.md`
- [x] `adrs/ADR-RT-002-advisory-affect-firewall.md`
- [x] `adrs/ADR-RT-003-engine-store-bridge.md`
- [x] `adrs/ADR-RT-004-corroboration-as-arithmetic.md`

## Undocumented owned items

None. Every owned glob item is covered. Cross-slice references (engine-core,
generators, kitchenProgress in shell-nav, lesson screens in lessons-rooms,
ui surfaces) are referenced BY POINTER only, never re-documented.
