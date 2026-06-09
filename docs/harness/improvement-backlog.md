# Improvement backlog (synthetic-learner red-team)

## T18 — Joint counter-metrics (RESOLVED)

**Status:** DONE — `transfer_per_mastery_gain` and `hint_independence_divergence` added to
`computeMetrics` in `web/src/harness/metrics.js`. Both are present on every `MetricsRecord`
(population and per-persona-class) and survive `toJSON()` serialization. Surfaced in the
baseline-report markdown table under a new "Joint counter-metrics" section in `report.js`.

`transfer_per_mastery_gain = false_transfer_rate / max(false_mastery_rate, 1e-6)` — detects
"score/mastery up but transfer flat": high when the engine credits transfer (via gate open with
no surface variation — T13 independent signal) far above the mastery-error rate. A value >> 1
flags performance-oriented gaming where the learner locks onto one surface form and the engine
gates without structural breadth.

`hint_independence_divergence = hints_given * (1 - independence_rate)` — detects "hints up,
independence down": zero when hints are rare or independence is high; large when heavy hint use
(top-rung answer giveaways) coincides with low genuine independence (few tapes gate without
false mastery). Captures the over-hinter pattern where hint pressure increases as independent
mastery decreases.

Both metrics depend on and are validated against T13's independent `false_transfer_rate` (not
a duplicate of `false_mastery_rate`). `JOINT_METRIC_EPSILON = 1e-6` prevents division-by-zero
in `transfer_per_mastery_gain` when `false_mastery_rate` is 0.

Test coverage in `web/tests/harness/test_joint_metrics_T18.test.js` (12 assertions): presence
on MetricsRecord, presence in per-class breakdowns, toJSON survival, single-surface-form
population produces high ratio (>1000), clean population yields 0, equal signals yield ~1.0,
gaming-pattern tape produces ratio > 100, heavy-hint tape divergence = 3, no-hint tape
divergence = 0, high-independence tape divergence = 0, mixed population blend = 1.5.

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
- **personas**: anxious-low-energy, bimodal, bored-high-skill, confident-guesser, fam-held-bimodal, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, misconception-stable, off-task, oscillator, over-hinter, short-attention, slow-but-steady
- **proposed lever**: wire disengagedCount / emit nudge: feed recentBehavior so Tier-2 (IDLE+OSCILLATION+TOO_FAST_CORRECT) fires for ADD_UNLIKE_COPRIME — no recorded nudge.
- **evidence**: 5 ref(s) — tape run-1:fast-mastery:ADD_UNLIKE_COPRIME; tape run-1:fast-mastery:ADD_UNLIKE_COPRIME; tape run-1:slow-but-steady:ADD_UNLIKE_COPRIME; tape run-1:slow-but-steady:ADD_UNLIKE_COPRIME; tape run-1:slow-but-steady:ADD_UNLIKE_COPRIME

### nudge-gap:ADD_UNLIKE_NESTED
- **severity**: 50
- **skill**: ADD_UNLIKE_NESTED
- **personas**: anxious-low-energy, bimodal, bored-high-skill, confident-guesser, fam-held-bimodal, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, misconception-stable, off-task, oscillator, over-hinter, short-attention, slow-but-steady
- **proposed lever**: wire disengagedCount / emit nudge: feed recentBehavior so Tier-2 (IDLE+OSCILLATION+TOO_FAST_CORRECT) fires for ADD_UNLIKE_NESTED — no recorded nudge.
- **evidence**: 5 ref(s) — tape run-1:fast-mastery:ADD_UNLIKE_NESTED; tape run-1:fast-mastery:ADD_UNLIKE_NESTED; tape run-1:slow-but-steady:ADD_UNLIKE_NESTED; tape run-1:slow-but-steady:ADD_UNLIKE_NESTED; tape run-1:slow-but-steady:ADD_UNLIKE_NESTED

### nudge-gap:COMPARE_BENCHMARK
- **severity**: 50
- **skill**: COMPARE_BENCHMARK
- **personas**: anxious-low-energy, bimodal, bored-high-skill, confident-guesser, fam-held-bimodal, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, misconception-stable, off-task, oscillator, over-hinter, short-attention, slow-but-steady
- **proposed lever**: wire disengagedCount / emit nudge: feed recentBehavior so Tier-2 (IDLE+OSCILLATION+TOO_FAST_CORRECT) fires for COMPARE_BENCHMARK — no recorded nudge.
- **evidence**: 5 ref(s) — tape run-1:fast-mastery:COMPARE_BENCHMARK; tape run-1:fast-mastery:COMPARE_BENCHMARK; tape run-1:slow-but-steady:COMPARE_BENCHMARK; tape run-1:slow-but-steady:COMPARE_BENCHMARK; tape run-1:slow-but-steady:COMPARE_BENCHMARK

### nudge-gap:FRACTION_ON_LINE
- **severity**: 50
- **skill**: FRACTION_ON_LINE
- **personas**: anxious-low-energy, bimodal, bored-high-skill, confident-guesser, fam-held-bimodal, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, misconception-stable, off-task, oscillator, over-hinter, short-attention, slow-but-steady
- **proposed lever**: wire disengagedCount / emit nudge: feed recentBehavior so Tier-2 (IDLE+OSCILLATION+TOO_FAST_CORRECT) fires for FRACTION_ON_LINE — no recorded nudge.
- **evidence**: 5 ref(s) — tape run-1:fast-mastery:FRACTION_ON_LINE; tape run-1:fast-mastery:FRACTION_ON_LINE; tape run-1:slow-but-steady:FRACTION_ON_LINE; tape run-1:slow-but-steady:FRACTION_ON_LINE; tape run-1:slow-but-steady:FRACTION_ON_LINE

### nudge-gap:IMPROPER_TO_MIXED
- **severity**: 50
- **skill**: IMPROPER_TO_MIXED
- **personas**: anxious-low-energy, bored-high-skill, confident-guesser, fam-held-bimodal, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, misconception-stable, off-task, oscillator, over-hinter, short-attention, slow-but-steady
- **proposed lever**: wire disengagedCount / emit nudge: feed recentBehavior so Tier-2 (IDLE+OSCILLATION+TOO_FAST_CORRECT) fires for IMPROPER_TO_MIXED — no recorded nudge.
- **evidence**: 5 ref(s) — tape run-1:fast-mastery:IMPROPER_TO_MIXED; tape run-1:fast-mastery:IMPROPER_TO_MIXED; tape run-1:slow-but-steady:IMPROPER_TO_MIXED; tape run-1:slow-but-steady:IMPROPER_TO_MIXED; tape run-1:slow-but-steady:IMPROPER_TO_MIXED

### nudge-gap:MULT_EQUAL_GROUPS
- **severity**: 50
- **skill**: MULT_EQUAL_GROUPS
- **personas**: anxious-low-energy, bimodal, bored-high-skill, confident-guesser, fam-held-bimodal, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, misconception-stable, off-task, oscillator, over-hinter, short-attention, slow-but-steady
- **proposed lever**: wire disengagedCount / emit nudge: feed recentBehavior so Tier-2 (IDLE+OSCILLATION+TOO_FAST_CORRECT) fires for MULT_EQUAL_GROUPS — no recorded nudge.
- **evidence**: 5 ref(s) — tape run-1:fast-mastery:MULT_EQUAL_GROUPS; tape run-1:fast-mastery:MULT_EQUAL_GROUPS; tape run-1:slow-but-steady:MULT_EQUAL_GROUPS; tape run-1:slow-but-steady:MULT_EQUAL_GROUPS; tape run-1:slow-but-steady:MULT_EQUAL_GROUPS

### nudge-gap:MULT_FACTS
- **severity**: 50
- **skill**: MULT_FACTS
- **personas**: anxious-low-energy, bimodal, bored-high-skill, confident-guesser, fam-held-bimodal, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, misconception-stable, off-task, oscillator, over-hinter, short-attention, slow-but-steady
- **proposed lever**: wire disengagedCount / emit nudge: feed recentBehavior so Tier-2 (IDLE+OSCILLATION+TOO_FAST_CORRECT) fires for MULT_FACTS — no recorded nudge.
- **evidence**: 5 ref(s) — tape run-1:fast-mastery:MULT_FACTS; tape run-1:fast-mastery:MULT_FACTS; tape run-1:slow-but-steady:MULT_FACTS; tape run-1:slow-but-steady:MULT_FACTS; tape run-1:slow-but-steady:MULT_FACTS

### nudge-gap:SIMPLIFY
- **severity**: 50
- **skill**: SIMPLIFY
- **personas**: anxious-low-energy, bimodal, bored-high-skill, confident-guesser, fam-held-bimodal, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, misconception-stable, off-task, oscillator, over-hinter, short-attention, slow-but-steady
- **proposed lever**: wire disengagedCount / emit nudge: feed recentBehavior so Tier-2 (IDLE+OSCILLATION+TOO_FAST_CORRECT) fires for SIMPLIFY — no recorded nudge.
- **evidence**: 5 ref(s) — tape run-1:fast-mastery:SIMPLIFY; tape run-1:fast-mastery:SIMPLIFY; tape run-1:slow-but-steady:SIMPLIFY; tape run-1:slow-but-steady:SIMPLIFY; tape run-1:slow-but-steady:SIMPLIFY

### nudge-gap:SUB_SAME_DEN
- **severity**: 50
- **skill**: SUB_SAME_DEN
- **personas**: anxious-low-energy, bimodal, bored-high-skill, confident-guesser, fam-held-bimodal, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, misconception-stable, off-task, over-hinter, short-attention, slow-but-steady
- **proposed lever**: wire disengagedCount / emit nudge: feed recentBehavior so Tier-2 (IDLE+OSCILLATION+TOO_FAST_CORRECT) fires for SUB_SAME_DEN — no recorded nudge.
- **evidence**: 5 ref(s) — tape run-1:fast-mastery:SUB_SAME_DEN; tape run-1:fast-mastery:SUB_SAME_DEN; tape run-1:slow-but-steady:SUB_SAME_DEN; tape run-1:slow-but-steady:SUB_SAME_DEN; tape run-1:slow-but-steady:SUB_SAME_DEN

## Pedagogically-hard skills

### pedagogically-hard:FRACTION_ON_LINE
- **severity**: 28.036764705882355
- **skill**: FRACTION_ON_LINE
- **personas**: anxious-low-energy, bimodal, bored-high-skill, confident-guesser, denominator-transfer-spoofer, fam-held-at-scaffold-disengaged, fam-held-bimodal, fam-held-fluency-spoofer, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, memorizer, misconception-stable, off-task, oscillator, over-hinter, performance-oriented, same-answer-memorizer, short-attention, slow-but-steady
- **proposed lever**: harden FRACTION_ON_LINE: composite risk 0.804 (false-mastery 0.42, false-transfer 0.00) — add transfer probes / tighten the gate evidence for this skill.
- **evidence**: 1 ref(s) — verdict risk=0.804

### pedagogically-hard:ADD_UNLIKE_COPRIME
- **severity**: 27.66176470588235
- **skill**: ADD_UNLIKE_COPRIME
- **personas**: anxious-low-energy, bimodal, bored-high-skill, confident-guesser, denominator-transfer-spoofer, fam-held-at-scaffold-disengaged, fam-held-bimodal, fam-held-fluency-spoofer, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, memorizer, misconception-stable, off-task, oscillator, over-hinter, performance-oriented, same-answer-memorizer, short-attention, slow-but-steady
- **proposed lever**: harden ADD_UNLIKE_COPRIME: composite risk 0.766 (false-mastery 0.38, false-transfer 0.00) — add transfer probes / tighten the gate evidence for this skill.
- **evidence**: 1 ref(s) — verdict risk=0.766

### pedagogically-hard:ADD_UNLIKE_NESTED
- **severity**: 27.66176470588235
- **skill**: ADD_UNLIKE_NESTED
- **personas**: anxious-low-energy, bimodal, bored-high-skill, confident-guesser, denominator-transfer-spoofer, fam-held-at-scaffold-disengaged, fam-held-bimodal, fam-held-fluency-spoofer, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, memorizer, misconception-stable, off-task, oscillator, over-hinter, performance-oriented, same-answer-memorizer, short-attention, slow-but-steady
- **proposed lever**: harden ADD_UNLIKE_NESTED: composite risk 0.766 (false-mastery 0.38, false-transfer 0.00) — add transfer probes / tighten the gate evidence for this skill.
- **evidence**: 1 ref(s) — verdict risk=0.766

### pedagogically-hard:COMPARE_BENCHMARK
- **severity**: 27.66176470588235
- **skill**: COMPARE_BENCHMARK
- **personas**: anxious-low-energy, bimodal, bored-high-skill, confident-guesser, denominator-transfer-spoofer, fam-held-at-scaffold-disengaged, fam-held-bimodal, fam-held-fluency-spoofer, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, memorizer, misconception-stable, off-task, oscillator, over-hinter, performance-oriented, same-answer-memorizer, short-attention, slow-but-steady
- **proposed lever**: harden COMPARE_BENCHMARK: composite risk 0.766 (false-mastery 0.38, false-transfer 0.00) — add transfer probes / tighten the gate evidence for this skill.
- **evidence**: 1 ref(s) — verdict risk=0.766

### pedagogically-hard:MULT_EQUAL_GROUPS
- **severity**: 27.66176470588235
- **skill**: MULT_EQUAL_GROUPS
- **personas**: anxious-low-energy, bimodal, bored-high-skill, confident-guesser, denominator-transfer-spoofer, fam-held-at-scaffold-disengaged, fam-held-bimodal, fam-held-fluency-spoofer, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, memorizer, misconception-stable, off-task, oscillator, over-hinter, performance-oriented, same-answer-memorizer, short-attention, slow-but-steady
- **proposed lever**: harden MULT_EQUAL_GROUPS: composite risk 0.766 (false-mastery 0.38, false-transfer 0.00) — add transfer probes / tighten the gate evidence for this skill.
- **evidence**: 1 ref(s) — verdict risk=0.766

### pedagogically-hard:MULT_FACTS
- **severity**: 27.66176470588235
- **skill**: MULT_FACTS
- **personas**: anxious-low-energy, bimodal, bored-high-skill, confident-guesser, denominator-transfer-spoofer, fam-held-at-scaffold-disengaged, fam-held-bimodal, fam-held-fluency-spoofer, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, memorizer, misconception-stable, off-task, oscillator, over-hinter, performance-oriented, same-answer-memorizer, short-attention, slow-but-steady
- **proposed lever**: harden MULT_FACTS: composite risk 0.766 (false-mastery 0.38, false-transfer 0.00) — add transfer probes / tighten the gate evidence for this skill.
- **evidence**: 1 ref(s) — verdict risk=0.766

### pedagogically-hard:SIMPLIFY
- **severity**: 27.66176470588235
- **skill**: SIMPLIFY
- **personas**: anxious-low-energy, bimodal, bored-high-skill, confident-guesser, denominator-transfer-spoofer, fam-held-at-scaffold-disengaged, fam-held-bimodal, fam-held-fluency-spoofer, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, memorizer, misconception-stable, off-task, oscillator, over-hinter, performance-oriented, same-answer-memorizer, short-attention, slow-but-steady
- **proposed lever**: harden SIMPLIFY: composite risk 0.766 (false-mastery 0.38, false-transfer 0.00) — add transfer probes / tighten the gate evidence for this skill.
- **evidence**: 1 ref(s) — verdict risk=0.766

### pedagogically-hard:SUB_SAME_DEN
- **severity**: 27.66176470588235
- **skill**: SUB_SAME_DEN
- **personas**: anxious-low-energy, bimodal, bored-high-skill, confident-guesser, denominator-transfer-spoofer, fam-held-at-scaffold-disengaged, fam-held-bimodal, fam-held-fluency-spoofer, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, memorizer, misconception-stable, off-task, oscillator, over-hinter, performance-oriented, same-answer-memorizer, short-attention, slow-but-steady
- **proposed lever**: harden SUB_SAME_DEN: composite risk 0.766 (false-mastery 0.38, false-transfer 0.00) — add transfer probes / tighten the gate evidence for this skill.
- **evidence**: 1 ref(s) — verdict risk=0.766

### pedagogically-hard:IMPROPER_TO_MIXED
- **severity**: 22.5
- **skill**: IMPROPER_TO_MIXED
- **personas**: anxious-low-energy, bimodal, bored-high-skill, confident-guesser, denominator-transfer-spoofer, fam-held-at-scaffold-disengaged, fam-held-bimodal, fam-held-fluency-spoofer, fam-held-osc, fam-train-a, fam-train-b, fam-train-c, fast-mastery, fast-shallow-guesser, low-reading, memorizer, misconception-stable, off-task, oscillator, over-hinter, performance-oriented, same-answer-memorizer, short-attention, slow-but-steady
- **proposed lever**: harden IMPROPER_TO_MIXED: composite risk 0.250 (false-mastery 0.00, false-transfer 0.00) — add transfer probes / tighten the gate evidence for this skill.
- **evidence**: 1 ref(s) — verdict risk=0.250
