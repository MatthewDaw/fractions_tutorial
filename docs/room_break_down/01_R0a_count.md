# Room: The Counting Room (R0a — COUNT)

> First-pass room breakdown. Abstracted, gaming-flow focused. A prerequisite room — we do
> NOT assume the child can count pieces. Grounded in
> `docs/design/fraction-app-state-model.md`.

---

> **Scene & layout:** this room's on-screen layout follows the play-space-first scene grammar in
> `docs/design/presentation-scene-architecture.md` (§4 space-trade, §4.1 complexity budget,
> §5 goal-communication). Its precise per-beat scene breakdown is in that doc's §10.

## 1. Snapshot

- **Skill node:** `COUNT`
- **Comes after / leads to:** deepest foundation → `ADD_WHOLE`.
- **Concept in one line:** a written number is how many objects there are.
- **What the child can do after:** name a group's count without re-counting one-by-one,
  hold separate counts for different kinds of object at once, and write the numeral —
  even when the objects are scattered and mixed together.

## 2. The Wall

When the kitchen or a later room asks "how many pieces?" and the child can't reliably say
or write it. Even a same-denominator add is impossible if you can't count the answer's
pieces.

## 3. The Block↔Number Bridge

- **What the objects mean here:** identical pieces, each one "one." (Counting is the one
  skill where the *object* is the whole point — a number with nothing to count is not a
  count, so this room never strips the objects away.)
- **What the numbers mean:** the numeral is the *count* — nothing more.
- **The moment it clicks:** the child writes the numeral next to a group and sees "5" and
  "five blocks" are the same thing said two ways.

## 4. Game Objects, Mechanics & Interactions

### 4.1 Objects (the nouns on screen)
- **Unit pieces** — identical countable objects, the only ingredient here. Always sit in
  the open (loose or stacked) so **every piece stays fully visible** — never dropped into
  a bin or can where the sides could hide one.
- **Different object types** — a second (and third) *kind* of countable object (e.g.
  squares vs. triangles), so the child counts "how many of each" rather than one pooled
  pile. Just the `block` asset reskinned per type.
- **Stack** — a neat column the child builds; the tidy way to hold a group being counted.
- **Tally readout** — a live number that ticks as pieces are placed (the count made
  visible). Central object of this room.
- **Slate / write-pad** — where the child writes the numeral by hand, always *beside the
  objects it counts* (symbol-binding, never a bare slate here).
- **Arrangement frame** — the layout the pieces sit in (stack, row, scatter, ring); varies
  in the new-dress beat. A "frame" only in the sense of a layout — not a container.

### 4.2 Mechanics (the rules)
- Each piece placed **increments the tally by one** (count-by-doing). Pieces stack or sit
  loose in the open; nothing is ever obscured.
- In later beats the tally **hides**, so the child must produce the count themselves.
- A **flash-then-dim**: pieces show briefly then fade to outlines, pushing recognition over
  one-by-one counting.
- Reverse mode: given a numeral, the child must place **exactly that many** pieces; placing
  the wrong number is rejected.
- Arrangement may change without changing the count (a count is a count regardless of shape).
- **Multiple types are counted independently.** Two kinds of object share the screen; the
  child keeps a separate count for each — first as separate groups, later **scattered and
  intermixed**, so the total of each type must be found despite the jumble.

### 4.3 Interactions (player verbs)
- **Tap/drag piece → stack (or open layout)** (place_block) — counts by doing; the piece
  stays visible the whole time.
- **Write the numeral** (write_number) — the binding verb; handwriting the glyph next to
  the pieces. New emphasis of this room.
- **Read & build** (place N pieces from a given number) — reverse direction.
- **Count by type across a scatter** (write_number per type) — the room's mastery verb:
  report how many of each kind when both kinds are mixed and spread about.

### 4.4 Progression of objects & mechanics
| Level | Objects present | Key mechanic | Player verb | Link shown by |
|-------|-----------------|--------------|-------------|---------------|
| L0 blocks lead | pieces (one type), live tally | tally ticks per placement | place piece into a stack | tally rises as pieces land |
| L1 + write | built stack, slate | tally shown, child writes it | write numeral by the stack | glyph sits beside the pieces |
| L2 blocks fade | flash-then-dim pieces | tally hidden | name count from a glance | quick-look recognition |
| L3 numbers lead | number → empty layout | reverse: build to match | place N pieces | numeral drives the quantity |
| L4 new dress | pieces in row/scatter/ring; second type introduced | count any arrangement; count each type | name/write count per type | count independent of shape & kind |
| L5 mastery: mixed scatter | two+ types, scattered & intermixed | hold a separate count per type despite the jumble | write each type's count | one number per kind, read off the mess |

*(No bare-slate level. Counting is meaningless once the objects are gone — "how many?"
with nothing there is not a question — so this room's terminal push is the mixed scatter,
not bare math. Every other room ends on the slate; this one ends on the hardest real
count.)*

### 4.5 Problem Progression (unknown position)

*(No addition here, so no subtraction stages — the blank's positions give the forward
skill, its reverse, and the multi-type count.)*


- **Slots the blank can occupy:** the numeral (count the given pieces, forward) **or**
  the pieces (a numeral is given, build that many) **or** the next/missing number in a
  sequence (`3, 4, ?, 6`) **or**, at mastery, one numeral *per object type* over a mixed
  scatter (how many squares? how many triangles?).
- **Implicit inverse taught:** number→quantity (the reverse of counting), plus the seed
  of "one more / one less" via the sequence form — the earliest root of subtraction.
- **Sequencing:** count-the-pieces first; build-to-a-number and fill-the-sequence once
  counting is fluent; multi-type counting last, separate groups before the mixed scatter.

## 5. Game Flow

- **Beat 1 — Blocks lead.** Pieces drop into a stack; each placement bumps the tally.
  Counting by doing. Pieces stay in the open, fully visible — no bin to hide them.
- **Beat 2 — Blocks + write.** A built stack appears; the child writes the matching numeral
  beside it. Blocks stay visible.
- **Beat 3 — Blocks fade.** Pieces flash then dim; the child names the count from a look.
- **Beat 4 — Numbers lead.** Given a numeral, the child builds the matching group (reverse).
- **Beat 5 — New dress.** Count pieces in a row, a scatter, a ring — answer only. Then a
  **second type of object** arrives: now there are squares *and* triangles, kept as two
  separate neat groups, and the child counts how many of each.
- **Final Phase — the mixed scatter (mastery).** The two (or three) kinds of object are
  **scattered all about the room and intermixed**. The child must still report how many of
  each — counting one type while ignoring the others, despite the jumble — and write each
  count beside the objects. This is the room's hardest real count and its proof of mastery;
  the objects never leave, because counting without them is nothing.
- **Feel:** quick taps, a climbing tally, the glyph snapping into place beside the pieces.
  Many fast reps.

## 6. When the Room Is "Beaten"

Names counts fast and directly — small groups at a glance, larger ones without losing
track — writes the numeral cleanly across arrangements, and **holds a separate count for
each kind of object even when the kinds are scattered and mixed together**. Shallow tell:
only counts one familiar neat stack; falls apart when pieces are rearranged, or pools two
types into one number when they're intermixed.

## 7. Help When Stuck

Highlight pieces one at a time → count the first few with them, let them finish → show the
tally building → show the number and have them rebuild it. For the mixed scatter: dim every
type but the one being counted, so the target kind stands out, then bring the others back.

## 8. Back to the Kitchen

Most children skip this fast — that skip IS the skip-ahead demo. A child who needs it
returns able to report "how many pieces," unblocking the count inside every later answer.

## 9. Assets Used (see `ASSET_CATALOG.md`)

Scene: `scene.room_generic` (`room_motif`), `scene.help_handoff`
Characters: `tutor_guide`, `reward_payoff`
Manipulables: `block`, `stack`, `pile`
Symbolic: `numeral_glyph`, `tally_readout`, `equation_frame`
Tools: `arrangement_frame`, `slate`
Feedback/control: `check_button`, `hint_affordance`, `feedback_burst`, `progress_indicator`, `affect_camera_indicator`
