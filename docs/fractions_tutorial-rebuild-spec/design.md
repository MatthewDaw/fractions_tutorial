# Design

This document is the per-subsystem architecture and implementation design for
`fractions_tutorial`. It opens with the cross-cutting **architecture overview**
(synthesis-owned) and then assembles each slice's design in dependency order:
engine-core → generators → runtime-affect → ui-surfaces → lessons-rooms →
shell-nav → harness → ink-recognition. Read `constitution.md` first for the tech
stack, commands, and the non-negotiable constraints these sections elaborate; see
`diagrams/architecture.mmd` and `diagrams/key-flows.mmd` for the visual companion.

---

## ARCHITECTURE OVERVIEW (synthesis-owned)

The app is a static Vite/React SPA layered around a **pure mastery engine** and a
**React runtime** that drives it. There is no backend; all state persists in
browser localStorage. The layering — and the two structural boundaries that hold
it together — is the single most important thing to preserve in a rebuild.

### The four layers (engine ⇄ runtime ⇄ lessons ⇄ surfaces)

```
        ┌──────────────────────── React runtime (web/src/runtime/**) ────────────────────────┐
        │  useLessonEngine (boundary)   practiceFlow   scaffoldMap   tier2   engineStore       │
        │  + ADVISORY affect layer (runtime/affect/**)  ──fills──▶ recentBehavior.isDisengaged │
        └───────▲───────────────────────────────┬───────────────────────────────┬────────────┘
                │ consults at the SUBMIT/ENTRY    │ publishes Decision/Mastery     │ Decision→problem
                │ boundary ONLY (R16)             ▼ (observable store)             ▼
   ┌────────────┴───────────┐        ┌────────────────────────┐        ┌──────────────────────┐
   │  ENGINE (engine/**, TS)│        │  UI SURFACES (ui/**)    │        │  GENERATORS (gen/**)  │
   │  pure · deterministic ·│        │  pure display layer:    │        │  pure · deterministic │
   │  wall-clock-free        │       │  banner · inspector ·   │        │  one per skill node   │
   │  BKT · credit · gate ·  │       │  nudge toast · probe    │        │  grade.js · hints.js  │
   │  policy · decay · wall  │       │  (NO engine import)     │        │                       │
   └────────────────────────┘        └────────────────────────┘        └──────────────────────┘
                ▲                                                                  ▲
                │ rendered by Shell, adopt useLessonEngine, supply problems        │
   ┌────────────┴──────────────────────────────────────────────────────────────────┴─────────┐
   │  LESSONS & ROOMS (web/src/components/**, App*.jsx, MomsRoom, MixedReview)                 │
   │  manipulative-first teaching scenes · Babushka's Kitchen transfer hub · Mixed Basket      │
   └────────────────────────────────────────────────────────────────────────────────────────-─┘
                ▲
   ┌────────────┴───────────────────────────────────────────────────────────────────────────-─┐
   │  SHELL & NAV (Shell.jsx, WorldMap, ConceptMap, Settings, rooms.js, audio/voice/intros)    │
   │  hash router · 1280×800 stage fit · mastery load at nav boundary · always-mounted globals │
   └────────────────────────────────────────────────────────────────────────────────────────-─┘
```

`main.jsx` mounts `Shell.jsx`, which owns hash routing (`#/<route>`), the 1280×800
stage scaling, and the global always-mounted surfaces. Routes resolve to a lesson
**room**, the **world map**, **Babushka's Kitchen** (`MomsRoom`, the word-problem
transfer layer), **Mixed Review**, or the **Settings**/**Concept Map** overlays.
Each room adopts `useLessonEngine`, which emits a rich per-attempt event burst,
persists an **append-only Event log** to localStorage (`moms-engine-log-v1`), and —
ONLY at the submit/entry boundary — folds the log through `measurementReduce` into
a per-node `MasteryEstimate` map and asks `policy.nextDecision` what to do next.
`practiceFlow` turns the returned `Decision` into the next validated problem from
the deterministic generator library.

### The two structural boundaries (the firewalls)

These two boundaries are not conventions — they are enforced in source and asserted
by tests. They are documented in full as spanning ADRs (`adrs/`) and restated in
the relevant slice sections; here is the cross-cutting why.

1. **Engine-purity boundary** (`engine/**`). The engine is pure, deterministic,
   and wall-clock-free. Time enters ONLY as injected `event.t` / `now`. The fold is
   replayable and side-effect-free; the only I/O point is the localStorage
   persistence adapter (`log.ts` load/save), kept OUT of the fold. Everything
   exported from `engine/index.ts` is a **wire DTO** — the engine could relocate
   behind a Python FastAPI backend by swapping `fetch` at the runtime call sites
   with zero contract churn. (Constitution §5.1/§5.8; ADR `adrs/0001-engine-purity-wire-dto.md`.)

2. **Advisory affect firewall** (`runtime/affect/**` ⇄ `gate.ts`). The affect layer
   reads behavioral signals and recommends Tier-2/3 nudges, but it NEVER produces or
   mutates a `MasteryEstimate`, valence stays neutral (no emotion inference), and it
   has **no path into `gate.ts`**. The only affect data in the log is the empty
   `affect_window` stub on `Observation`. Mastery cannot be raised or lowered by
   affect. (Constitution §5.2; ADR `adrs/0002-advisory-affect-firewall.md`.)

Two further boundaries support these: **boundary-only decisions** (the engine
consult runs only inside `useLessonEngine.judgeAndAdvance`; ADR `adrs/ADR-RT-001`)
and **no `DeclareMastered`** (mastery is only ever READ via `gate.isMastered`,
never an emitted decision or written flag; constitution §5.4).

See the **DATA-FLOW** section of `data-model.md` for the Action/Signal →
measurementReduce → MasteryEstimate → Decision → practiceFlow pipeline, and
`glossary.md` for the vocabulary (BKT, scaffold L0–L4, gate, transfer probe,
surface form, error signature, KTD/R numbering, strand/room/recipe).

---

# Mastery / measurement engine — internals (engine-core)

The engine (`web/src/engine/**`, TypeScript) is the pure, deterministic,
wall-clock-free measurement core. This section documents HOW each module works
and WHY. Time enters only as injected `event.t` / `now` (constitution §5.1).

Pipeline overview (the reduce composes these): **segment** (observation.ts) →
**credit assign** (credit.ts) → **BKT + dimensions** (bkt.ts/dimensions.ts) →
**assemble** (mastery.ts) → **gate** predicate (gate.ts) → **decay** folding
(decay.ts). `policy.ts` and `wall.ts` consume the resulting estimates to choose
the next move; `observe/**` is a parallel, firewalled behavioral-signal pipeline.

## BKT — Bayesian Knowledge Tracing (`bkt.ts`)

Two pure entry points; equations follow measurement §4.1 verbatim.

### `coldStart(node, prereqPKnowns, opts?) → number`
Cold-start prior with prerequisite propagation:

```
prior = P_L0 + Σ_{p ∈ prereqs} w·(P_known(p) − 0.5)
P_known = clamp(prior, priorClamp.min, priorClamp.max)   // [0.05, 0.85]
```

- `P_L0` resolves `opts.P_L0 → node.bkt_params.P_L0 → PARAMS.P_L0` (0.10).
- `w` = `PARAMS.prereqWeight` (0.3). A strong prereq (P>0.5) raises the child's
  prior (skip-ahead); a weak prereq lowers it. Centering on 0.5 makes a
  half-known prereq neutral.
- A prereq absent from the map contributes nothing.

### `bktUpdate(prior, correct, params?) → number`
One observation update + learn step:

```
correct:   P = prior·(1−S) / [prior·(1−S) + (1−prior)·G]
incorrect: P = prior·S     / [prior·S     + (1−prior)·(1−G)]
learn:     P' = P + (1−P)·T
P_known = clamp(P', pKnownClamp.min, pKnownClamp.max)     // [0.01, 0.99]
```

- Defaults `params → PARAMS.bkt` (`P_T 0.20, P_S 0.10, P_G 0.20`). Per-node
  override via `SkillNode.bkt_params`.
- **Divide-by-zero guard:** when the denominator is 0, `P = prior` (keep the
  prior rather than emit NaN).
- The learn step runs even on an incorrect answer (the child may learn while
  wrong). The clamp at [0.01, 0.99] means repeated corrects asymptote toward but
  never reach 1.0 (and incorrects never reach 0.0) — verified by `test_bkt`.
- Pure and **order-sensitive**: correct-then-incorrect ≠ incorrect-then-correct.

## DAG credit assignment (`credit.ts`)

`assignCredit(observation, bindingNodeId, graph) → CreditUpdate[]` (1–2 entries).

Rule:
- **Correct** → binding node only, `weight 1.0`.
- **Wrong with an error_signature** → binding node `weight 1.0` PLUS a discounted
  (`weight = PARAMS.creditDiscount = 0.3`) **incorrect** update to the implicated
  prereq, if one resolves and exists in the graph.
- Unknown node id → binding-only safe default.

### Error-signature → prereq implication (`ERROR_PREREQ_IMPLICATION`)
| signature | implicates | why |
|---|---|---|
| `add_denominators` | `ADD_SAME_DEN` | child confused about the same-denominator rule |
| `add_across_unlike` | resolved at runtime → **direct prereq of binding node** | the proximate gap (one hop upstream), not the root |
| `scaled_bottom_only` | null (binding-only) | error IN the current re-cutting step, not a prereq gap |
| `forced_leftover` | null | improper→mixed error; binding-only |
| `not_simplified` | null | simplify IS the binding skill when tested; binding-only |
| `other` / `null` | null | ambiguous; binding-only |

`resolveImplicatedPrereq` handles `add_across_unlike` by docking
`bindingNode.prereqs[prereqs.length − 1]` — the **LAST** prereq (one hop
upstream). This is the load-bearing line **`credit.ts:97`**: it is why
`MULT_FACTS` is *prepended* to the unlike/simplify prereq lists (so the fraction
prereq stays last and keeps receiving the dock, not multiplication fluency). See
`gotchas.md` and the prereq-prepend ADR (`adrs/0005-prereq-prepend-credit-constraint.md`).
For `add_denominators`, if the mapped node IS the binding node it returns null
(nothing to implicate).

## Spaced-retention decay (`decay.ts`)

A retention probe is a low-scaffold, hint-free check-in for a MASTERED node.

- **`PROBE_DELAYS_MS`** schedule (ms since mastery): 1 day, 3 days, 1 week,
  3 weeks, 2 months. Expanding spacing (spaced repetition).
- `scheduleRetentionProbe(nodeId, now, probeIndex=0)` → `{nodeId, dueAt, probeIndex}`;
  `dueAt = now + PROBE_DELAYS_MS[min(probeIndex, len−1)]`. `probeIndex` clamps to
  the last entry so probes never run off the end of the schedule.
- `isProbeDue(probe, now)` = `now >= probe.dueAt`.
- `applyProbeResult(est, {correct, now})` returns a NEW estimate (no mutation):
  - **pass** → stamp `last_retention_probe = now`; `P_known`/`transfer_passed`
    unchanged.
  - **fail** → stamp the probe AND clear `transfer_passed` AND drop `P_known` via
    one `bktUpdate(P_known, false)` — re-opening the node below the gate for the
    next wall encounter.

All time injected via `now` (constitution §5.1).

## Mastery dimensions (`dimensions.ts`)

Pure folds over an `Observation[]` (measurement §4.2–4.5).

- **Fluency** — `computeFluency`: over the last `fluencyMinN` (5) **correct**
  observations, returns `{median_latency, slope, n}`; both stats `null` if fewer
  than 5 corrects. `slope` is a least-squares fit over the latency sequence
  (returns 0 for n<2 — flat = no deterioration). `fluencyOk(stats, hardMode)`:
  when `hardMode` is false (default) it **always returns true** (soft/advisory,
  pre-calibration, KTD2); when true it requires `median_latency ≤
  fluencyLatencyTargetMs` (15 s) and `slope ≤ SLOPE_EPS` (500 ms/attempt, a
  module-local const, not yet a PARAMS field). Insufficient data → true (don't
  block on no evidence).
- **Independence** — `isIndependent`: ≥2 corrects at `scaffold_level ≥ L3`, all
  `hint_max_rung === 0`, on ≥2 **distinct problems**. Distinctness uses
  `problem_id` when present (the emission seam), else an `answer_value`-derived
  proxy. The `problem_id` seam matters: two identical answers on different
  `problem_id`s count as 2 distinct (test_dimensions_u1).
- **Transfer** — `hasTransferred`: ≥2 corrects at `scaffold_level ≤ L3`, hint-free,
  `latency ≥ PARAMS.latencyFloorMs` (in band / not too fast), on ≥2 distinct
  **surface_forms**. Distinctness uses `surface_form` when present, else the
  denominator as a structural proxy.
- **Hint-dependence** — `computeHintDependence`: fraction (∈[0,1]) of the last 5
  corrects whose `hint_max_rung ≥ 2` (H2). 0 when no recent corrects.

## MasteryEstimate assembly (`mastery.ts`)

`buildMasteryEstimate(observations, P_known, lastRetentionProbe=null,
masteredAt=null)` composes the four dimensions plus `max_scaffold_passed` (the
highest level answered correctly hint-free). If `isIndependent()` passes but
`max_scaffold_passed < 3`, it is bumped to 3 so the gate's L3 independence
condition is consistent with the canonical independence check.

**Affect firewall is structural here:** each dimension reads only
`{correct, scaffold_level, hint_max_rung, latency, answer_value, surface_form}` —
never `affect_window` or any Signal-derived field. Re-exported as
`assembleMasteryEstimate`.

## The mastery gate (`gate.ts`)

`isMastered(est, fluencyHardMode = PARAMS.fluencyHardMode)` — the ONLY path to a
MASTERED reading (KTD4, R9). Four conjuncts (Chain A):

1. `P_known ≥ PARAMS.gateThreshold` (0.95)
2. `max_scaffold_passed !== null && ≥ 3` (independence)
3. `transfer_passed === true`
4. `fluencyOk(fluency_stats, fluencyHardMode)` (soft by default)

`gateConditions(est)` returns the four booleans individually (for the inspector
and tests). The gate **structurally** never reads `last_retention_probe` or any
affect field — the single firewall boundary affect never crosses (constitution
§5.2). `fluencyHardMode` defaults to the live `PARAMS` value so policy callers
pick up the flag without threading it (test_gate_u1).

> CROSS-SLICE FINDING (audit): `ui/MasteryInspector.jsx` re-implements this gate
> predicate INLINE (so it carries no engine import — see ui-surfaces). The two
> copies must be kept in sync by hand. Noted in `gotchas.md` and the engine-purity
> ADR (`adrs/0001-engine-purity-wire-dto.md`).

## Observation pipeline (`observation.ts`)

`segment(log) → Observation[]` — one observation per `problem_present … judged`
span (`findAttemptBoundaries` pairs them; a new `problem_present` resets an
unmatched present). Per attempt it derives every `Observation` field:

- **latency** = `answer_submit.t − problem_present.t` (or `judged.t` if no
  submit).
- **hint_max_rung** = max `payload.rung` across `hint_shown` actions.
- **self_corrections** = `countSelfCorrections` — counts direction reversals in
  the `piece_place|piece_add` ↔ `piece_remove|piece_lift` sequence.
- **scaffold_level** from `problem_present.payload.scaffold_level` (validated to
  0–4, else 0).
- **modality** from submit else present; **recognizer_confidence** only for
  handwriting (default 0.5 if unrecorded), else null.
- **correct / answer_value** from `judged` (`answer_num`+`answer_den`, else
  `answer_value`).
- **too_fast_correct** = `correct && latency < PARAMS.latencyFloorMs`.
- **problem_id / surface_form** from judged-then-present payloads.
- **affect_window** = `[]` (typed stub; the span's Signals are gathered into
  `_signals` but intentionally discarded — the future camera seam).

### `classifyErrorSignature(...)` and the U4 trust seam
`segment` first **trusts an emitted `error_signature`** on the `judged` payload
(generated practice grades via `grade.js`, which emits engine signatures),
coercing any string outside the seven-value union to `'other'` so the credit path
never keys on a non-union value. Only when nothing usable was emitted does it
re-derive via `classifyErrorSignature(slip, answerNum, answerDen, targetNum,
targetDen, operands)`, which maps `momsProblems.gradeAnswer` slip codes
(`sameBottom`→`add_across_unlike`/`add_denominators` by like/unlike denominators,
`notSimplified`, `leftoverOnly`→`forced_leftover`) and structural patterns
(`answer = (na+nb)/(da+db)` → unlike?`add_across_unlike`:`add_denominators`;
scaled-denominator-only → `scaled_bottom_only`). This is the single bridge from
slip codes to the named taxonomy. (Before U4 the credit path was effectively
dead because segment re-derived from slip/operands the generated runtime never
emits — test_observation_u4.)

## The reduce (`measurementReduce.ts`)

`measurementReduce(log, now, seedPriors={}) → { mastery: Record<nodeId,
MasteryEstimate> }`. Pure and replayable: same `(log, now, seedPriors)` → same
output. Steps:

1. **Init priors (two passes).** Pass A: each node `P_known = seedPriors[id] ??
   PARAMS.P_L0`. Pass B: for nodes WITHOUT a direct seed and with prereqs, apply
   `coldStart` prereq propagation in topological order — so a seeded mastery
   propagates to children. A directly-seeded node is NOT re-cold-started
   (migration intent: an already-mastered room keeps its seed).
2. **Segment** the log into observations.
3. **Bind** each observation to its node via `extractNodeIdSequence` (walks
   `problem_present.payload.node_id` → matched `judged`, index-aligned with
   observations). A missing node_id falls back to `nodes[0].id` (conservative).
   `extractJudgedTimestamps` index-aligns the judged `t` for `mastered_at`.
4. **Credit + BKT** per observation in chronological order: `assignCredit` →
   for each credit, `bktUpdate` with the credited node's own `bkt_params`.
   `weight ≥ 1.0` takes the full posterior; a discounted prereq update blends
   `P_known += weight·(fullPosterior − P_known)` then re-clamps to `pKnownClamp`.
   Only the BINDING node accumulates the observation (dimensions are per-binding).
5. **`mastered_at` stamping:** the first time the binding node's interim estimate
   passes `isMastered`, record `judgedTs[i] ?? now`. Set once; persists.
6. **Assemble** each node's `MasteryEstimate`.
7. **Decay folding:** `applyRetentionProbes` scans `retention_probe` events
   (`payload {node_id, probe_t?, correct?}`) and applies `applyProbeResult` —
   a fail demotes; an event with no explicit `correct` is treated as a **pass**
   (back-compat so older timestamp-only probes never demote).

The gate is a predicate, not a mutator: consumers call `isMastered(est)` on the
returned estimates.

## Wall detection (`wall.ts`)

`detectWall(recipe, estimates, actuallyFailed=false, fluencyHardMode=false) →
WallDetectionResult`.

```
predictedSuccess = Π_{s ∈ requiredSkills(recipe)} P_known(s)   // P_L0 if no est
WALL_HIT ⟺ predictedSuccess < PARAMS.wallTheta (0.6)  OR  actuallyFailed
bindingNode = mostUpstreamUnmastered(requiredSkills, isMastered)  // deepest first
```

Fluency is intentionally NOT part of wall detection. `requiredSkills(recipe)`
infers the skill set from the recipe SHAPE (op + operands + requireSimplified)
WITHOUT importing the live `momsProblems.js` (purity): `improper` →
`IMPROPER_TO_MIXED`; `simplify` → `SIMPLIFY`; add/sub inspect denominators (same
→ `ADD_SAME_DEN`; one divides other → `+ADD_UNLIKE_NESTED`; coprime → full
`ADD_SAME_DEN+NESTED+COPRIME` chain); `add-then-simplify`/`add-then-mixed` chain
the secondary skill. `detectFirstWall` returns the first walling recipe in a
list. The binding node is the deepest unmastered prereq (e.g. weak same-den AND
unlike-den routes to `ADD_SAME_DEN` first). After the routed binding node is
mastered, the stumping recipe's predictedSuccess crosses `wallTheta` so a
re-presentation is genuinely solvable (test_wall_u3); a recipe with a SECOND
unmastered required skill still walls and must re-route.

## Deterministic policy (`policy.ts`)

Two pure functions; boundary-only (R16 — called only at the submit/entry
boundary in `useLessonEngine`, see runtime-affect).

- **`legalMoves(state, mastery) → string[]`** — enumerates valid Decision kinds:
  `PresentProblem` + `EscalateToHuman` always; `FadeScaffold` if scaffold < L4;
  `RaiseScaffold` if scaffold > L0 AND node not mastered; `TransferProbe` if the
  node has ≥2 transfer_forms; `ReturnToKitchen` if not in kitchen AND
  stumpingRecipe set AND node mastered; `RouteToRoom` if in kitchen.
- **`nextDecision(state, mastery, recentBehavior, now) → Decision`** — picks
  deterministically by priority (state-model §5.4), always a legal move, always a
  non-empty rationale:
  1. **EscalateToHuman** if `checkEscalationTriggers` fires.
  2. **ReturnToKitchen** if node mastered + stumpingRecipe set.
  3. **RouteToRoom** to `findUpstreamRouteTarget` (most-upstream unmastered) when
     in kitchen.
  4. **RaiseScaffold** if `consecutiveErrors ≥ PARAMS.raiseErrorsM` (2).
     `preserveWork: true` always. When `PARAMS.frustrationScaffold` is on, the
     rationale becomes WARM (reachable-foothold) instead of neutral — the felt
     wall stays, default off, reversible (U9, test_policy_u9).
  5. **TransferProbe** if `pendingTransferProbe` (a prior `too_fast_correct`) OR
     `shouldProbeTransfer(est)` (independence + `P_known ≥ 0.7` + transfer not yet
     shown).
  6. **FadeScaffold** if `consecutiveCleanCorrects ≥ PARAMS.fadeStreakK` (3).
  7. **PresentProblem** (default): `computeEntryScaffold` — L0 first visit, else
     `max(0, maxPassed − 1)` (session ⊔ history max); `selectSurfaceForm` picks
     the scaffold-row's first form, else first transfer form, else
     `<node>_L<scaffold>`.

### Escalation triggers (`checkEscalationTriggers`, state-model §5.5)
- **stuck**: `currentScaffold === 0` AND `heavyHintAtFloorCount ≥ nStuck` (6) AND
  `isPKnownFlat(pKnownHistory, 6)` (max−min ≤ 0.05). Builds a `handoff_packet`
  (human-readable dump of node/scaffold/errors/hint counts/P_known history/recent
  observations). A normal-but-slow profile does NOT escalate (false-escalation
  guard, test_policy).
- **disengaged**: `disengagedCount ≥ nDiseng` (5) OR `recentBehavior.isDisengaged`.

No path emits `DeclareMastered` (R9, asserted by test_policy).

## Append-only log + persistence (`log.ts`)

- **Pure core:** `appendEvent(log, event)` returns a NEW array (never mutates);
  `foldLog(log, init, reducer)` is an intent-expressing `reduce`.
- **Adapter (side-effectful, kept out of folds):** `loadLog()` /
  `saveLog(log)` read/write localStorage key `moms-engine-log-v1`; both swallow
  errors (corrupt JSON, quota, private browsing) and degrade to `[]` / no-op.
- **Migration:** `migrateFromKitchenProgress(storage = localStorage)` reads the
  legacy `moms-kitchen-progress-v1` `{ mastered: string[] }` and returns a
  `SeedPriors` map: a node whose `roomId` is in `mastered` → 0.80, else 0.10.
  Reads but never writes; injectable storage for tests. See `env-and-config.md`.

## Behavioral-observation pipeline (`observe/**`, plan 005 Phase 1)

A parallel, **firewalled** pipeline that emits behavioral `Signal`s only — it
NEVER produces or mutates a `MasteryEstimate`.

- **`observe/detectors.ts`** — per-attempt-span detectors, each returning a
  `Signal | null` stamped with a deterministic FNV-1a `context_hash` and the
  attempt's actor:
  - `detectIdle` — largest inter-event gap ≥ `idleThresholdMs` (5 s);
    `transient` flag at ≥ `transientIdleMs` (8 s).
  - `detectRapidSubmit` — submit with NO work below the per-child plausible floor
    (distinct from `too_fast_correct`: fires regardless of correctness).
  - `detectOrphanedInteraction` — work started then abandoned (net committed
    pieces ≤ 0 at submit after peaking) — the wheel-spin self_corrections misses.
  - `detectLatencyStall` — high latency residual vs the child's own baseline;
    **observe-only (returns null) until the baseline is established**; fires by
    z ≥ `stallZ` (2.0) or fractional residual ≥ `expected·stallFrac`.
  - `detectScribbleBurst` — `scribbleCount` (5) removals within `scribbleWindowMs`
    (2 s); a transient that survives smoothing.
- **`observe/baseline.ts`** — per-child latency-residual baseline (locked
  decision S4: per-child + relative, never a cohort threshold). EWMA of
  difficulty-normalized latency (`ewmaMs`) + EWMA of squared residual (`varMs2`);
  `difficultyForScaffold(level) = 1 + slope·level` (harder = less support).
  Cold start is observe-only until `minSamples` (5) corrects accrue
  (`established`). `plausibleFloorMs` derives a PERSONAL too-fast floor
  (`expected − k·sd`, clamped) that replaces the fixed `PARAMS.latencyFloorMs`
  once warm; returns the default while cold.
- **`observe/index.ts`** — `observeBehavior(log, baseline?, params?)`
  orchestrator: walk the same `present … judged` spans, build a `BehaviorContext`,
  compute residual + plausible floor, run all detectors, fold CORRECT attempts
  into the baseline, and gate the first `driftControlN` (3) attempts as
  `observeOnly` (cold-start control). Same input as the real child / replay /
  persona harness — "one signal path" (S7). Output is `ObservedSignal[]` +
  the post-fold baseline. Firewall: no MasteryEstimate anywhere.

---

# Generators — deterministic problem supply, grading, hints

## G.0 Why this subsystem exists (rationale)

The mastery engine (`engine-core`) decides **when** to present another problem,
fade scaffold, raise scaffold, or fire a transfer probe — but it owns no problems.
Before this slice, every lesson hard-coded exactly one fixed worked example
(`2/7+3/7`, `8/12→2/3`, …). The generators are the **supply side**: per-skill pure
functions that emit an unlimited stream of *validated* problem variations,
classified by structural surface form so the engine can demand a *different* shape
for a transfer probe (`core.js:1–27` header). One generator exists per engine skill
node (the 10 nodes in `engine/graph.ts`).

The whole subsystem is **PURE + DETERMINISTIC** (constitution §5.5): no
`Math.random`, no `Date`. Randomness comes only from a seeded PRNG keyed by
`(skill, index)`, so a replayed session reproduces the exact same problem stream —
this mirrors the engine's KTD9 replay discipline and is what lets the synthetic
harness (`harness`) grade the *same* generated problems with the *same*
`grade.js`, so "correct" means the same thing in the live app and the red-team runs.

The subsystem has three public faces:
- **`generators/index.js`** — the registry: `generateFor` / `surfaceFormsFor` /
  `generatorSkills` / `hasGenerator`.
- **`generators/grade.js`** — `gradeAnswer` (correctness + stars + ErrorSignature)
  and `answerShape`.
- **`generators/hints.js`** — `hintsFor` (a 2-rung strategy ladder per skill).

`generators/core.js` is the shared, non-exported-to-callers kernel (seeded PRNG,
numeric helpers, level→tier mapping, surface-form rotation, `problemIdFor`).

## G.1 The GeneratedProblem envelope (the contract)

Every generator's `generate(spec)` returns one **GeneratedProblem** object. The
envelope is fixed; only the `operands` / `answer` shapes are skill-specific
(`core.js:25–26`).

```
GeneratedProblem = {
  skill:       string,   // engine skill node id (e.g. 'SIMPLIFY')
  level:       0..4,     // the ScaffoldLevel passed in
  surfaceForm: string,   // one of the skill's SURFACE_FORMS
  index:       number,   // monotonic attempt index (drives the seed + form rotation)
  operands:    object,   // skill-specific (the chosen numbers)
  answer:      object,   // skill-specific (computed BY the generator from operands)
  prompt:      string,   // human-readable problem text
  problem_id?: string,   // attached by generateFor (see G.2) if not already present
}
```

**Correct-by-construction (constitution §5.5):** each generator *chooses operands
first, then computes the answer from them*. A generated problem is therefore never
wrong by construction — the brief's non-negotiable content-correctness, achieved
via constrained generation rather than post-hoc checking (`core.js:11–23`).

### G.1.1 `spec` input

`generate({ level = 0, index = 0, surfaceForm } = {})`:
- **`level`** (0..4, default 0) — the design ScaffoldLevel. Mapped to a 0..2
  *difficulty tier* by `tierForLevel` (G.4). Low level → friendly numbers +
  canonical shape; high level → bigger denominators, improper results,
  misconception traps.
- **`index`** (default 0) — monotonically increasing attempt count. Seeds the PRNG
  AND drives default surface-form rotation. Same `(skill, level, index)` ⇒
  byte-identical problem.
- **`surfaceForm`** (optional) — forces a structurally-distinct variant for a
  TransferProbe. Omitted ⇒ the generator rotates forms by `index`.

## G.2 Registry — `generators/index.js`

The registry is a `Map<SKILL, module>` built once from the 10 generator modules
(`index.js:24–37`). Each generator module exports `SKILL` (its node id),
`SURFACE_FORMS` (a 2-element array), and `generate`.

| Export | Signature | Behavior |
|---|---|---|
| `hasGenerator(skill)` | `(string) → boolean` | `REGISTRY.has(skill)`. |
| `generatorSkills()` | `() → string[]` | All registered skill ids (`[...keys]`). |
| `surfaceFormsFor(skill)` | `(string) → string[]` | A **copy** (`.slice()`) of the skill's `SURFACE_FORMS`, or `[]` if unknown. |
| `generateFor(skill, spec)` | `(string, object?) → GeneratedProblem` | Looks up the module; **throws** `No problem generator for skill "<skill>"` if none; else returns `m.generate(spec)` with a `problem_id` attached. |

**`problem_id` attachment (`index.js:69–78`):** after generating, if
`prob.problem_id === undefined`, `generateFor` sets it via
`problemIdFor(skill, prob.level, prob.surfaceForm, spec.index ?? prob.index ?? 0)`
= the string `` `${skill}:${level}:${surfaceForm}:${index}` `` (`core.js:125–127`).

WHY: the engine's *independence check* must count **structurally distinct**
problems, not distinct answer values. `problem_id` is that structural key,
attached centrally in `generateFor` (additive) so every generator gets it without
per-generator edits.

> RFC-2119: `generateFor` MUST throw on an unregistered skill. `surfaceFormsFor`
> MUST return a fresh copy so callers cannot mutate the module's `SURFACE_FORMS`.

## G.3 Determinism & replay — `generators/core.js` PRNG

The replay guarantee (constitution §5.5) rests on three pure primitives:

- **`makeRng(seed)`** (`core.js:33–42`) — mulberry32. A tiny, fast, deterministic
  PRNG returning `() => [0,1)`. No global state.
- **`hashStr(s)`** (`core.js:45–52`) — FNV-1a 32-bit string hash.
- **`rngFor(skill, index)`** (`core.js:55–58`) — the seam every generator uses:
  `seed = (hashStr(skill) ^ imul(index+1, 2654435761)) >>> 0`, then `makeRng(seed)`.
  Keying on `(skill, index)` (not on `level`) means *changing scaffold level does
  not reshuffle the stream* — only the difficulty pools change; the index still
  pins the draw sequence. (See `gotchas.md` G-GOTCHA-1.)

> RFC-2119: generators MUST draw all randomness from `rngFor(SKILL, index)` and
> MUST NOT call `Math.random()` or `Date.now()`
> (`test_generators.test.js:135–141`).

## G.4 Difficulty model — level → tier → number pools

`tierForLevel(level)` (`core.js:102–107`) collapses the 5 scaffold levels onto a
3-step difficulty tier:

| ScaffoldLevel | Tier | Meaning |
|---|---|---|
| L0, L1 | 0 | friendliest numbers, canonical shape |
| L2, L3 | 1 | mid |
| L4 | 2 | largest numbers, traps, transfer |

Non-finite `level` defaults to tier 0. Each generator holds a per-tier number pool
indexed by this tier.

## G.5 Surface forms & transfer selection

Every generator declares exactly **two** surface forms (`SURFACE_FORMS`, asserted
length-2 by `test_generators.test.js:111`). The first is the *gentle/canonical*
shape; the second is the *transfer* shape that proves understanding rather than
template-matching. `resolveSurfaceForm(forms, requested, index)` (`core.js:113–116`):

- If a `requested` form is supplied **and** is a member of `forms`, honor it
  (the TransferProbe path).
- Otherwise rotate deterministically by `index`:
  `forms[((index % len) + len) % len]` (double-guarded for negative indices).

### The ten generators (one per skill node)

| Skill (node id) | Room | Operation | Forms `[canonical, transfer]` | Transfer misconception targeted |
|---|---|---|---|---|
| `ADD_SAME_DEN` | r1 | `a/d + b/d` | `[proper, makes_whole]` | sum lands exactly on a whole (`a+b===d`): is it `d/d`? is it `1`? |
| `SUB_SAME_DEN` | s1 | `s/d − t/d`, `t<s` | `[part_minus_part, whole_minus_part]` | starting from a full whole — the top of a whole is `d`, not `1`. |
| `ADD_UNLIKE_NESTED` | r3 ("Scale One") | `a/ds + b/dl`, `ds \| dl` | `[nest_x2, nest_x3plus]` | bigger scale factor (≥3×), not just one doubling. |
| `ADD_UNLIKE_COPRIME` | r2 ("Cross-Multiply") | `a/d1 + b/d2`, `gcd=1` | `[unit, nonunit]` | numerators > 1 — the real cross-multiply, not just `1/2+1/3`. |
| `SIMPLIFY` | r4 | `(p·k)/(q·k) → p/q` | `[single_factor, multi_factor]` | composite `k` — needs >1 division step / a bigger shared factor. |
| `IMPROPER_TO_MIXED` | r5 | `(w·d+r)/d → w r/d` | `[with_remainder, exact_whole]` | `r===0`: a bare whole with NO leftover (mis-written as `2 0/7`). |
| `MULT_EQUAL_GROUPS` | m1 | `g groups of s` | `[canonical, commuted]` | same product read the other way (`g>s`). |
| `MULT_FACTS` | m3 | `a × b` | `[core, edge]` | one factor is 0 or 1 (identity/zero facts). |
| `FRACTION_ON_LINE` | nl | place `num/den` | `[proper, improper]` | value > 1 (past the first whole). |
| `COMPARE_BENCHMARK` | cmp | order, or vs ½ | `[same_den, benchmark_half]` | reason about ½ (size), not bigger-top-wins. |

### Per-generator construction notes (the load-bearing details)

- **`addSameDen`** — `makes_whole`: `a∈[1,den-1]`, `b=den-a` (sum `=den`).
  `proper`: `a∈[1,den-2]`, `b∈[1,den-1-a]` (sum `<den`). Denominator stays locked.
- **`subSameDen`** — `whole_minus_part`: `s=den`; else `s∈[2,den-1]`. Always
  `t∈[1,s-1]` so `t<s` (no negative results).
- **`addUnlikeNested`** — small den `ds` from the tier pool; multiplier `m`: `2`
  for `nest_x2`, else a tier multiplier `≥3` (fallback `3`). `dl = ds·m`. Answer is
  `(a·m + b)/dl` **unreduced over the larger denominator** (the lesson, not
  reduction, is the skill).
- **`addUnlikeCoprime`** — coprime den pair from the tier pool (guarded: `+1` if a
  pair is somehow not coprime). `unit`: both numerators 1; else
  `a∈[1,d1-1], b∈[1,d2-1]`. Answer is `(a·d2 + b·d1)/(d1·d2)` **unreduced**.
- **`simplify`** — builds *backwards*: pick lowest-terms `p/q` (`gcd(p,q)=1`),
  multiply by `k` (`single_factor`: a prime; `multi_factor`: a composite). Presents
  `(p·k)/(q·k)`; answer is `p/q`. Guaranteed reducible.
- **`improperToMixed`** — pick whole `w`, den `d`; remainder `r`: `0` for
  `exact_whole`, else `r∈[1,d-1]`. Presents `(w·d+r)/d`; answer is the mixed
  `{whole:w, num:r, den:d}` (`r===0` ⇒ a bare whole).
- **`multEqualGroups`** — `g,s` in the tier range; ties broken so the form's
  inequality holds: `canonical` ensures `g≤s`, `commuted` ensures `g>s`. Answer
  `{product: g·s}`.
- **`multFacts`** — `core`: both factors `∈[2,hi]`. `edge`: one factor `∈[2,hi]`,
  the other `∈{0,1}`, coin-flip on which leads. Answer `{product: a·b}`.
- **`fractionOnLine`** — `proper`: `num∈[1,den-1]`. `improper`: `num∈[den+1, 3·den]`
  re-drawn until `num%den !== 0`. Answer carries the exact value plus its mixed
  reading `{num, den, whole, rem}`.
- **`compareBenchmark`** — `benchmark_half`: `a/den` vs `1/2`, exact via `2a vs den`
  (nudged off `2a===den` at tier 0), `rel ∈ {less,more,equal}`. `same_den`: `a/den`
  vs `b/den` (`a≠b`), `rel ∈ {'<','>'}`.

> NOTE (cross-form rel vocabulary): `COMPARE_BENCHMARK` emits **two different**
> `rel` vocabularies — `{less,more,equal}` for `benchmark_half`, `{'<','>'}` for
> `same_den`. `gradeAnswer` compares `rel` by strict equality, so the answer UI
> MUST supply the matching vocabulary per surface form.

## G.6 Grading — `generators/grade.js`

`gradeAnswer(problem, answer = {})` → `{ correct, stars, errorSignature }`
(`grade.js:65–120`). Pure and reusable: the live practice board grades with it and
the synthetic harness grades the same generated problems with it, so "correct" is
defined once. `errorSignature` values are members of the engine's `ErrorSignature`
union.

### G.6.1 Per-skill judging (switch on `problem.skill`)

| Skill(s) | Answer shape | Correct when… | Stars / signature on miss |
|---|---|---|---|
| `SIMPLIFY` | `{num,den}` | equal value AND lowest terms (`gcd=1`) | equal-but-not-reduced ⇒ `correct:false, stars:2, 'not_simplified'`; non-equal ⇒ `stars:0, 'other'`; invalid (`den≤0`/`num<0`) ⇒ `stars:0, null` |
| `IMPROPER_TO_MIXED` | `{whole,num,den}` | `whole` matches AND remainder matches (`r===0` ⇒ blank/zero leftover accepted) | `forced_leftover` if exact-whole but learner wrote a leftover; else `'other'` |
| `MULT_EQUAL_GROUPS`, `MULT_FACTS` | `{value}`/`{product}` | `value === answer.product` | `stars:0, 'other'` |
| `COMPARE_BENCHMARK` | `{rel}` | `rel === answer.rel` (strict) | `stars:0, 'other'` |
| *default* (fraction skills) | `{num,den}` | equal **value** (`equalValue`) — any equal form counts; the skill is the operation, not reduction | `classifyAddError(...) || 'other'` |

Helpers: `equalValue(an,ad,bn,bd)` = `an·bd === bn·ad`, guarding `ad>0 && bd>0`.
`num(x)` coerces string→int, `NaN` on garbage. (See `gotchas.md` G-GOTCHA-5 for the
SIMPLIFY validity-guard ordering.)

### G.6.2 `classifyAddError` — the misconception fingerprint (U4)

`classifyAddError(operands, an, ad)` (`grade.js:49–58`) detects "added the bottoms
too": when `(an/ad)` equals `(p.num+q.num)/(p.den+q.den)` for the two operands:
- `'add_across_unlike'` when the operand denominators differ;
- `'add_denominators'` when they match.

WHY: a catch-all `'other'` cannot drive remediation — the engine's credit→reteach
path needs the *named* misconception to dock the right prereq (`add_denominators`
is the 6.58×-most-common error per the U4 comment). `twoOperands` normalizes the
varying operand shapes (`{a,b}`, `{start,take}`, `{a,b,den}`, `[[n,d],[n,d]]`) into
two `{num,den}` pairs, or `null`.

### G.6.3 `answerShape(skill)` (`grade.js:123–131`)

`IMPROPER_TO_MIXED → 'mixed'`; `MULT_*` → `'integer'`; `COMPARE_BENCHMARK →
'relation'`; everything else → `'fraction'`.

### G.6.4 ErrorSignature surface emitted by grade.js

`gradeAnswer` can emit `add_denominators`, `add_across_unlike`, `forced_leftover`,
`not_simplified`, `other`, or `null`. It does **NOT** emit `scaled_bottom_only` —
that is produced only by the *lesson-level* graders in `AppR4.jsx` and
`LessonUnlikeDen.jsx` and by `engine/observation.ts`. See `gotchas.md` G-GOTCHA-2.

## G.7 Hint ladders — `generators/hints.js`

`hintsFor(skill)` → `string[]` (`hints.js:56–58`), or `[]` for an unknown skill.
Each skill has a **2-rung** ladder: Rung 1 = the *method* (a strategy reminder);
Rung 2 = a *concrete first move*. Hints are deliberately **generic across a skill's
variations** so they never leak the specific numbers.

**Pedagogical contract (the false-positive guard — `hints.js:1–11`):** using a hint
is recorded as `hint_max_rung`; a *hinted* correct does NOT count toward the
clean-correct fade streak nor toward scaffold-independence. The recording happens
in the runtime/lesson layer; this slice only *defines* the rungs.

---

# Runtime + advisory affect (runtime-affect)

> Scope: the React runtime that bridges lessons to the pure mastery engine, plus
> the ADVISORY affect layer (`web/src/runtime/**`). Engine internals, generators,
> and the UI surfaces are referenced by pointer. See constitution §4–5.

## 1. Layer purpose & the engine boundary

The runtime layer is the **only** place where the browser wall-clock (`Date.now()`)
is read and the engine consult (`measurementReduce` → `nextDecision`) is invoked.
It exposes three composable hooks lessons adopt — `useLessonEngine` (the backbone),
`useLessonScaffold` (the shared lesson controller), and `useGeneratedPractice` (the
estimator-driven practice loop) — plus three pure helper modules — `practiceFlow`
(Decision→next-problem), `scaffoldMap` (beat↔ScaffoldLevel), and `tier2`
(within-attempt nudges) — and a React-free observable singleton `engineStore`
(+ its `useEngineStore` binding) that publishes the live Decision/MasteryEstimate
to the always-mounted surfaces.

```
lesson screen (lessons-rooms)
   │ adopts
   ▼
useLessonScaffold / useGeneratedPractice
   │ wraps
   ▼
useLessonEngine ──emit()──▶ engine/log.appendEvent + saveLog (localStorage)
   │ judgeAndAdvance() at the SUBMIT/ENTRY BOUNDARY only (R16)
   ├──▶ engine/measurementReduce(log, now, seedPriors) → mastery map
   ├──▶ engine/policy.nextDecision(policyState, mastery, recentBehavior, now) → Decision
   ├──▶ engine/gate.isMastered(estimate) → certified flag (U2)
   ├──▶ practiceFlow.nextPractice(decision, state) → next problem spec
   └──▶ engineStore.publishDecision(decision, mastery, t) ──▶ ui-surfaces
```

The advisory **affect** layer (`runtime/affect/**`) is a SEPARATE, parallel
pipeline. It reads behavioral Signals and emits an advisory tier + AffectState that
fills the `recentBehavior.isDisengaged` slot ONLY. It has **no path into
`gate.ts`** (constitution §5.2; `adrs/ADR-RT-002`).

## 2. `useLessonEngine.js` — the lesson↔engine backbone (KTD5, U9)

One hook every lesson adopts to (a) emit the full per-attempt event burst,
(b) persist the append-only log, (c) consult the engine ONLY at the submit/entry
boundary, and (d) apply the returned Decision.

**Public surface** (`useLessonEngine({ nodeId, lessonConfig })`):

| Returned | Type | Meaning |
|---|---|---|
| `emit(eventFields)` | `(obj) => obj` | Stamp `t`+`actor:'human'`, append, persist, return the stamped event. |
| `judgeAndAdvance(answer, meta)` | `(obj,obj) => Decision` | The boundary call (see below). |
| `scaffoldLevel` | `0..4` | Current design scaffold level (React state). |
| `decision` | `Decision \| null` | Last Decision (null pre-first-submit). |
| `rationale` | `string` | `decision?.rationale ?? ''`. |
| `masteryFor(nodeId)` | `(id) => MasteryEstimate \| null` | Reads the last reduce result. |
| `isCertified()` | `() => boolean` | Ref-backed synchronous gate result (U2). |

**`lessonConfig`** fields: `lessonId`, `initialBeat`, `stumpingRecipe`, `inKitchen`.

### 2.1 Internal state — refs vs React state (WHY)

| Holder | Kind | Why |
|---|---|---|
| `logRef` | ref | The append-only log. Initialized once from `loadLog()`; thereafter the in-memory ref is authoritative and synced on every write. |
| `policyStateRef` | ref | The mutable policy state fed to `nextDecision`; updated synchronously without an extra render. |
| `presentTimestampRef` | ref | `t` of the last `problem_present`, for latency. |
| `tier2WindowRef` | ref | One Tier-2 window per attempt; reset on each `problem_present`. |
| `certifiedRef` | ref (U2) | Synchronous certification so a same-tick `applyEngineDecision` reads the FRESH value. |
| `scaffoldLevel`, `decision`, `masteryCache` | React state | Drive renders / `masteryFor`. |

**Initial policy state** (`buildInitialPolicyState`): `{ currentNodeId,
currentScaffold, stumpingRecipe, inKitchen, sessionMaxScaffoldPassed:null,
consecutiveErrors:0, consecutiveCleanCorrects:0, pendingTransferProbe:false,
pKnownHistory:[], heavyHintAtFloorCount:0, disengagedCount:0 }`.

### 2.2 `emit` — branches & mutations

1. Always: spread defaults `{modality:'tap', actor:'human'}`, override `t = Date.now()`.
2. If `type === 'problem_present'`: set `presentTimestampRef = t`; reset
   `tier2WindowRef`; if `payload.scaffold_level` is a number, set
   `policyStateRef.currentScaffold = lvl` (keep policy in sync with the lesson's
   ACTUAL stage — the lesson can change scaffold by a stage-tab click which the
   engine didn't decide; without this the policy stays stuck at entry L0).
   **`consecutiveErrors` is intentionally NOT reset on a scaffold change** — in
   these lessons the stages ARE the scaffold ladder; cross-stage signals span
   stages (gotcha G3).
State mutation: `logRef = appendEvent(log, stamped); saveLog(log)`.

### 2.3 `judgeAndAdvance` — the BOUNDARY (R16)

This is the ONE place `nextDecision` runs (constitution §5.3; `adrs/ADR-RT-001`).
Sequence (exactly once per call):
1. `now = Date.now()`. Destructure `answer` and `meta`.
   `effectiveNodeId = nodeIdOverride || nodeId`.
2. `latency = present!=null ? max(0, now-present) : 5000`.
3. Emit `answer_submit` then `judged` (both appended + `saveLog` once). The
   `judged` payload carries the rich KTD3 Observation fields incl.
   `too_fast_correct` and `affect_window: []` (the firewall stub).
4. Reset `presentTimestampRef = null`.
5. `seedPriors = migrateFromKitchenProgress()`; `reduceResult =
   measurementReduce(log, now, seedPriors)`; `setMasteryCache(...)`.
6. `_updatePolicyState(...)`.
7. Too-fast guard: `checkTooFastCorrect` — if it fires, set
   `pendingTransferProbe = true`. Runs AFTER `_updatePolicyState` so the probe wins
   over a fade on a possible fluke (gotcha G4).
8. Push `P_known` onto `pKnownHistory` (capped at 12).
9. **U2 certification**: `certifiedRef = !!(nodeEst && isMastered(nodeEst))` —
   reuses the SAME fold; no extra reduce, no extra `nextDecision`.
10. Build `recentBehavior = {observations: recentObsRef.slice(-10),
    isDisengaged: disengagedCount>=3}`.
11. **BOUNDARY**: `dec = nextDecision(...)` — exactly once.
12. `setDecision(dec)`; `publishDecision(dec, reduceResult.mastery, now)`.
13. Apply scaffold change: `FadeScaffold` → `min(4, +1)`; `RaiseScaffold` →
    `max(0, -1)`; both update the ref AND `setScaffoldLevel`.
14. `return dec`.

### 2.4 `_updatePolicyState` (in-place mutation, intentional)

- `correct` & `hintFree && inBandLatency` (`latency ∈ [latencyFloorMs, 30000]`):
  `consecutiveErrors=0`; `consecutiveCleanCorrects+=1`; bump
  `sessionMaxScaffoldPassed` if `currentScaffold` exceeds it; clear
  `pendingTransferProbe`.
- `correct` but hinted/out-of-band: reset clean streak; clear `pendingTransferProbe`.
- `!correct`: `consecutiveErrors+=1`; `consecutiveCleanCorrects=0`.
- `currentScaffold===0 && hintMaxRung>=3`: `heavyHintAtFloorCount+=1`.

`_isTooFastCorrect(correct, latency) = correct && latency < PARAMS.latencyFloorMs`
— unified onto the single `latencyFloorMs` constant (U1) so too-fast, transfer
in-band, and clean-correct in-band share one threshold (no dead zone).

## 3. `practiceFlow.js` — Decision → next problem (pure)

`nextPractice(decision, state, opts={maxLevel=4})` returns
`{ action: 'present'|'return'|'route', spec?, decision }`:

| `decision.kind` | action | spec |
|---|---|---|
| `FadeScaffold` | present | `level=min(maxLevel,level+1)`, `index+1` (harder) |
| `RaiseScaffold` | present | `level=max(0,level-1)`, `index+1` (easier, keep work) |
| `TransferProbe` | present | same `level`, `index+1`, `surfaceForm=otherSurfaceForm(skill,current)` |
| `ReturnToKitchen` | return | — (mastered → back to stumping recipe) |
| `RouteToRoom` | route | — (routed upstream to a prerequisite) |
| `PresentProblem` / default | present | same `level`, `index+1`, `surfaceForm=decision.surface_form` |

**`otherSurfaceForm(skill, current)`** reads `surfaceFormsFor(skill)`; returns a
form `!== current`, or `current`/`forms[0]` if there is only one. Gotcha G5:
`PresentProblem` keeps the SAME level (never pulls back to entry L0 between reps).

## 4. `useGeneratedPractice.js` — estimator-driven loop (hook)

A lesson that adopts it serves UNLIMITED generated variations and lets the
estimator pace them. Wraps `useLessonEngine`. Contract:
`useGeneratedPractice({ skill, lessonId, initialLevel=0, gradeAnswer, maxLevel=4 })`
→ `{ problem, level, surfaceForm, decision, rationale, exit, submit, masteryFor }`.

Loop: cursor `{level, index, surfaceForm}`; `problem = useMemo(generateFor(...))`;
an effect emits `problem_present` once per distinct `${level}:${index}:${surfaceForm}`
via a `presentedKeyRef` guard; `submit(answer, meta)` grades, calls
`judgeAndAdvance`, maps via `nextPractice`; `present` → advance cursor, else
`setExit({kind, decision})`.

## 5. `useLessonScaffold.js` — the shared lesson controller

The ONE controller backbone every fixed-stage lesson shares, collapsing ~95 lines
of byte-identical glue (the `useLessonEngine` setup, outcome state, refs+effects,
the guarded mount `problem_present`, unmount `stopVoice`, and the helpers
`goStage`/`nextStage`/`reportAttempt`/`applyEngineDecision`/`award`/`flashBad`).
Only the STAGE MODEL and per-stage RESET differ.

**Stage keys are OPAQUE** — M1/M3 mix numeric stages with the string `"showwork"`;
the hook never coerces a key. `LessonUnlikeDen` is a PARTIAL adopter: it uses the
safe primitives but keeps its own beat navigation (`emitMountPresent:false` so the
hook doesn't double-fire `problem_present` — gotcha G7).

### 5.1 Tier-2 idle/oscillation watcher (within-attempt)

Any logged interaction bumps `lastInteractionTRef = Date.now()`. While a stage is
unsolved, a `setInterval(TIER2_TICK_MS=1500)` checks `checkOscillation` then
`checkLongPause` and, on a fire, calls `publishNudge({type, text: NUDGE_TEXT[type]})`.
Nudges are nudge-only — they never restructure the workspace.

### 5.2 Generated-practice mode (opt-in, backward compatible)

`generatedStages` (`true` | key[] | predicate) marks stages serving auto-generated
variations. On such a stage the hook owns `prob`, `genLevelRef`/`genLevel` (the
LIVE 0..4 level spanning the single stage), `genIndexRef`, and
`genFormOverrideRef`. `generatedStartLevel` default 2 (post-teaching).

`applyEngineDecision(dec, isCorrect)` on a generated stage:
- **U2 certified terminator FIRST**: if `isCertified()` → `onEnd({kind:
  'LessonComplete', certified:true})` — at full mastery the engine may still return
  `FadeScaffold`; certification must win over the endless re-roll (gotcha G6).
- `FadeScaffold` → `genLevel=min(4,+1)`, re-roll; `RaiseScaffold` → `max(0,-1)`,
  re-roll; `TransferProbe` → set form override, re-roll;
  `ReturnToKitchen`/`RouteToRoom` → `onEnd(dec)` (U3); else if `isCorrect` → re-roll.

On a FIXED stage: `ReturnToKitchen`/`RouteToRoom` → `onEnd`; `FadeScaffold` →
`nextStage()`; `RaiseScaffold` → `goStage(back)`; else if `isCorrect` → `nextStage()`.

`award(line, voice, answerValue, opts)` is positional; with `advanceMode==='deferred'`
it delays `applyEngineDecision` by `deferredDelayMs`.

## 6. `scaffoldMap.js` — beat ↔ ScaffoldLevel L0–L4

**Design scale**: L0 max support → L4 fully independent. The mapping is
**conservative**: assign the LOWEST design level that accurately describes the
child's scaffold context.

`toScaffoldLevel(lessonId, nativeBeat)` (forward map). Key tables:
- Universal: `showwork`/`show-work`/`show_work` → `3`.
- `r2`/`r3`: `L0→0, L2→1, L4→2, LW→1, L5→3, L6→3, LA→3, L7→4`; default 0.
- `r1`: `1→0, 2→1, 3→2, 4→1, 5→3, 6→3, 7→4`; default 0. `m1`/`m3` identical to `r1`.
- `r4` (numeric or string): `1/manipulate→0, 2/bind→1, 3/fade→2, 4/numbers→3,
  5/applied→3, 6/words→4`.
- `r5`: `workbench→1`, `applied→3`, then numeric `1→0,2→1,3→2,4→3,5→4`.
- Unknown lesson → 0.

`toBeatForLevel(lessonId, designLevel)` (INVERSE map) returns the native beat at
(or just below) a target level; used by room-entry to resume a returning learner
one notch below `max_scaffold_passed`. Tables: `r2`/`r3`: `0→L0,1→L2,2→L4,3→L6,4→L7`;
`r1`: `['1','2','3','5','7'][level]`; `m1`/`m3`:
`['1-manipulate','2-bind','3-fade','5-numbers','7-words'][level]`; `r4`:
`['manipulate','bind','fade','numbers','words'][level]`; `r5`:
`['1-manipulate','2-bind','3-fade','4-numbers','5-words'][level]`.

## 7. `tier2.js` — within-attempt nudges (U12, pure)

Deterministic, nudge-only, boundary-safe, idempotent. NO engine imports, NO React,
NO wall-clock. Config: `PAUSE_THRESHOLD_MS = 8000`, `OSCILLATION_THRESHOLD = 3`.

`makeTier2Window()` → `{pauseFired, oscillationFired, transferQueued}`. `checkTier2`
returns the FIRST applicable nudge or `null`, priority **HINT_OFFER >
TAKE_YOUR_TIME > TRANSFER_PROBE_QUEUED**, each firing AT MOST ONCE per window:
1. Long pause → `HINT_OFFER{suggestedRung, idleMs}`.
2. Oscillation (`self_corrections >= 3`) → `TAKE_YOUR_TIME{oscillations}`.
3. `too_fast_correct === true` → `TRANSFER_PROBE_QUEUED` — a FLAG only; the caller
   sets `pendingTransferProbe` at the NEXT boundary. Nudges have a `type`, NEVER a
   `kind` (gotcha G2).

## 8. `engineStore.js` + `useEngineStore.js` — the surfaces bridge

**WHY a store, not props (`adrs/ADR-RT-003`).** The Decision/MasteryEstimate live
inside whichever lesson's `useLessonEngine` is mounted; the surfaces live in
`Shell`, ABOVE the lessons. A tiny observable singleton lets `useLessonEngine`
PUBLISH once and `Shell` SUBSCRIBE once — every lesson covered for free.

State shape: `{ decision, rationale, masteryMap, decisionLog:[{kind,rationale,t}],
metrics:{uiChurn}, nudge:{type,text,t}|null }`. API: `subscribe(fn)→unsub`,
`getSnapshot()`, `publishDecision`, `publishNudge`, `clearNudge`, `resetEngineStore`.
`publishDecision` appends a capped (last 50) decisionLog entry and increments
`metrics.uiChurn` on `FadeScaffold`/`RaiseScaffold`. `useEngineStore.js`:
`useSyncExternalStore(subscribe, getSnapshot, getSnapshot)` — kept separate so the
store stays React-free (gotcha G10: reset between tests/sessions).

## 9. The ADVISORY affect layer (`runtime/affect/**`)

Plan-005 corroboration engine. **FIREWALL (constitution §5.2; `adrs/ADR-RT-002`):**
reads behavioral `Signal`s and emits an advisory tier + `AffectState`; NEVER
produces or mutates a `MasteryEstimate`; valence stays neutral; no path into
`gate.ts`. The only affect data in the log is the empty `affect_window` stub.

### 9.1 `affect/index.js` — `composeAffect`

The ONE place behavior-only adaptation decides a tier, by CORROBORATION, under a
FATIGUE BUDGET, recording every hypothesis to the precision LEDGER.
`composeAffect({observed, ctx, prevAffect, governor, ledger})`:
1. `composite = computeComposite(observed, {hintState})`.
2. `affectState = smoothAffect(prevAffect, deriveAffect(composite, observed))`.
3. `isDisengaged = composite.band === 'T3'`.
4. `band === 'T1'` → quiet (`recommendedTier:'none'`, ledger/governor untouched).
5. Actionable (T2/T3): `channel = dominantChannel(byChannel)` by `CHANNEL_PRIORITY
   [latency_stall, idle, orphaned_interaction, rapid_submit, hint_spend]`;
   `severity = T3?'high':'low'`; `offerOk = canOffer(governor, attemptIndex)`.
   Record a ledger entry; return `recommendedTier: offerOk?band:'none'`.
`HYPOTHESIS`: `latency_stall→stuck, idle→disengaged,
orphaned_interaction→wheel-spinning, rapid_submit→guessing, hint_spend→over-reliant`.

### 9.2 `affect/composite.js` — corroboration as arithmetic (`adrs/ADR-RT-004`)

A NEWS2-style early-warning score. **Load-bearing invariant:** a single channel
(even maxed, even firing many times) caps at `maxChannelPoints=2`, BELOW the `t2=3`
threshold — so it can NEVER cross a band alone; at least two channels must agree.
`COMPOSITE_PARAMS`: `maxChannelPoints:2, t2:3, t3:5, strongConfidence:0.5,
hintSpendRung:2`. For each non-`observeOnly` signal, `add(channel, points)` where
points = 2 if `transient===true` OR `confidence>=strongConfidence`, else 1, capped
per channel. `hintState>=hintSpendRung` adds `maxChannelPoints` to a separate
`hint_spend` channel. `band = score>=t3?'T3':score>=t2?'T2':'T1'`. Cold-start
`observeOnly` signals are excluded from the score.

### 9.3 `affect/affectState.js` — AffectState (VALENCE FIREWALL)

Derives `{engagement, attention, confidence, valence}`. **`valence` is ALWAYS
`'neutral'` in Phase 2** — NO emotion/valence inference; non-neutral only from a
CONSENTED self-report (Phase 3) or presence camera (Phase 4). `neutralAffect()` =
`{engagement:1, attention:1, confidence:0.5, valence:'neutral'}`. `deriveAffect`
clamps [0,1]; `smoothAffect(prev, raw, alpha=0.4)` EWMA-blends per dimension.

### 9.4 `affect/governor.js` — nudge-fatigue governor

A per-child intervention budget + dismissal-driven cooldown, measured in ATTEMPTS.
`GOVERNOR_PARAMS`: `maxOffers:5, baseCooldown:2, backoffPerDismissal:2`.
`canOffer(g, i)` = budget>0 AND (no prior offer OR `i-lastOffer >=
effectiveCooldown`). `registerOffer` spends a budget unit; `registerDismissal`
grows backoff; `registerAccepted` resets `dismissals=0`. All `register*` immutable.

### 9.5 `affect/ledger.js` — the precision ledger (counter-metric)

Every affect-raised hypothesis logged with `{trigger, hypothesis, action, severity,
context_hash, behavior_confirmed?, observeOnly?}`. The report computes precision
both unweighted AND WEIGHTED BY INTERVENTION COST: `SEVERITY_COST = {low:1, med:3,
high:9}`. `report(ledger)` → `{total, confirmed, unconfirmed, pending, precision,
costWeightedPrecision, falseInterventionCost, byTrigger}`. **Pending**
(`behavior_confirmed===null`) excluded; **observeOnly** logged but NEVER scored.

### 9.6 `affect/selfReport.js` — self-report companion (Phase 3)

A consented tap (`'tricky'`/`'easy'`) is a FIRST-CLASS signal AND the gold-standard
label. `SELF_REPORT_PARAMS`: `window:3, contradictWrongCount:3, contradictCleanCount:3`.
`evaluateSelfReport(choice, recentObservations)`: `'easy'` contradicted if `wrong
>= 3`; `'tricky'` contradicted if clean-hint-free corrects `>= 3`. The actionable
`signal` is DISCARDED (null) when behavior contradicts; the raw `goldLabel` is
ALWAYS kept. `applySelfReportToLedger`: `'tricky'` CONFIRMS pending non-observeOnly
entries, `'easy'` CONTRADICTS; already-resolved untouched.

## 10. Retention probe (U7) — boundary note

`dueProbes`/`recordRetentionProbe` live in `kitchenProgress.js` (shell-nav) and
consume `PROBE_DELAYS_MS` from `engine/decay.ts`. A mastered node older than the
probe interval is "due"; `recordRetentionProbe(node, correct, t)` appends a
`retention_probe` event. The live retention-probe LOOP runs in `Shell` (shell-nav).

## 11. Lesson-emission contract (boundary note)

A judged correct emits a complete KTD3 Observation burst (every field present and
well-typed; `handwriting` carries `recognizer_confidence`, `tap` carries null;
`affect_window` always `[]`). Lesson configs (`r2-unit`/`r3-nonunit`) must expose
≥2 structurally-distinct `surface_forms` for the transfer tracker.

---

# Engine model surfaces (ui-surfaces, `web/src/ui/**`)

> Scope: the four always-available, observer/learner-facing surfaces that make the
> engine's internal model *visible*. A **pure display layer** — **none imports the
> engine** and **none can write to the engine**. The store bridge and the
> `MasteryEstimate`/`Decision` shapes are referenced by pointer.

### Why these surfaces exist (rationale)

- **"No Choice Paralysis" / "why did the interface change?"** — when the engine
  silently re-shapes the lesson, the child gets a one-line, in-language reason. →
  `RationaleBanner` + the `EngineSurfaces` change-kind filter.
- **Anti "shallow success"** — a teacher/observer can inspect the live per-node
  model and the *counter-metrics* (UI churn, dependence, false-positive rate). →
  `MasteryInspector`.
- **Advisory affect via consented self-report** — the only ground-truth affect
  label is a child's own tap, collected by a calm, reader-safe, in-fiction probe,
  structurally walled off from the mastery gate. → `AffectProbe`.

### Mounting model — one mount, total coverage

`EngineSurfaces` is mounted **exactly once**, by `Shell.jsx`, *outside* the scaled
`#stage`. Because it subscribes to the global `engineStore`, **every** lesson —
including partial adopters — is covered with **zero per-lesson wiring**. Shell wires
it as:

```
<EngineSurfaces
  active={engineActive}                               // inLesson || route === "mom"
  showInspector={engineActive && import.meta.env.DEV} // DEV-gated inspector
  fallbackMasteryMap={masteryMap}                     // Shell's loaded map until a live one publishes
/>
```

### `EngineSurfaces.jsx` — the store→surface bridge container

Calls `useEngineStore()` once and fans the snapshot out. **Change-kind filter
(anti-churn):** the banner only fires for a *change* kind, never routine
`PresentProblem`:

```
CHANGE_KINDS = { FadeScaffold, RaiseScaffold, TransferProbe,
                 RouteToRoom, ReturnToKitchen, EscalateToHuman }
bannerRationale = decision && CHANGE_KINDS.has(decision.kind) ? rationale : ''
```

The full rationale stream still lands in the inspector's decision log.
**`NudgeToast`** (inner) renders a transient Tier-2 nudge, self-dismisses after
`NUDGE_TTL_MS = 5000` via `clearNudge()`, also offers a manual `×`.

### `RationaleBanner.jsx` — the "Why did this change?" bar (KTD8 / U12)

A thin, dismissible status bar showing the latest Decision rationale. Pure
prop-driven (imports nothing from the engine). Tracks `dismissed`/`lastRationale`;
a NEW non-empty rationale **un-dismisses**; empty resets. `visible = Boolean(rationale)
&& !dismissed`. Accessibility: `role="status"`, `aria-live="polite"`,
`data-testid="rationale-banner"`.

### `MasteryInspector.jsx` — counter-metrics + per-node model window (U12)

A collapsible observer panel. Toggle-gated (starts hidden). It computes mastery
status **inline** so it has **no engine import** — an **inline gate mirror** kept in
sync with `gate.ts` by hand (a known duplication; see `gotchas.md` and the
engine-purity ADR):
- `isMastered(est)` ⇔ `P_known ≥ 0.95` AND `max_scaffold_passed ≥ 3` AND
  `transfer_passed` (fluency soft = always true).
- `gateConditions(est)` → `{accuracyOk, independenceOk, transferOk, fluencyOk}` →
  Acc / Ind / Xfr / Flu badges.
- `statusLabel(est)`: `not-started` → `in-progress` → `needs-review` (a retention
  probe ran and `P_known ≥ 0.50`) → `mastered`.

**Node table** rows follow `NODE_ORDER` mirroring `graph.ts` topo order. **Counter-
metrics**: **UI churn** (T3 changes; from `metrics.uiChurn`), **Dependence** (avg
`hint_dependence` over in-progress; `derivedDependence`), **False-positive rate**
(probed nodes no longer `isMastered`; `derivedFalsePosRate`). A caller-supplied
value overrides the derived one. **Decision log** renders newest-first.

### `AffectProbe.jsx` — consented self-report probe (plan 005 / S3)

A calm, modal, **presentational** overlay shown only at rare T3 boundaries.
Babushka asks *"…was that tricky, or easy-peasy?"* with two big tappable faces; the
tap is the gold-standard self-report label. **Reader-safe** (visible TEXT label, not
just emoji), **in-fiction** (`data-vox-speaker="Babushka"`, `nickname` default
`solnyshko`), **firewall-respecting** (NEVER touches the engine; the parent decides
when to show it; corroboration in `runtime/affect/selfReport.js`). Props: `open`,
`onReport('easy'|'tricky')`, `onDismiss()`, `nickname`.

> Integration note: `AffectProbe` is defined and unit-tested but **not yet mounted**
> by Shell or any lesson — a ready surface awaiting a caller that owns the rare-T3
> timing (intentional per its "parent decides when" contract).

---

# Lessons & Rooms — design

## 0. What this subsystem IS

The lesson layer is the **manipulative-first teaching surface**: the ten lesson
rooms (`AppR1`, `AppSubtract`, `AppNumberLine`, `AppCompare`, `AppM1`, `AppM3`,
`AppR4`, `AppR5`, and the shared `LessonUnlikeDen` for r2/r3), the word-problem
**transfer hub** (`MomsRoom` — Babushka's Kitchen) and the **interleaved review**
(`MixedReview` — the Mixed Basket). Each room renders a teaching SCENE built from a
small library of **manipulative components** (`components/**`) and a shared **lesson
chrome** (`components/lesson/**`), and adopts the runtime engine bridge. WHY: the
room is presentation only — the engine owns *what to present next* and *whether the
skill is mastered*, and the room never reads or writes mastery (constitution
§5.3/§5.4). A room never calls `policy.nextDecision`; that happens only inside the
hook at the submit/entry boundary (R16).

## 1. The room scene grammar (play-space-first)

Every room follows the same scene grammar (sourced from
`docs/design/presentation-scene-architecture.md`): a **play space** where the
manipulative IS the problem, a **goal banner**, a **question band** carrying the
bare equation, a **tutor ribbon** (the Cook + a coaching line), and a **hint rail**
holding the room's signature rule. WHY play-space-first: the manipulative must
dominate so the block↔number bridge reads before the notation does.

### 1.1 The two-channel fade (the pedagogical spine)

Each room runs a **scaffold ladder** that fades support in two opposite directions
at once: the **block/touch channel shrinks** (drag → dim → gone) while the
**stylus/writing channel grows** (copy one numeral → write the changed line → write
the whole solution → read prose and extract the math). This is the L0→L4 ladder
(§6) made concrete per room. Native per-room "stages" map onto canonical
`ScaffoldLevel` L0..L4 via `runtime/scaffoldMap.js::toBeatForLevel`.

## 2. Shared lesson chrome (`components/lesson/**`)

A single layout library, imported as
`import { LessonShell, LessonBoard, AnswerBar, TutorRibbon, HintRail, LessonGoal } from "./components/lesson"`.
It replaces the byte-identical hand-rolled chrome each room used to inline. WHY: a
deterministic, reuse-once layout kills the historical "answer bar overlaps the play
area" bug structurally. (See `adrs/adr-lessons-shared-lesson-library.md`.)

| Component | What it IS / WHY |
|---|---|
| `LessonShell` | The ONE page chrome: `.page` → `.foxing` → `.topbar` (№ mark · "Lesson {no} · {tag}" · title · Back/Rewatch/Settings/Reset) → `StageTabs` → `band` → `goal` → `children` → `extra`. Only the differing bits are props. |
| `LessonBoard` | The ONE play-area layout. `split` (default): a CSS grid with stage (top-left), rail (top-right), answer (bottom-left), tutor (bottom-right) in SEPARATE tracks — the answer bar can NEVER overlap the interaction area. `rail={null}` makes the stage span full width. `wide`: a full-width word-problem `content` column + a narrow `tutor` column. Sizing props map to `--lboard-*` CSS vars. |
| `AnswerBar` | The ONE equation + Check card. The room supplies `eq`, an italic `cap`, and Check state. The Rosette-on-solve + Check button live here; `ready` pulses the button once the answer is committed. |
| `LessonGoal` | The ONE goal banner: a "Read aloud" speaker button + the bold voiced caption. Carries `data-vox`/`data-vox-speaker` so `TapToRead` reads it in-character. |
| `TutorRibbon` | The ONE Cook + speech-ribbon block; `tone==="warn"` tints it red; `narrow` is the word-problem variant. |
| `HintRail` | The common single-panel rail card (uppercase heading + italic hint + extra children). |
| `lesson/index.js` | Barrel re-export of the six. |

## 3. The canonical 7-stage arc (R1 as the template)

`AppR1` is the fullest expression of the arc. Its stage model (`STAGES`):

1. **Manipulate** — the blocks ARE the problem; drag two same-size stacks together
   and count. No writing.
2. **Bind** — the merged stack PLUS the written fraction; the child writes the
   answer on the stylus `Slate`.
3. **Fade** — the blocks dim to a faint check; the equation leads; write only the
   changed line (numerator; denominator slot locked).
4. **Workbench** — the shared `BlockSandbox`: a bin of correct + distractor sizes.
5. **Numbers** — a BARE equation; write the whole fraction.
6. **Applied** — an applied sentence with a REQUIRED word→math **setup gate**: the
   child first transcribes the question as a sum on an `ExpressionSlate`; only then
   does the answer `Slate` unlock (`setupOk`).
7. **Show Work** (string-keyed `sw`, between Applied and Words) — a mandatory
   UNGRADED free-form `BlankSlate`; advancing gated purely on ink presence.
   `scaffoldMap` maps `"showwork"` → level 3.
8. **Words** — a plain-language story with no equation shown (the `QuestionBand` is
   suppressed); read, pull the numbers, write the total.
9. **Practice** (`★` badge) — `GenPracticeBoard` serves auto-generated `ADD_SAME_DEN`
   variations PACED BY THE ENGINE. Purely additive.

A **stage selector** (`StageTabs`) jumps to any stage; a correct answer
auto-advances. WHY string-keyed `sw`/`practice`: inserting a step must not renumber
the child-facing numeric stages.

### 3.1 Engine wiring per stage (R1)

The room composes the engine ONLY through `useLessonScaffold`: it supplies `nodeId`,
`lessonId`, `initialStage`, ordered `advance`/`back` (by STAGES order, so `sw` sits
between 6 and 7), `scaffoldKeyFor`, `generatedStages`/`generatorSkill`, `introFor`,
`resetStage`, `onEnd`. The room calls `reportAttempt({correct, answerValue,
errorSignature, stars})` on a wrong answer and `award(...)` on a correct one;
`emit(...)` records manipulative micro-actions. The `error_signature` strings the
rooms produce are the engine's `ErrorSignature` contract.

### 3.2 The Stumping recipe / kitchen return (U3)

A room accepts `stumpingRecipe` + `onReturnToKitchen`: when opened from a "stumping"
kitchen recipe, the hook's `onEnd` receives a `ReturnToKitchen` Decision and routes
back to `MomsRoom` instead of the end-of-arc celebration.

## 4. Manipulative & scene component library (`components/**`)

The shared, read-only building blocks every room composes. Denominator colors come
from `denominatorColors.js` (shell-nav) so a given piece size always reads the same
hue.

### 4.1 Fraction / number display
- **`BigFrac`** — a large rendered fraction, optional `locked` padlock + a `children`
  slot (e.g. R4's ÷K `DivChips`).
- **`NumberLine`** — a 0→`wholes` ruler cut into `den` parts, ticks/labels, an
  optional draggable `point` (`onPlace` fires in WHOLES, snapped to 1/den),
  `fillToPoint`, `benchmarkHalf`. Used by nl, cmp.

### 4.2 Block / strip manipulatives
- **`Stack`** (R1 addends), **`Plank`** (unlike-den strips), **`Knife`** (slice tool).
- **`BlockSandbox`** — the shared draggable fraction-block **Workbench**: a bin of
  sizes the child pulls from, stacks, and counts to a `targetValue`; fires
  `onSolve({num,den})` for a clean same-size row; `mode="number"` switches it to
  whole-number groups (m1/m3).
- **`PlateGroup`**+`BowlGroup` (m1 equal-groups, extra taps spill back), **`SkipJar`**
  / **`SkipLine`** (m3 skip-count), **`Rosette`** (solve reward), **`Lock`** (padlock).

### 4.3 Writing surfaces (the stylus channel)
- **`Slate`** — THE answer slate: stylus handwriting vs typed digits per
  `settings.inputMode`; `slots` define fraction/row layout with per-slot
  `locked`/`digit`; `onSubmit` is the boundary commit. **`BlankSlate`** — free-form
  scratch (`onInkChange` drives the ungraded "Show Work" gate). **`ExpressionSlate`**
  — the word→math setup surface. **`InkPad`** — raw handwriting capture feeding the
  recognizer (ink-recognition); `getSample()` exposes recognizer confidence.
- **`DenominatorPicker`** (LessonUnlikeDen), **`QuestionBand`** (suppressed on
  words-only stages), **`WordProblem`**, **`StageTabs`**, **`FitStage`** (uniform-
  scale wrapper). **`Cook`**/**`Mom`** (the tutor characters).

## 5. Babushka's Kitchen (`MomsRoom`) — the engine-driven transfer hub

`MomsRoom` is the **word-problem transfer / assessment layer** over the five
arithmetic rooms (r1, r3, r2, r4, r5 — NL/S1/CMP are deliberately NOT in the kitchen
CURRICULUM). It is WORDS-ONLY: no bare equation is shown; the child reads the prose,
works it out on a `ScratchCanvas`, and writes the final value.

WHY engine-driven: the kitchen consults the same `useLessonEngine` the rooms use.
Per skill (in CURRICULUM order) it runs **mirror** → **combine** → **look-ahead**
(the NEXT room's first mirror, only if unmastered). A wrong answer at the submit
boundary lets the engine return a **RouteToRoom** Decision → a "go learn it" wall
pointing at the most-upstream unmastered node (`wallNodeId` → `NODE_TO_ROOM`),
stashing the **stumping recipe** id (sessionStorage) so the routed lesson can later
certify mastery and `ReturnToKitchen` re-poses the exact recipe. A correct
look-ahead reads `masteryFor(node).P_known ≥ 0.6` to decide whether to SKIP that
room. `slipToErrorSignature` maps the bank's slip codes onto the engine
`ErrorSignature` union.

### 5.1 Mom's-room components (`components/momsroom/**`)
- **`momsProblems.js`** (top-level) — the kitchen's question bank: `CURRICULUM`,
  `ROOM_SKILL`, `CHARACTERS`, the `Q` recipe objects, `BANK[roomId]={mirror[],
  combine[]}`, the pure `gradeAnswer`/`targetLabel` graders, and the
  `enterStage`/`firstTask`/`nextRoomOf` flow helpers.
- **`momsroom/cast.jsx`** — counter cast SVG characters (`Kid`, `Grandpa`, `Cat`) +
  the `CAST` registry. **`momsroom/props.jsx`** — state-driven story-prop SVGs
  (assets 1–12) via the `PROPS[q.prop]` registry. **`momsroom/kit.jsx`** — the shared
  drawing kit (palette, `Ruler`, `Twine`, `STAGE` geometry).
  **`momsroom/ScratchCanvas.jsx`** — a thin wrapper over `BlankSlate`.

## 6. Mixed Review (`MixedReview`) — interleaved practice (U8)

`MixedReview` is the **Mixed Basket**: interleaved practice across already-met
skills. WHY interleaving: blocked practice lets a child bypass deciding WHICH method
a problem needs, so each trial first asks a **type-identification** step before the
workspace appears; types rotate trial-to-trial. It is STANDALONE — it calls
`generateFor` + `gradeAnswer`/`answerShape` directly. Only skills in `skills[]` that
map to a `ROOMS` label are eligible; it needs ≥2 introduced recipes. `renderInput`
switches on `answerShape` (integer/relation/mixed/fraction).

---

# Shell, navigation & audio (shell-nav)

How the shell/nav/audio layer is built and WHY. (The route GRAPH is in
`ui-wireframes.md`; this section covers router mechanics, stage scaling, the
concept-tree composition, intro sync, and audio routing/ducking.)

## Router & shell (`Shell.jsx`)

A hand-rolled hash router with no router library. `useHashRoute` reads `#/<route>`
(default `title`), subscribes to `hashchange`, exposes `go(r)`. `Shell` computes a
single `screen` variable then renders it ALONGSIDE the always-mounted globals.

**Why hash routing:** the URL hash makes the tablet back gesture work for free.
**Why a computed `screen` instead of early returns:** `BackgroundMusic`, `TapToRead`,
and `EngineSurfaces` must stay mounted across navigation (music must not restart),
so the tree is `<>{screen}<TapToRead/><EngineSurfaces/><BackgroundMusic/>{fab}</>`.
**Overlay return-to-origin:** `settings`/`concepts` record the last non-overlay route
in `prevRouteRef` so "Done" returns the player where they opened it from. **Room
dispatch:** `Shell` resolves `ROOMS.find(id)`, decides intro-vs-lesson (`seenIntros`
set), computes the scaffold-entry beat, reads/clears `stumpingRecipeId`, and hands a
common prop bag to the room component.

## Stage scaling (`useStageFit`)

A single uniform-scale fit of the 1280×800 stage: `scale = min(vw/1280, vh/800)` on
`#stage`; `#fit` is `position:fixed`, sized to the scaled box. **Why `visualViewport`
(not `innerHeight`):** on iOS/iPadOS Safari the layout viewport includes the area
behind the dynamic toolbar, so fitting to it slides the stage bottom under the
toolbar. Re-fits on `resize`/`orientationchange`/`visualViewport` resize+scroll.

## Mastery load timing (pointer: engine-core)

`loadMasteryMap()` folds the engine log to a per-node MasteryEstimate map. It runs
on mount and whenever the route returns to `world`/`title`/`review`. **Why on return
only:** keeps the WorldMap badges live WITHOUT a real-time engine subscription.
`Date.now()` is injected here (the React boundary). **Retention probe settle (U7):**
opening a room with a due probe stashes its node in `probingNodeRef`; the next
return re-folds and calls `recordRetentionProbe(node, isMastered(fresh))`.

## World map two-level design (`WorldMap.jsx`)

A TOP level of three shelf nodes (STRANDS) around the kitchen joined by "recipe
trail" SVG paths, and a SUBMENU of one strand's lesson cards. `submenuPositions(n)`
lays N 250px cards centre-anchored. **Why two levels:** ten lessons no longer fit one
radial ring without overlap. Per-room status, the suggested-next "Next" badge, and
the shelf rollup read the engine via `kitchenProgress` helpers; `masteryMap == null`
degrades to no-data rendering.

## Concept-tree composition (`conceptTree.js` + `ConceptMap.jsx`)

`buildConceptTree()` composes the engine skill graph (`allNodes`), room metadata, and
CCSS tags into `Concept → Node → Atomic card`. Atomic cards come from each node's
`scaffold_ladder` rungs + `transfer_forms`; mastery is MEASURED only at the card and
rolled up. **Why grade-free:** the app is pace-agnostic — concepts are ordered by the
prereq graph, not by grade; CCSS codes appear as reference labels only. **The mastery
seam:** `getMastery(key, nodeId)` is LIVE (node `P_known` rolled to cards when a log
exists) or a deterministic placeholder hash otherwise.

## Intro narration sync (`RoomIntro.jsx` + `intro*.js`)

The intro is a silent self-contained animated HTML page in a same-origin iframe. The
iframe `<Stage>` writes its playhead to `localStorage[STAGE_PERSIST_KEY + ":t"]`;
`RoomIntro` polls that clock in a `requestAnimationFrame` loop and fires each
pre-baked narration clip when the playhead passes BOTH the cue's `gate` and `prevEnd
+ pause`. **Why drive narration off the video's own clock:** pause "just works" — a
paused video freezes the playhead, so the gates freeze. **Why narration lives outside
the video:** the bundled videos are silent, so the voice + transcript layer is bolted
on without re-rendering the video; cue `key`s/`text` are stable so baked mp3s are
reused.

## Audio routing & ducking

- `audioBus.js` — a count-based global signal of "is any voice active?".
- `music.js` — `MUSIC[scene]` track lists + `sceneFor(route, showingIntro)`
  (`mom`→kitchen, rooms→rooms rotation, intro→null, else map).
- `BackgroundMusic.jsx` — a UI-less player. Single-track scenes loop natively;
  multi-track rotate on `ended`. Plays unless muted / no tracks / a voice is active,
  fading out+pausing under narration ("whenever there is no voice, there is music").

**Voice channel (`voice.js`):** a module-level single channel shared by every
`useVoice()` and `TapToRead`, so exactly one voice plays app-wide and a new line cuts
the last. Resolution: baked clip key → exact-line-text → arbitrary-text TTS via
`/api/tts`. **No robotic Web Speech fallback** — on failure it stays silent
(constitution §5.9). `readAloud` yields to app-driven `say()` within 250ms.

**Tap-to-read (`TapToRead.jsx`):** a root-mounted `MutationObserver` injects a
speaker button next to each LEAF readable copy block in `#stage`, skipping
interactive/manipulative surfaces and `[data-novox]`. A capture-phase click reads the
block (`[data-vox]` clip or synthesized own-text, voiced by nearest
`[data-vox-speaker]`, default Cook).

**Speech normalization (`speechify.js`):** spells fractions ("5/7"→"five sevenths"),
reads `№`, strips UI glyphs, collapses whitespace. The normalized string doubles as
the TTS cache key.

## CSS / scene-scoping convention

Each chrome screen scopes its styles under a single scene class (`.titlescreen`,
`.settings-scene`, `.cm-scene`, `.world`) so generic class names never leak.
`styles/tokens.css` holds the shared design tokens (the Soviet/old-paper palette +
fonts). All scenes share the 1280×800 paper-fill + engraved-frame + corner-filigree
motif.

---

# Harness — design (architecture)

> The synthetic-learner red-team harness (`web/src/harness/**`) replays seeded
> persona×skill sweeps against the REAL engine (bound via `engineApi.js`) to
> red-team it for false-mastery / missed-escalation / false-transfer, emitting
> reproducible tape-projected reports.

## 1. What the harness IS and WHY

A population of **synthetic learners** (generative models of children) driven
headlessly against the same mastery engine the live app uses, to catch the engine
crediting mastery a child does not have, abandoning a child who is stuck, or
crediting transfer/independence on a spoofable proxy — BEFORE a real child hits it.
Everything is **pure and deterministic** (no `Math.random`, no `Date`) so a finding
is reproducible from a seed and a committed tape, and every emitted document is a
**pure projection** of those tapes. WHY a separate harness and not just tests: it is
a *red-team*. Its personas are deliberately **parameter-disjoint** from the engine's
BKT inference params (enforced by a lint; `adrs/0003-persona-engine-param-disjointness.md`).

## 2. Layered architecture (data flow)

```
personas (generative children)        engine (REAL, via engineApi.js)
   model.js / library.js / families.js     measurementReduce / nextDecision / gate
   inverseErrors.js (misconception math)    generateFor / nextPractice / segment
            │                                         ▲
            ▼                                         │
     sessionRunner.runSession  ── drives the headless submit boundary ──┘
            │ emits the event burst segment() reads, advancing an INJECTED clock
            ▼
        signed tape  (tape.js: canonical, byte-identical replay)
            │
   ┌────────┼─────────────────────────────────────────────┐
   ▼        ▼                 ▼                ▼            ▼
 oracle   metrics          findings         search      recursiveLoop
 latentTruth aggregate     buildBacklog    searchNearestFlip  runLoop (sealed judge)
 labelTape  clusterFailures                distillChampions   replayChampions
   │        │                 │                │            │
   └────────┴──────► report.js (build*/render* → docs/harness/*.md) ◄──┘
                     │
                     └──► dashboard/** (same projections, in-browser)
```

The runner is the hub: it produces tapes; everything downstream is a pure read of
tapes (+ the static oracle probes). `cli.js` is the only `fs` sink.

## 3. The session runner — `sessionRunner.js`

`runSession` is the **headless MIRROR of the live submit boundary**
(`useLessonEngine.js`). It drives the REAL engine — no mock. Per attempt:
`measurementReduce` → **BOUNDARY** `nextDecision` (ONCE; R16) → `nextPractice` →
`generateFor` → `persona.emit(problem, ctx)` (`ctx.rng = personaRng(...)`) → grade +
assemble JUDGED fields → append the full event burst → update `PolicyState` EXACTLY
as `useLessonEngine._updatePolicyState` → fold again to push post-attempt P_known →
apply the scaffold change → record the tape step.

Key WHY decisions captured faithfully (NOT "fixed"):
- **Empty recentBehavior channel.** `EMPTY_RECENT_BEHAVIOR` mirrors the live
  `recentObsRef` that is allocated but never appended — so the engine's "disengaged"
  escalation trigger is UNREACHABLE by construction, a real finding the oracle
  reports, not a bug the runner papers over.
- **STUCK escalation IS reachable** — the runner drives PolicyState so a stuck
  persona reaches it.
- **Injected clock** (`clock.t`, starts 1_000_000). No wall-clock — replay-exact.

`runSweep` loops personas × skills, building a **FRESH persona per pair**.
`characterizeScriptedStage` is a READ-ONLY stub recording the verified divergence:
the scripted-stage path advances on ONE correct, while the engine path requires the
full gate.

## 4. Personas — `personas/`

A persona (`makePersona(spec)`) samples correctness from ITS OWN latent
(`truePknownBySkill` + `learnRate`) plus slip/guess noise — NOT the engine's BKT.
Wrong answers are planted via the inverse-error map on the REAL operands. Latency is
a DRAW from a band so fatigue makes latency rise across a session. Contract:
`{ id, klass, latent, meta, truePKnown(skillId), emit(problem, ctx) }`.

**Library (`library.js`)** — three groups: (1) ordinary BKT-shaped archetypes
(`fast-mastery`, `slow-but-steady`, `confident-guesser`, `memorizer`, `over-hinter`,
`anxious-low-energy`, `short-attention`, `misconception-stable`, `low-reading`);
(2) non-BKT laws + off-task (`oscillator` period 7 coprime with `fadeStreakK`=3,
`bimodal`, `off-task`); (3) audit spoofers, each targeting ONE spoofable proxy
(`same-answer-memorizer`, `denominator-transfer-spoofer`, `fast-shallow-guesser`).

**Families (`families.js`)** — `trainFamily()` vs `heldOutFamily()` for the sealed
judge. Held-out draws latents from ranges DISJOINT from train, a FRESH seed lineage,
genuinely NON-BKT emit laws; `fam-held-fluency-spoofer` deliberately pins latent
below τ so the held-out set carries a real false-mastery defect.

**Inverse errors (`inverseErrors.js`)** — re-implements a misconception's buggy
arithmetic on the real operands so the engine fingerprints the planted answer.
HONESTY CAVEAT: for named signatures the map shares the engine's arithmetic by
construction, so the round-trip is a COVERAGE check, not independent evidence.

## 5. The oracle — `oracle/`

The ground-truth channel: compares the engine's signal against the persona's LATENT
TRUTH.
- **`latentTruth.js::labelTape`** — `falsePositiveMastery`, `missedEscalation`,
  `falseEscalation`, `falseTransfer`. `DEFAULT_TAU_LATENT = 0.8`, DELIBERATELY
  disjoint from the engine's `gateThreshold` 0.95 (pinning τ to it would make the
  oracle a tautology). Reported as a CURVE over τ.
- **`expectedFindings.js`** — the SIX audited defects as expected signatures, each
  tied to a diagnostic persona + the plan-002 flag that WILL resolve it. A flags-ON
  run STILL shows the defects present (the flags are inert stubs).
- **`positiveControl.js`** — VERIFY-FIRST: catches a KNOWN defect (fluencyOk soft
  gate). `blindControl` accepts an externally-supplied defect injector.
- **`invariants.js`** — ground-truth-FREE metamorphic relations: surface-form
  permutation preserves the verdict; one extra correct never lowers P_known; a
  higher-slip twin never gates EARLIER.

## 6. Metrics + findings

**`metrics.js`** folds an oracle-labeled population into a `MetricsRecord` whose
constructor THROWS if a HEADLINE metric lacks its COUNTER (KTD5): `mastery_rate ⇒
false_mastery_rate + evidence_count_at_gate_open`; `hints_given ⇒ independence_rate`;
`reps_to_mastery ⇒ transfer_after_fade`. `clusterFailures` groups by `(persona_class,
skill, decision_kind)`. **`findings.js::buildBacklog`** projects tapes into a ranked,
deduplicated backlog of four categories; an audit-found weakness SUPPRESSES the
harness-found duplicate.

## 7. Adversarial search — `search.js`

`searchNearestFlip` perturbs the latent vector + seed inside a **plausibility box**
(`pSlip<0.5`, `pGuess<0.5`), driving the REAL engine until it finds a latent that
FLIPS an engine decision against the oracle, MINIMIZING distance to honest. A light
gradient-free (μ,λ) evolutionary loop. A reported `{latent, seed}` replays the exact
flip. `searchCoverage` keeps mutants reaching a NEW `(decision_kind, skill,
scaffold_level)` tuple.

## 8. Recursive loop + champions — `recursiveLoop.js`

`runLoop(change)` runs BOTH families (train + the SEALED held-out) before and after,
and only blesses a change `REAL` when the held-out family improved on a target metric
AND the guardrail did not degrade AND the search-trials-deflated bar holds. `GAMING`
⟺ train improved but the seal did not. `NO_CHANGE` ⟺ neither moved (the inert 002
flags today). The held-out judge runs a DIFFERENT seed lineage `(seed ^ 0x5ea1ed)`.
`distillChampions` freezes the worst N adversaries as `{latent, seed}` fixtures;
`replayChampions` re-runs them as a fast CI regression check.

## 9. Reports — `report.js`

The brief's required documents as PURE TAPE PROJECTIONS, split `build*`/`render*` so
everything is browser-safe (no `fs`): verdict cards, baseline report, decision log,
limitations memo, research notes (the only non-projection). The `ENGINE_PATH_SCOPE`
banner is reused wherever a certification claim is made: results characterize the
ENGINE PATH, not the live scripted-stage child experience.

## 10. Quarantine — `quarantine/`

Two QUARANTINED facets, hard-isolated from the tuning loop: **`chaos.js`** (chaos
fault-injection on the Observation pipeline; every fault is on a deep CLONE) and
**`llmDiscriminator.js`** (a BLIND Turing check, JUDGE-ONLY, degrades gracefully
since no `/api/judge` proxy exists today).

## 11. Dashboard — `dashboard/`

The evaluator-facing dev-only demo route (`HarnessDashboard.jsx`): persona gallery
rail, `FailureHeatmap`, `RecursivePanel`, and `VerdictCard`s. `data.js` are PURE
projections (the SAME `report.js` + oracle projections the CLI writes). `runDemoSweep`
runs a SMALL subset in-browser; `replaySession` flags terminal divergence vs the
stored tape.

---

# On-device handwriting recognition (ink-recognition)

> The on-device handwritten-digit recognition pipeline. Owned: `web/src/ink/**`,
> `web/tools/train_mnist.py`, `web/tools/dump-ink.mjs`, `web/public/mnist-12.onnx`.
> Consumed by `lessons-rooms` (`InkPad`/`Slate`).

## 1. What it IS and WHY it exists

`web/src/ink/recognizer.js` recognizes **handwritten numerals (0–9 only)** drawn with
a stylus, entirely **on-device, in the browser, offline**. It supports a "stylus
pivot": a child writes the numerator/denominator by hand.

**WHY digits-only:** the child writes ONLY numerals. The fraction bar, `+`, and `=`
are **printed by the UI and never drawn**, so the recognizer never parses operators
or 2-D structure — it's a flat left-to-right digit reader with no expression parser.
**WHY on-device / offline:** the only runtime network use is a dev-only TTS call and
this local ONNX model, served as static assets.

## 2. Pipeline overview

```
recognizeDigit(strokes)        -> { digit: "0".."9"|null, conf, confident }
recognizeNumber(strokes, opts) -> { text, digits: [...], conf, confident }
```

`recognizeNumber` pipeline: `segment` → for each group `recognizeDigit` (CNN primary,
`$P` fallback) → join chars; `min(conf)` overall; `all(confident)`. Two orthogonal
concerns: (A) **segmentation** (cut a multi-digit scribble into numerals); (B)
**classification** (what digit each group is).

## 3. Classification: ONNX MNIST CNN (primary)

- A **pretrained MNIST CNN from the ONNX model zoo, "mnist-12"** (~26 KB) at
  `web/public/mnist-12.onnx`. NOT trained in this repo.
- Run with **onnxruntime-web** (`^1.26.0`); imports the **plain WASM build**:
  `import * as ort from "onnxruntime-web/wasm"`. WHY `/wasm`: the default jsep/WebGPU
  build fetches a ~26 MB `*.jsep.wasm`; the plain WASM build uses one small
  `ort-wasm-simd-threaded.wasm`. `ort.env.wasm.numThreads = 1` (no SharedArrayBuffer
  without cross-origin isolation). **No `wasmPaths` set** — with
  `optimizeDeps.exclude: ['onnxruntime-web']`, ort self-resolves.
- **Model I/O contract (mnist-12 / CNTK graph):** input `Input3`, shape `[1,1,28,28]`,
  `float32`; output `Plus214_Output_0` (10 raw logits, NOT softmaxed); pixels in **raw
  0..255** (×`INPUT_SCALE = 255`).
- **Session load:** a module-level `sessionPromise` fetches + creates the session;
  on success sets `SESSION`, on failure sets `LOAD_ERR`, warns, resolves to `null`
  (never throws). `cnnDigit` returns `null` until ready, so the caller falls back to
  `$P`.
- **`cnnDigit`** rasterizes, builds a 784-float input, argmaxes, computes a stable
  softmax `conf`, `confident = conf > 0.5`.
- Debug probes: `modelStatus()`, `classifyDebug(strokes, scale)`.

## 4. Preprocessing: `rasterize(strokes)` — the real accuracy fix

Preprocessing — not the model choice — is what makes the model accurate. It produces a
**white digit on black, scaled into a 20px box, centered in 28×28 by center-of-mass**:
flatten points → bounding box → scale into a 20px inner box (`scale = 20/max(w,h)`) →
render with an anti-aliased "splat" brush (`R = 1.7` in 28-space, interpolating ~2×
along segments) → **center by mass** (shift so the centroid lands at (14,14)). Returns
a `Float32Array(784)` in `[0,1]`.

## 5. Fallback classifier: `$P` geometric matcher (`pdollarDigit`)

Used **only until the CNN finishes loading**. A self-contained `$P` point-cloud
recognizer against parametric digit templates: `normalizeStrokes` (concatenate +
`resample(32)` with interval accumulation broken across stroke boundaries + uniform
`scale` + `translateToOrigin`); `cloudDistance`/`greedyMatch`; **confident** when
`bestScore < 0.45` AND `margin > 0.06`; `conf` synthesized to mirror softmax.
`RAW_TEMPLATES` are parametric strokes (e.g. two "1" variants) compiled once into
normalized clouds.

## 6. `segment(strokes, opts)` — splitting a multi-digit scribble

The hard problem: "42" in one box where a `4`'s crossbar reaches under the next
digit. **Solution — split on WHITESPACE between digits in the horizontal projection:**
build a horizontal ink-occupancy histogram (`densify` first); cut at the center of
each empty band wider than `minGapPx = (gapFrac ?? 0.09)·H`; `assignByCuts` bins
**whole strokes** by center-x (keeps a 4's crossbar with the 4).
**`forceSplitWide(seg, H)` fallback** for touching digits: a numeral advances the pen
≈`0.65·H`, so `k = clamp(round(width / (0.65·H)), 1, 3)` and even-split (keeps a lone
wide "4"/"0" ≲0.95·H intact while splitting a ≥1.1·H blob). Groups sorted
left-to-right.

## 7. `recognizeNumber` aggregation
`segment` → groups (empty → empty result); `recognizeDigit` each group in parallel;
`text` = join; `confident` = every digit confident; **overall `conf` = `min`**
(weakest-link).

## 8. How consumers use it (pointer: `lessons-rooms`)
`components/InkPad.jsx` imports `recognizeNumber`; `components/Slate.jsx` imports both.
The `recognizer_confidence` field on the engine `Observation` is fed from this
module's `conf`/`confident`.
