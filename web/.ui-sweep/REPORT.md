# UI-Bug Sweep Report — Babushka's Fractions (1280×800)

## Summary

Swept 33 page/stage states — all reached and inspected. **23 raw findings** collapse to **6 distinct issues** once deduplicated by shared root cause.

Counts by severity (raw findings): **Blocker 6 · Major 16 · Minor 1.**

Distinct issues (after dedup):
- **Issue 1 — Vertical height-budget overflow** (the tall stacked Slate vs. the fixed-height canvas/rail): the dominant issue. Surfaces as (a) the diagram/board overflowing DOWN onto the write area, or (b) the rail/Slate spilling off the 800px stage. Affects **13 stages**. This is the user's reported bug (b).
- **Issue 2 — Cook + speech ribbon laid on top of the diagram/blocks** (tutor dialog over content): **4 stages** (2 blockers). This is the user's reported bug (a).
- **Issue 3 — Cook figure overhang collides with the Check button:** **2 stages** (major).
- **Issue 4 — `.joinbtn` `all: unset` defeats `position:absolute`,** button lands top-left over the column + 9/7 tag: **2 stages** (major).
- **Issue 5 — R4 bar value-note collides with the number-line ruler:** **1 stage** (major).
- **Issue 6 — Global audio: negative `volume` IndexSizeError (+ latent `BASE_VOL is not defined`):** non-visual, every page.

Both user-anchored bugs are **reproduced**: (a) = Issue 2 on R1; (b) = Issue 1 (Slate write-area not contained below the block space).

---

## Issues (ranked by severity × breadth)

### Issue 1 — Height-budget overflow: tall stacked Slate vs. fixed-height canvas/rail *(BLOCKER, broadest)*
**The user's reported bug (b): the fraction write area is poorly placed and overlaps other boxes instead of sitting fully below the block-manipulation space.**

Two symptoms, one root cause:
- **1a — Write area / diagram collide** (HUD-mounted Slate): the diagram's fixed-height `.canvas` can't shrink, so it overflows its compressed `.play` track downward; the HUD's tall stacked Slate is centered up into it — the hatched "top" answer cell rides up through the diagram's bottom-right border.
- **1b — Rail/Slate spills off the 800px stage** (rail-mounted Slate, R4): the uncapped `.rail` column stacks three panels including the tall Slate; lower panels + the bottom write cell fall below y=800 and clip, and the HUD Check button paints over the overflowing Slate.

Affected pages:
- 1a (write-cell over diagram border / board over write boxes): **mom**, **r1-s1-manipulate** (also a floating/detached oversized Slate), **r2-beat2/3/4**, **r3-beat4**, **r5-s2**, **r5-s3** (blocker)
- 1a word-problem variant (recipe card overflows UP into the goal banner + answer block below diagram frame): **r2-beat5**, **r3-beat5**, **r1-s5-words**, **r4-s5** (blocker)
- 1b (rail/Slate off bottom, Check over Slate): **r4-s2** (blocker), **r4-s3** (blocker), **r4-s4** (blocker)
- Also drives the Check-over-"New problem" collision on tall picker rails: **r2-beat2**, **r3-beat2**

**Root cause (files:lines):**
- `web/src/styles/lesson.css:104` — `.canvas { width:720px; height:346px }` is a hard fixed height (so `.diagram` needs ~370px), with no `max-height` and no overflow clip on `.diagram` (`lesson.css:93-94`).
- `web/src/styles/lesson.css:92` — `.play { flex:1 1 auto; min-height:0; align-items:start }` lets the row compress below the diagram's intrinsic height instead of clipping; the fixed canvas then overflows downward.
- `web/src/styles/slate.css:24` — `.slate-cell { width:132px; height:124px }` has **no height cap**; stacked as `.slate.slate-fraction { flex-direction:column }` (`slate.css:14`) this is ~253–308px tall, inflating the `flex:0 0 auto` HUD (`lesson.css:175`) to ~335px and starving the play row.
- `web/src/styles/lesson.css:162` — `.rail` has no `max-height`/scroll, so R4's three-panel rail overruns the stage.
- `web/src/styles/lesson-unlike.css:77-85` — `.lu-wp-mount { position:absolute; inset:0 }` centers an over-tall `<WordProblem>` in the un-clipped 346px canvas, overflowing symmetrically above (into the goal banner) and below.
- The code already documents this hazard at `web/src/styles/lesson.css:250-252` (the InkPad ink-cell height is capped "because the numerator/denominator cells stack — too tall overflows the fixed 800px stage"). The full-size `.slate-cell` and the WordProblem Slate path **do not** inherit that cap, so the overflow recurs.

**Fix (one change fixes most instances):**
1. Cap the Slate so it can't exceed the available band: add a height-capped variant for `.hud-eq .slate-cell`, `.lu-slate-mount .slate-cell`, `.rail .slate-cell`, `.wp .slate-cell` (e.g. ~82–94px to match the 94px inkpad cap at `lesson.css:259`) + width trim, in `slate.css`. Smallest, highest-leverage fix.
2. Stop the fixed canvas overflowing its track: add `max-height` to `.canvas`/`.diagram` (or `overflow:hidden` + `min-height:0`) at `lesson.css:93-104`.
3. Cap + scroll-contain the rail: `.rail { max-height:100%; overflow:auto }` at `lesson.css:162` (or reflow the R4 panels so the Slate isn't sandwiched — `AppR4.jsx:539-616`).
4. Word-problem mounts: replace `inset:0` centering with top-aligned, height-clamped layout + `overflow:hidden` on the canvas at `lesson-unlike.css:77`, so the recipe card can't overflow up into the goal banner (`r2-beat5`, `r3-beat5`).

---

### Issue 2 — Cook + speech ribbon overlap the diagram/blocks *(BLOCKER)*
**The user's reported bug (a): on "Same Denominators" (R1) the tutor's dialog box covers the fractions.** Reproduced.

The Cook + tan speech ribbon render *inside* the diagram canvas — the ribbon overprints the merged block stack, the 5/7 tag, and the number-line labels. Same height-squeeze as Issue 1 (diagram overflows its collapsed `.play` track down into the band where `.cook-zone`/`.ribbon` live).

Affected pages: **r1-s1-manipulate** (blocker), **r1-s1-merged** (blocker); the Cook/ribbon also straddle the diagram bottom on **r5-s3**. (R2/R3 Cook+ribbon are positioned but don't collide because their diagrams are shorter on those beats.)

**Root cause:** Same overflow chain as Issue 1 (`lesson.css:104` + `lesson.css:92`), plus `web/src/styles/lesson.css:189-192` — `.cook-zone { height:92px }`, `.cook-stage { position:absolute; bottom:-18px }`, `.ribbon { margin-left:126px; max-width:178px }` — these sit in the HUD band the overflowing diagram now occupies.

**Fix:** Primarily resolved by fixing Issue 1 (clip/cap the diagram). Belt-and-suspenders: give the cook+ribbon row guaranteed clearance — a `min-height` floor on `.play` or a `margin-top` gap on `.hud` so it can never share Y-space with `.diagram`. Files: `lesson.css:92`, `:175`, `:189-192`.

---

### Issue 3 — Cook figure overhang collides with the Check button *(MAJOR)*
The Cook art hangs ~18px below its zone into the `.marks` row, landing the apron/arms on the Check button.

Affected pages: **r1-s2-bind**, **r1-s4-numbers**.

**Root cause:** `web/src/styles/lesson.css:190` — `.cook-stage { position:absolute; left:-8px; bottom:-18px; width:122px }` lets the ~157px art overhang its 92px `.cook-zone` (`:189`); `.marks`/`.check` (`:201-202`) is the next flex child with no clearance (cook bottom ~y728 vs Check top ~y713).

**Fix:** Add bottom clearance — `margin-bottom` on `.cook-zone`/`.hud`, set `.cook-stage` `bottom:0`, or clip the figure. File: `lesson.css:189-190` (+ optional `margin-top` on `.marks`).

---

### Issue 4 — `.joinbtn` lands top-left over the column + 9/7 tag *(MAJOR)*
The red "Group a piece into the whole" button renders at the canvas top-left flow origin, over the column blocks and the "9/7" tag, instead of below the column. It's also click-blocked by the overlapping tag (latent interaction bug, per `r5-s1-grouped` shoot note).

Affected pages: **r5-s1**, **r5-s2**.

**Root cause:** `web/src/styles/lesson.css:157` — `.joinbtn { position:absolute; z-index:22; all: unset; ... }`. `all: unset` comes **after** `position`/`z-index` and resets them (position→static, z-index→auto). `web/src/AppR5.jsx:512` supplies only inline `left`/`top` (no inline `position`), so the static box ignores them.

**Fix:** Move `all: unset` to the **front** of the rule (or drop it and unset individual props) so the later `position:absolute`/`z-index` + inline `top`/`left` win. File: `lesson.css:157`. Re-test that the button is then click-reachable (not behind the col-tag). NOTE: R1 and R2/R3 also use `.joinbtn` and currently look fine because their inline styles differ — do NOT regress those; verify R1-s1 "Count them up" and R2/R3 "Join the strips" still sit correctly after the change.

---

### Issue 5 — R4 bar value-note collides with the number-line ruler *(MAJOR)*
The gray italic note "same amount: 8/12 of a tray" sits in only a 10px gap between the bar bottom and the number line, so the ruler runs through the text.

Affected page: **r4-s1-fused**.

**Root cause:** `web/src/styles/r4.css:61` — `.r4-valnote { position:absolute; top:78px }` relative to `.r4-bar` (`BAR_Y=150`, `AppR4.jsx:40`) → note top y=228; plank bottom y=222, `LINE_Y=232`, leaving no room for the ~14px line-box.

**Fix:** Push the note below the number line (increase `top` past `LINE_Y`+labels) or move it above the bar. File: `r4.css:61` (coordinate with `BAR_Y`/`LINE_Y` in `AppR4.jsx:40`).

---

### Issue 6 — Audio: negative `volume` IndexSizeError + latent `BASE_VOL is not defined` *(non-visual, global)*
Nearly every page logs `IndexSizeError: Failed to set 'volume' ... outside the range [0,1]` (a fade ramp going negative). One shoot saw `BASE_VOL is not defined` thrown from `web/src/BackgroundMusic.jsx` on first render.

**Fix:** Clamp the fade volume to `[0,1]` (`Math.max(0, Math.min(1, v))`) before assigning `.volume`, and define/scope `BASE_VOL` in `web/src/BackgroundMusic.jsx`. Not a layout bug, but it spams the console on every screen.

---

## Per-page index (label → finding count)

| Label | Findings |
|---|---|
| title | 0 (audio console only) |
| world | 0 (audio console only) |
| mom | 1 (major) — Issue 1a |
| intro-r1 | 0 (clean) |
| r1-s1-manipulate | 2 (1 blocker Issue 2, 1 major Issue 1) |
| r1-s1-merged | 1 (blocker) — Issue 2 |
| r1-s2-bind | 1 (major) — Issue 3 |
| r1-s3-fade | 0 (clean) |
| r1-s4-numbers | 1 (major) — Issue 3 |
| r1-s5-words | 1 (major) — Issue 1 (Slate jammed at stage bottom) |
| r2-beat0 | 0 |
| r2-beat1 | 0 |
| r2-beat2 | 2 (major) — Issue 1 (write/diagram) + Check-over-NewProblem |
| r2-beat3 | 1 (major) — Issue 1 |
| r2-beat4 | 1 (major) — Issue 1 |
| r2-beat5 | 1 (major) — Issue 1 word-problem variant |
| r3-beat0 | 0 |
| r3-beat1 | 0 |
| r3-beat2 | 1 (major) — Issue 1 (Check over New problem) |
| r3-beat3 | 0 |
| r3-beat4 | 1 (major) — Issue 1 |
| r3-beat5 | 2 (1 major Issue 1 word-problem, 1 minor) |
| r4-s1 | 0 |
| r4-s2 | 2 (1 blocker Issue 1b, 1 major) |
| r4-s3 | 2 (1 blocker Issue 1b, 1 major) |
| r4-s4 | 2 (1 blocker Issue 1b, 1 major) |
| r4-s5 | 2 (1 blocker Issue 1 word-problem, 1 major) |
| r4-s1-fused | 1 (major) — Issue 5 |
| r5-s1 | 1 (major) — Issue 4 |
| r5-s2 | 2 (major) — Issue 1 + Issue 4 |
| r5-s3 | 1 (blocker) — Issue 1/2 |
| r5-s4 | 0 |
| r5-s5 | 0 |
| r5-s1-grouped | 0 (latent click-block noted) |

## Clean pages (no visual findings)
**title**, **world**, **intro-r1**, **r1-s3-fade**, **r2-beat0**, **r2-beat1**, **r3-beat0**, **r3-beat1**, **r3-beat3**, **r4-s1**, **r5-s4**, **r5-s5**, **r5-s1-grouped**.
