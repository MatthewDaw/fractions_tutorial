# Visual Asset Generation Prompt (for Claude design / image generation)

Purpose: generate the full first-pass set of visual assets for the fraction game so
development can start, **structured so any asset can be swapped later** when a better
design is found. Copy the "PROMPT" block below into Claude design (or your image tool).
Fill the one `THEME` block at the top; everything else is fixed by the catalog.

- **Source of truth for what assets exist:** `../room_break_down/ASSET_CATALOG.md`
  (functional IDs + required states). This prompt must stay in sync with it.
- **Swappability is the whole point.** Assets are addressed by functional ID, every
  state is a separate file, and a `manifest.json` maps `id.state → file`. To retheme,
  regenerate against a new `THEME` block and rebind the manifest — no code changes.

---

## How swappability is enforced (read before generating)

1. **One functional ID = one logical asset, regardless of theme.** Art changes; the ID
   and its state list do not. Code references `block`, never "wooden cube."
2. **Every state is its own file.** `block.idle.png`, `block.ghost.png`, etc. Game logic
   switches states; if a state is missing, that logic breaks. Generate all listed states.
3. **A `manifest.json` is the swap layer.** `{ "block.idle": "blocks/block.idle.png", … }`.
   Swapping a theme = swapping files + manifest entries. Nothing else moves.
4. **Affordance is preserved across themes (catalog rule 3).** A `block` always reads as
   countable/stackable; a `ruler` always reads as something you measure against; a
   `slate` always reads as writable. Theme the skin, keep the meaning.
5. **Invariant visual relationships are preserved (catalog rule 4).** `stack` height must
   stay directly comparable to the `target_mark` on the `ruler`; `block` units must be
   visually equal-sized and tile cleanly into a `stack`.

### Hard technical constraints (all themes)

- **Format:** PNG with transparent background (sprites); scenes may be full-bleed.
- **Style flat/vector-clean** for first pass (easy to regenerate consistently).
- **Consistent unit grid:** one `block` = one grid cell; `stack`/`ruler`/`target_mark`
  must align to the same cell height so blocks tile and measure exactly.
- **Square-ish source canvases**, centered subject, generous padding, no drop shadows
  baked in (lighting comes from the engine).
- **No text baked into sprites** unless the asset *is* a glyph (`numeral_glyph`,
  `fraction_label`, `operator_glyph`); numbers/labels are rendered at runtime so they
  stay theme-neutral and localizable.
- **Deliver a `manifest.json`** mapping every `id.state` to its file path.

---

## THEME (the only part you change per theme)

```
THEME_NAME:        kitchen-default          # e.g. spaceship, dungeon, garden
SETTING:           a warm home kitchen, child helping a parent cook
TUTOR_PERSONA:     "mom" — warm, encouraging parent figure
REWARD_MOTIF:      a dish/treat being assembled (cookies, soup, etc.)
BLOCK_MOTIF:       stackable measuring blocks (discrete cubes — NOT liquid)
RULER_MOTIF:       an upright measuring stick / ruler with labeled marks
PALETTE:           warm, soft, high-contrast for young children
TONE:              friendly, low-stress, playful; not babyish
AGE_TARGET:        ~5–9 year olds
```

> Design law (non-negotiable across every theme): **quantities are discrete BLOCKS
> stacked and measured against a RULER. Never liquid, never a fill-a-cup metaphor.** A
> block is visible and unchanged when picked up, put down, added, or removed.

---

## PROMPT (paste into Claude design)

> Generate a complete, swappable visual asset set for a children's fraction-learning
> game, in the theme defined by the THEME block above. Follow the swappability rules
> and technical constraints above exactly. For EACH asset ID below, produce ONE image
> per listed state, named `<id>.<state>.png`, plus a `manifest.json` mapping every
> `id.state` to its path. Keep a single consistent unit grid so blocks tile into stacks
> and measure cleanly against the ruler. Preserve each asset's affordance and the
> stack↔ruler comparability. Output organized in folders by category (A–F).

### A. Scenes / backdrops
- `scene.hub` — states: `opener`, `wall`, `return_win`, `faded`, `bare_slate`
- `scene.room_generic` — states: `intro`, `drilling`, `mastered_exit`
- `scene.bare_slate` — states: `blank`, `answer_pending`, `correct`, `incorrect`
- `scene.help_handoff` — states: `entering`, `waiting_for_human`
- `room_motif` — one accent variant per room: `count`, `add_whole`, `same_den`,
  `unlike_den`, `simplify`, `improper_mixed`

### B. Characters
- `tutor_guide` — states: `neutral`, `asking`, `encouraging`, `delighted`,
  `gentle_concern`
- `reward_payoff` — states: `forming`, `partial`, `complete`

### C. Core manipulables (discrete blocks + ruler — the heart of the look)
- `block` — states: `idle`, `picked_up`, `snapped`, `ghost`, `removed`
- `stack` — states: `building`, `at_target`, `over_target`, `merging`, `shrinking`,
  `ghost`
- `pile` — states: `offered`, `depleting`, `empty`
- `bin` — states: `empty`, `filling`, `full`
- `ruler` — states: `full`, `short`, `hidden`
- `target_mark` — states: `shown`, `met`, `exceeded`
- `whole_unit_row` — states: `one_whole`, `spawned_next`, `counting_wholes`

### D. Symbolic / numeric (glyph assets; render-neutral)
- `numeral_glyph` — states: `shown`, `blank_slot`, `child_written`, `correct`,
  `incorrect`
- `fraction_label` — states: `shown`, `numerator_blank`, `denominator_blank`,
  `denominator_locked`, `child_written`
- `operator_glyph` — states: `plus`, `minus`, `equals`, `highlighted`
- `tally_readout` — states: `counting`, `settled`, `hidden`
- `equation_frame` — states: `answer_blank`, `operand_blank`, `solved`

### E. Room tools
- `slicer_tool` — states: `idle`, `slicing`, `applied`
- `fuse_tool` — states: `idle`, `fusing_ok`, `fusing_reject`, `applied`
- `factor_tray` — states: `hidden`, `showing_factors`, `shared_highlighted`
- `denominator_picker` — states: `idle`, `selecting`, `confirmed`
- `common_size_guide` — states: `shown`, `matched`
- `leftover_tray` — states: `empty`, `holding`
- `mixed_number_slots` — states: `whole_blank`, `fraction_blank`, `solved`
- `arrangement_frame` — states: `stack`, `row`, `scatter`, `ring`
- `merge_zone` — states: `idle`, `merging`
- `slate` — states: `blank`, `ink_active`, `recognized`, `correct`, `incorrect`

### F. Feedback & control
- `check_button` — states: `idle`, `pressed`, `checking`
- `hint_affordance` — states: `hidden`, `h1_attentional`, `h2_procedural`,
  `h3_worked_step`, `h4_full_solution`
- `feedback_burst` — states: `glow_correct`, `snap_place`, `shake_reject`
- `progress_indicator` — states: `idle`, `advanced`
- `affect_camera_indicator` — states: `off`, `on`

---

## Expected output structure

```
assets/
  themes/
    kitchen-default/
      scenes/      scene.hub.opener.png, …
      characters/  tutor_guide.neutral.png, …
      blocks/      block.idle.png, stack.building.png, ruler.full.png, …
      symbols/     numeral_glyph.shown.png, fraction_label.denominator_locked.png, …
      tools/       slicer_tool.idle.png, slate.blank.png, …
      feedback/    feedback_burst.glow_correct.png, …
      manifest.json
```

`manifest.json` (the swap layer) — one entry per `id.state`:

```json
{
  "theme": "kitchen-default",
  "assets": {
    "block.idle":  "blocks/block.idle.png",
    "block.ghost": "blocks/block.ghost.png",
    "ruler.full":  "blocks/ruler.full.png",
    "tutor_guide.encouraging": "characters/tutor_guide.encouraging.png"
  }
}
```

The engine loads exactly one theme folder via its `manifest.json`. Swapping a theme =
point the loader at a different folder. Because every reference is by `id.state`, no
room logic, no game code, and none of the room_break_down docs change when the art does.

---

## To generate a NEW theme later

1. Copy the THEME block, change the motif fields (e.g. `SETTING: a starship galley`,
   `BLOCK_MOTIF: glowing cargo crates`, `RULER_MOTIF: a docking gauge`).
2. Re-run the PROMPT — it regenerates the identical ID/state set in the new skin.
3. Drop the new folder under `assets/themes/<name>/` with its `manifest.json`.
4. Point the loader at it. Done — affordances and the block↔ruler invariant must still
   hold (the prompt enforces this), so gameplay is unchanged.
