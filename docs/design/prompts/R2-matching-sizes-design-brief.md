# R2 Matching-Sizes Room — Design Brief / Hand-off Prompt

> Paste-ready prompt to design the **R2 (ADD_UNLIKE_DEN) Matching-Sizes Room** in a fresh
> Claude (design/artifact mode) or another design tool. Self-contained — assumes no repo
> access. Scoped to the **L0 lead beat** (slice → match → merge). Source of truth this was
> distilled from: `docs/room_break_down/04_R2_add_unlike_denominator.md` and
> `docs/design/presentation-scene-architecture.md` (§4 scene grammar, §4.1 budget, §5 goal
> communication, §10 R2 lead scene). Reflects the locked decision that the voiced goal is
> also shown on screen as text (no separate non-reader channel).

---

You are designing one screen of a children's web game that teaches adding fractions. I want a polished, interactive design for **the Matching-Sizes Room (R2): adding unlike denominators**. Build it as a single-file React artifact using Framer Motion (`motion/react`) — production-quality visual design, not generic AI slop.

## The game, briefly
A cooking-themed fractions tutor for young kids (roughly ages 6–10). "Mom" asks for recipe amounts; the child manipulates physical-feeling pieces to build the answer. The math IS the mechanic — no bolted-on points. Warm, tactile, calm-but-playful, high-contrast, friendly. This screen is the real art layer (a "Kitchen" skin), so make it feel like a real, lovable product.

## What this room teaches
Different-size pieces can't be added until you cut them to the same size first. Worked example to build around: **½ cup + ⅓ cup**.
- The two bars start visibly mismatched (a ½ piece is wider than a ⅓ piece).
- The child **slices** each bar into smaller equal pieces until both are made of the SAME size: sixths.
  - ½ → slice each piece into 3 → **×3 on top and bottom** → 3/6
  - ⅓ → slice each piece into 2 → **×2 on top and bottom** → 2/6
- Once both bars are sixths, their piece widths match and the **merge unlocks**: 3/6 + 2/6 = **5/6**.
- Key truths to make visible: slicing multiplies top AND bottom together (the ×N always hits both); the bar's amount/length never changes (same amount, more cuts); mismatched bars literally cannot merge (the lesson, enforced as a rule).

## Scene layout (fixed logical stage: 1280×800, landscape; scale-to-fit the viewport)
Four regions, top to bottom:
- **Goal cue (~9%, top):** the prompt, e.g. "One half plus one third." It is **spoken aloud AND shown on screen as text** (caption). Minimal chrome.
- **Play space (~80%, the hero):** the two mismatched fraction bars laid on a common unit ruler, plus the **slicer tool** (the room's signature object, dragged across a bar to cut it). The ×N indicator appears on top and bottom of a bar as it's sliced. A merge zone is where matched bars combine.
- **HUD (~11%, bottom):** one persistent **Check** action (big touch target), a quiet progress/treat cue, and a **star rating** on result.
- **Tutor corner:** a friendly character that reacts and speaks the goal.

**Complexity budget — keep it parseable in one glance.** At this lead beat show ONLY: the two bars + the slicer + the equation target + Check. Do NOT show a denominator picker or a "common-size guide" grid here (those belong to later, faded beats). Exactly ONE emphasis target on screen: the mismatched widths and the ×N.

## The interaction to implement (make it juicy)
1. Two mismatched bars sit on the ruler; trying to merge them is rejected (gentle shake — "they don't line up").
2. The child drags the **slicer** across a bar → it cuts each piece into N equal sub-pieces with a satisfying slice animation; **×N animates onto both the numerator and denominator together**; the bar's total length is preserved.
3. When both bars reach the same piece size (sixths), they **snap to equal piece widths** and glow — the merge unlocks.
4. Merge → the pieces combine into **5/6**; celebrate (glow + the tutor/mom approves).

## Feedback & scoring rules (important)
- Feedback is honest, instant, and gentle. Correct / incorrect / at-target are visually distinct; errors never punish.
- **Over-slicing is correct, not wrong.** If the child cuts to a bigger-than-needed common size (twelfths → 6/12 + 4/12 = 10/12), mark it **correct**, award **fewer stars**, and offer an OPTIONAL soft nudge: "That works! Can you do it with fewer, bigger cuts?" Never mark it wrong, never force a retry, never demand simplifying the answer (simplifying is a later room). Full stars only for the least common size (sixths).

## Constraints
- 2D only. Web stack: React + DOM/SVG + Framer Motion. No 3D, no canvas/WebGL, no external art assets — draw the bars, ruler, slicer, and pieces with styled DOM/SVG.
- Accessibility: do NOT rely on color alone to link a quantity to its numeral (also use a pattern/shape or a connector); large touch targets (≥60px for primary manipulables/buttons); honor `prefers-reduced-motion` with calmer transitions.
- Keep element identity, layout, and affordances stable and legible (this design is a "skin" over fixed game logic): what's draggable must look grabbable, locked must look locked.

## Deliverable
First, briefly propose the visual system (palette, type, spacing scale, motion personality) in 4–6 lines. Then build the **single-file React artifact** for the R2 lead beat: the full slice → match → merge → answer flow on the 1280×800 stage, animated with Framer Motion, with the goal caption, HUD (Check + stars), and tutor corner. Make the slicing and the bars-snapping-to-equal-widths feel genuinely good. Then suggest 2–3 directions I might iterate on next.
