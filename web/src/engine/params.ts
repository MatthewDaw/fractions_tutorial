// params.ts — centralized tunables (KTD10).
// All measurement parameters live here so the Phase-3 synthetic harness can tune them
// without code changes. ENGINE PURITY: NO React imports, NO wall-clock calls.

export interface BktParams {
  /** Probability of learning (transition from unknown → known after one attempt). */
  P_T: number;
  /** Probability of slip (known → wrong answer). */
  P_S: number;
  /** Probability of guess (unknown → correct answer). */
  P_G: number;
}

export interface EscalationParams {
  /** Number of attempts stuck at floor scaffold with no P_known gain before escalation. */
  nStuck: number;
  /** Number of sustained disengaged/avoiding observations before escalation. */
  nDiseng: number;
  /**
   * U9/KTD7: separate, LOWER disengagement threshold that arms the frustration
   * SCAFFOLD (a reachable RaiseScaffold), DECOUPLED from `nDiseng` (which arms
   * EscalateToHuman). The disengagement writer feeds `disengagedScaffoldCount`,
   * NOT `disengagedCount`, so wiring the scaffold trigger never spuriously fires
   * the (never-built handoff) escalation path. Read only when
   * PARAMS.frustrationScaffold is on.
   */
  nDisengScaffold: number;
}

export interface EngineParams {
  /** Global BKT transition/emission parameters. Per-node overrides in SkillNode.bkt_params. */
  bkt: BktParams;
  /** Default cold-start prior P(known) before any prerequisite propagation. */
  P_L0: number;
  /** Prerequisite propagation weight: how much a strong prereq raises the child prior. */
  prereqWeight: number;
  /**
   * Clamp applied to the cold-start prior after prerequisite propagation.
   * [min, max] — prevents vacuous certainty at both extremes.
   */
  priorClamp: readonly [number, number];
  /**
   * Clamp applied to P_known after every BKT update.
   * Distinct from priorClamp so the model can represent near-mastery.
   */
  pKnownClamp: readonly [number, number];
  /** P_known threshold at which the mastery gate opens (Chain A). */
  gateThreshold: number;
  /** Wall-detection predicted-success threshold θ below which WALL_HIT fires. */
  wallTheta: number;
  /** Number of consecutive clean (hint-free, in-band) corrects required to fade scaffold. */
  fadeStreakK: number;
  /** Number of errors within a lesson segment required to raise scaffold. */
  raiseErrorsM: number;
  /** Minimum number of correct observations before fluency is evaluated. */
  fluencyMinN: number;
  /**
   * Discount factor applied to the prerequisite BKT update when an error_signature
   * implicates a prereq (DAG credit assignment, U6).
   */
  creditDiscount: number;
  /**
   * Plausible-compute latency floor (ms). A correct answer below this threshold is
   * flagged too_fast_correct → forces a transfer probe (false-positive guard, KTD3).
   */
  latencyFloorMs: number;
  /**
   * When true, fluency (speed) becomes a HARD gate conjunct. ACTIVATED (default
   * true) now that the age-band latency target below is calibrated (KTD2,
   * improvements/2026-06-08-activate-fluency-hardmode.md). REVERSIBLE: flip back to
   * false (or pass `fluencyHardMode:false` via the harness flag overlay) to restore
   * the pre-calibration soft/advisory behavior with zero other code changes.
   */
  fluencyHardMode: boolean;
  /**
   * Calibrated age-band latency CEILING (ms) used by fluencyOk when fluencyHardMode
   * is on: a median over-target latency fails the fluency conjunct. Calibrated from
   * the age-band schedule in docs/design/student-state-measurement.md §4.2 (see the
   * calibration commitment table in the improvements doc). Reversible via PARAMS.
   */
  fluencyLatencyTargetMs: number;
  /**
   * Calibrated PLAUSIBLE-COMPUTE FLOOR (ms) for fluency: in hard mode a median
   * latency BELOW this floor is treated as implausibly fast (a guess/UI-did-it
   * stream, NOT genuine fluency) and FAILS the fluency conjunct. This closes the
   * leniency trap where an implausibly fast "answer" stream silently opened the gate
   * (harness finding `fluencyOk-always-true`). Set STRICTER than the too-fast-correct
   * latencyFloorMs — it fails the fluency conjunct outright rather than merely forcing
   * a transfer probe. Soft/advisory mode ignores it.
   */
  fluencyPlausibleFloorMs: number;
  /**
   * U9: when true, a frustration RaiseScaffold (≥ raiseErrorsM errors) responds with
   * a WARM, reachable-foothold rationale instead of the neutral one — the felt wall
   * stays, but a step is always one tap away (productive-failure-under-12 evidence).
   * Default false until trigger sensitivity is observed on a tablet (reversible).
   */
  frustrationScaffold: boolean;
  /**
   * 002 U7 R9 (T09): when true, CERTIFICATION (isMastered) requires at least one
   * PASSED DELAYED retention probe — distinguishing ACQUIRED (the four in-session
   * Chain-A conjuncts all green) from durable MASTERED (the skill also survived a
   * spaced, out-of-session probe). In-session evidence alone (P_known + independence
   * + transfer + fluency) yields only ACQUIRED while this flag is on; durable mastery
   * additionally needs est.delayed_probe_passed === true (stamped by
   * decay.applyProbeResult on a CORRECT probe).
   *
   * GATED-THREE / REVERSIBLE: DEFAULT false so behavior is BYTE-IDENTICAL to today
   * (the conjunct is skipped entirely — a node that has never been probed still
   * certifies exactly as before). Flip to true (product-wide) or drive it via the
   * harness flag overlay (delayedProbe → requireDelayedProbe) to require durable
   * mastery. The demotion-on-FAIL path (applyProbeResult clears transfer + drops
   * P_known) is independent of this flag and is unaffected by the default-off setting.
   */
  requireDelayedProbe: boolean;
  /**
   * T27 (round-2 escalation competence-guard): when true, the STUCK
   * human-escalation trigger additionally requires evidence that the learner is
   * NOT succeeding — i.e. LOW recent accuracy / low P_known — before escalating.
   * This closes the lone over-strict (false-escalation) error in the harness: an
   * over-hinter on MULT_EQUAL_GROUPS at GENUINE mastery (latent 0.9314) whose
   * P_known had simply gone flat NEAR THE CEILING was read as "stuck" (heavy hints
   * + flat trajectory) and handed to a human, when they should be nudged (Tier-2),
   * not escalated.
   *
   * The guard reads ONLY the stuck trigger's competence signal (recent P_known
   * level / recent-attempt accuracy). It does NOT touch the disengaged escalation
   * counter (disengagedCount / nDiseng, T03) or consecutiveErrors.
   *
   * REVERSIBLE / DEFAULT-OFF: default false so behavior is byte-identical to today
   * (a flat-at-low-level genuinely-stuck learner still escalates exactly as before).
   * Flip to true — product-wide or via the harness flag overlay — to add the
   * competence guard. The escalateCompetenceFloor below is the level at/above which
   * a flat-and-heavily-hinted learner is treated as succeeding (nudge, not escalate).
   */
  escalationCompetenceGuard: boolean;
  /**
   * T27: P_known level at/above which a flat-trajectory, heavily-hinted learner is
   * judged to be SUCCEEDING (a ceiling plateau, not a stuck plateau) and is NOT
   * escalated when escalationCompetenceGuard is on. Set just below the gate so a
   * near-/at-gate plateau (the latent-0.9314 over-hinter) reads as competence, while
   * a low plateau (the genuinely-stuck learner) still escalates. Read only when
   * escalationCompetenceGuard is on.
   */
  escalateCompetenceFloor: number;
  /**
   * T22 (round2 gate-hardening) — Misconception-persistence guard. When true,
   * isMastered ALSO requires the last N recent attempts to be misconception-free
   * (no error_signature), so a stable misconception blocks the gate until cleared.
   * DEFAULT false ⇒ the conjunct is skipped entirely and the gate is byte-identical
   * to today. Pedagogy choice (documented): N=2 consecutive misconception-free
   * attempts (misconceptionFreeWindowN). REVERSIBLE: flip back to false to restore.
   */
  requireMisconceptionFree: boolean;
  /** T22: how many trailing attempts must be misconception-free under the flag. */
  misconceptionFreeWindowN: number;
  /**
   * T23 (round2 gate-hardening) — Pre-acquisition debounce. When true, isMastered ALSO
   * requires a STABLE estimate (est.estimate_stable: N=2 consecutive in-band corrects /
   * non-decreasing trend) AND at least stableEstimateEvidenceFloor gate-relevant evidence
   * attempts before banking Mastered, so the gate cannot open several steps before latent
   * crosses τ. DEFAULT false ⇒ conjunct skipped, byte-identical to today. REVERSIBLE.
   */
  requireStableEstimate: boolean;
  /** T23: evidence-count floor (gate-relevant attempts) required before mastery under the flag. */
  stableEstimateEvidenceFloor: number;
  /** T23: consecutive in-band corrects required for est.estimate_stable to be true. */
  stableEstimateWindowN: number;
  /**
   * T24 (round2 gate-hardening) — τ-band calibration. When true, the gate uses the
   * STRICTER P_known bar (strictGateThreshold) instead of gateThreshold, chosen so
   * population false_mastery is bounded (target ≤0.20) at the committed τ=0.85.
   * DEFAULT false ⇒ the gate uses gateThreshold and is byte-identical to today.
   * REVERSIBLE. See strictGateThreshold below for the chosen value + rationale.
   */
  strictGateThreshold: boolean;
  /**
   * T24: the stricter P_known bar applied when strictGateThreshold is on. Chosen value
   * 0.985 (vs the 0.95 default). RATIONALE: the red-team curve has false_mastery rising
   * 0.34→0.60 across τ .80→.90, steepest .85→.90; the gate constant was not tied to a
   * committed τ. Committing to τ=0.85 and raising the BKT posterior bar from 0.95→0.985
   * shifts the gate-open point materially later on the BKT trajectory (the slip/guess
   * BKT with P_S=0.10,P_G=0.20 still climbs to 0.985 on a genuinely-known stream, but a
   * misconception-/guess-driven stream that plateaus around 0.95–0.97 no longer banks),
   * targeting false_mastery ≤0.20 at τ=0.85. The exact aggregate is certified by T28.
   */
  strictGateThresholdValue: number;
  /**
   * T25 (round2 gate-hardening) — Per-skill transfer-probe requirement. When the flag
   * is on AND a node's id is listed here, isMastered ALSO requires ≥1 correct attempt at
   * a VARIED surface_form (est.varied_transfer_forms ≥ 1), the independent transfer signal
   * (T13). DEFAULT false ⇒ conjunct skipped for all skills, byte-identical to today.
   * Rollout per-skill: the list starts with FRACTION_ON_LINE (highest false-transfer risk).
   * REVERSIBLE: clear the flag or remove a skill from the list.
   */
  requireTransferProbe: boolean;
  /** T25: skills for which the varied-transfer-probe conjunct is enforced when the flag is on. */
  transferProbeSkills: readonly string[];
  /** Escalation trigger thresholds. */
  escalation: EscalationParams;
}

export const PARAMS: EngineParams = {
  bkt: {
    P_T: 0.20,
    P_S: 0.10,
    P_G: 0.20,
  },
  P_L0: 0.10,
  prereqWeight: 0.3,
  priorClamp: [0.05, 0.85],
  pKnownClamp: [0.01, 0.99],
  gateThreshold: 0.95,
  wallTheta: 0.6,
  fadeStreakK: 3,
  raiseErrorsM: 2,
  fluencyMinN: 5,
  creditDiscount: 0.3,
  latencyFloorMs: 1200,
  // GATED-THREE / REVERSIBLE: the hard-mode CAPABILITY is built, calibrated, and
  // routed through PARAMS (so a flags-ON run — production or harness overlay —
  // tightens the gate), but the DEFAULT stays false so the rollback is the no-op
  // fallback and the verify-first positive control (which pins the default/soft
  // engine) stays valid. Flip to true to activate hard mode product-wide; the
  // age band + plausibility floor below are already calibrated for it. See
  // improvements/2026-06-08-activate-fluency-hardmode.md (calibration schedule).
  fluencyHardMode: false,
  // Calibrated age-band ceiling (was the 15_000 lenient placeholder): a plausible
  // upper bound on an 8–11yo's median fraction-compute latency for the M1 skills.
  fluencyLatencyTargetMs: 8_000,
  // Plausible-compute floor: a median below this is too fast to be GENUINE fluency
  // (a guess / UI-did-it stream). STRICTER than the too-fast-correct latencyFloorMs
  // (1200) — that guard only forces a transfer probe; this one fails the fluency
  // conjunct outright. Set at the red-team oracle's plausible-compute floor (1500ms,
  // positiveControl.PLAUSIBLE_COMPUTE_FLOOR_MS) so the engine's own hard-mode gate
  // refuses exactly the implausibly-fast streams the oracle audits for.
  fluencyPlausibleFloorMs: 1_500,
  frustrationScaffold: false,
  // GATED-THREE / REVERSIBLE: the delayed-probe certification gate CAPABILITY is
  // built and routed through PARAMS (gate.ts reads this at call time), but the
  // DEFAULT stays false so certification is byte-identical to today (in-session
  // ACQUIRED == durable MASTERED when off). Flip to true — product-wide or via the
  // harness delayedProbe overlay — to require a passed delayed probe for durable
  // mastery. The applyProbeResult demotion-on-fail path is independent of this flag.
  requireDelayedProbe: false,
  // T27 / REVERSIBLE: the escalation competence-guard CAPABILITY is built and routed
  // through PARAMS (policy.ts reads this at call time), but the DEFAULT stays false so
  // escalation is byte-identical to today (a genuinely-stuck low-P_known learner still
  // escalates). Flip to true — product-wide or via the harness flag overlay — to stop
  // escalating a heavy-hint-BUT-succeeding learner (they get nudged via Tier-2 instead).
  escalationCompetenceGuard: false,
  // Competence floor: a flat-and-heavily-hinted plateau AT/ABOVE this P_known level reads
  // as a ceiling plateau (succeeding) rather than a stuck plateau. Set just below the
  // gateThreshold (0.95) so the latent-0.9314 over-hinter is spared while a low plateau
  // (the genuinely-stuck learner) still escalates. Read only when the guard is on.
  escalateCompetenceFloor: 0.85,
  // T22 — Misconception-persistence guard. DEFAULT off so the gate is byte-identical
  // to today; flip to true to require the trailing N attempts be misconception-free.
  requireMisconceptionFree: false,
  misconceptionFreeWindowN: 2,
  // T23 — Pre-acquisition debounce. DEFAULT off; flip to true to require a stable
  // estimate (N=2 consecutive in-band corrects) AND an evidence floor of 10 before mastery.
  requireStableEstimate: false,
  stableEstimateEvidenceFloor: 10,
  stableEstimateWindowN: 2,
  // T24 — τ-band calibration. DEFAULT off (uses gateThreshold 0.95). When on, raises the
  // P_known bar to 0.985 targeting false_mastery ≤0.20 at the committed τ=0.85 (see the
  // interface comment for the rationale; aggregate certified by T28).
  strictGateThreshold: false,
  strictGateThresholdValue: 0.985,
  // T25 — Per-skill transfer-probe requirement. DEFAULT off; rollout list starts with the
  // highest false-transfer-risk skill, FRACTION_ON_LINE (red-team risk 0.804).
  requireTransferProbe: false,
  transferProbeSkills: ['FRACTION_ON_LINE'],
  escalation: {
    nStuck: 6,
    nDiseng: 5,
    nDisengScaffold: 3,
  },
};
