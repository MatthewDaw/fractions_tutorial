# Completeness Audits — gap-build-260609 (net-new gaps beyond the original 11 tickets)

Two independent read-only audits run 2026-06-09 during the build, triggered by the
question "will this complete ALL gaps, and will `docs/inspiration/synthetic_challenger.pdf`
be FULLY complete?" Both went looking for gaps the 2026-06-08 compliance pass missed.

- **Audit A — plan-coverage** (all 9 plans vs live `web/src/**`): 7 of 9 plans covered-fully;
  2 net-new gaps, both at the harness↔engine certification seam.
- **Audit B — rubric-coverage** (`synthetic_challenger.pdf` vs live harness): 7 net-new gaps.
  Blunt verdict: with the original 11 tickets, the project does **NOT** fully satisfy the PDF.

Each gap below is a ticket. File:line evidence is from the live tree at merge of T01 (`e650a10`).

---

## Audit A — plan-coverage net-new gaps

### T12 — Harness flag→PARAMS plumbing is an inert stub (P2) — PREREQUISITE FOR T07
- **Plan/unit:** 02-001 harness U13 (R8/R13) + U5 flag-parameterization.
- **Gap:** the harness threads its flags into the session *tape* but never applies them to engine
  `PARAMS`, so any flags-on sweep is a no-op and U13 certification can never produce a real verdict.
- **Evidence:** `web/src/harness/config.js:14,18` ("arg-backed today; PARAMS-backed once 002 wires it");
  `web/src/harness/sessionRunner.js:405,547-548` (flags → tape only); no `withParams/setParams` override
  anywhere in `harness/` or `engine/params.ts`. `docs/harness/decision-log.md:9` logged
  `76b15b73 → 76b15b73 … NO_CHANGE`, all six defects ❌. **Premise is stale:** 002 U1 already routes
  PARAMS through `gate.ts:33,64` + `policy.ts:159,458` + `params.ts:62,93` — the harness just never
  flips it.
- **Fix scope:** add a PARAMS-override path the loop can drive for the flags-on sweep (apply a
  `{fluencyHardMode, frustrationScaffold, ...}` overlay to the engine PARAMS used by `sessionRunner`,
  resettable between sweeps); update the stale "flags are inert" comments. Keep edits under
  `web/src/harness/**`. **Without T12, T07's flags-on sweep yields NO_CHANGE regardless of the fix.**
- **Route:** plan-implementer. **Depends on:** [] (engine PARAMS routing already exists). **Blocks:** T07.

### T09 (SCOPE-UPGRADED) — Build the delayed-probe certification gate (P2, was mis-ticketed P3)
- **Plan/unit:** 02-002 activate-dormant U7 R9.
- **Gap:** "certification requires a passed delayed probe (Acquired ≠ durable Mastered)" is genuinely
  unbuilt — no flag, no `isMastered` conjunct, no `Acquired` state. The old ticket
  (`2026-06-08-delayed-probe-default.md`) mischaracterizes it as "built, default-off, P3 — schedule a flip."
- **Evidence:** `grep delayedProbe|requireDelayedProbe|durable|Acquired` over `engine/**` → zero hits;
  `engine/gate.ts` `isMastered` gates only on P_known+independence+transfer+fluency; the demotion-on-fail
  half exists (`measurementReduce.ts:305` `applyProbeResult`) but the gating half does not.
- **Fix scope:** reversible PARAMS flag (default off) → when on, `isMastered` requires ≥1 passed delayed
  probe; distinguish Acquired (in-session) from durable Mastered; keep `applyProbeResult`; named test in
  `test_gate.test.ts` (flag-on+no-probe → not mastered; flag-on+passed probe → mastered; flag-off → today).
  ENGINE INVARIANTS apply (engine-guardian gates). Gated-three: flag stays OFF by default.
- **Route:** plan-implementer. **Depends on:** [].

---

## Audit B — synthetic_challenger.pdf rubric net-new gaps

### T13 — False-transfer oracle is a duplicate of false-mastery (P1) — HIGHEST RISK
- **Rubric:** Req 4 (outcome eval) + Req 7 (counter-metrics).
- **Gap:** `oracle/latentTruth.js:155-163` defines `ftSteps` identically to `fpSteps` — `falseTransfer`
  fires exactly when `falsePositiveMastery` does, so `false_transfer_rate === false_positive_mastery_rate`
  (`metrics.js:206-208`). The harness *claims* to detect transfer separately from mastery but provably
  does not. A skeptic reading `latentTruth.js:162` rejects the transfer-detection claim immediately.
- **Fix scope:** give the oracle an independent "latent transfer absent" signal not derived from
  latent<τ — e.g. gate opened with zero `surface_form` variation across attempts, or only one
  `scaffold_level` seen (the child never climbed). Read `observation.surface_form` off the tape.
  De-conflate the metric. **Route:** harness-triage. **Depends on:** [].

### T14 — Research notes are stub-level, not a design write-up (P2) — HIGHLY VISIBLE
- **Rubric:** Req 8 (synthetic-learner design write-up).
- **Gap:** `docs/harness/research-notes.md` is 22 lines / 4 stub bullets. No reviewer accepts it as the
  required design write-up.
- **Fix scope:** expand to 1–2 pages: BKT vs non-BKT archetype rationale; which of the 12 PDF archetypes
  were implemented/approximated/skipped and why; held-out/train family design (disjoint ranges, non-BKT
  laws) as the overfit guard; approach limitations beyond the per-item limitations memo. **Route:** docs.
  **Depends on:** [] (but best authored after personas T15/T16/T19 land so it describes the final set).

### T15 — Bored-high-skill persona absent (P2)
- **Rubric:** Req 1 (personas). 2 of 12 PDF archetypes have zero implementation.
- **Evidence:** `web/src/harness/personas/library.js` — no high-`truePknown` (≥0.8) persona that also
  disengages/drifts. `fast-mastery` just succeeds fast; `off-task` is full refusal.
- **Fix scope:** add a persona (truePknown ~0.85, learnRate ~0.02) with a boredom-drift emit law (latency
  rises across session, occasional intentional errors). ~20–30 lines. **Route:** harness-triage. Deps: [].

### T16 — Performance-oriented / "I-get-it"-mover persona absent as first-class archetype (P2)
- **Rubric:** Req 1 (personas) + Req 5 (avoidance). Distinct from the proxy-targeting spoofers.
- **Fix scope:** add `performance-oriented` persona: moderate truePknown (~0.5), low hint appetite,
  moderately-fast latency (not implausibly fast), very low learnRate (doesn't actually learn), moderate
  pSlip — gate opens on lucky-correct runs, transfer fails (testable once T13 makes transfer independent).
  **Route:** harness-triage. **Depends on:** [] (synergy with T13). 
- *Note:* if the PDF treats "I-get-it"-mover and "performance-oriented" as one archetype, T16 collapses into one persona.

### T17 — Tau-latent curve missing from artifacts (P2)
- **Rubric:** Req 8 (evaluation-method). `latentTruth.js` header MANDATES reporting over a τ curve;
  `docs/harness/baseline-report.md` reports a single τ=0.8. PDF explicitly warns against single-point estimates.
- **Fix scope:** add a τ-sensitivity table (sweep 0.7/0.75/0.8/0.85/0.9 of `false_mastery_rate` +
  `missed_escalation_rate`) to `report.js`/`cli.js` output + `baseline-report.md`. **Route:** harness-triage. Deps: [].

### T18 — Joint counter-metric signals absent (P2)
- **Rubric:** Req 7. The PDF requires cross-conditioned gaming detectors; the harness has the scalars but
  not the joint checks.
- **Fix scope:** add to `MetricsRecord`: `transfer_per_mastery_gain` (transfer vs mastery rise — catches
  "score up, transfer flat") and `hint_independence_divergence` = hints_given·(1−independence_rate)
  (catches "hints up, independence down"). **Route:** harness-triage. **Depends on:** [T13] (needs real transfer).

### T19 — Socially-motivated persona absent (P3) — may be deferred with explicit memo
- **Rubric:** Req 1. Hardest to model in a headless engine (no affect/social channel).
- **Fix scope:** either a minimal approximation (performatively-high hint-ringing with flat latent →
  surfaces as hints-up/independence-flat) OR — if not feasible — explicitly acknowledge the omission in
  `docs/harness/limitations-memo.md`. **Route:** pedagogy-curriculum-reviewer (define) + harness-triage (impl). Deps: [].

### T07 scope note (existing ticket) — certify-one vs document-the-rest
- T07 certifies only `disengaged-never-escalates`. The other 5 audit defects stay "present ❌" in the
  decision-log matrix. T07 must either certify them too (more loop iterations) or explicitly state in the
  decision log why only one was certified this pass. Add this to T07's acceptance.

---

## Verdict (Audit B, verbatim intent)
With all 11 original tickets done, the project will **not** fully satisfy the PDF. To FULLY satisfy it:
build **T13** (oracle independence — provably-wrong claim, P1), **T12** (harness can certify at all),
**T14** (real research notes), **T15/T16** (missing personas), **T17** (τ curve), **T18** (joint
counter-metrics); **T19** (socially-motivated) is P3 and may be deferred if the limitations memo names it.
Confidence: HIGH (gaps are literal code reads, not judgment calls — esp. T13 at `latentTruth.js:162`).
