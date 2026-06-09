<!-- slice: engine-core — fragment for tasks.md -->

# Engine rebuild tasks (engine-core)

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
