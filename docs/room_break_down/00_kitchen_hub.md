# Room: Mom's Kitchen (KITCHEN_HUB)

> First-pass room breakdown. Abstracted, gaming-flow focused. The kitchen is the hub:
> where the goal lives, progress is shown, and every wall is thrown. Grounded in
> `docs/design/fraction-app-state-model.md`.

---

> **Scene & layout:** this scene's on-screen layout follows the play-space-first scene grammar in
> `docs/design/presentation-scene-architecture.md` (§4 space-trade, §4.1 complexity budget,
> §5 goal-communication). Its precise per-beat scene breakdown is in that doc's §10.

## 1. Snapshot

- **Skill node:** `KITCHEN_HUB` (hub, not a graded skill node)
- **Comes after / leads to:** home base. Sends the child *out* to the room that fits the
  gap the current recipe exposed; receives them *back* to prove it.
- **Concept in one line:** cooking with mom is the reason we add fractions — measuring is
  fraction addition.
- **What the child can do after:** want the goal. Leave the first time *frustrated in a
  good way* — they can see a recipe they can't yet finish.

## 2. The Wall (the kitchen makes everyone else's)

No wall of its own. Two opening games set the hook; every later return raises a recipe
the child's current tools can't finish cleanly, and that shortfall picks the next room.

## 3. The Block↔Number Bridge

- **What the blocks mean here:** an ingredient amount. A stack of same-size blocks built
  up against the ruler to a mark *is* an amount of an ingredient. Blocks stay discrete
  and visible — what you pick up and put down is exactly what you count.
- **What the numbers mean:** the target mark on the ruler is labeled as a fraction
  (¾). The number on the ruler and the height of the stack are the same fact, twice.
- **The moment it clicks:** the child stacks blocks to the mark, the label lights up —
  picture (stack height) and symbol (¾) confirmed as one thing.

## 4. Game Objects, Mechanics & Interactions

### 4.1 Objects (the nouns on screen)
- **Recipe card** — what mom is making; lists the amount(s) needed. The source of every
  problem. Persists as the framing object the whole game.
- **Ruler** — the upright graduated measuring reference with labeled marks; the child
  stacks blocks up against it. One full ruler length = one whole. (Discrete blocks, no
  liquid.)
- **Target mark** — the labeled mark on the ruler the stack is built to (the fraction
  asked for). The thing a stack is measured to.
- **Blocks** — draggable same-size pieces (e.g. ¼ units), the ingredient; stacked
  against the ruler.
- **Piles** — pre-made groups of blocks mom hands over (used in Predict-the-Sum).
- **Answer slot** — where the child states the total *as a number* (tap-a-number pad,
  type, write, or speak) in the prediction game.
- **Mom** — the reactive character; her approval/treat is the reward signal.
- **Treat** — the dish that forms as recipes succeed; the long-arc progress meter.

### 4.2 Mechanics (the rules)
- Blocks **snap** into the stack and build cleanly **against the ruler**; the stack
  height is read to the ruler's marks.
- A stack **at the target mark** triggers a glow + mom's approval; **overshoot** past
  the mark wobbles and doesn't lock.
- In Predict-the-Sum, the **answer slot must be filled before stacking is allowed** — the
  question is "name it first," so eye-matching is blocked as the primary path.
- A required-but-unmastered skill on the recipe → **WALL_HIT** → route to a room.
- Across returns, the kitchen **fades support**: fewer blocks offered, a shorter ruler,
  then numbers only, then paper.

### 4.3 Interactions (player verbs)
- **Drag block → stack (against the ruler)** (place_block) — Match-a-Height's core verb.
- **Remove block from the stack** (remove_block) — the take-away verb, used for
  subtraction recipes (see §4.5).
- **State the answer** (submit_answer) via tap/type/write/speak — Predict-the-Sum's verb
  (total for addition, what's-left for subtraction).
- **Tap to check** (after predicting) — stack to the ruler to confirm the named number.

### 4.4 Progression of objects & mechanics
| Stage | Objects present | Key mechanic | Player verb | Link shown by |
|-------|-----------------|--------------|-------------|---------------|
| Match-a-Height | ruler, target mark, blocks | stack-to-mark glow | drag block → stack | label sits at the mark being built to |
| Predict-the-Sum (early) | two piles, ruler, answer slot | name-before-stack | state total, then check | predicted number verified by stacking to the ruler |
| Later returns | shrinking blocks → numbers only | progressive fade | state total (no stacking) | child notices blocks no longer needed |
| Bare + faded kitchen | problem text; ruler & stacks faded behind, non-interactive | bare math, objects as a memory anchor | **write answer with stylus** | symbols stand alone; the backdrop then dissolves |
| Final phase | problem text only, empty slate | no manipulatives at all | **write answer with stylus** | nothing but the symbols remain |

### 4.5 Problem Progression (operation × unknown position)

The kitchen poses both directions as cooking situations, mirroring the four-stage flow
the rooms drill:

1. **Addition, blank = answer** — combine two ingredient amounts: "how much total?"
2. **Addition, blank = a part** — "you've stacked this much; how much *more* to reach the
   mark?" (build up to the target — counting up).
3. **Subtraction, blank = answer** — over-stacked / scaling down: "the stack has this
   much; take this much off — what's left?" The block move is **removing blocks** from
   the stack (take-away).
4. **Subtraction, blank = a part** — "you need to remove some to land on the mark — how
   much?"

- **New block move:** **remove blocks** from the stack, the inverse of stacking on.
- **Sequencing:** the kitchen leans on whatever stage the child's rooms have unlocked; a
  subtraction recipe that the child can't yet do throws the wall that sends them to the
  room to drill that stage, same as addition.

## 5. Game Flow

- **Game A — Match-a-Height (opener).** Mom asks for an amount; the labeled target mark
  appears on the ruler; the child drags same-size blocks, stacking them up against the
  ruler until the stack hits the mark. Glow + treat. No math — plants the goal, gives a
  familiar win.
- **Game B — Predict-the-Sum (the bar rises).** Mom hands two same-block piles, the
  answer slot demands the total *first*. The old eye-match move no longer answers it.
  Name it → advance; can't → WALL_HIT → routed to the missing-skill room (further
  upstream if even counting/adding the blocks is the gap).
- **Across returns:** recipes return with less scaffolding each time; the child *feels*
  the blocks fall away.
- **Penultimate Phase — bare math, kitchen behind.** The workspace clears to just the
  recipe's question, but the ruler and the stacks linger as a **faded, non-interactive
  backdrop** behind the equation — a memory anchor, not a tool. The child solves it as bare
  arithmetic and **writes the answer with the stylus**; then the kitchen backdrop dissolves.
- **Final Phase — bare math on the slate.** The last recipes drop the ruler, the blocks,
  and the stack entirely. Mom states the amounts as a plain fraction-addition question
  and the child **writes the answer by hand with the stylus** on an empty slate — no
  stacking, no tapping. The cooking wrapper has fully receded; the child is just adding
  fractions on paper. This is the same terminal state every room converges to.
- **Feel:** snap-and-glow, mom's reactions, the treat forming — and the good kind of stuck
  in Game B.

## 6. When the Kitchen Is "Beaten" (the whole game)

The child finishes once-walling recipes with numbers alone, quickly — the blocks have
moved into their head and the cooking wrapper is no longer needed.

## 7. Help When Stuck

Mostly: name the gap and route ("that one's tricky — let's go practice it"). The kitchen
hands rooms, not hints. In Match-a-Height, a light nudge highlights the next block.

## 8. Back to the Kitchen

This room IS the payoff for every other room: the child returns onto the exact recipe
that stumped them, plays it, wins — fueling the willingness to face the next wall.

## 9. Assets Used (see `ASSET_CATALOG.md`)

Scene: `scene.hub`, `scene.bare_slate`, `scene.help_handoff`
Characters: `tutor_guide`, `reward_payoff`
Manipulables: `block`, `stack`, `pile`, `ruler`, `target_mark`, `merge_zone`
Symbolic: `numeral_glyph`, `fraction_label`, `operator_glyph`, `equation_frame`
Tools: `slate`
Feedback/control: `check_button`, `hint_affordance`, `feedback_burst`, `progress_indicator`, `affect_camera_indicator`
