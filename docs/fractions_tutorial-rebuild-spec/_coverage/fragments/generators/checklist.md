<!-- FRAGMENT slice=generators section=checklist.md -->
<!-- One line per owned census item under web/src/generators/** + web/tests/generators/**.
     [x] = documented, with destination section(s). -->

# Checklist — Generators slice

Census counts owned: 14 src (`web/src/generators/*.js`) + 4 tests
(`web/tests/generators/*`). All owned items below.

## Source — `web/src/generators/*.js` (14)
- [x] `index.js` — registry / generateFor / surfaceFormsFor / generatorSkills / hasGenerator → design.md G.2; requirements GEN-R1/R5/R7/R8; tasks GEN-T3
- [x] `core.js` — PRNG, helpers, tierForLevel, resolveSurfaceForm, problemIdFor → design.md G.1/G.3/G.4/G.5; requirements GEN-R3/R4/R7; tasks GEN-T1; gotchas G-GOTCHA-1
- [x] `grade.js` — gradeAnswer, classifyAddError, answerShape → design.md G.6; requirements GEN-R9..R13; tasks GEN-T4; gotchas G-GOTCHA-2/G-GOTCHA-5
- [x] `hints.js` — hint ladders / hintsFor → design.md G.7; requirements GEN-R14/R15; tasks GEN-T5
- [x] `addSameDen.js` — ADD_SAME_DEN (r1) → design.md G.5 table + notes; tasks GEN-T2
- [x] `subSameDen.js` — SUB_SAME_DEN (s1) → design.md G.5 table + notes; tasks GEN-T2
- [x] `addUnlikeNested.js` — ADD_UNLIKE_NESTED (r3) → design.md G.5 table + notes; tasks GEN-T2; gotchas G-GOTCHA-4
- [x] `addUnlikeCoprime.js` — ADD_UNLIKE_COPRIME (r2) → design.md G.5 table + notes; tasks GEN-T2; gotchas G-GOTCHA-3/G-GOTCHA-4
- [x] `simplify.js` — SIMPLIFY (r4) → design.md G.5 table + notes; tasks GEN-T2
- [x] `improperToMixed.js` — IMPROPER_TO_MIXED (r5) → design.md G.5 table + notes; tasks GEN-T2; gotchas G-GOTCHA-3
- [x] `multEqualGroups.js` — MULT_EQUAL_GROUPS (m1) → design.md G.5 table + notes; tasks GEN-T2
- [x] `multFacts.js` — MULT_FACTS (m3) → design.md G.5 table + notes; tasks GEN-T2
- [x] `fractionOnLine.js` — FRACTION_ON_LINE (nl) → design.md G.5 table + notes; tasks GEN-T2
- [x] `compareBenchmark.js` — COMPARE_BENCHMARK (cmp) → design.md G.5 table + notes (incl. dual rel vocabulary); tasks GEN-T2

## Tests — `web/tests/generators/*` (4)
- [x] `test_generators.test.js` — correct-by-construction validators, registry, determinism, surface forms, variety → requirements GEN-R1..R8; tasks GEN-T6
- [x] `test_grade.test.js` — canonical-correct 3★, wrong rejected, SIMPLIFY 2★, exact-whole trap → requirements GEN-R9/R10/R11; tasks GEN-T6
- [x] `test_grade_u4.test.js` — ErrorSignature union membership + add-error fingerprints → requirements GEN-R12; tasks GEN-T6
- [x] `test_hints.test.js` — every skill ≥1 rung, unknown → [] → requirements GEN-R14; tasks GEN-T6

## Notes
- Census line 439 collapses the two grade tests as `test_grade(+_u4)`; both
  `test_grade.test.js` and `test_grade_u4.test.js` exist on disk and are documented
  separately above. No undocumented owned items.
