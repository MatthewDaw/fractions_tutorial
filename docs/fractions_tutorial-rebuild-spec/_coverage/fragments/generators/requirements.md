<!-- FRAGMENT slice=generators section=requirements.md -->
<!-- Owned globs: web/src/generators/**, web/tests/generators/** -->
<!-- RFC-2119. Pointers: skill ids/ScaffoldLevel/ErrorSignature/TransferProbe →
     engine-core. hint_max_rung recording / practice loop → runtime-affect +
     lessons-rooms. -->

# Requirements — Generators

## GEN-R1 — One generator per skill node
The system MUST register exactly one problem generator for each of the 10 engine
skill nodes (pointer: engine-core `graph.ts`), and `generatorSkills()` MUST return
all 10. `hasGenerator(s)` MUST be true for every registered id and false otherwise.
(Asserted: `test_generators.test.js:105–113` — length 10, validator + 2 surface
forms each.)

## GEN-R2 — Correct-by-construction content
Every generated problem MUST be mathematically correct by construction: the
generator MUST compute `answer` from the `operands` it chose, never present a
problem whose `answer` it cannot guarantee. An independent re-derivation of the
answer from `operands` MUST match `answer` for all levels 0–4 and many indices.
(Asserted: `test_generators.test.js:120–133` with per-skill independent validators.)

## GEN-R3 — Determinism / replay
Generators MUST be pure and MUST NOT call `Math.random()` or `Date.now()`
(constitution §5.5). `generateFor(skill, { level, index })` called twice with the
same args MUST return deep-equal problems. (Asserted: `test_generators.test.js:135–141`.)

## GEN-R4 — Difficulty across scaffold levels
A generator MUST produce a valid problem for every ScaffoldLevel 0–4, with
difficulty non-decreasing in level via the `tierForLevel` mapping (L0/L1→0,
L2/L3→1, L4→2). (Asserted: `test_generators.test.js:123–133` iterates all levels.)

## GEN-R5 — Surface forms & transfer selection
Each generator MUST declare exactly two surface forms. `generateFor` MUST honor an
explicitly requested `surfaceForm` (the TransferProbe path) when it is a member of
the skill's forms, and MUST otherwise rotate deterministically through both forms
by `index`. `surfaceFormsFor` MUST return a defensive copy. (Asserted:
`test_generators.test.js:143–159`; copy at `index.js:52`.)

## GEN-R6 — Variety
Within a single level, a run of indices MUST yield a variety of distinct prompts
(not the same problem every index). (Asserted: `test_generators.test.js:161–167` —
>3 distinct prompts over 20 indices.)

## GEN-R7 — Stable structural problem id
`generateFor` MUST attach a stable `problem_id` of the form
`<skill>:<level>:<surfaceForm>:<index>` when the generator did not already supply
one, so the engine can count *structurally distinct* problems independently of
answer value. (`index.js:69–78`, `core.js:125–127`.)

## GEN-R8 — Unknown skill is a hard error
`generateFor('NOPE')` MUST throw. (Asserted: `test_generators.test.js:115–117`.)

## GEN-R9 — Single shared grader
`gradeAnswer(problem, answer)` MUST be the single grading function used by both the
live practice board (pointer: lessons-rooms) and the synthetic harness (pointer:
harness), so "correct" is defined once. It MUST mark the canonical correct answer
as `{ correct:true, stars:3, errorSignature:null }` for every skill across levels
0–4. (Asserted: `test_grade.test.js:17–28`.)

## GEN-R10 — SIMPLIFY requires lowest terms
For `SIMPLIFY`, an equal-value answer that is NOT in lowest terms MUST grade
`{ correct:false, stars:2, errorSignature:'not_simplified' }` (encouraged but no
mastery credit); only a fully-reduced equal-value answer earns 3★. (Asserted:
`test_grade.test.js:43–52`, `test_grade_u4.test.js:23–29`. Rationale: locked R4
equivalence framing, anti false-positive.)

## GEN-R11 — IMPROPER_TO_MIXED exact-whole trap
For an `exact_whole` `IMPROPER_TO_MIXED` problem, a bare whole with an empty/zero
leftover MUST grade correct; supplying a non-zero leftover MUST grade
`{ correct:false, errorSignature:'forced_leftover' }`. (Asserted: `test_grade.test.js:54–62`.)

## GEN-R12 — Misconception fingerprints map to the engine union
`gradeAnswer` MUST classify the "added the bottoms too" error into
`add_denominators` (like denominators) or `add_across_unlike` (unlike denominators),
so the engine's credit→reteach path can fire. Every emitted `errorSignature` MUST
be a member of the engine `ErrorSignature` union (`add_denominators`,
`add_across_unlike`, `scaled_bottom_only`, `forced_leftover`, `not_simplified`,
`other`, `null` — pointer: engine-core `types.ts`); no orphan strings. (Asserted:
`test_grade_u4.test.js:12–37`.)

## GEN-R13 — answerShape drives the input UI
`answerShape(skill)` MUST return the input shape the practice board renders:
`'mixed'` (IMPROPER_TO_MIXED), `'integer'` (MULT_*), `'relation'`
(COMPARE_BENCHMARK), `'fraction'` (default). (`grade.js:123–131`.)

## GEN-R14 — Every skill has a hint ladder
`hintsFor(skill)` MUST return ≥1 non-trivial string rung (>8 chars) for every
registered skill, and MUST return `[]` for an unknown skill without crashing.
Hints MUST be strategy reminders, NOT the answer, and MUST be generic across a
skill's variations (no leaked numbers). (Asserted: `test_hints.test.js:6–21`.)

## GEN-R15 — Hint use is a gate signal (defined here, recorded elsewhere)
The hint ladder is designed so that a hinted correct does not count toward the
clean fade streak or scaffold-independence (the false-positive guard). This slice
DEFINES the rungs; the `hint_max_rung` recording and gate effect live in
runtime-affect / engine-core (pointer). (`hints.js:1–11`.)

## GEN-R16 — CCSS denominator contract (delegated)
Generated denominators SHOULD stay inside the grade-3–5 set
`{2,3,4,5,6,8,10,12,100}` (constitution §5.6). The generator number pools are
small and curated and do not draw 7 or 9 except where a tier pool explicitly lists
7 (e.g. `addUnlikeCoprime` tier-1 pair `[2,7]`, `subSameDen`/`addSameDen` tier-1
pools include 7). NOTE: contract enforcement (`ccss.js::isInGrade`) lives in
shell-nav and the *lesson* banks, not in this slice — the generator pools are NOT
run through `filterBankInGrade`. See `gotchas.md` G-GOTCHA-3.
