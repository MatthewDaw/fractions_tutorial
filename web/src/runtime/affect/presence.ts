// affect/presence.ts — Phase 4 (plan 005, S2): the presence/validity camera gate.
//
// The on-device MediaPipe Face Landmarker gate, reduced to its ONLY defensible job:
// disambiguate `idle` = *thinking/stuck* (a face IS present) vs. *left the room*
// (absent). It derives EXACTLY TWO BOOLEANS and nothing else:
//   • present      — one primary face is oriented at the screen, right now.
//   • sensor_valid — the sensor reading can be trusted (consent granted, camera up,
//                    a single lockable primary face, no occlusion/switch).
//
// HARD PRIVACY POSTURE (plan 005 §"Privacy & regulatory posture", Phase 4):
//   1. OPT-IN. The session starts CLOSED. No reading is accepted and the injected
//      landmarker is NEVER started until grantConsent() is called explicitly. There
//      is no auto-start path in this module.
//   2. ON-DEVICE ONLY. This module never receives, stores, or transmits a raw frame.
//      It consumes ONLY a FaceReading — the already-on-device, derived geometry
//      (bounding boxes + gaze-at-screen flag) the landmarker computed locally. No
//      pixels, no image buffer, no template, ever crosses this boundary.
//   3. SINGLE-PRIMARY-FACE LOCK. Exactly one face — the largest/nearest box — is
//      tracked. Multiple faces, or a switch of the locked face, INVALIDATE the
//      reading (a helping parent never feeds the child's signal).
//   4. NO EMOTION / VALENCE / AROUSAL. There is no FACS, no expression, no valence,
//      no arousal field anywhere in this file — auditable by inspection (ties to the
//      Phase-0 affect firewall). The output type is two booleans; the FaceReading
//      input type carries no expression channel for one to even read.
//   5. ADVISORY-ONLY. The Signal this emits (`presence` / `sensor_unavailable`) is
//      inert telemetry — the same Signal seam every behavioral detector uses. It has
//      NO path into gate.ts / the mastery engine. Presence is a corroborating channel
//      in the composite, never a control input to mastery.
//
// ENGINE PURITY: NO React, NO wall-clock. Time arrives only as an injected `t`
// (event timestamp), exactly like the behavioral detectors.

import type { Signal, Actor } from '../../engine/types.js';

// ---------------------------------------------------------------------------
// On-device inputs — DERIVED geometry only. No pixels.
// ---------------------------------------------------------------------------

/**
 * One detected face's on-device geometry. NOTE the absence of any expression /
 * valence / emotion field — by construction there is nothing here to infer mood
 * from. `area` is the normalized bounding-box area (proxy for nearest/largest).
 * `gazeAtScreen` is the landmarker's head-pose-oriented-at-screen boolean.
 */
export interface DetectedFace {
  /** Stable per-track id from the on-device landmarker (lets us detect a switch). */
  id: string;
  /** Normalized bounding-box area in [0,1]; bigger = nearer = the primary candidate. */
  area: number;
  /** On-device head-pose: is this face oriented at the screen? */
  gazeAtScreen: boolean;
}

/**
 * One on-device landmarker reading. This is the ENTIRE surface the camera exposes
 * to the rest of the app: a list of derived face boxes (no image data) plus a flag
 * for whether the camera pipeline itself produced a usable frame this tick.
 */
export interface FaceReading {
  /** Derived faces this tick (already computed on-device). Empty = nobody/seen nothing. */
  faces: DetectedFace[];
  /** False when the camera pipeline could not produce a usable frame (occlusion, dark, dropped). */
  cameraOk: boolean;
}

/**
 * The on-device landmarker adapter. INJECTED — this module never imports a camera
 * API. The adapter owns the MediaPipe Face Landmarker + getUserMedia and is the ONLY
 * place a real frame is ever touched; it hands back a FaceReading (derived geometry)
 * and never a pixel. start()/stop() gate the camera hardware.
 */
export interface FaceLandmarker {
  /** Acquire the camera + start on-device inference. Called ONLY after consent. */
  start(): Promise<void>;
  /** Release the camera. Called on revoke/close. */
  stop(): Promise<void>;
  /** The latest derived reading, or null if not started / nothing yet. */
  read(): FaceReading | null;
}

// ---------------------------------------------------------------------------
// The two booleans — the ENTIRE output of this gate.
// ---------------------------------------------------------------------------

export interface PresenceState {
  /** A single primary face is present and oriented at the screen. */
  present: boolean;
  /** The reading can be trusted (consent + camera up + one lockable primary face). */
  sensor_valid: boolean;
}

// A compile-time + runtime assertion that the public state is EXACTLY two booleans
// and carries no emotion/valence/arousal channel. Enforced by a test as well.
export const PRESENCE_STATE_KEYS = ['present', 'sensor_valid'] as const;

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------

export interface PresenceParams {
  /** Minimum normalized box area for a face to count as the lockable primary. */
  minPrimaryArea: number;
  /**
   * Two faces are "co-primary" (ambiguous → suppress) when the runner-up's area is
   * within this fraction of the leader's. A clear primary clears the lock.
   */
  coPrimaryRatio: number;
}

export const PRESENCE_PARAMS: PresenceParams = {
  minPrimaryArea: 0.02,
  coPrimaryRatio: 0.8,
};

// ---------------------------------------------------------------------------
// Consent + lifecycle state machine. CLOSED until explicit consent (opt-in).
// ---------------------------------------------------------------------------

export type ConsentPhase = 'unconsented' | 'consented' | 'revoked';

export interface PresenceSession {
  phase: ConsentPhase;
  /** True only between a successful start() and a stop(). */
  cameraRunning: boolean;
  /** The id of the currently locked primary face, or null. */
  lockedFaceId: string | null;
}

export function makeSession(): PresenceSession {
  // OPT-IN by construction: a fresh session is unconsented and the camera is OFF.
  return { phase: 'unconsented', cameraRunning: false, lockedFaceId: null };
}

/** True only when the user has explicitly opted in and not revoked. */
export function hasConsent(s: PresenceSession): boolean {
  return s.phase === 'consented';
}

// ---------------------------------------------------------------------------
// Primary-face lock — pick the largest/nearest oriented face; suppress ambiguity.
// ---------------------------------------------------------------------------

interface LockResult {
  /** The single primary face, or null when none qualifies / ambiguous. */
  primary: DetectedFace | null;
  /** True when ≥2 faces are co-primary (a helping parent in frame) → suppress. */
  ambiguous: boolean;
}

function lockPrimaryFace(faces: readonly DetectedFace[], params: PresenceParams): LockResult {
  const eligible = faces.filter((f) => f.area >= params.minPrimaryArea);
  if (eligible.length === 0) return { primary: null, ambiguous: false };

  const sorted = [...eligible].sort((a, b) => b.area - a.area);
  const leader = sorted[0];
  const runnerUp = sorted[1];

  // Co-primary → ambiguous → suppress (can't safely lock one child's face).
  if (runnerUp && runnerUp.area >= leader.area * params.coPrimaryRatio) {
    return { primary: null, ambiguous: true };
  }
  return { primary: leader, ambiguous: false };
}

// ---------------------------------------------------------------------------
// Derive the two booleans from one reading, under the consent + lock rules.
// ---------------------------------------------------------------------------

export interface DeriveResult {
  state: PresenceState;
  /** Why the sensor was invalid, if it was — for the sensor_unavailable Signal payload. */
  invalidReason: 'unconsented' | 'camera_down' | 'multiple_faces' | 'face_switched' | null;
  /** The session AFTER this reading (primary-face lock may advance). */
  session: PresenceSession;
}

/**
 * Derive {present, sensor_valid} from one on-device reading.
 *
 * The ONLY two booleans leave this function. `sensor_valid` is false (and a
 * `sensor_unavailable` Signal is warranted) whenever the reading can't be trusted:
 * no consent, camera down, multiple/co-primary faces, or the locked face switched.
 */
export function derivePresence(
  session: PresenceSession,
  reading: FaceReading | null,
  params: PresenceParams = PRESENCE_PARAMS
): DeriveResult {
  // Privacy gate: without consent, NOTHING is derived. present=false (absent),
  // sensor_valid=false (we are not even allowed to look).
  if (!hasConsent(session)) {
    return {
      state: { present: false, sensor_valid: false },
      invalidReason: 'unconsented',
      session,
    };
  }

  if (!reading || !reading.cameraOk) {
    return {
      state: { present: false, sensor_valid: false },
      invalidReason: 'camera_down',
      session: { ...session, lockedFaceId: null },
    };
  }

  const { primary, ambiguous } = lockPrimaryFace(reading.faces, params);

  if (ambiguous) {
    // A second person in frame → suppress so a helper never feeds the child's signal.
    return {
      state: { present: false, sensor_valid: false },
      invalidReason: 'multiple_faces',
      session: { ...session, lockedFaceId: null },
    };
  }

  if (!primary) {
    // Camera is fine and trustworthy, but nobody is there → valid + absent.
    return {
      state: { present: false, sensor_valid: true },
      invalidReason: null,
      session: { ...session, lockedFaceId: null },
    };
  }

  // Single-primary-face lock: a SWITCH of the locked face invalidates this tick
  // (we re-lock on the next reading) so a parent taking over doesn't read as present.
  if (session.lockedFaceId !== null && session.lockedFaceId !== primary.id) {
    return {
      state: { present: false, sensor_valid: false },
      invalidReason: 'face_switched',
      session: { ...session, lockedFaceId: primary.id },
    };
  }

  // Valid, single, locked primary face. present = oriented at the screen.
  return {
    state: { present: primary.gazeAtScreen, sensor_valid: true },
    invalidReason: null,
    session: { ...session, lockedFaceId: primary.id },
  };
}

// ---------------------------------------------------------------------------
// Signal emission — inert telemetry on the SAME seam the behavioral detectors use.
// `presence` carries the two booleans; `sensor_unavailable` (Phase-0 reserved type)
// fires when the reading is invalid so occlusion never masquerades as attention:away.
// ---------------------------------------------------------------------------

export interface PresenceEmitContext {
  t: number;
  actor: Actor;
  context_hash?: string;
}

/**
 * Build the advisory Signal for a derived presence reading. Returns null in the
 * `present && sensor_valid` case where there is nothing to corroborate.
 *
 * FIREWALL: this is a Signal (inert telemetry). It has NO path to gate.ts. It is
 * consumed only as a corroborating channel in the affect composite.
 */
export function presenceSignal(d: DeriveResult, ctx: PresenceEmitContext): Signal | null {
  if (!d.state.sensor_valid) {
    return {
      type: 'sensor_unavailable',
      confidence: 1,
      t: ctx.t,
      actor: ctx.actor,
      payload: {
        reason: d.invalidReason,
        // ONLY the two booleans + reason. No expression/valence field exists to leak.
        present: d.state.present,
        sensor_valid: d.state.sensor_valid,
        context_hash: ctx.context_hash ?? null,
      },
    };
  }

  if (d.state.present) return null; // present + valid → nothing to flag.

  // Valid reading, primary face absent → the disambiguating "left the room" signal.
  return {
    type: 'presence',
    confidence: 1,
    t: ctx.t,
    actor: ctx.actor,
    payload: {
      present: false,
      sensor_valid: true,
      context_hash: ctx.context_hash ?? null,
    },
  };
}

// ---------------------------------------------------------------------------
// Lifecycle — consent-gated camera start/stop. start() refuses without consent.
// ---------------------------------------------------------------------------

/**
 * Grant explicit, opt-in consent and start the on-device landmarker.
 * Without this call the landmarker is NEVER started. Idempotent.
 */
export async function grantConsentAndStart(
  session: PresenceSession,
  landmarker: FaceLandmarker
): Promise<PresenceSession> {
  const consented: PresenceSession = { ...session, phase: 'consented' };
  if (!consented.cameraRunning) {
    await landmarker.start();
  }
  return { ...consented, cameraRunning: true };
}

/**
 * Revoke consent and release the camera. After this, derivePresence returns
 * unconsented and the landmarker is stopped.
 */
export async function revokeConsentAndStop(
  session: PresenceSession,
  landmarker: FaceLandmarker
): Promise<PresenceSession> {
  if (session.cameraRunning) {
    await landmarker.stop();
  }
  return { phase: 'revoked', cameraRunning: false, lockedFaceId: null };
}

// ---------------------------------------------------------------------------
// Ablation gate — the SHIP / DON'T-SHIP decision, derived from the ledger.
// ---------------------------------------------------------------------------

export interface AblationParams {
  /**
   * Minimum absolute gain in cost-weighted precision presence must add over the
   * behavior-only baseline to justify shipping the camera. The bar the design sets:
   * "ships only if presence-gating measurably cuts false idle-nags / improves
   * intervention precision in the ledger vs. behavior-only."
   */
  minPrecisionGain: number;
}

export const ABLATION_PARAMS: AblationParams = {
  minPrecisionGain: 0.05,
};

/** A ledger report shape (subset) — see runtime/affect/ledger.report(). */
export interface LedgerReportLike {
  costWeightedPrecision: number;
  falseInterventionCost: number;
}

export interface AblationDecision {
  ship: boolean;
  /** Cost-weighted-precision gain (presence − behaviorOnly). */
  precisionGain: number;
  /** False-intervention cost reduction (behaviorOnly − presence); positive = fewer false nags. */
  falseInterventionReduction: number;
  baseline: LedgerReportLike;
  withPresence: LedgerReportLike;
  bar: number;
  /** Human/regulator-legible rationale tied to the numbers. */
  rationale: string;
}

/**
 * The ablation gate. Compares the precision ledger WITH presence-gating against the
 * behavior-only baseline and returns a SHIP / DON'T-SHIP decision derived from the
 * numbers — never an assertion. The design explicitly permits "don't ship the camera".
 */
export function ablationGate(
  baseline: LedgerReportLike,
  withPresence: LedgerReportLike,
  params: AblationParams = ABLATION_PARAMS
): AblationDecision {
  const precisionGain = withPresence.costWeightedPrecision - baseline.costWeightedPrecision;
  const falseInterventionReduction = baseline.falseInterventionCost - withPresence.falseInterventionCost;

  // Ship only if presence MEASURABLY beats behavior-only on cost-weighted precision
  // AND does not increase false-intervention cost.
  const ship = precisionGain >= params.minPrecisionGain && falseInterventionReduction >= 0;

  const rationale = ship
    ? `SHIP: presence-gating raised cost-weighted precision by ${precisionGain.toFixed(3)} ` +
      `(bar ${params.minPrecisionGain}) and cut false-intervention cost by ` +
      `${falseInterventionReduction} vs behavior-only.`
    : `DON'T SHIP: precision gain ${precisionGain.toFixed(3)} ` +
      `${precisionGain >= params.minPrecisionGain ? 'met' : 'missed'} the ${params.minPrecisionGain} bar; ` +
      `false-intervention reduction ${falseInterventionReduction}. ` +
      `Behavior-only is sufficient — the camera does not earn its place (plan 005 Open Q4).`;

  return {
    ship,
    precisionGain,
    falseInterventionReduction,
    baseline,
    withPresence,
    bar: params.minPrecisionGain,
    rationale,
  };
}

/**
 * Run the ablation gate and LOG the decision (the deliverable the improvement file
 * demands: "a logged ship/don't-ship decision from the ledger"). Returns the decision
 * so callers/tests can assert on it; logging is a side effect on the injected sink.
 */
export function decideAndLog(
  baseline: LedgerReportLike,
  withPresence: LedgerReportLike,
  log: (line: string) => void = (line) => console.info(line),
  params: AblationParams = ABLATION_PARAMS
): AblationDecision {
  const decision = ablationGate(baseline, withPresence, params);
  log(`[presence ablation] ${decision.rationale}`);
  return decision;
}
