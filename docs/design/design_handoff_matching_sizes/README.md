# Handoff: R2 "Same-Size Pieces" — Adding Unlike-Denominator Fractions

## Overview
An interactive teaching screen for a children's cooking-math game (ages ~6–10). It teaches that **different-size fraction pieces can't be added until they're cut to the same size**. The worked example is **1/2 + 1/3 = 5/6**. The child slices two dough "strips" into same-size blocks with marked knives (×2 / ×3 / ×4), joins them on a number line, then **types the total** to solve.

The whole thing is presented as a vintage printed "Lesson 2" page (warm paper, ink + muted-red, Old Standard TT / Russo One typography), matching an existing Knight's-Tour puzzle in the same product.

## About the Design Files
The files in this bundle are **design references created in HTML/CSS + React-via-Babel** — a working prototype showing the intended look, layout, and behavior. **They are not production code to ship directly.** The task is to **recreate this design in your real application's environment** (React + Framer Motion was the original target per the brief), using your codebase's established component patterns, state libraries, and animation tools. If you have no environment yet, React + DOM/SVG + Framer Motion is a good fit (the prototype hand-rolls motion with CSS transitions/keyframes — you can replace those with `motion/react`).

The game logic in `r2/app.jsx` is the **source of truth for behavior and math**; read it closely. The HTML/CSS is the source of truth for visual styling.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and interactions. Recreate the UI faithfully using your codebase's libraries. Exact tokens and measurements are listed below.

---

## Screen: "Same-Size Pieces" (single screen)
Fixed logical stage **1280×800**, scaled to fit the viewport (`transform: scale()` on `#stage`, letterboxed on a dark-wood background). Four regions, top→bottom:

### 1. Header (slim, ~52px)
- Left: a square **№2** badge (44×44, 2px red border, red text, Russo One 18px) + tag "LESSON 2 · ADDING FRACTIONS" (Russo One 10.5px, red, 0.30em tracking, uppercase) + title "Same-Size Pieces" (Russo One 23px, ink).
- Right: two 38×38 icon buttons — **sound mute toggle** (speaker / speaker-with-slash SVG) and **start-over** (⟲). Bordered, paper bg, ink icon; the active sound button is filled ink.
- Bottom border: 1.5px solid ink.

### 2. Goal caption band (~52px)
- Full-width bar, 1.5px ink border, paper-2 bg with faint vertical hairline texture.
- Left: a **"READ ALOUD"** pill button (1px red border, red Russo One 10px, speaker SVG) — triggers Web Speech synthesis of the goal.
- Center: goal text (Old Standard TT 19px): *"Mom needs **1/2** of a dough strip and **1/3** of a strip — add them together."* (bold fractions in deep-red).

### 3. Play area (two columns: diagram `1fr` + right rail `320px`, 26px gap, top-aligned)
**Diagram (left):** a bordered box (2px `#1a0f08`, inner ivory glow) tightly framing a **720px-wide canvas** that hosts a **0→1 number line**:
- **Number line / ruler:** horizontal ink rule with ticks at each twelfth (taller at sixths). Labels (italic Old Standard TT 11px, ink-mute): `0`, `1/3`, `1/2`, `2/3`, `5/6`, `1`. (5/6 is intentionally NOT highlighted.)
- **Strip A = 1/2** (red, diagonal-hatch fill) sits on the line at x=0, width = 0.5 × unit. **Strip B = 1/3** (cream/paper, cross-hatch fill) floats above, x=0, width = 0.333 × unit. Their differing widths are the core visual.
- Above each strip: a **large stacked fraction** (Russo One ~22px num / rule / den) showing the strip's current value (`1/2` → `3/6` after slicing). Beside it when sliced: a red `×N` stencil chip and a small `↺` undo button.
- Inside each block: the **running count** label (`1/6`, `2/6`, `3/6`…) in Russo One (paper text on red, ink text on cream).
- **Floating match badge** top-right of the canvas (absolute): a large eqstate pill. Unmatched = paper-2 bg, ink, "≠ blocks differ". Matched = **red bg, paper text, "= blocks match"**, with a scale-pop animation.
- A red **"▸ Join the strips"** button appears near the strips once matched.

**Right rail (320px):**
- **"THE KNIVES"** panel: three chef-knife icons marked **×2 / ×3 / ×4** (steel blade, red riveted handle, ×N on the handle), each labeled "→ 2/3/4 pieces". Knives are the draggable slicing tools.
- **"ON THE PLATE"** panel: a pie/tart graphic dividing into D slices with the answer shaded (shows the 5/6 goal faintly until solved) + "1/2 + 1/3 = ?".

### 4. HUD (bottom)
Three columns: cook (left) · big equation (center) · marks+Check (right).
- **Tutor "Cook"** (bottom-left): a friendly hand-drawn two-tone woodcut chef (SVG, expression states idle/think/cheer) with a speech ribbon showing live status/feedback.
- **Big answer equation (center):** `1/2 + 1/3 = ▢/▢` — Russo One **58px**, with two large **88×82px** input boxes for numerator/denominator (over a fraction rule). Disabled/greyed until the blocks match; small italic caption beneath ("make same-size blocks to unlock the answer" → "count the blocks and type the total" → "full marks — …").
- **Right:** a 3-star **rosette** (shown on success) + a big **Check** button (Russo One 18px, ink fill, 4px hard offset shadow; becomes "New strips" when solved).

---

## Interactions & Behavior
- **Slicing (the mechanic):** Drag a knife (n = 2/3/4) onto a strip. That **sets the strip's slice multiplier `m = n`** — every original piece becomes `n` equal blocks. So strip A shows `(1·m)/(2·m)`, strip B shows `(1·m)/(3·m)`. A knife sweep animation + `×N` chip play on the strip. (Each knife re-divides from the original; it does not compound.)
- **Match:** blocks are the same size when **denominators are equal: `2·mA === 3·mB`**. With only ×2/×3/×4 available, the single reachable solution is `mA=3, mB=2` → both in **sixths** (3/6 + 2/6). On match: strips light up to full color, the badge flips to "blocks match" (pops), the Join button appears, the answer inputs unlock.
- **Muted → lit:** strips render desaturated (`filter: saturate(.32) brightness(.96) opacity(.7)`) until matched, then full color (`saturate(1.1) brightness(1.04)`), with a 0.45s transition + red glow pulse on matched strips.
- **Join:** drag the two strips together (or press "Join the strips"). If matched → they fuse into one combined strip of `mA+mB` blocks (3 red + 2 cream) spanning 0→5/6, blocks labeled `1/6…5/6`. If NOT matched and dragged together → they bounce back and shake ("they don't fit — slice them to match first").
- **Answer entry (the goal/end state):** once matched, the child types the total into the big bottom equation. **Check** validates: correct iff `n>0 && d>0 && n*6 === d*5` (i.e., equals 5/6). Correct → auto-join, award stars (`d===6 ? 3 : d===12 ? 2 : 1`), cook cheers, success caption. Wrong → input shake + cook "think" + nudge ("count every block… how many sixths in all?"). Pressing Check before matching → "slice both strips into same-size blocks first."
- **Undo:** the `↺` button on each strip resets that strip to whole (`m=1`). (`Start over` ⟲ in the header resets everything.)
- **Audio:** Web Speech `speechSynthesis` reads the goal and feedback lines; the header speaker button mutes/unmutes. Never autoplays — only fires on user gestures.
- **Accessibility:** quantity is tied to a numeral by **pattern + position**, not color alone (each strip has a distinct hatch); large touch targets; `prefers-reduced-motion` reduces all animations/transitions to ~0. Inputs are numeric-only, max 2 digits, Enter submits.

## State Management
Key state (see `r2/app.jsx`):
- `mA`, `mB` — slice multipliers for strip A (base 1/2) and B (base 1/3). Start at 1.
- `matched` (derived) — `2*mA === 3*mB`.
- `joined`, `solved` (booleans), `stars` (0–3).
- `numStr`, `denStr` — the typed answer.
- `posA`, `posB` — strip positions (for dragging); `dragBar`, `dragKnife` — active drag.
- `cook` — tutor expression `idle | think | cheer`; `status` — `{tone, text}` for the ribbon; `soundOn`, `speaking`.
- `tickA/tickB` — increment to replay slice animations; `histRef` — undo history.
- Live `useRef` mirrors (`mARef`, `matchedRef`, etc.) so rapid pointer-event handlers read current values without stale closures — important if you reimplement the drag handlers.

## Design Tokens (from `styles/base.css`)
Colors: `--paper-1 #ede2c8`, `--paper-2 #e3d4b1`, `--paper-3 #c9b78d`, `--ink #1c1612`, `--ink-soft #3a2e24`, `--ink-mute #6b5a47`, `--red #a32a22`, `--red-deep #6e1c16`, `--red-soft #c46a5f`. Letterbox bg `#5b4327`; frame `#1a0f08`.
Fonts (Google): display `Russo One`; serif/body `Old Standard TT`; stencil `Stardos Stencil`; typewriter `Special Elite`; mono `JetBrains Mono`.
Spacing scale: 4 / 6 / 8 / 10 / 14 / 18 / 26 px. Hard button shadow: `4px 4px 0 rgba(28,22,18,.28)`.
Geometry constants (`app.jsx`): stage 1280×800; canvas `CW 720 × CH 346`; number-line `ORIGIN x=60`, `UNIT=600`, `LINE_Y=322`; bar height 72; strip A value 0.5, B value 0.333.

## Assets
No external art. The chef tutor, knives, strips, ruler, pie, and stars are all drawn with **styled DOM + inline SVG** (`r2/Cook.jsx`, `r2/Knife.jsx`, `r2/Plank.jsx`, `r2/Rosette.jsx`, and the `Plate`/`Combined` helpers in `r2/app.jsx`). Paper/foxing textures are inline SVG-filter data-URIs in the HTML. Replace or keep as you like.

## Files (in this bundle)
- `The Cook's Lesson - Matching Sizes.html` — page shell: fonts, all CSS (the visual source of truth), stage scaling, script includes.
- `r2/app.jsx` — **game logic & layout** (state machine, slicing, matching, join, answer-checking, scoring, drag handlers). Source of truth for behavior.
- `r2/Cook.jsx` — tutor chef (SVG, expression states).
- `r2/Knife.jsx` — a chef-knife icon marked ×N.
- `r2/Plank.jsx` — a fraction strip (blocks, hatching, running labels).
- `r2/Rosette.jsx` — the star rating.
- `styles/base.css` — shared design tokens (colors, fonts, paper textures).

> Note: the prototype loads React 18 + Babel from CDN and uses CSS-driven motion. In your app, compile the JSX normally and swap the CSS keyframes/transitions for your animation library (Framer Motion `motion/react` springs for the knife sweep, block re-slice, match snap/glow, and merge).
