---
title: "Schedule the delayed-probe-required-for-mastery flip (002 U7 leniency trap)"
status: open
priority: P3
category: tech-debt
source_uid: "002/U7 (R9)"
source_finding: Partial (built, default-off)
plan: docs/plans/2026-06-02-002-feat-activate-dormant-pedagogy-plan.md
report: docs/reviews/2026-06-08-plan-vs-reality-compliance.md
date: 2026-06-08
---

## What
Decide and schedule the flip of the "a passed delayed retention probe is required for full
`Mastered`" behavior, which ships reversible/lenient by default. The decay/demotion machinery
is fully wired; only the certification-requires-a-probe flag is deferred.

## Why
Plan 002 U7 R9: "certification requires at least one passed delayed probe (acquisition is
distinguished from durable mastery)." The capability is BUILT (decay folds through the reducer,
demotion fires), but the requirement defaults off. The plan's leniency-vs-value risk says an
un-scheduled lenient default is "built, called, but flagged off" — so it needs an explicit flip
commitment or an honest "instrumentation-only" label.

## Evidence
- `web/src/engine/measurementReduce.ts:294-305` — `applyProbeResult` folds probe results
  (demotion live).
- `web/src/kitchenProgress.js:248` — `recordRetentionProbe`; `web/src/Shell.jsx:160` settles
  probes on world-return.
- The +1-day earliest probe (`PROBE_DELAYS_MS`) means durable `Mastered` is unreachable
  in-session — confirm nothing user-facing gates on `Mastered` vs `Acquired` (plan 002 U7 caveat).

## Suggested approach
Per plan 002 U7 + Scope Boundaries: pick reasonable probe-delay defaults, confirm in-session
progression uses `Acquired` (not `Mastered`), and either flip the requirement with a
calibration/observation trigger or mark the unit instrumentation-only.

## Acceptance criteria
- A documented flip schedule (or an explicit instrumentation-only note) exists.
- In-session progression provably uses `Acquired`; no kitchen unlock / U3 payoff gates on the
  +1-day `Mastered`.
- With the flag on, a failed probe demotes and a passed delayed probe confirms durable mastery;
  with it off, behavior matches today (replay-stable).
