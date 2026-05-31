# Asset Manifest (Art Brief)

> The single, complete list of every visual asset the fraction game needs, written so
> you (or an artist) can produce the design/art **outside this conversation**. Each asset
> says what it represents, what the art must communicate, every state that needs its own
> art, its size/encoding rules, and where it appears. Work top to bottom; check off as you go.
>
> Companion docs: functional roles + states are mirrored from
> `docs/room_break_down/ASSET_CATALOG.md`; how assets are laid out, interacted with, and
> skinned lives in `docs/design/presentation-scene-architecture.md`. This file is the
> production checklist; that file is the contract.

---

## 0. How to use this doc

- An **asset** is named by its **functional role** (`block`, `ruler`, `slate`), never its
  look. You are producing one concrete art set per role. Reskinning the whole game later
  (kitchen → spaceship → garden) means producing a *new* art set for the same roles — the
  game logic never changes. This art set is the first **Skin** (theme: **Kitchen**).
- **Every listed state needs its own art** (or a defined transition to it). States drive
  game logic; the art may restyle a state but must never drop one.
- **Preserve the affordance.** A `block` must read as countable and stackable; a `ruler`
  must read as something you measure against; a `slate` must read as writable; a draggable
  thing must look grabbable; a locked thing must look locked.
- **Preserve the invariant relationships** (size rules below). These carry the math. If the
  art breaks them, the teaching breaks.
- Checkboxes are per **state** so "done" means every state is drawn.

---

## 1. Global art laws (read before drawing anything)

These are non-negotiable; they come from the design (see ASSET_CATALOG §C and the room docs).

1. **Discrete blocks only — never a liquid/continuous amount.** A quantity is always a
   countable number of separate blocks. A block looks the same picked up, put down, added,
   or removed. The thing you manipulate is exactly the thing you count.
2. **Nothing is ever hidden inside a container.** No bins, cans, jars, cups, or vessels
   with walls that could obscure a block. Loose groups sit in the open (a `pile`); counted
   groups are built into a `stack`. Quantities are read by measuring a stack against a
   `ruler`, never by filling a vessel.
3. **Size encodes meaning (the most important rule).**
   - A `block`'s size = the size of its fraction piece. A 1/7 block is **visibly smaller**
     than a 1/3 block. "Smaller piece = bigger denominator" must be obvious at a glance.
     This visual mismatch *is* the R2 lesson.
   - A `stack`'s height (or a bar's length) = count × block-size.
   - One full `ruler` length = one whole. The `ruler` is the measuring truth everything is
     read against. Stacks and the ruler must stay visually comparable.
4. **Color encodes the piece-size, and links blocks to their numeral.** All pieces of one
   denominator share one hue (all sevenths are, say, teal). The numeral/fraction that names
   that quantity shares the hue. This color link is how a child sees "this stack *is* this
   number." Reserve a consistent palette: one hue per denominator family, plus dedicated
   roles for ghost (faded outline), correct (affirming), incorrect (gentle alert), and the
   child's own handwriting ink.
5. **The teaching target is always visually emphasized.** Whatever the current room is
   teaching gets a highlight treatment: R1's locked denominator (padlock + emphasis), R2's
   mismatched widths (made unmissable), R4's overflow past one whole (unmistakable). Art
   must support a "look here" emphasis state on the relevant asset.
6. **One concrete art per role per state; theme by swapping the set.** Don't bake
   kitchen-specific meaning into logic-bearing art. A `block` themed as a sugar cube here
   becomes an asteroid later, but it's the same role with the same states.

---

## 2. Reference frame (so art is produced at the right shape)

- **Device/orientation:** tablet, **landscape**. Design to a logical stage of reference
  **1280 × 800** (16:10); treat positions as fractions of the stage so art scales cleanly.
- **Scene regions** every screen shares (full detail + diagram in the architecture doc):
  - **Prompt/Goal band** (top): what mom is asking / the equation being taught / the goal.
  - **Stage** (center, largest): the manipulables — source area, build zone, tool dock.
  - **Reference axis:** the `ruler` along the build zone.
  - **Symbol line:** where numerals/fraction labels/equation render; sits **adjacent to the
    quantity** during binding beats, then migrates to center as blocks fade, then becomes
    the `slate`.
  - **HUD band** (bottom): check button, hint, progress/treat, (Phase 2 rationale banner).
  - **Corners:** tutor character; camera indicator (Phase 3).
- Produce art with transparent backgrounds where assets sit on the stage; scene backdrops
  are separate full-bleed pieces (§3).

---

## 3. Scenes & backdrops

Full-screen layouts/backdrops. Each is one piece per state.

- [ ] **`scene.hub`** (Mom's Kitchen — the goal/home base). Represents: the place the goal
  lives and payoff is felt. Communicate: warmth, "this is why we're learning." States:
  - [ ] `opener` (inviting, calm)
  - [ ] `wall` (mom poses a problem the child can't yet do — anticipatory)
  - [ ] `return_win` (celebratory — the once-impossible recipe now solved)
  - [ ] `faded` (manipulatives reduced — later returns, less scaffolding)
  - [ ] `bare_slate` (kitchen receded to just the problem + slate)
- [ ] **`scene.room_generic`** (a practice-room backdrop, reskinned per room by
  `room_motif`). States: `intro`, `drilling`, `mastered_exit`.
- [ ] **`scene.bare_slate`** (terminal beat: empty workspace, problem only). States:
  `blank`, `answer_pending`, `correct`, `incorrect`.
- [ ] **`scene.help_handoff`** (calm "let's get some help" human-escalation state). States:
  `entering`, `waiting_for_human`. (Phase 3 trigger, but the screen is part of the set.)
- [ ] **`room_motif`** — a per-room accent set (palette + ornament) layered on
  `scene.room_generic` so rooms feel distinct within one theme. Produce **one variant per
  room**:
  - [ ] `motif.r0a_count` (Counting Room)
  - [ ] `motif.r0b_add_whole` (Combining Room)
  - [ ] `motif.r1_same_den` (Same-Pieces Room)
  - [ ] `motif.r2_unlike_den` (Matching-Sizes Room)
  - [ ] `motif.r3_simplify` (Tidying Room)
  - [ ] `motif.r4_improper_mixed` (Whole-Units Room)

---

## 4. Characters

- [ ] **`tutor_guide`** ("Mom" — poses problems, reacts). Communicate: warm, encouraging,
  never punishing. States (one expression each):
  - [ ] `neutral` · [ ] `asking` · [ ] `encouraging` · [ ] `delighted` ·
        [ ] `gentle_concern` (for struggle/re-scaffold — concerned, never disappointed)
- [ ] **`reward_payoff`** (the treat/dish that forms as recipes succeed — the long-arc
  progress). Communicate: desirable, "you made this." States:
  - [ ] `forming` (in progress) · [ ] `partial` · [ ] `complete`

---

## 5. Core manipulables (the number layer)

The heart of the game. Size/color rules in §1 apply to all of these.

- [ ] **`block`** — the discrete unit; the atom of every quantity. Communicate: countable,
  stackable, pick-up-able; its **size = its fraction-piece size**; its **color = its
  denominator family**. Affordance: draggable. Render props: `denominator` (drives size +
  hue), `value = 1/denominator`. Size rule: a 1/n block is 1/n of a ruler length tall;
  unlike-denominator blocks must visibly differ in size. States (art each):
  - [ ] `idle` (resting, grabbable)
  - [ ] `picked_up` (lifted — slight scale/shadow)
  - [ ] `snapped` (locked into a stack slot)
  - [ ] `ghost` (outline only, faded scaffold — non-interactive)
  - [ ] `removed` (mid take-away — leaving)
- [ ] **`stack`** — an ordered column of `block`s = a quantity; measured against the
  `ruler`. (A horizontal **bar** is just a stack laid sideways — same asset, `orientation`
  prop.) Communicate: height/length = how much. Render props: `count`, `denominator`
  (=block size/hue), `orientation` (vertical stack / horizontal bar), `targetMark?`,
  `ghost?`. States:
  - [ ] `building` (growing as blocks land)
  - [ ] `at_target` (height meets the target mark — affirming glow-ready)
  - [ ] `over_target` (overshot — gentle "too much" wobble-ready)
  - [ ] `merging` (two stacks fusing into one)
  - [ ] `shrinking` (blocks being removed — subtraction)
  - [ ] `ghost` (outline, faded scaffold)
- [ ] **`pile`** — a pre-made loose group of `block`s handed to the child (unordered
  source), sitting in the open. Communicate: "here are pieces to use," not a container.
  States:
  - [ ] `offered` (full, available) · [ ] `depleting` (being drawn from) · [ ] `empty`
- [ ] **`ruler`** — the central measuring reference: a graduated axis with labeled marks;
  blocks/stacks are measured against it. One full length = one whole. Communicate:
  "measure to here," trustworthy/precise. Render props: `denominator` (mark spacing),
  `length`. States:
  - [ ] `full` (full whole length, all marks)
  - [ ] `short` (faded scaffold — shorter/lighter, later beats)
  - [ ] `hidden` (absent — numbers-lead/bare beats)
- [ ] **`target_mark`** — the specific labeled mark on the `ruler` a stack is built to (the
  fraction asked for). Communicate: "this is the goal height." States:
  - [ ] `shown` · [ ] `met` (stack reached it) · [ ] `exceeded` (overshot)
- [ ] **`whole_unit_row`** — a row of whole-units, each one full `ruler` length; a new whole
  appears when the current fills. Used in R4 to count wholes when a stack exceeds one whole.
  Communicate: "each cell is one complete whole." States:
  - [ ] `one_whole` (a single filled whole)
  - [ ] `spawned_next` (a fresh empty whole sliding in for the overflow)
  - [ ] `counting_wholes` (a row of completed wholes being tallied)

> **Not an asset — do not draw:** any `bin`/can/tray/cup/vessel. Blocks never go inside
> walls (Global law #2).

---

## 6. Symbolic / numeric layer

Where the literal numbers live. These must be able to sit **right next to** the quantity
they name (the block↔number link) and share its color (§1 rule 4).

- [ ] **`numeral_glyph`** — a single written/rendered number the child reads or produces.
  States:
  - [ ] `shown` (system-rendered) · [ ] `blank_slot` (empty target to fill) ·
        [ ] `child_written` (handwriting/typed ink) · [ ] `correct` · [ ] `incorrect`
- [ ] **`fraction_label`** — stacked numerator/denominator tied to a quantity. The
  denominator must support a **locked** (padlock) look (R1's signature). States:
  - [ ] `shown` · [ ] `numerator_blank` · [ ] `denominator_blank` ·
        [ ] `denominator_locked` (padlock + emphasis) · [ ] `child_written`
- [ ] **`operator_glyph`** — `+`, `−`, `=` naming the action in the gap. States:
  - [ ] `plus` · [ ] `minus` · [ ] `equals` · [ ] `highlighted`
- [ ] **`tally_readout`** — a live running count/total. Communicate: "the count, made
  visible," ticking as pieces land. States:
  - [ ] `counting` (animating) · [ ] `settled` (final) · [ ] `hidden`
- [ ] **`equation_frame`** — the one-blank equation layout (any slot can be the unknown).
  States:
  - [ ] `answer_blank` · [ ] `operand_blank` · [ ] `solved`
- [ ] **`mixed_number_slots`** — separate slots for a whole part + a leftover fraction (R4).
  States:
  - [ ] `whole_blank` · [ ] `fraction_blank` · [ ] `solved`
- [ ] **`prompt_banner`** — the current ask / what's being taught, rendered in the
  goal band (mom's question as text, or the equation under focus). Communicate: "here's what
  we're doing right now." States:
  - [ ] `asking` · [ ] `solved`

---

## 7. Room tools (the verb-objects unique to each skill)

Each is the signature interactive object of its room.

- [ ] **`slicer_tool`** (R2) — cuts each piece into N equal smaller pieces (×N). Communicate:
  "drag me across a bar to cut it." Affordance: draggable across a bar. States:
  - [ ] `idle` · [ ] `slicing` (mid-cut) · [ ] `applied` (cut complete, ×N shown)
- [ ] **`fuse_tool`** (R3) — groups K small pieces into one bigger piece (÷K). Communicate:
  "combine K into one." States:
  - [ ] `idle` · [ ] `fusing_ok` (valid grouping snapping) · [ ] `fusing_reject` (uneven —
        bounces back) · [ ] `applied`
- [ ] **`factor_tray`** (R3) — surfaces factors of a number, then the shared factors of top
  and bottom. States:
  - [ ] `hidden` · [ ] `showing_factors` · [ ] `shared_highlighted`
- [ ] **`denominator_picker`** (R2) — choose a common denominator + multipliers symbolically
  (faded beats). States:
  - [ ] `idle` · [ ] `selecting` · [ ] `confirmed`
- [ ] **`common_size_guide`** (R2) — a faint shared grid both bars must reach before merging
  unlocks. States:
  - [ ] `shown` · [ ] `matched` (both bars reached it — unlock)
- [ ] **`leftover_tray`** (R4) — holds the remainder blocks after whole units fill. (Open
  holder, not a closed container — leftover blocks stay visible.) States:
  - [ ] `empty` · [ ] `holding`
- [ ] **`arrangement_frame`** (R0a) — the layout pieces sit in for count-transfer. Not a
  container; just a layout. Communicate the four arrangements (count is the same regardless
  of shape). States:
  - [ ] `stack` · [ ] `row` · [ ] `scatter` · [ ] `ring`
- [ ] **`merge_zone`** (R0b, R1, R2) — the gap where two stacks fuse (addition). States:
  - [ ] `idle` · [ ] `merging`
- [ ] **`slate`** — the stylus/answer writing surface (handwriting in Phase 3; tap/type pad
  in Phase 1). Communicate: writable, "do it by hand." States:
  - [ ] `blank` · [ ] `ink_active` (being written on) · [ ] `recognized` ·
        [ ] `correct` · [ ] `incorrect`

---

## 8. Feedback & control (UI furniture)

> **Mostly contextual, not persistent.** Only `check_button` and a quiet progress/treat cue
> stay on screen. `hint_affordance` appears when offered, `star_rating` on a result,
> `rationale_banner` on an adaptation, room tools only in their beats (see
> `presentation-scene-architecture.md` §4.1, §5.5). Make controls **big touch targets**
> (aim ≥60px for small hands) and remember the goal is **voice-first** (§5.1): these controls
> support play, they don't carry the teaching.

- [ ] **`check_button`** — confirm/verify an answer. States: [ ] `idle` · [ ] `pressed` ·
      [ ] `checking`
- [ ] **`hint_affordance`** — the escalating hint surface (4 rungs). Communicate increasing
  help without restructuring the workspace. States:
  - [ ] `hidden` · [ ] `h1_attentional` (a "look here" nudge) ·
        [ ] `h2_procedural` (a "do this next" tip) · [ ] `h3_worked_step` (one step shown) ·
        [ ] `h4_full_solution` (full worked answer)
- [ ] **`feedback_burst`** — the reflexive instant reaction. States (one effect each):
  - [ ] `glow_correct` · [ ] `snap_place` · [ ] `shake_reject`
- [ ] **`progress_indicator`** — quiet sense of advancement toward the goal. States:
  - [ ] `idle` · [ ] `advanced`
- [ ] **`star_rating`** — answer-quality tier (R2 over-slice: full stars for the least
  common denominator, fewer for a valid-but-bigger one; usable as a general score).
  Communicate: "correct, and how tidy." States:
  - [ ] `one_star` · [ ] `two_star` · [ ] `three_star` (or empty/partial/full)
- [ ] **`recipe_card`** (kitchen) — what mom is making; the source of the problem; persists
  as the framing object. States: [ ] `shown` · [ ] `in_progress` · [ ] `complete`
- [ ] **`answer_pad`** (Phase 1 input) — number / fraction / mixed-number entry pad
  (tap + keyboard). Communicate: enter a number/fraction/mixed answer. States:
  - [ ] `idle` · [ ] `entering` · [ ] `submitted`
- [ ] **`affect_camera_indicator`** (Phase 3) — honest cue that the camera signal is on
  (privacy). States: [ ] `off` · [ ] `on`
- [ ] **`rationale_banner`** (Phase 2) — the "why did this change" one-line explanation when
  the game adapts. States: [ ] `hidden` · [ ] `shown`

---

## 9. Per-room object types for counting (R0a)

R0a teaches counting across **different kinds of object** (count squares, count triangles),
including mixed and scattered. You need at least **3 visually distinct countable shapes**
that are all clearly "one each" and equally easy to count. These are `block`-role reskins
(same idle/picked_up/snapped/ghost states), distinct silhouettes/colors:

- [ ] `count_type_a` (e.g., square) — full block states
- [ ] `count_type_b` (e.g., triangle) — full block states
- [ ] `count_type_c` (e.g., circle/star) — full block states

They must be **distinguishable at a glance when intermixed and scattered** (the room's
mastery beat counts each type separately out of a jumble), so pick clearly different
silhouettes AND colors.

---

## 10. Recommended (optional) — from the pedagogy review

Not core to shipping, but flagged because it serves the "make the structure visible to the
child" gap. Draw only if you pursue it:

- [ ] **`skill_map`** (optional) — a child-facing map showing how rooms/skills feed the
  kitchen goal; cleared skills light up, a wall reveals the missing branch. States:
  `overview`, `node_locked`, `node_active`, `node_mastered`, `wall_revealed`.

---

## 11. Production summary (rough art counts)

Count = distinct art states to produce (transitions/animations are separate effort).

| Group | Assets | Approx. states to draw |
|-------|--------|------------------------|
| Scenes & backdrops | 4 scenes + 6 room motifs | ~17 + 6 motif sets |
| Characters | 2 | 8 |
| Core manipulables | 7 | ~29 |
| Symbolic / numeric | 7 | ~24 |
| Room tools | 9 | ~26 |
| Feedback & control | 10 | ~30 |
| R0a count types | 3 | ~12 |
| Optional skill_map | 1 | ~5 |

Priority order for a playable wireframe→art path: **core manipulables (§5) → symbolic
(§6) → room tools (§7) → feedback/control (§8) → characters (§4) → scenes (§3) → count
types (§9)**. The game is fully playable in a wireframe Skin (boxes, lines, system font)
before any of this art exists; each group above can be swapped in incrementally.

---

## 12. Hand-off checklist (per asset, before it's "done")

For every asset above, the art is complete when:

- [ ] All listed states are drawn (or have a defined transition).
- [ ] The affordance reads correctly (grabbable looks grabbable, locked looks locked, ghost
      looks non-interactive).
- [ ] Size rules hold (block size = piece size; smaller piece for bigger denominator; stack
      vs. ruler stay comparable).
- [ ] Color follows the denominator-family convention and matches its numeral.
- [ ] The teaching-target emphasis state exists where relevant.
- [ ] It reads at tablet size against its scene backdrop.
- [ ] It is delivered as a transparent-background asset keyed to its functional ID + state
      (so it drops into the Skin binding — see `presentation-scene-architecture.md`).
