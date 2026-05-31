# Room: The Same-Pieces Room (R1 — ADD_SAME_DEN)

> First-pass room breakdown. Abstracted, gaming-flow focused. The first true fraction
> skill. Grounded in `docs/design/fraction-app-state-model.md`.

---

> **Scene & layout:** this room's on-screen layout follows the play-space-first scene grammar in
> `docs/design/presentation-scene-architecture.md` (§4 space-trade, §4.1 complexity budget,
> §5 goal-communication). Its precise per-beat scene breakdown is in that doc's §10.

## 1. Snapshot

- **Skill node:** `ADD_SAME_DEN`
- **Comes after / leads to:** the first/root learning room (after the kitchen hub) →
  `ADD_UNLIKE_DEN`.
- **Concept in one line:** when pieces are the same size, add how many you have and keep
  the size.
- **What the child can do after:** name a same-denominator sum at a glance (2/7 + 3/7 =
  5/7) without stacking.

## 2. The Wall

Predict-the-sum with two piles of the *same* fraction piece. The child can stack but
can't *say the total first*. Missing idea: the bottom number (piece size) stays; only the
top number (how many) grows.

## 3. The Block↔Number Bridge

- **What the blocks mean here:** unit fraction pieces, all the same size (e.g. sevenths).
- **What the numbers mean:** bottom = which size piece; top = how many. Adding = the top
  grows, the bottom is unchanged.
- **The moment it clicks:** merging two stacks of sevenths, the bottom number never moves
  while the top becomes the combined count.

> Uses unfamiliar sizes (fifths, sevenths) so the child must add, not recall a known total.

## 4. Game Objects, Mechanics & Interactions

### 4.1 Objects (the nouns on screen)
- **Same-size fraction pieces** — unit pieces of one denominator (all sevenths).
- **Two stacks** — the two addends, each shown as a fraction.
- **Fraction label** — split into a **top slot (numerator)** and a **bottom slot
  (denominator)**; the bottom slot is **lockable** and central to this room.
- **The lock icon** — a visible padlock on the denominator showing it cannot change.
- **Running-fraction readout** — top number climbs as pieces merge; bottom stays put.
- **Ruler** (carried from kitchen) — optional check surface; stacks are measured against it.
- **Write-pad / number pad** — to enter the sum.

### 4.2 Mechanics (the rules)
- **Only same-size pieces may merge** (they will; the room guarantees it).
- The **denominator is locked** — visually padlocked — while pieces merge; only the
  numerator changes. This is the room's signature rule.
- Merging **adds the top counts**; the readout climbs the top, holds the bottom.
- A wrong move that changes the bottom (the misconception) is **blocked or visibly bounced**
  by the lock.

### 4.3 Interactions (player verbs)
- **Merge stacks** (merge_stacks) — combining two stacks into one, on fraction pieces (addition).
- **Remove same-size pieces** (remove_pieces) — the take-away verb for subtraction (see
  §4.5), bottom still locked.
- **Write the sum or difference** (write_fraction) — fills the top while the bottom is
  shown locked.
- **Predict then check** (submit_answer, optional stack- or remove-to-confirm).

### 4.4 Progression of objects & mechanics
| Level | Objects present | Key mechanic | Player verb | Link shown by |
|-------|-----------------|--------------|-------------|---------------|
| L0 blocks lead | two same-size stacks, ruler | merge; top readout climbs | merge stacks | running fraction tracks the stack |
| L1 + write | merged stack, locked bottom slot | denominator padlocked | write the top, bottom shown locked | lock makes "size stays" visible |
| L2 blocks fade | outline stacks + labels | predict; bottom greyed | predict the sum, check | attention on numerators |
| L3 numbers lead | `2/7 + 3/7 = ?` | add tops, keep bottom | answer the sum | blocks only as a check |
| L4 new dress | 3 addends / sideways / in a sentence, odd sizes | rule over layout | solve, numbers only | same rule, new presentation |
| L5 bare + ghost backdrop | `2/7 + 3/7 = ?`, stacks faded behind | bare math, stacks as a memory anchor | **write fraction with stylus** | symbols stand alone; the backdrop then dissolves |
| L6 bare slate | `2/7 + 3/7 = ?` only, empty slate | no manipulatives at all | **write fraction with stylus** | nothing but the symbols remain |

### 4.5 Problem Progression (operation × unknown position)

This room explicitly teaches and tests **both same-denominator addition and
subtraction**. The denominator stays padlocked throughout — every stage is "keep the
size, work the tops." Four stages:

1. **Addition, blank = answer** — `2/7 + 3/7 = ?`. Merge same-size stacks, add the tops.
2. **Addition, blank = a part** — `2/7 + ?/7 = 5/7`. Add same-size pieces **up to** the
   shown total height; the missing pieces are the answer.
3. **Subtraction, blank = answer** — `5/7 − 2/7 = ?`. The new block move: from a stack of
   5 sevenths, **take 2 sevenths away**; what remains is the answer. Bottom still locked.
4. **Subtraction, blank = a part** — `5/7 − ?/7 = 2/7`, `?/7 − 2/7 = 3/7`.

- **New block move introduced:** **remove same-size pieces** (take-away), the inverse of
  the room's merge, denominator still locked — so the child sees subtraction obeys the
  same "size stays, count changes" rule.
- **Fade still applies** to each stage (L0→L6), ending at bare handwritten `5/7 − 2/7 = ?`.
- **Sequencing:** stages run 1→4; within each, blank-in-answer before blank-in-a-part.

## 5. Game Flow

- **Beat 1 — Blocks lead.** Two same-size stacks merge into one against the ruler; the
  running fraction shows the top climbing, bottom fixed.
- **Beat 2 — Blocks + write.** Merge, then write the result with the **bottom slot visibly
  locked** while filling the top. Binds "size stays, count changes."
- **Beat 3 — Blocks fade.** Outlines with labels; predict the sum, tap to merge-and-check;
  denominator greyed/locked.
- **Beat 4 — Numbers lead.** `2/7 + 3/7 = ?`; add tops, keep the bottom.
- **Beat 5 — New dress.** Three addends, sideways, or in a sentence; always odd sizes.
- **Penultimate Phase — bare math, objects behind.** The workspace clears to just
  `2/7 + 3/7 = ?`, but the two stacks linger as a **faded, non-interactive backdrop**
  behind the equation — a memory anchor, not a tool. The child solves it by hand and
  **writes the fraction with the stylus**; then the backdrop dissolves.
- **Final Phase — bare math on the slate.** No stacks, no ruler, no locked-denominator
  widget — just a written `2/7 + 3/7 = ?` and an empty slate. The child **writes the
  fraction answer with the stylus**. Every manipulative has left the screen; "keep the
  bottom, add the tops" now lives only in their head.
- **Feel:** the locked bottom number as anchor; the top climbing as pieces merge; the
  "of course" when the size never moves.

## 6. When the Room Is "Beaten"

Names same-denominator sums AND differences quickly and directly on numbers alone, across
odd sizes and all four stages (add forward, add missing-part, subtract forward, subtract
missing-part), keeping the denominator fixed unprompted. Shallow tells: adding/subtracting
the bottoms too (2/7 + 3/7 → 5/14, the target misconception); solving only the forward
direction and stalling when the blank moves; or handling addition but not the take-away
direction. If any survive, not beaten.

## 7. Help When Stuck

Point at the bottoms — "are the pieces the same size?" → "so the size stays; just count
them" → show the merge with the bottom locked and one top added → show the answer, have
them write the next.

## 8. Back to the Kitchen

Returns to the exact predict-the-sum recipe and now names the total before stacking — first
proof a room gave a tool the kitchen demanded. Then mom hands a recipe whose pieces
*aren't* the same size.

## 9. Assets Used (see `ASSET_CATALOG.md`)

Scene: `scene.room_generic` (`room_motif`), `scene.bare_slate`, `scene.help_handoff`
Characters: `tutor_guide`, `reward_payoff`
Manipulables: `block`, `stack`, `pile`, `ruler`, `merge_zone`
Symbolic: `numeral_glyph`, `fraction_label` (incl. `[denominator_locked]`), `operator_glyph`, `tally_readout`, `equation_frame`
Tools: `slate`
Feedback/control: `check_button`, `hint_affordance`, `feedback_burst`, `progress_indicator`, `affect_camera_indicator`
