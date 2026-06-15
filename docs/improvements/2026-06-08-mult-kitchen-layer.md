---
title: "Mult kitchen transfer layer for m1/m2/m3 (006 O6) — multiply op in momsProblems"
status: open
priority: P3
category: enhancement
source_uid: "006/O6, R-B6"
source_finding: Missing (non-blocking follow-up)
plan: docs/plans/2026-06-01-006-feat-multiplication-foundations-plan.md
report: docs/reviews/2026-06-08-plan-vs-reality-compliance.md
date: 2026-06-08
---

## What
Add `BANK['m1'|'m2'|'m3']` mirror/combine recipes + `CURRICULUM`/`ROOM_SKILL` entries to
`momsProblems.js`, requiring a `multiply` op + slip diagnostics in `gradeAnswer`, so the
multiplication rooms participate in Babushka's Kitchen word-problem transfer layer.

## Why
Plan 006 lists this as an **optional kitchen transfer layer** / O6 follow-up — "defer unless the
kitchen layer is wanted for these rooms." Recorded for completeness; not a blocker.

## Evidence
- `web/src/momsProblems.js` has no `m1/m2/m3` BANK entries; current ops are
  add/sub/simplify/improper/mixed (no `multiply`).

## Suggested approach
Per plan 006 §"Optional kitchen transfer layer": add a `multiply` op + slip diagnostics to
`gradeAnswer`, then the three BANK entries. Sequence **after** the m2 room exists
(`2026-06-08-build-m2-arrays-room.md`).

## Acceptance criteria
- A kitchen recipe using a mult skill grades via the `multiply` op and routes a wall to the
  correct mult room.
- `ROOM_SKILL`/`CURRICULUM` numbering stays in sync with any room renumber (006 O9).
