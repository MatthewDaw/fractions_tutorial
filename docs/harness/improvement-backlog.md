# Improvement backlog (synthetic-learner red-team)

## UI5 — Adaptive-vs-static control arm (RESOLVED)

**Status:** DONE — `controlArm` option added to `runSession`, `runSweep`, and `runArmComparison`
in `web/src/harness/sessionRunner.js`. `buildArmComparison` and `renderArmComparisonMarkdown`
added to `web/src/harness/report.js`. Comparison doc written to
`docs/harness/adaptive-vs-static-comparison.md`. 19 new tests in
`web/tests/harness/test_control_arm_UI5.test.js`. `npx vitest run` GREEN: 1144 tests / 87 files.

**Design:** the static arm runs the SAME engine (nextDecision, measurementReduce, gate) with
the SAME personas/seeds, but suppresses the scaffold-level mutation after each step. FadeScaffold
and RaiseScaffold decisions are still EMITTED by the policy (so the engine's intent is visible on
the tape) but the `policyState.currentScaffold` is not updated. Tapes carry `arm:'static'` vs
`arm:'adaptive'` to distinguish runs.

**Headline finding (from the actual numbers, seed=1, 240 sessions per arm):**
Scaffold adaptation is PREREQUISITE for the mastery gate to open, not merely beneficial for
the rate at which it opens. The mastery gate requires `max_scaffold_passed >= L3` (gate.ts:56 —
the independence condition); with scaffold fixed at L0 this is structurally unsatisfiable.
The static arm's `mastery_rate = null` (gate never opened in any of 240 sessions) and
`false_mastery_rate = 0` are NOT evidence of safety — they reflect that no learner was ever
given the chance to gate. The policy correctly issued 2243 FadeScaffold decisions in the static
arm but all mutations were suppressed.

**Actual numbers (seed=1, τ_latent=0.8, all 24 personas × 10 skills, stepCap=40):**

| metric | adaptive arm | static arm | delta | adaptation helps? |
| --- | --- | --- | --- | --- |
| false_mastery_rate | 0.3417 | 0.0000 | +0.3417 | structural artefact (gate unreachable) |
| transfer_after_fade | 0.8844 | 0.0000 | +0.8844 | YES (static gate never opened) |
| independence_rate | 0.2958 | 0.0000 | +0.2958 | YES (static gate never opened) |
| mastery_rate | 0.6375 | null | n/a | YES (static gate never opened) |
| reps_to_mastery (mean) | 16.0261 | null | n/a | n/a |

Arm separation: adaptive arm final scaffold avg 2.41 (L0→L4 traversal); static arm final scaffold 0.0 throughout.

**Honest read:** adaptation demonstrably helps on transfer_after_fade and independence_rate
(the gate opened in 63.75% of adaptive sessions with meaningful transfer and independence
fractions). The false_mastery_rate figure is a valid concern for the adaptive arm (34.17%
at τ=0.8 — driven by the existing fluencyOk-always-true audit defect, not by scaffold morphs);
the static arm's 0% is vacuous because no one gated at all.

Full doc: `docs/harness/adaptive-vs-static-comparison.md`.
## T28 — Gate-hardening certification (round-2, 2026-06-09)

**Status:** DONE (partial) — overlay extended, before/after measured, honest verdict emitted.

**What was done:**
- Extended `flagOverlay.js` `FLAG_TO_PARAM` to route all four T22-T25 gate-hardening flags
  (`requireMisconceptionFree`, `requireStableEstimate`, `strictGateThreshold`, `requireTransferProbe`)
  plus the T27 `escalationCompetenceGuard` to their live PARAMS properties.
- Added `tests/harness/test_T28_gate_hardening.test.js` (20 tests): routing coverage, PARAMS mutation
  smoke, before/after population metrics, counter-direction checks, runLoop documentation.
- Updated `docs/harness/decision-log.md` and `docs/harness/baseline-report.md` with real numbers.

**Before/after (full library sweep, 216 sessions, seed=1, stepCap=40):**
- false_mastery_rate τ=0.80: 0.3796 → 0.3380 (drop of 0.0416, 9 sessions resolved)
- false_mastery_rate τ=0.85: 0.4583 → 0.4583 (no change)
- false_escalation_rate: 0.0046 → 0.0000 (T27 guard working)
- transfer_after_fade: 0.8844 → 0.8844 (guardrail intact)

**Honest verdict:** PARTIAL improvement. Flags help at τ=0.80 for the `anxious-low-energy` persona
class. They cannot hit the committed τ=0.85 target (≤0.20) because `strictGateThreshold=0.985` is
moot vs `pKnownClamp` ceiling of 0.99. BKT climbs to 0.99 in < 10 steps for high-correct-rate
personas. The `escalationCompetenceGuard` is safe to flip default-ON.

**Open action:** Re-tune `pKnownClamp[1]` from 0.99 → 0.995 and `strictGateThresholdValue` from
0.985 → 0.992, then re-run T28 certification to validate the τ=0.85 ≤0.20 target.

`npx vitest run` GREEN: 1210 tests / 90 files all pass.

## T21 — Silent guardrail-degradation gap (RESOLVED)

**Status:** DONE — `runLoop` in `web/src/harness/recursiveLoop.js` now emits a
`guardrail_degraded` WARNING independently of the REAL/GAMING/NO_CHANGE verdict.

**Root cause (T07 MEDIUM finding):** `guardrailDegraded` was only consulted inside the
GAMING branch. A change that left target metrics unmoved (verdict = NO_CHANGE) but
silently dropped `transfer_after_fade` on the held-out family (e.g. fluencyHardMode
dropping 0.8→0.6) produced NO visible signal — the guardrail damage was hidden.

**Fix:** Added `GUARDRAIL_WARN_THRESHOLD = 0.05` constant and a `guardrailWarning`
object computed AFTER guardrailDegraded, BEFORE the verdict switch. The return value
now always carries a `warnings` array: non-empty when `guardBefore - guardAfter >
GUARDRAIL_WARN_THRESHOLD`, empty otherwise. The GAMING verdict logic (`IMPROVE_EPS`
epsilon) is unchanged.

**Test coverage** in `web/tests/harness/test_recursive_loop.test.js` (4 new assertions
under "guardrail_degraded warning (T07 gap)"):
- (8a) NO_CHANGE + guardrail drop → `warnings` contains `guardrail_degraded` with before/after/drop fields
- (8b) NO_CHANGE + no drop → `warnings` is empty
- (8c) GAMING + guardrail drop → warning fires independently of verdict
- (8d) REAL + no drop → `warnings` is empty

`npx vitest run` GREEN: 1109 tests / 84 files all pass.

## T17 — τ-sensitivity curve (RESOLVED)

**Status:** DONE — `buildTauSensitivityCurve`, `renderTauSensitivityMarkdown`, and
`TAU_SWEEP = [0.70, 0.75, 0.80, 0.85, 0.90]` added to `web/src/harness/report.js`.
`buildBaselineReport` now includes a `tauCurve` field (array of `{tau, false_mastery_rate,
missed_escalation_rate}` rows). `renderBaselineReportMarkdown` inserts the τ-sensitivity table
before the failure-cluster table. `docs/harness/baseline-report.md` has a clearly-delimited
τ-sensitivity section with the actual curve for the 210-session seed-1 population.
`docs/harness/research-notes.md` section (e) explains why a curve is required and interprets
the numbers.

Curve (baseline-seed1, 210 tapes):
  τ=0.70 → fmr=0.1286, mer=0.0
  τ=0.75 → fmr=0.2571, mer=0.0
  τ=0.80 → fmr=0.3429, mer=0.0  ← DEFAULT_TAU_LATENT centroid
  τ=0.85 → fmr=0.3857, mer=0.0
  τ=0.90 → fmr=0.5571, mer=0.0

`false_mastery_rate` is strictly non-decreasing (4× spread, 0.13→0.56) — confirms the PDF
warning against single-point estimates is well-founded. `missed_escalation_rate` is 0.0 across
the full sweep (STUCK trigger conditions not met in 210 sessions; disengaged path unreachable).

Test coverage in `web/tests/harness/test_tau_sensitivity_T17.test.js` (16 assertions):
TAU_SWEEP shape (length 5, sorted, covers 0.70–0.90), curve shape (row count, field types,
range), tau-value alignment, custom sweep, non-decreasing false_mastery_rate, strict increase
between τ=0.75 and τ=0.80, non-decreasing missed_escalation_rate, determinism, markdown
heading/columns/sweep-point rows/oracle mandate mention, integration (tauCurve on
buildBaselineReport output).

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
