# Research notes — synthetic-learner design write-up

_Authored companion to the synthetic-challenger harness (rubric Req 8: synthetic-learner
design). This is a HAND-AUTHORED design document, not a tape projection. The harness CLI
also emits a short generated stub of the same filename via `report.js
renderResearchNotesMarkdown()`; that stub is the literature-pointer skeleton, and THIS file
is its expanded, code-grounded form. Citations point at the live tree
(`web/src/harness/**`) so every claim is checkable._

The synthetic-learner population is the harness's red-team payload: a set of generative
child models the engine must be judged against. The whole apparatus is only a real test if
the population is (a) varied enough to surface distinct failure modes, (b) NOT a re-skin of
the engine's own mastery model (else passing it is a tautology), and (c) split into a train
set and a SEALED held-out set so "the fix helped" cannot be confused with "the fix overfit."
This note records the design rationale behind those three properties.

---

## (a) BKT-shaped vs non-BKT archetypes — what each models

The engine infers mastery with a Bayesian Knowledge Tracing (BKT, Corbett & Anderson 1995)
posterior `P_known` that it folds forward, one observation at a time, toward a gate threshold
(0.95). A persona that was *also* a BKT process — just with different constants — would, if
the engine handled it, prove only that the engine's arithmetic matches the persona's
arithmetic. That is the tautology the design avoids.

So the population is deliberately split into two generative shapes:

- **BKT-shaped archetypes** model a child whose *true* `P_known` rises monotonically with
  correct reps (`model.js:155-159`: a correct attempt nudges `truePknown` toward 1 by
  `learnRate`). These are the "ordinary learner" baselines — they let the harness check that
  the engine credits mastery *when mastery is real*. They are parameter-disjoint from the
  engine's BKT (the disjointness lint `test_param_disjointness` forbids importing
  `engine/params.ts` anywhere under `personas/` — see the header in `personas/model.js:11-16`),
  but they share the monotone shape. What each BKT archetype models, in the cognitive-modeling
  vocabulary the rubric asks for:
  - **remember / acquire** — `fast-mastery` (truePknown 0.7, learnRate 0.2): masters in a few
    reps. `slow-but-steady` (0.3 / 0.08): the same acquisition, but it needs more reps.
  - **misunderstand** — `misconception-stable` (`library.js:113`): a fixed, strong
    misconception (`add_across_unlike`, strength 0.97) that does NOT decay when confronted;
    the wrong answer is planted on the real operands via the inverse-error map so the engine
    fingerprints the misconception, not just a generic miss.
  - **overestimate (its own competence) / guess** — `confident-guesser` (pGuess 0.45, low
    latency): lands lucky often and fast, so the engine sees corrects that are not knowledge.
  - **lean / avoid effort** — `over-hinter` (hintAppetite 0.6): gets corrects by ringing
    hints rather than by knowing, stressing the independence counter-metric.
  - **fatigue / disengage within a session** — `short-attention`, `anxious-low-energy`,
    `low-reading`: latency rises and idle signals climb across the session (the `drawLatency`
    fatigue term, `model.js:250-256`), modeling attention loss without an affect channel.

- **Non-BKT archetypes** model children whose true competence does NOT follow a monotone BKT
  curve at all, so the engine's core modeling assumption is itself under test (`library.js:143`,
  `families.js:66-73`):
  - **forget / non-monotone competence** — `oscillator` and the held-out `fam-held-osc`: a
    triangular competence wave on period 7, learns-then-forgets. The period is held coprime
    with the engine's `fadeStreakK` (=3) on purpose, and hardcoded as a literal *rather than
    imported* (`library.js:22-24`) so a fade streak never accidentally aligns with a
    competence peak — that would let the engine "get lucky" on a forgetting child.
  - **lucky-on-easy / collapse-on-hard** — `bimodal` and held-out `fam-held-bimodal`: high P
    on easy levels, near-chance on hard ones (`library.js:159`), so a single scalar mastery
    estimate is structurally wrong.
  - **fluent-but-shallow (false mastery)** — the held-out `fam-held-fluency-spoofer`
    (`families.js:155-173`): correctness DECOUPLED from latent skill — reliably correct out of
    surface fluency, never learns, latent PINNED below τ. This is the held-out family's
    deliberate false-mastery defect (see (c)).

**Why BKT-shaped at all, then?** Because most real children mostly *are* monotone learners,
and the harness must verify the engine works on them before it stresses the edges. The
non-BKT set exists precisely to catch where the monotone assumption fails.

---

## (b) The 12 PDF archetypes — implemented / approximated / omitted

The synthetic_challenger.pdf rubric (Req 1) enumerates twelve learner archetypes. The table
below maps each to the live persona id(s) and states whether it is a **first-class**
implementation (its own persona entry with a bespoke or tuned emit law), an **approximation**
(covered by a nearby persona but not modeling the archetype's defining mechanism), or an
**intentional omission** (no persona, by design, with the reason).

| # | PDF archetype                          | Status        | Persona id(s) / evidence |
|---|----------------------------------------|---------------|--------------------------|
| 1 | quick master                           | implemented   | `fast-mastery` (`library.js:32`) |
| 2 | slow / persistent learner              | implemented   | `slow-but-steady` (`library.js:43`) |
| 3 | rote memorizer (templates one form)    | implemented   | `memorizer` (`library.js:66`, `memorizerEmit`) — masters trained surface form, fails the other |
| 4 | confident guesser                      | implemented   | `confident-guesser` (`library.js:54`) |
| 5 | hint-dependent / over-hinter           | implemented   | `over-hinter` (`library.js:78`, hintAppetite 0.6) |
| 6 | entrenched-misconception child         | implemented   | `misconception-stable` (`library.js:113`) |
| 7 | off-task / disengaged refuser          | implemented   | `off-task` (`library.js:172`, `offTaskAttempt`) |
| 8 | learns-then-forgets (non-monotone)     | implemented   | `oscillator` (`library.js:148`) + held-out `fam-held-osc` |
| 9 | lucky-on-easy / collapses-on-hard      | implemented   | `bimodal` (`library.js:159`) + held-out `fam-held-bimodal` |
| 10| bored high-skill (needs challenge)     | implemented (T15) | `bored-high-skill` (`library.js:185`, `boredHighSkillEmit`) |
| 11| performance-oriented / "I-get-it"-mover | implemented (T16) | `performance-oriented` (`library.js:208`, `performanceOrientedEmit`) |
| 12| socially-motivated (performs when watched) | **intentionally OMITTED** | no persona; see `limitations-memo.md` |

**The two that are NOT first-class.** Of the twelve, exactly two are not ordinary
implemented personas:

- **#12 socially-motivated** is the one fully **omitted**. It is documented, not built:
  `docs/harness/limitations-memo.md` (the socially-motivated note added under T19) explains
  WHY. The harness is a headless state-machine driver; there is no `observed: true/false`
  bit on the problem context, no affect/social channel, and no social-reward term in any emit
  law. The archetype's two defining behaviors — "performs differently when observed" and
  "answers to please rather than to understand" — have *no observable surface* in a headless
  session tape (every run is unwatched and authority-free by construction). A stub persona
  emitting a slightly higher correct rate would be indistinguishable from a confidence-tuned
  BKT archetype already in the library, so it would paper over a structural channel gap rather
  than model the archetype. The limitations memo names exactly what would be needed: (a) an
  `observed` flag the runner can flip between runs (the plan-005 Phase-4 presence/validity gate
  would provide it), and (b) a social-reward term shifting `pGuess`/`pSlip` when `observed`.
  Until both exist, the rubric's "name what you miss" requirement is better served by the memo
  than by a cosmetic imitation.

- **#10 bored-high-skill** and **#11 performance-oriented** were the two archetypes that had
  **zero implementation** in the original 11-ticket build (audit B, T15/T16) and were added as
  first-class personas in this pass. They were not approximated by anything earlier:
  `fast-mastery` just succeeds cleanly (no disengagement), and the spoofers target engine
  proxies, not the "I-get-it-but-don't-learn" mover. They now have bespoke non-BKT emit laws
  (boredom drift and surface-lock respectively — see below).

**Approximation notes (not a clean 1:1):**

- Archetypes 8 and 9 (forget, lucky-on-easy) appear *twice* — once as a visible library
  persona and once inside the held-out family — because the held-out copy must use a fresh
  seed lineage and disjoint latents to serve as the sealed judge (see (c)). They are the same
  archetype, different family role.
- The three **audit spoofers** (`same-answer-memorizer`, `denominator-transfer-spoofer`,
  `fast-shallow-guesser`, `library.js:230-283`) are NOT among the twelve learner archetypes;
  they are a separate red-team layer targeting specific *engine proxies* (the independence
  `answer_value` proxy, the transfer `denominator` proxy, and the always-true soft fluency
  gate). They model "a child who games a known engine weakness," which the PDF treats under
  avoidance/gaming (Req 5/7), not under the learner-archetype taxonomy.

**The two new non-BKT laws, briefly:**

- `bored-high-skill` (`boredHighSkillEmit`, `library.js:309`): competence is HIGH and stable
  (truePknown 0.85, learnRate 0.02), but a boredom signal rises with session step —
  `pBoredomError` grows linearly to 0.25 at step 20 (deliberate wrong answers from a competent
  child who has stopped trying, NOT slips), plus a 120 ms/step boredom-latency drift and
  rising idle signals. Distinct from `fast-mastery` (clean success), `off-task` (full
  refusal), and `short-attention` (rising latency from *moderate* skill, not high).
- `performance-oriented` (`performanceOrientedEmit`, `library.js:403`): optimizes for
  advancing the gate, not for learning. Moderate latent skill (0.5) and a near-zero learnRate
  (0.01) — enough lucky-correct runs to open the gate while true skill never improves — with
  hint-free, moderately-fast-but-above-the-floor latency (base 1800 ms, never flagged
  `too_fast`) and a surface-form lock so the tape shows ≤1 distinct `surface_form`. That last
  property is what makes the oracle's `falseTransfer` fire once the gate opens (see (c)/(d)),
  and it is testable precisely because T13 made transfer detection independent of mastery.

---

## (c) Train vs held-out family design — the overfit guard

The population is partitioned into a **train family** and a **sealed held-out family**
(`personas/families.js`). The split is the harness's defense against the engine — or the fix
under test — overfitting to the exact personas it was tuned on.

The held-out family differs from train on three axes simultaneously
(`families.js:1-8`, `:24-49`):

1. **Disjoint latent ranges.** Every latent axis has NON-overlapping train vs held-out bands
   (`TRAIN_RANGES` vs `HELDOUT_RANGES`): e.g. `truePknownDefault` is train `[0.25, 0.6]` vs
   held-out `[0.62, 0.9]`; `learnRate` train `[0.05, 0.12]` vs held-out `[0.13, 0.25]`;
   `pSlip` train `[0.04, 0.12]` vs held-out `[0.13, 0.3]`, and so on across nine axes. A
   held-out persona is therefore *never* a re-roll of a train persona's parameters.
2. **Fresh seed lineage.** Held-out personas draw from a separate `personaRng` lineage
   (`'heldout-lineage:*'`, seed base 9000) distinct from train (`'train-lineage:*'`, base
   1000), so a "win" can't be an artifact of a shared seed.
3. **Genuinely non-BKT generative laws.** Where possible the held-out members use
   *qualitatively different* dynamics (oscillatory, bimodal, fluency-decoupled —
   `families.js:82-173`) rather than re-rolled BKT constants. This is the review-A3
   requirement: the held-out form is not just a different parameterization of the same law.

**Why this guards against overfit — the tie to `recursiveLoop`.** The improvement loop
(`recursiveLoop.js`) runs BOTH families before and after a proposed change and blesses it
`REAL` only when the *held-out* family improved on a target metric AND an off-limits
guardrail (transfer-on-novel-forms) did not degrade (`recursiveLoop.js:307-323`):

- `REAL` ⟺ held-out improved (deflated for search trials) ∧ guardrail held.
- `GAMING` ⟺ train moved but the sealed held-out did NOT bless it — which is *exactly what
  overfitting looks like*: a change that helps the personas you tuned on but not ones drawn
  from disjoint ranges with different laws.
- `NO_CHANGE` ⟺ neither family moved.

Because the held-out set is sealed (the change author never tunes against it) and is both
parameter-disjoint and law-disjoint from train, a fix that merely memorized the train
personas cannot move the held-out metrics and is caught as `GAMING`. The held-out
`fam-held-fluency-spoofer` is load-bearing here: a held-out family the engine *already*
handles perfectly (false-mastery ≡ 0) could never *measure* a false-mastery fix, since an
already-zero rate cannot improve. So the sealed judge is intentionally seeded with at least
one live false-mastery defect (`families.js:251-273`). The deflated pass-rate
(`deflatedImprovement`, Bonferroni-ish over `searchTrials`) further discounts a single lucky
trial so a search cannot fish a held-out "improvement" out of noise.

A known limit of this guard is recorded in the limitations memo: held-out controls for
seed/surface overfit, but NOT for a *systematic* error shared by the author, the held-out
personas, and the fix (same designer, same blind spot).

---

## (d) "Learning" vs "avoidance" — what the harness exposes vs misses

The oracle (`oracle/latentTruth.js`) is the ground-truth channel. It compares the ENGINE's
signal (gate, escalation, transfer credit) against the persona's LATENT TRUTH (its true
`P_known` and known generative law), judged on an INDEPENDENT bar `τ_latent = 0.8` —
deliberately *disjoint* from the engine's own 0.95 gate threshold so the oracle is not a
restatement of the engine's arithmetic (`latentTruth.js:8-29`). Per the file header, results
are meant to be reported as a CURVE over τ (sweep 0.7…0.9), never a single point.

**What counts as "learning."** A persona has genuinely *learned* a skill when its latent
`truePknown` rises and crosses τ — i.e. correct reps drove a real BKT update (`model.js:155`),
or the non-BKT law actually reaches competence. The engine is *right* when it opens the gate
for such a child and escalates/holds for one whose latent stays below τ.

**What counts as "avoidance" (gaming).** A persona produces engine-pleasing *surface*
behavior — corrects, clean runs, climbed scaffolds — WITHOUT the latent rise. The oracle
fingerprints four such failure modes (`LABEL_KINDS`, `latentTruth.js:38-43`):

- **`falsePositiveMastery`** — a gate opens while latent < τ (`latentTruth.js:160`). The
  fluency-spoofers and `performance-oriented` lucky-run gating are the canonical sources.
- **`falseTransfer`** — the gate opens but the session never varied `surface_form`
  (`hasNoSurfaceVariation`, `latentTruth.js:132-189`): transfer credited without structural
  breadth. Critically, T13 made this signal INDEPENDENT of latent < τ (it reads
  `observation.surface_form` off the tape, not a mastery proxy), so `false_transfer_rate` is
  no longer a duplicate of `false_positive_mastery_rate` — a real, separately-detectable
  avoidance mode. `performance-oriented`'s surface-lock is built to trip exactly this.
- **`missedEscalation`** — a latently-stuck child the engine never escalated, where the
  reachable STUCK trigger conditions held (`latentTruth.js:170-172`). Abandonment, the
  opposite failure.
- **`falseEscalation`** — escalated a child who was actually competent (≥ τ).

The counter-metric pairing (`metrics.js:33-64`) makes avoidance *visible by construction*:
every flattering headline must carry its counter or the `MetricsRecord` constructor throws —
`mastery_rate ⇒ false_mastery_rate + evidence_count_at_gate_open`,
`hints_given ⇒ independence_rate`, `reps_to_mastery ⇒ transfer_after_fade`. A one-sided
"95% mastered" record cannot even be serialized. This is the Goodhart discipline: you cannot
report the score the engine optimizes without simultaneously reporting the gaming detector.

**Failure modes the harness EXPOSES:** false mastery on shallow-fluent / lucky-correct
children; false transfer on surface-locked children; missed escalation on the reachable STUCK
path; hint-dependence masquerading as independence; the three spoofable engine proxies
(answer_value distinctness, denominator-as-transfer, always-true fluency gate); and overfit
fixes (via the sealed held-out judge).

**Failure modes the harness MISSES (per the limitations memo, each grounded):**

- **Affect** (focus, frustration, motivation) is not measured — only approximated through
  latency drift, idle signals, oscillation, and error climb. No affect-repair channel, so
  e.g. `anxious-low-energy` cannot model recovery-after-reassurance.
- **The "disengaged" escalation trigger is UNREACHABLE** on this path: the runner mirrors the
  live empty `recentBehavior` channel (`disengagedCount` never increments), so off-task
  escalation is only modeled via the STUCK trigger. `missedEscalation` therefore targets the
  STUCK path only.
- **Cross-session retention** is not modeled (the retention-probe path is dead); forgetting is
  visible only *within* a session as oscillatory competence.
- **Socially-motivated behavior** (#12) — no observation/social channel exists, so the whole
  archetype is out of reach (see (b)).
- **Persona realism is asserted, not earned**: the blind LLM discriminator needs the `/api`
  proxy + a real-error corpus, absent in this run.
- **Engine-path vs child-experience gap**: results characterize the ENGINE path; the live
  scripted-stage runtime advances on a single correct and underuses this engine, so a certified
  engine-path win is not yet a certified child-experience win.

---

## References (literature that shaped the design)

- **BKT** — Corbett & Anderson (1995), *Knowledge tracing: modeling the acquisition of
  procedural knowledge*. Underlies the engine's `P_known` fold; personas are deliberately
  parameter- and (for held-out) law-disjoint from it.
- **Gaming / off-task / carelessness taxonomy** — Baker et al. Informs the misbehavior
  classes (off-task refuser, fast-but-shallow guesser, hint-leaning over-hinter) and the
  learning-vs-avoidance framing in (d).
- **Goodhart's law / held-out discipline** — motivates the sealed held-out judge, the
  deflated (walk-forward) pass-rate, and the headline⇒counter-metric pairing.
- **Fraction misconceptions** — add-numerators-and-denominators (a/b + c/d → (a+c)/(b+d)) is
  the canonical unlike-denominator error; the inverse-error map plants it on the real operands
  so the engine fingerprints `add_denominators`. Whole-number bias, gap thinking, denominator
  neglect, and unit-fraction inversion lack a dedicated fingerprinter and are traced by the
  planted `answer_value`, not the engine `error_signature`.

_Source anchors: `web/src/harness/personas/{library,families,model}.js`,
`web/src/harness/oracle/latentTruth.js`, `web/src/harness/metrics.js`,
`web/src/harness/recursiveLoop.js`, `docs/harness/limitations-memo.md`._
