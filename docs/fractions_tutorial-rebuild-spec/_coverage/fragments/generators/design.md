<!-- FRAGMENT slice=generators section=design.md -->
<!-- Owned globs: web/src/generators/**, web/tests/generators/** -->
<!-- Pointers (NOT documented here — owned elsewhere): skill ids, ScaffoldLevel,
     ErrorSignature, Decision/TransferProbe → engine-core (engine/types.ts,
     engine/graph.ts). gate/credit/observation → engine-core. The lesson-level
     graders in AppR4.jsx / LessonUnlikeDen.jsx → lessons-rooms. practiceFlow /
     useGeneratedPractice → runtime-affect. -->

# Design — Generators (deterministic problem supply, grading, hints)

## G.0 Why this subsystem exists (rationale)

The mastery engine (`engine-core`) decides **when** to present another problem,
fade scaffold, raise scaffold, or fire a transfer probe — but it owns no problems.
Before this slice, every lesson hard-coded exactly one fixed worked example
(`2/7+3/7`, `8/12→2/3`, …). The generators are the **supply side**: per-skill pure
functions that emit an unlimited stream of *validated* problem variations,
classified by structural surface form so the engine can demand a *different* shape
for a transfer probe (`core.js:1–27` header). One generator exists per engine skill
node (the 10 nodes in `engine/graph.ts` — pointer; do not re-enumerate the DAG
here).

The whole subsystem is **PURE + DETERMINISTIC** (constitution §5.5): no
`Math.random`, no `Date`. Randomness comes only from a seeded PRNG keyed by
`(skill, index)`, so a replayed session reproduces the exact same problem stream —
this mirrors the engine's KTD9 replay discipline and is what lets the synthetic
harness (`harness` slice) grade the *same* generated problems with the *same*
`grade.js`, so "correct" means the same thing in the live app and the red-team runs.

The subsystem has three public faces:
- **`generators/index.js`** — the registry: `generateFor` / `surfaceFormsFor` /
  `generatorSkills` / `hasGenerator`.
- **`generators/grade.js`** — `gradeAnswer` (correctness + stars + ErrorSignature)
  and `answerShape`.
- **`generators/hints.js`** — `hintsFor` (a 2-rung strategy ladder per skill).

`generators/core.js` is the shared, non-exported-to-callers kernel (seeded PRNG,
numeric helpers, level→tier mapping, surface-form rotation, `problemIdFor`).

---

## G.1 The GeneratedProblem envelope (the contract)

Every generator's `generate(spec)` returns one **GeneratedProblem** object. The
envelope is fixed; only the `operands` / `answer` shapes are skill-specific
(`core.js:25–26`).

```
GeneratedProblem = {
  skill:       string,   // engine skill node id (e.g. 'SIMPLIFY') — pointer to engine-core graph
  level:       0..4,     // the ScaffoldLevel passed in (pointer to engine-core ScaffoldLevel)
  surfaceForm: string,   // one of the skill's SURFACE_FORMS
  index:       number,   // monotonic attempt index (drives the seed + form rotation)
  operands:    object,   // skill-specific (the chosen numbers)
  answer:      object,   // skill-specific (computed BY the generator from operands)
  prompt:      string,   // human-readable problem text
  problem_id?: string,   // attached by generateFor (see G.2) if not already present
}
```

**Correct-by-construction (constitution §5.5 content-correctness):** each generator
*chooses operands first, then computes the answer from them*. A generated problem
is therefore never wrong by construction — the brief's non-negotiable
content-correctness, achieved via constrained generation rather than post-hoc
checking. `core.js:11–23` states this as the contract every generator follows.

### G.1.1 `spec` input

`generate({ level = 0, index = 0, surfaceForm } = {})`:
- **`level`** (0..4, default 0) — the design ScaffoldLevel (pointer: engine-core).
  Mapped to a 0..2 *difficulty tier* by `tierForLevel` (G.4). Low level → friendly
  numbers + canonical shape; high level → bigger denominators, improper results,
  misconception traps.
- **`index`** (default 0) — monotonically increasing attempt count. Seeds the PRNG
  AND drives default surface-form rotation. Same `(skill, level, index)` ⇒
  byte-identical problem.
- **`surfaceForm`** (optional) — forces a structurally-distinct variant for a
  TransferProbe (pointer: engine-core Decision). Omitted ⇒ the generator rotates
  forms by `index`.

---

## G.2 Registry — `generators/index.js`

The registry is a `Map<SKILL, module>` built once from the 10 generator modules
(`index.js:24–37`). Each generator module exports `SKILL` (its node id),
`SURFACE_FORMS` (a 2-element array), and `generate`.

| Export | Signature | Behavior |
|---|---|---|
| `hasGenerator(skill)` | `(string) → boolean` | `REGISTRY.has(skill)`. |
| `generatorSkills()` | `() → string[]` | All registered skill ids (`[...keys]`). |
| `surfaceFormsFor(skill)` | `(string) → string[]` | A **copy** (`.slice()`) of the skill's `SURFACE_FORMS`, or `[]` if unknown. |
| `generateFor(skill, spec)` | `(string, object?) → GeneratedProblem` | Looks up the module; **throws** `No problem generator for skill "<skill>"` if none; else returns `m.generate(spec)` with a `problem_id` attached. |

**`problem_id` attachment (`index.js:69–78`):** after generating, if
`prob.problem_id === undefined`, `generateFor` sets it via
`problemIdFor(skill, prob.level, prob.surfaceForm, spec.index ?? prob.index ?? 0)`
= the string `` `${skill}:${level}:${surfaceForm}:${index}` `` (`core.js:125–127`).

WHY: the engine's *independence check* must count **structurally distinct**
problems, not distinct answer values (two different problems can share a numeric
answer and must still count as two). `problem_id` is that structural key. It is
attached centrally in `generateFor` (additive) so every generator gets it without
per-generator edits.

> RFC-2119: `generateFor` MUST throw on an unregistered skill (do not return a
> sentinel). Callers MAY pre-check with `hasGenerator`.
> `surfaceFormsFor` MUST return a fresh copy so callers cannot mutate the module's
> `SURFACE_FORMS`.

---

## G.3 Determinism & replay — `generators/core.js` PRNG

The replay guarantee (constitution §5.5) rests on three pure primitives:

- **`makeRng(seed)`** (`core.js:33–42`) — mulberry32. A tiny, fast, deterministic
  PRNG returning `() => [0,1)`. No global state; the closure variable `a` is the
  whole state.
- **`hashStr(s)`** (`core.js:45–52`) — FNV-1a 32-bit string hash. Turns a skill id
  into a stable seed contribution.
- **`rngFor(skill, index)`** (`core.js:55–58`) — the seam every generator uses:
  `seed = (hashStr(skill) ^ imul(index+1, 2654435761)) >>> 0`, then `makeRng(seed)`.
  Keying on `(skill, index)` (not on `level`) means *changing scaffold level does
  not reshuffle the stream* — only the difficulty pools change; the index still
  pins the draw sequence.

> RFC-2119: generators MUST draw all randomness from `rngFor(SKILL, index)` and
> MUST NOT call `Math.random()` or `Date.now()`. This is asserted by
> `test_generators.test.js` ("deterministic — same (level, index) reproduces the
> exact problem", lines 135–141).

---

## G.4 Difficulty model — level → tier → number pools

`tierForLevel(level)` (`core.js:102–107`) collapses the 5 scaffold levels onto a
3-step difficulty tier so the whole library shares one notion of "harder":

| ScaffoldLevel | Tier | Meaning |
|---|---|---|
| L0, L1 | 0 | friendliest numbers, canonical shape |
| L2, L3 | 1 | mid |
| L4 | 2 | largest numbers, traps, transfer |

Non-finite `level` defaults to tier 0. Each generator holds a per-tier number pool
(e.g. `addSameDen.DEN_POOL`, `simplify.CONFIG`) indexed by this tier.

---

## G.5 Surface forms & transfer selection

Every generator declares exactly **two** surface forms (`SURFACE_FORMS`, asserted
length-2 by `test_generators.test.js:111`). The first is the *gentle/canonical*
shape; the second is the *transfer* shape that proves understanding rather than
template-matching. `resolveSurfaceForm(forms, requested, index)` (`core.js:113–116`):

- If a `requested` form is supplied **and** is a member of `forms`, honor it
  (the TransferProbe path).
- Otherwise rotate deterministically by `index`:
  `forms[((index % len) + len) % len]` (the modulo is double-guarded so negative
  indices still land in range).

This is why a run of problems with no explicit form **alternates** the two shapes,
and why the engine can pin the *other* shape for a transfer probe (pointer:
engine-core `TransferProbe` Decision, `runtime/practiceFlow.js` consumes it).

### The ten generators (one per skill node — pointer to engine-core graph)

Structured per-generator notes; each row's "transfer form" is the second member.

| Skill (node id) | Room | Operation | Forms `[canonical, transfer]` | Transfer misconception targeted |
|---|---|---|---|---|
| `ADD_SAME_DEN` | r1 | `a/d + b/d` | `[proper, makes_whole]` | sum lands exactly on a whole (`a+b===d`): is it `d/d`? is it `1`? |
| `SUB_SAME_DEN` | s1 | `s/d − t/d`, `t<s` | `[part_minus_part, whole_minus_part]` | starting from a full whole — the top of a whole is `d`, not `1`. |
| `ADD_UNLIKE_NESTED` | r3 ("Scale One") | `a/ds + b/dl`, `ds \| dl` | `[nest_x2, nest_x3plus]` | bigger scale factor (≥3×), not just one doubling. |
| `ADD_UNLIKE_COPRIME` | r2 ("Cross-Multiply") | `a/d1 + b/d2`, `gcd=1` | `[unit, nonunit]` | numerators > 1 — the real cross-multiply, not just `1/2+1/3`. |
| `SIMPLIFY` | r4 | `(p·k)/(q·k) → p/q` | `[single_factor, multi_factor]` | composite `k` — needs >1 division step / a bigger shared factor. |
| `IMPROPER_TO_MIXED` | r5 | `(w·d+r)/d → w r/d` | `[with_remainder, exact_whole]` | `r===0`: a bare whole with NO leftover (mis-written as `2 0/7`). |
| `MULT_EQUAL_GROUPS` | m1 | `g groups of s` | `[canonical, commuted]` | same product read the other way (`g>s`) — groups×size, not one orientation. |
| `MULT_FACTS` | m3 | `a × b` | `[core, edge]` | one factor is 0 or 1 (identity/zero facts mis-filled in a grid). |
| `FRACTION_ON_LINE` | nl | place `num/den` | `[proper, improper]` | value > 1 (past the first whole) — reads the line, not "count ticks". |
| `COMPARE_BENCHMARK` | cmp | order, or vs ½ | `[same_den, benchmark_half]` | reason about ½ (size), not bigger-top-wins. |

### Per-generator construction notes (the load-bearing details)

- **`addSameDen`** — `makes_whole`: `a∈[1,den-1]`, `b=den-a` (sum `=den`).
  `proper`: `a∈[1,den-2]`, `b∈[1,den-1-a]` (sum `<den`). Denominator stays locked.
- **`subSameDen`** — `whole_minus_part`: `s=den`; else `s∈[2,den-1]`. Always
  `t∈[1,s-1]` so `t<s` (no negative results).
- **`addUnlikeNested`** — small den `ds` from the tier pool; multiplier `m`: `2`
  for `nest_x2`, else a tier multiplier `≥3` (fallback `3` if the tier offers only
  `2`). `dl = ds·m`. Answer is `(a·m + b)/dl` **unreduced over the larger
  denominator** (the lesson, not reduction, is the skill).
- **`addUnlikeCoprime`** — coprime den pair from the tier pool (guarded: `+1` if a
  pair is somehow not coprime). `unit`: both numerators 1; else
  `a∈[1,d1-1], b∈[1,d2-1]`. Answer is `(a·d2 + b·d1)/(d1·d2)` **unreduced** (the
  cross-multiply result).
- **`simplify`** — builds *backwards*: pick lowest-terms `p/q` (`gcd(p,q)=1`,
  nudged coprime with a `q`-bounded loop and a `p=1` prime-safe fallback), multiply
  by `k` (`single_factor`: a prime; `multi_factor`: a composite). Presents
  `(p·k)/(q·k)`; answer is `p/q`. Guaranteed reducible.
- **`improperToMixed`** — pick whole `w`, den `d`; remainder `r`: `0` for
  `exact_whole`, else `r∈[1,d-1]`. Presents `(w·d+r)/d`; answer is the mixed
  `{whole:w, num:r, den:d}` (`r===0` ⇒ a bare whole).
- **`multEqualGroups`** — `g,s` in the tier range; ties broken so the form's
  inequality holds: `canonical` swaps to ensure `g≤s`, `commuted` swaps to ensure
  `g>s`. Answer `{product: g·s}`.
- **`multFacts`** — `core`: both factors `∈[2,hi]`. `edge`: one factor `∈[2,hi]`,
  the other `∈{0,1}`, with a coin-flip on which leads. Answer `{product: a·b}`.
- **`fractionOnLine`** — `proper`: `num∈[1,den-1]`. `improper`: `num∈[den+1, 3·den]`
  re-drawn until `num%den !== 0` (never lands on a whole). Answer carries the exact
  value plus its mixed reading `{num, den, whole, rem}`.
- **`compareBenchmark`** — `benchmark_half`: `a/den` vs `1/2`, exact via `2a vs den`
  (a nudged off `2a===den` at tier 0 to avoid a trivial equal), `rel ∈
  {less,more,equal}`. `same_den`: `a/den` vs `b/den` (`a≠b`), `rel ∈ {'<','>'}`.

> NOTE (cross-form rel vocabulary): `COMPARE_BENCHMARK` emits **two different**
> `rel` vocabularies — `{less,more,equal}` for `benchmark_half`, `{'<','>'}` for
> `same_den`. `gradeAnswer` compares `rel` by strict equality, so the answer UI
> (pointer: lessons-rooms) MUST supply the matching vocabulary per surface form.

---

## G.6 Grading — `generators/grade.js`

`gradeAnswer(problem, answer = {})` → `{ correct, stars, errorSignature }`
(`grade.js:65–120`). Pure and reusable: the live practice board grades with it and
the synthetic harness grades the same generated problems with it, so "correct" is
defined once. `errorSignature` values are members of the engine's `ErrorSignature`
union (pointer: engine-core `engine/types.ts`).

### G.6.1 Per-skill judging (switch on `problem.skill`)

| Skill(s) | Answer shape | Correct when… | Stars / signature on miss |
|---|---|---|---|
| `SIMPLIFY` | `{num,den}` | equal value to presented **AND** lowest terms (`gcd=1`) | equal-but-not-reduced ⇒ `correct:false, stars:2, 'not_simplified'`; non-equal ⇒ `stars:0, 'other'`; invalid (`den≤0` or `num<0`) ⇒ `stars:0, null` |
| `IMPROPER_TO_MIXED` | `{whole,num,den}` | `whole` matches **AND** remainder matches (`r===0` ⇒ blank/zero leftover accepted) | `forced_leftover` if exact-whole but learner wrote a leftover; else `'other'` |
| `MULT_EQUAL_GROUPS`, `MULT_FACTS` | `{value}` (or `{product}`) | `value === answer.product` | `stars:0, 'other'` |
| `COMPARE_BENCHMARK` | `{rel}` | `rel === answer.rel` (strict) | `stars:0, 'other'` |
| *default* (the fraction skills) | `{num,den}` | equal **value** (`equalValue`) — any equal-value form counts; the skill is the operation, not reduction | `classifyAddError(...) || 'other'` |

Helpers: `equalValue(an,ad,bn,bd)` = cross-multiply equality `an·bd === bn·ad`,
guarding `ad>0 && bd>0` (`grade.js:16–19`). `num(x)` coerces string→int and yields
`NaN` on garbage (`grade.js:21–24`).

### G.6.2 `classifyAddError` — the misconception fingerprint (U4)

`classifyAddError(operands, an, ad)` (`grade.js:49–58`) detects the classic "added
the bottoms too" error: when the learner's `(an/ad)` equals `(p.num+q.num)/(p.den+q.den)`
for the two fraction operands. It returns:
- `'add_across_unlike'` when the two operand denominators differ;
- `'add_denominators'` when they match.

WHY (from `grade.js:43–48` + `test_grade_u4`): a catch-all `'other'`/`wrong_value`
cannot drive remediation — the engine's credit→reteach path needs the *named*
misconception to dock the right prereq (pointer: engine-core `credit.ts`).
`add_denominators` is cited as the 6.58×-most-common error in the U4 comment.

`twoOperands(operands)` (`grade.js:31–41`) normalizes the varying operand shapes
(`{a,b}`, `{start,take}`, `{a,b,den}`, or `[[n,d],[n,d]]`) into exactly two
`{num,den}` pairs, or `null` if fewer than two fraction-shaped operands exist.

### G.6.3 `answerShape(skill)` (`grade.js:123–131`)

Maps a skill to its input shape so the practice board (pointer: lessons-rooms
`GenPracticeBoard`/`AnswerBar`) renders the right control:
`IMPROPER_TO_MIXED → 'mixed'`; `MULT_EQUAL_GROUPS`/`MULT_FACTS → 'integer'`;
`COMPARE_BENCHMARK → 'relation'`; everything else → `'fraction'`.

### G.6.4 ErrorSignature surface emitted by grade.js

`gradeAnswer` can emit: `add_denominators`, `add_across_unlike`, `forced_leftover`,
`not_simplified`, `other`, or `null`. It does **NOT** emit `scaled_bottom_only`
(that signature is produced only by the *lesson-level* graders in `AppR4.jsx` and
`LessonUnlikeDen.jsx` (pointer: lessons-rooms) and by `engine/observation.ts`
(pointer: engine-core)). See `gotchas.md` G-GOTCHA-2. The full union is owned by
engine-core (`engine/types.ts`).

---

## G.7 Hint ladders — `generators/hints.js`

`hintsFor(skill)` → `string[]` (`hints.js:56–58`), or `[]` for an unknown skill.
Each skill has a **2-rung** ladder (`hints.js:12–53`):
- **Rung 1** = the *method* (a strategy reminder).
- **Rung 2** = a *concrete first move*.

Hints are deliberately **generic across a skill's variations** so they never leak
the specific numbers — they are real hints, NOT the answer.

**Pedagogical contract (the false-positive guard — `hints.js:1–11`):** using a hint
is recorded as `hint_max_rung` on the attempt (pointer: engine-core `Observation`
/ hint_dependence dimension). A *hinted* correct is therefore not hint-free: it does
NOT count toward the clean-correct fade streak nor toward scaffold-independence.
Leaning on hints intentionally slows the climb and keeps the mastery gate honest.
(The recording itself happens in the runtime/lesson layer — pointer: runtime-affect
/ lessons-rooms; this slice only *defines* the rungs.)
