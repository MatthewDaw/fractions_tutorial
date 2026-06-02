---
date: 2026-06-02
topic: synthetic-challenger-harness
focus: best way to build the synthetic-learner red-team harness that drives the real adaptive engine end-to-end across learner types and validates the learning signaling
mode: repo-grounded
---

# Ideation: Synthetic-Learner Red-Team Harness

## Grounding Context (Codebase + Brief)

**The bar (governing brief, `docs/inspiration/synthetic_challenger.pdf`):** Not "agents talking to each other" — a *credible test harness that exposes real educational risk without fooling itself*. Weak submission = a swarm of obedient fake students and a rising score. Strong = synthetic learners that are useful critics even when inconvenient, evasive, or irrational, and whose flagged failures a human educator would agree with. Mandatory deliverables: counter-metrics, regression detection, an explicit real-progress-vs-benchmark-gaming verdict, a limitations memo, and a decision log. The brief's seven evaluation questions: which learner types does the tutor fail; which misconceptions survive instruction; where is it helpful-but-no-transfer; when does it give away answers; when does it fail to redirect avoidance; which changes improve learning vs. just the benchmark; why trust any of the synthetic results.

**Codebase reality (already built — reuse, do not reinvent):** a pure headless fold `measurementReduce(log) → {masteryMap, recentBehavior}` and `nextDecision(state, mastery, recentBehavior, now)` with **no wall-clock and no React imports**; `Actor = 'human' | synthetic:${persona}` already baked into every event; a rich per-attempt `Observation` vector (`correct, answer_value, error_signature, latency, hint_max_rung, self_corrections, scaffold_level, modality, recognizer_confidence, too_fast_correct, affect_window`); 8 named `error_signature`s; the deterministic gate `isMastered = P_known≥0.95 AND max_scaffold≥3 AND transfer_passed` (soft fluency advisory); 10 deterministic correct-by-construction generators `generateFor(skill,{level,index,surfaceForm})` + `surfaceFormsFor` (2 surface forms each, seeded PRNG); `practiceFlow.nextPractice(decision,state)` maps a Decision → next problem; `params.ts` is the single calibration surface (`fadeStreakK=3, raiseErrorsM=2, wallTheta=0.6, gateThreshold=0.95, P_T=0.20/P_S=0.10/P_G=0.20, latencyFloorMs=1200, escalation nStuck=6/nDiseng=5, creditDiscount=0.3, prereqWeight=0.3`). The whole pipeline is seedable → exact before/after diffs are free. **Missing:** the Node driver/session-runner, the persona emission model, the oracle, the metrics/regression framework, the report.

**Learnings cautions:** keep persona latent truth *parameter-disjoint* from `params.ts` or you prove a tautology; the harness must target the **engine signal**, not felt UX (a known `consecutiveErrors` double-count in the UI path + an AppR4 engine-vs-UX gating split are live); affect is a typed stub — model focus/attention only via the behavioral signals that actually exist (latency drift, idle, oscillation, error-rate climb, `too_fast_correct`) and say so in the limitations memo.

**External prior art:** SimStudent / Apprentice Learner (match differential *error-type* distributions, not just aggregate accuracy); Zhang & MacLellan parameter-disjoint-validation template; STEP = canonical circularity trap (estimator validated by a simulator that shares its parameters); Baker's gaming / off-task / carelessness as three behaviorally-distinct disengagement classes; BKT semantic degeneracy (P(G)+P(S)>1, one-step-learn) → include non-BKT-shaped personas; RHSI/Goodhart counter-metric decoupling + reward-overoptimization (monitor a held-out metric the optimizer never touches); LLM "students" are systematically too obedient/competent and drift over turns → parametric primary, LLM as separate judge/spot-check only; fraction misconception taxonomy (independent-numerator/denominator, whole-number bias, gap thinking, denominator neglect, unit-fraction inversion).

## Topic Axes
- Persona modeling — latent state + stochastic emission; built-in noise/evasion; parametric vs LLM
- Harness driver — headless session runner reusing engine + generators + practiceFlow; scenario scripting; determinism
- Oracle & metrics — latent ground truth, validity, counter-metrics, circularity-breaking
- Recursive improvement loop — baseline → cluster → change → re-run → regression → gaming verdict
- Credibility & reporting — failure clusters, human-agreement spot-check, limitations memo, decision log

## Throughline
The brief's real demand is *don't fool yourself with synthetic evidence*. Nearly every trust failure here is **silent** — nothing crashes, the score just quietly becomes meaningless. So the survivor set is biased toward making credibility **structural** (machine-checked, replay-pinned, held-out) rather than asserted. The single biggest cross-frame reframe: **the harness is a *search* for the nearest decision-flip, not a panel of obedient personas asserted to pass/fail.**

## Ranked Ideas

### 1. Personas as parameter-disjoint latent laws, emitted by inverting the generators
**Description:** A persona is a latent generative process (true skill trajectory, slip/guess, misconception strength, within-session fatigue) whose parameters are *named disjoint* from `params.ts`. Wrong answers aren't scripted — they're produced by applying a misconception (whole-number bias, denominator neglect, gap thinking…) to the **actual operands the generator chose**, yielding content-true errors with realistic `error_signature` distributions. Misconception strength decays only under genuine instruction (transfer-extinction), operationalizing "which misconceptions survive instruction."
**Axis:** Persona modeling
**Basis:** `direct:` every generator already derives `answer` from the operands it picked, so an inverse-error map is a pure sibling function; the engine fingerprints 8 `error_signature`s. `external:` SimStudent/Apprentice-Learner (match differential error-type distributions, not accuracy); STEP circularity trap that disjointness avoids.
**Rationale:** The structural guarantee against tautology — persona truth lives in error-maps over operands, the engine's truth lives in `params.ts`, they can't share a knob. The persona file doubles as the ground-truth label format the future factorial-HMM is fit against.
**Downsides:** Authoring inverse-error maps per skill is real work; misconception-decay dynamics need a defensible model.
**Confidence:** 90% · **Complexity:** Medium · **Status:** Unexplored

### 2. Closed-loop adversarial search for the nearest decision-flip
**Description:** Don't replay a fixed transcript or enumerate a fixed panel. Close the loop (the persona reacts to the engine's *actual* Decision + rationale) and run gradient-free search (CMA-ES/evolution) over persona latents + seeds to find the **smallest perturbation from an honest learner** that flips a high-stakes decision (false mastery, missed escalation). Output = *distance-to-failure* + a replayable seed. A coverage-guided variant keeps any mutant that reaches a new engine decision-branch.
**Axis:** Harness driver
**Basis:** `direct:` `nextDecision`/`practiceFlow.nextPractice` are pure, seedable, and expose a readable rationale — the seam to inject an adaptive adversary and cheaply evaluate millions of candidates exists. `external:` adversarial-example mining + coverage-guided fuzzing (AFL/libFuzzer).
**Rationale:** "the falsely-mastered child is 0.04 in slip-rate from a real one" is a risk a human believes; "some persona passed" is not. A search can't be accused of author-bias toward learners the engine already handles.
**Downsides:** The search objective + plausibility box must be designed carefully (an implausible adversary proves nothing); more machinery than a static panel.
**Confidence:** 82% · **Complexity:** High · **Status:** Unexplored

### 3. Metamorphic invariants + schema-enforced counter-metrics, aimed at the escalation valve
**Description:** Make the oracle partly *oracle-free*: assert relations the engine must satisfy regardless of latent truth — permuting surface form A↔B must not flip the mastery verdict; one extra correct must never lower `P_known`; a strictly-dominated learner must never master earlier. Bake counter-metrics into the schema so a one-sided win can't serialize (`mastery_rate` requires `false_mastery_rate` + evidence-count-at-gate-open). Aim hardest at the **escalation boundary** (a missed human handoff = real harm), not just the mastery flag. First prove the harness catches the *known* `consecutiveErrors` double-count as a positive control.
**Axis:** Oracle & metrics
**Basis:** `external:` metamorphic testing (no ground truth needed); Goodhart counter-metric decoupling. `direct:` the gate is a clean conjunction and escalation triggers are deterministic thresholds; the known live bug is a free positive control.
**Rationale:** Defeats the deepest self-deception risk — you don't have to believe your own truth model for a monotonicity/permutation violation to be undeniable. Aiming at escalation targets where an educator won't forgive a miss.
**Downsides:** Designing strong invariants is subtle; over-strict ones produce false alarms.
**Confidence:** 85% · **Complexity:** Medium · **Status:** Unexplored

### 4. Two-tier loop with a sealed held-out judge; a mechanical gaming verdict
**Description:** baseline → cluster failures → change (`params.ts`/generators/policy) → re-run on the **same seeds** (exact diff) **and** on a **sealed held-out persona family** built from a *different generative mechanism* + unseen surface forms + fresh seed lineage. An improvement counts only if held-out moves; a guardrail metric the optimizer is never allowed to read (transfer on novel forms) gates the verdict; deflate the pass-rate for the number of trials. The nightly search distills its worst finds into ~200 frozen champion-adversary fixtures so per-commit CI regression runs in <60s.
**Axis:** Recursive improvement loop
**Basis:** `external:` Goodhart "monitor a metric the optimizer never touches," train/test generalization, backtest-overfitting / deflated-Sharpe. `direct:` the pipeline is seedable end-to-end, so before/after diffs are exact and fixtures replay bit-identical.
**Rationale:** Converts the brief's hardest deliverable — real progress vs. benchmark gaming — from a judgment call into a falsifiable number (train Δ vs. held-out Δ). The two-tier split also resolves the "search is too slow for CI" tension.
**Downsides:** Maintaining a genuinely disjoint held-out family takes discipline; the fixture set can rot if not refreshed.
**Confidence:** 88% · **Complexity:** Medium · **Status:** Unexplored

### 5. One signed replay tape as the single source of truth + verdict cards + blind Turing check
**Description:** Every run emits one canonical deterministic JSONL tape `{seed, persona latents, decision, observation, params_hash, engine_sha}`. The decision log, regression baseline, limitations memo, and future-HMM calibration corpus are all *projections* of that one tape — not separately maintained docs that drift. Each failure cluster compresses to a one-page **replayable verdict-card** ranked by severity×plausibility×novelty so a human reviews the single most damning failure. Then validate the *learners themselves* (not just results) with a blind discrimination test: mix synthetic + real/hand-authored error streams, strip the `actor` tag, have a human (or a held-out LLM as pre-screen — judge only, never generator) guess which are fake, and report the hit-rate + the tells.
**Axis:** Credibility & reporting
**Basis:** `direct:` every event already carries `actor:'human'|synthetic:${persona}`; the fold is wall-clock-free and seedable so the tape replays bit-exact; `decisionLog` already exists. `external:` golden-file/snapshot review, Turing-style discrimination, LLM-as-judge-only (LLM students too obedient + drift).
**Rationale:** Answers "why trust any of this?" with reproduction instead of prose — a skeptic re-runs the seed and either reproduces every number or finds a non-determinism (itself a finding). "Educators fingered our personas at 54%, tell = latency too regular" is honest fidelity; an assertion is not.
**Downsides:** Needs a small real/hand-authored error corpus to discriminate against; the tape schema is a contract to maintain.
**Confidence:** 84% · **Complexity:** Medium · **Status:** Unexplored

### 6. Non-BKT + off-task personas to escape the BKT-validates-BKT hall of mirrors
**Description:** Deliberately include personas the engine's own model cannot represent: oscillators that learn-then-forget on a period disjoint from `fadeStreakK=3`/`raiseErrorsM=2` (to surface scaffold-thrash resonance), bimodal lucky-on-easy learners, and personas that emit **non-answers, timeouts, and malformed inputs**. The second class tests whether the engine detects *non-answering* — its hardest, highest-stakes job — instead of the driver silently coercing a missing/garbage answer into a clean no-op.
**Axis:** Persona modeling
**Basis:** `direct:` the fade/raise thresholds and `escalation.nDiseng` are bright lines an oscillator/off-task learner exercises; the `affect_window`/Signal stream is where disengagement should route. `external:` BKT semantic degeneracy (if persona and engine are both BKT-shaped the harness only confirms the engine's assumptions); Baker's 3 distinct disengagement classes.
**Rationale:** If both the fake student and the tutor are BKT, a passing score is evidence of nothing. Non-BKT and refusing-to-answer personas are where obedient-fake harnesses go blind.
**Downsides:** May surface "failures" out-of-scope for v1; needs the driver to faithfully pass malformed events the engine may not currently parse.
**Confidence:** 80% · **Complexity:** Medium · **Status:** Unexplored

## Honorable Mentions (narrower; revisit at build time)
- **Chaos fault-injection on the Observation channel** — a single mis-tap / stylus mis-recognition / too-fast lucky correct must not flip a verdict. Distinct and real (the app has a handwriting recognizer + `recognizer_confidence`), but a test *type* rather than load-bearing architecture.
- **FMEA risk-priority budget allocation** — enumerate failure modes, score Severity×Occurrence×Detectability, and allocate persona/search budget by RPN; the Detectability column is the limitations-memo backbone.

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Disjointness CI-lint; persona-spec = HMM calibration-label format | Merged → Idea 1 |
| 2 | Surface-form collusion/relabel-invariance audit; evidence-count counter-metric; frozen-engine "attack only content/sequencing"; 10M-session failure-manifold *volume* metric | Merged → Idea 3 / Idea 2 |
| 3 | Replay-determinism byte test; metric-definition hash (moving-goalpost guard); anomaly-clustering of trajectories; one-glance educator triage | Merged → Idea 5 |
| 4 | `params.ts` as shared attack/fit/diff search space; differential `diff(engineA,engineB,tape)` verb; walk-forward deflated pass-rate | Merged → Idea 2 / Idea 4 |
| 5 | Misconception-as-contagion; error-shape forensics; carelessness-vs-gaming counter-moving curves; surface-form confusion matrix | Merged → Idea 1 / Idea 3 |
| 6 | Adversarial co-evolution vs. frozen tutor; two-optimizer held-out judge | Merged → Idea 4 |
| 7 | Chaos fault-injection on the Observation channel | Honorable mention — distinct & real, but a test type, not load-bearing architecture |
| 8 | FMEA risk-priority budget allocation | Honorable mention — useful prioritization, narrower than a survivor |
| 9 | "Build a Node driver that loops nextDecision→generate→emit→measurementReduce" | Below ambition floor — the baseline the plan-writing prompt already resolved |
| 10 | Pure LLM-agent personas as the primary population | Prior art decisive — LLM students are systematically too obedient/competent and drift; relegated to discriminator/spot-check only (Idea 5) |

_Axis coverage: all five axes represented (Persona ×2, Driver, Oracle, Loop, Reporting). No empty axes._

## Suggested Next Step
Route to `ce-brainstorm` on **Idea 2 (closed-loop adversarial search)** or **Idea 1 (parameter-disjoint persona model)** — these two are the architectural spine the other four hang off. Then `ce-plan` to produce `docs/plans/2026-MM-DD-NNN-feat-synthetic-challenger-harness-plan.md` in the repo's plan style.
