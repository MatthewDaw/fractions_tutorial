# Mom's Room (Word Problems) — Design Brief / Hand-off Prompt

> Paste-ready prompt to design **Mom's Room** — the kitchen-hub word-problem layer — in a
> fresh Claude (design/artifact mode) or another design tool. Self-contained; assumes no
> repo access. Distilled from `docs/room_break_down/00_kitchen_hub.md`,
> `docs/room_break_down/ASSET_CATALOG.md`, and the locked design system in the R1/R2
> handoffs (`docs/design/design_handoff_same_pieces/` and
> `docs/design/design_handoff_matching_sizes/`). Reflects the locked decisions that the
> voiced goal is also shown on screen as text, and that **story/word problems live ONLY in
> Mom's room — the drill rooms (R1–R4) stay abstract.**

---

You are designing one room of a children's web game that teaches adding fractions. I want a
polished, interactive design for **Mom's Room: the story / word-problem layer**. Build it as
a single-file React artifact using Framer Motion (`motion/react`) — production-quality visual
design, not generic AI slop. It must visually match an existing two-room design system
(tokens below).

## The game, briefly
A cooking-themed fractions tutor for young kids (~ages 6–10). The drill rooms (R1 same-size
pieces, R2 unlike sizes, R3 simplify, R4 improper→mixed) teach each skill abstractly on a
number line. **Mom's Room is the transfer test**: the same math, dressed as a little kitchen
situation the child must *read and decode* before they know which move to make. The math IS
the mechanic — no bolted-on points. Warm, tactile, calm-but-playful, high-contrast, friendly.

## What's different here from a drill room
- **The goal caption is a story**, not a bare equation. Mom poses a situation (spoken aloud
  AND shown as on-screen caption text). The child infers the numbers and the operation.
- **The pieces are themed kitchen objects** sitting on Mom's counter (a chocolate bar, a pie,
  a tray, dough strips, an egg carton…). But underneath, every quantity is still **discrete
  same-size blocks measured against a number-line / ruler** — that ruler is the check layer
  drawn beneath the story props.
- **Kitchen-only.** One counter backdrop; props swap per problem. No town, no outdoor scenes.

## Hard design law (do not violate)
Quantities are ALWAYS discrete, same-size, visible pieces measured against a ruler — **never
liquid, never poured, never hidden inside an opaque container.** Use only foods that slice or
count cleanly along a line (bars, pies, trays, strips, cartons, links). No "½ cup of milk."

## The three "push" levers (every problem set must exercise these)
1. **Operation choice** — the story does NOT say add or subtract; the child decodes it from
   the situation ("Grandpa ate 4/6 of the pie at dinner — how much is left for breakfast?").
2. **Two-step** — combine skills: add unlike → then simplify; or add → then convert
   improper→mixed ("3/4 + 3/4 of a pie — how many whole pies and leftover?").
3. **Unknown-in-the-middle** — the blank is a *part*, not the answer ("You have 1/4 of the
   crackers and need 3/4 — how much MORE?").

## The full story set (kitchen-only) — build props for all of these
**R1 same-size pieces**
- Chocolate Bar (8 squares): snap 3/8 + 2/8 — how much gone? *(add, answer)*
- Grandpa's Pie (6ths): whole, 4/6 eaten — how much left? *(operation choice → subtract)*
- Cracker Sheet (4ths): have 1/4, need 3/4 — how much more? *(unknown-in-the-middle)*
- Sausage Links (9ths): 4/9 + 3/9 on the plate? *(add, answer)*

**R2 unlike sizes**
- Two Trays (½ + ⅓): one cut in halves, one in thirds — combine → 5/6.
- Dough Strip + Bacon Strip (½ + ¼) on the ruler → 3/4.
- Mismatched Candy Bars (¼ + ⅙): one 4-split, one 6-split → 5/12.

**R3 simplify ("tidy it / make it fit")**
- Lunchbox: 6/8 sandwich in little pieces — fewest big pieces to close the lid → 3/4.
- Carrot Bundles: 6/9 carrots — biggest equal twine bundles → 2/3.
- Cookie Tin: 4/12 loose — group into neat rows → 1/3.
- Add-then-tidy: 1/8 + 3/8, then pack it *(two-step → 1/2)*.

**R4 improper → mixed ("full containers + leftover")**
- Cupcake Boxes: 14 cupcakes, box holds 4 → 3 2/4.
- Cooling-Rack Pies: 7/4 in quarter-slices → 1 3/4.
- Muffin Tins: 9 muffins, tin of 6 → 1 3/6.
- Two big slices: 3/4 + 3/4 of a pie *(two-step: add → mixed → 1 1/2)*.

## The new visuals to draw (one kitchen, swappable counter props)
Draw these as styled DOM + inline SVG (no external art). Each lists the states the game logic
needs — a theme may restyle them but must not drop one.

1. **Scored chocolate bar** — `[full]` `[squares_snapped]` `[needed_outline_ghost]`
2. **Pie in a tin** — `[slices_present]` `[slices_missing]` `[target_shaded]`
3. **Tray / sheet-cake** with **swappable cut lines** (½, ⅓, ¼, ⅙) — `[uncut]` `[cut_n]` `[merging]` (R2)
4. **Dough strip + bacon strip** on the ruler, sliceable — `[whole]` `[sliced]` `[joined]` (R2)
5. **Mismatched candy bars** (4-split & 6-split) — `[idle]` `[recut]` `[matched]` (R2)
6. **Cracker sheet** — `[whole]` `[snap_lines]` `[piece_highlight]`
7. **Sausage-link chain** — `[idle]` `[counting]` `[wrapped_into_units]` (R1 + R4)
8. **Egg carton / muffin tin** — `[cells_full]` `[cell_lifting]` `[fresh_tin_spawned]` (R1, R4)
9. **Carrots → twine bundles** & **cookies → clusters** — `[loose]` `[bundling]` `[bundled]` (R3 fuse)
10. **Lunchbox with a closing lid** — `[open]` `[pieces_in]` `[lid_closed]` (R3 motive)
11. **Cupcake / pie boxes** that fill and stack — `[empty]` `[filling]` `[full]` `[leftover]` (R4)
12. **Cooling rack** backdrop element — `[empty]` `[holding_wholes]` (R4)
13. **2–3 townsfolk at the counter** (sibling, Grandpa, picky cat) — `[idle]` `[asking]` `[happy]`,
    drawn in the same woodcut language as the existing "Cook" tutor (reuse its style).

## Scene layout (fixed logical stage 1280×800, landscape; scale-to-fit, letterboxed)
Four regions, top→bottom — mirror the existing lesson pages:
- **Header (~52px):** lesson badge + tag + title (e.g. "MOM'S RECIPES · STORY PROBLEMS"),
  sound-mute toggle, start-over (⟲).
- **Goal caption band (~52px):** a **READ ALOUD** pill (Web Speech) + the **story prompt** as
  caption text (Old Standard TT). This is where the word problem lives.
- **Play space (the hero):** Mom's counter with the current story prop(s), laid on the
  number-line / ruler (the check layer). The child manipulates the themed pieces; the ruler
  confirms the quantity.
- **HUD (bottom):** the Cook/Mom tutor + speech ribbon (left), the big answer equation /
  mixed-number slots (center), a persistent **Check** button + 3-star **Rosette** (right).

**Complexity budget — parseable in one glance.** Show only the current story's prop, the
ruler, the answer slot, and Check. Exactly one emphasis target per beat.

## Feedback & scoring rules
- Honest, instant, gentle. Correct / at-target / incorrect are visually distinct; errors
  never punish, never force a retry.
- Over-work that still gets a right value (e.g. an un-simplified but correct total) is
  **correct with fewer stars**, plus an optional soft nudge — never marked wrong.

## Constraints (match the locked design system exactly)
- 2D only. React + DOM/SVG + Framer Motion. No 3D, no canvas/WebGL, no external art.
- Theme: vintage printed "Lesson" page — warm paper, ink + muted red, kitchen framing.
- Colors: `--paper-1 #ede2c8`, `--paper-2 #e3d4b1`, `--paper-3 #c9b78d`, `--ink #1c1612`,
  `--ink-soft #3a2e24`, `--ink-mute #6b5a47`, `--red #a32a22`, `--red-deep #6e1c16`,
  `--red-soft #c46a5f`; letterbox bg `#5b4327`; frame `#1a0f08`.
- Fonts (Google): Russo One (display), Old Standard TT (serif/body), Stardos Stencil,
  Special Elite, JetBrains Mono.
- Spacing scale 4/6/8/10/14/18/26px; hard button shadow `4px 4px 0 rgba(28,22,18,.28)`.
- Accessibility: never link a quantity to its numeral by color alone (also use pattern/shape
  or a connector); large touch targets (≥60px); honor `prefers-reduced-motion`. Draggable
  must look grabbable; locked must look locked.

## Deliverable
First, briefly propose how the story props sit on the counter + ruler (4–6 lines). Then build
a **single-file React artifact** for Mom's Room on the 1280×800 stage that demonstrates at
least **one story per concept end-to-end** (one R1, one R2, one R3, one R4 — pick the hero
of each: Chocolate Bar, Two Trays, Lunchbox, Cupcake Boxes), each exercising a different push
lever, with the goal-caption story, ruler check layer, HUD (Check + stars), and Mom tutor.
Draw all 13 prop families listed above as reusable components (even if only four are wired
into the demo flow). Then suggest 2–3 directions to iterate next.
