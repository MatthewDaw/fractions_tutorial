# Room: {ROOM_NAME} ({SKILL_NODE_ID})

> First-pass room breakdown. **Abstracted and focused on the gaming flow** — the game
> objects, mechanics, and interactions, and how they progress the child from moving
> blocks toward bare numbers. Exact problem numbers, on-screen copy, and verifier
> formulas are left for build time. Grounded in `docs/design/fraction-app-state-model.md`.

---

## 1. Snapshot

- **Skill node:** `{SKILL_NODE_ID}`
- **Comes after / leads to:** `{prereq}` → here → `{successor}`
- **Concept in one line:** what this room teaches.
- **What the child can do after:** the new ability as an action, not a topic.

## 2. The Wall (why the child is here)

The kitchen moment that fails and sends them in: what mom asks, what the child tries,
the one thing they're missing. Short — motivation, not spec.

## 3. The Block↔Number Bridge (the heart of the room)

- **What the blocks mean here** (a stack, a piece, the stick).
- **What the numbers mean** (which numeral maps to which physical thing).
- **The moment they click together** — the beat of play where the number *is* the blocks.

## 4. Game Objects, Mechanics & Interactions

The concrete building blocks of this room's mini-games. Spell these out clearly.

### 4.1 Objects (the nouns on screen)
List each interactive/visible object and what it represents. For each: its role, and
whether it persists, fades, or transforms as the fade progresses. (e.g. unit-piece,
stack, ruler, target line, fraction label with lockable numerator/denominator,
tool-of-the-room, check button, mom. Blocks always sit in the open — stacked or loose —
never inside a bin/can/cup whose walls could hide a piece; see the ASSET_CATALOG design law.)

### 4.2 Mechanics (the rules governing the objects)
The rules of the world: what snaps, what locks, what's legal, what the win condition
is, what happens on a wrong move. State each as a rule. (e.g. "pieces snap to a grid,"
"the denominator is locked this beat," "a whole unit locks when full and the next begins,"
"only same-size pieces may merge.")

### 4.3 Interactions (the player verbs)
What the child actually does, by input modality (drag, tap, write, speak). Map each
verb to the action it emits. Note which verbs are new to this room vs. carried from
earlier rooms.

### 4.4 Progression of objects & mechanics across the fade
A short table or list showing how the SAME objects/mechanics change support level by
level — what appears, what locks, what disappears — so the block→number fade is a
property of the objects, not just the narration.

| Level | Objects present | Key mechanic active | Player verb | Block↔number link shown by |
|-------|-----------------|---------------------|-------------|----------------------------|
| L0 blocks lead | … | … | … | … |
| L1 blocks + write number | … | … | … | … |
| L2 blocks fade | … | … | … | … |
| L3 numbers lead | … | … | … | … |
| L4 new dress | … | … | … | … |
| L5 bare + ghost backdrop | problem text; the room's objects faded behind, non-interactive | bare math, objects only as a memory anchor | **write answer with stylus** | symbols stand alone; the backdrop then dissolves |
| L6 bare slate | problem text only, empty slate | no manipulatives at all | **write answer with stylus** | nothing but the symbols remain |

*(Exception — the COUNT room has no bare-math levels. A count with no objects to count is
not a question, so R0a ends on its hardest real count instead; see `01_R0a_count.md`.)*

### 4.5 Problem Progression (operation × unknown position)

**Every problem is an equation with exactly one blank, and the blank can sit in any
part — an operand or the answer.** The child always fills the one unknown. Two things
vary: the **operation** (add vs. subtract) and the **position of the blank**.

**For rooms that do addition** (R0b, R1, R2, and the kitchen), the room runs an
explicit four-stage progression — each stage one step harder than the last:

1. **Addition, blank = answer** — forward addition (`3 + 2 = ?`).
2. **Addition, blank = a part** — missing addend (`3 + ? = 5`); subtraction's logic in
   addition's clothes (counting up to the total).
3. **Subtraction, blank = answer** — explicit forward subtraction (`5 − 2 = ?`); this
   introduces the room's one new block move: **take pieces away** (remove from a stack)
   rather than merge.
4. **Subtraction, blank = a part** — missing minuend/subtrahend (`5 − ? = 2`,
   `? − 2 = 3`).

**For non-addition rooms** (R0a count, R3 simplify, R4 improper→mixed) there is no
subtraction stage; the blank's two positions instead give the forward skill and the
room's reverse transform (see each room's §4.5).

- **This axis composes with the block→number fade (§4.4); it does not replace it.**
  Each stage still fades L0→L6. Subtraction reuses the same objects, so its fade can
  move faster — the child already knows the manipulatives; only "remove instead of
  merge" is new.
- **At block levels the operation is physical.** Addition merges stacks; subtraction
  **removes** pieces from a stack (or, for a missing addend, adds pieces *up to* a
  shown total — the gap is the answer).
- **Sequencing, not full random:** within a stage the blank starts in the answer and
  migrates to a part once the forward direction is fluent; stages run 1→4 in order.
  The blank-in-a-part forms double as the transfer test (a child who only
  pattern-matched the forward layout fails when the blank moves).

State here, per room: the four stages with concrete examples, and the new block move
subtraction introduces.

## 5. Game Flow (played sequence)

The mini-games as a played arc, beat by beat in plain language ("child does X, game
responds Y"), showing support fading. This is the §4 objects/mechanics *in motion*.

- **Beat 1 — Blocks lead.**
- **Beat 2 — Blocks + the number named (binding beat).**
- **Beat 3 — Blocks fade.**
- **Beat 4 — Numbers lead.**
- **Beat 5 — New dress (transfer).**
- **Penultimate Phase — bare math, objects behind.** The workspace clears to just the
  problem, but the room's objects (stacks, bars, whole-units, the ruler) linger as a
  **faded, non-interactive backdrop** behind the equation — a memory anchor, not a tool.
  The child solves it as bare arithmetic and **writes the answer with the stylus**; then
  the backdrop dissolves. This is the gentle hand-off between "numbers, blocks as a check"
  and a truly empty slate.
- **Final Phase — bare math on the slate.** Every block, bar, whole-unit, tally, and tool
  is GONE. The screen shows only the problem and an empty slate. The child solves it as a
  plain arithmetic question and **writes the answer by hand with the stylus** — no
  dragging, no tapping a pad, no manipulatives of any kind. This is the same terminal
  state for every room (except COUNT): the scaffolding has fully left the screen and lives
  only in the child's head. (The recognized handwriting is checked by the same verifier;
  this is the app's "on paper" end state from the philosophy doc.)
- **Feel:** the juice — the small wins, the satisfying snaps.

## 6. When the Room Is "Beaten"

Plain terms: real mastery (fast, direct, numbers only, holds in new-dress) vs. shallow
(riding the blocks / the misconception this room targets). One short paragraph.

## 7. Help When Stuck

Escalating nudges, abstract: point at where to look → suggest the move → show one step
→ show it and ask again.

## 8. Back to the Kitchen

The payoff beat: the stumping recipe now winnable, what the child feels, and which
wall (if any) comes next.

## 9. Assets Used (see `ASSET_CATALOG.md`)

Reference assets by **ID only** — all detail (states, theming rules) lives in the
catalog. Group by category; do not redescribe what the asset is.

Scene: `scene.*`, `room_motif`
Characters: `tutor_guide`, `reward_payoff`
Manipulables: `block`, `stack`, `ruler`, … (only those this room uses)
Symbolic: `numeral_glyph`, `fraction_label`, `operator_glyph`, `equation_frame`, …
Tools: room-specific verb-objects + `slate`
Feedback/control: `check_button`, `hint_affordance`, `feedback_burst`, `progress_indicator`, `affect_camera_indicator`
