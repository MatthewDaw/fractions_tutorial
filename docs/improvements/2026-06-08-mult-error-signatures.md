---
title: "Extend ErrorSignature union with multiplication misconceptions (required fast-follow O1)"
status: open
priority: P2
category: implementation-gap
source_uid: "006/O1, R-B5"
source_finding: Missing
plan: docs/plans/2026-06-01-006-feat-multiplication-foundations-plan.md
report: docs/reviews/2026-06-08-plan-vs-reality-compliance.md
date: 2026-06-08
---

## What
Extend the engine `ErrorSignature` union with the four multiplication misconceptions
(`add_factors`, `skip_count_drift`, `array_perimeter`, `distributive_add_parts`) and add the
matching fingerprinting in the grading/observation path, so the mult strand gets error-specific
remediation instead of collapsing every mistake to `other`.

## Why
Plan 006 R-B5 ships v1 with all mult misconceptions mapped to `'other'`, but explicitly
declares the union extension a **"required near-term fast-follow, not optional"** (O1): "until
`types.ts` + `observation.ts` gain `add_factors` / `skip_count_drift` / `array_perimeter` /
`distributive_add_parts`, the mult strand has **no error-specific remediation**." That follow-up
never landed.

## Evidence
- grep `add_factors|skip_count_drift|array_perimeter|distributive_add_parts` in `engine/` and
  `generators/` → zero hits.
- `web/src/engine/types.ts:47` — `ErrorSignature` union is still fraction-only +
  `other`/`null` (per census line 467: `add_denominators | add_across_unlike | scaled_bottom_only
  | forced_leftover | not_simplified | other | null`).

## Suggested approach
Per plan 006 O1 + the `types.ts` fast-follow checklist item:
1. Add the four members to the `ErrorSignature` union in `web/src/engine/types.ts`.
2. Add operand-aware fingerprinting in `web/src/engine/observation.ts` (and/or
   `generators/grade.js`'s mult path once m2/m3 attempts emit) — e.g. `a+b` instead of `a×b` →
   `add_factors`; a skip-count that drifts off the multiple → `skip_count_drift`; rows+cols
   (perimeter) instead of rows×cols → `array_perimeter`; summing split sizes instead of partial
   products → `distributive_add_parts`.
3. Route the new signatures into the existing credit + (once built) reteach paths.

Best sequenced **after** `2026-06-08-build-m2-arrays-room.md` so m2/m3 attempts actually emit
these errors, and dovetails with `2026-06-08-targeted-reteach-u5.md` (richer signatures → more
targeted reteach).

## Acceptance criteria
- The four mult misconceptions are members of `ErrorSignature` (build-time exhaustiveness holds).
- A wrong m1/m2/m3 attempt of each kind fingerprints to its specific signature (not `other`).
- credit/reteach paths receive the specific signature for mult skills.
