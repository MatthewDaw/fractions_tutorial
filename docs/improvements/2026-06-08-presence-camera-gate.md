---
title: "Presence/validity MediaPipe camera gate (005 Phase 4) — deferred, gated on the ledger ablation bar"
status: open
priority: P3
category: enhancement
source_uid: "005/Phase 4 (S2)"
source_finding: Missing (sanctioned deferral)
plan: docs/plans/2026-06-01-005-feat-student-observation-affect-plan.md
report: docs/reviews/2026-06-08-plan-vs-reality-compliance.md
date: 2026-06-08
---

## What
The on-device MediaPipe Face Landmarker presence/validity gate (two booleans: `present`,
`sensor_valid`; no emotion/valence) that disambiguates `idle` = thinking-stuck vs left-the-room.

## Why
Plan 005 Phase 4 is **explicitly gated**: it "ships only if the ledger says a presence signal
would resolve real ambiguity" and "is allowed to end in 'don't ship the camera'" (Open Q4). So
its absence is a sanctioned deferral, not a defect — logged here for completeness so the backlog
is exhaustive.

## Evidence
- No `web/src/runtime/affect/presence.ts`, no MediaPipe dependency, no consent UI.
- The behavioral floor it must beat (Phases 0–3) IS built: `engine/observe/*`,
  `runtime/affect/{composite,ledger,governor,selfReport}.js`, `ui/AffectProbe.jsx`.

## Suggested approach
Only after the precision ledger (Phase 2) shows behavior-only leaves real ambiguity: add
`runtime/affect/presence.ts` per plan 005 Phase 4 (single-primary-face lock, opt-in consent,
on-device, no raw frames, derived booleans only), and run the ablation gate — ship only if it
cuts false idle-nags vs behavior-only.

## Acceptance criteria
- The ablation gate produces a logged ship/don't-ship decision from the ledger.
- If shipped: presence/`sensor_valid` booleans only, no emotion code path (auditable by
  inspection; ties to the Phase-0 firewall lint); the gate never reads affect.
