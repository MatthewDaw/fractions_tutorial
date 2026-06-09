<!-- FRAGMENT slice=generators section=tasks.md -->
<!-- Owned globs: web/src/generators/**, web/tests/generators/** -->
<!-- Implementation-order tasks to rebuild the generators slice from the spec.
     Pointers: skill ids/graph/types → engine-core (build that first). -->

# Tasks — Generators

A dependency-ordered rebuild of `web/src/generators/**` (+ `web/tests/generators/**`).
Prerequisite (other slice): the engine skill-node ids and `ErrorSignature` /
`ScaffoldLevel` types from engine-core (`engine/graph.ts`, `engine/types.ts`) must
exist first — generators reference them by id only.

## GEN-T1 — Build the shared kernel `core.js`
- Implement `makeRng(seed)` (mulberry32), `hashStr(s)` (FNV-1a 32-bit),
  `rngFor(skill, index)` (seed = `hashStr(skill) ^ imul(index+1, 2654435761)`).
- Implement numeric helpers: `randInt`, `pick`, `gcd`, `lcm`, `coprime`.
- Implement `tierForLevel(level)` (L0/L1→0, L2/L3→1, L4→2; non-finite→0).
- Implement `resolveSurfaceForm(forms, requested, index)` (honor requested if a
  member; else double-guarded modulo rotation).
- Implement `problemIdFor(skill, level, surfaceForm, index)` →
  `` `${skill}:${level}:${surfaceForm}:${index}` ``.
- Satisfies: GEN-R3, GEN-R4, GEN-R5, GEN-R7.

## GEN-T2 — Implement the 10 per-skill generators
Each module exports `SKILL`, `SURFACE_FORMS` (length 2), `generate(spec)` returning
the GeneratedProblem envelope, computing `answer` from chosen `operands`
(correct-by-construction). Build them with their forms + tier pools per design G.5:
`addSameDen`, `subSameDen`, `addUnlikeNested`, `addUnlikeCoprime`, `simplify`,
`improperToMixed`, `multEqualGroups`, `multFacts`, `fractionOnLine`,
`compareBenchmark`. Satisfies: GEN-R2, GEN-R4, GEN-R5, GEN-R6.

## GEN-T3 — Build the registry `index.js`
- Import all 10 modules, build `REGISTRY = Map(SKILL → module)`.
- Export `hasGenerator`, `generatorSkills`, `surfaceFormsFor` (defensive `.slice()`),
  `generateFor` (throw on unknown; attach `problem_id` if absent).
- Satisfies: GEN-R1, GEN-R5, GEN-R7, GEN-R8.

## GEN-T4 — Build the grader `grade.js`
- `equalValue` (cross-multiply, zero-guarded), `num` (string→int, NaN on garbage),
  `twoOperands` (normalize `{a,b}`/`{start,take}`/`{a,b,den}`/`[[n,d],[n,d]]`),
  `classifyAddError` (→ `add_denominators` / `add_across_unlike`).
- `gradeAnswer(problem, answer)` per-skill switch (SIMPLIFY lowest-terms gate;
  IMPROPER_TO_MIXED exact-whole/forced_leftover; MULT_* integer; COMPARE relation;
  default equal-value fraction).
- `answerShape(skill)`.
- Satisfies: GEN-R9, GEN-R10, GEN-R11, GEN-R12, GEN-R13.

## GEN-T5 — Build the hint ladders `hints.js`
- `HINTS` map: 2 rungs per skill (method, first move), generic across variations.
- `hintsFor(skill)` returns rungs or `[]`.
- Satisfies: GEN-R14, GEN-R15.

## GEN-T6 — Tests
- `test_generators.test.js`: per-skill independent answer validators, registry
  coverage (10 skills, 2 forms each), determinism, explicit + rotated surface
  forms, variety, unknown-skill throw.
- `test_grade.test.js`: canonical-correct = 3★ for every skill; clearly-wrong
  rejected; SIMPLIFY equal-but-unreduced = 2★ not_simplified; IMPROPER_TO_MIXED
  exact-whole accept / forced_leftover reject.
- `test_grade_u4.test.js`: ErrorSignature union membership; add_denominators /
  add_across_unlike detection; not_simplified locked.
- `test_hints.test.js`: every skill ≥1 rung (>8 chars); unknown → `[]`.
