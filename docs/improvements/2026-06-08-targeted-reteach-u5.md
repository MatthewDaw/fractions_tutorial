---
title: "Build the targeted reteach surface (U5): misconception-specific corrective beat, not a binary re-ask"
status: open
priority: P2
category: implementation-gap
source_uid: "002/U5 (R7)"
source_finding: Missing
plan: docs/plans/2026-06-02-002-feat-activate-dormant-pedagogy-plan.md
report: docs/reviews/2026-06-08-plan-vs-reality-compliance.md
date: 2026-06-08
---

## What
Replace the binary "wrong, try again" re-ask with a **misconception-specific reteach beat**
keyed on the most recent `error_signature` (at minimum `add_denominators`), surfaced via the
existing `TutorRibbon`/`HintRail` lesson library, with data-driven copy.

## Why
Plan 002 U5 R7: "A diagnosed misconception (at minimum `add_denominators`) triggers a targeted
reteach response instead of a binary re-ask." The credit→prereq half of the misconception path
(U4) is live — `grade.js` emits engine `ErrorSignature` values and the credit path fires — but
the **learner-facing** corrective the path was designed to feed was never built. A child who
adds denominators today gets a generic re-ask, not the "the denominator names piece *size*,
which doesn't change when you join pieces" correction the plan specifies.

## Evidence
- No reteach surface, copy table, or control flow: grep `reteach` across `web/src/**` hits only
  unrelated comments in `GenPracticeBoard.jsx`/`grade.js`/`gen-practice.css`.
- The plan's named test file is absent: `web/tests/runtime/test_reteach.test.jsx` ✗.
- `web/src/runtime/useLessonScaffold.js:286,303` carry `errorSignature` to the engine but never
  branch it to a learner-facing beat.
- U4 (taxonomy) is BUILT: `web/src/generators/grade.js:55,81,92` emit `add_across_unlike` /
  `add_denominators` / `not_simplified` / `forced_leftover`.

## Suggested approach
Per plan 002 U5:
- On a wrong attempt carrying a diagnosable signature, surface the matching reteach beat
  *before* the next problem (in `policy.ts` and/or `useLessonScaffold.js`, keyed on the latest
  `error_signature`). Reuse `components/lesson/TutorRibbon.jsx` / `HintRail.jsx`.
- Data-driven copy table (like `voiceLines.js`/`momsProblems.js`) so coverage grows without new
  control flow. Author `add_denominators` first (validatable today — it already reaches the
  engine from AppR1/MomsRoom).
- Interaction states (plan-specified): auto-advance after the clip with "Got it" tap-to-skip
  (no hard gate); show once per problem, fall back to generic re-ask on a second same-signature
  error; reteach block carries `data-vox` so TapToRead replays the baked clip.

## Acceptance criteria
- A wrong attempt with `add_denominators` shows the matching reteach beat, not the generic warn.
- A careless slip (`other`/`null`) shows the generic re-ask (no over-trigger).
- A signature with no authored reteach falls back to the generic path (no crash/blank surface).
- `test_reteach.test.jsx` asserts signature-specific content; generic path unchanged for
  unclassified errors.
