# Shared Asset Catalog

The single source of truth for every sprite, game object, and scene setup the rooms
use. **Room files reference assets by ID only**; all detail (states, theming rules)
lives here.

## How theming works

Every asset is named by its **functional role**, never its current look. A *theme* is
one mapping from these functional IDs to concrete art / sound / palette. To retheme
the whole game (kitchen → spaceship, dungeon, garden, whatever), you only rebind the
IDs — no room logic changes.

The contract a theme must honor:

1. **Provide one concrete asset per functional ID** a room references.
2. **Support every listed state** for that asset (states drive game logic; a theme
   may restyle them but must not drop one).
3. **Preserve the affordance.** The asset must still *read* as its role — a
   `block` must look countable and stackable; a `ruler` must look like something you
   measure against; a `slate` must look writable. Theme the skin, keep the meaning.
4. **Keep the invariant relationships.** Where two assets must stay visually
   comparable (e.g. `stack` height vs. the `target_mark` on the `ruler`), the theme
   must keep that legible.

Asset ID naming: `snake_case`, role-based. States in `[brackets]`. A theme file later
maps `asset_id → { art, sound, anim, palette_role }` and `asset_id.state → variant`.

---

## A. Scene setups (whole-screen layouts / backdrops)

| ID | Role | Required states / variants |
|----|------|----------------------------|
| `scene.hub` | The goal place; home base where the wall is thrown and payoff felt | `[opener]` `[wall]` `[return_win]` `[faded]` (manipulatives reduced) `[bare_slate]` |
| `scene.room_generic` | A practice-room backdrop, reskinned per room by the `room_motif` accent | `[intro]` `[drilling]` `[mastered_exit]` |
| `scene.bare_slate` | The terminal phase: empty workspace, problem text only | `[blank]` `[answer_pending]` `[correct]` `[incorrect]` |
| `scene.help_handoff` | The calm "let's get some help" human-escalation state (design doc §5.5) | `[entering]` `[waiting_for_human]` |
| `room_motif` | Per-room accent set (palette + ornament) that distinguishes rooms within one theme | one variant per room ID |

## B. Characters / agents

| ID | Role | Required states |
|----|------|-----------------|
| `tutor_guide` | The goal-giver & reactor ("mom"); poses problems, reacts to outcomes | `[neutral]` `[asking]` `[encouraging]` `[delighted]` `[gentle_concern]` (for re-scaffold/struggle) |
| `reward_payoff` | The thing earned that embodies progress ("treat"/dish) | `[forming]` `[partial]` `[complete]` |

## C. Core manipulables (the fraction/number physical layer)

**Design law for this layer: numbers are represented by discrete BLOCKS, never by a
continuous/liquid amount, and blocks are never put inside a container that could hide
them.** A block stays visible and unchanged when picked up, put down, added, or removed —
the thing you manipulate is exactly the thing you count, and it is always in the open.
Quantities are read by **stacking blocks against a `ruler`** (marks you measure to),
not by pouring into a vessel and not by dropping into a bin/can/tray whose walls would
obscure a piece. Loose groups sit in the open as a `pile`; counted groups are built as a
`stack`. There is deliberately no liquid `vessel`/cup asset and no `bin` container.

| ID | Role | Required states |
|----|------|-----------------|
| `block` | The discrete unit; the atom of every quantity. Always visible, countable, stackable; never merges into a continuous amount | `[idle]` `[picked_up]` `[snapped]` `[ghost]` (outline, faded scaffold) `[removed]` (take-away) |
| `stack` | An ordered column of `block`s forming a quantity; measured against the `ruler`. (A horizontal "bar" is just a stack laid sideways — same asset.) | `[building]` `[at_target]` `[over_target]` `[merging]` `[shrinking]` `[ghost]` |
| `pile` | A pre-made loose group of `block`s handed to the child (unordered source), sitting in the open | `[offered]` `[depleting]` `[empty]` |
| `ruler` | **The central measuring object.** A graduated reference with labeled marks; blocks are stacked against it and read to its marks. One full ruler length = one whole. Every "stack up to a height" interaction measures to this | `[full]` `[short]` (faded scaffold) `[hidden]` |
| `target_mark` | The specific labeled mark on the `ruler` a `stack` is measured to | `[shown]` `[met]` `[exceeded]` |
| `whole_unit_row` | A row of whole-units (each one full `ruler` length); a new whole appears when the current one fills. Used to count whole units when a stack exceeds one whole | `[one_whole]` `[spawned_next]` `[counting_wholes]` |

## D. Symbolic / numeric layer

| ID | Role | Required states |
|----|------|-----------------|
| `numeral_glyph` | A written/rendered number the child reads or produces | `[shown]` `[blank_slot]` `[child_written]` `[correct]` `[incorrect]` |
| `fraction_label` | Stacked numerator/denominator display tied to a quantity | `[shown]` `[numerator_blank]` `[denominator_blank]` `[denominator_locked]` (padlock) `[child_written]` |
| `operator_glyph` | `+`, `−`, `=` symbol naming the action in the gap | `[plus]` `[minus]` `[equals]` `[highlighted]` |
| `tally_readout` | Live count/running-total display | `[counting]` `[settled]` `[hidden]` |
| `equation_frame` | The one-blank equation layout (any slot can be the unknown) | `[answer_blank]` `[operand_blank]` `[solved]` |

## E. Room tools (the verb-objects unique to skills)

| ID | Role | Required states | Used by |
|----|------|-----------------|---------|
| `slicer_tool` | Cuts each piece into N equal smaller pieces (×N scaling) | `[idle]` `[slicing]` `[applied]` | R2 |
| `fuse_tool` | Groups K small pieces into one bigger piece (÷K reducing) | `[idle]` `[fusing_ok]` `[fusing_reject]` `[applied]` | R3 |
| `factor_tray` | Surfaces factors of a number, then shared factors | `[hidden]` `[showing_factors]` `[shared_highlighted]` | R3 |
| `denominator_picker` | Choose a common denominator + multipliers symbolically | `[idle]` `[selecting]` `[confirmed]` | R2 |
| `common_size_guide` | Faint shared grid both bars must reach before merge unlocks | `[shown]` `[matched]` | R2 |
| `leftover_tray` | Holds the remainder `block`s after whole units fill | `[empty]` `[holding]` | R4 |
| `mixed_number_slots` | Separate slots for whole part + leftover fraction | `[whole_blank]` `[fraction_blank]` `[solved]` | R4 |
| `merge_zone` | The gap where two stacks fuse (addition) | `[idle]` `[merging]` | R1, R2 |
| `slate` | The stylus writing surface (handwriting input) | `[blank]` `[ink_active]` `[recognized]` `[correct]` `[incorrect]` | all (final phase) |

## F. Feedback & control (UI furniture)

| ID | Role | Required states |
|----|------|-----------------|
| `check_button` | Confirm / verify a predicted answer | `[idle]` `[pressed]` `[checking]` |
| `hint_affordance` | The escalating hint surface (ladder H1–H4, design doc §3.2) | `[hidden]` `[h1_attentional]` `[h2_procedural]` `[h3_worked_step]` `[h4_full_solution]` |
| `feedback_burst` | The reflexive T1 reaction (glow / snap / shake) | `[glow_correct]` `[snap_place]` `[shake_reject]` |
| `progress_indicator` | Quiet sense of advancement toward the goal | `[idle]` `[advanced]` |
| `affect_camera_indicator` | Visible, honest cue that the camera signal is on (privacy) | `[off]` `[on]` |

---

## Glossary mapping (game term → asset IDs)

- "blocks / pieces" → `block`, `stack`, `pile`
- "measuring stick / ruler / target line" → `ruler`, `target_mark`
- "mom" → `tutor_guide`; "treat/dish" → `reward_payoff`
- "locked denominator" → `fraction_label[denominator_locked]`
- "slicer / fuse / factor tray" → `slicer_tool` / `fuse_tool` / `factor_tray`
- "whole units that fill and spawn" → `whole_unit_row`; "leftover" → `leftover_tray`
- "the slate / write with stylus" → `slate`, `numeral_glyph`, `fraction_label`

> **Not used:** there is intentionally no liquid `vessel`/cup asset and no `bin`/can/tray
> container for blocks. Quantities are always discrete `block`s, kept in the open as a
> `pile` or a `stack` and measured against a `ruler` (see the design law in §C) — never
> hidden inside something with walls.
