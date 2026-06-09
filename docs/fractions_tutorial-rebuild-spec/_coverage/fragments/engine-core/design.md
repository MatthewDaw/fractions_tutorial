<!-- slice: engine-core — fragment for design.md -->

# Mastery / measurement engine — internals (engine-core)

The engine (`web/src/engine/**`, TypeScript) is the pure, deterministic,
wall-clock-free measurement core. This section documents HOW each module works
and WHY. The cross-cutting layering (engine ⇄ runtime ⇄ surfaces) and the
purity/firewall boundary are synthesis-owned; here we document the engine's own
mechanics. Time enters only as injected `event.t` / `now` (constitution §5.1).

Pipeline overview (the reduce composes these): **segment** (observation.ts) →
**credit assign** (credit.ts) → **BKT + dimensions** (bkt.ts/dimensions.ts) →
**assemble** (mastery.ts) → **gate** predicate (gate.ts) → **decay** folding
(decay.ts). `policy.ts` and `wall.ts` consume the resulting estimates to choose
the next move; `observe/**` is a parallel, firewalled behavioral-signal pipeline.

---

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

---

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
gotchas.md and the prereq-prepend ADR (synthesis-owned). For `add_denominators`,
if the mapped node IS the binding node it returns null (nothing to implicate).

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

## Deterministic policy (`policy.ts`)

Two pure functions; boundary-only (R16 — called only at the submit/entry
boundary in `useLessonEngine`, see runtime-affect slice).

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

---

## Append-only log + persistence (`log.ts`)

- **Pure core:** `appendEvent(log, event)` returns a NEW array (never mutates);
  `foldLog(log, init, reducer)` is an intent-expressing `reduce`.
- **Adapter (side-effectful, kept out of folds):** `loadLog()` /
  `saveLog(log)` read/write localStorage key `moms-engine-log-v1`; both swallow
  errors (corrupt JSON, quota, private browsing) and degrade to `[]` / no-op.
- **Migration:** `migrateFromKitchenProgress(storage = localStorage)` reads the
  legacy `moms-kitchen-progress-v1` `{ mastered: string[] }` and returns a
  `SeedPriors` map: a node whose `roomId` is in `mastered` → 0.80, else 0.10.
  Reads but never writes; injectable storage for tests. See env-and-config.md.

---

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
