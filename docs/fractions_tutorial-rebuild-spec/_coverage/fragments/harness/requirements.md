# Harness — requirements

> Slice `harness` fragment. RFC-2119 requirements + Given/When/Then acceptance
> criteria for the synthetic-learner red-team harness (`web/src/harness/**`),
> grounded in the source and the harness/proof test suites
> (`web/tests/harness/**`, `web/tests/proof/**`).

---

## R-HARN-1 — Determinism (replay-exact)

The harness MUST be pure and deterministic: NO `Math.random`, NO `Date`/wall-clock
anywhere in `web/src/harness/**`. All randomness MUST flow from
`personaRng(persona_id, seed, step)`; time MUST be an injected synthetic clock.

- **Given** a fixed `(persona, skill, seed, flags)`, **when** a session is run
  twice, **then** the two tapes MUST serialize byte-identically.
- **Given** `npm run harness -- baseline --seed N`, **when** it runs the sweep
  twice internally, **then** it MUST report determinism OK; on mismatch it MUST set
  `process.exitCode = 1`.
  *(test: `test_tape_replay_determinism`, `test_session_runner`)*

## R-HARN-2 — Bind to the engine PUBLIC API only

All engine/generator/runtime access MUST go through `engineApi.js`; no harness
module outside `engineApi.js` may import an engine internal directly. This is the
wire-DTO seam a Python relocation swaps at one file.

## R-HARN-3 — Persona / engine parameter disjointness

No file under `web/src/harness/personas/**` may contain the substring
`engine/params` (a lint enforces this). A persona's notion of "how the child
behaves" MUST be parameter-disjoint from the engine's notion of "how to infer
mastery".

- **Given** every `.js` file under `personas/`, **when** the lint reads it,
  **then** none MUST contain `engine/params`.
- **Given** `trainFamily()` and `heldOutFamily()`, **then** they MUST share NO
  persona ids and held-out `learnRate`/`pSlip` minima MUST exceed train maxima.
  *(test: `test_param_disjointness`)*

## R-HARN-4 — Faithful mirror of the live submit boundary

`runSession` MUST call `nextDecision` ONLY at the per-attempt boundary (mirroring
`useLessonEngine`), MUST mirror the EMPTY `recentBehavior` channel, and MUST NOT
invent observations to make an unreachable engine path reachable. The
disengaged-escalation trigger MUST remain unreachable by construction (reported as
a finding, not patched).

## R-HARN-5 — Inverse-error fingerprinting

`inverseAnswer(skill, misconception, problem)` MUST compute the wrong answer from
the REAL operands so the engine fingerprints the intended `ErrorSignature`, MUST
expose ≥2 misconceptions per generator skill, and MUST NEVER return the correct
value for a misconception.
*(test: `test_personas_inverse_errors`)*

## R-HARN-6 — Counter-metric pairing (KTD5)

A `MetricsRecord` MUST throw if a headline metric is present without ALL its
required counters. A one-sided (flattering) record MUST be unbuildable.

- **Given** a metrics object with `mastery_rate` but no `false_mastery_rate`,
  **when** `new MetricsRecord(...)` is called, **then** it MUST throw.
  *(test: `test_metrics_counter_pairing`)*

## R-HARN-7 — Oracle independence

The oracle's `τ_latent` MUST be configurable and DISTINCT from the engine's
`gateThreshold` (default 0.8 vs 0.95); the oracle's plausible-compute floor MUST be
distinct from the engine's latency floor (1500 vs 1200). Results SHOULD be reported
as a curve over `τ_latent`, never a single point.

## R-HARN-8 — Verify-first positive control

The harness MUST catch a KNOWN-present defect (the fluencyOk soft gate) before any
red-team claim is trusted, and a blind externally-injected defect MUST be caught by
the SAME oracle code path.
*(test: `test_positive_control`)*

## R-HARN-9 — Metamorphic invariants

The engine MUST satisfy the ground-truth-free relations: surface-form permutation
preserves the mastery verdict; one extra correct never lowers final P_known; a
strictly-higher-slip twin never reaches gate-open earlier.
*(test: `test_oracle_invariants`)*

## R-HARN-10 — Sealed held-out judge (anti-gaming)

`runLoop` MUST bless a change `REAL` ONLY when the SEALED held-out family improved
on a target metric AND the off-limits guardrail did not degrade AND the
search-trials-deflated bar held. A train-only improvement MUST read `GAMING`. An
inert change (the 002 flags today) MUST read `NO_CHANGE`. The held-out judge MUST
run a seed lineage distinct from train.

- **Given** the canonical plan-002 flags change with no real PARAMS routing,
  **when** `loop` runs, **then** the verdict MUST be `NO_CHANGE` (the seal MUST NOT
  fabricate a `REAL`).
- **Given** a `perturbMetrics` hook that improves train only, **then** the verdict
  MUST be `GAMING`.
  *(test: `test_recursive_loop`)*

## R-HARN-11 — Champion replay fixtures

`distillChampions` MUST emit minimal `{latent, seed}` replay keys; `replayChampions`
MUST flag a champion as REGRESSED when its replay reproduces a false-mastery flip
against the current engine. A fixture with no skill MUST be recorded as
non-regressing but visibly malformed.
*(test: `test_search`, `test_recursive_loop`)*

## R-HARN-12 — Pure-projection documents

Every emitted document EXCEPT research notes MUST be a pure projection of the
committed tapes (+ static audit probes); `report --seed N` MUST reproduce them
byte-for-byte from `docs/harness/tapes/baseline-seed<N>.jsonl`. Every certification
claim MUST be scoped to "the engine path".

- **Given** a committed baseline tape, **when** `report` re-projects, **then** the
  produced markdown MUST match the committed docs byte-for-byte.
  *(test: `test_report_projections`, `test_findings_backlog`, `test_expected_findings`)*

## R-HARN-13 — Quarantine isolation

`quarantine/chaos.js` and `quarantine/llmDiscriminator.js` MUST import nothing from
`search.js`/`recursiveLoop.js`, MUST carry their own seed, and MUST feed nothing
back into the tuning loop. Chaos MUST NOT mutate the original tape bytes (asserted
post-hoc); the LLM discriminator MUST be JUDGE-ONLY and degrade gracefully when no
`llmCall`/real corpus is available.
*(test: `test_quarantine`)*

## R-HARN-14 — Dashboard parity + honesty

The dashboard MUST render the SAME tape projections the CLI writes (no separate
data path), MUST be demonstrable without a live run (injected/committed tapes),
and MUST label its scope as engine-path-only. A replay that diverges from the
stored tape MUST show a divergence banner and keep the stored tape authoritative.
*(test: `test_dashboard_render`)*

## R-HARN-15 — Proof suite (skeptic-facing)

The proof suite (`web/tests/proof/**`) MUST assert against the REAL engine, with
every cited threshold read live from `params.ts` (so the proof cannot drift), that:
support triggers exactly when it should, support goes away once the student
course-corrects, and the policy directs the student and unlocks the next level
only on demonstrated mastery. (The proof exercises engine/runtime behavior — those
subsystems are documented by `engine-core`/`runtime-affect`; the proof harness
files themselves are owned by this slice.)
*(test: `test_proof_engine`, `test_proof_integration`)*
