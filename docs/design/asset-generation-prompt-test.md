# Asset Prompt — TEST (5 assets, Cat Returns theme)

Short version for trying the pipeline on a handful of assets before committing to the
full set. Full version: `asset-generation-prompt.md`. Catalog: `../room_break_down/ASSET_CATALOG.md`.

These 5 define the whole look — get them consistent and the rest follows.

## Theme

```
THEME_NAME:  cat-returns
STYLE:       hand-painted Studio Ghibli look, mimicking *The Cat Returns* — soft
             watercolor backgrounds, warm afternoon light, gentle hand-drawn lines,
             rounded friendly shapes
PALETTE:     warm creams, soft greens, warm browns, dusty rose, golden light
TONE:        cozy storybook warmth, whimsical, calm; for ages 5–9; not babyish
```

> **Design law:** quantities are discrete WOODEN BLOCKS, stacked and measured against a
> RULER. Never liquid, never a container that hides a block. A block stays visible and
> unchanged when picked up, put down, added, or removed.

## Rules

- Transparent background, centered subject, generous padding (cut-out sprite).
- Same style/palette/light across all 5 — generate `block` first as the style anchor,
  then reference it for the rest ("in the exact same style as the previous image…").
- One block = one grid cell; stack height must stay comparable to the ruler's marks.
- No baked-in text or numbers.

## The 5 assets (generate in this order)

1. **`block.idle`** — one discrete square wooden measuring block, clearly separate and
   stackable. *(style anchor)*
2. **`ruler.full`** — an upright wooden ruler / measuring stick with hand-painted marks,
   the thing blocks are stacked against.
3. **`stack.building`** — a short column of identical blocks stacked against the ruler,
   mid-build.
4. **`tutor_guide.encouraging`** — a warm, friendly cat as a gentle tutor, encouraging
   expression, in the rounded soft-eyed *Cat Returns* style.
5. **`scene.hub.opener`** — a cozy cat-kingdom storybook room backdrop (full-bleed, no
   transparency needed).

Name files `<id>.<state>.png`. If a generation drifts off-style, regenerate it
referencing `block.idle` again.
