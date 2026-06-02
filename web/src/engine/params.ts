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
   * When true, fluency (speed) becomes a HARD gate conjunct. Default false
   * (soft/advisory) until age-band latency targets are calibrated (KTD2, reversible).
   */
  fluencyHardMode: boolean;
  /** Latency ceiling (ms) used by fluencyOk when fluencyHardMode is on. Lenient default. */
  fluencyLatencyTargetMs: number;
  /**
   * U9: when true, a frustration RaiseScaffold (≥ raiseErrorsM errors) responds with
   * a WARM, reachable-foothold rationale instead of the neutral one — the felt wall
   * stays, but a step is always one tap away (productive-failure-under-12 evidence).
   * Default false until trigger sensitivity is observed on a tablet (reversible).
   */
  frustrationScaffold: boolean;
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
  fluencyHardMode: false,
  fluencyLatencyTargetMs: 15_000,
  frustrationScaffold: false,
  escalation: {
    nStuck: 6,
    nDiseng: 5,
  },
};
