# Handoff: R1 "Counting the Pieces" — Adding Same-Denominator Fractions

## Overview
An interactive teaching screen for a children's cooking-math game (ages ~6–10). It teaches
the first true fraction skill: **when the pieces are the same size, you add how many you
have and keep the size** — the top number grows, the bottom number stays put. The worked
example is **2/7 + 3/7 = 5/7**. The child drags two stacks of same-size pieces together,
the pieces **count up** into one stack while the **denominator stays locked**, then the
child **types the total** (the numerator only — the bottom is padlocked) to solve.

The room's signature is the **locked denominator**: a visible padlock on every bottom
number. The child can never change it, so the misconception this room targets —
*adding the bottoms too* (`2/7 + 3/7 → 5/14`) — is made structurally impossible rather
than merely discouraged.

The whole thing is presented as a vintage printed "Lesson 1" page (warm paper, ink +
muted-red, Old Standard TT / Russo One typography), matching the existing R2 "Same-Size
Pieces" lesson and the Knight's-Tour puzzle in the same product. This is **Lesson 1**, the
room *before* R2 in curriculum order.

## About the Design Files
The files in this bundle are **design references created in HTML/CSS + React-via-Babel** —
a working prototype showing the intended look, layout, and behavior. **They are not
production code to ship directly.** The task is to **recreate this design in your real
application's environment** (React + Framer Motion was the original target per the brief),
using your codebase's established component patterns, state libraries, and animation tools.
If you have no environment yet, React + DOM/SVG + Framer Motion is a good fit (the prototype
hand-rolls motion with CSS transitions/keyframes — you can replace those with `motion/react`).

The game logic in `r1/app.jsx` is the **source of truth for behavior and math**; read it
closely. The HTML/CSS is the source of truth for visual styling.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and interactions. Recreate the
UI faithfully using your codebase's libraries. Exact tokens and measurements are listed below.

---

## Screen: "Counting the Pieces" (single screen)
Fixed logical stage **1280×800**, scaled to fit the viewport (`transform: scale()` on
`#stage`, letterboxed on a dark-wood background). Four regions, top→bottom:

### 1. Header (slim, ~52px)
- Left: a square **№1** badge (44×44, 2px red border, red text, Russo One 18px) + tag
  "LESSON 1 · ADDING FRACTIONS" (Russo One 10.5px, red, 0.30em tracking, uppercase) + title
  "Counting the Pieces" (Russo One 23px, ink).
- Right: two 38×38 icon buttons — **sound mute toggle** (speaker / speaker-with-slash SVG)
  and **start-over** (⟲). Bordered, paper bg, ink icon; the active sound button is filled ink.
- Bottom border: 1.5px solid ink.

### 2. Goal caption band (~52px)
- Full-width bar, 1.5px ink border, paper-2 bg with faint vertical hairline texture.
- Left: a **"READ ALOUD"** pill button (1px red border, red Russo One 10px, speaker SVG) —
  triggers Web Speech synthesis of the goal.
- Center: goal text (Old Standard TT 19px): *"Mom needs **2/7** of a tray and **3/7** of a
  tray — the pieces are the same size, so add them up."* (bold fractions in deep-red).
- The voiced goal and the on-screen caption carry the same words (per the locked
  goal-on-screen decision): there is no non-reader-only channel.

### 3. Play area (two columns: diagram `1fr` + right rail `320px`, 26px gap, top-aligned)
**Diagram (left):** a bordered box (2px `#1a0f08`, inner ivory glow) tightly framing a
**720px-wide canvas** that hosts a **0→1 number line**:
- **Number line / ruler:** horizontal ink rule with a tick at every **seventh**. Labels
  (italic Old Standard TT 11px, ink-mute): `0`, `1/7`, `2/7`, `3/7`, `4/7`, `5/7`, `6/7`, `1`.
  (5/7 is intentionally NOT highlighted.)
- **Stack A = 2/7** (red, diagonal-hatch fill) sits on the line at x=0; **Stack B = 3/7**
  (cream/paper, cross-hatch fill) floats above, x=0. **Both are made of identical-width
  pieces** — that sameness is the whole premise (contrast R2, whose strips were deliberately
  *different* widths).
- Above each stack: a **large stacked fraction** (Russo One ~22px num / rule / den) showing
  the stack's value, with a **padlock on the denominator**.
- Inside each piece: the **running count** label (`1/7`, `2/7`, `3/7`…) in Russo One (paper
  text on red, ink text on cream) — the child literally reads the climbing tops.
- **Floating lock badge** top-right of the canvas (absolute): a pill reading
  **🔒 "bottom stays /7"** — the standing rule, where R2 had its ≠/= match badge.
- A red **"▸ Count them up"** button near the stacks (always available — same-size pieces
  are always mergeable).

**Right rail (320px):**
- **"KEEP THE BOTTOM"** panel: the rule in one line + a **lock card** showing a big
  `+ / 7` fraction with a padlock and the words "ADD THE TOPS / KEEP THE 7". This replaces
  R2's "THE KNIVES" tool panel — R1 has no cutting tool; its move is *merge*.
- **"ON THE TRAY"** panel: a pie/tart graphic dividing into 7 slices with the answer shaded
  (shows the 5/7 goal faintly until solved) + "2/7 + 3/7 = ?".

### 4. HUD (bottom)
Three columns: cook (left) · big equation (center) · marks+Check (right).
- **Tutor "Cook"** (bottom-left): a friendly hand-drawn two-tone woodcut chef (SVG,
  expression states idle/think/cheer) with a speech ribbon showing live status/feedback.
- **Big answer equation (center):** `2/7 + 3/7 = ▢/🔒7` — Russo One **58px**. The
  **numerator** is a large **88×82px** input box; the **denominator is a locked, hatched
  88×82 cell pre-filled with `7` and a padlock** (not an input — it literally cannot be
  typed in). The numerator is disabled/greyed until the stacks are merged; small italic
  caption beneath ("count the pieces to unlock the answer" → "count the pieces and type the
  top number" → "full marks — …").
- **Right:** a 3-star **rosette** (shown on success) + a big **Check** button (Russo One
  18px, ink fill, 4px hard offset shadow; becomes "New stacks" when solved).

---

## Interactions & Behavior
- **Merge (the mechanic):** Drag one stack onto the other (or press **"Count them up"**).
  The two stacks fuse into a single stack of `a+b` pieces (2 red + 3 cream) spanning
  `0→5/7`, pieces labeled `1/7…5/7`; a sweep animation plays and the merged stack glows.
  Because the pieces are the same size, the merge is **always legal** — there is no match
  gate (this is the structural difference from R2, where merging was blocked until sizes
  matched). On merge: the answer numerator input unlocks and focuses.
- **The denominator lock (the signature):** every bottom number wears a padlock and is
  **immutable** — on the two stacks, on the merged stack, on the lock card, and on the
  answer equation. The child works only the tops. The target misconception (`5/14`) cannot
  be entered: the bottom answer cell is not editable.
- **Lit / glow:** the stacks render in full color (they are always valid — same-size pieces
  are real, not "wrong until fixed"). On merge the combined stack does a **red glow pulse**
  (0.45s transition + `matchPulse`) as the success/confirmation beat. *(This is how R1 uses
  R2's muted→lit grammar: as a merge-confirmation glow rather than a mismatch gate, since
  R1 has no mismatch state.)*
- **Answer entry (the goal/end state):** once merged, the child types the total numerator
  into the big bottom equation. **Check** validates: correct iff `n === a+b` (i.e. `5`,
  with the denominator fixed at `7`). Correct → award stars, cook cheers, success caption.
  Wrong numerator → input shake + cook "think" + nudge ("count every piece — how many
  sevenths in all?"); a number that looks like the child reached for the bottom triggers a
  pointed "the bottom number is locked — we only count the tops." Pressing Check before
  merging → "bring the two stacks together and count the pieces first."
- **Undo / split:** the `↺` button on the merged stack splits it back into the two stacks
  (`merged → false`). (`Start over` ⟲ in the header resets everything.)
- **Audio:** Web Speech `speechSynthesis` reads the goal and feedback lines; the header
  speaker button mutes/unmutes. Never autoplays — only fires on user gestures.
- **Accessibility:** quantity is tied to a numeral by **pattern + position**, not color
  alone (each stack has a distinct hatch — red diagonal vs. ink cross-hatch); large touch
  targets; `prefers-reduced-motion` reduces all animations/transitions to ~0. The numerator
  input is numeric-only, max 2 digits, Enter submits; the denominator is non-interactive.

### Problem progression (reachable, not all wired)
This prototype wires **stage 1** (addition, blank = answer) fully. The room's full
four-stage progression (R1 §4.5) is reachable by varying one `PROBLEM = { op, a, b, den }`
object at the top of `app.jsx`:
1. **Addition, blank = answer** — `2/7 + 3/7 = ?` *(wired)*.
2. **Addition, blank = a part** — `2/7 + ?/7 = 5/7` (add pieces *up to* a shown total).
3. **Subtraction, blank = answer** — `5/7 − 2/7 = ?`; introduces the new block move
   **remove pieces** from a stack (the inverse of merge), bottom still locked.
4. **Subtraction, blank = a part** — `5/7 − ?/7 = 2/7`.
All four reuse the same Stack/Combined/merge machinery and the locked denominator — only
the final verb (merge vs. remove) and which slot is blank change.

## State Management
Key state (see `r1/app.jsx`):
- `merged` (boolean) — the two stacks have been counted up into one.
- `solved` (boolean), `stars` (0–3).
- `numStr` — the typed answer numerator (the denominator is a fixed constant `DEN`, never
  state, because it is locked).
- `mergeTick` — increments to replay the merge sweep animation.
- `posA`, `posB` — stack positions (for dragging); `dragBar` — the active drag.
- `shakeA`, `shakeB` — bounce feedback; `badInput` — wrong-answer shake on the numerator.
- `cook` — tutor expression `idle | think | cheer`; `status` — `{tone, text}` for the
  ribbon; `soundOn`, `speaking`.
- Module constants drive the math: `PROBLEM = { op, a, b, den }`, `ANSWER` (derived),
  `DEN` (the locked denominator). Live `useRef` mirrors (`mergedRef`, `solvedRef`,
  `posARef`, `posBRef`, `soundRef`) let rapid pointer-event handlers read current values
  without stale closures — important if you reimplement the drag handlers.

## Design Tokens (from `styles/base.css`)
Colors: `--paper-1 #ede2c8`, `--paper-2 #e3d4b1`, `--paper-3 #c9b78d`, `--ink #1c1612`,
`--ink-soft #3a2e24`, `--ink-mute #6b5a47`, `--red #a32a22`, `--red-deep #6e1c16`,
`--red-soft #c46a5f`. Letterbox bg `#5b4327`; frame `#1a0f08`.
Fonts (Google): display `Russo One`; serif/body `Old Standard TT`; stencil
`Stardos Stencil`; typewriter `Special Elite`; mono `JetBrains Mono`.
Spacing scale: 4 / 6 / 8 / 10 / 14 / 18 / 26 px. Hard button shadow:
`4px 4px 0 rgba(28,22,18,.28)`.
Geometry constants (`app.jsx`): stage 1280×800; canvas `CW 720 × CH 346`; number-line
`ORIGIN x=60`, `UNIT=600`, `LINE_Y=322`; stack height 72; `DEN=7`, stack A `2/7`, B `3/7`.

## Assets (see `../../room_break_down/ASSET_CATALOG.md`)
No external art. The chef tutor, stacks, ruler, tray, padlock, and stars are all drawn with
**styled DOM + inline SVG** (`r1/Cook.jsx`, `r1/Stack.jsx`, `r1/Rosette.jsx`, and the
`Combined`/`Tray`/`Lock`/`BigFrac` helpers in `r1/app.jsx`). Paper/foxing textures are
inline SVG-filter data-URIs in the HTML. Referenced functional asset IDs:

- Scene: `scene.room_generic` (`room_motif`), `scene.bare_slate` (final phase, not in this
  single-screen prototype).
- Characters: `tutor_guide` (Cook), `reward_payoff` (the tray/treat).
- Manipulables: `block`, `stack`, `ruler`, `merge_zone`.
- Symbolic: `numeral_glyph`, `fraction_label` (incl. `[denominator_locked]` — the padlock),
  `operator_glyph`, `tally_readout` (the running count), `equation_frame`.
- Tools: `slate` (final phase). Note R1 uses **no** room-specific verb-tool — its verb is
  the shared `merge_zone`, not a `slicer_tool`/`fuse_tool`.
- Feedback/control: `check_button`, `feedback_burst`, `progress_indicator`.

## Files (in this bundle)
- `The Cook's Lesson - Counting the Pieces.html` — page shell: fonts, all CSS (the visual
  source of truth), stage scaling, script includes.
- `r1/app.jsx` — **game logic & layout** (state machine, merge, answer-checking, scoring,
  drag handlers, the `Combined`/`Tray`/`Lock`/`BigFrac` helpers). Source of truth for behavior.
- `r1/Cook.jsx` — tutor chef (SVG, expression states). *Reused unchanged from R2.*
- `r1/Stack.jsx` — a stack of same-size fraction pieces (running count labels). *New — R1's
  mechanic component, replacing R2's `Plank`/`Knife`.*
- `r1/Rosette.jsx` — the star rating. *Reused from R2 (comment adjusted for R1 scoring).*
- `styles/base.css` — shared design tokens (colors, fonts, paper textures). *Identical to R2.*

> Note: the prototype loads React 18 + Babel from CDN and uses CSS-driven motion. In your
> app, compile the JSX normally and swap the CSS keyframes/transitions for your animation
> library (Framer Motion `motion/react` springs for the merge sweep, count-up, glow pulse,
> and the wrong-answer shake).
