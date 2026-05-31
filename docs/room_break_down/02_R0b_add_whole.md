# Room: The Combining Room (R0b — ADD_WHOLE)

> First-pass room breakdown. Abstracted, gaming-flow focused. A prerequisite room — we do
> NOT assume the child can add whole numbers. Grounded in
> `docs/design/fraction-app-state-model.md`.

---

> **Scene & layout:** this room's on-screen layout follows the play-space-first scene grammar in
> `docs/design/presentation-scene-architecture.md` (§4 space-trade, §4.1 complexity budget,
> §5 goal-communication). Its precise per-beat scene breakdown is in that doc's §10.

## 1. Snapshot

- **Skill node:** `ADD_WHOLE`
- **Comes after / leads to:** after `COUNT` → `ADD_SAME_DEN`.
- **Concept in one line:** putting two groups together makes a bigger group; `+` is that
  "put together."
- **What the child can do after:** name the total of two counts quickly and write it as
  `3 + 2 = 5`.

## 2. The Wall

When a recipe or room needs the child to *combine* two amounts and they can count each
pile but can't say the total without rebuilding it. Same-denominator adding is this move
on one-size pieces — so it must be solid first.

## 3. The Block↔Number Bridge

- **What the blocks mean here:** two separate stacks of identical pieces.
- **What the numbers mean:** each stack's count is a numeral; the merged count is the sum;
  `+` is the merge.
- **The moment it clicks:** the child slides two stacks into one, the count becomes the
  total, and `3 + 2 = 5` describes exactly what their hands did.

## 4. Game Objects, Mechanics & Interactions

### 4.1 Objects (the nouns on screen)
- **Two stacks** — each a group of identical pieces, each with its own **count label**.
- **The gap / merge zone** — the space between the stacks where they fuse; the **`+` symbol**
  lives here, naming the action.
- **Merged stack** — the single taller stack after combining; carries the **total label**.
- **Count-up readout** — animates the running total as the stacks fuse.
- **Write-pad / number pad** — for entering the total and, later, the full `3 + 2 = 5`.
- **Check button** — in number-led beats, merges-and-counts to verify a prediction.

### 4.2 Mechanics (the rules)
- Two stacks **drag together and fuse** into one; the merge animates a **count-on** from
  the first stack's count.
- The **`+` symbol appears in the merge gap** the moment the stacks touch — binding the
  action to the operator.
- Later beats require a **prediction before the merge is allowed** (name the total first).
- New-dress variants: **order swap** (`2+3` same as `3+2`) and **missing part**
  (`3 + ? = 5`) — the merge still resolves them, but symbolically.

### 4.3 Interactions (player verbs)
- **Drag stack → stack** (merge_stacks) — the room's signature addition verb.
- **Remove pieces from a stack** (remove_pieces) — the take-away verb for subtraction
  (see §4.5); the inverse of merge.
- **Write the result** (write_number) — binds the total or the difference.
- **Predict then check** (submit_answer, then merge- or remove-to-confirm).

### 4.4 Progression of objects & mechanics
| Level | Objects present | Key mechanic | Player verb | Link shown by |
|-------|-----------------|--------------|-------------|---------------|
| L0 blocks lead | two labeled stacks, merge gap | drag-to-fuse + count-on | merge stacks | total animates from the fuse |
| L1 + write | merged stack, `+` symbol, write-pad | write total after merge | write the total | `+` sits where stacks joined |
| L2 blocks fade | outline stacks + numbers | predict before merge | predict, then check | prediction confirmed by fuse |
| L3 numbers lead | `3 + 2 = ?`, check button | symbolic add | answer the sum | blocks only as a check |
| L4 new dress | swapped / missing-part forms | combine generalizes | solve for total or part | same merge, new symbol shape |
| L5 bare + ghost backdrop | `3 + 2 = ?`, stacks faded behind | bare math, stacks as a memory anchor | **write answer with stylus** | symbols stand alone; the backdrop then dissolves |
| L6 bare slate | `3 + 2 = ?` only, empty slate | no manipulatives at all | **write answer with stylus** | nothing but the symbols remain |

### 4.5 Problem Progression (operation × unknown position)

This room explicitly teaches and tests **both addition and subtraction**, in four stages:

1. **Addition, blank = answer** — `3 + 2 = ?`. Merge two stacks, count the total.
2. **Addition, blank = a part** — `3 + ? = 5`, `? + 2 = 5`. Given the total stack and one
   pile, the child **adds pieces up to the shown total**; the gap filled is the answer
   (counting up — subtraction's logic in addition's clothes).
3. **Subtraction, blank = answer** — `5 − 2 = ?`. The new block move: start from a stack
   of 5 and **take 2 pieces away**; what remains is the answer.
4. **Subtraction, blank = a part** — `5 − ? = 2` (remove until 2 are left; how many
   removed?), `? − 2 = 3` (what stack, after removing 2, leaves 3?).

- **New block move introduced:** **remove pieces** (take-away) — the inverse of R0b's
  merge. Same stacks and labels, run backward.
- **Fade still applies** to each stage (L0→L6), ending at bare handwritten `5 − 2 = ?`
  on the slate. Subtraction's fade can move faster since the objects are already known.
- **Sequencing:** stages run 1→4; within each, blank-in-answer before blank-in-a-part.

## 5. Game Flow

- **Beat 1 — Blocks lead.** Two labeled stacks drag together and fuse; the total counts up.
- **Beat 2 — Blocks + write.** Same merge; the child writes the total; the `+` shows in the
  gap.
- **Beat 3 — Blocks fade.** Outlines/numbers; predict the total, then tap to merge-and-check.
- **Beat 4 — Numbers lead.** `3 + 2 = ?`; answer it, blocks only as a check.
- **Beat 5 — New dress.** Swapped order, bigger pairs, missing part (`3 + ? = 5`).
- **Penultimate Phase — bare math, objects behind.** The workspace clears to just
  `3 + 2 = ?`, but the two stacks linger as a **faded, non-interactive backdrop** behind
  the equation — a memory anchor, not a tool. The child solves it by hand and **writes the
  answer with the stylus**; then the backdrop dissolves.
- **Final Phase — bare math on the slate.** No stacks, no merge zone, no count-up — just
  a written `3 + 2 = ?` and an empty slate. The child **writes the answer with the
  stylus**. Every manipulative has left the screen.
- **Feel:** the slide-and-fuse, the count ticking up to land on the total, the symbol
  snapping in.

## 6. When the Room Is "Beaten"

Names totals AND differences fast and directly on numbers alone, across all four stages
(add forward, add missing-part, subtract forward, subtract missing-part), with the blank
in any slot, not rebuilding stacks. Shallow tells: solves only when the blank is the
answer and stalls when it moves to an operand; or handles addition but not the take-away
direction — both signs they pattern-matched a layout rather than understanding combining
and separating.

## 7. Help When Stuck

Highlight the two stacks → "slide them together, then count on from the first" → show the
merge and count up one → show the total and have them write it.

## 8. Back to the Kitchen

Many children skip this quickly (another skip-ahead demo). A child who needed it returns
able to combine amounts — ready for the first real fraction move: adding same-denominator
pieces, which is this merge on same-size fraction pieces.

## 9. Assets Used (see `ASSET_CATALOG.md`)

Scene: `scene.room_generic` (`room_motif`), `scene.bare_slate`, `scene.help_handoff`
Characters: `tutor_guide`, `reward_payoff`
Manipulables: `block`, `stack`, `pile`, `ruler`, `merge_zone`
Symbolic: `numeral_glyph`, `operator_glyph`, `tally_readout`, `equation_frame`
Tools: `slate`
Feedback/control: `check_button`, `hint_affordance`, `feedback_burst`, `progress_indicator`, `affect_camera_indicator`
