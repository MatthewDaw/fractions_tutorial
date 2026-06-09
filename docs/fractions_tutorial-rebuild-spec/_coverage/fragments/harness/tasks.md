# Harness — tasks (rebuild order)

> Slice `harness` fragment. A dependency-ordered rebuild plan for
> `web/src/harness/**` + its tests. Mirrors the U-numbered plan in the source
> headers (U1–U11) but reordered for a clean-room rebuild. Each task names the
> file(s), the contract, and the verifying test. Engine/generators/runtime are
> prerequisites (rebuilt by their own slices) and consumed only via `engineApi.js`.

---

## T1 — Engine bind + deterministic RNG + tape codec (foundation)
- **Files:** `engineApi.js`, `rng.js`, `tape.js`, `config.js`, `index.js`.
- **Do:** re-export the engine/generator/runtime public surface from `engineApi.js`
  (the ONE bind point). Implement `personaRng(id, seed, step)` (reusing
  generators' `makeRng`/`hashStr`, NOT shadowing `rngFor`), `randInt`/`pick`/`chance`.
  Implement canonical serialization (`canonicalize`/`canonicalStringify`/`fnv1a`/
  `hashObject`/`serializeSession`/`tapesToJsonl`/`jsonlToTapes`) + the Node-only
  file sink behind a dynamic import. `config.js`: `defaultFlags`/`makeRun`/`paramsHash`.
- **Verify:** `test_tape_replay_determinism` (byte-identical), determinism asserts.

## T2 — Inverse-error map
- **Files:** `personas/inverseErrors.js`.
- **Do:** `misconceptionsFor(skill)` (≥2 per generator skill) + `inverseAnswer`
  computing the planted wrong answer from the real operands; named-signature
  arithmetic for add_denominators/add_across_unlike/scaled_bottom_only/
  forced_leftover/not_simplified, `other`-collapsing cognitive misconceptions, and
  slip fallbacks that never return the correct value.
- **Verify:** `test_personas_inverse_errors`.

## T3 — Persona factory, library, families
- **Files:** `personas/model.js`, `personas/library.js`, `personas/families.js`.
- **Do:** `makePersona(spec)` (default generative emit, per-session mutable state,
  latency-band draw with fatigue). Build the library (archetypes + non-BKT +
  3 audit spoofers). Build train/held-out families with DISJOINT latent ranges,
  fresh seed lineages, and non-BKT held-out emit laws. Keep the disjointness lint
  green (no `engine/params` import anywhere under `personas/`).
- **Verify:** `test_param_disjointness`.

## T4 — Headless session runner
- **Files:** `sessionRunner.js`.
- **Do:** `runSession` (the headless boundary mirror: measurementReduce →
  nextDecision @boundary → nextPractice → generateFor → persona.emit → grade →
  emit the burst segment() reads → update PolicyState exactly as useLessonEngine →
  record the tape). `runSweep` (personas × skills, fresh persona per pair).
  `characterizeScriptedStage` (read-only divergence stub). Mirror the empty
  recentBehavior channel; do NOT invent observations.
- **Verify:** `test_session_runner`.

## T5 — Oracle (latent truth, expected findings, positive control, invariants)
- **Files:** `oracle/latentTruth.js`, `oracle/expectedFindings.js`,
  `oracle/positiveControl.js`, `oracle/invariants.js`.
- **Do:** `labelTape`/`tapeHasAnyLabel` (τ_latent disjoint from gateThreshold);
  the six audit-defect probes (`runExpectedFindings`, each with `flagThatResolves`);
  the verify-first positive control + `blindControl`; the three metamorphic
  invariants (`checkInvariants`).
- **Verify:** `test_expected_findings`, `test_positive_control`, `test_oracle_invariants`.

## T6 — Metrics + counter-pairing + clustering
- **Files:** `metrics.js`.
- **Do:** `MetricsRecord` (constructor throws on an unpaired headline — KTD5),
  `aggregate` (population + per-persona-class), `clusterFailures`
  (persona×skill×decision, severity×count).
- **Verify:** `test_metrics_counter_pairing`.

## T7 — Findings backlog
- **Files:** `findings.js`.
- **Do:** `buildBacklog` (four ranked categories, audit reconciliation suppresses
  harness duplicates, `humanAgreementWith`) + `renderBacklogMarkdown`.
- **Verify:** `test_findings_backlog`.

## T8 — Adversarial search + coverage
- **Files:** `search.js`.
- **Do:** `searchNearestFlip` ((μ,λ) loop inside the plausibility box, replayable
  `{latent, seed}`), `searchCoverage` (novelty-keeping coverage variant), the box
  projection + distance metric (`LATENT_DIMS`, `PLAUSIBILITY_CEILINGS`,
  `distanceToHonest`).
- **Verify:** `test_search`.

## T9 — Recursive loop + champions
- **Files:** `recursiveLoop.js`.
- **Do:** `runLoop` (train + sealed held-out before/after, REAL/GAMING/NO_CHANGE,
  guardrail, deflated pass-rate, regressions, decisionLogEntry; `perturbMetrics`/
  `perturbTapes` test hooks). `distillChampions` + `replayChampions`.
- **Verify:** `test_recursive_loop`.

## T10 — Reports (pure projections)
- **Files:** `report.js`.
- **Do:** build/render split for verdict cards, baseline report, decision log,
  limitations memo, research notes; the `ENGINE_PATH_SCOPE` banner on every
  certification claim.
- **Verify:** `test_report_projections`.

## T11 — Quarantine facets
- **Files:** `quarantine/chaos.js`, `quarantine/llmDiscriminator.js`.
- **Do:** chaos fault-injection on deep clones (steady-state + blast radius, no
  original mutation), the blind LLM discriminator (judge-only, graceful degrade,
  static tells). Keep both isolated from search/recursiveLoop.
- **Verify:** `test_quarantine`.

## T12 — CLI
- **Files:** `cli.js`.
- **Do:** `parseArgs` + the four subcommands (`baseline`/`search`/`loop`/`report`)
  + `--dry` smoke; wire every projection through `writeDoc`/tape/champion sinks at
  the repo-root `docs/harness/` paths; assert determinism in `baseline`.
- **Verify:** manual `npm run harness -- baseline --seed 1`; `report` re-projection.

## T13 — Dashboard
- **Files:** `dashboard/data.js`, `HarnessDashboard.jsx`, `FailureHeatmap.jsx`,
  `RecursivePanel.jsx`, `VerdictCard.jsx`, `index.js`, `dashboard.css`.
- **Do:** pure data projections reusing report/oracle; the master-detail view;
  `runDemoSweep` (small subset), `replaySession` (divergence flag);
  `mountHarnessDashboard` standalone mount. Do NOT wire into `Shell.jsx` (pointer
  only — shell-nav owned).
- **Verify:** `test_dashboard_render`.

## T14 — Proof suite (skeptic-facing, owned tests)
- **Files:** `web/tests/proof/test_proof_engine.test.js`,
  `test_proof_integration.test.jsx`.
- **Do:** deterministic assertions against the REAL engine/runtime, thresholds read
  live from `params.ts`. (Exercises engine/runtime behavior documented by their
  slices; the test files live under this slice's globs.)
