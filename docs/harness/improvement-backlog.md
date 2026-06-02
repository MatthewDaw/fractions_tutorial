# Improvement backlog (synthetic-learner red-team)

Ranked findings: **24**  ·  human-audit agreement: **25%**

## Dead / bypassed pedagogy (audit-corroborated)

### dead-pedagogy:dead-retention-probe ✓audit
- **severity**: 100
- **skill**: ADD_SAME_DEN
- **personas**: oscillator
- **proposed lever**: emit retention_probe: set last_retention_probe so the time-based demotion path can fire
- **evidence**: 1 ref(s) — audit dead-retention-probe

### dead-pedagogy:disengaged-never-escalates ✓audit
- **severity**: 100
- **skill**: ADD_SAME_DEN
- **personas**: off-task
- **proposed lever**: wire disengagedCount: increment it from recentBehavior so the disengaged escalation trigger is reachable
- **evidence**: 1 ref(s) — audit disengaged-never-escalates

### dead-pedagogy:fluencyOk-always-true ✓audit
- **severity**: 100
- **skill**: ADD_SAME_DEN
- **personas**: fast-shallow-guesser
- **proposed lever**: certify-002-flag: calibrate AGE_BAND_MS + route fluencyHardMode through PARAMS
- **evidence**: 1 ref(s) — audit fluencyOk-always-true

### dead-pedagogy:independence-answer-value-proxy ✓audit
- **severity**: 100
- **skill**: ADD_SAME_DEN
- **personas**: same-answer-memorizer
- **proposed lever**: fix distinctness proxy: key isIndependent on problem_id, not answer_value
- **evidence**: 1 ref(s) — audit independence-answer-value-proxy

### dead-pedagogy:single-correct-stage-advance ✓audit
- **severity**: 100
- **skill**: ADD_SAME_DEN
- **personas**: scripted-path
- **proposed lever**: certify-002-flag: rewire useLessonScaffold to advance on the mastery gate, not one correct
- **evidence**: 1 ref(s) — audit single-correct-stage-advance

### dead-pedagogy:transfer-denominator-proxy ✓audit
- **severity**: 100
- **skill**: ADD_SAME_DEN
- **personas**: denominator-transfer-spoofer
- **proposed lever**: fix denominator proxy: key hasTransferred on structural surface_form, not the denominator
- **evidence**: 1 ref(s) — audit transfer-denominator-proxy

## Tier-2 nudge gaps

### nudge-gap:ADD_UNLIKE_COPRIME
- **severity**: 50
- **skill**: ADD_UNLIKE_COPRIME
- **personas**: anxious-low-energy, bimodal, confident-guesser, fam-held-bimodal, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, misconception-stable, off-task, oscillator, over-hinter, short-attention, slow-but-steady
- **proposed lever**: wire disengagedCount / emit nudge: feed recentBehavior so Tier-2 (IDLE+OSCILLATION+TOO_FAST_CORRECT) fires for ADD_UNLIKE_COPRIME — no recorded nudge.
- **evidence**: 5 ref(s) — tape run-1:fast-mastery:ADD_UNLIKE_COPRIME; tape run-1:fast-mastery:ADD_UNLIKE_COPRIME; tape run-1:slow-but-steady:ADD_UNLIKE_COPRIME; tape run-1:slow-but-steady:ADD_UNLIKE_COPRIME; tape run-1:slow-but-steady:ADD_UNLIKE_COPRIME

### nudge-gap:ADD_UNLIKE_NESTED
- **severity**: 50
- **skill**: ADD_UNLIKE_NESTED
- **personas**: anxious-low-energy, bimodal, confident-guesser, fam-held-bimodal, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, misconception-stable, off-task, oscillator, over-hinter, short-attention, slow-but-steady
- **proposed lever**: wire disengagedCount / emit nudge: feed recentBehavior so Tier-2 (IDLE+OSCILLATION+TOO_FAST_CORRECT) fires for ADD_UNLIKE_NESTED — no recorded nudge.
- **evidence**: 5 ref(s) — tape run-1:fast-mastery:ADD_UNLIKE_NESTED; tape run-1:fast-mastery:ADD_UNLIKE_NESTED; tape run-1:slow-but-steady:ADD_UNLIKE_NESTED; tape run-1:slow-but-steady:ADD_UNLIKE_NESTED; tape run-1:slow-but-steady:ADD_UNLIKE_NESTED

### nudge-gap:COMPARE_BENCHMARK
- **severity**: 50
- **skill**: COMPARE_BENCHMARK
- **personas**: anxious-low-energy, bimodal, confident-guesser, fam-held-bimodal, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, misconception-stable, off-task, oscillator, over-hinter, short-attention, slow-but-steady
- **proposed lever**: wire disengagedCount / emit nudge: feed recentBehavior so Tier-2 (IDLE+OSCILLATION+TOO_FAST_CORRECT) fires for COMPARE_BENCHMARK — no recorded nudge.
- **evidence**: 5 ref(s) — tape run-1:fast-mastery:COMPARE_BENCHMARK; tape run-1:fast-mastery:COMPARE_BENCHMARK; tape run-1:slow-but-steady:COMPARE_BENCHMARK; tape run-1:slow-but-steady:COMPARE_BENCHMARK; tape run-1:slow-but-steady:COMPARE_BENCHMARK

### nudge-gap:FRACTION_ON_LINE
- **severity**: 50
- **skill**: FRACTION_ON_LINE
- **personas**: anxious-low-energy, bimodal, confident-guesser, fam-held-bimodal, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, misconception-stable, off-task, oscillator, over-hinter, short-attention, slow-but-steady
- **proposed lever**: wire disengagedCount / emit nudge: feed recentBehavior so Tier-2 (IDLE+OSCILLATION+TOO_FAST_CORRECT) fires for FRACTION_ON_LINE — no recorded nudge.
- **evidence**: 5 ref(s) — tape run-1:fast-mastery:FRACTION_ON_LINE; tape run-1:fast-mastery:FRACTION_ON_LINE; tape run-1:slow-but-steady:FRACTION_ON_LINE; tape run-1:slow-but-steady:FRACTION_ON_LINE; tape run-1:slow-but-steady:FRACTION_ON_LINE

### nudge-gap:IMPROPER_TO_MIXED
- **severity**: 50
- **skill**: IMPROPER_TO_MIXED
- **personas**: anxious-low-energy, confident-guesser, fam-held-bimodal, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, misconception-stable, off-task, oscillator, over-hinter, short-attention, slow-but-steady
- **proposed lever**: wire disengagedCount / emit nudge: feed recentBehavior so Tier-2 (IDLE+OSCILLATION+TOO_FAST_CORRECT) fires for IMPROPER_TO_MIXED — no recorded nudge.
- **evidence**: 5 ref(s) — tape run-1:fast-mastery:IMPROPER_TO_MIXED; tape run-1:fast-mastery:IMPROPER_TO_MIXED; tape run-1:slow-but-steady:IMPROPER_TO_MIXED; tape run-1:slow-but-steady:IMPROPER_TO_MIXED; tape run-1:slow-but-steady:IMPROPER_TO_MIXED

### nudge-gap:MULT_EQUAL_GROUPS
- **severity**: 50
- **skill**: MULT_EQUAL_GROUPS
- **personas**: anxious-low-energy, bimodal, confident-guesser, fam-held-bimodal, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, misconception-stable, off-task, oscillator, over-hinter, short-attention, slow-but-steady
- **proposed lever**: wire disengagedCount / emit nudge: feed recentBehavior so Tier-2 (IDLE+OSCILLATION+TOO_FAST_CORRECT) fires for MULT_EQUAL_GROUPS — no recorded nudge.
- **evidence**: 5 ref(s) — tape run-1:fast-mastery:MULT_EQUAL_GROUPS; tape run-1:fast-mastery:MULT_EQUAL_GROUPS; tape run-1:slow-but-steady:MULT_EQUAL_GROUPS; tape run-1:slow-but-steady:MULT_EQUAL_GROUPS; tape run-1:slow-but-steady:MULT_EQUAL_GROUPS

### nudge-gap:MULT_FACTS
- **severity**: 50
- **skill**: MULT_FACTS
- **personas**: anxious-low-energy, bimodal, confident-guesser, fam-held-bimodal, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, misconception-stable, off-task, oscillator, over-hinter, short-attention, slow-but-steady
- **proposed lever**: wire disengagedCount / emit nudge: feed recentBehavior so Tier-2 (IDLE+OSCILLATION+TOO_FAST_CORRECT) fires for MULT_FACTS — no recorded nudge.
- **evidence**: 5 ref(s) — tape run-1:fast-mastery:MULT_FACTS; tape run-1:fast-mastery:MULT_FACTS; tape run-1:slow-but-steady:MULT_FACTS; tape run-1:slow-but-steady:MULT_FACTS; tape run-1:slow-but-steady:MULT_FACTS

### nudge-gap:SIMPLIFY
- **severity**: 50
- **skill**: SIMPLIFY
- **personas**: anxious-low-energy, bimodal, confident-guesser, fam-held-bimodal, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, misconception-stable, off-task, oscillator, over-hinter, short-attention, slow-but-steady
- **proposed lever**: wire disengagedCount / emit nudge: feed recentBehavior so Tier-2 (IDLE+OSCILLATION+TOO_FAST_CORRECT) fires for SIMPLIFY — no recorded nudge.
- **evidence**: 5 ref(s) — tape run-1:fast-mastery:SIMPLIFY; tape run-1:fast-mastery:SIMPLIFY; tape run-1:slow-but-steady:SIMPLIFY; tape run-1:slow-but-steady:SIMPLIFY; tape run-1:slow-but-steady:SIMPLIFY

### nudge-gap:SUB_SAME_DEN
- **severity**: 50
- **skill**: SUB_SAME_DEN
- **personas**: anxious-low-energy, bimodal, confident-guesser, fam-held-bimodal, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, misconception-stable, off-task, over-hinter, short-attention, slow-but-steady
- **proposed lever**: wire disengagedCount / emit nudge: feed recentBehavior so Tier-2 (IDLE+OSCILLATION+TOO_FAST_CORRECT) fires for SUB_SAME_DEN — no recorded nudge.
- **evidence**: 5 ref(s) — tape run-1:fast-mastery:SUB_SAME_DEN; tape run-1:fast-mastery:SUB_SAME_DEN; tape run-1:slow-but-steady:SUB_SAME_DEN; tape run-1:slow-but-steady:SUB_SAME_DEN; tape run-1:slow-but-steady:SUB_SAME_DEN

## Pedagogically-hard skills

### pedagogically-hard:ADD_UNLIKE_COPRIME
- **severity**: 32.348214285714285
- **skill**: ADD_UNLIKE_COPRIME
- **personas**: anxious-low-energy, bimodal, confident-guesser, denominator-transfer-spoofer, fam-held-bimodal, fam-held-fluency-spoofer, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, memorizer, misconception-stable, off-task, oscillator, over-hinter, same-answer-memorizer, short-attention, slow-but-steady
- **proposed lever**: harden ADD_UNLIKE_COPRIME: composite risk 1.235 (false-mastery 0.38, false-transfer 0.38) — add transfer probes / tighten the gate evidence for this skill.
- **evidence**: 1 ref(s) — verdict risk=1.235

### pedagogically-hard:ADD_UNLIKE_NESTED
- **severity**: 32.348214285714285
- **skill**: ADD_UNLIKE_NESTED
- **personas**: anxious-low-energy, bimodal, confident-guesser, denominator-transfer-spoofer, fam-held-bimodal, fam-held-fluency-spoofer, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, memorizer, misconception-stable, off-task, oscillator, over-hinter, same-answer-memorizer, short-attention, slow-but-steady
- **proposed lever**: harden ADD_UNLIKE_NESTED: composite risk 1.235 (false-mastery 0.38, false-transfer 0.38) — add transfer probes / tighten the gate evidence for this skill.
- **evidence**: 1 ref(s) — verdict risk=1.235

### pedagogically-hard:COMPARE_BENCHMARK
- **severity**: 32.348214285714285
- **skill**: COMPARE_BENCHMARK
- **personas**: anxious-low-energy, bimodal, confident-guesser, denominator-transfer-spoofer, fam-held-bimodal, fam-held-fluency-spoofer, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, memorizer, misconception-stable, off-task, oscillator, over-hinter, same-answer-memorizer, short-attention, slow-but-steady
- **proposed lever**: harden COMPARE_BENCHMARK: composite risk 1.235 (false-mastery 0.38, false-transfer 0.38) — add transfer probes / tighten the gate evidence for this skill.
- **evidence**: 1 ref(s) — verdict risk=1.235

### pedagogically-hard:MULT_EQUAL_GROUPS
- **severity**: 32.348214285714285
- **skill**: MULT_EQUAL_GROUPS
- **personas**: anxious-low-energy, bimodal, confident-guesser, denominator-transfer-spoofer, fam-held-bimodal, fam-held-fluency-spoofer, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, memorizer, misconception-stable, off-task, oscillator, over-hinter, same-answer-memorizer, short-attention, slow-but-steady
- **proposed lever**: harden MULT_EQUAL_GROUPS: composite risk 1.235 (false-mastery 0.38, false-transfer 0.38) — add transfer probes / tighten the gate evidence for this skill.
- **evidence**: 1 ref(s) — verdict risk=1.235

### pedagogically-hard:MULT_FACTS
- **severity**: 32.348214285714285
- **skill**: MULT_FACTS
- **personas**: anxious-low-energy, bimodal, confident-guesser, denominator-transfer-spoofer, fam-held-bimodal, fam-held-fluency-spoofer, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, memorizer, misconception-stable, off-task, oscillator, over-hinter, same-answer-memorizer, short-attention, slow-but-steady
- **proposed lever**: harden MULT_FACTS: composite risk 1.235 (false-mastery 0.38, false-transfer 0.38) — add transfer probes / tighten the gate evidence for this skill.
- **evidence**: 1 ref(s) — verdict risk=1.235

### pedagogically-hard:SIMPLIFY
- **severity**: 32.348214285714285
- **skill**: SIMPLIFY
- **personas**: anxious-low-energy, bimodal, confident-guesser, denominator-transfer-spoofer, fam-held-bimodal, fam-held-fluency-spoofer, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, memorizer, misconception-stable, off-task, oscillator, over-hinter, same-answer-memorizer, short-attention, slow-but-steady
- **proposed lever**: harden SIMPLIFY: composite risk 1.235 (false-mastery 0.38, false-transfer 0.38) — add transfer probes / tighten the gate evidence for this skill.
- **evidence**: 1 ref(s) — verdict risk=1.235

### pedagogically-hard:SUB_SAME_DEN
- **severity**: 32.348214285714285
- **skill**: SUB_SAME_DEN
- **personas**: anxious-low-energy, bimodal, confident-guesser, denominator-transfer-spoofer, fam-held-bimodal, fam-held-fluency-spoofer, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, memorizer, misconception-stable, off-task, oscillator, over-hinter, same-answer-memorizer, short-attention, slow-but-steady
- **proposed lever**: harden SUB_SAME_DEN: composite risk 1.235 (false-mastery 0.38, false-transfer 0.38) — add transfer probes / tighten the gate evidence for this skill.
- **evidence**: 1 ref(s) — verdict risk=1.235

### pedagogically-hard:FRACTION_ON_LINE
- **severity**: 32.19642857142857
- **skill**: FRACTION_ON_LINE
- **personas**: anxious-low-energy, bimodal, confident-guesser, denominator-transfer-spoofer, fam-held-bimodal, fam-held-fluency-spoofer, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, memorizer, misconception-stable, off-task, oscillator, over-hinter, same-answer-memorizer, short-attention, slow-but-steady
- **proposed lever**: harden FRACTION_ON_LINE: composite risk 1.220 (false-mastery 0.38, false-transfer 0.38) — add transfer probes / tighten the gate evidence for this skill.
- **evidence**: 1 ref(s) — verdict risk=1.220

### pedagogically-hard:IMPROPER_TO_MIXED
- **severity**: 22.5
- **skill**: IMPROPER_TO_MIXED
- **personas**: anxious-low-energy, bimodal, confident-guesser, denominator-transfer-spoofer, fam-held-bimodal, fam-held-fluency-spoofer, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, memorizer, misconception-stable, off-task, oscillator, over-hinter, same-answer-memorizer, short-attention, slow-but-steady
- **proposed lever**: harden IMPROPER_TO_MIXED: composite risk 0.250 (false-mastery 0.00, false-transfer 0.00) — add transfer probes / tighten the gate evidence for this skill.
- **evidence**: 1 ref(s) — verdict risk=0.250
