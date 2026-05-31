# Room: The Matching-Sizes Room (R2 — ADD_UNLIKE_DEN)

> First-pass room breakdown. Abstracted, gaming-flow focused. The richest room — the
> hardest wall and the best transfer moment. Grounded in
> `docs/design/fraction-app-state-model.md`.

---

> **Scene & layout:** this room's on-screen layout follows the play-space-first scene grammar in
> `docs/design/presentation-scene-architecture.md` (§4 space-trade, §4.1 complexity budget,
> §5 goal-communication). R2 is the §4.1 validation case. Its precise per-beat scene
> breakdown is in that doc's §10.

## 1. Snapshot

- **Skill node:** `ADD_UNLIKE_DEN`
- **Comes after / leads to:** after `ADD_SAME_DEN` → `SIMPLIFY` and `IMPROPER_TO_MIXED`.
- **Concept in one line:** different-size pieces can't be added until you cut them to the
  same size first.
- **What the child can do after:** turn two unlike fractions into like ones (scale top and
  bottom together), then add.

## 2. The Wall

A recipe needing, say, 1/2 cup plus 1/3 cup. The R1 move fails — the pieces don't stack
evenly, there's no clean line. Missing idea: *re-cut* the pieces to the same size before
the old adding move works.

## 3. The Block↔Number Bridge

- **What the blocks mean here:** two stacks of *different-size* pieces that won't line up;
  and slicing each piece into smaller equal pieces until both match.
- **What the numbers mean:** slicing each piece into N = multiplying top and bottom by N;
  a common size = a common denominator. The *value* doesn't change — same amount, more cuts.
- **The moment it clicks:** slicing 1/2 and 1/3 until both are sixths, the bars become the
  same width and the heights are unchanged — now addable by the R1 rule.

## 4. Game Objects, Mechanics & Interactions

### 4.1 Objects (the nouns on screen)
- **Two unlike bars** — fraction bars of different piece sizes, visibly mismatched.
- **The slicer tool** — the room's signature object; dragged across a bar to cut each piece
  into N smaller equal pieces.
- **×N indicator** — appears on **both top and bottom** of a fraction as it's sliced,
  binding "cut into more = multiply top and bottom the same."
- **Common-size guide** — a faint shared grid both bars must reach before merging unlocks.
- **Merge zone** — where the now-matching bars combine (reusing the R1 merge).
- **Denominator picker** (later beats) — choose the common denominator and multipliers
  symbolically.
- **Write-pad / check button.**

### 4.2 Mechanics (the rules)
- **Mismatched bars cannot merge** — the merge is locked until both reach the same piece
  size. This *is* the lesson, enforced as a rule.
- **Slicing multiplies top and bottom together** — the ×N always hits both; you can't slice
  only the bottom.
- A bar's **height/value stays fixed** through slicing (same amount, re-cut).
- Once both bars share a size, the **R1 merge unlocks** and behaves exactly as the
  Same-Pieces room.
- New-dress: pairs where one denominator already divides the other — the "obvious cut"
  differs, so finding a common size must be real, not rote.
- **Over-slicing is legal but not free** — a child may cut to a bigger-than-needed common
  size (twelfths instead of sixths). The merge still works and the answer is correct, but
  it scores lower and earns a soft "fewer cuts?" nudge. The full rule is §4.6.

### 4.3 Interactions (player verbs)
- **Drag slicer across a bar** (slice_bar) — the new verb; cuts pieces into N.
- **Choose common denominator / multipliers** (select_common_denominator) — symbolic
  version in faded beats.
- **Merge matched bars** (merge_stacks) — carried from R1 (addition).
- **Remove matched pieces** (remove_pieces) — the take-away verb for subtraction (see
  §4.5), after both bars share a size.
- **Write the result** (write_fraction).

### 4.4 Progression of objects & mechanics
| Level | Objects present | Key mechanic | Player verb | Link shown by |
|-------|-----------------|--------------|-------------|---------------|
| L0 blocks lead | two unlike bars, slicer | merge locked till sizes match | drag slicer to cut | bars snap to equal width |
| L1 + write | sliced bars, ×N indicator | ×N on top AND bottom | write the re-cut fraction | ×N binds slicing to multiplying |
| L2 blocks fade | labeled outlines, denom picker | choose common size | pick denominator + multipliers | choosing replaces dragging |
| L3 numbers lead | `1/2 + 1/3 = ?` | scale then R1-add | solve symbolically | bars only as a check |
| L4 new dress | `1/4 + 3/8`, odd pairs, sideways | common-size must be found | solve, numbers only | strong transfer test |
| L5 bare + ghost backdrop | `1/2 + 1/3 = ?`, bars faded behind | bare math, bars as a memory anchor | **write solution with stylus** | symbols stand alone; the backdrop then dissolves |
| L6 bare slate | `1/2 + 1/3 = ?` only, empty slate | no manipulatives at all | **write solution with stylus** | nothing but the symbols remain |

### 4.5 Problem Progression (operation × unknown position)

This room explicitly teaches and tests **both unlike-denominator addition and
subtraction**. Every stage first requires re-cutting both fractions to a common size
(the room's core skill); the operation then happens on the matched pieces. Four stages:

1. **Addition, blank = answer** — `1/2 + 1/3 = ?`. Slice both to sixths, then add.
2. **Addition, blank = a part** — `1/2 + ? = 5/6`. Bring both to sixths, then fill the
   shorter bar **up to** the target; the added pieces are the answer.
3. **Subtraction, blank = answer** — `5/6 − 1/3 = ?`. Slice both to a common size, then
   the new block move: **take the matched pieces away**; what remains is the answer.
4. **Subtraction, blank = a part** — `5/6 − ? = 1/2`, `? − 1/3 = 1/2`.

- **New block move introduced:** **remove matched pieces** (take-away) after re-cutting —
  subtraction reuses the slicer/common-size machinery, only the final step (remove vs.
  merge) differs. This is the hardest operation in the curriculum, so it sits late.
- **Fade still applies** to each stage (L0→L6), ending at bare handwritten `5/6 − 1/3 = ?`.
- **Sequencing:** stages run 1→4; within each, blank-in-answer before blank-in-a-part.

### 4.6 Over-slicing: when the child cuts to a bigger-than-needed common size

The room's elegant move is the **least** common denominator (sixths for `1/2 + 1/3`). But a
child can slice further than needed — to twelfths, say — and still add correctly, landing on
a value-correct but un-tidy answer (`10/12` instead of `5/6`). How the room scores this is a
real design fork; here is the decision and the reasoning, so it can be argued with.

**Decision: mark it correct, award fewer stars, and offer an *optional* "fewer cuts?"
challenge. Never mark it wrong, never mark it "partially correct," never force a retry, and
never demand simplifying the answer.**

Why this and not "partially correct + must retry" or a forced reduction:

- **It IS correct.** The exact verifier confirms the value. Marking defensibly-correct work
  "wrong" or even "partial" teaches the child to distrust right answers — the opposite of
  what we want. The math engine must register it as correct.
- **The skill here is finding *a* common size; finding the *smallest* is fluency, not
  correctness.** Reaching for the LCD directly is the room's mark of speed-and-directness,
  which is a **mastery dimension, not the accuracy dimension** (design doc §4.5). So
  over-slicing is a *fluency signal, not an error*: a child who only ever over-slices is
  scored correct but **does not clear the room's mastery gate** (§6). That is exactly the
  right knob — it neither lies that they're wrong nor lets a clumsy method count as mastery.
- **Simplification isn't unlocked yet.** R3 (SIMPLIFY) comes *after* R2. Demanding the child
  reduce `10/12 → 5/6`, or retry "to find the smallest denominator," asks for precisely the
  skill the next room teaches. So the challenge is framed as *re-solve with bigger pieces*
  (choose a smaller common size from the start) — never *reduce the answer you already got*.
- **It seeds the next wall.** The reduced-star "that's messy" feeling is the on-ramp to R3,
  whose wall is literally "answers come out ugly and start getting gently penalized." R2's
  star tier is where that penalty is first felt, so SIMPLIFY arrives already wanted.

Concretely, three outcomes:

| Child's common size | Verdict | Stars | Response |
|---------------------|---------|-------|----------|
| The LCD (sixths) | correct | full | glow + mom's full approval |
| A valid but larger multiple (twelfths) | **correct** | **reduced** | mom accepts it; soft, **optional** nudge: "that works! can you do it with fewer, bigger cuts?" — re-solving at the LCD earns full stars, skipping costs only the stars |
| Not a common size, or an addition slip | wrong | — | the pieces never matched, so the merge never legally happened — try again |

> **Tuning knob (flag for the synthetic harness, design doc §8):** how many stars the
> over-slice costs, and whether the "fewer cuts?" nudge auto-appears or waits for a child
> who looks ready. Start gentle; let the personas (esp. a *brute-forcer* who always uses the
> product of the denominators) calibrate it.

## 5. Game Flow

- **Beat 1 — Blocks lead.** Two unlike bars won't combine; the child drags the slicer across
  each until both are made of identical pieces, then merges (as in R1). Re-cutting is the game.
- **Beat 2 — Blocks + write.** Slicing shows ×N on top and bottom; the child writes the new
  fraction by the re-cut bar. Both bars must reach the same size before merging unlocks.
- **Beat 3 — Blocks fade.** Labeled outlines; the child picks the common size and multipliers,
  then taps to slice-and-check. Attention moves to *choosing* the common denominator.
- **Beat 4 — Numbers lead.** `1/2 + 1/3 = ?`; find the common denominator, scale each, add.
- **Beat 5 — New dress.** Pairs where one denominator divides the other, odd unlike sizes,
  sideways/in a sentence — the room's strong transfer test.
- **Penultimate Phase — bare math, objects behind.** The workspace clears to just
  `1/2 + 1/3 = ?`, but the two bars linger as a **faded, non-interactive backdrop** behind
  the equation — a memory anchor, not a tool. The child finds the common denominator,
  scales, and adds by hand, **writing the solution with the stylus**; then the backdrop
  dissolves.
- **Final Phase — bare math on the slate.** No bars, no slicer, no denominator picker —
  just a written `1/2 + 1/3 = ?` and an empty slate. The child **writes the full solution
  with the stylus** (finds the common denominator, scales, adds) by hand. Every
  manipulative has left the screen.
- **Feel:** the slice animation, two mismatched bars snapping to equal widths, the ×N landing
  on top and bottom together.

## 6. When the Room Is "Beaten"

Reaches for a common size and the right multipliers directly, scales both fractions, and
**adds OR subtracts** — numbers alone, across all four stages (add forward, add
missing-part, subtract forward, subtract missing-part) and new-dress pairs. Shallow tells:
adding/subtracting across unlike pieces without re-cutting (1/2 + 1/3 → 2/5); scaling only
the bottom; or handling addition but not the take-away direction. **Reaching the LCD
directly is part of "beaten":** a child who only ever over-slices to a bigger common size
(§4.6) is answering correctly but not yet fluently, so the gate stays closed even though
every answer is right. If any of these survive, not beaten.

## 7. Help When Stuck

Point at the two sizes — "can these stack evenly?" → "cut them until they match" → show one
bar sliced with ×N on top and bottom → show both re-cut and let the child finish the add.

## 8. Back to the Kitchen

Returns to the unlike-base recipe that just frustrated them and now solves it — the most
convincing payoff yet, because the wall felt impossible minutes earlier. Then mom serves a
recipe whose answer comes out *messy* (like 33/99), summoning the simplifying room.

## 9. Assets Used (see `ASSET_CATALOG.md`)

Scene: `scene.room_generic` (`room_motif`), `scene.bare_slate`, `scene.help_handoff`
Characters: `tutor_guide`, `reward_payoff`
Manipulables: `block`, `stack`, `ruler`, `merge_zone`
Symbolic: `numeral_glyph`, `fraction_label`, `operator_glyph`, `equation_frame`
Tools: `slicer_tool`, `denominator_picker`, `common_size_guide`, `slate`
Feedback/control: `check_button`, `hint_affordance`, `feedback_burst`, `progress_indicator`, `affect_camera_indicator`
