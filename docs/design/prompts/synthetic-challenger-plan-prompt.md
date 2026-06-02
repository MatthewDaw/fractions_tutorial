# Prompt: write the build plan for the Synthetic Learner Red-Team Harness

You are writing an implementation **plan** (not the code yet) for a "synthetic learner
red-team harness" on top of an existing fractions-tutoring app. Read everything below,
then read the referenced files in the repo, then produce a plan document. Do **not** start
building until the plan is reviewed.

---

## 1. The mission (what the user actually wants)

Build a harness that runs **synthetic learners of many types** through this app's adaptive
learning flow, end to end, and proves the app **correctly guides students of all types** —
across **learning speed, energy, focus, attention span**, plus knowledge state,
misconceptions, and avoidance behavior. The harness must:

- Run a **baseline** pass (current app) against the synthetic population.
- **Surface failure clusters** — which learner types the system mis-guides (false-positive
  mastery, gives away answers, fails to redirect avoidance, fails transfer, bores the strong
  learner, traps the slow learner, etc.).
- Drive at least **one recursive improvement loop**: change something (params, policy,
  hint/scaffold logic, sequencing, generator difficulty), re-run, compare, **detect
  regressions**, and judge whether the change is real educational progress or **benchmark
  gaming / overfitting to the synthetic learners**.

The governing brief is `docs/inspiration/synthetic_challenger.pdf` — read it. Its core
warning: a weak submission is "a swarm of obedient fake students and a rising score." A
strong one makes the synthetic learners **useful critics** that behave inconveniently,
evasively, and irrationally, and whose findings a human educator would agree with.

---

## 2. Why this app is unusually well-suited (read before designing)

This is **not** greenfield. The app was deliberately built so a synthetic harness could
drive the **exact same code path** a human drives. The plan must build on these seams, not
reinvent them. Read these first:

- `docs/plans/2026-05-31-002-feat-mastery-adaptive-flow-plan.md` — the measurement/adaptive
  plan. Note especially **KTD9** ("time and actor are data on events; the fold is pure and
  replayable") and the **Seams Preserved → Synthetic-challenger harness** section: every
  event already carries `actor ∈ {human, "synthetic:" + persona}`, and the engine is a pure
  headless fold with **no wall-clock and no React imports**, so a Node driver can run personas
  on the same `measurementReduce → nextDecision` path. `params.ts` is the explicit calibration
  surface.
- `docs/design/student-state-measurement.md` and `docs/design/fraction-app-state-model.md` —
  the measurement model and the policy/wall/escalation design. The mastery **gate** is
  deterministic and multi-dimensional (accuracy via BKT + scaffold-independence + transfer +
  soft fluency); affect is a `Signal` that never gates mastery (the "affect firewall"). These
  are exactly the false-positive guards the brief asks you to stress.
- The engine itself: `web/src/engine/` — `types.ts` (Event = Action | Signal; the rich
  `Observation` vector), `log.ts`, `observation.ts` (segment + featurize, incl. `error_signature`
  taxonomy and `too_fast_correct`), `bkt.ts`, `dimensions.ts` (fluency / independence / transfer
  / hint_dependence), `gate.ts`, `decay.ts`, `credit.ts`, `wall.ts`, `policy.ts` (`nextDecision`
  + `legalMoves` + rationale + `EscalateToHuman`), `measurementReduce.ts`, `params.ts`, `graph.ts`
  (the 10-skill DAG mapped to real rooms).
- **The content generators (new — already built):** `web/src/generators/` — one pure,
  deterministic, correct-by-construction problem generator per skill, with `generateFor(skill,
  { level, index, surfaceForm })` and 2 surface forms each (`index.js`). These give the harness
  an **infinite supply of validated, varied problems** so personas can be tested far past the
  old fixed examples. `web/src/runtime/practiceFlow.js` maps an engine `Decision` →
  the next problem spec (continue / fade / raise / transfer / return).
- `web/src/runtime/useLessonEngine.js` + `useLessonScaffold.js` — how the live UI emits the
  event burst, calls the engine at boundaries, and applies decisions. The harness should drive
  the **engine layer directly** (headless), not the React UI, but it must emit the **same
  Observation vector** the UI does so findings transfer.

**Implication for the plan:** the synthetic learner is a function that, given the current
`Decision` + problem, emits a realistic event burst (answer value, latency, hint rung,
self-corrections, modality, affect Signals) — and the harness folds those through the *real*
engine. No parallel/mock engine. This is what makes the results credible rather than circular.

---

## 3. The Observation vector is your behavioral surface (this is the key insight)

The engine already consumes a **rich per-attempt vector** (KTD3): `{ correct, answer_value,
error_signature, latency, hint_max_rung, self_corrections, scaffold_level, modality,
recognizer_confidence, too_fast_correct, affect_window }`, plus a `Signal` stream (idle,
oscillation, affect stub). **Every persona trait the user named maps onto these fields** — the
plan must make this mapping explicit and defend it:

- **learning speed** → how fast `P_known` should rise for this persona given correct attempts;
  how many reps at a level before they genuinely master vs. plateau.
- **energy / focus / attention span** → latency drift over a session, rising idle/oscillation
  Signals, error rate climbing as a session lengthens, abandonment after N problems.
- **knowledge state / misconceptions** → which `error_signature`s they emit, and on which
  surface forms (the generators' surface_form field is how you test transfer vs. memorization).
- **avoidance behaviors** → hint-spamming (high `hint_max_rung`), too-fast guessing
  (`too_fast_correct`), idle/topic-change, "I get it" shallow compliance.

A synthetic learner is therefore a **stochastic policy over the Observation vector**
conditioned on (true latent skill, persona traits, current scaffold, fatigue state). The plan
should specify each persona as latent-state + emission parameters, NOT as scripted answers.

---

## 4. Personas to cover (map each to a real failure the app could have)

The brief lists patterns; the user wants the speed/energy/focus/attention axes especially.
The plan should propose a **defensible persona set** where each persona is designed to expose a
**specific app failure mode**, e.g.:

- **Fast mastery / bored high-skill** — does the app skip-ahead and fade fast, or trap them in
  scaffolds? (tests Fade + skip-ahead + wall look-ahead.)
- **Slow-but-steady** — does the app give enough generated reps before advancing, without
  false-positive mastery? (tests fadeStreakK, the gate, generator supply.)
- **Confident guesser / too-fast-correct** — does the gate refuse mastery and fire a
  TransferProbe? (tests `too_fast_correct` → pendingTransferProbe.)
- **Memorizer** — passes the trained surface_form, fails the other one. Does transfer catch it?
  (tests the transfer dimension across generator surface forms.)
- **Over-hinter** — high hint dependence. Does independence stay un-credited; does the app
  reduce answer-giving? (tests hint_dependence + independence gate.)
- **Anxious / low-energy / short attention** — latency climbs, idle Signals, gives up. Does the
  app raise scaffold, nudge (Tier-2), or escalate appropriately without bulldozing agency?
  (tests RaiseScaffold + Tier-2 nudges + EscalateToHuman triggers.)
- **Misconception-stable** — a specific `error_signature` that survives instruction. Does
  credit-assignment route blame to the binding skill and re-open the wall? (tests credit.ts +
  wall.ts.)
- **Low-reading / misreads prompts** — knows the concept, fails worded/applied surface forms.

For each: state what real behavior it approximates, what it remembers/forgets/overestimates,
and **what failure mode the harness might MISS** with it (the brief demands this honesty).

---

## 5. What "guided correctly" means — define the oracle and the metrics

The hard part is judging guidance quality WITHOUT just reading back the app's own mastery
flag (that's circular). The plan must define:

- A **ground-truth latent skill** the synthetic learner owns, independent of the app's
  estimate. "Correct guidance" = the app's `MasteryEstimate`/gate tracks the latent truth, the
  scaffold level matches the learner's real need, and transfer is only credited when latent
  transfer is real.
- **Primary metrics** (per persona + aggregate): mastery-signal validity (gate vs. latent),
  **false-positive mastery rate**, transfer success after scaffolds fade, time/reps-to-mastery,
  avoidance-recovery rate, "answers given away" count, mis-routing rate at walls.
- **Counter-metrics that catch self-deception** (brief requires): if reps-to-mastery drops, did
  false-positive rate rise? If the app gives more hints, did independence fall? If a param change
  helps synthetic learners, is it **overfit** (hold out a disjoint persona set / different
  generator seeds / unseen surface forms to test generalization)? Would a human educator agree
  with a sampled set of flagged failures (a human-agreement spot-check protocol)?

---

## 6. The recursive improvement loop (must produce evidence, not a number)

Specify a concrete first loop: baseline run → cluster failures (by persona × skill × decision)
→ propose a change (e.g. tune `params.ts` fadeStreakK / fluency band / wall θ, or adjust a
generator difficulty curve, or a policy rule) → re-run on the **same seeds** for comparison +
**held-out seeds/personas** for overfit detection → regression check (did any previously-passing
persona regress?) → a written verdict on real-progress-vs-gaming. Determinism is free here: the
engine fold and the generators are both seedable, so before/after diffs are exact.

---

## 7. Architecture constraints / preferences

- **Reuse the real engine.** The harness is a Node driver: build the persona event-emitter, the
  session runner (loop: nextDecision → generate problem via `generators/` → persona emits burst →
  measurementReduce → repeat), the metrics/oracle, and the report. Keep personas + harness in a
  new dir (suggest `web/harness/` or `tools/synthetic/`), engine untouched except possibly small
  pure helpers it already exposes.
- **No wall-clock in the fold.** Personas supply event timestamps (`t`) as data — that's how you
  simulate latency, fatigue, and session length deterministically. Honor KTD9.
- **Don't bend the engine to pass.** If a persona exposes a real flaw, the fix goes in
  params/policy/generators with justification — not in the harness to hide it.
- Match the repo's existing **plan document style** (see any file in `docs/plans/` — frontmatter,
  Summary, Problem Frame, Key Technical Decisions, Implementation Units with Files + Test
  scenarios + Verification, Risks, Open Questions). Write the plan to
  `docs/plans/<date>-NNN-feat-synthetic-challenger-harness-plan.md`.

---

## 8. Deliverables the plan must account for (from the brief)

Working harness; synthetic-learner design (latent state + emission params per persona); the
flow-under-test (this app's engine + generators + policy); evaluation method + oracle; baseline
vs. improved comparison; failure-mode report; recursive-improvement description; decision log;
research notes (fraction misconceptions, mastery-learning, BKT calibration, avoidance behavior);
**limitations memo** (what the harness can't see — e.g. anything the affect stub doesn't model,
real motivation, multi-session retention beyond the decay probe).

---

## 9. Watch-outs (so the plan doesn't fool itself)

- The synthetic learner's emission model and the app's measurement model must not share
  parameters, or you'll prove a tautology. Keep latent truth independent of `params.ts`.
- "Personas that always behave as labeled" are too easy — build in noise and inconsistency
  (the brief: inconvenient, evasive, irrational).
- A rising aggregate score with a worsening counter-metric is a **failure to report**, not a win.
- The affect channel is a typed stub today; don't claim attention/affect realism you can't emit.
  Model focus/attention through the behavioral signals that DO exist (latency, idle, oscillation,
  error drift) and say so.

Produce the plan. End it with the open questions you couldn't resolve from the repo.
