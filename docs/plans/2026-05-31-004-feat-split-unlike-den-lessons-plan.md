# Split "Same-Size Pieces" into Unit-Fraction (R2) + Non-Unit (R3) Lessons — Plan (2026-05-31)

Splits the overloaded R2 "Same-Size Pieces" lesson into two rungs: R2 keeps **unit
fractions only** (numerator always 1, denominators differ — `1/2 + 1/3`), and a new
R3 **"More Than One Piece"** carries the harder case where **at least one numerator is
greater than 1** (`3/8 + 1/4`, `2/3 + 3/4`, …). Both rooms reuse one parameterized
lesson screen and one shared math engine; the difference is content (problem bank +
worked-example anchor + a few spoken lines) plus the room-graph wiring.

Origin: user observation that R2 "is doing a little too much." Builds on the existing
web app under `web/` (Vite + React + DOM/SVG) and the room corpus in
`docs/room_break_down/`.

## Why this is small

`web/src/App.jsx` is **already fully generalized** for non-unit numerators — every
quantity derives from `aNum/aDen + bNum/bDen` (e.g. `answerNum = aNum*mA + bNum*mB`),
and nothing in the mechanic assumes numerator 1. The "doing too much" lives almost
entirely in **one place**: the `BANK` table in `web/src/r2problems.js`, which feeds the
L4 "new dress" beat and deliberately mixes unit-fraction pairs (`1/2+1/6`, `1/3+1/4`)
with non-unit pairs (`2/3+3/4`, `5/6+1/3`, …). So the split is mostly **content +
configuration + room-graph**, not a mechanic rewrite.

## Locked decisions

- **Placement:** insert the new room directly after R2; **true renumber** of the
  downstream rooms (simplify → Lesson 4, whole-units → Lesson 5), including file,
  route-id, stylesheet, and internal CSS-class-prefix renames.
- **Code approach:** one **parameterized** lesson component (config-driven), instantiated
  twice — not a duplicated file. The shared screen is renamed `LessonUnlikeDen.jsx` and
  the shared math `unlikeDenMath.js` (the `r2`/`App` names are misleading once two rooms
  share them).
- **New room title:** **"More Than One Piece"** (R2 stays "Same-Size Pieces").
- **New room anchor (worked example for L0–L3/L5/L6):** **`3/8 + 1/4 = 5/8`** — non-unit
  numerator (`3/8`), one denominator divides the other (LCD = 8, reachable with the
  existing `×2` knife), sum under 1.

## Target room map (after the change)

| Route id | Lesson № | Title | Component | Stylesheet / class prefix | Notes |
|----------|:-------:|----------------------|----------------------------|---------------------------|-------|
| `r1` | 1 | Same Pieces | `AppR1.jsx` | `lesson.css` | unchanged |
| `r2` | 2 | Same-Size Pieces | `LessonUnlikeDen.jsx` (unit cfg) | `lesson.css` | **unit fractions only** |
| `r3` | 3 | **More Than One Piece** | `LessonUnlikeDen.jsx` (non-unit cfg) | `lesson.css` | **NEW** — non-unit numerators |
| `r4` | 4 | Tidying Up | `AppR4.jsx` *(was `AppR3`)* | `r4.css` / `.r4-*` *(was `r3`)* | renamed/renumbered |
| `r5` | 5 | Whole Units | `AppR5.jsx` *(was `AppR4`)* | `r5.css` / `.r5-*` *(was `r4`)* | renamed/renumbered |

> The world map (`WorldMap.jsx`) draws each room as an independent spoke from the
> kitchen and labels it from the `no` field — there is no sequential connector chain, so
> renumbering is just `no` + `pos` + array order in `rooms.js`.
>
> Note: `rooms.js` currently flags Tidying Up / Whole Units as `built: false` even though
> `AppR3`/`AppR4` exist and `Shell` routes to them. Preserve each room's existing `built`
> value as-is under its new number; resolving that stale flag is out of scope here.

## Phased work

### Phase 0 — Shared math engine (`r2problems.js` → `unlikeDenMath.js`)
- Rename the file; update its import in the lesson component.
- Keep the pure helpers shared and unchanged: `gcd, lcm, lcd, exactSum, multipliersFor,
  commonDenChoices, verify`.
- Change `generateProblem(index)` → `generateProblem(bank, index)` (it currently closes
  over the module-level `BANK`); move `ANCHOR` and `BANK` **out** of this file into the
  per-lesson configs (Phase 2). The engine becomes content-free.

### Phase 1 — Parameterize the lesson screen (`App.jsx` → `LessonUnlikeDen.jsx`)
Accept a `lesson` config prop: `LessonUnlikeDen({ lesson, onBack })`. Only three literal
couplings to `1/2 + 1/3` exist; replace each with config:
1. `useState(ANCHOR)` → `useState(lesson.anchor)`.
2. `generateProblem(probIndex)` at L4 → `generateProblem(lesson.bank, probIndex)`.
3. `say("goal" | "fullMarks" | "sameAs")` → `say(lesson.voice.goal | .fullMarks | .sameAs)`.
   (All other spoken keys — `denPrompt, joined, dontFit, sliceFirst, dragTogether,
   notQuite` — are anchor-agnostic and stay shared.)
Everything else (status ribbon, `eqLead`, big equation, ruler labels) already renders
from the live `problem` and needs no change.

Optional nicety (not required for the `3/8 + 1/4` anchor, whose only cut is `×2`): make
the knife set `[2,3,4]` part of `lesson` so any future anchor stays reachable. The larger
multipliers in the banks only appear at L4, which uses the symbolic picker, not knives.

### Phase 2 — Two lesson configs (new `web/src/lessons/`)
`lessons/r2-unit.js`:
- `anchor: { aNum:1, aDen:2, bNum:1, bDen:3 }`
- `voice: { goal:"goal", fullMarks:"fullMarks", sameAs:"sameAs" }` (reuse existing clips —
  no rebake; they already say "one half … five sixths").
- `bank` (unit fractions, unlike denominators, anchor excluded; mixes coprime + nested;
  all sums < 1):
  `1/3+1/4, 1/2+1/5, 1/4+1/5, 1/2+1/4, 1/2+1/6, 1/3+1/6, 1/4+1/8`.

`lessons/r3-nonunit.js`:
- `anchor: { aNum:3, aDen:8, bNum:1, bDen:4 }`  (= `5/8`)
- `voice: { goal:"r3Goal", fullMarks:"r3FullMarks", sameAs:"r3SameAs" }` (new keys, Phase 4).
- `bank` (≥1 numerator > 1, anchor excluded; some sums > 1, kept improper per curriculum —
  they seed R5):
  `2/3+3/4, 5/6+1/3, 1/2+3/8, 3/4+4/5, 2/3+5/6, 2/5+3/10, 3/4+5/8`.

Both banks are **proposed and tunable** — pedagogical ordering can be adjusted, but the
invariant is: R2 bank = every addend `1/d`; R3 bank = at least one addend `n/d` with `n>1`.

### Phase 3 — Room graph + routing (true renumber)
Do the renames **highest-number-first** to avoid `AppR4` collisions:
1. **Whole Units:** `AppR4.jsx → AppR5.jsx`; `styles/r4.css → styles/r5.css`; rename its
   internal `.r4-*` selectors → `.r5-*` (file + JSX class strings); update its
   `import "./styles/r5.css"`.
2. **Tidying Up:** `AppR3.jsx → AppR4.jsx`; `styles/r3.css → styles/r4.css`; rename its
   internal `.r3-*` selectors → `.r4-*`; update its `import "./styles/r4.css"`.
3. **Shared screen:** `App.jsx → LessonUnlikeDen.jsx`.
4. **`rooms.js`:** insert the new `r3` node, set the new map order/positions, and renumber
   display `no`:
   - `r2` Same-Size Pieces — keep `intro: "/intros/r2-same-size-pieces.html"`.
   - `r3` **More Than One Piece** — `no:3`, `built:true`, no `intro` (see Phase 4).
   - `r4` Tidying Up — `no:4` (was 3), preserve its `built` flag.
   - `r5` Whole Units — `no:5` (was 4), preserve its `built` flag.
5. **`Shell.jsx`:** update imports + the explicit route switch:
   - `r2 → <LessonUnlikeDen lesson={r2Unit}>`
   - `r3 → <LessonUnlikeDen lesson={r3NonUnit}>`
   - `r4 → <AppR4>` (the renamed simplify room)
   - `r5 → <AppR5>` (the renamed whole-units room)
   - The hash-route regex already accepts any id; no string-list to widen.

No hardcoded `#/r3`/`#/r4` links exist elsewhere (verified) — `WorldMap` opens rooms via
`room.id`, so updating `rooms.js` propagates.

### Phase 4 — Voice + intro
- Add three keys to `voiceLines.js` (Web Speech fallback reads them immediately; bake mp3s
  later with `npm run voice`):
  - `r3Goal`: "Mom needs three eighths of a dough strip plus one quarter of a strip. The
    blocks are different sizes — slice them until every block is the same size, join them,
    then write the total." (speaker: `mom`)
  - `r3FullMarks`: "Yes! Three eighths plus one quarter is five eighths. Full marks!"
  - `r3SameAs`: "Right! That is the same as five eighths."
- **No intro for R3 at launch.** `Shell` only plays an intro when `room.intro` is set, so
  R3 simply skips it. Authoring a parallel 30s intro (animation HTML + `introR3.js` cue
  sheet + `r3i_*.mp3`) mirroring `introR2.js` is a **separate follow-up**, not a blocker.

### Phase 5 — Verify
- Add a small assertion script (no test harness exists today) exercising `verify()` /
  `exactSum()` over **both** banks: correct sums, star tiers (LCD=3 stars, over-slice<3),
  and that every R2 entry is unit-only while every R3 entry has a numerator > 1.
- Manual QA (`cd web && npm run dev`, or `/browse`): walk **both** rooms L0→L6 and the
  renumbered R4/R5; confirm R2 only ever shows `1/d` addends, R3 shows the non-unit pairs,
  and the renamed simplify/whole-units rooms still render (CSS-prefix rename is the
  highest-risk mechanical step — eyeball them).

### Docs / memory to update (so the split doesn't drift)
- `docs/room_break_down/`: scope `04_R2_add_unlike_denominator.md` down to unit fractions;
  add a new breakdown for **More Than One Piece** (non-unit numerators); renumber the
  display numbers in `05_R3_simplify.md` / `06_R4_improper_to_mixed.md` (Lessons 4 / 5).
  Update `README.md` / `ASSET_CATALOG.md` room lists if they enumerate rooms.
- Memory `fraction-app-design-locked`: amend the curriculum line to
  R1 same-den → R2 unit unlike-den → R3 non-unit unlike-den → R4 simplify → R5 improper→mixed.

## Risks & sequencing notes
- **Rename ordering is load-bearing:** rename Whole Units (`R4→R5`) **before** Tidying Up
  (`R3→R4`), or the second rename clobbers the first.
- **CSS-prefix rename is the riskiest churn:** `.r3-*`/`.r4-*` are used both in the
  stylesheet and as JS class-string literals; scope the find/replace per file and verify
  each room renders. (If you'd rather de-risk, the files can be renamed while leaving
  internal prefixes — at the cost of a `r4.css` full of `.r3-*` selectors. Plan assumes
  full rename for consistency, per the "true renaming" decision.)
- **Pre-baked R2 voice clips stay valid** because R2 keeps the `1/2+1/3` anchor and its
  existing keys; only R3 introduces new (fallback-covered) lines.

## Open items
- Final problem banks (Phase 2) — proposed above, confirm or tune ordering/membership.
- R3 intro — deferred; decide later whether to author the matching 30s intro.
