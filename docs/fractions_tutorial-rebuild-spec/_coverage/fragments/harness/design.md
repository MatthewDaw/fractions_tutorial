# Harness — design (architecture)

> Slice `harness` fragment. The synthetic-learner red-team harness:
> `web/src/harness/**`. It replays seeded persona×skill sweeps against the REAL
> engine (bound via `engineApi.js`) to red-team it for false-mastery /
> missed-escalation / false-transfer, emitting reproducible tape-projected reports.
> The engine, generators, and runtime it consumes are documented by their own
> slices and referenced here by pointer.

---

## 1. What the harness IS and WHY

A child cannot be put in a feedback loop to red-team an adaptive tutor safely, so
the harness is a population of **synthetic learners** (generative models of
children) driven headlessly against the same mastery engine the live app uses.
Its job is to catch the engine crediting mastery a child does not have, abandoning
a child who is stuck, or crediting transfer/independence on a spoofable proxy —
BEFORE a real child hits it. Everything is **pure and deterministic** (no
`Math.random`, no `Date`) so a finding is reproducible from a seed and a committed
tape, and every emitted document is a **pure projection** of those tapes (a
skeptic re-runs the seed and gets the same numbers).

WHY a separate harness and not just tests: the harness is a *red-team*, not a
spec. Its personas are deliberately **parameter-disjoint** from the engine's BKT
inference params (enforced by a lint — see ADR). If every persona were a
re-parameterisation of the engine's own BKT model, passing would prove nothing.

---

## 2. Layered architecture (data flow)

```
personas (generative children)        engine (REAL, via engineApi.js)
   model.js / library.js / families.js     measurementReduce / nextDecision / gate
   inverseErrors.js (misconception math)    generateFor / nextPractice / segment
            │                                         ▲
            ▼                                         │
     sessionRunner.runSession  ── drives the headless submit boundary ──┘
            │ emits the event burst segment() reads, advancing an INJECTED clock
            ▼
        signed tape  (tape.js: canonical, byte-identical replay)
            │
   ┌────────┼─────────────────────────────────────────────┐
   ▼        ▼                 ▼                ▼            ▼
 oracle   metrics          findings         search      recursiveLoop
 latentTruth aggregate     buildBacklog    searchNearestFlip  runLoop (sealed judge)
 labelTape  clusterFailures                distillChampions   replayChampions
   │        │                 │                │            │
   └────────┴──────► report.js (build*/render* → docs/harness/*.md) ◄──┘
                     │
                     └──► dashboard/** (same projections, in-browser)
```

The runner is the hub: it produces tapes; everything downstream is a pure read of
tapes (+ the static oracle probes). `cli.js` is the only `fs` sink.

---

## 3. The session runner — `sessionRunner.js::runSession` / `runSweep`

`runSession` is the **headless MIRROR of the live submit boundary**
(`useLessonEngine.js`, runtime-owned). It drives the REAL engine — no mock. Per
attempt it:

1. `measurementReduce(log, now)` → mastery (the real fold).
2. **BOUNDARY:** `nextDecision(policyState, mastery, recentBehavior, now)` called
   ONCE here (mirrors the judged boundary; R16 boundary-only).
3. `nextPractice(decision, practiceState)` → a spec, OR a terminal exit
   (ReturnToKitchen / RouteToRoom / EscalateToHuman).
4. `generateFor(skill, spec)` → problem.
5. `persona.emit(problem, ctx)` → attempt, with `ctx.rng = personaRng(persona.id,
   seed, step)`.
6. grade (`gradeAnswer`) + assemble JUDGED classifier fields, then append the full
   event burst.
7. update `PolicyState` EXACTLY as `useLessonEngine._updatePolicyState` does, fold
   again to push post-attempt P_known into `pKnownHistory`, apply the scaffold
   change (Fade +1 cap 4, Raise −1 floor 0), and record the tape step.

Key WHY decisions captured faithfully (NOT "fixed"):

- **Empty recentBehavior channel.** `EMPTY_RECENT_BEHAVIOR = {observations:[],
  isDisengaged:false}` mirrors the live `recentObsRef` that is allocated but never
  appended and a `disengagedCount` never incremented. This makes the engine's
  "disengaged" escalation trigger UNREACHABLE by construction — a real finding the
  oracle reports, not a bug the runner papers over.
- **STUCK escalation IS reachable** — floor scaffold (L0) + flat P_known over
  `nStuck` + heavy hints at floor. The runner drives PolicyState so a stuck persona
  reaches it.
- **`segment()` reads `answer_num`/`answer_den`** off the judged payload (not the
  live `answer_value`, which segment ignores). The burst emits BOTH so the tape
  carries meaningful Observations while still mirroring the boundary.
- **Injected clock** (`clock.t`, starts 1_000_000), advanced by intra-attempt
  deltas + latency. No wall-clock — replay-exact.

The event burst (`appendAttemptBurst`) emits exactly the shapes `segment()`
consumes: `problem_present`, N self-correction `piece_place`/`piece_remove`
oscillations, `hint_shown {rung}` (only if rung>0), `answer_submit`, and `judged`
(carrying correct, answer_value/num/den, error_signature, slip, target_num/den,
operands, too_fast_correct, `affect_window:[]`, etc.).

`runSweep({personaIds?, skillIds?, seed, stepCap, flags})` loops personas × skills,
building a **FRESH persona per pair** (session state must never leak). Default
skills = the 10 generator skills; default personas = the whole library.

`characterizeScriptedStage(skillId, seed)` is a documented READ-ONLY stub
recording the verified engine-vs-runtime divergence fact: the scripted-stage path
(`useLessonScaffold.js`, runtime-owned) advances on ONE correct, while the engine
path requires the full mastery gate. It is a stub because `useLessonScaffold` is a
React hook and cannot be driven headlessly without violating the no-React contract.

---

## 4. Personas — `personas/`

A persona is a `makePersona(spec)` (`model.js`): a generative model of a child
that samples correctness from ITS OWN latent skill (`truePknownBySkill` +
`learnRate`) plus slip/guess noise — NOT the engine's BKT. Wrong answers are
planted via the inverse-error map on the REAL operands so the engine fingerprints
them. Latency is a DRAW from a band (`{base, spread, fatiguePerStep}`) so
fatigue/attention make latency rise across a session. A fresh persona instance is
per-session (closure over a mutable `session = {step, pknownBySkill}`).

Persona contract:
`{ id, klass, latent, meta:{approximates, mightMiss}, truePKnown(skillId), emit(problem, ctx) }`;
`ctx = {skillId, level, surfaceForm, lastDecision, rng, step}`;
`attempt = {answer:[num,den]|null, latencyMs, hintRung, selfCorrections, modality, signals}`.

**Library (`library.js`)** — three groups:

1. *Ordinary BKT-shaped archetypes* (default emit): `fast-mastery`,
   `slow-but-steady`, `confident-guesser`, `memorizer` (passes its trained
   surface form, fails the other), `over-hinter`, `anxious-low-energy`,
   `short-attention` (latency climbs), `misconception-stable`, `low-reading`.
2. *Non-BKT laws + off-task*: `oscillator` (triangular-wave competence on period 7,
   coprime with engine `fadeStreakK`=3), `bimodal` (lucky-on-easy), `off-task`
   (null/timeout/`[NaN,NaN]` answers + idle signals, still well-formed).
3. *Audit spoofers*, each targeting ONE spoofable engine proxy:
   `same-answer-memorizer` (independence `answer_value` proxy),
   `denominator-transfer-spoofer` (transfer denominator proxy),
   `fast-shallow-guesser` (fluencyOk-always-true soft gate).

**Families (`families.js`)** — `trainFamily()` vs `heldOutFamily()` for the
sealed judge. Held-out draws latents from ranges DISJOINT from train on every
axis, uses a FRESH seed lineage, and uses genuinely NON-BKT emit laws
(`oscillatoryEmit`, `bimodalEmit`, `fluencySpoofEmit`). `fam-held-fluency-spoofer`
deliberately pins latent below τ so the held-out family carries a real
false-mastery defect — a defect-free held-out set could never certify an fm fix.

**Inverse errors (`inverseErrors.js`)** — given a problem + misconception id,
re-implements the misconception's buggy arithmetic on the real operands so the
engine's `classifyErrorSignature` fingerprints the planted answer as the intended
`ErrorSignature` (add_denominators, add_across_unlike, scaled_bottom_only,
forced_leftover, not_simplified) or collapses to `other` for cognitive
misconceptions (whole_number_bias, gap_thinking, denominator_neglect,
unit_fraction_inversion). HONESTY CAVEAT: for named signatures the map shares the
engine's arithmetic identity by construction, so the round-trip is a COVERAGE
check, not independent evidence the engine fingerprints correctly.

---

## 5. The oracle — `oracle/`

The oracle is the harness's ground-truth channel: it compares the engine's signal
(gate / escalation / transfer) against the persona's LATENT TRUTH.

- **`latentTruth.js::labelTape`** — per-tape labels:
  `falsePositiveMastery` (gate-open while latent < τ), `missedEscalation` (never
  escalated while latently stuck AND the reachable STUCK conditions held),
  `falseEscalation` (escalated while latently competent ≥ τ), `falseTransfer`
  (gate-open while latent < τ — a subset implicating the transfer dimension).
  `DEFAULT_TAU_LATENT = 0.8`, DELIBERATELY disjoint from the engine's
  `gateThreshold` 0.95: pinning τ to the engine's own threshold would make the
  oracle a tautology. Results are expected to be reported as a CURVE over τ.
- **`expectedFindings.js::runExpectedFindings`** — the SIX audited defects encoded
  as expected behavioral signatures, each tied to a diagnostic persona + the
  plan-002 flag that WILL resolve it. The human-agreement metric = fraction the
  harness reproduces (`present === true`). Flag honesty: a flags-ON run still shows
  the defects present (the flags are inert stubs).
- **`positiveControl.js`** — VERIFY-FIRST: catches a KNOWN defect (fluencyOk
  soft gate, gate opens at implausibly low median latency below the oracle's
  `PLAUSIBLE_COMPUTE_FLOOR_MS`=1500, disjoint from the engine's 1200).
  `blindControl(injectDefectFn)` accepts an externally-supplied defect injector so
  detection is not hand-tuned to one persona.
- **`invariants.js::checkInvariants`** — ground-truth-FREE metamorphic relations
  that must hold for ANY correct engine: surface-form permutation preserves the
  verdict; one extra correct never lowers P_known (monotonicity); a higher-slip
  twin never gates EARLIER (strict dominance).

---

## 6. Metrics + findings — `metrics.js`, `findings.js`

**`metrics.js`** folds an oracle-labeled population into a `MetricsRecord` whose
constructor THROWS if a HEADLINE metric lacks its COUNTER (KTD5 — a one-sided
flattering metric can never be built): `mastery_rate ⇒ false_mastery_rate +
evidence_count_at_gate_open`; `hints_given ⇒ independence_rate`; `reps_to_mastery
⇒ transfer_after_fade`. `clusterFailures` groups labeled failures by
`(persona_class, skill, decision_kind)` ranked by severity×count.

**`findings.js::buildBacklog`** projects tapes into a ranked, deduplicated backlog
of four categories (highest-first): dead/bypassed pedagogy (audit-corroborated),
hint-ladder gaps, Tier-2 nudge gaps, pedagogically-hard skills (composite-risk
ranked). Reconciliation: an audit-found weakness for a skill SUPPRESSES the
harness-found duplicate. `humanAgreementWith` = fraction of items corroborated by
the audit.

---

## 7. Adversarial search — `search.js`

`searchNearestFlip` is the red-team's "find the closest PLAUSIBLE child the engine
misjudges". Given an honest baseline persona it perturbs the latent vector + seed
inside a **plausibility box** (`LATENT_DIMS`; `pSlip<0.5`, `pGuess<0.5` — a learner
who slips/guesses more than half the time is not coherent), driving the REAL engine
via `runSession` until it finds a latent that FLIPS an engine decision against the
oracle, MINIMIZING distance to honest. Method: a light, gradient-free (μ,λ)
evolutionary loop (NOT CMA-ES); Gaussian mutation + seed jitter, every perturbation
clipped back into the box. A reported `{latent, seed}` replays the exact flip.
`searchCoverage` is a coverage-guided variant that keeps mutants reaching a NEW
`(decision_kind, skill, scaffold_level)` tuple.

---

## 8. Recursive loop + champions — `recursiveLoop.js`

`runLoop(change)` is the "did the change actually improve the engine, or just
overfit train?" gate. It runs BOTH families (train + the SEALED held-out family)
before and after, and only blesses a change `REAL` when the held-out family
improved on a target metric (`false_mastery_rate ↓` OR `transfer_after_fade ↑`)
AND the guardrail (transfer-on-novel-forms) did not degrade AND the
search-trials-deflated bar holds. `GAMING` ⟺ train improved but the seal did not
(or guardrail degraded / deflated bar failed). `NO_CHANGE` ⟺ neither family moved
(the inert 002 flags today). The held-out judge runs a DIFFERENT seed lineage
(`(seed ^ 0x5ea1ed) >>> 0`). Test hooks `perturbMetrics` / `perturbTapes` let a
test exercise REAL/GAMING/regression deterministically without 002 wiring a real
flag; absent in production.

`distillChampions` freezes the worst N adversaries as minimal `{latent, seed}`
replay fixtures (from a search corpus or raw sweep tapes). `replayChampions`
re-runs them against the current engine as a fast CI regression check (a champion
REGRESSES when its replay still reproduces a false-mastery flip).

---

## 9. Reports — `report.js`

`report.js` is the brief's required documents as PURE TAPE PROJECTIONS, split
`build*` (canonical data object) / `render*` (markdown string) so everything is
browser-safe (no `fs`). Documents: verdict cards (one per failure cluster, ranked
harm × plausibility × novelty), baseline report (clusters + counter-paired
metrics), decision log (loop changes + flags-off→on certification matrix),
limitations memo (every line grounded in a tape field or "(not observable)"),
research notes (the authored companion — the only non-projection). The
`ENGINE_PATH_SCOPE` banner is reused everywhere a certification claim is made:
results characterize the ENGINE PATH, not the live scripted-stage child experience.

---

## 10. Quarantine — `quarantine/`

Two QUARANTINED facets, hard-isolated from the tuning loop (they import NOTHING
from `search.js`/`recursiveLoop.js`, carry their OWN seed, and feed nothing back):

- **`chaos.js`** — chaos fault-injection on the Observation pipeline. Steady-state
  hypothesis: a single-field Observation fault should NOT flip a gate verdict.
  Every fault is on a deep CLONE (the original tape bytes are never mutated;
  asserted post-hoc). `assessFragility` reports flip + blast radius.
- **`llmDiscriminator.js`** — a BLIND Turing check: mixes blinded synthetic
  error-streams (actor stripped) with real ones, asks an injected `llmCall` which
  are FAKE, reports hit-rate vs chance + the static "tells". JUDGE-ONLY, never
  generates a persona, degrades gracefully (`skipped-no-llm` etc.) since no
  `/api/judge` proxy exists today.

---

## 11. Dashboard — `dashboard/`

The evaluator-facing dev-only demo route (`HarnessDashboard.jsx`): a master-detail
view — persona gallery rail, `FailureHeatmap` (persona×skill, each cell three
strips: false-mastery / false-transfer / missed-escalation), `RecursivePanel`
(baseline→tuned with the sealed held-out guard + REAL/GAMING/NO_CHANGE verdict),
and `VerdictCard`s (replayable failures with an in-browser step animation).
`data.js` are PURE projections (the SAME `report.js` + oracle projections the CLI
writes), so the demo and the headless reports never disagree. `runDemoSweep` runs
a SMALL representative subset in-browser; `replaySession` re-runs one session
against the current engine and flags terminal divergence vs the stored tape (the
stored tape stays authoritative).
