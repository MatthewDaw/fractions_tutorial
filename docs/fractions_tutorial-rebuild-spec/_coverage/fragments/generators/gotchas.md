<!-- FRAGMENT slice=generators section=gotchas.md -->
<!-- Owned globs: web/src/generators/**, web/tests/generators/** -->
<!-- Non-obvious traps a rebuilder will hit. Partition.md does not list gotchas.md
     for this slice, but these are real and load-bearing; synthesis may fold into
     design.md or a shared gotchas section. -->

# Gotchas — Generators

## G-GOTCHA-1 — Seed key is (skill, index), NOT (skill, level, index)
`rngFor(skill, index)` (`core.js:55–58`) intentionally omits `level` from the seed.
Consequence: changing scaffold level does NOT reshuffle the problem stream — only
the difficulty *pools* change, while the same `index` keeps the same draw sequence
within a pool. A rebuilder who "improves" this by folding `level` into the seed
breaks the replay expectation and the determinism test's mental model. Keep level
out of the seed.

## G-GOTCHA-2 — grade.js never emits `scaled_bottom_only`
`scaled_bottom_only` is a member of the engine `ErrorSignature` union and the U4
test's `UNION` set, but `gradeAnswer` (`grade.js`) does NOT produce it. That
signature is detected only by the *lesson-level* graders —
`AppR4.jsx:378` and `LessonUnlikeDen.jsx:82` (pointer: lessons-rooms) — and by
`engine/observation.ts` (pointer: engine-core). Do not "fix" `grade.js` to emit it;
the generic shared grader cannot reconstruct the expected scaled numerator without
the lesson's renaming context. The U4 union-membership test passes because
`scaled_bottom_only` is simply never the *output* here.

## G-GOTCHA-3 — Generator number pools are NOT run through the CCSS filter
Constitution §5.6 forbids denominators 7 and 9, enforced by `ccss.js::isInGrade` /
`filterBankInGrade` on the *lesson banks* (shell-nav / lessons-rooms). The generator
tier pools, however, are hand-curated and several DO include 7 or 9:
`addSameDen` tier-1 `[6,7,8,9]` / tier-2 `[8,9,10,12]`;
`subSameDen` tier-1 `[6,7,8]` / tier-2 `[8,9,10,12]`;
`addUnlikeCoprime` tier-1 coprime pair `[2,7]`;
`improperToMixed` tier-2 dens `[5,6,7,8]`.
These pools are never passed through `filterBankInGrade`, so generated practice CAN
present a /7 or /9 problem at higher tiers. This is a latent contract tension worth
flagging in synthesis: either the §5.6 contract is scoped to lesson banks only (and
generated practice is exempt by design), or the pools should be tightened. Document
it; do not silently change behavior.

## G-GOTCHA-4 — Unreduced answers are the CORRECT answers for the add skills
`addUnlikeNested` and `addUnlikeCoprime` return the sum **unreduced** over the
larger / cross-multiplied denominator (e.g. `1/2 + 1/3 → 5/6` but `2/4 + 1/4`
stays `3/4`, and a coprime sum like `1/2+1/4` is not auto-simplified). The default
grader judges by EQUAL VALUE (`equalValue`), so a learner's reduced or unreduced
equal-value form both grade correct — reduction is a *separate* skill (`SIMPLIFY`).
Do not make these generators reduce their answer; it would change the surface the
transfer/independence checks see.

## G-GOTCHA-5 — SIMPLIFY validity guard order in grade.js
In the `SIMPLIFY` branch, the invalid-input guard is `!(d > 0) || !(n >= 0)` →
returns `errorSignature: null` (not `'other'`). Only after passing the guard does a
non-equal answer become `'other'` and an equal-but-unreduced answer become
`'not_simplified'`. A rebuilder must preserve that ordering so garbage input does
not get mislabeled as a misconception.

## G-GOTCHA-6 — `.js` import specifiers are the contract
All generator imports use explicit `.js` specifiers (e.g. `from './core.js'`). This
slice is plain `.js` so it is unaffected by the TS `resolveTsFromJs` plugin, BUT
the same discipline applies — do NOT drop or rewrite the extensions
(constitution §2 language posture). Vitest/Vite resolve them as-is.
