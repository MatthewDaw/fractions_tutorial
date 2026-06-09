---
title: "Discharge harness U13: apply one real fix and certify it on held-out personas (flags-off→on before/after)"
status: open
priority: P2
category: behavioral-fix
source_uid: "harness/U13 (R8, R6, R13)"
source_finding: Partial
plan: docs/plans/2026-06-02-001-feat-synthetic-challenger-harness-plan.md
report: docs/reviews/2026-06-08-plan-vs-reality-compliance.md
date: 2026-06-08
---

## What
Run the harness's recursive loop with a real engine change as the "change," produce a
mechanical REAL/GAMING verdict on the sealed held-out persona family, and commit the
flags-off→flags-on before/after evidence. The recommended change to certify is wiring
`disengagedCount` (see `2026-06-08-wire-disengaged-count.md`).

## Why
Harness U13 R8 is the brief's keystone deliverable: "apply at least one real fix and **prove it
helps on held-out personas/seeds** without regressing others." The full harness apparatus and a
committed flags-off baseline exist, but the *applied + certified* before/after never landed —
the improvement mandate is staged, not discharged.

## Evidence
- Apparatus present: `web/src/harness/{recursiveLoop,search,findings,metrics,report}.js`,
  `oracle/expectedFindings.js`, committed `docs/harness/improvement-backlog.md` and
  `docs/harness/tapes/baseline-seed1.jsonl`.
- Missing: `docs/harness/decision-log.md` carries no certified REAL verdict tied to an
  `engine_sha`/`params_hash` flip; no flags-on (activated) sweep artifact sits beside the
  flags-off baseline; `docs/harness/baseline-report.md` shows no before/after pair.
- The backlog's top severity-100 items (e.g. `disengaged-never-escalates`) are still listed as
  present — none has been driven to "resolved" via a certified loop.

## Suggested approach
Per harness U13 / KTD15:
1. Land the `disengagedCount` writer (the P1 fix) on a branch under a reversible flag.
2. Run `npm run harness -- loop` with "before" = flags-off and "after" = flags-on on TRAIN and
   the SEALED held-out family; assert the `disengaged-never-escalates` expected-finding flips
   present→resolved on both, the untouched guardrail (novel-form transfer) holds, and no
   previously-passing persona regresses.
3. Emit the REAL/GAMING verdict into `docs/harness/decision-log.md` with `engine_sha`/`params_hash`;
   refresh `docs/harness/baseline-report.md` with the flags-off vs flags-on before/after.
4. Keep all harness-owned edits under `web/src/harness/` + `docs/harness/` (do not re-author the
   engine fix here — that is the P1 file's job; the harness *certifies*).

## Acceptance criteria
- `docs/harness/decision-log.md` records a certified REAL verdict with engine/params hashes.
- `docs/harness/baseline-report.md` shows the flags-off→on before/after for the chosen defect.
- The dashboard recursive panel shows the held-out ✓ + REAL verdict.
- Re-running the seed reproduces the numbers byte-stably.
