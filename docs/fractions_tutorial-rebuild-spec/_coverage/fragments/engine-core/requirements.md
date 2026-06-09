<!-- slice: engine-core — fragment for requirements.md -->

# Engine requirements (engine-core)

RFC-2119 behavioral requirements for the pure measurement engine, derived from
the source and the 21 tests under `web/tests/engine/**`. Glossary terms (BKT,
scaffold L0–L4, gate, transfer probe, etc.) are synthesis-owned.

---

## BKT (`bkt.ts`, test_bkt)

- The engine MUST raise a node's cold-start prior above `P_L0` when a prereq is
  strong (P>0.5) and lower it when weak, with the result clamped to `priorClamp`
  ([0.05, 0.85]).
- A single correct answer MUST strictly increase `P_known`; a single incorrect
  MUST strictly decrease it.
- `P_known` MUST stay in `pKnownClamp` ([0.01, 0.99]): repeated corrects approach
  but never reach 1.0; repeated incorrects never reach 0.0.
- `bktUpdate` MUST be pure and order-sensitive
  (correct-then-incorrect ≠ incorrect-then-correct).
- Golden values MUST match measurement §4.1 to 1e-9 (prior 0.3, two corrects).

## Credit assignment (`credit.ts`, test_credit)

- A correct answer MUST credit ONLY the binding node (`weight 1.0`).
- A wrong `add_across_unlike` on `ADD_UNLIKE_COPRIME` MUST produce a full update
  to `ADD_UNLIKE_COPRIME` PLUS a discounted (`creditDiscount` 0.3) incorrect
  update to `ADD_UNLIKE_NESTED` (the last/direct prereq).
- `scaled_bottom_only` and other binding-only signatures MUST NOT propagate.
- `add_denominators` MUST implicate `ADD_SAME_DEN` specifically.
- The discount factor MUST be applied exactly once and be config-driven.

## Mastery dimensions (`dimensions.ts`, test_dimensions, test_dimensions_u1)

- `isIndependent` MUST require ≥2 hint-free corrects at scaffold ≥ L3 on ≥2
  distinct problems; distinctness MUST use `problem_id` when present (two equal
  `answer_value`s with different `problem_id` count as 2 distinct).
- `hasTransferred` MUST require ≥2 hint-free, in-band corrects at scaffold ≤ L3 on
  ≥2 distinct `surface_form`s.
- `fluencyOk` MUST return true in soft mode (default) regardless of stats, and in
  hard mode MUST require `median_latency ≤ fluencyLatencyTargetMs` and
  `slope ≤ SLOPE_EPS` (true on insufficient data).

## Mastery gate (`gate.ts`, test_gate, test_gate_u1)

- `isMastered` MUST pass ONLY when all four conjuncts hold (P_known ≥ 0.95,
  independence L3+, transfer_passed, fluency_ok); flipping any one MUST close it.
- Pre-calibration (hardMode off), a failing soft-fluency MUST NOT block the gate.
- The hard switch MUST make a failing fluency block the gate.
- `isMastered` MUST default `fluencyHardMode` to the live `PARAMS` value.
- A populated affect-ish extra field MUST NOT change gate output (firewall).
- MASTERED status MUST be reachable only through `isMastered()` — no setter, no
  `DeclareMastered`.

## Skill graph (`graph.ts`, test_graph)

- `ADD_UNLIKE_COPRIME.prereqs` MUST include `ADD_UNLIKE_NESTED`.
- Every node's `roomId` MUST exist in the real `rooms.js` ROOMS array.
- `mostUpstreamUnmastered` MUST return the deepest unmastered node (closest to
  root) in topological order.

## Decay / retention (`decay.ts`, test_decay; `measurementReduce`, test_retention_u6)

- A scheduled probe MUST become due after the injected delay; spacing MUST follow
  `PROBE_DELAYS_MS`.
- A failed probe MUST demote the node (`transfer_passed=false`, P_known < 0.95)
  so it is wall-routable again (`isMastered` returns false).
- A passed probe MUST record the timestamp and keep P_known/transfer_passed.
- No wall-clock — all time MUST be injected via `now`.
- End-to-end through the reducer: `mastered_at` MUST be tracked and persist; a
  `retention_probe` with explicit `correct: false` MUST really demote; a probe
  with no `correct` MUST be treated as a pass (back-compat).

## Observation (`observation.ts`, test_observation, test_observation_u4)

- `segment` MUST emit one Observation per `problem_present … judged` span with
  all fields featurized (latency, hint rung, self-corrections, scaffold, modality,
  too_fast_correct, error_signature).
- `segment` MUST trust an emitted engine `error_signature` and coerce any
  non-union string to `'other'` (keeping the credit path live).

## Measurement reduce (`measurementReduce.ts`, test_measurement_reduce, _u1)

- The reduce MUST be replayable: an identical `(log, now, seedPriors)` MUST reduce
  identically.
- Hint-free L3 corrects on distinct `problem_id`s + `surface_form`s MUST satisfy
  both independence and transfer (positive-direction reachability).

## Wall detection (`wall.ts`, test_wall, test_wall_u3)

- A recipe needing two weak skills (Π P_known < 0.6) MUST fire WALL_HIT; one
  needing only strong skills MUST NOT.
- An actual failed attempt MUST fire WALL_HIT even when predicted_success ≥ θ.
- Binding selection MUST return the deepest unmastered prereq and MUST skip a
  mastered prereq; θ MUST be `PARAMS.wallTheta`.
- `requiredSkills` MUST infer the correct skill set from recipe shapes.
- After the routed binding node is mastered, the stumping recipe MUST no longer
  wall (predictedSuccess ≥ wallTheta); a recipe with a second unmastered required
  skill MUST still wall.

## Policy (`policy.ts`, test_policy, test_policy_u9)

- 3 clean (in-band, hint-free) corrects MUST yield `FadeScaffold`; a hinted
  correct MUST break the fade streak.
- 2 errors MUST yield `RaiseScaffold` with `preserveWork=true`.
- Dimensions green except transfer MUST yield `TransferProbe`.
- Gate pass with a stumping recipe MUST yield `ReturnToKitchen{recipe}`.
- Re-entry MUST start one level below `max_scaffold_passed`, floored at L0.
- Every returned Decision MUST include a non-empty rationale.
- `nextDecision` MUST emit only moves present in `legalMoves`.
- A stuck profile (floor scaffold, no P_known gain, H4 hints) MUST yield
  `EscalateToHuman{reason:"stuck"}` with a populated `handoff_packet`; a
  normal-but-slow profile MUST NOT escalate.
- A disengaged profile MUST yield `EscalateToHuman{reason:"disengaged"}`.
- No code path MUST emit a Decision with kind `DeclareMastered` (R9).
- With `frustrationScaffold` on, a frustration `RaiseScaffold` MUST still fire but
  with a warm rationale; default off MUST give the identical prior rationale.

## Log + migration (`log.ts`, test_log)

- `appendEvent` MUST be immutable/pure (folding a fixed list twice is identical).
- A Signal MUST be present in the log but be a no-op for any game-state projection.
- `migrateFromKitchenProgress` MUST seed a mastered room's node with a high prior
  (0.80) and fall back to the default prior (0.10) when absent.

## Behavioral observation (`observe/**`, test_baseline, test_detectors, test_observe)

- `observeBehavior` MUST emit `Signal`s ONLY and never produce/mutate a
  `MasteryEstimate` (firewall).
- The first `driftControlN` (3) attempts MUST be `observeOnly`.
- `latency_stall` MUST stay observe-only until the per-child baseline is
  established (`minSamples` corrects).
- The baseline MUST fold only CORRECT attempts and act on a per-child residual,
  never a cohort threshold.
