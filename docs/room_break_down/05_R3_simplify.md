# Room: The Tidying Room (R3 — SIMPLIFY)

> First-pass room breakdown. Abstracted, gaming-flow focused. Grounded in
> `docs/design/fraction-app-state-model.md`.

---

> **Scene & layout:** this room's on-screen layout follows the play-space-first scene grammar in
> `docs/design/presentation-scene-architecture.md` (§4 space-trade, §4.1 complexity budget,
> §5 goal-communication). Its precise per-beat scene breakdown is in that doc's §10.

## 1. Snapshot

- **Skill node:** `SIMPLIFY`
- **Comes after / leads to:** after `ADD_UNLIKE_DEN` → parallel with `IMPROPER_TO_MIXED`
  (neither requires the other).
- **Concept in one line:** the same amount can be made of fewer, bigger pieces — tidy it to
  simplest form.
- **What the child can do after:** reduce a fraction by dividing top and bottom by their
  largest shared factor.

## 2. The Wall

After matching-sizes, answers come out correct but ugly (6/8, 33/99). Mom can't measure out
"thirty-three ninety-ninths," and messy answers start getting gently penalized — the seed
planted back in R2, where over-cutting earns fewer stars (see `04_R2_add_unlike_denominator.md`
§4.6). Missing idea: a fraction can be re-grouped into fewer, larger equal pieces without
changing the amount.

## 3. The Block↔Number Bridge

- **What the blocks mean here:** a stack of many small pieces that can be *fused* into
  fewer, bigger pieces of the same total height.
- **What the numbers mean:** fusing every group of K = dividing top and bottom by K; the
  amount is unchanged. Largest shared factor = the biggest fuse that comes out even.
- **The moment it clicks:** fusing 6/8 into 3/4 — the height never changes, but it's now 3
  bigger pieces out of 4 — with ÷2 on top and bottom.

## 4. Game Objects, Mechanics & Interactions

### 4.1 Objects (the nouns on screen)
- **Messy stack/bar** — many small pieces; the thing to tidy.
- **Fuse tool / grouping selector** — pick a group size K (fuse-by-2, by-3…); the room's
  signature object.
- **÷K indicator** — appears on **top and bottom** when a fuse succeeds.
- **Height guide** — a fixed line showing the amount never changes through fusing.
- **"Pieces remaining" counter / fewest-pieces goal meter** — the win condition made visible.
- **Factor tray** (faded beats) — surfaces the factors of a number, then the **shared**
  factors of top and bottom.
- **Write-pad / check button.**

### 4.2 Mechanics (the rules)
- A fuse-by-K **only succeeds if it comes out even**; uneven groupings **bounce back**.
- A successful fuse **divides top and bottom by K** (÷K shows on both) and the **height
  holds**.
- **Win = fewest pieces** (lowest terms); the meter rewards reaching it in one move via the
  largest shared factor.
- Faded beats expose the **find-factors sub-skill** (factors of one number → shared factors).
  This can split into its own sub-room only if it becomes the binding gap.

### 4.3 Interactions (player verbs)
- **Select a fuse group size** (fuse_by_k) — the new verb; try groupings.
- **Name/apply a shared factor** (apply_factor) — symbolic version in faded beats.
- **Write the tidied fraction** (write_fraction).

### 4.4 Progression of objects & mechanics
| Level | Objects present | Key mechanic | Player verb | Link shown by |
|-------|-----------------|--------------|-------------|---------------|
| L0 blocks lead | messy stack, fuse tool | even fuse snaps; uneven bounces | try fuse-by-K | pieces clump, height holds |
| L1 + write | fused bar, ÷K indicator | ÷K on top AND bottom | write the tidied fraction | ÷K binds fusing to dividing |
| L2 blocks fade | outlines, factor tray | find shared factors | name a shared factor | factors replace trial fusing |
| L3 numbers lead | "tidy 6/8" | divide by largest shared factor | reduce in one move | bar only as a check |
| L4 new dress | already-simplest trap, big uglies | find the *largest* factor | reduce, numbers only | proves largest, not any |
| L5 bare + ghost backdrop | "tidy 6/8", the bar faded behind | bare math, the bar as a memory anchor | **write reduced fraction with stylus** | symbols stand alone; the backdrop then dissolves |
| L6 bare slate | "tidy 6/8" only, empty slate | no manipulatives at all | **write reduced fraction with stylus** | nothing but the symbols remain |

### 4.5 Problem Progression (unknown position)

*(No addition here, so no subtraction stages — the blank's two positions give the
forward reduce and its reverse, scaling up.)*


- **Slots the blank can occupy:** the tidied result (`6/8 = ?`, forward), or a part of
  an equivalence (`6/8 = 3/?`, `6/8 = ?/4`, `?/8 = 3/4`).
- **Implicit inverse taught:** scaling *up* — un-simplifying. `?/8 = 3/4` makes the
  child go from the simple form back to more pieces, which is exactly R2's "cut into
  more pieces" move (×K on both), reinforcing equivalence in both directions. At block
  level: the height holds fixed while the child fuses (÷K) or splits (×K) to reach the
  shown form.
- **Sequencing:** result-as-blank first; equivalence-with-blank-in-a-part once reducing
  is fluent.

## 5. Game Flow

- **Beat 1 — Blocks lead.** A messy stack; the child tries fuse groupings — even ones snap
  into bigger pieces, uneven ones bounce. Goal: fewest pieces.
- **Beat 2 — Blocks + write.** Each successful fuse shows ÷K on top and bottom; the child
  writes the tidied fraction; the height stays fixed and visible.
- **Beat 3 — Blocks fade.** Outlines; name a shared factor and apply it, then fuse-and-check.
  Attention shifts to finding factors (of one number, then shared).
- **Beat 4 — Numbers lead.** "Tidy 6/8"; find the largest shared factor, divide once.
- **Beat 5 — New dress.** Already-simplest (trap: nothing to do), two-fuse cases if you miss
  the biggest factor, larger ugly numbers.
- **Penultimate Phase — bare math, objects behind.** The workspace clears to just
  "tidy 6/8", but the messy bar lingers as a **faded, non-interactive backdrop** behind the
  problem — a memory anchor, not a tool. The child reduces it by hand and **writes the
  reduced fraction with the stylus**; then the backdrop dissolves.
- **Final Phase — bare math on the slate.** No bar, no fuse tool, no factor tray — just a
  written "tidy 6/8" and an empty slate. The child **writes the reduced fraction with the
  stylus**, dividing top and bottom by the largest shared factor by hand. Every
  manipulative has left the screen.
- **Feel:** small pieces clicking into satisfying bigger chunks; the height holding steady;
  "fewest pieces" as a clear win.

## 6. When the Room Is "Beaten"

Reduces to lowest terms in one move by spotting the largest shared factor, numbers alone,
including the already-simplest trap and larger numbers. Shallow tells: dividing top and
bottom by *different* numbers; or many small steps because they only fuse by 2. If those
survive, not beaten.

## 7. Help When Stuck

"Could these be made of bigger pieces?" → suggest a small shared factor → show one fuse with
÷K on top and bottom → show the largest fuse and have them confirm nothing's left to tidy.

## 8. Back to the Kitchen

Clears the messy recipes — answers come out tidy — and shows mom. Then mom
raises an answer bigger than one whole (9/7), which she can't ask for as "nine-sevenths,"
summoning the last room.

## 9. Assets Used (see `ASSET_CATALOG.md`)

Scene: `scene.room_generic` (`room_motif`), `scene.bare_slate`, `scene.help_handoff`
Characters: `tutor_guide`, `reward_payoff`
Manipulables: `block`, `stack`, `ruler`
Symbolic: `numeral_glyph`, `fraction_label`, `equation_frame`
Tools: `fuse_tool`, `factor_tray`, `slate`
Feedback/control: `check_button`, `hint_affordance`, `feedback_burst`, `progress_indicator`, `affect_camera_indicator`
