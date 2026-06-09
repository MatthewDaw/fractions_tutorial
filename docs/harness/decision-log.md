# Decision / certification log

Scope: the ENGINE PATH (measurementReduce → nextDecision → gate). The live scripted-stage runtime underuses this engine (single-correct advance), so a result here characterizes the adaptive engine, NOT what a child experiences today.

## Loop changes (REAL / GAMING / NO_CHANGE)

| change | params_hash before → after | engine_sha | verdict |
| --- | --- | --- | --- |
| disengaged-fix-T20 (frustrationScaffold) | `1f77a6a7` → `1f77a6a7` | `dev` | **REAL** |
| plan-002-flags | `1f77a6a7` → `1f77a6a7` | `dev` | **GAMING** |

## Plan-002 activation certification (flags-off → flags-on)

| audit defect | persona | flag | present (off) | present (on) | resolved |
| --- | --- | --- | --- | --- | --- |
| fluencyOk-always-true | fast-shallow-guesser | fluencyHardMode | yes | no | ✅ |
| independence-answer-value-proxy | same-answer-memorizer | unifiedTaxonomy | yes | yes | ❌ |
| transfer-denominator-proxy | denominator-transfer-spoofer | unifiedTaxonomy | yes | yes | ❌ |
| dead-retention-probe | oscillator | delayedProbe | yes | yes | ❌ |
| disengaged-never-escalates | off-task | frustrationScaffold | yes | no | ✅ |
| single-correct-stage-advance | scripted-path | — | yes | yes | ❌ |
