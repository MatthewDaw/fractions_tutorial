# data-model — shell-nav fragment

The data shapes owned by the shell/nav slice: the room registry, the strands, the
settings record, the CCSS/standards/denominator reference data, the concept-tree
shape, and the intro cue-sheet shape. Engine wire DTOs (MasteryEstimate, SkillNode,
Event) are owned by engine-core and referenced here by pointer. The overall
log→reduce→decision data-flow diagram is synthesis-owned.

---

## Room registry — `rooms.js`

### `ROOMS: Room[]`

The map's source of truth. Array ORDER = teaching/display sequence.

```
Room = {
  id: string,            // STABLE historical room id: m1 m3 nl r1 s1 cmp r3 r2 r4 r5
  nodeId: string,        // engine SkillNode id (graph.ts) — 1:1 with the room (KTD11)
  no: number,            // displayed lesson number (1..10), follows CCSS curriculum order
  title: string,         // e.g. "Same Denominators"
  concept: string,       // one-line description shown on the card / concept map
  built: boolean,        // true → real lesson screen; false → EmptyRoom
  pos: { x: number, y: number }, // node centre in 1280×800 stage space (card is centre-anchored)
  intro: string,         // intro video URL under /intros/*.html (all 10 rooms have one)
  introDurationMs: number, // timer length for the intro end card (20000–28000)
  verb: string,          // example label, e.g. "Adding" / "Simplifying"
  example: string,       // e.g. "2/7 + 3/7"
}
```

The 10 rows (id → nodeId → no):
`m1`→MULT_EQUAL_GROUPS(1), `m3`→MULT_FACTS(2), `nl`→FRACTION_ON_LINE(3),
`r1`→ADD_SAME_DEN(4), `s1`→SUB_SAME_DEN(5), `cmp`→COMPARE_BENCHMARK(6),
`r3`→ADD_UNLIKE_NESTED(7), `r2`→ADD_UNLIKE_COPRIME(8), `r4`→SIMPLIFY(9),
`r5`→IMPROPER_TO_MIXED(10).

> Invariant: room `id` (and its component/intro) is STABLE; only `no`/order/`pos`
> reflect curriculum. `nodeId` maps the room to its engine node (engine-core owns the
> node shape). A flow test asserts `r1.pos`, which is why per-room `pos` is retained
> even though the two-level map computes the submenu row positions dynamically.

### `STRANDS: Strand[]` — the map's top level

```
Strand = {
  id: string,        // "found" | "build" | "combine"
  title: string,     // shelf title
  blurb: string,     // shelf subtitle
  lessons: string[], // room ids in teaching order
  pos: { x, y },      // shelf-node centre in 1280×800 space
}
```
Grouping is CONTIGUOUS in curriculum order so the recipe trail reads as one 1→10
sequence: `found`=[m1,m3], `build`=[nl,r1,s1,cmp], `combine`=[r3,r2,r4,r5].

### `KITCHEN = { title: "Babushka's Kitchen" }` and `CENTER = { x: 640, y: 420 }`
The central kitchen medallion (opens `mom`) and the stage centre the trails radiate from.

---

## Settings record — `settings.js` (`bf_settings_v1`)

```
Settings = {
  voiceVol: number,   // 0..100, integer (clamped)
  musicVol: number,   // 0..100, integer (0 = muted)
  inputMode: "stylus" | "typing",
}
SETTINGS_DEFAULTS = { voiceVol: 80, musicVol: 55, inputMode: "stylus" }
```
- `inputMode` defaults to `"stylus"` (handwriting-first pedagogy); `"typing"` is the
  opt-in for stylus-less devices.
- Normalization: volumes are `Math.round(Number(v))` clamped to [0,100] (NaN→0);
  `inputMode` coerces anything but `"typing"` to `"stylus"`.
- Stored as one JSON object; module holds an in-memory `state` + a `Set` of
  subscribers. See env-and-config fragment for the localStorage key + legacy migration.

---

## CCSS reference data

### `ccss.js`
- `CCSS_DENOMINATORS = [2, 3, 4, 5, 6, 8, 10, 12, 100]` — the grade-3–5 in-grade set
  (never 7 or 9; constitution §5.6).
- `isInGrade(d)` → boolean; `filterBankInGrade(bank, keys=["aDen","bDen"])` filters a
  problem bank to in-grade denominators.

### `ccssStandards.js` — `NODE_STANDARDS`
Map of every engine node id → `{ grade: "3"|"4"|"5", codes: string[] }` (CCSS codes,
e.g. `ADD_SAME_DEN`→`{grade:"4", codes:["4.NF.B.3a"]}`). `standardsForRoom(roomId)`
resolves a room id → its node's standards. Codes are reference labels only — NEVER
used to group or gate (the concept map is grade-free).

### `denominatorColors.js`
- `DENOMINATOR_COLORS`: per-denominator `{ hue, pattern, name }` for d ∈
  {2,3,4,5,6,7,8,9,10,12} — the colorblind-safe palette where a piece is colored by
  its DENOMINATOR (same size = same color). Each denominator also owns a distinct
  hatch pattern (color is never the sole channel).
- `ROLE_COLORS`: semantic roles `{ ghost, correct, incorrect, childInk }`.
- Helpers: `denomInfo/denomColor/denomName` (FALLBACK for out-of-range d),
  `denomTextColor` (WCAG-contrast pick of ink vs paper), `denomTone(d, alpha)`,
  `denomHatch(d)` (CSS `background-image`), `denomHatchSize(d)`.

---

## Concept-tree shapes — `conceptTree.js`

### `CONCEPTS` (static)
Ordered list of high-level concepts, each `{ id, title, blurb, nodes: nodeId[] }`,
grouping engine node ids by idea (grade-free). Concepts: `multiplication`,
`fraction-as-number`, `add-subtract`, `compare-estimate`, `equivalence`,
`mixed-numbers`. Any node not claimed lands in a synthetic `More` bucket (nothing is
silently dropped).

### `buildConceptTree()` → tree
```
tree = { concepts: Concept[], live: boolean, titleById: Record<nodeId, title> }
Concept = { kind:"concept", id, title, blurb, mastery, children: Node[] }
Node    = { kind:"node", id, roomId, title, no, concept, example, verb,
            prereqs: nodeId[], codes: string[], mastery, cards: Card[] }
Card    = { kind:"card", id, formId, level: 0..4, isTransfer: boolean, mastery }
```
- Atomic cards are built from the engine `SkillNode.scaffold_ladder` rungs (one card
  per form, `level` = rung index) plus any `transfer_forms` not already in the ladder
  (level 4, `isTransfer`). Mastery is the only MEASURED grain; concept/node mastery is
  the rolled-up average of leaf cards (`rollup` / `collectLeafMastery`).
- `level` names: `["Visual","Guided","Partial","Bare","Transfer"]` (`levelName`).

### Mastery seam — `getMastery(key, nodeId)` → number in [0,1]
- LIVE path: when an engine log exists, a card inherits its node's BKT `P_known`
  (the finest live signal today). A per-form belief lookup could replace this with no
  other change.
- PLACEHOLDER path: deterministic FNV-style hash of the card id → [0.08, 0.97], so the
  viz is fully populated and stable when there is no log.
- `isLiveMastery()` reports whether the last build used live data.
- `_liveNodeMastery` is loaded via `loadLog()` → `measurementReduce(log, Date.now(), {})`
  (Date.now injected at the React boundary; pointer: engine-core for the fold).

---

## Intro cue-sheet shape — `intro*.js` (10 files)

Each per-room cue sheet exports:
```
STAGE_PERSIST_KEY: string   // e.g. "samesize.v2" — the iframe <Stage> writes its
                            // playhead to localStorage[STAGE_PERSIST_KEY + ":t"]
INTRO_DURATION: number      // seconds (informational; RoomIntro uses room.introDurationMs)
INTRO_CUES: Cue[]
Cue = {
  gate: number,   // seconds — the animation beat the line narrates (matches the html caption)
  pause: number,  // seconds — required breath AFTER the previous line finishes
  key: string,    // pre-baked clip key → public/voice/<key>.mp3
  text: string,   // transcript line == the exact words the clip speaks
}
```
RoomIntro maps room id → `{ cues, persistKey }` (the `INTROS` table). The clip
`key`s + `text` are stable so baked mp3s are reused across timeline edits.

---

## Mastery facade shapes — `kitchenProgress.js`

Reads engine `MasteryEstimate` (engine-core) and exposes UI-facing derivations:
- `masteryStatusFor(nodeId, masteryMap)` → `'not-started' | 'in-progress' |
  'mastered' | 'needs-review'`. Rules: `isMastered(est)`→mastered; else
  `mastered_at != null`→needs-review (lapsed after a failed probe); else
  `P_known ≤ 0.15`→not-started; else in-progress.
- `suggestedNextRoom(masteryMap)` → room id via `mostUpstreamUnmastered`.
- `entryScaffoldFor(nodeId, masteryMap)` → design level 0..4 (= `max_scaffold_passed
  - 1`, floored at 0; 0 when no evidence).
- `eligibleMixSkills(masteryMap)` → node ids that have a generator AND are
  "introduced" (mastered, previously mastered, or `P_known ≥ 0.25`).
- `dueProbes(masteryMap, now)` → mastered node ids whose `now - (last_retention_probe
  ?? mastered_at) ≥ PROBE_DELAYS_MS[0]`.
- `loadMastered()` → `string[]` room ids (engine-derived, legacy fallback).

See the env-and-config fragment for the localStorage keys these read/write.
