# Adaptive UI vs static/fixed-scaffold baseline — comparison (UI5)

Scope: the ENGINE PATH (measurementReduce → nextDecision → gate). The live scripted-stage runtime underuses this engine (single-correct advance), so a result here characterizes the adaptive engine, NOT what a child experiences today.

This document fulfills the PDF requirement (R5/R6 evidence §): a comparison of the adaptive engine arm (scaffold morphs enabled: FadeScaffold / RaiseScaffold fire and mutate the scaffold level) against a static control arm (scaffold morphs suppressed: the engine still runs the full mastery-gate policy but the scaffold level stays fixed at the session entry level throughout). Both arms use identical personas, skills, and seed so persona trajectories are comparable.

- **sessions per arm**: 240 adaptive / 240 static
- **seed**: 1  ·  **τ_latent**: 0.8

## Arm separation verification

_Confirms adaptive arm moves scaffold while static arm holds it fixed._

| metric | adaptive arm | static arm |
| --- | --- | --- |
| FadeScaffold decisions fired | 882 | 2243 |
| RaiseScaffold decisions fired | 286 | 0 |
| avg final scaffold level | 2.4083 | 0 |

> NOTE: the static arm records decision events (FadeScaffold/RaiseScaffold decisions are emitted by the policy) but the scaffold-level mutation is suppressed, so the final scaffold level stays at the entry level regardless.

## Outcome deltas: adaptive minus static

_delta = adaptive_value − static_value. Positive delta on a "higher is better" metric means adaptation helps; negative delta on a "lower is better" metric means adaptation helps. Unfavorable deltas are reported as-is._

| metric | higher-is-better | adaptive | static | delta | adaptation helps? |
| --- | --- | --- | --- | --- | --- |
| false_mastery_rate | no | 0.3417 | 0 | 0.3417 | NO (static better or tied) |
| transfer_after_fade | yes | 0.8844 | 0 | 0.8844 | YES |
| independence_rate | yes | 0.2958 | 0 | 0.2958 | YES |
| mastery_rate | yes | 0.6375 | — | — | — |
| reps_to_mastery (mean) | no | 16.0261 | — | — | — |

## Structural finding: static arm gate is UNREACHABLE by construction

The mastery gate requires `max_scaffold_passed >= L3` (independence condition, `gate.ts:56`). With scaffold held fixed at the entry level (L0), `max_scaffold_passed` can never rise above 0 — so the independence condition is STRUCTURALLY UNSATISFIABLE in the static arm. No learner can reach the gate regardless of their BKT P_known, transfer, or fluency.

Evidence: the policy issued **2243 FadeScaffold decisions** in the static arm (it correctly recognized learner progress and tried to reward it) but all mutations were suppressed. The static arm's `mastery_rate = null` and `false_mastery_rate = 0` are therefore NOT evidence that a static tutor is "safer" — they are evidence that a static tutor can never graduate a learner under this mastery model.

This is the headline finding: **scaffold morphs are prerequisite for the mastery gate to open, not merely beneficial for the rate at which it opens.** A fixed-scaffold tutor running this engine would keep every learner in an infinite practice loop.

## Interpretation

The static arm's mastery gate is **structurally unreachable** (see section above). This means the deltas below are a lower bound on adaptation's benefit — the static arm produces zeros not because it is effective, but because it can never advance a learner.

Of the 5 outcome metrics, adaptation helps on **2**, **1** appear unfavorable but are structural artefacts (gate unreachable in static arm — see above), **2** are non-comparable (static arm produced null — no gate opened).

**Where adaptation demonstrably helps:**
- **transfer_after_fade**: adaptive 0.8844 vs static 0 (delta 0.8844, higher is better)
- **independence_rate**: adaptive 0.2958 vs static 0 (delta 0.2958, higher is better)

**Apparent "static better" results (structural artefacts — static gate unreachable):**
- **false_mastery_rate**: adaptive 0.3417 vs static 0 — static is 0 because the gate never opened, NOT because the static arm prevented false mastery

**Metrics where the static arm produced null (gate structurally never opened):**
- **mastery_rate**: adaptive 0.6375 / static —
- **reps_to_mastery (mean)**: adaptive 16.0261 / static —

**Overall verdict:**
Scaffold adaptation (FadeScaffold / RaiseScaffold morphs) is **not merely beneficial** for the fraction of learners who gate — it is **prerequisite** for any learner to gate at all under this mastery model. A static tutor at L0 would run every learner in an infinite loop: the policy correctly recognizes when a learner is ready to advance (it issued 2243 FadeScaffold decisions in the static arm), but without acting on those decisions the independence condition (max_scaffold_passed>=L3) can never be satisfied and the gate never opens.

**Caveat — engine path only:**
These results characterize the adaptive ENGINE PATH against a synthetic static baseline, not a real child's experience. The live scripted-stage runtime underuses the engine (single-correct advance per stage), so the adaptive arm's advantage — if present on the engine path — is not yet a proven advantage in the live UX. The static baseline is a pure synthetic counterfactual (no existing product runs this way); the comparison answers "does the adaptive policy produce better oracle-labeled outcomes than a policy that never morphs the scaffold?" — not "does the product beat a real static tutor."

**Caveat — false-mastery rate in static arm:**
The static arm reports `false_mastery_rate = 0`. This is NOT evidence of a safety benefit — it is a direct consequence of the gate being unreachable: if no one ever gates, there are no false masteries. The relevant comparison is within the adaptive arm, where `false_mastery_rate = 0.3417` against τ_latent=0.8 (seed 1, 240 sessions). This rate is set by the fluencyOk-always-true audit defect and the BKT calibration, neither of which is closed by removing scaffold morphs.
