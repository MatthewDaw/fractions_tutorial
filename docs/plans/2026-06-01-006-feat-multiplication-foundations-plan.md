---
title: "feat: Whole-number multiplication foundations — equal groups, arrays, times facts (3 upstream rooms)"
type: feat
status: draft
date: 2026-06-01
phase: new upstream strand (precedes the five fraction rooms)
origin:
  - pedagogy grounding (equal groups → arrays/area → times-fact fluency)
  - design handoff (3 levels: m1 equal-groups, m2 arrays, m3 facts)
  - two plan reviews (verdicts: concerns / concerns) — blockers + majors resolved inline below
stack: Headless TS engine (web/src/engine/) + React UI; shared Slate/WordProblem/BlockSandbox; HTML intros + introMN.js cue sheets
---

# feat: Whole-Number Multiplication Foundations (m1 Equal Groups → m2 Arrays → m3 Times Facts)

## Summary

Add a **three-room whole-number multiplication strand** upstream of the existing fraction
curriculum, in the pedagogically correct dependency order: **equal groups** (what multiplication
*means* — `a` groups of `b`, via the repeated-addition bridge) → **arrays / area model** (rows ×
columns, making **commutativity** and **distributivity** visible) → **times facts** (skip-count →
fluent single-digit recall). Each room is a single self-contained React lesson component that walks
the **same scaffold-fade arc** the five fraction rooms use (Manipulate → Bind → Fade → Workbench →
Numbers → Applied → Words), wires to the engine through `useLessonEngine`, and themes everything as
Babushka's Soviet/old-Russian kitchen (plates of pelmeni, baking trays, skip-counting jars).

The strand sits **strictly upstream** of the fraction DAG, but only **two** fraction skills actually
depend on it: `ADD_UNLIKE_COPRIME` (r2, cross-multiply computes single-digit products) and
`SIMPLIFY` (r4, recognizes common single-digit factors). It does **not** gate `ADD_SAME_DEN` (r1) —
a child can add same-denominator fractions with no multiplication at all. The dependency is wired
through the **fluency** node only (`MULT_FACTS`), not through equal-groups or arrays.

This is ~3 rooms × [lesson component + bespoke manipulative + room CSS + intro HTML + intro cue
sheet], plus the engine/rooms/scaffoldMap/Shell wiring and an optional kitchen word-problem-bank
mirror. The engine is fraction-shaped (`answer_value: [num, den]`, a closed fraction-only
`ErrorSignature` union); we ship v1 carrying whole-number products as `[product, 1]` with all
multiplication misconceptions mapped to `'other'`, and schedule the union extension as a **required
fast-follow** (not optional) so the strand eventually gets error-specific remediation.

## Resolved review blockers / majors (read first)

These were raised by the two plan reviews and are **resolved in this plan** by adjusting the design.
Minors are listed under [Open questions / follow-ups](#open-questions--follow-ups).

- **R-B1 (blocker) — node-id consistency.** The handoff named the arrays node three ways
  (`MULT_ARRAYS`, `MULT_ARRAYS_AREA`, `MULT_ARRAY_AREA`). `getNode()` throws on an unknown id and
  `prereqsOf` maps every prereq through `getNode`, so any mismatch crashes the DAG at init.
  **Resolution: the canonical ids are `MULT_EQUAL_GROUPS`, `MULT_ARRAYS`, `MULT_FACTS`** (the arrays
  node is `MULT_ARRAYS`, matching its only real `engineNode.id` field). `MULT_FACTS.prereqs =
  ['MULT_ARRAYS']`. All `MULT_ARRAY_AREA` / `MULT_ARRAYS_AREA` references are dropped. Room ids are
  `m1` / `m2` / `m3`.

- **R-B2 (major→resolved) — credit.ts prereq ordering regression.** `credit.ts`
  `resolveImplicatedPrereq` handles `add_across_unlike` by taking
  `bindingNode.prereqs[prereqs.length - 1]` — the **LAST** prereq — and docking it. If `MULT_FACTS`
  were *appended* to `ADD_UNLIKE_COPRIME.prereqs`, a straight-across fraction error would wrongly
  dock multiplication fluency instead of the direct fraction prereq. **Resolution: prepend, never
  append.** The new prereqs become `ADD_UNLIKE_COPRIME.prereqs = ['MULT_FACTS','ADD_UNLIKE_NESTED']`
  and `SIMPLIFY.prereqs = ['MULT_FACTS','ADD_UNLIKE_COPRIME']` — the original fraction prereq stays
  **last**, so `prereqs[last]` still resolves to the fraction prereq and `credit.ts` needs **no
  edit**. This ordering is a **required constraint**, documented in graph.ts comments.

- **R-B3 (major→resolved) — topological order vs. suggestedNextRoom hijack.** `suggestedNextRoom`
  returns `allNodes()[0].roomId` for a fresh learner (verified in `kitchenProgress.js:147–161`), and
  `mostUpstreamUnmastered` walks `ALL_NODES` front-to-back. Inserting the mult trio at index 0 would
  route **every brand-new child to m1 first**, even to add same-denominator fractions — contradicting
  the "r1 reachable without multiplication" intent. **Resolution: this is a deliberate
  curriculum decision — multiplication foundations come first.** A learner with no math foundation
  should establish what multiplication means before fractions; r1 remains *reachable* (any `#/r1`
  route works, the WorldMap shows all rooms), it is simply not the *default suggestion* for a fresh
  user. We accept multiplication-first as the suggested path and document it. (The alternative —
  teaching `mostUpstreamUnmastered`/`suggestedNextRoom` to skip unmastered nodes with no path to a
  target — is a larger engine change deferred to a follow-up; see O5.)

- **R-B4 (major→resolved) — rooms.js entries incomplete.** The handoff `roomsEntry` objects omit
  `no`, `built`, and `pos`; a room without `built:true` falls through to `EmptyRoom`, and WorldMap
  lays out by `pos`. **Resolution: full entries specified below** with `built:true`, a numbering
  scheme (m1/m2/m3 = displayed lessons 1/2/3; the five fraction rooms renumber to 4–8), and concrete
  non-colliding `pos` coordinates (see [Rooms.js entries](#rooms-js-entries-all-three)).

- **R-B5 (major→resolved) — engine fit for whole-number answers.** `Observation.answer_value` is
  `[number, number] | null` and `ErrorSignature` is a closed fraction-only union (verified
  `types.ts:47–54, 60`). **Resolution (stated identically in all three rooms): v1 carries the product
  as `[product, 1]`** (type-safe; the grader reads `parseInt` of a single Slate slot and never
  interprets `answer_value[1]` as a denominator), and **every** multiplication misconception
  (`add_factors`, `skip_count_drift`, `array_perimeter`, `distributive_add_parts`, x0/x1 slips)
  fingerprints as `'other'`. The `ErrorSignature` union extension is a **required near-term
  fast-follow**, not optional (see O1) — until then the mult rooms get no error-specific routing.

- **R-M1 (minor→resolved) — scaffoldMap key style.** Standardize on **r1-style numeric-prefixed
  keys** (`1-manipulate` … `7-words`) for all three rooms so `parseStageN` works for every stage and
  no string switch is needed. `toScaffoldLevel` uses `{1:0,2:1,3:2,4:1,5:3,6:3,7:4}`;
  `toBeatForLevel` uses `['1-manipulate','2-bind','3-fade','5-numbers','7-words'][level]`. Do **not**
  mix bare `workbench`/`applied` keys.

- **R-M2 (minor→resolved) — Workbench/Applied unreachable via scaffold-entry.** Mirroring r1's
  `toBeatForLevel` (5-element map skipping Workbench and Applied) means an L1 entrant lands on Bind
  and an L3 entrant lands on Numbers — Workbench(L1) and Applied(L3) are reachable only by sequential
  play or the header stage-selector. **Resolution: accept the r1 convention uniformly across
  m1/m2/m3** (Workbench/Applied are optional support rungs; this is fine) and make all three
  `toBeatForLevel` maps **identical in shape**.

- **R-M3 (minor→resolved) — color palette.** `denominatorColors.js` colors by denominator; these are
  whole-number objects. **Resolution (one policy, all three rooms):** pieces use a **fixed neutral
  kitchen food tone**; guard/correct/incorrect states use `ROLE_COLORS` (ghost / `#2a9d8f` /
  `#d1495b`); **`denomTone`/`denomColor` are forbidden** for these objects. Remove the "reuse
  denomTone for bun fill" suggestion from the arrays handoff.

- **R-M4 (minor→resolved) — commutativity progression.** m1 defers commutativity and enforces
  count × size *role* order; m2 introduces it (rotate the tray). This is a correct progression, not a
  contradiction. **Resolution:** m1's Applied setup gate accepts count × size as the *expected* order
  but surfaces a **gentle nudge** on a reversed setup rather than a hard reject (the gate is
  ungraded). Normalize all `roomsEntry.example` strings to bare `N × M`.

- **R-M5 (minor→resolved) — fluency latency floor / `too_fast_correct`.** A fluent child answers a
  single-digit fact very fast — the *goal* of m3 — but the plausible-compute floor (tuned for
  fraction manipulation) may flag fast-correct facts and over-fire `TransferProbe`. **Resolution:**
  v1 accepts the global floor and treats fast-correct on the m3 Numbers rung as fluency evidence; if
  it spams probes in QA, add a per-node latency-floor knob (O4). Documented, not silently inherited.

---

## Goal & scope

**In scope (foundations only):**

1. **m1 — Equal Groups** (`MULT_EQUAL_GROUPS`, prereqs `[]`): `a` groups of `b` via repeated
   addition; the equal-size-group invariant is *enforced*; commutativity deliberately deferred.
2. **m2 — Baking Trays / Arrays** (`MULT_ARRAYS`, prereqs `['MULT_EQUAL_GROUPS']`): rows × columns,
   rotate-for-commutativity, score-for-distributivity (area model).
3. **m3 — Times Facts** (`MULT_FACTS`, prereqs `['MULT_ARRAYS']`): skip-count → fluent recall;
   becomes a prereq of `ADD_UNLIKE_COPRIME` (r2) and `SIMPLIFY` (r4).

**Out of scope:** multi-digit multiplication; a dedicated `multiply` op in `momsProblems.gradeAnswer`
(the rooms grade inline); the `ErrorSignature` union extension (required fast-follow, separate PR);
per-fact-family sub-tracking of the hard 6/7/8/9 cluster (O7); any WorldMap layout-engine change
(positions are hand-assigned).

## Curriculum & skill-DAG placement

The pedagogically-correct order is **enforced as DAG prereqs** and as `ALL_NODES` insertion order:

```
MULT_EQUAL_GROUPS (prereqs: [])
   └─▶ MULT_ARRAYS (prereqs: ['MULT_EQUAL_GROUPS'])
          └─▶ MULT_FACTS (prereqs: ['MULT_ARRAYS'])     ← the fluency layer
                 ├─▶ (added, prepended) ADD_UNLIKE_COPRIME.prereqs = ['MULT_FACTS','ADD_UNLIKE_NESTED']
                 └─▶ (added, prepended) SIMPLIFY.prereqs          = ['MULT_FACTS','ADD_UNLIKE_COPRIME']
```

- The three mult nodes are inserted at the **front** of `ALL_NODES` (index 0–2), before
  `ADD_SAME_DEN`. Order is load-bearing for `mostUpstreamUnmastered` / escalation /
  `suggestedNextRoom` (all walk front-to-back).
- **Only `MULT_FACTS`** gates fraction skills, and **only r2 and r4** — the two that genuinely
  compute products / common factors. `ADD_SAME_DEN` (r1) and `ADD_UNLIKE_NESTED` (r3) keep their
  existing prereqs untouched.
- Per **R-B2**, `MULT_FACTS` is **prepended** to r2's and r4's prereq arrays so the fraction prereq
  stays last and `credit.ts` `add_across_unlike` resolution is unchanged.
- Target room map after the change:

| Route id | Lesson № | Title | Node id | Component | CSS prefix |
|----------|:-------:|------------------|---------------------|-----------|-----------|
| `m1` | 1 | Equal Groups | `MULT_EQUAL_GROUPS` | `AppM1.jsx` | `.m1-*` |
| `m2` | 2 | Baking Trays | `MULT_ARRAYS` | `AppM2.jsx` | `.m2-*` |
| `m3` | 3 | Times Facts | `MULT_FACTS` | `AppM3.jsx` | `.m3-*` |
| `r1` | 4 | Same Denominators | `ADD_SAME_DEN` | `AppR1.jsx` | `.r1-*` |
| `r3` | 5 | Scale One | `ADD_UNLIKE_NESTED` | `LessonUnlikeDen` | shared |
| `r2` | 6 | Cross-Multiply | `ADD_UNLIKE_COPRIME` | `LessonUnlikeDen` | shared |
| `r4` | 7 | Simplify | `SIMPLIFY` | `AppR4.jsx` | `.r4-*` |
| `r5` | 8 | Mixed Numbers | `IMPROPER_TO_MIXED` | `AppR5.jsx` | `.r5-*` |

> Renumbering is **`no` only** (plus the mult rooms' `pos`); room ids/components/intros are stable
> and WorldMap labels from `no`, so no connector chain edits are needed (same property the R2/R3
> split relied on).

---

## Shared conventions (all three rooms)

- **Component signature:** `({ no, title, onBack, onRewatchIntro, initialBeat })` — match AppR4 and
  **actually consume `initialBeat`** the way AppR1 consumes `initialStage` (`STAGES.find` against the
  beat key). Do **not** copy AppR4/R5's `initialBeat` omission (documented wiring gap).
- **Stage shape:** one module-level `STAGES` array, r1-style keys `1-manipulate … 7-words`. Hold
  `useState(stage)`; `goStage(s)` resets **all** per-stage state + `selfCorrectionsRef`, calls
  `stopVoice()`, and emits `problem_present` with `scaffold_level: toScaffoldLevel('mN', stageKey)`.
- **Engine wiring:** `useLessonEngine({ nodeId, lessonConfig: { lessonId: 'mN', initialBeat } })`;
  `judgeAndAdvance` **only** at submit boundaries; `applyEngineDecision` maps
  FadeScaffold→advance / RaiseScaffold→back-one / else advance-on-correct; `useEffect(()=>()=>stopVoice(),[])`.
- **Write channel:** the shared `Slate` with `layout="row"` (single whole-number slot; grader is
  `parseInt(values.product, 10)`). No keyboard path. Manipulative input is plain tap buttons.
- **Answer value:** carry as `[product, 1]` (R-B5). **Setup gate** (Applied) is a single `Slate` row
  capturing `N × M` whose logic lives in the App component — **not** `ExpressionSlate` (that stacks
  fraction Slates and is not a fit).
- **Layout:** the 1280×800 4-fixed-rectangle grid (board / hint rail / equation+Slate+Check+Rosette
  card / Cook+ribbon), room-namespaced `.mN-*` CSS over shared `lesson.css` house classes.
- **Color:** fixed neutral food tone for pieces; `ROLE_COLORS` for guard/correct/incorrect only;
  no `denomTone`/`denomColor` (R-M3).
- **scaffold_ladder ladder maps to the arc** `0,1,2,1,3,3,4` (Manipulate L0 / Bind L1 / Fade L2 /
  Workbench L1 / Numbers L3 / Applied L3 / Words L4).

---

## Level 1 — m1 Equal Groups (`MULT_EQUAL_GROUPS`)

### Engine SkillNode

```ts
// Inserted at INDEX 0 of ALL_NODES (front of the DAG). prereqs [] — DAG root.
const MULT_EQUAL_GROUPS: SkillNode = {
  id: 'MULT_EQUAL_GROUPS',
  roomId: 'm1',
  prereqs: [],
  scaffold_ladder: [
    ['equal_groups_visual'],   // L0
    ['equal_groups_guided'],   // L1
    ['equal_groups_partial'],  // L2
    ['equal_groups_bare'],     // L3
    ['equal_groups_transfer'], // L4
  ],
  transfer_forms: ['equal_groups_bare', 'equal_groups_transfer'], // length 2 → TransferProbe legal
  // bkt_params omitted → global PARAMS.bkt (meaning-level node; fluency tuning lives in MULT_FACTS)
};
```

### rooms.js entry

```js
{ id: "m1", nodeId: "MULT_EQUAL_GROUPS", no: 1, title: "Equal Groups",
  concept: "Same count on every plate — add the group again and again, or multiply.",
  built: true, pos: { x: 150, y: 410 },
  intro: "/intros/m1-equal-groups.html", introDurationMs: 22000,
  verb: "Multiplying", example: "3 × 4" },
```

### Scaffold arc

| Stage (key) | Design L | Manipulative | Child action |
|---|:--:|---|---|
| `1-manipulate` | 0 | Row of N empty **plates** + bowl of identical pelmeni. Equal-group **guard**: a plate at M spills extra back; any plate ≠ the others outlines `ROLE_COLORS` incorrect-red. | Tap pelmeni onto each plate until all N hold M, then fill a plain **count box** (no Slate). `answerReady = all plates == M && tally filled`. |
| `2-bind` | 1 | Filled plates stay; a repeated-addition strip `[_]+[_]+[_]` fades in beneath, one slot per plate. Shared Slate (row). | Write each plate's count into the strip (`4 + 4 + 4`), then the total `12`. `judgeAndAdvance` on total submit. |
| `3-fade` | 2 | Plates dim to `ROLE_COLORS.ghost`; the `4 + 4 + 4` line leads. A **collapse** tap-button gathers the terms toward `3 × 4`. | Collapse to `3 × 4`, write product `12` (Slate row). |
| `4-workbench` | 1 | BlockSandbox-style **scoops-into-bowls** bin (N empty bowls + kasha pot; right group-size + distractor sizes 5 and 3). | Build N bowls each holding the same correct M; Build stays disabled until equal bowls match groups×size. (Optional rung.) |
| `5-numbers` | 3 | Bare `3 × 4 = ?` card; Slate row only; optional collapsed skip-count hint strip. | Write product `12` from the bare expression. |
| `6-applied` | 3 | WordProblem card, numerals shown + **required setup gate** (single Slate row = count × size). Answer Slate disabled until `checkSetup` validates `3 × 4`. | Transcribe `3 × 4` (ungraded gate; reversed order → gentle nudge, not reject per R-M4), then write total `12`. Engine attempt fires on the **answer**. |
| `7-words` | 4 | WordProblem card, **prose only**; optional ungraded scratch Slate that never gates. | Extract count and size unaided, write the product. |

### scaffoldMap.js mapping (m1 branch — identical shape for m2/m3)

```js
// toScaffoldLevel('m1', beat):  parseStageN → {1:0,2:1,3:2,4:1,5:3,6:3,7:4}, default 0
// toBeatForLevel('m1', level):  ['1-manipulate','2-bind','3-fade','5-numbers','7-words'][level] ?? '1-manipulate'
```

### Word-problem bank (m1)

Owners are kid/grandpa/cat; Babushka narrates all (never owns). Captions duplicate
`mr_mom_goal_*` voice lines verbatim.

1. 3 plates × 4 pelmeni each → **12** (kid).
2. 5 bowls × 2 cherries → **10** (kid: "and then some jumped into my mouth").
3. 6 skewers × 3 sausages → **18** (grandpa: "I will guard all eighteen with my life").
4. 4 muffin tins × 6 buns → **24** (Babushka; reuses "a tin holds six").
5. 7 boxes × 1 cupcake → **7**, and × 0 → **0** (cat) — explicit **×1 / ×0 edge cases**.
6. 3 lunchboxes × 2 cookies → **6** (kid).

### Intro concept

`/intros/m1-equal-groups.html` (~22 s) + `introM1.js` (`STAGE_PERSIST_KEY 'equalgroups.v1'`,
`INTRO_CUES[{gate,pause,key:'m1i_*',text}]` synced to the HTML BEATS table), Cook-narrated.
Arc: (1) empty row of 3 plates → (2) 4 pelmeni on plate 1 → (3) **same** 4 on plate 2, "every plate
gets the same" (equal-group invariant as emotional center, inoculates misconception *a*) → (4) plate
3 → (5) `4 + 4 + 4` fades in under the plates, one `+ 4` per plate (binds repeated addition,
inoculates *add-the-factors*, misconception *c*) → (6) collapse to `3 × 4 = 12`. **Never rotates the
plates** (commutativity deferred to m2). Close: "count the groups, not the numbers." Register in
`RoomIntro.jsx INTROS{}` as `m1`.

---

## Level 2 — m2 Baking Trays / Arrays (`MULT_ARRAYS`)

### Engine SkillNode

```ts
// Inserted at INDEX 1 of ALL_NODES (after MULT_EQUAL_GROUPS, before MULT_FACTS).
const MULT_ARRAYS: SkillNode = {
  id: 'MULT_ARRAYS',
  roomId: 'm2',
  prereqs: ['MULT_EQUAL_GROUPS'],
  scaffold_ladder: [
    ['arrays_visual'], ['arrays_guided'], ['arrays_partial'],
    ['arrays_bare'], ['arrays_transfer'],
  ],
  transfer_forms: ['arrays_bare', 'arrays_transfer'],
};
```

### rooms.js entry

```js
{ id: "m2", nodeId: "MULT_ARRAYS", no: 2, title: "Baking Trays",
  concept: "Rows and columns make a rectangle — rows times columns, the same either way.",
  built: true, pos: { x: 360, y: 150 },
  intro: "/intros/m2-baking-trays.html", introDurationMs: 24000,
  verb: "Multiplying", example: "4 × 6" },
```

### Scaffold arc

| Stage (key) | Design L | Manipulative | Child action |
|---|:--:|---|---|
| `1-manipulate` | 0 | Empty 4×6 **baking tray** grid; only **interior** cells tappable (guards perimeter-vs-interior). | Fill the tray with buns, count the filled cells (**24**) into a count box. No writing. |
| `2-bind` | 1 | Full tray + written `4 × 6 = __` (Slate row); a **spin-the-tray** button rotates 90° to 6×4, count unchanged. | Write `4 × 6 = 24`; tap spin to see `6 × 4 = 24` fills the same tray (**commutativity bind**). |
| `3-fade` | 2 | Tray dims to ghost; a **score** line cuts a column (4×6 → 4×4 + 4×2). Partial products lead. | Write the two partial products (`16` and `8`) and sum to `24`, **or** collapse to `4 × 6 = 24` (**distributivity**). Pitfall guard: multiply each part then sum, never add split sizes. |
| `4-workbench` | 1 | **BakingTray-backed** build bin (prompt "Make 4 × 6"; wrong-dimension distractor tray). | Assemble R rows of C; Build disabled until dimensions + total match. (See R-W below — not vanilla BlockSandbox.) |
| `5-numbers` | 3 | Bare `R × C = ?` card; optional decomposition hint (`6×5 = 30` to reach `6×7`). | Write the product (Slate row). |
| `6-applied` | 3 | WordProblem, numerals shown + required setup gate (`R × C`, **either order** since commutativity now holds). | Write the setup, then the answer. Engine attempt on the answer. |
| `7-words` | 4 | WordProblem, prose only; optional ungraded scratch. | Extract rows/columns unaided, write the product. |

### scaffoldMap.js mapping (m2)

Identical shape to m1: `toScaffoldLevel('m2', …) → {1:0,2:1,3:2,4:1,5:3,6:3,7:4}`;
`toBeatForLevel('m2', …) → ['1-manipulate','2-bind','3-fade','5-numbers','7-words'][level]`.

### Word-problem bank (m2)

1. 4 rows × 6 buns → **24** (kid).
2. 5 rows × 8 pelmeni → **40** (grandpa).
3. 3 × 4 muffin tin, turned sideways → **12** (cat; commutativity check, Babushka narrates).
4. 6×7 pryanik cut into 6×5 + 6×2 → **42** (grandpa; distributive cut).
5. 7 rows × 9 cookies → **63** (kid; hard-fact cluster 7×9, nudge suggests splitting the rack).
6. 8 rows × 2 sausages → **16** (cat; meow SFX, Babushka delivers count).

### Intro concept

`/intros/m2-baking-trays.html` (~24 s) + `introM2.js` (`STAGE_PERSIST_KEY 'arrays.v1'`). Beats:
(1) loose buns "too messy to count" → (2) tidied into 4 rows of 6 (array snaps) → (3) count by rows
6,12,18,24 (**bridge back to m1** equal groups) → (4) spin the tray, "4 rows of 6 or 6 rows of 4 —
still 24" (commutativity) → (5) score into 4×4 + 4×2 = 16 + 8 = 24 (distributivity, the takeaway).
Close: "a tray is a rectangle, povaryonok — rows times columns." Register as `m2`.

---

## Level 3 — m3 Times Facts (`MULT_FACTS`)

### Engine SkillNode

```ts
// Inserted at INDEX 2 of ALL_NODES (after MULT_ARRAYS, before ADD_SAME_DEN).
const MULT_FACTS: SkillNode = {
  id: 'MULT_FACTS',
  roomId: 'm3',
  prereqs: ['MULT_ARRAYS'],   // R-B1: NOT 'MULT_ARRAY_AREA'
  scaffold_ladder: [
    ['facts_visual'], ['facts_guided'], ['facts_partial'],
    ['facts_bare'], ['facts_transfer'],
  ],
  transfer_forms: ['facts_bare', 'facts_transfer'],
};
// THEN (R-B2 — prepend so fraction prereq stays last for credit.ts):
//   ADD_UNLIKE_COPRIME.prereqs = ['MULT_FACTS', 'ADD_UNLIKE_NESTED'];
//   SIMPLIFY.prereqs           = ['MULT_FACTS', 'ADD_UNLIKE_COPRIME'];
```

### rooms.js entry

```js
{ id: "m3", nodeId: "MULT_FACTS", no: 3, title: "Times Facts",
  concept: "Skip-count the jar to the answer, then know it by heart.",
  built: true, pos: { x: 640, y: 120 },
  intro: "/intros/m3-times-facts.html", introDurationMs: 24000,
  verb: "Multiplying", example: "7 × 8" },
```

### Scaffold arc

| Stage (key) | Design L | Manipulative | Child action |
|---|:--:|---|---|
| `1-manipulate` | 0 | **SkipJar**: empty jar + scoop bowl; each handful (= group size, e.g. 8) bumps a **visible running tally** (8,16,24…) — the anti-drift device. | Tap the scoop N times (7 handfuls), read the total off the jar into a count box. |
| `2-bind` | 1 | Jar + a written skip-count ribbon (8,16,…,56) + `7 × 8 = __`; earlier terms pre-printed, final blank. | Drop handfuls, then write the final product `56` (Slate row). |
| `3-fade` | 2 | Jar dims to ghost; a **SkipLine** number-line ladle leads, two interior terms missing (8,16,_,32,_,48,56). | Fill the missing terms (24,40), then write the product. |
| `4-workbench` | 1 | BlockSandbox-style derived-fact bench (build "7 groups of 8"; optional split line for `7×8 = 7×5 + 7×3`). | Build the groups, optionally split to a known fact pair, enter the product. |
| `5-numbers` | 3 | Bare `7 × 8 = __` card; optional rotate chip → `8 × 7`. Includes explicit **×0 / ×1** prompts. | Write the product from recall (the fluency target; retention/decay matters most here). |
| `6-applied` | 3 | WordProblem, numerals shown + required setup gate (`groups × size`). | Write the setup, then the product. Engine attempt on the answer. |
| `7-words` | 4 | WordProblem, prose only; optional ungraded scratch. | Extract groups/size unaided, write the product. |

### scaffoldMap.js mapping (m3)

Identical shape to m1/m2.

### Word-problem bank (m3)

1. 7 jars × 8 mushrooms → **56** (kid).
2. 6 trays × 9 pelmeni → **54** (grandpa).
3. 4 boxes × 4 cupcakes → **16** (kid).
4. 5 bowls × 3 scoops kasha → **15** (kid).
5. 3 tins × 6 muffins → **18** (cat; meow-only, Babushka carries the count).
6. 7 bundles × 7 sausages → **49** (grandpa).

### Intro concept

`/intros/m3-times-facts.html` (~24 s) + `introM3.js` (`STAGE_PERSIST_KEY 'timesfacts.v1'`). Cook sets
7 empty jars + an 8-per-scoop bowl, drops one handful per jar while a big tally jumps
8,16,24,32,40,48,56 ("counting by eights"), writes `7 × 8 = 56`, states the goal (skip-count gets
you there, a master cook **knows** it by heart), then flashes the hard 6/7/8/9 cluster and one
derived-fact trick (`7×8 = 7×5 + 7×3`, leaning on the m2 tray-split) so a forgotten fact always has a
way back. Register as `m3`. All products spelled in words in voice lines ("seven eights are
fifty-six").

---

## Reuse-vs-new component decisions

**Reused as-is (no build):** `Slate` (layout="row"), `WordProblem` (setup prop + answer-below pattern
for Applied/Words), `Cook`, `Rosette`, `Lock`, `useVoice`. `ExpressionSlate` is **not** a fit
(stacks fraction Slates) — the single-row setup gate lives in the App component.

**New manipulatives (genuinely new, per both reviews):**
- `PlateGroup.jsx` (+ `PlateRow` wrapper) — N plates of 0..M pelmeni, equal-group guard outline
  states (normal / equal-ok / incorrect-red). `BowlGroup` is a prop-variant for the m1 Workbench.
- `BakingTray.jsx` — R×C grid; props `{rows, cols, filled, onFill, onRotate, ghost, dim, scoreAt}`
  serving fill (stage 1), rotate (stage 2), score/cut (stage 3); **interior cells only** tappable.
- `SkipJar.jsx` — jar + side-scale + visible running tally that increments by group size on each
  scoop (anti-drift); props `{groupSize, groups, filled, onScoop, ghost}`.
- `SkipLine.jsx` — number-line ladle of equal hops with blanked terms; props
  `{sequence, blanks[], onFill(index,value)}`.

**Workbench decision (R-W, resolves a review major):** `BlockSandbox`'s `onSolve` contract is
row/target-value 1-D, not a 2-D grid. **m1 and m3** Workbenches can reuse `BlockSandbox` styling
verbatim (linear "N groups of M" build). **m2's** Workbench needs a **BakingTray-backed sandbox
branch** (2-D dimensions + total), not vanilla `BlockSandbox` — plan it as a thin BakingTray-backed
build mode, not a reuse.

**Lesson components:** `AppM1.jsx`, `AppM2.jsx`, `AppM3.jsx` (one self-contained file each, per the
codebase convention).

---

## File-by-file build checklist

**Engine (`web/src/engine/`):**
- [ ] `graph.ts` — define `MULT_EQUAL_GROUPS`, `MULT_ARRAYS`, `MULT_FACTS`; insert at indices 0/1/2
      of `ALL_NODES`; **prepend** `MULT_FACTS` to `ADD_UNLIKE_COPRIME.prereqs` and `SIMPLIFY.prereqs`
      (R-B2); add the three consts to the bottom `export { … }`; add a comment documenting the
      prereq-ordering constraint and the canonical ids (R-B1).
- [ ] `types.ts` — **no v1 edit.** Products carry as `[product, 1]`, misconceptions map to `'other'`
      (R-B5). *Fast-follow PR (O1):* extend `ErrorSignature` with `'add_factors'`,
      `'skip_count_drift'`, `'array_perimeter'`, `'distributive_add_parts'` + matching fingerprinting
      in `observation.ts`.
- [ ] `credit.ts` — **no edit** (the prepend in R-B2 preserves `prereqs[last]` resolution).

**Routing / map (`web/src/`):**
- [ ] `rooms.js` — add the three `m1/m2/m3` entries (full field set above); renumber the five
      fraction rooms `no: 4..8` (R-B4); confirm `pos` values don't collide with r1 `{300,220}` /
      r3 `{980,220}` / r2 `{980,600}` / r4 `{640,660}` / r5 `{300,600}` (the mult trio is placed in
      a new upper/left "foundations" arc: m1 `{150,410}`, m2 `{360,150}`, m3 `{640,120}`).
- [ ] `runtime/scaffoldMap.js` — add `m1`/`m2`/`m3` branches to **both** `toScaffoldLevel` and
      `toBeatForLevel`, identical r1-style shape (R-M1, R-M2). `parseStageN` handles all keys.
- [ ] `Shell.jsx` — import `AppM1/M2/M3`; add `else if (room.id === 'm1'|'m2'|'m3')` branches
      passing the existing `p` props (`{no,title,onBack,onRewatchIntro,initialBeat}`).

**Lesson components + CSS (`web/src/`, `web/src/styles/`):**
- [ ] `AppM1.jsx`, `AppM2.jsx`, `AppM3.jsx` (consume `initialBeat`; engine wiring; 4-zone layout).
- [ ] `components/PlateGroup.jsx`, `components/BakingTray.jsx`, `components/SkipJar.jsx`,
      `components/SkipLine.jsx`.
- [ ] `styles/m1.css`, `styles/m2.css`, `styles/m3.css` (`.mN-*` over shared `lesson.css`).

**Intros (`web/public/intros/`, `web/src/`):**
- [ ] `public/intros/m1-equal-groups.html`, `m2-baking-trays.html`, `m3-times-facts.html`.
- [ ] `introM1.js`, `introM2.js`, `introM3.js` (STAGE_PERSIST_KEY / INTRO_DURATION / INTRO_CUES).
- [ ] `RoomIntro.jsx` — add `m1/m2/m3` to `INTROS{}`.

**Voice (`web/src/voiceLines.js`):**
- [ ] `m1i_*`, `m2i_*`, `m3i_*` intro narration keys (Cook); spell products in words.
- [ ] `mr_mom_goal_*` (= caption verbatim), `mr_mom_nudge_*`, banter `mr_<owner>_<slug>_<1|2|3>`,
      and `MEOW_SFX{}` + onomatopoeia for any `mr_cat_*` keys (cat stays meow-only; Babushka carries
      the answer).

**Optional kitchen transfer layer (`web/src/momsProblems.js`) — follow-up, not a blocker:**
- [ ] `BANK['m1'|'m2'|'m3']` `mirror[]`/`combine[]`, `CURRICULUM`/`ROOM_SKILL` entries. Requires a
      `multiply` op + slip diagnostics in `gradeAnswer` (current ops are add/sub/simplify/improper/
      mixed) — defer unless the kitchen layer is wanted for these rooms.

**No edits needed:** `WorldMap.jsx`, `kitchenProgress.js`, `policy.ts` (all iterate `ROOMS`/
`allNodes()` generically).

---

## Validation

- **DAG loads:** `getNode('MULT_FACTS').prereqs` resolves through `getNode` without throwing
  (catches the R-B1 class of bug); `prereqsOf('ADD_UNLIKE_COPRIME')` returns `[MULT_FACTS,
  ADD_UNLIKE_NESTED]` in that order (R-B2).
- **credit.ts unchanged behavior:** an `add_across_unlike` error on r2 still docks
  `ADD_UNLIKE_NESTED` (the last prereq), not `MULT_FACTS` — assert in a small script.
- **scaffoldMap inverse consistency:** for each of m1/m2/m3, `toScaffoldLevel('mN',
  toBeatForLevel('mN', L)) <= L` for L in 0..4 (no entry lands above its level).
- **Routing:** `built:true` + Shell branch present for all three (no `EmptyRoom` fall-through);
  `#/m1` `#/m2` `#/m3` open the right component; WorldMap renders 8 non-overlapping nodes.
- **Manual QA (`/browse`):** walk each room 1-manipulate → 7-words; confirm the equal-group guard
  (m1), interior-only fill + rotate + score (m2), running tally + missing-term fill (m3); confirm
  `initialBeat` deep-links from a seeded mastery map; confirm intros fire in sync.

## Open questions / follow-ups

- **O1 (required fast-follow) — ErrorSignature union extension.** Until `types.ts` +
  `observation.ts` gain `add_factors` / `skip_count_drift` / `array_perimeter` /
  `distributive_add_parts`, the mult strand has **no error-specific remediation** (everything is
  `'other'`). Ship v1 with `'other'`; the extension is the next PR, not optional.
- **O2 — WorldMap "foundations" layout.** The proposed `pos` (m1 left, m2/m3 upper) places the trio
  in a new upper-left arc. A designer should confirm the 8-node layout reads as
  foundations → kitchen → fractions and doesn't crowd r1/r3. Hand-assigned; no layout-engine change.
- **O3 — m1 Applied setup-gate strictness.** Gate accepts count × size, nudges (not rejects) on
  reversed order (R-M4). Confirm the nudge copy/behavior in QA.
- **O4 — Fluency latency floor.** Verify the global `too_fast_correct` floor doesn't spam
  `TransferProbe` on the m3 Numbers rung; add a per-node latency-floor knob if it does (R-M5).
- **O5 — suggestedNextRoom for fresh users.** We accept multiplication-first (R-B3). If product
  decides r1 must be the default fresh-user suggestion, teach `mostUpstreamUnmastered`/
  `suggestedNextRoom` to skip unmastered nodes with no path to a chosen target — a separate engine
  change.
- **O6 — Kitchen transfer layer.** Adding m1/m2/m3 to `momsProblems` BANK needs a `multiply` op +
  slip diagnostics in `gradeAnswer`; deferred unless wanted.
- **O7 — Hard-fact sub-tracking.** Whether `MULT_FACTS` should sub-track the 6/7/8/9 cluster via
  per-fact-family `surface_forms` (so BKT/decay targets weak facts) or stay a single mixed-prompt
  node. v1: single node.
- **O8 — Rotate chip / commutativity as same vs. distinct surface_form (m3).** Whether `7×8` and
  `8×7` count as one form (halving the table) or transfer-distinct (affects `transfer_passed`).
  v1: same form.
- **O9 — Renumber ripple.** Renumbering the fraction rooms to `no: 4..8` is `rooms.js`-only, but
  audit `momsProblems.ROOM_SKILL.{no}` and any docs that enumerate lesson numbers so screen/caption
  numbering stays in sync.
