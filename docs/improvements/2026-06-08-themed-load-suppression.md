---
title: "Verify/complete decorative-narration suppression during the active solve (002 U10 R14)"
status: open
priority: P3
category: implementation-gap
source_uid: "002/U10 (R13, R14)"
source_finding: Partial
plan: docs/plans/2026-06-02-002-feat-activate-dormant-pedagogy-plan.md
report: docs/reviews/2026-06-08-plan-vs-reality-compliance.md
date: 2026-06-08
---

## What
Confirm (and complete where missing) the runtime half of plan 002 U10: decorative
narration/animation must not auto-play during an active manipulation/answer window where the
isomorphism rubric flagged it. The rubric doc exists; the call-site suppression wiring needs
verification.

## Why
Plan 002 U10 R14: "Where the audit flags it, decorative narration/animation does not play
during the active math operation." R13's rubric artifact landed
(`docs/design/themed-load-isomorphism-rubric.md` present), but the `suppressDecorativeNarration`
context flag + the call-site tagging (`say(key,{decorative:true})` suppressed vs
`say(key,{source:'tap'})` always plays) were not verified in this pass.

## Evidence
- Rubric doc present: `docs/design/themed-load-isomorphism-rubric.md`.
- Not yet verified: a `suppressDecorativeNarration` flag in `web/src/voice.js` / `TapToRead.jsx`
  and the active-operation window that sets it; no `test_decorative_suppression.test.jsx`
  confirmed in this assessment (the plan names it).

## Suggested approach
Per plan 002 U10: implement suppression at the **call site, not the audio source** — a context
flag set by the active-operation window, checked only for `say(key,{decorative:true})`; structural
math-carrying narration and learner-initiated tap-to-read always play; respect user settings.

## Acceptance criteria
- During an active answer/manipulation window, decorative narration does not auto-play where the
  rubric flagged it; structural + tap-to-read narration still play.
- Suppression respects user settings (accessibility never broken).
- `test_decorative_suppression.test.jsx` asserts the gating.
