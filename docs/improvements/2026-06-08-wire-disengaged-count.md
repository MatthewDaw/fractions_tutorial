---
title: "Wire the disengagedCount writer so the disengagement trigger (scaffold + escalation) is reachable"
status: open
priority: P1
category: behavioral-fix
source_uid: "002/U9 (R11); state-model §5.5 EscalateToHuman"
source_finding: Partial / Broken-at-runtime
plan: docs/plans/2026-06-02-002-feat-activate-dormant-pedagogy-plan.md
report: docs/reviews/2026-06-08-plan-vs-reality-compliance.md
date: 2026-06-08
---

## What
Add the missing writer that **increments `disengagedCount`** from a defined disengagement
signal, so the disengaged-triggered frustration scaffold and the `EscalateToHuman{reason:
"disengaged"}` path can actually fire. Today the counter is initialized and read but never
written, making the entire disengagement branch structurally unreachable.

## Why
Plan 002 U9 R11: "a frustration trigger fires reliably (disengagement / consecutive-error
counters **actually increment**)." The response side (warm scaffold rationale) and the
consumer side (escalation legality) are built; only the input edge is missing, so the feature
is inert at runtime. This is the single highest-leverage dead-pedagogy item — the project's
own synthetic harness independently rediscovered it (audit-corroborated, severity 100).

## Evidence
- `web/src/runtime/useLessonEngine.js:60` — `disengagedCount: 0` (init only).
- `web/src/runtime/useLessonEngine.js:363` — `isDisengaged: policyStateRef.current.disengagedCount >= 3`
  (read only; permanently false).
- `web/src/engine/policy.ts:359` — `if (state.disengagedCount >= nDiseng || recentBehavior.isDisengaged)`
  (read only).
- grep `disengagedCount` across `web/src/**` → only the init + two reads + harness commentary.
  No `+= 1` / assignment anywhere.
- Harness corroboration: `web/src/harness/oracle/expectedFindings.js:189-209`
  ("disengaged trigger is UNREACHABLE: disengagedCount never increments");
  `docs/harness/improvement-backlog.md:14-19` (`disengaged-never-escalates`, severity 100,
  lever "wire disengagedCount").

## Suggested approach
Per plan 002 U9 / KTD7:
1. Define the disengagement signal — derive from the behavioral observe layer that already
   exists (`engine/observe/detectors.ts` emits idle / latency_stall / orphaned_interaction /
   rapid_submit). Increment `disengagedCount` in `useLessonEngine.js` at the submit/entry
   boundary when the recent-behavior window shows sustained disengagement (and reset on
   re-engagement), mirroring how `consecutiveErrors` is maintained (`:439,:455`).
2. **Decouple thresholds**: arming `disengagedCount` also arms `EscalateToHuman` (shared
   counter). Use a *separate* threshold/counter for the frustration scaffold vs. escalation so
   wiring one does not spuriously fire the other (plan 002 KTD7 explicitly).
3. Keep it reversible: gate the scaffold response behind `PARAMS.frustrationScaffold` (already
   exists, default off); the counter itself can be live, only the *response* default-off.
4. **Do not touch `consecutiveErrors`** until the suspected-over-count contradiction is ruled
   by a human (report open question 2).

## Acceptance criteria
- `disengagedCount` increments on the defined disengagement signal (currently never fires) —
  matches plan 002 U9 test scenario.
- Arming `disengagedCount` does NOT spuriously fire `EscalateToHuman` at the new rate
  (separate threshold/counter asserted).
- With `PARAMS.frustrationScaffold` on, a disengaged window yields a `RaiseScaffold` with a
  reachable hint foothold + warm Babushka line; with it off, no scaffold injection (no-op vs
  today).
- `nextDecision` still called exactly once per submit boundary.
- The harness expected-finding `disengaged-never-escalates` flips from **present** (flags-off)
  to **resolved** (flags-on) on TRAIN and the sealed held-out family.
