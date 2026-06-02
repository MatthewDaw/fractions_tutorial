# Baseline failure-mode report (synthetic-learner red-team)

Scope: the ENGINE PATH (measurementReduce → nextDecision → gate). The live scripted-stage runtime underuses this engine (single-correct advance), so a result here characterizes the adaptive engine, NOT what a child experiences today.

Sessions: **210**  ·  τ_latent: **0.8**

## Counter-paired population metrics (KTD5)

| headline | value | counter | value |
| --- | --- | --- | --- |
| mastery_rate | 0.6 | false_mastery_rate | 0.3429 |
| mastery_rate | 0.6 | evidence_count_at_gate_open | 7 |
| hints_given | 44 | independence_rate | 0.2571 |
| reps_to_mastery | 16.3095 | transfer_after_fade | 0.863 |

## Failure clusters (persona × skill × decision), ranked

| rank | persona | skill | decision | labels | count | severity |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | anxious-low-energy | ADD_SAME_DEN | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 2 | anxious-low-energy | ADD_UNLIKE_COPRIME | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 3 | anxious-low-energy | ADD_UNLIKE_NESTED | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 4 | anxious-low-energy | COMPARE_BENCHMARK | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 5 | anxious-low-energy | FRACTION_ON_LINE | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 6 | anxious-low-energy | MULT_EQUAL_GROUPS | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 7 | anxious-low-energy | MULT_FACTS | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 8 | anxious-low-energy | SIMPLIFY | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 9 | anxious-low-energy | SUB_SAME_DEN | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 10 | bimodal | ADD_SAME_DEN | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 11 | bimodal | ADD_UNLIKE_COPRIME | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 12 | bimodal | ADD_UNLIKE_NESTED | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 13 | bimodal | COMPARE_BENCHMARK | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 14 | bimodal | FRACTION_ON_LINE | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 15 | bimodal | MULT_EQUAL_GROUPS | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 16 | bimodal | MULT_FACTS | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 17 | bimodal | SIMPLIFY | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 18 | bimodal | SUB_SAME_DEN | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 19 | confident-guesser | ADD_SAME_DEN | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 20 | confident-guesser | ADD_UNLIKE_COPRIME | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 21 | confident-guesser | ADD_UNLIKE_NESTED | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 22 | confident-guesser | COMPARE_BENCHMARK | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 23 | confident-guesser | FRACTION_ON_LINE | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 24 | confident-guesser | MULT_EQUAL_GROUPS | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 25 | confident-guesser | MULT_FACTS | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 26 | confident-guesser | SIMPLIFY | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 27 | confident-guesser | SUB_SAME_DEN | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 28 | fam-held-fluency-spoofer | ADD_SAME_DEN | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 29 | fam-held-fluency-spoofer | ADD_UNLIKE_COPRIME | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 30 | fam-held-fluency-spoofer | ADD_UNLIKE_NESTED | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 31 | fam-held-fluency-spoofer | COMPARE_BENCHMARK | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 32 | fam-held-fluency-spoofer | FRACTION_ON_LINE | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 33 | fam-held-fluency-spoofer | MULT_EQUAL_GROUPS | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 34 | fam-held-fluency-spoofer | MULT_FACTS | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 35 | fam-held-fluency-spoofer | SIMPLIFY | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 36 | fam-held-fluency-spoofer | SUB_SAME_DEN | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 37 | fam-train-a | ADD_SAME_DEN | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 38 | fam-train-a | ADD_UNLIKE_COPRIME | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 39 | fam-train-a | ADD_UNLIKE_NESTED | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 40 | fam-train-a | COMPARE_BENCHMARK | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 41 | fam-train-a | FRACTION_ON_LINE | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 42 | fam-train-a | MULT_EQUAL_GROUPS | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 43 | fam-train-a | MULT_FACTS | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 44 | fam-train-a | SIMPLIFY | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 45 | fam-train-a | SUB_SAME_DEN | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 46 | fam-train-b | ADD_SAME_DEN | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 47 | fam-train-b | ADD_UNLIKE_COPRIME | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 48 | fam-train-b | ADD_UNLIKE_NESTED | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 49 | fam-train-b | COMPARE_BENCHMARK | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 50 | fam-train-b | FRACTION_ON_LINE | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 51 | fam-train-b | MULT_EQUAL_GROUPS | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 52 | fam-train-b | MULT_FACTS | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 53 | fam-train-b | SIMPLIFY | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 54 | fam-train-b | SUB_SAME_DEN | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 55 | fam-train-c | ADD_SAME_DEN | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 56 | fam-train-c | ADD_UNLIKE_COPRIME | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 57 | fam-train-c | ADD_UNLIKE_NESTED | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 58 | fam-train-c | COMPARE_BENCHMARK | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 59 | fam-train-c | FRACTION_ON_LINE | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 60 | fam-train-c | MULT_EQUAL_GROUPS | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 61 | fam-train-c | MULT_FACTS | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 62 | fam-train-c | SIMPLIFY | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 63 | fam-train-c | SUB_SAME_DEN | PresentProblem | falsePositiveMastery+falseTransfer | 1 | 4 |
| 64 | misconception-stable | ADD_SAME_DEN | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 65 | misconception-stable | ADD_UNLIKE_COPRIME | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 66 | misconception-stable | ADD_UNLIKE_NESTED | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 67 | misconception-stable | COMPARE_BENCHMARK | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 68 | misconception-stable | FRACTION_ON_LINE | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 69 | misconception-stable | MULT_EQUAL_GROUPS | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 70 | misconception-stable | MULT_FACTS | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 71 | misconception-stable | SIMPLIFY | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 72 | misconception-stable | SUB_SAME_DEN | FadeScaffold | falsePositiveMastery+falseTransfer | 1 | 4 |
| 73 | over-hinter | MULT_EQUAL_GROUPS | EscalateToHuman | falseEscalation | 1 | 2 |
