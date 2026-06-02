You are producing a high-fidelity DESIGN HANDOFF for one room of a children's
cooking-themed fraction-adding game (ages ~6–10). A gold-standard handoff already
exists for a different room; your job is to produce the equivalent bundle for the
COUNTING room — i.e. R1, "The Same-Pieces Room" (skill node ADD_SAME_DEN), where
same-size fraction pieces are added by counting them (the top number climbs, the
bottom stays locked).

Working directory: C:\Users\galen\Documents\gauntlet\fractions_tutorial

## STEP 1 — Read the gold-standard handoff (this is your format + design system)
Read ALL of these before writing anything:
- docs/design/design_handoff_matching_sizes/README.md            (the handoff SPEC — copy its structure)
- docs/design/design_handoff_matching_sizes/The Cook's Lesson - Matching Sizes.html  (page shell: all component CSS, fonts, stage scaling, script includes)
- docs/design/design_handoff_matching_sizes/styles/base.css      (shared design tokens — REUSE verbatim)
- docs/design/design_handoff_matching_sizes/r2/app.jsx           (behavior + math, source of truth for state)
- docs/design/design_handoff_matching_sizes/r2/Cook.jsx, Plank.jsx, Knife.jsx, Rosette.jsx

## STEP 2 — Read the counting room's curriculum spec (this is your CONTENT)
- docs/room_break_down/03_R1_add_same_denominator.md   (the room: concept, objects, mechanics, the four-stage problem progression, "beaten" criteria)
- docs/room_break_down/_TEMPLATE.md                    (shared room structure)
- docs/room_break_down/ASSET_CATALOG.md                (asset IDs referenced in §9)
- docs/room_break_down/README.md                       (the shared block→number fade spine)
Also honor the locked product decisions: the spoken goal is ALSO shown as an
on-screen caption (a goal caption band with a READ-ALOUD button), audience = readers/assisted.

## STEP 3 — Produce the bundle
Create: docs/design/design_handoff_same_pieces/  (mirror the matching_sizes layout)
  - README.md                              — the handoff spec, SAME section order and depth as the R2 README
  - The Cook's Lesson - Same Pieces.html   — self-contained page shell (React 18 + Babel via CDN, #fit/#stage scaling, all component CSS inline, same Google fonts)
  - styles/base.css                        — the SAME shared tokens (copy as-is; do not invent new colors/fonts)
  - r1/app.jsx + r1/Cook.jsx + r1/Rosette.jsx + the room's new component(s)

Reuse Cook.jsx and Rosette.jsx essentially unchanged (tutor + star rosette).
Replace the R2-specific mechanic components (Knife/Plank-slicing) with R1's mechanic.

## The COUNTING room's design (what to build)
Concept in one line: when pieces are the same size, add how many you have and keep the size.
Worked example for the prototype: 2/7 + 3/7 = 5/7 (use an "unfamiliar" denominator like
sevenths or fifths so the child must count, not recall).

Core mechanic — MERGE, not slice:
- Two stacks of identical unit pieces (e.g. sevenths), shown as two fractions.
- The child MERGES the two stacks into one; as pieces combine, the NUMERATOR (top)
  climbs via a running readout while the DENOMINATOR (bottom) is visibly PADLOCKED.
- The denominator lock is the room's signature: a wrong move that would change the
  bottom is blocked / visibly bounces. (Target misconception: 2/7 + 3/7 → 5/14.)
- Win condition: child states the total (numerator) and checks; the merged stack
  confirms it against the ruler.
- Include same-denominator SUBTRACTION too (the four-stage progression from §4.5):
  (1) add, blank=answer  (2) add, blank=a part  (3) subtract, blank=answer (new move:
  REMOVE pieces from a stack)  (4) subtract, blank=a part. The prototype should at
  minimum demonstrate stage 1 fully; structure the code so the others are reachable.

Map R2's parts onto R1:
- R2 "knives/slicing" → R1 "merge two same-size stacks" (and "remove pieces" for subtraction).
- R2 "match badge (blocks differ / blocks match)" → R1 "denominator lock" affordance
  (the padlock on the bottom slot; same-size pieces always mergeable).
- Keep: header (№/lesson tag/title + sound + start-over), goal caption band with
  READ-ALOUD, number-line/ruler, big stacked-fraction labels, the running count labels
  inside pieces, the bottom HUD (Cook + big answer equation with numerator/denominator
  inputs + Check button + Rosette), the muted→lit color treatment, prefers-reduced-motion.

## Visual fidelity (match exactly — pull tokens from base.css / the R2 HTML)
- Theme: the same vintage printed "Lesson" page — warm paper, ink + muted red,
  kitchen/cooking framing. This is Lesson 1 (it precedes Matching Sizes' Lesson 2),
  so label it accordingly (e.g. "LESSON 1 · ADDING FRACTIONS", "Same-Size Pieces").
- Colors: --paper-1 #ede2c8, --paper-2 #e3d4b1, --paper-3 #c9b78d, --ink #1c1612,
  --ink-soft #3a2e24, --ink-mute #6b5a47, --red #a32a22, --red-deep #6e1c16,
  --red-soft #c46a5f; letterbox bg #5b4327; frame #1a0f08.
- Fonts (Google): Russo One (display), Old Standard TT (serif/body), Stardos Stencil
  (stencil), Special Elite (typewriter), JetBrains Mono (mono).
- Stage: fixed 1280×800 logical, transform: scale() to fit, letterboxed on dark wood.
- Spacing scale 4/6/8/10/14/18/26px; hard button shadow 4px 4px 0 rgba(28,22,18,.28).
- Same paper/foxing SVG-filter textures, same animation grammar (stamp-in, sweep,
  match pulse, shakeX on wrong input), all art as styled DOM + inline SVG (no external assets).

## Fidelity bar & deliverable notes
- High-fidelity: final colors, type, spacing, interactions — a working interactive
  prototype, not a static mock. The HTML/CSS/JSX are DESIGN REFERENCES (React + Babel
  from CDN, CSS-driven motion), not production code — say so in the README's
  "About the Design Files" section exactly as the R2 README does.
- The README is the human-readable spec; the .jsx is the source of truth for behavior
  and math; the HTML/CSS is the source of truth for styling. Mirror that framing.
- In the README, fill in: Overview, About the Design Files, Fidelity, Screen breakdown
  (header / goal caption band / play area / HUD with measurements), Interactions &
  Behavior, State Management (list the actual state vars you use — e.g. counts, locked
  denominator, merged, solved, stars, typed answer), Design Tokens, Assets, Files.

Deliver the full bundle, then give me a short summary of what you built and any places
you deviated from the R2 reference.
