// types.ts — THE CONTRACT: the public wire DTOs for the knowledge-prediction engine.
// These are also the future Python FastAPI wire types (swap fetch at U11 call sites only).
// ENGINE PURITY: NO React imports, NO wall-clock calls anywhere in this file.

// ---------------------------------------------------------------------------
// Primitive enumerations
// ---------------------------------------------------------------------------

export type Modality = 'tap' | 'type' | 'handwriting' | 'voice';

/** human = the real child; synthetic:persona = a harness-driven test persona */
export type Actor = 'human' | `synthetic:${string}`;

/** Design scaffold levels L0 (max support) → L4 (independent). */
export type ScaffoldLevel = 0 | 1 | 2 | 3 | 4;

// ---------------------------------------------------------------------------
// Events (append-only log entries)
// ---------------------------------------------------------------------------

export interface Action {
  type: string;
  payload: Record<string, unknown>;
  modality: Modality;
  /** Injected timestamp (ms epoch) — no wall-clock inside the engine fold. */
  t: number;
  actor: Actor;
}

export interface Signal {
  type: string;
  payload: Record<string, unknown>;
  /** Confidence [0,1] for the detected signal. */
  confidence: number;
  /** Injected timestamp (ms epoch). */
  t: number;
  actor: Actor;
}

export type Event = Action | Signal;

// ---------------------------------------------------------------------------
// Observation — rich per-attempt emission (KTD3 / measurement §4.7.4 step 2)
// ---------------------------------------------------------------------------

/** Named misconception fingerprints from the room docs. */
export type ErrorSignature =
  | 'add_denominators'       // 2/7+3/7 → 5/14 (adds both numerator AND denominator)
  | 'add_across_unlike'      // 1/2+1/3 → 2/5 (adds tops and bottoms straight across)
  | 'scaled_bottom_only'     // scales denominator without scaling numerator
  | 'forced_leftover'        // improper→mixed conversion error
  | 'not_simplified'         // answer correct value but not in lowest terms
  // --- 006 O1: multiplication misconceptions (m1/m2/m3) ---
  | 'add_factors'            // a×b → a+b (added the factors instead of multiplying)
  | 'skip_count_drift'       // skip-count that drifts off the multiple (off by ±one group)
  | 'array_perimeter'        // rows×cols → 2(rows+cols) (counted the border, not the area)
  | 'distributive_add_parts' // summed the split sizes instead of the partial products
  | 'other'                  // any other recognisable wrong pattern
  | null;                    // correct, or no pattern recognised

export interface Observation {
  /** Was the final submitted answer judged correct? */
  correct: boolean;
  /** The submitted answer as a [numerator, denominator] pair, or null if non-fraction. */
  answer_value: [number, number] | null;
  /** Fingerprinted wrong-answer misconception category. */
  error_signature: ErrorSignature;
  /** ms from problem_present to answer_submit. */
  latency: number;
  /** Highest hint rung shown (0 = no hint). */
  hint_max_rung: number;
  /** Count of place/remove oscillations within this attempt. */
  self_corrections: number;
  /** Design L0–L4 scaffold level at which this attempt was made. */
  scaffold_level: ScaffoldLevel;
  modality: Modality;
  /**
   * Confidence [0,1] from the handwriting recognizer when modality==="handwriting";
   * null for other modalities.
   */
  recognizer_confidence: number | null;
  /**
   * True when a CORRECT answer came in below the plausible-compute latency floor —
   * false-positive guard; triggers a transfer probe at the next boundary.
   */
  too_fast_correct: boolean;
  /**
   * Stable problem identifier for this attempt (emitted by the generator/runtime
   * seam). Used by isIndependent for true structural distinctness instead of the
   * answer_value proxy. Optional so pre-seam observations still typecheck.
   */
  problem_id?: string;
  /** Structural surface-form key for this attempt (transfer distinctness). Optional. */
  surface_form?: string;
  /**
   * Affect window stub — always an empty array now; will carry MediaPipe face landmark
   * signals when the on-device camera is integrated.
   */
  affect_window: readonly never[];
}

// ---------------------------------------------------------------------------
// Fluency statistics
// ---------------------------------------------------------------------------

export interface FluencyStats {
  /** Median latency (ms) over the last N correct attempts. null if N < fluencyMinN. */
  median_latency: number | null;
  /** Slope of latency over those N attempts (ms per attempt). null if N < fluencyMinN. */
  slope: number | null;
  /** Number of correct attempts used for this estimate. */
  n: number;
}

// ---------------------------------------------------------------------------
// MasteryEstimate — per-node knowledge state (the stable public interface, R8)
// ---------------------------------------------------------------------------

export interface MasteryEstimate {
  /** BKT posterior P(known) ∈ [0.01, 0.99]. */
  P_known: number;
  /** Fluency statistics; fluency_ok = soft gate (advisory pre-calibration). */
  fluency_stats: FluencyStats;
  /** Highest ScaffoldLevel on which the child answered correctly, hint-free. */
  max_scaffold_passed: ScaffoldLevel | null;
  /**
   * True when ≥2 correct answers on ≥2 structurally distinct surface_forms,
   * hint-free, at low scaffold, latency in band.
   */
  transfer_passed: boolean;
  /** Fraction of recent corrects that required hint_rung ≥ H2. */
  hint_dependence: number;
  /**
   * Timestamp (ms epoch) of the most recent retention probe, or null if no probe
   * has fired. Injected by the caller — never read from wall-clock inside the engine.
   */
  last_retention_probe: number | null;
  /**
   * Timestamp (ms epoch) at which this node FIRST satisfied the mastery gate, or
   * null if never mastered. Persists across a later demoting retention probe, so a
   * lapsed node still reads as "was mastered" (needs-review). Derived in the reduce
   * from logged judged timestamps — never wall-clock.
   */
  mastered_at: number | null;
  /**
   * 002 U7 R9 (T09): true once this node has PASSED at least one DELAYED retention
   * probe — the durable-mastery signal that distinguishes ACQUIRED (in-session
   * Chain-A green) from durable MASTERED. Stamped by decay.applyProbeResult on a
   * CORRECT probe and never cleared by a later failed probe (the lapse drops P_known
   * + transfer instead, which re-closes the gate on those conjuncts). Read by the
   * gate ONLY when PARAMS.requireDelayedProbe is on; ignored (and may be undefined)
   * when the flag is off, so the flag-off path is byte-identical to today. Optional
   * so pre-T09 estimate literals still typecheck and default to "no passed probe".
   */
  delayed_probe_passed?: boolean;
}

// ---------------------------------------------------------------------------
// Decision — discriminated union (KTD7; R9 — no DeclareMastered)
// ---------------------------------------------------------------------------

interface DecisionBase {
  /** One-line rationale surfaced to the child and logged (KTD8). */
  rationale: string;
}

export interface DecisionPresentProblem extends DecisionBase {
  kind: 'PresentProblem';
  node: string;
  scaffold: ScaffoldLevel;
  surface_form: string;
}

export interface DecisionRouteToRoom extends DecisionBase {
  kind: 'RouteToRoom';
  node: string;
}

export interface DecisionReturnToKitchen extends DecisionBase {
  kind: 'ReturnToKitchen';
  recipe: string;
}

export interface DecisionFadeScaffold extends DecisionBase {
  kind: 'FadeScaffold';
}

export interface DecisionRaiseScaffold extends DecisionBase {
  kind: 'RaiseScaffold';
  /**
   * Always true — the engine never clears in-progress work on a re-scaffold.
   * The lesson component applies the raised level while preserving the child's state.
   */
  preserveWork: true;
}

export interface DecisionTransferProbe extends DecisionBase {
  kind: 'TransferProbe';
  node: string;
}

export interface DecisionEscalateToHuman extends DecisionBase {
  kind: 'EscalateToHuman';
  reason: string;
  /** Recent log entries rendered as human-readable text for the teacher/parent. */
  handoff_packet: string;
}

export type Decision =
  | DecisionPresentProblem
  | DecisionRouteToRoom
  | DecisionReturnToKitchen
  | DecisionFadeScaffold
  | DecisionRaiseScaffold
  | DecisionTransferProbe
  | DecisionEscalateToHuman;

// ---------------------------------------------------------------------------
// SkillNode — the DAG vertex (KTD11)
// ---------------------------------------------------------------------------

export interface SkillNode {
  /** Stable identifier, e.g. 'ADD_SAME_DEN'. */
  id: string;
  /** The live rooms.js room id this skill maps to ('r1'–'r5'). */
  roomId: string;
  /** Ids of prerequisite SkillNodes (empty array for root nodes). */
  prereqs: readonly string[];
  /**
   * Ordered list of surface-form keys available at each design scaffold level.
   * Index = ScaffoldLevel; each entry lists the surface-form keys offered at that level.
   */
  scaffold_ladder: readonly (readonly string[])[];
  /** Keys identifying structurally distinct problem surface forms for transfer probes. */
  transfer_forms: readonly string[];
  /** Per-node BKT parameters; if absent, global PARAMS.bkt is used. */
  bkt_params?: {
    P_T: number;
    P_S: number;
    P_G: number;
    P_L0: number;
  };
  /** Optional CCSS standard codes this node addresses (e.g. ['3.NF.A.2']). */
  standards?: string[];
  /** Optional CCSS grade band ('3' | '4' | '5'). */
  grade?: string;
}
