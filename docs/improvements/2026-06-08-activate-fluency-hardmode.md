---
title: "Calibrate + flip fluencyHardMode (and the answer_value/denominator proxy fallbacks) — close the leniency trap"
status: open
priority: P2
category: tech-debt
source_uid: "002/U1 (R2, R3); leniency-vs-value risk"
source_finding: Partial
plan: docs/plans/2026-06-02-002-feat-activate-dormant-pedagogy-plan.md
report: docs/reviews/2026-06-08-plan-vs-reality-compliance.md
date: 2026-06-08
---

## What
Calibrate an age-band latency target and flip `PARAMS.fluencyHardMode` to on (or schedule its
flip), so fluency becomes a real gate conjunct rather than an unconditional `true`. Confirm the
`problem_id`/`surface_form` distinctness seams have fully displaced the `answer_value` /
denominator proxy fallbacks at runtime.

## Why
Plan 002 U1 R2 requires "Fluency (speed) is a live gate conjunct driven by a configurable,
reversible threshold — not an unconditional `true`." The capability is built and reversible,
but ships default-lenient: `fluencyOk` returns `true` whenever `fluencyHardMode` is off. The
plan's own leniency-vs-value risk warns that an un-scheduled lenient default re-creates "built
but uncalled" one indirection later. Likewise the independence/transfer proxies remain as
*fallbacks* — they are inert only as long as the runtime always emits `problem_id`/`surface_form`.

## Evidence
- `web/src/engine/dimensions.ts:85-98` — `fluencyOk` returns `true` when `!hardMode`.
- `web/src/engine/params.ts:93` — `fluencyHardMode: false`; `:94` `fluencyLatencyTargetMs: 15_000`
  (lenient placeholder).
- `web/src/engine/dimensions.ts:143` — independence still falls back to `answer_value` proxy when
  no `problem_id`; `:192` — transfer still falls back to denominator proxy when no `surface_form`.
- Runtime *does* emit both today (`useLessonEngine.js:271-296`), so the proxies are dormant — but
  any lesson that stops emitting them silently re-arms the spoofable proxy.

## Suggested approach
- Derive an age-band latency target from the first N observed tablet sessions (plan 002 scope
  boundary names this an explicit, scheduled calibration commitment).
- Flip `fluencyHardMode` on once calibrated; keep the flag for rollback.
- Add a guard/assert that every lesson emission carries `problem_id` + `surface_form` so the
  proxy fallbacks can never silently re-arm.
- Re-run the harness `fluencyOk-always-true` expected-finding to confirm present→resolved.

## Acceptance criteria
- `fluencyOk` returns `false` for over-target latency when hard mode is on; `true` only when
  fast enough (plan 002 U1 test scenario).
- Independence/transfer never fall back to the proxy in production (emission guard green).
- Harness `fluencyOk-always-true` finding flips to resolved on held-out.
- A scheduled flip/calibration task exists (no permanent lenient default).
