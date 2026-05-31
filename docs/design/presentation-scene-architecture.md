# Presentation & Scene Architecture

> The contract that sits between **engine state** (what exists, logically) and **art**
> (what it looks like). It defines the asset/presentation model, the interaction
> primitives, the scene-region grammar, the goal-communication rules, and the swappable
> **Skin** seam that lets a design layer drop in later without touching game logic.
>
> Companion: `docs/design/asset-manifest.md` (the complete art checklist),
> `docs/room_break_down/ASSET_CATALOG.md` (functional roles + states), and the Phase-1
> build plan `docs/plans/2026-05-31-001-feat-playable-game-shell-plan.md` (which builds
> against this). This doc is the contract; the manifest is the production list.

---

## 1. The three-layer separation (why a design layer can drop in later)

Everything visible is produced by three layers with hard boundaries:

```
[1] ENGINE STATE (logical)        → counts, sizes, slots, beat, target, locked flags.
                                     No pixels, no positions. (Python engine.)
        │  selectors
        ▼
[2] PRESENTATION NODES (skin-agnostic) → "a 5-tall stack of sevenths sits in the play
                                     space, draggable, measured to the ruler; its numeral
                                     sits attached to it, same hue." Logical layout +
                                     affordance + state, still NO concrete art. (Web client.)
        │  Skin.render(node)
        ▼
[3] SKIN (swappable)              → the actual art / typography / color / sound / motion
                                     bound per functional ID + state. THE design layer.
```

The seam you care about is **between [2] and [3]**. Layer 2 emits a stable description of
*what functional thing is where, in what state, with what affordance*. A **Skin** supplies
the concrete look for each functional ID + state. Swap the Skin and the game looks
completely different; layers 1 and 2 are untouched. A **wireframe Skin** (boxes, lines,
system font) ships first so the game is fully playable and testable before any art exists;
your design layer is just a second Skin.

**Invariant:** a Skin may change how things *look*; it may never change what exists, where
it's laid out, what's interactive, or what state it's in. Those are layers 1–2. This is what
makes design iteration safe: a bad skin can't break the game.

---

## 2. The presentation-node model

Layer 2 turns engine state into a flat list of **presentation nodes**. One node = one
on-screen functional thing. Directional shape (not final code):

```ts
type PresentationNode = {
  id: FunctionalId          // 'block' | 'stack' | 'ruler' | 'fraction_label' | ...
  instanceKey: string       // stable identity across frames (for animation/diffing)
  state: string             // a state from the manifest, e.g. 'at_target', 'denominator_locked'
  props: Record<string, …>  // render params: { count, denominator, orientation, value, ... }
  region: RegionId          // which scene region it belongs to (§4)
  layout: {                 // logical placement WITHIN its region, resolution-independent
    x: number; y: number    // 0..1 fractions of the region
    w?: number; h?: number  // logical extent; for size-bearing assets, DERIVED from props
    anchor?: 'center'|'bottom'|...    // how it sits relative to (x,y)
    z?: number
  }
  affordance: Affordance    // 'static' | 'draggable' | 'drop_target' | 'tappable' | 'writable'
  link?: string             // grouping key for the block↔numeral color link + co-location (§5)
  emphasis?: boolean        // teaching-target highlight (§5); at most one per beat
}
```

Rules:

- **Size-bearing assets derive extent from props, not from art.** `stack.layout.h` =
  `count × unitHeight(denominator)`; `block`'s size = `unitHeight(denominator)`; one
  `ruler` length = one whole. Layer 2 computes these from engine state so the *math stays
  legible regardless of skin*. The Skin may style the block, but the block's height is owned
  by layer 2 (Global art law #3). A skin that wants a block 20% taller than its slot is
  illegal.
- **State is owned by the engine/selectors, never the skin.** `denominator_locked`,
  `at_target`, `ghost`, `removed` come from state. The Skin only decides what each looks
  like.
- **`link` ties a quantity to its numeral, and co-locates them.** A stack and the
  `fraction_label` that names it share a `link` key; during binding beats layer 2 places the
  label **attached to the stack** and the Skin shares a hue / draws a connector (§5.2).
- **`affordance` is logic, not art.** What's draggable/tappable is decided here; the Skin
  must make it *read* as such but cannot add or remove interactivity.

The full per-asset prop/state/affordance/region list is the manifest (§5–§9 there).

---

## 3. Interaction primitives (gesture → action)

There is a **small fixed set of interaction primitives**. Each room composes these; rooms
do not invent new input handling. Each primitive hit-tests against presentation nodes,
checks legality, and emits an **engine action** (the same `Action` the Python engine
reduces and the Phase-3 synthetic harness emits).

| Primitive | Gesture | Targets | Emits action | Used by |
|-----------|---------|---------|--------------|---------|
| **place** | drag a `block`/`pile` piece → a drop zone | `drop_target` (build zone, stack, arrangement) | `place_block` | R0a, R0b, R1, kitchen |
| **remove** | drag a piece off a stack | `draggable` on a stack's pieces | `remove_block` / `remove_pieces` | R0b, R1, R2, kitchen |
| **merge** | drag one stack → another (merge zone) | `drop_target` (merge zone) | `merge_stacks` | R0b, R1, R2 |
| **slice** | drag the `slicer_tool` across a bar | `draggable` tool over a bar | `slice_bar` | R2 |
| **fuse** | select K pieces / drag the `fuse_tool` | grouping on a stack | `fuse_by_k` | R3 |
| **group-wholes** | stack pieces against the ruler until a whole locks | build zone + ruler | `group_wholes` | R4 |
| **pick** | tap a choice (denominator/factor/multiplier) | `tappable` (picker/tray) | `select_*` | R2, R3 (faded beats) |
| **write** | write/type an answer on the slate/pad | `writable` (slate) | `answer_submit{value, modality}` | all (binding + bare beats) |
| **check** | tap the check button | `tappable` | `submit_answer` / confirm | all |

Rules:

- **Legality is enforced before emit.** A drop is accepted only on a legal `drop_target`
  (e.g., unlike-size pieces can't merge in R2 before slicing → no action, `shake_reject`
  feedback). Legality comes from engine rules, not the skin.
- **Gestures never mutate state directly.** They emit an action; the engine reduces it; the
  new state flows back and re-renders. (Server-authoritative per the build plan; only T1
  reflex feedback is local — see §6.)
- **One primitive, many skins.** The drag feel is owned by the primitive; the skin only
  supplies the look of the thing being dragged and the drop zone.

---

## 4. Scene-region grammar (the play space is the hero)

**Core rule: the play space dominates the screen, and it trades space with the symbol
surface as the fade progresses.** Chrome is thin and mostly contextual. Logical stage
**1280×800 (16:10), landscape**; regions are fractions of the stage so the skin restyles
but never re-lays-out.

Regions (same in every scene, kitchen and all rooms):

- **Goal cue (top, slim ~9%):** what to do / what's being taught. **Spoken first**, with a
  visual cue; on-screen text minimal (§5.1). Persistent but thin.
- **Play space (the stage, dominant):** the manipulables live here. Source pieces (`pile`s)
  **dock at the edge of the play space**, not in a separate column. Room tools (slicer,
  fuse, picker) appear **inside the play space only in the beats that use them**, never as a
  persistent dock. The `ruler` runs along the measuring edge.
- **Symbol surface (space-trading, not a fixed column):** at blocks-lead it is tiny (a label
  attached to its quantity). It grows as blocks fade, and at the bare beats it becomes the
  full-screen `slate`. Block footprint and symbol footprint trade across L0→L6 — the layout
  itself enacts the physical→symbolic fade.
- **HUD (bottom, slim, mostly contextual):** only the **check action** and a **quiet
  progress/treat cue** persist. Hint appears when offered; `star_rating` on result;
  `rationale_banner` on adaptation (Phase 2). Big touch targets.
- **Corners:** `tutor_guide` (reacts, speaks the goal); `affect_camera_indicator` (Phase 3).

Diagram — L0 (blocks lead), play space ~80%:

```
┌───────────────────────────────────────────────────────────┐
│ GOAL CUE  (slim · spoken first · minimal text)       ~9%   │
├───────────────────────────────────────────────────────────┤
│                                                            │
│                   PLAY SPACE   (~80%)                      │
│     manipulables · ruler along the edge                    │
│     piles docked at the edge · tools only when used        │
│     [ tiny symbol label attached to its quantity ]         │
│                                                            │
├───────────────────────────────────────────────────────────┤
│ HUD (slim): check · quiet progress    ~11%    tutor corner │
└───────────────────────────────────────────────────────────┘
```

### The space-trade across the fade

The play space and the symbol surface swap dominance as the child needs the blocks less.
This replaces a fixed symbol column and makes the fade visible in the layout itself:

| Beat | Play space (blocks) | Symbol surface | What the child feels |
|------|---------------------|----------------|----------------------|
| L0 blocks lead | ~80%, leads | tiny (tally only) | "I'm building" |
| L1 + write (bind) | ~70% | numeral **attached to the stack** | "this stack IS this number" |
| L2 blocks fade | ~55%, ghosting | label grows; predict-then-check | "name it, then check" |
| L3 numbers lead | ~30%, a small check | equation leads (~55%) | "I mostly use numbers now" |
| L4 new dress | ~30%, check | equation, novel surface | "same idea, looks different" |
| L5 bare + ghost backdrop | faded backdrop only (fade-on-demand) | dominant | "I barely need the blocks" |
| L6 bare slate | gone | slate = 100% | "I've got it" |

(R0a counting has no L5/L6: objects never leave, because a count with nothing to count is
not a question. Its terminal beat is the mixed scatter filling the play space.)

### 4.1 Complexity budget (one-glance readability)

A child must parse the screen in one glance. Cap what is **visible and active** at any beat:

> manipulables for this problem **+ at most ONE active room tool + ONE symbol target**
> (the thing being filled) **+ the check action.**

Everything else (other tools, pickers, trays, hints, stars, rationale, secondary readouts)
is **contextual**: shown only at the moment its beat calls for it, then gone. If a beat
needs more than the budget, split it into two beats. **R2 is the validation case** (it has
the most candidate elements): at any R2 beat show the two bars + the slicer (one tool) + the
equation target + check; the `common_size_guide` and the `denominator_picker` appear only in
the specific beat that uses them, never alongside each other.

---

## 5. Goal-communication rules (how the scene teaches)

Requirements on layers 2–3, not optional polish:

1. **Voice-first, low-text goal.** The goal and the current action are communicated by the
   `tutor_guide`'s voice plus a visual cue **first**. On-screen text is minimal and **never
   required to play** — the Counting and Add-whole rooms target pre/early readers, so a
   child who can't read must still know what to do. Text supports; it never gates.
2. **Spatial contiguity: the numeral lives next to its quantity.** During binding beats
   (L0–L2) the numeral/label that names a quantity renders **attached to that quantity** in
   the play space (touching or connected, same hue via `link`), never parked in a distant
   column. "This stack IS this number" must be spatial, not inferred. The dedicated symbol
   surface only takes over once the blocks have faded.
3. **One foregrounded count.** Do not show the same number three ways at once (tally +
   numeral + stack height all competing). During binding, foreground **one** running
   representation and keep the others quiet (Mayer redundancy / coherence).
4. **Teaching-target emphasis (signaling), exactly one at a time.** The asset the room is
   about carries `emphasis`: R1 the locked denominator (padlock), R2 the mismatched widths +
   the ×N on top and bottom, R3 the height-holds guide, R4 the overflow crossing one whole.
   The Skin gives `emphasis` a clear "look here" treatment.
5. **Contextual chrome.** Only the check action and a quiet progress/treat cue persist.
   Hint appears when offered; star on result; rationale on adaptation; room tools only in
   their beats. Nothing persistent competes with the play space.
6. **One clear action per beat.** Each beat has exactly one obvious next action; its
   affordance is the most prominent interactive thing on screen; everything else is calmer
   (Krug: don't make me think).
7. **Honest, instant feedback.** correct / incorrect / at-target / over-target are distinct,
   reflexive, gentle (T1, §6). Errors never punish.
8. **Progress + structure.** `progress_indicator` / `reward_payoff` show advancement; the
   optional `skill_map` (manifest §10) makes the goal *structure* visible (the pedagogy
   review's recommendation to put the mental model in the child's head, not just the engine).

---

## 6. Responsiveness layering (where rendering happens)

Consistent with the build plan's client/server split:

- **T1 reflex (instant, client-side, skin-rendered):** snap, glow at target, shake on
  reject, count-tick. These read only the current gesture, never the model. They make the
  game feel instant without a round-trip. (`feedback_burst` states.)
- **Semantic actions (engine-authoritative):** every primitive (§3) emits an action to the
  Python engine; the new state flows back and layer 2 rebuilds nodes; the Skin re-renders.
- **The skin never decides game outcomes** — it animates them. "Correct" is decided by the
  verifier; the skin shows the `correct` state.

---

## 7. The Skin contract (the swappable design layer)

A **Skin** is one module that renders every functional ID + state. Directional interface:

```ts
interface Skin {
  meta: { id: string; name: string }                 // e.g. 'kitchen', 'spaceship'
  scene(region: RegionId, state): SceneStyle          // backdrop/region styling
  render(node: PresentationNode): Visual              // art/typography/color for id+state
  palette(denominator: number): Hue                   // the per-denominator-family hue (§5.2)
  motion(node, fromState, toState): Transition         // how a state change animates
  sound?(event): SoundCue                              // optional audio per event/state (incl. spoken goal)
}
```

A Skin **must**:

1. Provide a `Visual` for **every** functional ID + state in the manifest (no gaps).
2. Honor `palette(denominator)` consistently so same-size pieces and their numerals match.
3. Preserve **affordance readability** (draggable looks grabbable, `denominator_locked`
   looks locked, `ghost` looks non-interactive, `writable` looks writable).
4. Preserve **size/extent** owned by layer 2 (a block fills its computed slot; it does not
   resize the math).
5. Give `emphasis` a clear "look here" treatment.
6. Support every state's required read (e.g., `over_target` clearly differs from
   `at_target`).

A Skin **must NOT**:

- Change which region a node is in, or its logical layout/extent (including the §4 play-space
  dominance and the space-trade).
- Add, remove, or change interactivity (`affordance`).
- Change or infer game state, correctness, or mastery.
- Drop a state or collapse two states into one look.

### Wireframe Skin first

Ship a **`wireframe` Skin** before any art: boxes for blocks/stacks (sized by props), a
ruled line for the `ruler`, system font for all glyphs, flat palette by denominator, simple
tween motion, no sound. The entire game is playable and testable in the wireframe Skin. The
**Kitchen** Skin (the art from the manifest) is the second Skin and drops in by satisfying
the contract above. Future themes are additional Skins. This is the path that lets you
"add the design layer as you figure out what it will be."

---

## 8. How this maps to the build

- **Python engine** (Plan 1 U2/U3): owns layer 1 (state) and the verifier. Emits state over
  the wire; knows nothing about pixels.
- **Web client selectors → presentation nodes** (Plan 1 U6/U7): layer 2. Turns the received
  `GameState` + the room's `RoomSpec` into `PresentationNode[]` with regions, layout,
  affordances, links, emphasis — applying the §4 play-space dominance + space-trade and the
  §4.1 complexity budget.
- **Skin** (Plan 1 U6): layer 3. `wireframe` first; `kitchen` second. The asset registry in
  the plan IS the Skin lookup (`functional ID + state → Visual`).
- **Interaction primitives** (Plan 1 U7): the §3 table, each emitting an engine action.
- **Scene-region grammar + goal communication** (Plan 1 U7): the §4/§5 rules, applied by
  `RoomView` consistently across rooms.

See the Phase-1 plan for unit-level detail and test scenarios.

---

## 9. Design rules this scene design follows

Both normal video-game rules and ed-tech game rules. Each maps to a section above, so the
doc is self-checking.

- **Intrinsic integration (ed-tech):** the math IS the mechanic; the only reward is the
  cooking goal itself. No bolted-on point system competes with learning.
- **The play space is the hero (game):** the stage dominates; chrome is thin and contextual.
  (§4, §4.1)
- **One clear action at a time (game + Krug):** one obvious next move per beat. (§5.6)
- **Minimize extraneous load (Sweller; Mayer coherence):** cut chrome, cap on-screen
  elements, one foregrounded count. (§4.1, §5.3, §5.5)
- **Spatial contiguity (Mayer):** the numeral sits next to its quantity during binding.
  (§5.2)
- **Signaling (Mayer):** emphasize exactly one teaching target. (§5.4)
- **Concreteness fading, enacted in the layout (ed-tech):** blocks and symbols trade screen
  space across L0→L6. (§4 space-trade)
- **Voice-first / works for pre-readers (game for young children):** goal spoken + visual;
  text never gates play. (§5.1)
- **Juicy, instant feedback (game feel):** T1 snap/glow/shake/burst. (§6, §5.7)
- **Conventions + big touch targets:** check at the bottom, obviously-clickable affordances,
  large targets for small hands (aim ≥60px for primary manipulables/buttons, above the 44px
  web minimum). (§4, §5.5)

---

## 10. Per-room scene breakdown (precise, at the lead beat)

Each room's L0 (lead) scene, region by region, with the single clear action and the one
emphasis target. Later beats follow the §4 space-trade and the §4.1 budget. Every layout
obeys: play space dominant, source docked at the edge, tools only when used, numeral
attached to its quantity during binding, voice-first goal, contextual chrome.

### Kitchen hub (Match-a-Height / Predict-the-Sum)
- **Goal cue:** mom asks for an amount (`recipe_card`), spoken ("three quarters of a cup").
- **Play space:** upright `ruler` + labeled `target_mark` (¾) + a `pile` of ¼ `block`s
  docked at the edge; child stacks to the mark. In Predict-the-Sum: two piles + an
  answer slot that must be filled before stacking.
- **Symbol:** the fraction label on the target mark (attached to the ruler); the answer slot.
- **HUD:** check, treat/progress; `tutor_guide` in corner.
- **One action:** stack to the mark (or fill the answer, then check).
- **Emphasis:** the target mark.

### R0a Counting Room
- **Goal cue:** "How many?" (spoken; visual point at the group). No reading required.
- **Play space:** pieces of one type loose in the open + a forming `stack`; live
  `tally_readout` (the one foregrounded count). Terminal beat: two+ object types scattered
  and intermixed, counted per type.
- **Symbol:** the numeral, written on the `slate` **beside the group** at L1 (binding).
- **HUD:** check, progress.
- **One action:** place a piece (count by doing) / write the count.
- **Emphasis:** the piece being counted / the climbing tally.

### R0b Combining Room (Add-whole)
- **Goal cue:** "How many altogether?" (spoken).
- **Play space:** two labeled `stack`s + the `merge_zone` gap; the `+` lives in the gap.
- **Symbol:** count-up readout; the total numeral attaches to the merged stack at L1.
- **HUD:** check, progress.
- **One action:** drag the two stacks together.
- **Emphasis:** the merge gap (the `+`).

### R1 Same-Pieces Room (Add-same-denominator)
- **Goal cue:** "two sevenths plus three sevenths" (spoken; the equation shown small).
- **Play space:** two same-size stacks of sevenths + `ruler` + `merge_zone`; the
  `fraction_label` with the **denominator padlocked**.
- **Symbol:** the running fraction (top climbs, bottom locked), attached to the stack.
- **HUD:** check, progress.
- **One action:** merge the stacks.
- **Emphasis:** the locked denominator (padlock).

### R2 Matching-Sizes Room (Add-unlike-denominator) — the budget case
- **Goal cue:** "one half plus one third" (spoken).
- **Play space:** two visibly **mismatched** bars + the `slicer_tool` (the one tool shown);
  the child slices each bar until the pieces match, then merges. The `common_size_guide` and
  `denominator_picker` appear only in their own faded beats, never together (§4.1).
- **Symbol:** ×N on top and bottom as a bar is sliced (attached to the bar).
- **HUD:** check, progress; `star_rating` on result (full for the LCD, fewer for a bigger
  common size — see R2 §4.6).
- **One action:** slice a bar (then merge once they match).
- **Emphasis:** the mismatched widths + the ×N.

### R3 Tidying Room (Simplify)
- **Goal cue:** "tidy six eighths" (spoken).
- **Play space:** a messy bar of many small pieces + the `fuse_tool` + the height-holds
  guide; `factor_tray` only in faded beats.
- **Symbol:** ÷K on top and bottom when a fuse succeeds (attached to the bar); a quiet
  "fewest pieces" meter.
- **HUD:** check, progress.
- **One action:** fuse K pieces into one bigger piece.
- **Emphasis:** the height-holds guide (amount unchanged) while pieces fuse.

### R4 Whole-Units Room (Improper→Mixed)
- **Goal cue:** "nine sevenths" (spoken).
- **Play space:** a tall overflow `stack` + `ruler` + `whole_unit_row` + `leftover_tray`;
  the child groups pieces into wholes against the ruler.
- **Symbol:** whole-unit counter + `mixed_number_slots` (attached to the wholes + leftover).
- **HUD:** check, progress.
- **One action:** group pieces into a whole against the ruler (repeat for the overflow).
- **Emphasis:** the overflow crossing one whole on the ruler.

### Shared terminal — bare slate (L6, every room except R0a)
- **Goal cue:** the equation, top.
- **Play space → slate:** the slate fills the stage; the child writes the answer by hand.
- **HUD:** check.
- **One action:** write the answer.
- **Emphasis:** none needed; the problem is the only thing on screen.
