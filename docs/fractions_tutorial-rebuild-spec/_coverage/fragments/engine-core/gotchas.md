<!-- slice: engine-core — fragment for gotchas.md -->

# Engine gotchas (engine-core)

Non-obvious constraints a re-implementer WILL break unless warned. The spanning
ADRs (engine purity & wire-DTO contract; affect firewall; prereq-prepend credit
constraint; TS-via-`.js` resolveTsFromJs) are synthesis-owned — these are the
slice-local pitfalls.

---

## 1. Prereq ordering is load-bearing (`credit.ts:97` ⇄ `graph.ts`)

`credit.ts` `resolveImplicatedPrereq` handles `add_across_unlike` by docking
**`bindingNode.prereqs[prereqs.length − 1]`** — the LAST prereq. Therefore in
`graph.ts`, `MULT_FACTS` is **PREPENDED** (never appended) to:
- `ADD_UNLIKE_COPRIME.prereqs = ['MULT_FACTS', 'ADD_UNLIKE_NESTED']`
- `SIMPLIFY.prereqs = ['MULT_FACTS', 'ADD_UNLIKE_COPRIME']`

so the original FRACTION prereq stays LAST and a straight-across fraction error
keeps docking the fraction prereq, not multiplication fluency.

> GIVEN a child makes an `add_across_unlike` error on `ADD_UNLIKE_COPRIME`,
> WHEN credit is assigned, THEN the discounted dock MUST land on
> `ADD_UNLIKE_NESTED` (the last prereq), NOT `MULT_FACTS`.

If you re-order these prereq arrays (e.g. append MULT_FACTS), credit silently
mis-routes to multiplication fluency. The constraint is documented inline at
both `graph.ts` (the prepend comment) and `credit.ts:97`. `credit.ts` needs no
edit because of the prepend — that's the whole point.

---

## 2. The affect firewall is structural — do not add a back door

- `Observation.affect_window` is a `readonly never[]` typed stub, **always `[]`**.
  `segment()` collects the span's `Signal`s into a local `_signals` and
  deliberately discards them.
- `mastery.ts` and `gate.ts` MUST NOT read `affect_window`,
  `last_retention_probe`, or any Signal-derived field for the mastery
  computation. The gate reads ONLY the four Chain-A conjuncts.
- `observe/**` emits `Signal`/`ObservedSignal` ONLY — it never returns or mutates
  a `MasteryEstimate`. Adding such a path breaks constitution §5.2.
- A test (test_gate_u1) asserts that injecting a populated `affect_window` does
  not change `isMastered` output. Keep it true.

---

## 3. Engine purity — no React, no wall-clock

Every `engine/**` file header declares it. Time enters ONLY as `event.t` or an
injected `now`. The localStorage adapter (`loadLog`/`saveLog`/`migrate...`) is the
sole I/O and is kept OUT of the fold so `measurementReduce`/`foldLog` stay
replayable. Do not call `Date.now()`, import React, or read ambient config inside
`engine/**`. (The runtime slice owns `Date.now()`.)

---

## 4. `getNode` throws on unknown ids — typos crash at init

`getNode(id)` throws `Unknown skill node id: "<id>"`; `prereqsOf` maps every
prereq through `getNode`. Any id mismatch in `graph.ts` (or a caller) crashes the
DAG at construction, not silently. Node ids are canonical
SCREAMING_SNAKE_CASE and 1:1 with a `roomId`.

---

## 5. `ALL_NODES` topological order is load-bearing

`mostUpstreamUnmastered`, escalation's `findMostUpstreamNodeForEscalation`, and
`suggestedNextRoom` (shell-nav) all walk `ALL_NODES` front-to-back. The
multiplication foundations are inserted at indices 0–1 (strictly upstream of the
fraction strand). Re-ordering the array changes routing/escalation behavior.

---

## 6. Discounted credit blends, it does not re-run BKT

In `measurementReduce`, a credit `weight < 1.0` does NOT apply a separate BKT
math — it blends `P_known += weight·(fullPosterior − P_known)` and re-clamps to
`pKnownClamp`. Only the BINDING node accumulates the `Observation` (dimensions
are per-binding-node); prereq docks move P_known only.

---

## 7. `error_signature` trust seam + coercion

`segment()` trusts an `error_signature` already on the `judged` payload and
coerces any value outside the seven-member union to `'other'`. It only
re-derives via `classifyErrorSignature` when nothing usable was emitted. Emitting
a lesson-specific string (e.g. `'flipped'`) is safe — it becomes `'other'` — but
emitting a misspelled CANONICAL signature loses the credit routing. The pre-U4
bug: the credit path was dead because segment re-derived from slip/operands the
generated runtime never emits.

---

## 8. Retention probe back-compat: missing `correct` = pass

`applyRetentionProbes` treats a `retention_probe` event with no explicit
`correct` boolean as a PASS, so older timestamp-only probe events never demote a
node. Only an explicit `correct: false` demotes (clears transfer_passed + drops
P_known). `mastered_at` is set once and PERSISTS across a later demoting probe so
a lapsed node still reads "was mastered" (needs-review), even though `isMastered`
now returns false.

---

## 9. `fluencyHardMode` default threading

`isMastered` and `fluencyOk` default `fluencyHardMode` to the LIVE
`PARAMS.fluencyHardMode` value, so policy/wall callers pick up the flag without
threading the argument. Tests flip it by mutating `PARAMS` and reset in
`afterEach`. Do not hard-code `false`.
