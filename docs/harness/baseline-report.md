# Baseline failure-mode report (synthetic-learner red-team)

Scope: the ENGINE PATH (measurementReduce → nextDecision → gate). The live scripted-stage runtime underuses this engine (single-correct advance), so a result here characterizes the adaptive engine, NOT what a child experiences today.

Sessions: **240**  ·  τ_latent: **0.8**

## T28 Gate-Hardening Before/After (2026-06-09, round-2 certification)

Full library sweep: 216 sessions (24 personas × 9 skills), seed=1, stepCap=40.

| metric | flags-OFF (baseline) | flags-ON (T22–T25+T27) | delta |
| --- | --- | --- | --- |
| false_mastery_rate (τ=0.80) | **0.3796** | **0.3380** | **-0.0416** |
| false_mastery_rate (τ=0.85) | 0.4583 | 0.4583 | 0.0000 |
| false_escalation_rate | 0.0046 | **0.0000** | -0.0046 |
| transfer_after_fade | 0.8844 | 0.8844 | 0.0000 |

Beneficiary: `anxious-low-energy` persona, all 9 skills (9/9 resolved at τ=0.80).
τ=0.85 limitation: `strictGateThreshold=0.985` is moot vs `pKnownClamp` ceiling 0.99; requires pKnownClamp re-tune (see decision-log.md §T28).

## T30 Re-tune Re-Certification (2026-06-09)

Re-tuned: `pKnownClamp[1]` 0.99 → **0.995**, `strictGateThresholdValue` 0.985 → **0.992**, `escalationCompetenceGuard` flipped **DEFAULT-ON**. Same full-library sweep (216 sessions, seed=1, stepCap=40). OFF baseline forces the (now default-on) guard OFF to recover pre-T30 behavior.

| metric | flags-OFF (baseline) | flags-ON (T22–T25+T27, re-tuned) | delta |
| --- | --- | --- | --- |
| false_mastery_rate (τ=0.80) | 0.3796 | **0.3380** | -0.0416 |
| false_mastery_rate (τ=0.85) | 0.4583 | **0.4583** | **0.0000** |
| false_escalation_rate | 0.0046 | **0.0000** | -0.0046 |
| transfer_after_fade | 0.8844 | 0.8844 | 0.0000 |

**Honest verdict: the re-tune did NOT move τ=0.85 (target ≤0.20 NOT MET — still 0.4583).** Diagnostic: ALL 99 τ=0.85 false_mastery tapes gate-open with P_known ≥ 0.992 (observed 0.9933–0.9950). Raising the clamp ceiling and the strict bar in lockstep moved everyone's P_known ceiling up together, so the 0.992 bar (which must sit below the 0.995 ceiling to remain reachable by genuine learners) is still cleared by every majority-correct stream — including low-latent gaming personas (confident-guesser latent 0.595, bimodal 0.500, misconception-stable 0.607). A P_known-threshold lever is structurally incapable of separating false from true mastery because BKT P_known saturates at the clamp for any majority-correct stream regardless of latent truth. τ=0.80 improvement and the counter-direction (false_escalation ↓, guardrail flat, 0 regressions) are unchanged from T28. See decision-log.md §T30 for the next lever.

## Counter-paired population metrics (KTD5)

| headline | value | counter | value |
| --- | --- | --- | --- |
| mastery_rate | 0.6375 | false_mastery_rate | 0.3417 |
| mastery_rate | 0.6375 | evidence_count_at_gate_open | 7 |
| hints_given | 44 | independence_rate | 0.2958 |
| reps_to_mastery | 16.0261 | transfer_after_fade | 0.8844 |

<!-- T17: τ-sensitivity section — keep this block contiguous for mechanical merge -->
## τ-sensitivity — false_mastery_rate and missed_escalation_rate across τ_latent (PDF Req 8)

_τ_latent is a judgement call, not a fact (oracle header). Results must be reported as a curve, never a single point (review A6). A higher τ means a stricter bar for "genuinely knows it": both rates are expected to be non-decreasing as τ rises. Seed: 1 · Sessions: 210._

| τ_latent | false_mastery_rate | missed_escalation_rate |
| --- | --- | --- |
| 0.70 | 0.1286 | 0.0 |
| 0.75 | 0.2571 | 0.0 |
| 0.80 | 0.3429 | 0.0 |
| 0.85 | 0.3857 | 0.0 |
| 0.90 | 0.5571 | 0.0 |

**Interpretation:** `false_mastery_rate` is strictly non-decreasing across all five τ values as expected — a higher threshold flags more gate-open steps as false-positive (the rate rises from 0.1286 at τ=0.70 to 0.5571 at τ=0.90). `missed_escalation_rate` is 0.0 across the full sweep: the STUCK trigger conditions did not hold for any tape in this population (the off-task / disengaged escalation path is structurally unreachable in the headless runner — see limitations memo). The τ=0.80 row matches the single-τ report above, confirming the curve is consistent with the existing baseline. The PDF's warning against single-point estimates is vindicated: the 4× spread in `false_mastery_rate` (0.13→0.56) shows the oracle verdict is τ-sensitive, and τ=0.80 is a defensible centroid, not a special fixed point.
<!-- end T17: τ-sensitivity section -->

## Failure clusters (persona × skill × decision), ranked

| rank | persona | skill | decision | labels | count | severity |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | anxious-low-energy | ADD_SAME_DEN | PresentProblem | falsePositiveMastery | 1 | 4 |
| 2 | anxious-low-energy | ADD_UNLIKE_COPRIME | PresentProblem | falsePositiveMastery | 1 | 4 |
| 3 | anxious-low-energy | ADD_UNLIKE_NESTED | PresentProblem | falsePositiveMastery | 1 | 4 |
| 4 | anxious-low-energy | COMPARE_BENCHMARK | PresentProblem | falsePositiveMastery | 1 | 4 |
| 5 | anxious-low-energy | FRACTION_ON_LINE | PresentProblem | falsePositiveMastery | 1 | 4 |
| 6 | anxious-low-energy | MULT_EQUAL_GROUPS | PresentProblem | falsePositiveMastery | 1 | 4 |
| 7 | anxious-low-energy | MULT_FACTS | PresentProblem | falsePositiveMastery | 1 | 4 |
| 8 | anxious-low-energy | SIMPLIFY | PresentProblem | falsePositiveMastery | 1 | 4 |
| 9 | anxious-low-energy | SUB_SAME_DEN | PresentProblem | falsePositiveMastery | 1 | 4 |
| 10 | bimodal | ADD_SAME_DEN | PresentProblem | falsePositiveMastery | 1 | 4 |
| 11 | bimodal | ADD_UNLIKE_COPRIME | PresentProblem | falsePositiveMastery | 1 | 4 |
| 12 | bimodal | ADD_UNLIKE_NESTED | PresentProblem | falsePositiveMastery | 1 | 4 |
| 13 | bimodal | COMPARE_BENCHMARK | PresentProblem | falsePositiveMastery | 1 | 4 |
| 14 | bimodal | FRACTION_ON_LINE | PresentProblem | falsePositiveMastery | 1 | 4 |
| 15 | bimodal | MULT_EQUAL_GROUPS | PresentProblem | falsePositiveMastery | 1 | 4 |
| 16 | bimodal | MULT_FACTS | PresentProblem | falsePositiveMastery | 1 | 4 |
| 17 | bimodal | SIMPLIFY | PresentProblem | falsePositiveMastery | 1 | 4 |
| 18 | bimodal | SUB_SAME_DEN | PresentProblem | falsePositiveMastery | 1 | 4 |
| 19 | confident-guesser | ADD_SAME_DEN | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 20 | confident-guesser | ADD_UNLIKE_COPRIME | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 21 | confident-guesser | ADD_UNLIKE_NESTED | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 22 | confident-guesser | COMPARE_BENCHMARK | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 23 | confident-guesser | FRACTION_ON_LINE | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 24 | confident-guesser | MULT_EQUAL_GROUPS | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 25 | confident-guesser | MULT_FACTS | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 26 | confident-guesser | SIMPLIFY | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 27 | confident-guesser | SUB_SAME_DEN | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 28 | fam-held-at-scaffold-disengaged | FRACTION_ON_LINE | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 29 | fam-held-fluency-spoofer | ADD_SAME_DEN | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 30 | fam-held-fluency-spoofer | ADD_UNLIKE_COPRIME | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 31 | fam-held-fluency-spoofer | ADD_UNLIKE_NESTED | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 32 | fam-held-fluency-spoofer | COMPARE_BENCHMARK | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 33 | fam-held-fluency-spoofer | FRACTION_ON_LINE | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 34 | fam-held-fluency-spoofer | MULT_EQUAL_GROUPS | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 35 | fam-held-fluency-spoofer | MULT_FACTS | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 36 | fam-held-fluency-spoofer | SIMPLIFY | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 37 | fam-held-fluency-spoofer | SUB_SAME_DEN | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 38 | fam-train-a | ADD_SAME_DEN | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 39 | fam-train-a | ADD_UNLIKE_COPRIME | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 40 | fam-train-a | ADD_UNLIKE_NESTED | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 41 | fam-train-a | COMPARE_BENCHMARK | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 42 | fam-train-a | FRACTION_ON_LINE | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 43 | fam-train-a | MULT_EQUAL_GROUPS | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 44 | fam-train-a | MULT_FACTS | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 45 | fam-train-a | SIMPLIFY | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 46 | fam-train-a | SUB_SAME_DEN | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 47 | fam-train-b | ADD_SAME_DEN | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 48 | fam-train-b | ADD_UNLIKE_COPRIME | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 49 | fam-train-b | ADD_UNLIKE_NESTED | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 50 | fam-train-b | COMPARE_BENCHMARK | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 51 | fam-train-b | FRACTION_ON_LINE | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 52 | fam-train-b | MULT_EQUAL_GROUPS | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 53 | fam-train-b | MULT_FACTS | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 54 | fam-train-b | SIMPLIFY | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 55 | fam-train-b | SUB_SAME_DEN | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 56 | fam-train-c | ADD_SAME_DEN | PresentProblem | falsePositiveMastery | 1 | 4 |
| 57 | fam-train-c | ADD_UNLIKE_COPRIME | PresentProblem | falsePositiveMastery | 1 | 4 |
| 58 | fam-train-c | ADD_UNLIKE_NESTED | PresentProblem | falsePositiveMastery | 1 | 4 |
| 59 | fam-train-c | COMPARE_BENCHMARK | PresentProblem | falsePositiveMastery | 1 | 4 |
| 60 | fam-train-c | FRACTION_ON_LINE | PresentProblem | falsePositiveMastery | 1 | 4 |
| 61 | fam-train-c | MULT_EQUAL_GROUPS | PresentProblem | falsePositiveMastery | 1 | 4 |
| 62 | fam-train-c | MULT_FACTS | PresentProblem | falsePositiveMastery | 1 | 4 |
| 63 | fam-train-c | SIMPLIFY | PresentProblem | falsePositiveMastery | 1 | 4 |
| 64 | fam-train-c | SUB_SAME_DEN | PresentProblem | falsePositiveMastery | 1 | 4 |
| 65 | misconception-stable | ADD_SAME_DEN | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 66 | misconception-stable | ADD_UNLIKE_COPRIME | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 67 | misconception-stable | ADD_UNLIKE_NESTED | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 68 | misconception-stable | COMPARE_BENCHMARK | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 69 | misconception-stable | FRACTION_ON_LINE | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 70 | misconception-stable | MULT_EQUAL_GROUPS | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 71 | misconception-stable | MULT_FACTS | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 72 | misconception-stable | SIMPLIFY | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 73 | misconception-stable | SUB_SAME_DEN | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 74 | performance-oriented | ADD_SAME_DEN | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 75 | performance-oriented | ADD_UNLIKE_COPRIME | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 76 | performance-oriented | ADD_UNLIKE_NESTED | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 77 | performance-oriented | COMPARE_BENCHMARK | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 78 | performance-oriented | FRACTION_ON_LINE | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 79 | performance-oriented | MULT_EQUAL_GROUPS | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 80 | performance-oriented | MULT_FACTS | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 81 | performance-oriented | SIMPLIFY | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 82 | performance-oriented | SUB_SAME_DEN | FadeScaffold | falsePositiveMastery | 1 | 4 |
| 83 | over-hinter | MULT_EQUAL_GROUPS | EscalateToHuman | falseEscalation | 1 | 2 |
