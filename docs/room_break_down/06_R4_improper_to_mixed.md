# Room: The Whole-Units Room (R4 — IMPROPER_TO_MIXED)

> First-pass room breakdown. Abstracted, gaming-flow focused. The final core room.
> Grounded in `docs/design/fraction-app-state-model.md`.

---

> **Scene & layout:** this room's on-screen layout follows the play-space-first scene grammar in
> `docs/design/presentation-scene-architecture.md` (§4 space-trade, §4.1 complexity budget,
> §5 goal-communication). Its precise per-beat scene breakdown is in that doc's §10.

## 1. Snapshot

- **Skill node:** `IMPROPER_TO_MIXED`
- **Comes after / leads to:** after `ADD_UNLIKE_DEN` (parallel with `SIMPLIFY`) → final core
  skill; then scaffolding comes off and the child adds on paper.
- **Concept in one line:** when you have more than a whole, name it as whole units plus the
  leftover.
- **What the child can do after:** convert an improper fraction to a mixed number — how many
  wholes fit, what's left (9/7 = 1 and 2/7).

## 2. The Wall

An answer larger than one whole, like 9/7. Mom can't ask for "nine-sevenths" of a measure —
correct but unusable. Missing idea: group the pieces into full wholes and read off the
remainder.

## 3. The Block↔Number Bridge

- **What the blocks mean here:** a tall stack of unit pieces that runs past one whole
  (one full `ruler` length) into a second.
- **What the numbers mean:** each full `ruler` length of pieces = one whole number; the
  pieces left over the last whole mark = the fraction part. This is dividing top by bottom:
  quotient = wholes, remainder = leftover.
- **The moment it clicks:** stacking 9 sevenths against the ruler, 7 reach exactly one
  whole, 2 are left over — 9/7 becomes "1 whole and 2/7," i.e. 9 ÷ 7 = 1 remainder 2.

## 4. Game Objects, Mechanics & Interactions

### 4.1 Objects (the nouns on screen)
- **Tall overflow stack** — more pieces than one whole holds; the improper fraction. Built
  in the open against the ruler, every piece visible.
- **Ruler** — the measuring reference; one full ruler length = one whole. The stack is read
  against its marks (no liquid, no cups).
- **Whole-mark** — the `target_mark` at one full whole; the line a segment must reach to
  count as a whole unit.
- **Whole-unit row** — a row that collects completed wholes; each time a stack-segment
  reaches a full whole it **locks off and slides onto the row**, and the next whole begins.
- **Whole-unit counter** — tallies completed wholes (the whole number).
- **Leftover tray** — holds the pieces that don't complete a whole (the fraction part).
- **Mixed-number write slots** — separate slots for the whole number and the leftover
  fraction.
- **Reverse builder** (new-dress) — turns a mixed number back into one tall overflow stack.

### 4.2 Mechanics (the rules)
- Pieces **stack against the ruler**; the moment a segment reaches one full whole it
  **locks off as a whole unit, slides to the whole-unit row, and the next whole starts**
  with the overflow. (The discrete-block analogue of the old cup-and-pour, with nothing
  ever hidden inside a container.)
- The **whole-unit counter** increments per locked whole; the **leftover tray** holds the
  rest.
- The mixed number reads **(locked wholes) + (leftover / size)** — directly mirroring
  division.
- Trap rule: an **exact whole** (14/7) fills wholes with **no leftover** — the leftover slot
  must be empty, not forced.
- Reverse: a mixed number **rebuilds** into the right overflow stack (relationship both ways).

### 4.3 Interactions (player verbs)
- **Group pieces into wholes against the ruler** (group_wholes) — the new verb; stack until
  a whole locks off, repeat for the overflow.
- **Write the mixed number** (write_mixed) — whole slot + leftover slot.
- **Predict wholes & remainder, then check** (submit_answer, group-to-confirm).
- **Build from a mixed number** (reverse) — mixed → improper, re-stacking wholes + leftover
  into one tall stack.

### 4.4 Progression of objects & mechanics
| Level | Objects present | Key mechanic | Player verb | Link shown by |
|-------|-----------------|--------------|-------------|---------------|
| L0 blocks lead | overflow stack, ruler, whole-unit row | a whole locks off at the whole-mark, next begins | group pieces into wholes | locked wholes + leftover appear |
| L1 + write | locked wholes, leftover tray, slots | count wholes + leftover | write the mixed number | slots mirror wholes & leftover |
| L2 blocks fade | ruler + ghost segments | predict wholes & remainder | predict, then check | "how many times bottom into top" |
| L3 numbers lead | "9/7 = ?" | divide top by bottom | read wholes remainder leftover | stack only as a check |
| L4 new dress | exact-whole trap, big tops, reverse | both directions | convert either way | trap forbids a forced leftover |
| L5 bare + ghost backdrop | "9/7 = ?", whole-units faded behind | bare math, objects as a memory anchor | **write mixed number with stylus** | symbols stand alone; backdrop then dissolves |
| L6 bare slate | "9/7 = ?" only, empty slate | no manipulatives at all | **write mixed number with stylus** | nothing but the symbols remain |

### 4.5 Problem Progression (unknown position)

*(No addition here, so no subtraction stages — the blank's two positions give the
forward convert and its reverse, mixed→improper.)*


- **Slots the blank can occupy:** the mixed number (`9/7 = ? and ?/7`, forward — the
  one blank is the whole-and-remainder pair the child writes), the improper form
  (`1 and 2/7 = ?/7`), or a part of either (`9/7 = 1 and ?/7`, `? /7 = 1 and 2/7`).
- **Implicit inverse taught:** mixed→improper conversion (multiply the whole by the
  size and add the leftover) — the reverse of the room's forward divide. At block
  level: given full wholes + a leftover, the child **re-stacks them into one tall stack**
  to find the improper top.
- **Sequencing:** improper→mixed (forward) first; the reverse and part-blanks in the
  new-dress beat.

## 5. Game Flow

- **Beat 1 — Blocks lead.** A stack taller than one whole; the child groups pieces against
  the ruler; each segment that reaches a full whole locks off and slides onto the whole-unit
  row, the next whole starting with the overflow. Full wholes + a leftover.
- **Beat 2 — Blocks + write.** After grouping, the child writes the whole-unit count and the
  leftover fraction; the locked wholes and leftover stay visible beside the symbols.
- **Beat 3 — Blocks fade.** Ghost segments on the ruler; predict wholes and remainder, then
  group-and-check. Attention moves to "how many times does the bottom go into the top?"
- **Beat 4 — Numbers lead.** "9/7 = ?"; divide top by bottom, read wholes and remainder.
- **Beat 5 — New dress.** Exact whole (14/7 = 2, no leftover — trap), large tops needing
  several wholes, and the reverse (mixed → improper).
- **Penultimate Phase — bare math, objects behind.** The workspace clears to just the
  problem, but the ruler and locked whole-units linger as a **faded, non-interactive
  backdrop** behind "9/7 = ?" — a memory anchor, not a tool. The child divides by hand and
  **writes the mixed number with the stylus**; then the backdrop dissolves.
- **Final Phase — bare math on the slate.** No ruler, no wholes, no leftover tray — just a
  written "9/7 = ?" and an empty slate. The child **writes the mixed number with the
  stylus**, dividing top by bottom by hand. Every manipulative has left the screen.
- **Feel:** pieces stacking up the ruler, a whole locking off with a satisfying "snap," the
  next whole starting for the overflow.

## 6. When the Room Is "Beaten"

Converts improper to mixed directly by dividing, numbers alone, including the exact-whole
trap and the reverse direction. Shallow tells: always writing a leftover even at an exact
whole; or guessing the whole-unit count instead of dividing. If those survive, not beaten.

## 7. Help When Stuck

"How many full wholes can you make?" → "stack pieces against the ruler until one whole locks
off, then start the next" → show one whole filling and locking → show the division
(top ÷ bottom = wholes remainder leftover) and have them read it.

## 8. Back to the Kitchen

Returns and gives mom an answer she can use — "one whole and two sevenths." Every step of
adding any two fractions is now covered: read pieces of a whole, match unlike sizes, add
across a shared size, tidy the result, write an over-one answer as wholes plus a remainder.
The scaffolding comes off: fewer blocks, shorter rulers, then bare numbers — the child adds
fractions on paper, the game structure now in their head.

## 9. Assets Used (see `ASSET_CATALOG.md`)

Scene: `scene.room_generic` (`room_motif`), `scene.bare_slate`, `scene.help_handoff`
Characters: `tutor_guide`, `reward_payoff`
Manipulables: `block`, `stack`, `ruler`, `target_mark`, `whole_unit_row`
Symbolic: `numeral_glyph`, `fraction_label`, `equation_frame`
Tools: `leftover_tray`, `mixed_number_slots`, `slate`
Feedback/control: `check_button`, `hint_affordance`, `feedback_burst`, `progress_indicator`, `affect_camera_indicator`
