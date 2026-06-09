<!-- slice: engine-core — fragment for data-model.md -->

# Engine wire DTOs and skill graph (engine-core)

The engine's public types are **wire DTOs**: every type re-exported from
`web/src/engine/index.ts` is shaped so the engine could relocate behind a Python
FastAPI backend with only a `fetch` swap at the runtime call sites (constitution
§5.8). All types are authored in TypeScript under `web/src/engine/types.ts`. This
section documents the contract exhaustively; consuming slices reference it by
pointer.

> Affect firewall (constitution §5.2): the only affect field in any DTO is
> `Observation.affect_window`, a typed empty-array stub. No DTO carries a
> valence/emotion field, and `gate.ts`/`mastery.ts` never read `affect_window`.
> See gotchas.md.

---

## Public surface — `index.ts`

`index.ts` re-exports ONLY (no logic of its own):

- **Types** (from `types.js`): `Modality`, `Actor`, `ScaffoldLevel`, `Action`,
  `Signal`, `Event`, `ErrorSignature`, `Observation`, `FluencyStats`,
  `MasteryEstimate`, `Decision` plus the 7 per-kind `Decision*` interfaces,
  `SkillNode`.
- **Params** (from `params.js`): value `PARAMS`; types `EngineParams`,
  `BktParams`, `EscalationParams`.
- **Graph** (from `graph.js`): `getNode`, `prereqsOf`, `allNodes`,
  `mostUpstreamUnmastered`, and node constants `MULT_EQUAL_GROUPS`, `MULT_FACTS`,
  `ADD_SAME_DEN`, `ADD_UNLIKE_NESTED`, `ADD_UNLIKE_COPRIME`, `SIMPLIFY`,
  `IMPROPER_TO_MIXED`. (Note: `FRACTION_ON_LINE`, `SUB_SAME_DEN`,
  `COMPARE_BENCHMARK` are exported by `graph.ts` but NOT re-exported through
  `index.ts` — consumers import those three from `./engine/graph.js` directly.)
- **Log** (from `log.js`): `appendEvent`, `foldLog`, `loadLog`, `saveLog`,
  `migrateFromKitchenProgress`; type `SeedPriors`.

The deeper algorithm modules (`bkt.ts`, `credit.ts`, `decay.ts`, `dimensions.ts`,
`gate.ts`, `mastery.ts`, `measurementReduce.ts`, `observation.ts`, `policy.ts`,
`wall.ts`, `observe/**`) are NOT funnelled through `index.ts`; runtime/harness
callers import them by explicit `.js`-specifier path (resolved to `.ts` by the
`resolveTsFromJs` Vite plugin — constitution §2).

---

## Primitive enumerations (`types.ts`)

| Type | Definition | Notes |
|---|---|---|
| `Modality` | `'tap' \| 'type' \| 'handwriting' \| 'voice'` | answer-input channel |
| `Actor` | `'human' \| \`synthetic:${string}\`` | `human` = real child; `synthetic:<persona>` = harness persona. Template-literal type. |
| `ScaffoldLevel` | `0 \| 1 \| 2 \| 3 \| 4` | L0 = max support → L4 = independent (constitution §6) |

---

## Events (append-only log entries)

`Event = Action | Signal` — the only entries in the engine log.

### `Action`
| Field | Type | Meaning |
|---|---|---|
| `type` | `string` | open string (e.g. `problem_present`, `answer_submit`, `judged`, `hint_shown`, `piece_place`, `retention_probe`) |
| `payload` | `Record<string, unknown>` | type-specific data |
| `modality` | `Modality` | input channel |
| `t` | `number` | injected ms-epoch timestamp — **no wall-clock inside the engine** |
| `actor` | `Actor` | who produced it |

### `Signal`
Same as `Action` but with `confidence: number` (∈[0,1]) instead of `modality`.
The presence/absence of `confidence` is the structural discriminant: every
engine type-guard distinguishes `Action` from `Signal` via `'confidence' in ev`
(see `observation.isAction`, `observe/*.isActionEvent`, the reduce's
`'confidence' in ev` skips). A `Signal` is inert telemetry: it is logged but no
mastery projection reads it (firewall).

> Action `type` strings the engine actually keys on (open set, but these are
> load-bearing): `problem_present`, `answer_submit`, `judged`, `hint_shown`
> (payload `rung`), `retention_probe` (payload `node_id`/`correct`/`probe_t`),
> and the manipulation pairs `piece_place|piece_add` / `piece_remove|piece_lift`
> (self-correction counting) plus the wider work/remove vocab in
> `observe/detectors.ts` (`value_set`, `num_set`, `stroke`, `ink_stroke` /
> `value_clear`, `num_clear`, `ink_clear`).

#### `problem_present` / `judged` payload keys read by the engine
- `problem_present.payload`: `node_id` (binds the attempt to a skill — see
  reduce), `scaffold_level` (0–4), `problem_id`, `surface_form`, optionally
  `p_known`/`P_known` (observe context).
- `judged.payload`: `correct` (=== true), `answer_num`+`answer_den` OR
  `answer_value: [n,d]`, `error_signature` (preferred — see observation), `slip`,
  `target_num`, `target_den`, `operands`, `hint_max_rung`, `problem_id`,
  `surface_form`.

---

## `ErrorSignature` — misconception taxonomy

```
'add_denominators' | 'add_across_unlike' | 'scaled_bottom_only'
| 'forced_leftover' | 'not_simplified' | 'other' | null
```

| Value | Misconception |
|---|---|
| `add_denominators` | `2/7+3/7 → 5/14` — added numerator AND (equal) denominator |
| `add_across_unlike` | `1/2+1/3 → 2/5` — added tops and bottoms straight across (unlike) |
| `scaled_bottom_only` | scaled denominator without scaling numerator |
| `forced_leftover` | improper→mixed conversion error |
| `not_simplified` | correct value but not lowest terms |
| `other` | any other recognised wrong pattern |
| `null` | correct, or no pattern recognised |

This is the credit-assignment key (see design.md credit section): only these
seven values may key the implication map, so `observation.ts` coerces any
unknown emitted signature string to `'other'`.

---

## `Observation` — rich per-attempt record (KTD3)

Produced by `observation.segment()`; one per `problem_present … judged` span.

| Field | Type | Meaning |
|---|---|---|
| `correct` | `boolean` | judged correct |
| `answer_value` | `[number, number] \| null` | `[numerator, denominator]`, null if non-fraction |
| `error_signature` | `ErrorSignature` | fingerprinted misconception |
| `latency` | `number` | ms from `problem_present` to `answer_submit` (falls back to `judged.t`) |
| `hint_max_rung` | `number` | highest hint rung shown (0 = none) |
| `self_corrections` | `number` | place/remove oscillation reversals within the attempt |
| `scaffold_level` | `ScaffoldLevel` | level the attempt was made at |
| `modality` | `Modality` | input channel |
| `recognizer_confidence` | `number \| null` | ∈[0,1] when `modality==='handwriting'` (defaults 0.5 if unrecorded), else null |
| `too_fast_correct` | `boolean` | correct AND `latency < PARAMS.latencyFloorMs` — false-positive guard |
| `problem_id?` | `string` | stable id (emission seam); used by `isIndependent` for true distinctness |
| `surface_form?` | `string` | structural form key (emission seam); used by `hasTransferred` |
| `affect_window` | `readonly never[]` | **always `[]`** — typed firewall stub / future MediaPipe seam |

`problem_id`/`surface_form` are optional so pre-seam observations still typecheck;
when absent the dimension checks fall back to `answer_value`-derived proxies.

---

## `FluencyStats`

| Field | Type | Meaning |
|---|---|---|
| `median_latency` | `number \| null` | median over last N corrects; null if N < `fluencyMinN` (5) |
| `slope` | `number \| null` | least-squares latency slope (ms/attempt); null if N < min |
| `n` | `number` | number of correct attempts used |

---

## `MasteryEstimate` — per-node knowledge state (R8, stable public interface)

| Field | Type | Meaning |
|---|---|---|
| `P_known` | `number` | BKT posterior ∈ `pKnownClamp` = [0.01, 0.99] |
| `fluency_stats` | `FluencyStats` | speed sub-measure (soft gate pre-calibration) |
| `max_scaffold_passed` | `ScaffoldLevel \| null` | highest level answered correctly hint-free |
| `transfer_passed` | `boolean` | ≥2 correct on ≥2 distinct surface forms, hint-free, low scaffold, in-band |
| `hint_dependence` | `number` | fraction of recent corrects needing rung ≥ 2 |
| `last_retention_probe` | `number \| null` | ms-epoch of most recent probe (injected), null if none |
| `mastered_at` | `number \| null` | ms-epoch the node FIRST passed the gate; persists across a later demoting probe so a lapsed node still reads "was mastered" (needs-review). Derived from logged `judged` timestamps. |

There is no `mastered` boolean field: mastery is **read only** via
`gate.isMastered(estimate)` (constitution §5.4, R9).

---

## `Decision` — discriminated union (7 kinds, KTD7; no `DeclareMastered`, R9)

Every variant extends `DecisionBase { rationale: string }` (non-empty one-line
rationale surfaced to the child and logged — KTD8).

| `kind` | Extra fields | Meaning |
|---|---|---|
| `PresentProblem` | `node`, `scaffold: ScaffoldLevel`, `surface_form` | show next problem |
| `RouteToRoom` | `node` | leave kitchen → strengthen an upstream skill |
| `ReturnToKitchen` | `recipe` | mastered the binding skill → finish the stumping recipe |
| `FadeScaffold` | — | reduce support |
| `RaiseScaffold` | `preserveWork: true` (always) | add support without clearing the child's in-progress work |
| `TransferProbe` | `node` | probe a structurally novel surface form |
| `EscalateToHuman` | `reason: string`, `handoff_packet: string` | hand off to teacher/parent; packet is human-readable recent log |

There is deliberately **no** `DeclareMastered` variant (R9).

---

## `SkillNode` — DAG vertex (KTD11)

| Field | Type | Meaning |
|---|---|---|
| `id` | `string` | stable SCREAMING_SNAKE_CASE id |
| `roomId` | `string` | live `rooms.js` room id (`m1 m3 nl r1 s1 cmp r3 r2 r4 r5`) |
| `prereqs` | `readonly string[]` | prerequisite node ids ([] = DAG root). **Order is load-bearing — see gotchas.md / credit.** |
| `scaffold_ladder` | `readonly (readonly string[])[]` | index = ScaffoldLevel; each entry lists surface-form keys at that level (5 entries L0–L4) |
| `transfer_forms` | `readonly string[]` | structurally distinct surface-form keys; ≥2 makes `TransferProbe` legal |
| `bkt_params?` | `{P_T,P_S,P_G,P_L0}` | per-node BKT override; falls back to global `PARAMS.bkt` |
| `standards?` | `string[]` | optional CCSS codes (e.g. `['3.NF.A.2']`) |
| `grade?` | `string` | optional CCSS grade band `'3'\|'4'\|'5'` |

### The 10 nodes (`graph.ts`, topological/teaching order)

`ALL_NODES` order is load-bearing: `mostUpstreamUnmastered`, escalation, and
`suggestedNextRoom` all walk it front-to-back.

| # | id | roomId | prereqs | grade |
|---|---|---|---|---|
| 0 | `MULT_EQUAL_GROUPS` | m1 | `[]` | 3 |
| 1 | `MULT_FACTS` | m3 | `[MULT_EQUAL_GROUPS]` | 3 |
| 2 | `FRACTION_ON_LINE` | nl | `[]` | 3 |
| 3 | `ADD_SAME_DEN` | r1 | `[]` | 4 |
| 4 | `SUB_SAME_DEN` | s1 | `[ADD_SAME_DEN]` | 4 |
| 5 | `COMPARE_BENCHMARK` | cmp | `[FRACTION_ON_LINE]` | 4 |
| 6 | `ADD_UNLIKE_NESTED` | r3 | `[ADD_SAME_DEN]` | 5 |
| 7 | `ADD_UNLIKE_COPRIME` | r2 | `[MULT_FACTS, ADD_UNLIKE_NESTED]` | 5 |
| 8 | `SIMPLIFY` | r4 | `[MULT_FACTS, ADD_UNLIKE_COPRIME]` | 4 |
| 9 | `IMPROPER_TO_MIXED` | r5 | `[ADD_UNLIKE_COPRIME]` | 4 |

Each node's `scaffold_ladder` is a 5-row list of surface-form keys (e.g.
`same_den_visual`→`same_den_transfer`); `transfer_forms` is the bare+transfer
pair (length 2 → `TransferProbe` legal). `getNode(id)` THROWS on an unknown id,
and `prereqsOf` maps every prereq through `getNode`, so any id typo crashes the
DAG at init.

> **MULT_FACTS is PREPENDED** to `ADD_UNLIKE_COPRIME.prereqs` and
> `SIMPLIFY.prereqs` (not appended) so the original fraction prereq stays LAST —
> a load-bearing ordering constraint tied to `credit.ts:97`. See gotchas.md.

---

## Supporting/internal data shapes (engine-local)

These are engine-local interfaces (not all re-exported via `index.ts`) that
other engine-core modules and the runtime/harness consume:

- **`SeedPriors`** (`log.ts`): `{ [nodeId]: number }` — cold-start P_known seeds
  from migration. `MASTERED_SEED_PRIOR = 0.80`, `DEFAULT_SEED_PRIOR = 0.10`.
- **`CreditUpdate`** (`credit.ts`): `{ nodeId, correct, weight }` — `weight` 1.0
  = full binding-node update; `< 1.0` = discounted prereq update.
- **`ProbeSchedule`** (`decay.ts`): `{ nodeId, dueAt, probeIndex }`.
  `ProbeResult`: `{ correct, now }`.
- **`PolicyState`** (`policy.ts`): the full lesson/world state the runtime
  maintains for `nextDecision` — `currentNodeId`, `currentScaffold`,
  `stumpingRecipe`, `inKitchen`, `sessionMaxScaffoldPassed`, `consecutiveErrors`,
  `consecutiveCleanCorrects`, `pendingTransferProbe`, `pKnownHistory[]`,
  `heavyHintAtFloorCount`, `disengagedCount`.
- **`RecentBehavior`** (`policy.ts`): `{ observations[], isDisengaged }`.
- **`RecipeShape`** (`wall.ts`): minimal mirror of a `momsProblems.js` question —
  `{ op, operands?, target?, requireSimplified? }` where `op` ∈
  `'add'|'sub'|'simplify'|'add-then-simplify'|'improper'|'add-then-mixed'`. The
  engine encodes the skill-inference rules over this shape rather than importing
  the live `momsProblems.js` (purity).
- **`WallDetectionResult`** (`wall.ts`):
  `{ wallHit, predictedSuccess, triggeredByFailure, bindingNode }`.
- **`MasteryEstimate` map**: `measurementReduce` returns
  `{ mastery: Record<nodeId, MasteryEstimate> }` — the top-level engine output.
- **`LatencyBaseline`** (`observe/baseline.ts`):
  `{ n, ewmaMs, varMs2, established }` — per-child latency model.
- **`ObservedSignal`** (`observe/index.ts`):
  `{ signal: Signal, observeOnly: boolean, attemptIndex: number }`.

> The overall data-flow diagram (Event → log → measurementReduce →
> MasteryEstimate → policy Decision → practiceFlow) is synthesis-owned; this
> slice documents only the DTO shapes that flow through it.
