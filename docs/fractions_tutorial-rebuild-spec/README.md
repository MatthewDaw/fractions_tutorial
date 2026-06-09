# fractions_tutorial — Rebuild Spec

This is a complete, rebuildable specification for **`fractions_tutorial`**, reverse-engineered from the source so a fresh team (or agent) could recreate the project from these documents alone.

> **Coverage audit: ✅ PASS** (run `rp-260608-2215`) — 9/9 subsystems, 18/18 screens, 10/10 models, 4/4 endpoints documented; 0 real open items; 0 duplicated docs. Built via a MECE partition (9 parallel slice workers → synthesis → audit). Full report: [`_coverage/audit.md`](_coverage/audit.md). See `_coverage/census.md` + `_coverage/partition.md` for the inventory and ownership map.

## Project overview

`fractions_tutorial` ("Babushka's Fractions") is a single-page web app — an adaptive, manipulative-first math tutor for elementary fractions and the multiplication foundations beneath them, themed as a Russian-grandmother kitchen. A child works through ten lesson **rooms** on a two-level map, practices word problems in **Babushka's Kitchen**, and a pure **mastery/measurement engine** continuously estimates per-skill knowledge (BKT over a 10-node skill DAG) and decides what to present next — fading scaffolds, probing transfer, routing to upstream gaps, or escalating to a human. There is no backend: it is a static Vite/React SPA persisting an append-only event log, progress, and settings to localStorage; the only "AI" running in-browser is a tiny ONNX MNIST model for handwriting recognition. An **advisory affect layer** adds behavior-aware nudges that are firewalled from the mastery estimate, and an offline **synthetic-learner harness** red-teams the engine for false-mastery and missed escalation.

## Reading order

1. **`constitution.md`** — START HERE. The non-negotiable facts: tech stack + versions, build/run/test commands, top-level architecture, and the hard constraints (engine purity, affect firewall, boundary-only decisions, determinism, CCSS denominator contract, prereq ordering). Everything else assumes it.
2. **`glossary.md`** — the shared vocabulary (BKT, scaffold L0–L4, mastery gate, transfer probe, error signature, tape, oracle, advisory affect, wire-DTO, …). Skim, then refer back.
3. **`design.md`** — the WHY: subsystem responsibilities and the major design decisions in prose.
4. **`data-model.md`** + **`api-contracts.md`** — the engine wire-DTOs (`Event`/`Observation`/`MasteryEstimate`/`Decision`/`SkillNode`), the 10-node DAG, persistence keys, and the function-level contracts between subsystems.
5. **`requirements.md`** — the numbered requirements (R / R-RT / R-AF / R-LR) every subsystem must satisfy.
6. **`env-and-config.md`** — engine `PARAMS`, env vars (dev TTS), Vite config, and tunable constants.
7. **`ui-wireframes.md`** — the screens and lesson layouts.
8. **`gotchas.md`** — the load-bearing traps to avoid (prereq prepend, level-on-PresentProblem, boundary-once, the `.js→.ts` resolution, store reset, ONNX config, …).
9. **`adrs/`** — the architecture decision records (see below).
10. **`diagrams/`** — visual companions (see below).
11. **`tasks.md`** — the global, dependency-ordered rebuild plan. Read LAST, build from it.
12. **`_coverage/`** — the coverage bookkeeping (`census.md`, `partition.md`, `ledger.md`) used to verify nothing was dropped.

## How to rebuild from this spec

Follow the documents in dependency order:

1. **Internalize the rules** — read `constitution.md` and `glossary.md`. The constraints in §5 are correctness-critical, not stylistic.
2. **Lock the contracts** — read `design.md`, then `data-model.md` + `api-contracts.md`. The engine DTOs are a stable wire interface; build to them.
3. **Configure per subsystem** — pull tunables from `env-and-config.md` and screen specs from `ui-wireframes.md`.
4. **Build subsystem by subsystem, in order** — work straight down `tasks.md`: **engine-core → generators → runtime-affect → ui-surfaces → shell-nav → lessons-rooms → harness → ink-recognition → leftovers**. Each slice's tasks land with their named tests; keep `gotchas.md` open.
5. **Honor the decisions** — when a choice seems arbitrary, check `adrs/` first (engine purity & wire-DTO, the advisory affect firewall, ONNX handwriting, the `resolveTsFromJs` import scheme, the prereq-prepend credit rule, plus the slice-local runtime/harness/lessons ADRs).
6. **Verify coverage** — cross-check the finished build against the requirements in `requirements.md` and the coverage bookkeeping in **`_coverage/ledger.md`** and **`_coverage/census.md`** (the partition is in `_coverage/partition.md`). Every census item should map to a built, tested artifact. Run `npm test` from `web/` (and `npm run harness -- baseline --seed 1` for the red-team suite) as the executable check.

## Top-level files

- [`constitution.md`](./constitution.md) — foundational facts & hard constraints
- [`glossary.md`](./glossary.md) — shared domain vocabulary
- [`design.md`](./design.md) — subsystem design & rationale
- [`data-model.md`](./data-model.md) — engine DTOs, the 10-node DAG, persistence
- [`api-contracts.md`](./api-contracts.md) — function-level contracts between subsystems
- [`requirements.md`](./requirements.md) — numbered requirements
- [`env-and-config.md`](./env-and-config.md) — PARAMS, env, Vite/build config
- [`ui-wireframes.md`](./ui-wireframes.md) — screens & lesson layouts
- [`gotchas.md`](./gotchas.md) — load-bearing traps
- [`tasks.md`](./tasks.md) — global dependency-ordered rebuild plan
- [`adrs/`](./adrs/) — architecture decision records
- [`diagrams/`](./diagrams/) — Mermaid diagrams (below)
- [`_coverage/`](./_coverage/) — census, partition, ledger (coverage verification)

## Diagrams

- [`diagrams/architecture.mmd`](./diagrams/architecture.mmd) — subsystem map: pure engine ⇄ runtime hooks ⇄ lessons/rooms ⇄ ui-surfaces ⇄ shell-nav, with generators, harness, ink, and the affect firewall.
- [`diagrams/data-model.mmd`](./diagrams/data-model.mmd) — classDiagram of the engine DTOs plus the 10-node skill DAG.
- [`diagrams/key-flows.mmd`](./diagrams/key-flows.mmd) — sequence diagrams for judge→advance (the boundary consult) and wall→room→return (the kitchen stumping handoff).

## Architecture decision records (`adrs/`)

Spanning (synthesis-authored):
- [`ADR-0001-engine-purity-and-wire-dto-contract.md`](./adrs/ADR-0001-engine-purity-and-wire-dto-contract.md)
- [`ADR-0002-advisory-affect-firewall.md`](./adrs/ADR-0002-advisory-affect-firewall.md)
- [`ADR-0003-stylus-onnx-handwriting.md`](./adrs/ADR-0003-stylus-onnx-handwriting.md)
- [`ADR-0004-ts-engine-imported-via-js-resolveTsFromJs.md`](./adrs/ADR-0004-ts-engine-imported-via-js-resolveTsFromJs.md)
- [`ADR-0005-prereq-prepend-credit-assignment.md`](./adrs/ADR-0005-prereq-prepend-credit-assignment.md)

Slice-local:
- runtime-affect: `ADR-RT-001` (boundary-only decisions), `ADR-RT-002` (advisory affect firewall, runtime side), `ADR-RT-003` (engine-store bridge), `ADR-RT-004` (corroboration as arithmetic)
- harness: `0001` (persona/engine param disjointness), `0002` (tapes as single source of truth), `0003` (sealed held-out judge & inert plan-002 flags)
- lessons-rooms: `adr-lessons-shared-lesson-library` (shared lesson library; layout in separate grid tracks)
