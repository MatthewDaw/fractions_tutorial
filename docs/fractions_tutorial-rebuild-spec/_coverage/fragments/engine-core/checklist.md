# engine-core — coverage checklist

One line per census item owned by this slice (globs `web/src/engine/**/*.ts`,
`web/tests/engine/**`). `[ ]`→`[x]` as documented, with destination section.

## Source files (`web/src/engine/**/*.ts`) — 18

- [x] `index.ts` — public wire-DTO surface → design.md (Public surface), data-model.md
- [x] `types.ts` — wire DTOs (Event/Observation/MasteryEstimate/Decision/SkillNode) → data-model.md
- [x] `params.ts` — PARAMS tunables + flags → env-and-config.md
- [x] `graph.ts` — 10-node skill DAG + helpers → data-model.md (SkillNode/graph), design.md (DAG), gotchas.md (prereq-prepend)
- [x] `bkt.ts` — coldStart + bktUpdate → design.md (BKT)
- [x] `credit.ts` — DAG credit assignment → design.md (credit), gotchas.md (credit.ts:97)
- [x] `decay.ts` — retention probes + PROBE_DELAYS_MS → design.md (decay), data-model.md (ProbeSchedule)
- [x] `dimensions.ts` — fluency/independence/transfer/hint-dependence → design.md (dimensions)
- [x] `gate.ts` — isMastered + gateConditions → design.md (gate), gotchas.md (firewall)
- [x] `log.ts` — appendEvent/foldLog/loadLog/saveLog/migrate → design.md (log), env-and-config.md (keys), data-model.md (SeedPriors)
- [x] `mastery.ts` — buildMasteryEstimate → design.md (mastery assembly)
- [x] `measurementReduce.ts` — top-level fold → design.md (reduce pipeline), data-model.md (flow)
- [x] `observation.ts` — segment + classifyErrorSignature → design.md (observation), data-model.md (Observation)
- [x] `policy.ts` — legalMoves + nextDecision + escalation → design.md (policy), data-model.md (PolicyState/RecentBehavior)
- [x] `wall.ts` — detectWall + requiredSkills → design.md (wall), data-model.md (RecipeShape)
- [x] `observe/index.ts` — observeBehavior orchestrator → design.md (observe pipeline)
- [x] `observe/baseline.ts` — per-child latency baseline → design.md (observe), env-and-config.md (BASELINE_PARAMS)
- [x] `observe/detectors.ts` — behavioral detectors → design.md (observe), env-and-config.md (DETECTOR_PARAMS)

## Test files (`web/tests/engine/**`) — 21

- [x] `test_bkt.test.ts` → requirements.md (BKT), tasks.md
- [x] `test_credit.test.ts` → requirements.md (credit), tasks.md
- [x] `test_decay.test.ts` → requirements.md (decay), tasks.md
- [x] `test_dimensions.test.ts` → requirements.md (dimensions), tasks.md
- [x] `test_dimensions_u1.test.ts` → requirements.md (dimensions/seam), tasks.md
- [x] `test_gate.test.ts` → requirements.md (gate), tasks.md
- [x] `test_gate_u1.test.ts` → requirements.md (gate/hardMode), tasks.md
- [x] `test_graph.test.ts` → requirements.md (graph), tasks.md
- [x] `test_log.test.ts` → requirements.md (log/migration), tasks.md
- [x] `test_measurement_reduce.test.ts` → requirements.md (reduce), tasks.md
- [x] `test_measurement_reduce_u1.test.ts` → requirements.md (reduce/reachability), tasks.md
- [x] `test_observation.test.ts` → requirements.md (observation), tasks.md
- [x] `test_observation_u4.test.ts` → requirements.md (observation/sig seam), tasks.md
- [x] `test_policy.test.ts` → requirements.md (policy), tasks.md
- [x] `test_policy_u9.test.ts` → requirements.md (policy/frustration), tasks.md
- [x] `test_retention_u6.test.ts` → requirements.md (retention end-to-end), tasks.md
- [x] `test_wall.test.ts` → requirements.md (wall), tasks.md
- [x] `test_wall_u3.test.ts` → requirements.md (wall/binding-gap), tasks.md
- [x] `observe/test_baseline.test.ts` → requirements.md (observe baseline), tasks.md
- [x] `observe/test_detectors.test.ts` → requirements.md (observe detectors), tasks.md
- [x] `observe/test_observe.test.ts` → requirements.md (observe orchestrator), tasks.md
