# Mom's Room — Asset Generation Prompt

> Paste-ready prompt for a fresh Claude (design/artifact mode) to GENERATE the kitchen
> story-prop assets for Mom's Room. Scoped to drawing the 13 prop families (not the room
> screen — for that, use `moms-room-word-problems-design-brief.md`). Self-contained; assumes
> no repo access. Locks the visual system from the R1/R2 handoffs so props match.

---

You are drawing a set of **2D game assets** for a children's cooking-math game (ages ~6–10)
that teaches adding fractions. I need a single-file **React artifact (Framer Motion
`motion/react`)** that renders every asset below as a reusable component, drawn entirely in
**styled DOM + inline SVG — no external art, no images, no canvas/WebGL**. Output a **contact
sheet**: a labeled grid showing each asset in *every* listed state, so I can review them all
at once.

## Visual system (match exactly — this is an existing game's locked skin)
- Style: a vintage printed "lesson page" — warm paper, ink line-art with a **two-tone
  woodcut** feel, muted red as the one accent. Friendly, tactile, hand-drawn, high-contrast.
  Not flat/corporate, not glossy 3D, not generic AI-slop.
- Colors: `--paper-1 #ede2c8`, `--paper-2 #e3d4b1`, `--paper-3 #c9b78d`, `--ink #1c1612`,
  `--ink-soft #3a2e24`, `--ink-mute #6b5a47`, `--red #a32a22`, `--red-deep #6e1c16`,
  `--red-soft #c46a5f`.
- Fonts (Google): **Russo One** (display/numbers), **Old Standard TT** (serif body),
  Stardos Stencil (stencil labels).
- Distinguish quantities by **pattern/shape, not color alone** (e.g. red diagonal-hatch vs.
  ink cross-hatch).
- Honor `prefers-reduced-motion`.

## Hard rule (the game's design law)
Every quantity is made of **discrete, same-size, visible pieces** — countable and stackable,
never a liquid, never poured, never hidden inside an opaque container. Pieces read cleanly
against a horizontal **number-line / ruler** (one full length = one whole). Draw the ruler as
a shared element the food pieces sit on.

## Assets to draw (each with all listed states)
1. **Scored chocolate bar** (8 squares) — `full` / `squares_snapped` (some missing) /
   `needed_outline_ghost` (faint outline of a target amount)
2. **Pie in a tin** (sliceable into N) — `slices_present` / `slices_missing` / `target_shaded`
3. **Tray / sheet-cake** with **swappable cut lines** (½, ⅓, ¼, ⅙) — `uncut` / `cut_n` /
   `merging`
4. **Dough strip + bacon strip** on the ruler — `whole` / `sliced` / `joined`
5. **Mismatched candy bars** (one 4-split, one 6-split) — `idle` / `recut` / `matched`
6. **Cracker sheet** (4) — `whole` / `snap_lines` / `piece_highlight`
7. **Sausage-link chain** (same-size links) — `idle` / `counting` / `wrapped_into_units`
8. **Egg carton / muffin tin** (cells) — `cells_full` / `cell_lifting` / `fresh_tin_spawned`
9. **Carrots→twine bundles** & **cookies→clusters** — `loose` / `bundling` / `bundled`
10. **Lunchbox with a hinged lid** — `open` / `pieces_in` / `lid_closed`
11. **Cupcake / pie boxes** that fill & stack — `empty` / `filling` / `full` / `leftover`
12. **Cooling rack** (holds whole units) — `empty` / `holding_wholes`
13. **Counter cast** — a **kid sibling, Grandpa, and a picky cat** at the counter — `idle` /
    `asking` / `happy`, drawn in the same woodcut style as a chef "Cook" tutor character
    (also draw the Cook for reference).

## Deliverable
The single-file React artifact rendering all 13 as components on a `--paper-1` background with
a `#5b4327` letterbox, organized into a labeled contact-sheet grid (asset name + state under
each). Add a tiny Framer Motion touch to the "action" states (snap, lift, bundle, slice,
lid-close) so I can see the motion personality. Keep each component self-contained and
prop-driven by `state` so I can lift them straight into the game.
