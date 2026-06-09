# Harness — coverage checklist

> Slice `harness` (MAT-132). Every census item under the owned globs
> (`web/src/harness/**`, `web/tests/harness/**`, `web/tests/proof/**`), ticked when
> documented in a fragment. `[x]` = covered; `[~]` = covered by pointer.

## `web/src/harness/` source (29 files)
- [x] `index.js` — public barrel (api-contracts §3)
- [x] `cli.js` — CLI entry, subcommands/flags/artifacts (api-contracts §1–2)
- [x] `config.js` — makeRun/defaultFlags/paramsHash (api-contracts §5)
- [x] `engineApi.js` — single engine bind point (api-contracts §4, design §2)
- [x] `rng.js` — personaRng/randInt/pick/chance (design §4, tasks T1)
- [x] `tape.js` — canonical serialization/hashing (api-contracts §6, ADR 0002)
- [x] `sessionRunner.js` — runSession/runSweep/characterizeScriptedStage (design §3)
- [x] `metrics.js` — MetricsRecord/aggregate/clusterFailures (design §6, R-HARN-6)
- [x] `findings.js` — buildBacklog/render (design §6, requirements R-HARN-12)
- [x] `report.js` — build*/render* projections (design §9, ADR 0002)
- [x] `search.js` — searchNearestFlip/searchCoverage (design §7)
- [x] `recursiveLoop.js` — runLoop/distillChampions/replayChampions (design §8, ADR 0003)
- [x] `oracle/expectedFindings.js` — the 6 audit defects (design §5)
- [x] `oracle/invariants.js` — metamorphic relations (design §5, R-HARN-9)
- [x] `oracle/latentTruth.js` — labelTape/τ_latent (design §5, R-HARN-7)
- [x] `oracle/positiveControl.js` — verify-first + blindControl (design §5, R-HARN-8)
- [x] `personas/library.js` — population (design §4, ADR 0001)
- [x] `personas/model.js` — makePersona factory (design §4)
- [x] `personas/families.js` — train/held-out families (design §4, ADR 0003)
- [x] `personas/inverseErrors.js` — inverse-error map (design §4, R-HARN-5)
- [x] `quarantine/chaos.js` — chaos fault-injection (design §10, R-HARN-13)
- [x] `quarantine/llmDiscriminator.js` — blind Turing check (design §10, R-HARN-13)
- [x] `dashboard/index.js` — barrel + mount (api-contracts §7)
- [x] `dashboard/HarnessDashboard.jsx` — root view (design §11)
- [x] `dashboard/FailureHeatmap.jsx` — heatmap viz (design §11)
- [x] `dashboard/RecursivePanel.jsx` — loop panel (design §11)
- [x] `dashboard/VerdictCard.jsx` — replayable card (design §11)
- [x] `dashboard/data.js` — pure projections (design §11)
- [x] `dashboard/dashboard.css` — dashboard styles (design §11; styles per-component, not enumerated)

## `web/tests/harness/` (14 files present; census said 17 — see note)
- [x] `test_dashboard_render` (R-HARN-14)
- [x] `test_expected_findings` (R-HARN-12, tasks T5)
- [x] `test_findings_backlog` (R-HARN-12, tasks T7)
- [x] `test_metrics_counter_pairing` (R-HARN-6)
- [x] `test_oracle_invariants` (R-HARN-9)
- [x] `test_param_disjointness` (R-HARN-3, ADR 0001)
- [x] `test_personas_inverse_errors` (R-HARN-5)
- [x] `test_positive_control` (R-HARN-8)
- [x] `test_quarantine` (R-HARN-13)
- [x] `test_recursive_loop` (R-HARN-10/11)
- [x] `test_report_projections` (R-HARN-12)
- [x] `test_search` (R-HARN-1, tasks T8)
- [x] `test_session_runner` (R-HARN-1/4)
- [x] `test_tape_replay_determinism` (R-HARN-1)

## `web/tests/proof/` (2 files)
- [x] `test_proof_engine.test.js` (R-HARN-15, tasks T14)
- [x] `test_proof_integration.test.jsx` (R-HARN-15, tasks T14)

## Notes / discrepancies
- The census Counts table lists "17 files" for `tests/harness/` and the prose lists
  14 named files; on disk there are exactly 14 in `tests/harness/` + 2 in
  `tests/proof/` = 16. The "17" appears to be a census miscount of the
  harness+proof bucket. All files physically present under the owned globs are
  documented above; no owned source file is left undocumented.
- `dashboard.css` and the harness has no CSS under `web/src/styles/**`; the
  partition assigns harness styles to `dashboard/dashboard.css` (in-tree), which is
  covered. No `web/src/styles/*.css` file belongs to this slice.
- Synthesis-owned items referenced only by pointer (not documented here): engine
  purity / wire-DTO contract, the glossary, the top-level architecture overview,
  and the engine/generator/runtime functions `engineApi.js` re-exports.
