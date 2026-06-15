---
title: "Stabilize the playability net: 6 flaky failures under parallel load (pass in isolation)"
status: open
priority: P3
category: tech-debt
source_uid: "002/U12, KTD13, R19 (playability net = regression guard)"
source_finding: Broken-at-runtime
plan: docs/plans/2026-06-02-002-feat-activate-dormant-pedagogy-plan.md
report: docs/reviews/2026-06-08-plan-vs-reality-compliance.md
date: 2026-06-08
---

## What
Fix the test-isolation flakiness that makes 6 of 905 tests fail under a default parallel
`vitest run` while passing green in isolation, so the playability net is a trustworthy
regression guard.

## Why
Plan 002 KTD13/R19 make the playability net the safety guarantee for the whole refactor. A net
that flakes under its own default runner cannot certify "no playability regression."

## Evidence
- `npx vitest run` → "Test Files 2 failed | 60 passed (62); Tests 6 failed | 899 passed (905)".
- Failures: `tests/e2e/playability_smoke.test.jsx:222` ("Test timed out in 5000ms") and
  `tests/runtime/test_momsroom_flow.test.jsx:199` (`getByText(/read aloud/i)` → "Multiple
  elements found").
- Both files pass **23/23 in isolation** (`npx vitest run <both files>`), confirming the cause is
  parallel-worker DOM/timeout bleed, not a product defect.
- A benign `mnist-12.onnx` URL-parse stderr appears during AppR1 load (fallback matcher used) —
  worth silencing in the jsdom setup.

## Suggested approach
- Scope queries to a per-test container (`within(container)`) so duplicate "read aloud" matches
  across un-unmounted trees don't collide.
- Ensure each test unmounts/cleans up (Testing Library `cleanup`) between cases; check the shared
  `vitest.setup.js`.
- Raise the timeout for the MomsRoom mount test or mock the slow async (ONNX load) in jsdom.
- Optionally pin these two suites to a single worker (`test.isolate`/`poolOptions`) if DOM bleed
  persists.

## Acceptance criteria
- `npx vitest run` is green (905/905) across three consecutive runs.
- No `mnist-12.onnx` URL-parse error in test stderr (mocked/guarded in jsdom).
