---
date: 2026-06-02
topic: ccss-alignment
focus: how far off from Common Core; fine diverging with strong reason, otherwise need proven-to-work
mode: repo-grounded
---

# Ideation: Common Core (CCSS) Alignment Audit

## Verdict (one line)

The app is a **strong Grade 4→5 fraction-*operations* tutor that is missing its Grade 3 foundation.**
CCSS makes "a fraction is a number on a line" and *equivalence* the **spine**, and addition a **consequence**;
the app inverts that — leading with operations while the foundation (number line, comparison, fraction-as-number)
is thin or absent. The pedagogy itself (concrete→abstract fade, GroupBar equivalence proof, denominator locks,
misconception traps) is genuinely good and research-aligned.

## Grounding Context (Codebase)

**What the app teaches (in order):**
- M1 Equal Groups, M2 Arrays, M3 Times Facts — whole-number multiplication foundations (3.OA)
- R1 Same Denominators (add numerators, lock denominator)
- R3 "Scale One" (unlike denominators, nested: one bottom fits the other)
- R2 "Cross-Multiply" (unlike denominators, general case via a·d + b·c / b·d)
- R4 Simplify (already reframed to equivalence: GroupBar fill-edge proves 8/12 = 2/3)
- R5 Mixed Numbers (improper → whole + remainder, on a 0→2 ruler)
- Mom's Kitchen — word-problem hub
- 7-stage scaffold per lesson: Manipulate → Bind → Fade → Workbench → Numbers → Applied → Words

**Models used:** plates, trays, jars, fraction blocks/stacks, GroupBar (R4), ruler (R5 only).
**No number line for fraction-as-number work.**

**Documented deliberate divergences:** unfamiliar denominators (fifths/sevenths) to force computation over recall;
no-LCD requirement in R2 (over-slicing is correct, only fluency-penalized); multiplication-first default routing.

**CCSS facts that drive the audit:**
- **3.NF.A.2** explicitly REQUIRES the number line (the only NF standard with a mandated model). Achieve the Core / H. Wu treat it as *the* coherent model and warn against area-only framing.
- **4.NF denominator scope = {2,3,4,5,6,8,10,12,100}** — sevenths appear nowhere in grades 3–5.
- **5.NF.A.1** reaches unlike-denominator addition via the EQUIVALENCE strategy (this is a GRADE 5 standard → the app's R2/R3 live here), not via cross-multiply.
- "Simplest form" is NOT a CCSS requirement (H. Wu). The skill is equivalence generation (**4.NF.A.1**); 4/8 is as correct as 1/2.
- Add AND subtract + decomposition are one standard (**4.NF.B.3**). Comparison/benchmark reasoning spans **3.NF.A.3d / 4.NF.A.2 / 5.NF.A.2**.

**Finding categories:** 🔴 hard misalignment (CCSS prescriptive, app silent/contradicting) · 🟡 coverage gap (CCSS skill not taught) · 🟠 defensible-but-flag divergence · 🟢 leverage.

## Topic Axes
1. Representation/model coverage (esp. absent number line)
2. Concept coverage & gaps (comparison, subtraction, decomposition, benchmarks, fraction × whole)
3. Sequencing & grade-band alignment
4. Conceptual vs procedural integrity (cross-multiply, simplify framing)
5. Scope & divergence justification (sevenths, simplify-not-CCSS, multiplication-first)

## Ranked Ideas

### 1. Number line as a first-class fraction model 🔴
**Description:** Build a reusable `FractionLine` primitive (partition 0→1 into *b* parts, place *a/b* as a **point**, extend past 1) used across placement, equivalence, comparison, and mixed numbers. R5's 0→2 ruler already proves the asset is half-built; promote it to a shared primitive used *under* R1–R3, not just at R5. Area models stay as a secondary representation, not the definition.
**Axis:** 1 (Representation/model coverage)
**Basis:** `external:` 3.NF.A.2a/b — the only NF standard naming a required representation; Achieve the Core / H. Wu / Illustrative Mathematics Grade 3 Unit 5 / Eureka Grade 3 Module 5 all build fractions number-line-first.
**Rationale:** The one place CCSS removes designer discretion. Area-only models feed two misconceptions the ladder already targets ("fractions only live between 0–1," "bigger denominator is bigger"). A reviewer's first question — "where does a child place 3/4 as a point?" — currently has no answer before R5.
**Downsides:** New component + integration into 4 lesson types; rework of how "fraction" is first introduced.
**Confidence:** 95% · **Complexity:** Medium · **Status:** Unexplored

### 2. Reframe R2 cross-multiply → equivalence-first 🟠
**Description:** Make the equivalence-rewrite ("rename both fractions to a common denominator, then add like R1") the taught method for the general unlike case, reusing R4's GroupBar / the new FractionLine. Keep cross-multiply only as an explicitly-labeled "fast path," never as the explanation. R3 already teaches the equivalence move — R2 should be its general case, not a different procedure.
**Axis:** 4 (Conceptual vs procedural integrity)
**Basis:** `external:` 5.NF.A.1 ("replacing given fractions with equivalent fractions … with like denominators"). Cross-multiply's b·d denominator is divorced from any model and can't be sense-checked.
**Rationale:** A child fluent in cross-multiply can add fractions yet still not believe denominators name equal-sized pieces. The method doesn't generalize to subtraction or three addends, and it competes with the equivalence spine the rest of the app teaches. This is the divergence most worth a deliberate decision.
**Downsides:** R2 becomes a few steps longer; loses the "slick trick" feel.
**Confidence:** 88% · **Complexity:** Medium · **Status:** Unexplored

### 3. Pull sevenths out of in-grade content 🔴 (cheap)
**Description:** Default all in-grade problems to denominators `{2,3,4,5,6,8,10,12,100}`. Get the anti-recall effect from in-scope-but-unrehearsed pairs (6ths/8ths/12ths, e.g. 3/4 + 5/6). Keep sevenths/ninths only behind an explicit "challenge / off-standard" toggle with a documented rationale.
**Axis:** 5 (Scope & divergence justification)
**Basis:** `external:` 4.NF footnote fixes the grade 3–5 denominator universe to `{2,3,4,5,6,8,10,12,100}`. `direct:` documented divergence "unfamiliar denominators (fifths/sevenths) to force computation over recall."
**Rationale:** The pedagogical goal is fully achievable inside the legal set, so sevenths cost transfer (a denominator never assessed at this band) for no CCSS-aligned gain. Lowest-cost realignment available.
**Downsides:** Almost none — problem-generator config + a guard. Test: name one thing 1/7 teaches that 1/8 or 1/12 can't.
**Confidence:** 90% · **Complexity:** Low · **Status:** Unexplored

### 4. Add subtraction + decomposition to R1 🟡
**Description:** Extend R1's existing locked-denominator/block model with a "take away" (subtraction) mode and a "break into unit pieces" (decomposition) mode — 3/8 = 1/8+1/8+1/8 = 2/8+1/8, recorded as an equation. Same engine, two more verbs; no new room needed.
**Axis:** 2 (Concept coverage & gaps)
**Basis:** `external:` 4.NF.B.3a (add AND subtract like denominators), 4.NF.B.3b (decomposition into a sum, recorded as an equation).
**Rationale:** Subtraction is a named, co-equal half of the very standard R1 targets — omitting it ships half a standard. Decomposition is the conceptual engine behind "keep the denominator" and behind mixed numbers (R5).
**Downsides:** More stages in R1; minor mechanic work.
**Confidence:** 92% · **Complexity:** Low–Medium · **Status:** Unexplored

### 5. Comparison + benchmark ("is this reasonable?") reasoning 🟡
**Description:** Add comparison (same num/den → unlike via common denominator or benchmark) plus a lightweight "near 0, ½, or 1?" sense-check that bolts onto R1/R2/R3/R5 and Mom's Kitchen ("do I have enough?"). Measuring cups / ruler marks embody this naturally and pair with the number line (#1).
**Axis:** 2 (Concept coverage & gaps)
**Basis:** `external:` 3.NF.A.3d, 4.NF.A.2 (benchmark comparison), 5.NF.A.2 (assess reasonableness with benchmarks).
**Rationale:** Three standards across all three grades hinge on this. It's the direct antidote to "added the denominators" (1/2 + 2/3 can't be 2/5 — both exceed ½) and the missing self-check that procedural answers (see #2) never get.
**Downsides:** New lesson/layer; needs a benchmark tick (shares the number-line component).
**Confidence:** 88% · **Complexity:** Medium · **Status:** Unexplored

### 6. Finish the R4 "simplify" reframe; accept 4/8 = 1/2 🔴 (mostly bookkeeping)
**Description:** Make equivalence bidirectional (1/2 → 4/8 *and* 8/12 → 2/3 equally valid) and audit the answer-checker across Numbers/Applied/Kitchen so an unreduced-but-equivalent answer is never marked wrong or "not done." Success condition for R4 = "name the same amount a different way," not "reduce."
**Axis:** 4 (Conceptual vs procedural integrity; touches 5)
**Basis:** `external:` "simplest form" is not a CCSS standard (H. Wu); the skill is 4.NF.A.1 equivalence generation — 4/8 is exactly as correct as 1/2.
**Rationale:** Renaming *up* is the move unlike-denominator addition actually needs. If scoring still privileges "reduce," the app teaches a non-CCSS rule and penalizes valid reasoning — friction for any standards-based teacher. The reframe is conceptually done; the scoring layer must be confirmed.
**Downsides:** Verification work across multiple stages, not just R4 copy.
**Confidence:** 85% · **Complexity:** Low · **Status:** Unexplored

### 7. Per-lesson CCSS + grade-band tag map 🟢
**Description:** A static `lesson/stage → CCSS code + grade band` map, surfaced in-app (teacher/parent view) and as a self-audit artifact. Exposes the grade-band crossing (R1 = Grade 4; R2/R3 = Grade 5) and lets the adaptive engine interpret a stall correctly (an on-grade 4th grader stalling at R2 is at their ceiling, not failing).
**Axis:** 3 (Sequencing & grade-band alignment)
**Basis:** `reasoned:` standards alignment is the #1 procurement filter for school tools; the map turns every future audit into a table diff and forces the implicit grade-crossing into an explicit decision. `external:` mirrors CEFR tagging in language apps and spec-to-test traceability matrices.
**Rationale:** Cheapest compounding investment — unlocks adoption, self-audit, and smarter mastery decisions from one artifact.
**Downsides:** Only as valuable as it stays maintained / in sync with lessons.
**Confidence:** 80% · **Complexity:** Low · **Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Fraction × whole (4.NF.B.4) bridging M3 | Real coverage extension, but lower priority — app intentionally caps at addition; axis 2 already covered by #4/#5. Revisit if pursuing fuller 4.NF. |
| 2 | Standalone new "R0 number-line room" | Duplicates #1; folding the line into existing lessons + R5's ruler is lower-cost than a new room. |
| 3 | Resequence R2/R3 wholesale into a gated Grade-5 track | Duplicates #7's grade-tagging, which surfaces the crossing without a disruptive resequence. |
| 4 | Drop "simplest form" as a concept entirely | Over-rejection — equivalence generation (#6) is the right framing; simplifying stays as one *direction*, not a required terminal form. |

**Axis coverage:** all 5 axes have survivors (representation ×1, concept-gaps ×2, sequencing ×1, conceptual-integrity ×2, scope/divergence ×1).

**Framing note on "proven to work":** Findings #1, #4, #5, #6 are not really divergences — they are places where CCSS (and IM/Eureka) is prescriptive and the app is silent, so closing them is pure de-risking. The genuine judgment calls are #2 (cross-multiply), #3 (sevenths), and multiplication-first routing — and for all three, the CCSS-aligned path achieves the stated pedagogical goal anyway, which weakens the case for diverging.
