# Data model

The data shapes that flow through the app: the engine wire DTOs + skill graph
(engine-core), and the shell/nav registries, settings record, CCSS reference data,
concept-tree, intro cue-sheets, and mastery facade (shell-nav). It opens with the
cross-cutting **DATA-FLOW** (synthesis-owned). See `diagrams/data-model.mmd` for the
ER view and `diagrams/key-flows.mmd` for the sequence companion.

---

## DATA-FLOW (synthesis-owned)

The whole adaptive loop is a single pipeline from a logged **Action/Signal** to the
next problem and the on-screen surfaces. Time enters only at the React boundary
(`Date.now()`); the engine portion is replayable.

```
  child interaction (lessons-rooms)
        │  emit(Action) / observe → Signal
        ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Append-only Event log  (engine/log.ts, localStorage "moms-engine-log-v1")    │
  │  Event = Action | Signal   (Signal carries `confidence`; logged but never     │
  │                             projected to mastery — the firewall)              │
  └─────────────────────────────────────────────────────────────────────────────┘
        │  measurementReduce(log, now, seedPriors)      ← boundary-only (R16)
        ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  segment → Observation[]  →  credit assign  →  BKT + dimensions  →  assemble   │
  │  →  retention-probe decay folding                                             │
  └─────────────────────────────────────────────────────────────────────────────┘
        │  Record<nodeId, MasteryEstimate>
        ▼
  gate.isMastered(est)  (READ only — no DeclareMastered)        policy.nextDecision(state, mastery, recentBehavior, now)
        │                                                              │
        │                                                              ▼
        │                                                       Decision  (7 kinds)
        │                                                              │
        ▼                                                              ▼
  WorldMap / ConceptMap badges                            practiceFlow.nextPractice(decision, state)
  (kitchenProgress facade)                                              │
                                                                        ▼
                                                            generateFor(skill, spec) → next problem
                                                                        │
                              engineStore.publishDecision(decision, mastery, t) ─▶ EngineSurfaces
                              (rationale banner · mastery inspector · nudge toast)
```

The advisory affect pipeline runs in parallel: `observeBehavior(log)` → `Signal[]` →
`composeAffect` → an advisory tier + `AffectState` that fills only
`recentBehavior.isDisengaged` — it NEVER produces a `MasteryEstimate` and has no path
into `gate.ts` (constitution §5.2). See `design.md` for the per-module mechanics and
`adrs/0002-advisory-affect-firewall.md` for the boundary.

---

# Engine wire DTOs and skill graph (engine-core)

The engine's public types are **wire DTOs**: every type re-exported from
`web/src/engine/index.ts` is shaped so the engine could relocate behind a Python
FastAPI backend with only a `fetch` swap (constitution §5.8). All types are authored
in TypeScript under `web/src/engine/types.ts`.

> Affect firewall (constitution §5.2): the only affect field in any DTO is
> `Observation.affect_window`, a typed empty-array stub. No DTO carries a
> valence/emotion field, and `gate.ts`/`mastery.ts` never read `affect_window`.

## Public surface — `index.ts`

`index.ts` re-exports ONLY (no logic of its own):
- **Types** (from `types.js`): `Modality`, `Actor`, `ScaffoldLevel`, `Action`,
  `Signal`, `Event`, `ErrorSignature`, `Observation`, `FluencyStats`,
  `MasteryEstimate`, `Decision` plus the 7 per-kind `Decision*` interfaces, `SkillNode`.
- **Params** (from `params.js`): value `PARAMS`; types `EngineParams`, `BktParams`,
  `EscalationParams`.
- **Graph** (from `graph.js`): `getNode`, `prereqsOf`, `allNodes`,
  `mostUpstreamUnmastered`, and node constants `MULT_EQUAL_GROUPS`, `MULT_FACTS`,
  `ADD_SAME_DEN`, `ADD_UNLIKE_NESTED`, `ADD_UNLIKE_COPRIME`, `SIMPLIFY`,
  `IMPROPER_TO_MIXED`. (`FRACTION_ON_LINE`, `SUB_SAME_DEN`, `COMPARE_BENCHMARK` are
  exported by `graph.ts` but NOT re-exported through `index.ts` — import those three
  from `./engine/graph.js` directly.)
- **Log** (from `log.js`): `appendEvent`, `foldLog`, `loadLog`, `saveLog`,
  `migrateFromKitchenProgress`; type `SeedPriors`.

The deeper algorithm modules are NOT funnelled through `index.ts`; callers import them
by explicit `.js`-specifier path (resolved to `.ts` by `resolveTsFromJs`).

## Primitive enumerations (`types.ts`)

| Type | Definition | Notes |
|---|---|---|
| `Modality` | `'tap' \| 'type' \| 'handwriting' \| 'voice'` | answer-input channel |
| `Actor` | `'human' \| \`synthetic:${string}\`` | `human` = real child; `synthetic:<persona>` = harness persona |
| `ScaffoldLevel` | `0 \| 1 \| 2 \| 3 \| 4` | L0 = max support → L4 = independent |

## Events (append-only log entries)

`Event = Action | Signal` — the only entries in the engine log.

### `Action`
| Field | Type | Meaning |
|---|---|---|
| `type` | `string` | open string (`problem_present`, `answer_submit`, `judged`, `hint_shown`, `piece_place`, `retention_probe`) |
| `payload` | `Record<string, unknown>` | type-specific data |
| `modality` | `Modality` | input channel |
| `t` | `number` | injected ms-epoch timestamp — **no wall-clock inside the engine** |
| `actor` | `Actor` | who produced it |

### `Signal`
Same as `Action` but with `confidence: number` (∈[0,1]) instead of `modality`. The
presence/absence of `confidence` is the structural discriminant (`'confidence' in
ev`). A `Signal` is inert telemetry: logged but no mastery projection reads it
(firewall).

> Action `type` strings the engine keys on (open set, load-bearing):
> `problem_present`, `answer_submit`, `judged`, `hint_shown` (payload `rung`),
> `retention_probe` (payload `node_id`/`correct`/`probe_t`), the manipulation pairs
> `piece_place|piece_add` / `piece_remove|piece_lift` (self-correction counting), plus
> the wider work/remove vocab in `observe/detectors.ts`.

#### `problem_present` / `judged` payload keys read by the engine
- `problem_present.payload`: `node_id` (binds the attempt to a skill),
  `scaffold_level` (0–4), `problem_id`, `surface_form`, optionally `p_known`/`P_known`.
- `judged.payload`: `correct` (=== true), `answer_num`+`answer_den` OR `answer_value:
  [n,d]`, `error_signature` (preferred), `slip`, `target_num`, `target_den`,
  `operands`, `hint_max_rung`, `problem_id`, `surface_form`.

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

This is the credit-assignment key: only these seven values may key the implication
map, so `observation.ts` coerces any unknown emitted signature string to `'other'`.

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
| `recognizer_confidence` | `number \| null` | ∈[0,1] when handwriting (default 0.5 if unrecorded), else null |
| `too_fast_correct` | `boolean` | correct AND `latency < PARAMS.latencyFloorMs` |
| `problem_id?` | `string` | stable id (emission seam); used by `isIndependent` |
| `surface_form?` | `string` | structural form key; used by `hasTransferred` |
| `affect_window` | `readonly never[]` | **always `[]`** — typed firewall stub / future MediaPipe seam |

`problem_id`/`surface_form` are optional so pre-seam observations typecheck; when
absent the dimension checks fall back to `answer_value`-derived proxies.

## `FluencyStats`

| Field | Type | Meaning |
|---|---|---|
| `median_latency` | `number \| null` | median over last N corrects; null if N < `fluencyMinN` (5) |
| `slope` | `number \| null` | least-squares latency slope (ms/attempt); null if N < min |
| `n` | `number` | number of correct attempts used |

## `MasteryEstimate` — per-node knowledge state (R8, stable public interface)

| Field | Type | Meaning |
|---|---|---|
| `P_known` | `number` | BKT posterior ∈ `pKnownClamp` = [0.01, 0.99] |
| `fluency_stats` | `FluencyStats` | speed sub-measure (soft gate pre-calibration) |
| `max_scaffold_passed` | `ScaffoldLevel \| null` | highest level answered correctly hint-free |
| `transfer_passed` | `boolean` | ≥2 correct on ≥2 distinct surface forms, hint-free, low scaffold, in-band |
| `hint_dependence` | `number` | fraction of recent corrects needing rung ≥ 2 |
| `last_retention_probe` | `number \| null` | ms-epoch of most recent probe (injected) |
| `mastered_at` | `number \| null` | ms-epoch the node FIRST passed the gate; persists across a later demoting probe (so a lapsed node still reads "was mastered" / needs-review) |

There is no `mastered` boolean field: mastery is **read only** via
`gate.isMastered(estimate)` (constitution §5.4, R9).

## `Decision` — discriminated union (7 kinds, KTD7; no `DeclareMastered`, R9)

Every variant extends `DecisionBase { rationale: string }` (a non-empty one-line
rationale surfaced to the child and logged — KTD8).

| `kind` | Extra fields | Meaning |
|---|---|---|
| `PresentProblem` | `node`, `scaffold: ScaffoldLevel`, `surface_form` | show next problem |
| `RouteToRoom` | `node` | leave kitchen → strengthen an upstream skill |
| `ReturnToKitchen` | `recipe` | mastered the binding skill → finish the stumping recipe |
| `FadeScaffold` | — | reduce support |
| `RaiseScaffold` | `preserveWork: true` (always) | add support without clearing in-progress work |
| `TransferProbe` | `node` | probe a structurally novel surface form |
| `EscalateToHuman` | `reason: string`, `handoff_packet: string` | hand off to teacher/parent |

There is deliberately **no** `DeclareMastered` variant (R9).

## `SkillNode` — DAG vertex (KTD11)

| Field | Type | Meaning |
|---|---|---|
| `id` | `string` | stable SCREAMING_SNAKE_CASE id |
| `roomId` | `string` | live `rooms.js` room id (`m1 m3 nl r1 s1 cmp r3 r2 r4 r5`) |
| `prereqs` | `readonly string[]` | prerequisite node ids ([] = DAG root). **Order is load-bearing — see gotchas / credit.** |
| `scaffold_ladder` | `readonly (readonly string[])[]` | index = ScaffoldLevel; each entry lists surface-form keys (5 entries L0–L4) |
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

`getNode(id)` THROWS on an unknown id, and `prereqsOf` maps every prereq through
`getNode`, so any id typo crashes the DAG at init.

> **MULT_FACTS is PREPENDED** to `ADD_UNLIKE_COPRIME.prereqs` and `SIMPLIFY.prereqs`
> (not appended) so the original fraction prereq stays LAST — a load-bearing ordering
> constraint tied to `credit.ts:97`. See `gotchas.md` and
> `adrs/0005-prereq-prepend-credit-constraint.md`.

## Supporting/internal data shapes (engine-local)

- **`SeedPriors`** (`log.ts`): `{ [nodeId]: number }`. `MASTERED_SEED_PRIOR = 0.80`,
  `DEFAULT_SEED_PRIOR = 0.10`.
- **`CreditUpdate`** (`credit.ts`): `{ nodeId, correct, weight }` — `weight` 1.0 =
  full binding-node update; `< 1.0` = discounted prereq update.
- **`ProbeSchedule`** (`decay.ts`): `{ nodeId, dueAt, probeIndex }`. `ProbeResult`:
  `{ correct, now }`.
- **`PolicyState`** (`policy.ts`): `currentNodeId`, `currentScaffold`,
  `stumpingRecipe`, `inKitchen`, `sessionMaxScaffoldPassed`, `consecutiveErrors`,
  `consecutiveCleanCorrects`, `pendingTransferProbe`, `pKnownHistory[]`,
  `heavyHintAtFloorCount`, `disengagedCount`.
- **`RecentBehavior`** (`policy.ts`): `{ observations[], isDisengaged }`.
- **`RecipeShape`** (`wall.ts`): `{ op, operands?, target?, requireSimplified? }` where
  `op` ∈ `'add'|'sub'|'simplify'|'add-then-simplify'|'improper'|'add-then-mixed'`.
- **`WallDetectionResult`** (`wall.ts`): `{ wallHit, predictedSuccess,
  triggeredByFailure, bindingNode }`.
- **`LatencyBaseline`** (`observe/baseline.ts`): `{ n, ewmaMs, varMs2, established }`.
- **`ObservedSignal`** (`observe/index.ts`): `{ signal: Signal, observeOnly: boolean,
  attemptIndex: number }`.

---

# Shell / nav data shapes (shell-nav)

The data shapes owned by the shell/nav slice: room registry, strands, settings
record, CCSS/standards/denominator reference data, the concept-tree shape, intro
cue-sheets, and the mastery facade. Engine wire DTOs are referenced by pointer above.

## Room registry — `rooms.js`

### `ROOMS: Room[]` — the map's source of truth (array ORDER = teaching/display sequence)

```
Room = {
  id: string,            // STABLE historical room id: m1 m3 nl r1 s1 cmp r3 r2 r4 r5
  nodeId: string,        // engine SkillNode id — 1:1 with the room (KTD11)
  no: number,            // displayed lesson number (1..10), CCSS curriculum order
  title: string,         // e.g. "Same Denominators"
  concept: string,       // one-line description on the card / concept map
  built: boolean,        // true → real lesson screen; false → EmptyRoom
  pos: { x: number, y: number }, // node centre in 1280×800 stage space
  intro: string,         // intro video URL under /intros/*.html (all 10 have one)
  introDurationMs: number, // timer length for the intro end card (20000–28000)
  verb: string,          // example label, e.g. "Adding"
  example: string,       // e.g. "2/7 + 3/7"
}
```

The 10 rows (id → nodeId → no): `m1`→MULT_EQUAL_GROUPS(1), `m3`→MULT_FACTS(2),
`nl`→FRACTION_ON_LINE(3), `r1`→ADD_SAME_DEN(4), `s1`→SUB_SAME_DEN(5),
`cmp`→COMPARE_BENCHMARK(6), `r3`→ADD_UNLIKE_NESTED(7), `r2`→ADD_UNLIKE_COPRIME(8),
`r4`→SIMPLIFY(9), `r5`→IMPROPER_TO_MIXED(10).

> Invariant: room `id` (and its component/intro) is STABLE; only `no`/order/`pos`
> reflect curriculum. A flow test asserts `r1.pos`, which is why per-room `pos` is
> retained even though the two-level map computes submenu positions dynamically.

### `STRANDS: Strand[]` — the map's top level

```
Strand = { id, title, blurb, lessons: string[], pos: { x, y } }
```
Grouping is CONTIGUOUS in curriculum order so the recipe trail reads as one 1→10
sequence: `found`=[m1,m3], `build`=[nl,r1,s1,cmp], `combine`=[r3,r2,r4,r5].
`KITCHEN = { title: "Babushka's Kitchen" }`, `CENTER = { x: 640, y: 420 }`.

## Settings record — `settings.js` (`bf_settings_v1`)

```
Settings = { voiceVol: number (0..100), musicVol: number (0..100, 0=muted),
             inputMode: "stylus" | "typing" }
SETTINGS_DEFAULTS = { voiceVol: 80, musicVol: 55, inputMode: "stylus" }
```
`inputMode` defaults to `"stylus"` (handwriting-first pedagogy). Normalization:
volumes `Math.round(Number(v))` clamped to [0,100] (NaN→0); `inputMode` coerces
anything but `"typing"` to `"stylus"`. Stored as one JSON object; module holds an
in-memory `state` + a `Set` of subscribers.

## CCSS reference data

- **`ccss.js`**: `CCSS_DENOMINATORS = [2, 3, 4, 5, 6, 8, 10, 12, 100]` (never 7 or 9;
  constitution §5.6); `isInGrade(d)`; `filterBankInGrade(bank, keys=["aDen","bDen"])`.
- **`ccssStandards.js`**: `NODE_STANDARDS` maps every node id → `{ grade, codes }`
  (e.g. `ADD_SAME_DEN`→`{grade:"4", codes:["4.NF.B.3a"]}`). `standardsForRoom(roomId)`.
  Codes are reference labels only — NEVER used to group or gate.
- **`denominatorColors.js`**: `DENOMINATOR_COLORS` per-denominator `{hue, pattern,
  name}` for d ∈ {2,3,4,5,6,7,8,9,10,12} — colorblind-safe (each denominator owns a
  distinct hatch pattern; color is never the sole channel). `ROLE_COLORS`
  `{ghost, correct, incorrect, childInk}`; helpers `denomInfo/denomColor/denomName`,
  `denomTextColor` (WCAG), `denomTone`, `denomHatch`, `denomHatchSize`.

## Concept-tree shapes — `conceptTree.js`

`CONCEPTS` (static): ordered `{ id, title, blurb, nodes: nodeId[] }`, grouping node ids
by idea (grade-free): `multiplication`, `fraction-as-number`, `add-subtract`,
`compare-estimate`, `equivalence`, `mixed-numbers`. Unclaimed nodes land in a synthetic
`More` bucket.

`buildConceptTree()`:
```
tree = { concepts: Concept[], live: boolean, titleById: Record<nodeId, title> }
Concept = { kind:"concept", id, title, blurb, mastery, children: Node[] }
Node    = { kind:"node", id, roomId, title, no, concept, example, verb,
            prereqs: nodeId[], codes: string[], mastery, cards: Card[] }
Card    = { kind:"card", id, formId, level: 0..4, isTransfer: boolean, mastery }
```
Atomic cards are built from `SkillNode.scaffold_ladder` rungs (one card per form,
`level` = rung index) plus any `transfer_forms` not already in the ladder (level 4,
`isTransfer`). Mastery is the only MEASURED grain; concept/node mastery is the
rolled-up average (`rollup`/`collectLeafMastery`). `level` names:
`["Visual","Guided","Partial","Bare","Transfer"]`.

**Mastery seam — `getMastery(key, nodeId)` → number in [0,1]:** LIVE (card inherits its
node's BKT `P_known`) or PLACEHOLDER (deterministic FNV-style hash → [0.08, 0.97]).
`isLiveMastery()` reports which path the last build used. `_liveNodeMastery` is loaded
via `loadLog()` → `measurementReduce(log, Date.now(), {})`.

## Intro cue-sheet shape — `intro*.js` (10 files)

```
STAGE_PERSIST_KEY: string   // e.g. "samesize.v2"; iframe <Stage> writes playhead to localStorage[KEY + ":t"]
INTRO_DURATION: number      // seconds (informational; RoomIntro uses room.introDurationMs)
INTRO_CUES: Cue[]
Cue = { gate: number, pause: number, key: string, text: string }
```
RoomIntro maps room id → `{ cues, persistKey }` (the `INTROS` table). Clip `key`s +
`text` are stable so baked mp3s are reused across timeline edits.

## Mastery facade shapes — `kitchenProgress.js`

Reads engine `MasteryEstimate` and exposes UI-facing derivations:
- `masteryStatusFor(nodeId, masteryMap)` → `'not-started' | 'in-progress' |
  'mastered' | 'needs-review'`. Rules: `isMastered`→mastered; else `mastered_at !=
  null`→needs-review (lapsed); else `P_known ≤ 0.15`→not-started; else in-progress.
- `suggestedNextRoom(masteryMap)` → room id via `mostUpstreamUnmastered`.
- `entryScaffoldFor(nodeId, masteryMap)` → design level 0..4 (= `max_scaffold_passed -
  1`, floored at 0; 0 when no evidence).
- `eligibleMixSkills(masteryMap)` → node ids with a generator AND "introduced"
  (mastered, previously mastered, or `P_known ≥ 0.25`).
- `dueProbes(masteryMap, now)` → mastered node ids whose `now - (last_retention_probe
  ?? mastered_at) ≥ PROBE_DELAYS_MS[0]`.
- `loadMastered()` → `string[]` room ids (engine-derived, legacy fallback).
