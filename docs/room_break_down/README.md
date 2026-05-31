# Room Breakdowns

First-pass, gaming-flow-focused breakdowns of each room/lesson in the fraction-adding
game. Each file shows how that room's mini-games walk the child from **moving blocks**
toward **bare numbers**, making the block↔number connection explicit at every beat.

These are intentionally **abstracted** for this first pass — focused on how the rooms
*play*, not on exact problem numbers, on-screen copy, or verifier formulas (those come
at build time).

## How to read these

- Source curriculum: `../inspiration/app_philosophy.md`
- Architecture & mastery model these hang off: `../design/fraction-app-state-model.md`
- Shared structure every room follows: `_TEMPLATE.md`
- **Shared asset catalog (sprites / objects / scenes, theme-swappable):**
  `ASSET_CATALOG.md` — every room's §9 references assets by ID from here; apply any
  theme by rebinding those IDs in one place.

The shared spine in every room is the **block → number fade** (Game Flow §4): blocks
lead → blocks + write the number (the binding beat) → blocks fade → numbers lead → new
dress (transfer) → bare math with the objects faded behind (a memory anchor) → **bare
math on the slate** (all blocks gone, answer written with the stylus). Same teaching move,
less physical support each time, ending at pure handwritten arithmetic.

The one exception is **R0a COUNT**: a count with no objects to count is not a question, so
that room has no bare-math phase. It ends instead on its hardest *real* count — several
kinds of object scattered and intermixed, each counted separately.

Two mechanics run through every room (see each file's §4.5 / Final Phase):

- **Problem Progression (operation × unknown position)** — every problem is an equation
  with exactly one blank, and the blank can sit in any part (an operand or the answer).
  The rooms that do addition (R0b, R1, R2, kitchen) explicitly teach and test **both
  addition and subtraction** in a four-stage flow: (1) add, blank=answer → (2) add,
  blank=a part → (3) subtract, blank=answer → (4) subtract, blank=a part. Subtraction
  introduces one new block move — **remove pieces** (take-away) — and reuses every other
  object. No separate subtraction room is needed: it lives in the same rooms as the
  matching addition. Non-addition rooms (count, simplify, improper→mixed) instead use
  the blank's two positions for their forward skill and reverse transform.
- **The Final Phase** — every room (except COUNT) ends by stripping all manipulatives; the
  child solves bare arithmetic by handwriting the answer (the design doc's "on paper" end
  state). A penultimate beat first runs the bare math with the room's objects left as a
  **faded backdrop** behind the equation, then dissolves them — a gentle hand-off into the
  empty slate.

## The rooms (in curriculum order)

| File | Skill | Teaches | Summoned when |
|------|-------|---------|---------------|
| `00_kitchen_hub.md` | KITCHEN_HUB | the goal: cooking = measuring = adding fractions | home base; throws every wall |
| `01_R0a_count.md` | COUNT | a number is how many objects (incl. counting mixed, scattered types) | can't say/write a count (prerequisite) |
| `02_R0b_add_whole.md` | ADD_WHOLE | combining groups = `+` | can't total two counts (prerequisite) |
| `03_R1_add_same_denominator.md` | ADD_SAME_DEN | same-size pieces: add the tops, keep the bottom | predict-the-sum wall |
| `04_R2_add_unlike_denominator.md` | ADD_UNLIKE_DEN | re-cut to a common size, then add | unlike-base recipe |
| `05_R3_simplify.md` | SIMPLIFY | fuse into fewest, biggest pieces | messy answers (33/99) |
| `06_R4_improper_to_mixed.md` | IMPROPER_TO_MIXED | whole units + leftover | answer over one whole (9/7) |

Counting and adding-whole are **prerequisite rooms** added beyond the source essay (we
don't assume the child already counts and adds). Most children skip them quickly — that
skip is the system's demonstration of skip-ahead.
