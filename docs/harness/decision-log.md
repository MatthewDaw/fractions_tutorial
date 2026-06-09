# Decision / certification log

Scope: the ENGINE PATH (measurementReduce → nextDecision → gate). The live scripted-stage runtime underuses this engine (single-correct advance), so a result here characterizes the adaptive engine, NOT what a child experiences today.

## Loop changes (REAL / GAMING / NO_CHANGE)

| change | params_hash before → after | engine_sha | verdict |
| --- | --- | --- | --- |
| disengaged-fix-T20 (frustrationScaffold) | `1f77a6a7` → `1f77a6a7` | `dev` | **REAL** |
| plan-002-flags | `1f77a6a7` → `1f77a6a7` | `dev` | **GAMING** |
| T28-gate-hardening-bundle | `1f77a6a7` → `1f77a6a7` | `dev` | **NO_CHANGE** (sealed held-out, τ=0.85) |

## T28 Gate-Hardening Certification (round-2, 2026-06-09)

### Flags exercised
- `requireMisconceptionFree` (T22) — gate requires last 2 attempts misconception-free
- `requireStableEstimate` (T23) — gate requires evidence_count ≥ 10 and last 2 in-band corrects stable
- `strictGateThreshold` (T24) — raises P_known bar from 0.95 → 0.985
- `requireTransferProbe` (T25) — FRACTION_ON_LINE requires ≥1 varied transfer form
- `escalationCompetenceGuard` (T27) — suppresses false-escalation at high P_known

### Population metrics (full library sweep — 216 sessions, seed=1, stepCap=40)

| metric | flags-OFF | flags-ON | delta |
| --- | --- | --- | --- |
| false_mastery_rate (τ=0.80) | 0.3796 | **0.3380** | -0.0416 |
| false_mastery_rate (τ=0.85) | 0.4583 | 0.4583 | 0.0000 |
| false_escalation_rate (τ=0.80) | 0.0046 | **0.0000** | -0.0046 |
| transfer_after_fade (τ=0.80) | 0.8844 | 0.8844 | 0.0000 |

### Sealed held-out family (4 personas × 2 skills, hoSeed=6201836, τ=0.85)

| metric | flags-OFF | flags-ON |
| --- | --- | --- |
| false_mastery_rate | 0.500 | 0.500 |
| transfer_after_fade | 0.750 | 0.750 |
| false_escalation_rate | 0.000 | 0.000 |

### runLoop verdict (seed=1, skills=ADD_SAME_DEN+ADD_UNLIKE_COPRIME, τ=0.85): **NO_CHANGE**

### Honest verdict

**The hardening flags HELP at τ=0.80 but cannot hit the committed τ=0.85 target (≤0.20) without re-tuning.**

Evidence: false_mastery drops from 0.3796 → 0.3380 at τ=0.80 (9 sessions resolved, all `anxious-low-energy` persona). False-escalation also drops to 0 (T27 guard working). Guardrail (transfer_after_fade) intact.

**Root cause of τ=0.85 NO_CHANGE**: `strictGateThreshold=0.985` is rendered moot by `pKnownClamp=[0.01, 0.99]`. The BKT posterior for high-correct-rate personas (fluency-spoofer: 90% correct; confident-guesser: similarly high) reaches the 0.99 clamp ceiling in < 10 steps, which already exceeds the 0.985 bar. The flags delay the gate by 3–6 steps but do not prevent gate-open within the 40-step session.

**Root cause of held-out NO_CHANGE**: the sealed held-out family (4 personas) lacks a profile analogous to `anxious-low-energy` (slow-climbing BKT learner whose latent eventually crosses τ). The held-out fluency-spoofer and scaffold-disengaged personas both have latent pinned at 0.7–0.71 < τ=0.85 regardless of session length.

### Counter-direction analysis (over-stricting check)

- **false_escalation_rate**: DROPPED (0.0046 → 0.000) — T27 guard correctly prevents false-escalation of near-mastery learners. No over-stricting.
- **transfer_after_fade**: UNCHANGED (0.8844 → 0.8844) — guardrail intact, no novel-form transfer degradation.
- **No persona regressions**: runLoop reports 0 regressions.

### Recommendation: which flags are safe to flip default-ON

| flag | recommendation | rationale |
| --- | --- | --- |
| `requireMisconceptionFree` (T22) | **HOLD** (default-OFF) | Helps narrow class of learners; can over-block if misconception windows are too strict. Needs per-skill tuning. |
| `requireStableEstimate` (T23) | **HOLD** (default-OFF) | Evidence floor=10 adds ~3-5 step delay for most personas but doesn't prevent false mastery; needs re-calibration. |
| `strictGateThreshold` (T24) | **HOLD** — re-tune needed | 0.985 is moot vs pKnownClamp=0.99. **Recommended fix**: either lower pKnownClamp upper bound from 0.99 → 0.97, OR raise strictGateThresholdValue to meet pKnownClamp (unreachable). Better approach: raise pKnownClamp to 0.995 and set strictGateThresholdValue=0.99. |
| `requireTransferProbe` (T25) | **HOLD** (default-OFF) | Only applies to FRACTION_ON_LINE; needs probe-item authoring before production flip. |
| `escalationCompetenceGuard` (T27) | **SAFE TO FLIP DEFAULT-ON** | Strictly reduces false-escalation (0.0046 → 0), no counter-direction harm detected. |

### Action items for next round
1. **T24 re-tune**: the strictGateThreshold mechanism is correct but the threshold value is unreachable given the current pKnownClamp. Fix: raise `pKnownClamp[1]` from 0.99 → 0.995 AND set `strictGateThresholdValue=0.992`, then re-run T28 certification.
2. **Flip escalationCompetenceGuard default-ON** (safe, confirmed by T28).
3. **T28 re-run after pKnownClamp re-tune** to validate the τ=0.85 target (≤0.20 false_mastery).

## Plan-002 activation certification (flags-off → flags-on)

| audit defect | persona | flag | present (off) | present (on) | resolved |
| --- | --- | --- | --- | --- | --- |
| fluencyOk-always-true | fast-shallow-guesser | fluencyHardMode | yes | no | ✅ |
| independence-answer-value-proxy | same-answer-memorizer | unifiedTaxonomy | yes | yes | ❌ |
| transfer-denominator-proxy | denominator-transfer-spoofer | unifiedTaxonomy | yes | yes | ❌ |
| dead-retention-probe | oscillator | delayedProbe | yes | yes | ❌ |
| disengaged-never-escalates | off-task | frustrationScaffold | yes | no | ✅ |
| single-correct-stage-advance | scripted-path | — | yes | yes | ❌ |
