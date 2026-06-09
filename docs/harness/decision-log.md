# Decision / certification log

Scope: the ENGINE PATH (measurementReduce → nextDecision → gate). The live scripted-stage runtime underuses this engine (single-correct advance), so a result here characterizes the adaptive engine, NOT what a child experiences today.

## Loop changes (REAL / GAMING / NO_CHANGE)

| change | params_hash before → after | engine_sha | verdict |
| --- | --- | --- | --- |
| plan-002-flags | `76b15b73` → `76b15b73` | `dev` | **NO_CHANGE** |
| disengaged-fix-U13 (frustrationScaffold) | `06d1a94c` → `06d1a94c` | `dev` | **NO_CHANGE** |

### U13 loop verdict rationale

The `frustrationScaffold=true` flag correctly enables the T03 warm RaiseScaffold path (3b branch in policy.ts), and the oracle correctly flips `disengaged-never-escalates` from present to resolved (verified by the expected-findings probe with `startScaffold: 1`). However the recursive loop reports NO_CHANGE because neither the train family nor the held-out family shows a change in `false_mastery_rate` or `transfer_after_fade` for any seed (1, 2, 3, 5, 7, 11, 13, 17, 42 all tested).

Root cause: the held-out family's idle signals appear exclusively at scaffold=0 (before the first FadeScaffold decision). The `disengagedScaffoldCount` writer only increments on idle signals at scaffold > 0 (the 3b branch requires `RaiseScaffold` to be legal, which requires scaffold > 0). Specifically:

- `fam-held-bimodal:ADD_UNLIKE_COPRIME`: one idle signal at step 0 (scaffold=0), none after the fade at step 7; disengagedScaffoldCount stays 0 at scaffold > 0.
- `fam-held-osc`: 2 idle signals for ADD_UNLIKE_COPRIME, but both at scaffold=0.
- `fam-held-fluency-spoofer`: no idle signals at all (fluencySpoofEmit always returns `signals: []`).

The fluency-spoofer is the sole source of false_mastery_rate in the held-out family (truePknownDefault=0.7 < tau=0.8, 90% correct rate). Neither `frustrationScaffold` nor `fluencyHardMode` can selectively block the spoofer: the spoofer has fast latency (1500-3000ms median) which passes any fluency target that would not also block legitimate slow learners (3000-9000ms). Tightening `fluencyLatencyTargetMs` below 1500ms eliminates ALL mastery gates (transfer_after_fade collapses to 0), which is a guardrail degradation → GAMING not REAL. No feasible flag combination produces a REAL verdict without guardrail degradation on the current family composition.

The NO_CHANGE verdict is honest and expected for this specific finding. The certification deliverable is the finding-oracle flip (behavioral signature confirmed reachable), not a loop REAL verdict (which requires the flag to move the held-out family's aggregate metrics). The loop REAL gate would require a persona whose false mastery is prevented by the frustration-scaffold path — which would need idle signals accumulating at scaffold > 1 on a held-out persona that would otherwise gate with latent < tau.

Note on the other 5 audit defects: only `disengaged-never-escalates` was certified this pass (U13 scope). The remaining 5 are unresolved:
- `fluencyOk-always-true`: AGE_BAND_MS uncalibrated; fluencyHardMode does not help (spoofer is faster than legitimate learners). Needs per-age-band calibration from tablet pilot data.
- `independence-answer-value-proxy`: needs problem_id field on Observation and `isIndependent` re-keyed to it. Flag: unifiedTaxonomy.
- `transfer-denominator-proxy`: needs structural surface_form field and `hasTransferred` re-keyed to it. Flag: unifiedTaxonomy.
- `dead-retention-probe`: needs `retention_probe` event emission from the runtime. Flag: delayedProbe.
- `single-correct-stage-advance`: needs useLessonScaffold rewiring to gate on mastery not single-correct. No flag; requires 002-owned scripted-layer change.

## Plan-002 activation certification (flags-off → flags-on)

| audit defect | persona | flag | present (off) | present (on) | resolved |
| --- | --- | --- | --- | --- | --- |
| fluencyOk-always-true | fast-shallow-guesser | fluencyHardMode | yes | yes | ❌ |
| independence-answer-value-proxy | same-answer-memorizer | unifiedTaxonomy | yes | yes | ❌ |
| transfer-denominator-proxy | denominator-transfer-spoofer | unifiedTaxonomy | yes | yes | ❌ |
| dead-retention-probe | oscillator | delayedProbe | yes | yes | ❌ |
| disengaged-never-escalates | off-task | frustrationScaffold | yes | no | ✓ |
| single-correct-stage-advance | scripted-path | — | yes | yes | ❌ |
