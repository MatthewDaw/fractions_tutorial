---
title: "Calibrate + flip fluencyHardMode (and the answer_value/denominator proxy fallbacks) — close the leniency trap"
status: in-progress
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

---

## Progress (T08 — gap-build-260609, work/T08)

The CAPABILITY is now built, calibrated, and routed; the DEFAULT stays the reversible
rollback (gated-three). Landed:

- **Calibrated the age band.** `PARAMS.fluencyLatencyTargetMs` 15_000 → **8_000ms** (a plausible
  upper bound on an 8–11yo's median fraction-compute latency for the M1 skills), and added
  `PARAMS.fluencyPlausibleFloorMs` = **1_500ms** — a STRICTER lower bound than the too-fast-correct
  `latencyFloorMs` (1_200). Hard-mode `fluencyOk` is now a TWO-SIDED band: an over-target latency
  fails (too slow = not fluent yet) AND an implausibly-fast median fails (too fast = a guess /
  UI-did-it stream, not genuine fluency). This is what actually closes the leniency trap — the old
  ceiling-only check waved a 200ms spoof median straight through even in hard mode.
- **Routed + kept reversible (gated-three).** `PARAMS.fluencyHardMode` stays `false` by default so
  the rollback is a no-op and the verify-first positive control (which pins the soft/default engine)
  stays valid. Flipping the flag to `true` — or passing `{ fluencyHardMode: true }` through the
  harness flag overlay — activates the calibrated hard band engine-wide with no other code change.
- **Emission guard.** `auditEmissionGuard(observations)` (pure, deterministic, in `dimensions.ts`)
  flags any gate-relevant correct that would fall back to the spoofable `answer_value` /
  denominator proxy because it is missing `problem_id` / `surface_form`. The runtime emits both
  today; the guard makes a future regression (a lesson that stops emitting them) loud instead of
  silent.
- **Harness finding resolvable.** `fluencyOk-always-true` now flips present→resolved when run with
  `fluencyHardMode: true` (tape gate no longer opens at the implausible latency AND the raw 200ms
  spoof stat fails), and returns to present under the default-off rollback. (`expectedFindings.js`
  now threads the flag state into its tape run so the gate is computed under the same PARAMS the
  audit reasons about.)

Remaining before this item closes (status → done): flip the DEFAULT to hard mode product-wide
after the observed-sessions trigger below fires, and refresh the verify-first positive control to
pin the gated engine instead of the soft default once that flip lands.

## Age-band latency calibration schedule (the scheduled flip commitment)

Per plan 002 Scope Boundaries ("Age-band fluency calibration … ship lenient, tune with real data …
This deferral carries an explicit flip commitment: a scheduled calibration task with a trigger
condition"):

- **Trigger condition:** the first **N = 30** clean observed tablet sessions per M1 skill
  (ADD_SAME_DEN first), captured with `fluencyHardMode` OFF so the band is measured, not assumed.
- **Calibration method:** set `fluencyLatencyTargetMs` to the **75th percentile** of the observed
  per-skill median correct-latency distribution, and confirm `fluencyPlausibleFloorMs` (currently
  1_500) sits at/above the observed implausible-fast tail (guess/UI-did-it cluster). Both remain
  PARAMS-tunable.
- **Flip:** once calibrated, set `PARAMS.fluencyHardMode = true` as the default in a single reviewed
  change; keep the flag for one-line rollback. Re-run the harness `fluencyOk-always-true`
  expected-finding to confirm present(flag-off)→resolved(flag-on) still holds on the calibrated band.
- **Owner / when:** M1 felt-loop checkpoint (plan 002 "Delivery Sequencing & Observation") — the same
  observed-run gate that releases M2. Until then the lenient default is intentional and reversible,
  not a dormant accident.
