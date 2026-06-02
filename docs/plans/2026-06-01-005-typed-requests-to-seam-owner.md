---
title: "Typed requests to the seam-owning workflow (plan 005, Phases 1–3)"
type: coordination
status: open
date: 2026-06-02
origin: docs/plans/2026-06-01-005-feat-student-observation-affect-plan.md
---

# Typed requests — student-observation layer (Phases 1–3 landed)

Phases 1–3 of plan 005 are built and green entirely in **new** files:

- `web/src/engine/observe/{baseline,detectors,index}.ts` — behavioral telemetry floor.
- `web/src/runtime/affect/{composite,affectState,ledger,governor,index,selfReport}.js` — corroboration engine, precision ledger, nudge-fatigue governor, self-report core.
- `web/src/ui/AffectProbe.jsx` + `web/src/styles/affectprobe.css` — self-report probe.
- Tests: `web/tests/engine/observe/*`, `web/tests/runtime/affect/*`, `web/tests/runtime/test_affectProbe.test.jsx` (91 tests).

These modules consume the engine seams **read-only** (`import type { Signal, Event, … }`,
the `PARAMS` value). The firewall holds structurally: no mastery-gate-chain file
(`gate/mastery/dimensions/measurementReduce/bkt/credit`) imports any of them.

The following changes live **inside files the build workflow owns**. They are
requested here, not made directly. Each is an *enhancement*: the new code already
works and is tested without them (it carries fallbacks), so none is a blocker.

---

## R1 — `context_hash` as a first-class `Signal` field (Phase 0 seam)

**File:** `web/src/engine/types.ts` (`Signal`).
**Now:** detectors stamp `payload.context_hash` (FNV-1a over
`{item_id, scaffold_level, hint_state, round(P_known·1000)}`) — see
`observe/detectors.ts#contextHash`.
**Request:** add an optional first-class field so it is queryable without reaching
into `payload`:
```ts
export interface Signal {
  …
  /** Compact hash of {item_id, scaffold_level, hint_state, P_known_at_emission}. */
  context_hash?: string;
}
```
When this lands, `makeSignal` in `detectors.ts` moves the value from `payload` to the
field (one-line change on our side).

## R2 — Reserve `sensor_unavailable` as a distinct signal type (Phase 0 seam, for Phase 4)

**File:** `web/src/engine/types.ts` (doc/union of known Signal `type` strings, if one is
introduced).
**Why now:** so Phase 4 camera occlusion never masquerades as `attention:away`.
We emit no such signal yet; this is a reservation only. No code change on our side.

## R3 — `too_fast_correct` reads a per-child residual floor (Phase 1, S4)

**File:** `web/src/engine/observation.ts:322`
```ts
const too_fast_correct = correct && latency < PARAMS.latencyFloorMs;
```
**Request:** allow the floor to come from a per-child function, defaulting to today's
constant when no baseline exists yet:
```ts
// optional injected fn; falls back to the constant
const floor = opts?.plausibleFloorMs?.(scaffold_level) ?? PARAMS.latencyFloorMs;
const too_fast_correct = correct && latency < floor;
```
The function is ready: `observe/baseline.ts#plausibleFloorMs(baseline, difficulty,
PARAMS.latencyFloorMs)`. Cold start returns the constant, so behavior is identical
until a baseline establishes. **Until this lands, the constant floor stays — no
regression.**

## R4 — Wire the observe + affect pipeline into `recentBehavior` (Phases 1–2)

**File:** `web/src/runtime/useLessonEngine.js` (~141–164, ~357–364).
**Now:** `recentObsRef` is allocated but never appended; `disengagedCount` never
increments; so `recentBehavior = { observations: [], isDisengaged: false }` and the
disengaged-escalation trigger is unreachable (a known finding, mirrored in the harness).
**Request (at the submit boundary, after the reduce):**
1. `const { signals, baseline } = observeAttempt(attemptSpan, baselineRef.current, attemptIndex)` — keep `baselineRef`/`affectRef`/`governorRef`/`ledgerRef` across attempts.
2. `const af = composeAffect({ observed: signals, ctx: { hintState, attemptIndex, context_hash }, prevAffect: affectRef.current, governor: governorRef.current, ledger: ledgerRef.current })`.
3. Feed `recentBehavior.isDisengaged = af.isDisengaged` (the corroborated T3 read) and push the attempt's `Observation` into `recentObsRef`.
4. Optionally surface `af.recommendedTier` to the Tier-2/3 nudge layer (advisory only — never to `gate.ts`).

All four imports are from new files; the only owned-file change is reading their
output into the buffer the policy already consumes.

## R5 — Populate `affect_window` from the behavioral detectors (Phase 1)

**File:** `web/src/engine/observation.ts:335` (`affect_window` is the always-empty stub;
the firewall test asserts it stays `[]` for *affect-camera* Signals).
**Request (optional):** if you want per-attempt behavioral Signals carried on the
Observation, have `segment()` accept an injected `observeAttempt` and set
`affect_window` to the derived **behavioral** Signals. **Caution:** the existing
firewall test (`test_observation.test.ts` "affect_window firewall") asserts the window
ignores *camera/emotion* Signals — keep that guarantee. Easiest: leave `affect_window`
as-is and carry behavioral signals on the side channel in R4. Listed for completeness;
our code does **not** require it.

## R6 — Emit `p_known` (and confirm `scaffold_level`/hint rung) on `problem_present`

**File:** `web/src/runtime/useLessonScaffold.js` / `useLessonEngine.js` present-emit.
**Now:** `observe/index.ts#buildContext` reads `p_known`/`P_known` from the present/judged
payload and **defaults to 0.5** when absent, weakening `context_hash` precision.
**Request:** stamp `p_known: <P_known at emission>` on the `problem_present` payload
(scaffold_level is already emitted). Purely improves slicing/hash fidelity; no behavior
change.

---

## Optional: widen `RecentBehavior` with an affect slot

**File:** `web/src/engine/policy.ts` (`RecentBehavior`).
If the policy/tier layer should read graded affect (not just `isDisengaged`), add:
```ts
export interface RecentBehavior {
  observations: readonly Observation[];
  isDisengaged: boolean;
  /** Advisory behavior-only affect read (engagement/attention/confidence; valence neutral). */
  affect?: { engagement: number; attention: number; confidence: number; valence: 'neutral' };
}
```
`composeAffect(...).affectState` already produces exactly this shape. **Firewall note:**
this slot must remain advisory — `gate.ts`/`mastery.ts` must never read it. Keep it out
of every mastery-dimension function.

---

## Deferred (not requested)

- **Phase 4 (MediaPipe presence/validity camera)** — STOPPED per instruction; awaiting
  user confirmation + the Phase 2 ledger showing presence would resolve real ambiguity.
- **002 mastery calibration tail** (`params.ts`/`gate.ts` tuning) — the harness's job;
  owned by the active worker; not touched.
