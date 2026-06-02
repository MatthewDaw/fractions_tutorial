---
date: 2026-06-02
topic: pedagogical-correctness
focus: audit the learning curriculum for ways to make it more pedagogically correct / better (learning-science correctness, distinct from CCSS alignment)
mode: repo-grounded
---

# Ideation: Pedagogical Correctness of the Fractions Curriculum

## Verdict (one line)

The curriculum's pedagogy is **well-designed on paper but inert in code**. The design docs encode
research-grade ideas — a multi-dimension mastery gate, spaced retention probes, misconception
fingerprinting, a goal-orientation loop — and the codebase scan found **most of them disabled, dead,
or bypassed in the actual lesson runtime**. The highest-value pedagogical wins are not new theory;
they are *making the pedagogy you already designed actually run*. (Standards/CCSS alignment is
deliberately excluded — covered by `2026-06-02-ccss-alignment-ideation.md`.)

## Grounding Context (Codebase)

**Pedagogy-in-code reality (from a deep runtime scan):**
- **Mastery gate is bypassed.** Scripted stages advance on a *single* correct answer
  (`useLessonScaffold.js:318`); the BKT engine is decorative everywhere except the one generated
  `practice` stage.
- **Gate conjuncts are weak/spoofable.** `fluencyOk` returns `true` unconditionally
  (`dimensions.ts:91`); "distinct problems" is proxied by `answer_value` string (two problems with
  the same answer count as one, `dimensions.ts:143`); transfer falls back to *denominator* as the
  structural proxy (`dimensions.ts:194`). The 0.95 `P_known` threshold does almost all the work, and
  `P_T=0.2` reaches it fast.
- **Retention/decay is plumbed-but-dead.** `retention_probe` is read by the reducer
  (`measurementReduce.ts:250`, `last_retention_probe`) but nothing ever emits one. No spacing, no
  interleaving anywhere — the architecture is forward-only; "mastered" never decays.
- **Goal-orientation loop is largely inert.** `inKitchen`/`stumpingRecipe` default false/null
  (`useLessonEngine.js:46`); the rich stump→room→return arc lives in `policy.js` but lessons mostly
  run standalone.
- **Feedback is binary with coarse error signatures.** The `errorSignature → prereq credit` path
  (`credit.ts:86`) exists but generators rarely emit specific signatures, so DAG-aware remediation
  rarely fires. `disengagedCount` is never incremented (`policy.js:353`).

**Design intent (deliberate claims to audit against, not bugs):** `app_philosophy.md` —
mastery = *speed and directness*; frustration at the "wall" is *intentionally induced* as the
motivational engine; cooking is a disposable "jump pad" wrapper; rejects intrinsic interest;
deliberately uses unfamiliar bases (fifths/sevenths). `student-state-measurement.md` (APPROVED) —
mastery is a 4-D AND-gate with an affect firewall and decay probes. `fraction-app-state-model.md` —
concrete→abstract scaffold ladder L0–L4; the "wall" is a *diagnostic* routing event.

**External grounding (named evidence):** Concreteness fading must be an instructional act, not a
schedule (Fyfe/McNeil/Goldstone 2014). Number line defeats whole-number bias (Siegler 2016,
d≈0.86–1.10). Interleaving beats blocking 77% vs 38% on delayed tests (Taylor & Rohrer 2010).
Worked-example / guidance-fading effect + expertise reversal (Sweller/Kalyuga). BKT needs ~3–5 items
to cross 0.95 reliably; ≥0.98 yields better next-lesson gains (EDM 2025). Productive failure is
contraindicated for under-12 without scaffolding (Mazziotti 2019). Add-the-denominators (IWN) error
is 6.58× more likely on unlike-denominator problems and persists into adulthood (Braithwaite &
Siegler 2018). Seductive (decorative) thematic details carry a reliable negative learning effect,
worst for low-prior-knowledge learners (2026 meta-analysis, Educational Psychology Review).
Overjustification: prefer informational over controlling feedback (Lepper et al. 1973).

## Topic Axes
1. Cognitive load & memory architecture (anchoring/hierarchy claims, working-memory limits, scaffold)
2. Motivation & affect design (induced frustration, goal-orientation, reward)
3. Practice & retention mechanics (spacing, interleaving, retrieval, fluency, mastery criteria)
4. Conceptual understanding & transfer (concrete→abstract fade, models, misconceptions)
5. Assessment & adaptivity correctness (mastery measurement, BKT, diagnosis)

## Ranked Ideas

### 1. Make the mastery gate actually govern advancement (and fix its weak conjuncts)
**Description:** Route real advancement through the 4-D gate instead of advancing on a single correct
(`useLessonScaffold.js:318`), and make the soft conjuncts real: enable a calibrated fluency/speed
gate (`dimensions.ts:91`), replace the `answer_value` distinctness proxy (`dimensions.ts:143`), and
stop using denominator as the transfer proxy (`dimensions.ts:194`).
**Axis:** 5 (Assessment & adaptivity)
**Basis:** `direct:` the code paths above + `student-state-measurement.md`'s spec of a real 4-D
AND-gate. `external:` BKT needs ~3–5 items before the posterior reliably crosses 0.95 (EDM 2025);
single-correct mastery is insufficient.
**Rationale:** The integrity keystone — every adaptive decision inherits a mastery signal that two
lucky answers can forge. The design is already right; the implementation undercuts it.
**Downsides:** Lessons get longer; needs age-band fluency calibration before the speed gate hardens.
**Confidence:** 92% · **Complexity:** Medium · **Status:** Unexplored

### 2. Bring the goal-orientation loop to life inside the lesson runtime
**Description:** Wire the stump→room→return arc so a lesson is *entered because a concrete recipe
failed* and *exited by re-solving it*. Today `inKitchen`/`stumpingRecipe` default false/null
(`useLessonEngine.js:46`) and lessons run standalone.
**Axis:** 2 (Motivation & affect)
**Basis:** `direct:` codebase scan ("motivating loop present in engine philosophy but largely
inert"); `app_philosophy.md` makes this the central mechanism. `external:` competence-as-felt-payoff
(SDT); informational feedback beats decorative completion.
**Rationale:** The philosophy's strongest claim is that diagnosis and motivation are the *same push*.
Right now the child gets the diagnosis (rooms) without the felt wall/payoff that makes it motivating
rather than busywork.
**Downsides:** Couples lesson entry to kitchen state; more orchestration; needs the recipe-routing UX.
**Confidence:** 85% · **Complexity:** Medium–High · **Status:** Unexplored

### 3. Wire misconception-specific remediation (the dead `error_signature` path)
**Description:** Have generators emit diagnostic error signatures (esp. the add-the-denominators /
independent-whole-number error) and respond with targeted reteach via the existing
`errorSignature → prereq credit` path (`credit.ts:86`), instead of a binary warn ribbon + random
re-ask.
**Axis:** 4 (Conceptual understanding & transfer)
**Basis:** `direct:` `grade.js` coarse signatures + dead credit path. `external:` IWN error is 6.58×
more likely on unlike-denominator problems and persists into adulthood (Braithwaite & Siegler 2018).
**Rationale:** The most common, most durable fraction misconception currently gets the same response
as a careless slip. The remediation machinery exists — it just isn't fed.
**Downsides:** Each generator must classify error types; reteach content authored per misconception.
**Confidence:** 88% · **Complexity:** Medium · **Status:** Unexplored

### 4. Activate spaced retrieval + make delayed retention the real mastery signal
**Description:** Emit the dead `retention_probe` events (`measurementReduce.ts:250`) to revisit
previously-mastered nodes on a spacing schedule, and let a *delayed* correct (not the same-session
one) certify mastery. Allow mastered nodes to decay/demote.
**Axis:** 3 (Practice & retention)
**Basis:** `direct:` dead `retention_probe`/`last_retention_probe`. `external:` spacing effect is one
of the most robust findings in learning science; BKT assumes no forgetting and cannot detect decay.
**Rationale:** Without spacing, the app measures *acquisition* and calls it *mastery* — the exact
failure mode the decay machinery was designed to catch.
**Downsides:** Needs a scheduler + re-entry surface; demotion must be framed positively for the child.
**Confidence:** 85% · **Complexity:** Medium · **Status:** Unexplored

### 5. Interleave problem types once each is introduced
**Description:** After same-den, unlike-den, simplify, and mixed-number types are each taught, mix
them within practice (including the kitchen and the generated `practice` stage) so the child must
*identify the type* before solving. Progression is currently purely blocked.
**Axis:** 3 (Practice & retention)
**Basis:** `external:` Taylor & Rohrer randomized trial — interleaved 4th-graders scored 77% vs 38%
on delayed tests (~1.2 effect); contextual-interference parallel in motor learning (Shea & Morgan).
Note: interleaving *lowers* end-of-practice performance — do not misread as failure and revert.
**Rationale:** Blocked practice lets a child bypass the hardest real step — deciding *which method
applies*. Cheap relative to effect size; directly attacks the "when do I find a common denominator?"
gap.
**Downsides:** Must not start before each schema is formed; harder to keep felt difficulty in reach.
**Confidence:** 86% · **Complexity:** Low–Medium · **Status:** Unexplored

### 6. Re-scaffold the engineered "wall" for the under-12 boundary condition
**Description:** Keep the felt-wall, but guarantee a *reachable* scaffolded next step is always one
tap away the moment frustration is detected, rather than letting a young child sit in failure.
**Axis:** 2 (Motivation & affect)
**Basis:** `external:` Mazziotti 2019 (no PF advantage for ~10–12-year-olds; immature
self-regulation); Kapur recommends PF sparingly and mostly from older-student data. `direct:` the
philosophy doc's deliberate induced-frustration stance.
**Rationale:** The one place the stated philosophy and the developmental evidence genuinely conflict.
The fix preserves the design intent (felt wall → payoff) while removing its developmental risk.
**Downsides:** Challenges a load-bearing belief; needs a fast frustration trigger (`disengagedCount`
is currently never incremented, `policy.js:353`).
**Confidence:** 78% · **Complexity:** Medium · **Status:** Unexplored

### 7. Audit the cooking wrapper for seductive-detail cognitive load
**Description:** For each themed surface (animated intros, character voices, kitchen narrative, TTS),
test "does this carry the math, or sit next to it?" Keep theme that is *isomorphic* to the math (the
denominator *is* the number of jar slots); strip or quiet decorative narration during the actual
operation.
**Axis:** 1 (Cognitive load & memory architecture)
**Basis:** `external:` Fyfe/Goldstone (fading is an instructional act, not decoration) + 2026
seductive-details meta-analysis (negative learning effect, worst for low-prior-knowledge learners).
`reasoned:` the philosophy itself calls the wrapper a disposable "jump pad" — decorative load works
against that fade.
**Rationale:** The wrapper is the biggest engagement asset and the biggest extraneous-load risk at
once. The isomorphism test turns a vibe into a checklist.
**Downsides:** Tension with the charm/engagement goal; per-asset judgment, not a global toggle.
**Confidence:** 72% · **Complexity:** Low–Medium · **Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Number line as magnitude anchor (counters whole-number bias) | Strong (Siegler d≈0.9) but already captured as finding #1 in the CCSS ideation doc; excluded to avoid duplication. |
| 2 | Self-explanation / "why" prompts after answers | Good evidence, but folds into #3 (remediation) and #2 (informational feedback); secondary standalone. |
| 3 | Concept Mastery Map as learner-facing retrieval/anchor structure | Promising (delivers the anchoring claim) but more feature than correctness fix; revisit as a brainstorm. |
| 4 | Pull sevenths out of in-grade content | Already covered by CCSS doc #3; a philosophy-vs-standards tension better resolved there. |
| 5 | Replace BKT with factorial-HMM upgrade | Over-engineering — the gate's *wiring* (#1) is the gap, not the model class; HMM is already a reserved upgrade. |
| 6 | Informational vs controlling reward feedback (overjustification) | Real, but the "no points/score" stance already honors it; folded into #2/#3 as feedback phrasing. |

**Axis coverage:** all 5 axes have survivors — 1 (#7), 2 (#2, #6), 3 (#4, #5), 4 (#3), 5 (#1).
Dominant cross-cutting theme: **#1–#4 are all "activate pedagogy you already designed but left dead
in the runtime"** — collectively the highest-leverage, best-grounded cluster.
