# Decision / certification log

Scope: the ENGINE PATH (measurementReduce → nextDecision → gate). The live scripted-stage runtime underuses this engine (single-correct advance), so a result here characterizes the adaptive engine, NOT what a child experiences today.

## Loop changes (REAL / GAMING / NO_CHANGE)

| change | params_hash before → after | engine_sha | verdict |
| --- | --- | --- | --- |
| disengaged-fix-T20 (frustrationScaffold) | `1f77a6a7` → `1f77a6a7` | `dev` | **REAL** |
| plan-002-flags | `1f77a6a7` → `1f77a6a7` | `dev` | **GAMING** |
| T28-gate-hardening-bundle | `1f77a6a7` → `1f77a6a7` | `dev` | **NO_CHANGE** (sealed held-out, τ=0.85) |
| T30-retune (pKnownClamp 0.99→0.995, strictGate 0.985→0.992, guard default-ON) | `1f77a6a7` → re-tuned | `dev` | **NO_CHANGE at τ=0.85** (re-tune inert; guard flip REAL/safe) |

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

## T30 Re-tune Re-Certification (round-2 follow-up, 2026-06-09)

### What changed (web/src/engine/params.ts)
- `pKnownClamp[1]`: 0.99 → **0.995** (BKT posterior ceiling raised).
- `strictGateThresholdValue`: 0.985 → **0.992** (strict gate bar raised above the new ceiling-minus-epsilon).
- `escalationCompetenceGuard` (T27): default **false → true** (FLIPPED DEFAULT-ON; T28 certified it a strict improvement).

These are the exact levers T28's "action items" recommended. The re-tune is reversible/clean; the engine invariants (purity, determinism, TS-strict, advisory-only affect firewall) are preserved (`consecutiveErrors` untouched).

### Re-certification (full library sweep — 216 sessions, seed=1, stepCap=40)

OFF baseline forces the now-default-on guard OFF to recover pre-T30 behavior; ON = all five hardening flags on with the re-tuned params.

| metric | flags-OFF | flags-ON (re-tuned) | delta |
| --- | --- | --- | --- |
| false_mastery_rate (τ=0.80) | 0.3796 | **0.3380** | -0.0416 |
| false_mastery_rate (τ=0.85) | 0.4583 | **0.4583** | **0.0000** |
| false_escalation_rate | 0.0046 | **0.0000** | -0.0046 |
| transfer_after_fade | 0.8844 | 0.8844 | 0.0000 |

### HONEST VERDICT: the re-tune did NOT hit τ=0.85 ≤ 0.20 — it is INERT at τ=0.85 (still 0.4583, byte-identical to T28).

**Root cause (deeper than T28 diagnosed).** Per-tape diagnostic on the ON sweep at τ=0.85: ALL 99 false_mastery tapes gate-open with P_known ≥ 0.992 (observed 0.9933–0.9950). The strict bar is STILL moot — but NOT for the reason T28 gave (that 0.985 < 0.99). Raising the clamp ceiling (0.99→0.995) and the strict bar (0.985→0.992) **in lockstep** moved every persona's P_known ceiling up together. Because the strict bar MUST sit below the clamp ceiling to remain reachable by genuine learners (a bar ≥ ceiling would block everyone, true masters included), and because BKT P_known **saturates at the clamp ceiling for ANY majority-correct stream regardless of latent truth**, every gaming persona's P_known still clears the bar.

The false_mastery tapes at τ=0.85 include personas whose LATENT truth is far below 0.85 yet whose engine P_known pins at 0.995:

| persona | latent at gate | gate-open P_known | fm tapes |
| --- | --- | --- | --- |
| bimodal | 0.500 | 0.9950 | 9 |
| performance-oriented | 0.548 | 0.9950 | 9 |
| confident-guesser | 0.595 | 0.9950 | 9 |
| misconception-stable | 0.607 | 0.9950 | 9 |
| fam-held-fluency-spoofer | 0.700 | 0.9950 | 9 |
| (… 6 more personas, latent 0.74–0.84) | | 0.9933–0.9950 | 9 each |

**Conclusion: a P_known-threshold lever is STRUCTURALLY INCAPABLE of hitting τ=0.85.** No P_known bar below the saturation ceiling can separate a low-latent majority-correct gamer from a genuine master — both pin at the ceiling. The strict-threshold mechanism (T24) is a dead lever for the high-correct gaming class; it can only ever delay the gate by a few steps, never prevent it.

### Counter-direction check (no over-stricting)
- **false_escalation_rate**: 0.0046 → 0.0000 (guard working; the T27 flip is the source of this drop). No rise.
- **transfer_after_fade**: 0.8844 → 0.8844 (guardrail intact).
- **No persona regressions** (runLoop reports 0; OFF baseline numbers are byte-identical to T28, so the clamp re-tune does not regress the default-gate population either — 0.995 and 0.99 both clear the default gateThreshold 0.95).
- **τ=0.80**: unchanged improvement (-0.0416), still the `anxious-low-energy` beneficiary.

### Recommendation: which flags are now safe to flip default-ON

| flag | recommendation | rationale |
| --- | --- | --- |
| `escalationCompetenceGuard` (T27) | **FLIPPED DEFAULT-ON (T30)** | Strict improvement: false_escalation 0.0046 → 0, guardrail flat, 0 regressions. Done in this change. |
| `strictGateThreshold` (T24) | **HOLD default-OFF — DEAD LEVER for τ=0.85** | The 0.992 re-tune is inert at τ=0.85 (proven: 99/99 fm tapes clear it). Keep it OFF; do not ship the false impression that it bounds τ=0.85 false_mastery. It still helps marginally at τ=0.80 inside the bundle. |
| `requireMisconceptionFree` (T22) | HOLD default-OFF | Helps inside the bundle at τ=0.80 but does not reach the τ=0.85 gamers (their recent window is clean at gate-open despite low latent). |
| `requireStableEstimate` (T23) | HOLD default-OFF | Same: the evidence floor + stability check is satisfied by majority-correct gamers before latent crosses τ. |
| `requireTransferProbe` (T25) | HOLD default-OFF | FRACTION_ON_LINE-only; needs probe-item authoring before a production flip. |

### Next lever (the τ=0.85 problem is NOT a threshold problem)
The defect is that **BKT P_known is decoupled from latent competence for majority-correct gaming streams** (high guess/slip personas, misconception-stable). No P_known threshold fixes this. Candidate levers for a round 3:
1. **Lower the clamp ceiling AND keep the strict bar near it is still futile** — gamers saturate wherever the ceiling is. The real fix must be a NON-P_known conjunct.
2. **Tie the gate to a latent-correlated signal the gamers fail**: e.g. require a delayed retention probe (T09 `requireDelayedProbe`, already built) — overnight forgetting separates a memorizer/guesser from a genuine master. This is the documented round-3 candidate (cross-session retention is currently invisible to the run path).
3. **Penalize the BKT posterior on guess/slip evidence** (re-derive P_known with a per-persona-estimated guess rate) so a high-guess stream does NOT saturate at the ceiling — a modeling fix, not a gate-threshold fix.

## Plan-002 activation certification (flags-off → flags-on)

| audit defect | persona | flag | present (off) | present (on) | resolved |
| --- | --- | --- | --- | --- | --- |
| fluencyOk-always-true | fast-shallow-guesser | fluencyHardMode | yes | no | ✅ |
| independence-answer-value-proxy | same-answer-memorizer | unifiedTaxonomy | yes | yes | ❌ |
| transfer-denominator-proxy | denominator-transfer-spoofer | unifiedTaxonomy | yes | yes | ❌ |
| dead-retention-probe | oscillator | delayedProbe | yes | yes | ❌ |
| disengaged-never-escalates | off-task | frustrationScaffold | yes | no | ✅ |
| single-correct-stage-advance | scripted-path | — | yes | yes | ❌ |
