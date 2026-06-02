// observe/detectors.ts — Phase 1 (plan 005, S1): behavioral Signal detectors.
//
// The sensor-free floor. Each detector derives a behavioral Signal from ONE
// attempt's event span — the same span segment() consumes ("one signal path").
//
// FIREWALL: detectors emit Signal events ONLY. They never mutate the span and
// never touch game state. A Signal is inert telemetry; nothing here can reach
// the mastery gate (the Signal type makes that structural). Every emitted Signal
// carries a `context_hash` in its payload (Phase 0 seam) so emissions are
// sliceable after the fact without a Signal-type change.
//
// ENGINE PURITY: NO React imports, NO wall-clock calls. Time arrives only as
// event timestamps (event.t).

import type { Event, Action, Signal, Actor } from '../types.js';

// ---------------------------------------------------------------------------
// Tunables (hand-seeded; persona warm-start re-seeds in Phase 5 — O2)
// ---------------------------------------------------------------------------

export interface DetectorParams {
  /** Largest inter-event gap (ms) above which an `idle` Signal fires. */
  idleThresholdMs: number;
  /** Gap (ms) at/above which the idle is a sharp transient (survives smoothing). */
  transientIdleMs: number;
  /** Standardized residual (z) at/above which `latency_stall` fires (when established). */
  stallZ: number;
  /**
   * Fractional-residual fallback: fire stall when residualMs ≥ expectedMs·stallFrac,
   * even if z is small — covers a near-zero-spread child whose z is degenerate.
   */
  stallFrac: number;
  /** Removals within scribbleWindowMs at/above this count → `scribble_burst` transient. */
  scribbleCount: number;
  /** Window (ms) over which scribbleCount removals must occur. */
  scribbleWindowMs: number;
}

export const DETECTOR_PARAMS: DetectorParams = {
  idleThresholdMs: 5_000,
  transientIdleMs: 8_000,
  stallZ: 2.0,
  stallFrac: 1.0,
  scribbleCount: 5,
  scribbleWindowMs: 2_000,
};

// ---------------------------------------------------------------------------
// Behavior context (for provenance + the residual/floor reads)
// ---------------------------------------------------------------------------

export interface BehaviorContext {
  /** Design scaffold level at emission. */
  scaffoldLevel: number;
  /** Highest hint rung shown so far at emission. */
  hintState: number;
  /** BKT P_known at emission. */
  pKnown: number;
  /** Actor the Signal is attributed to (mirrors the attempt's actor). */
  actor: Actor;
  /** Stable item identifier, if known. */
  itemId?: string;
}

/** Residual summary from observe/baseline.latencyResidual. */
export interface ResidualSummary {
  residualMs: number;
  z: number;
  expectedMs: number;
  established: boolean;
}

// ---------------------------------------------------------------------------
// Action vocabulary
// ---------------------------------------------------------------------------

const WORK_TYPES = new Set([
  'piece_place', 'piece_add', 'value_set', 'num_set', 'stroke', 'ink_stroke',
]);
const REMOVE_TYPES = new Set([
  'piece_remove', 'piece_lift', 'value_clear', 'num_clear', 'ink_clear',
]);

function isActionEvent(ev: Event): ev is Action {
  return !('confidence' in ev);
}

function actions(span: readonly Event[]): Action[] {
  return span.filter(isActionEvent);
}

// ---------------------------------------------------------------------------
// context_hash — compact, deterministic (FNV-1a). Phase 0 seam carried in
// payload until the seam owner promotes it to a first-class Signal field.
// ---------------------------------------------------------------------------

export function contextHash(ctx: BehaviorContext): string {
  const key = [
    ctx.itemId ?? '',
    ctx.scaffoldLevel,
    ctx.hintState,
    Math.round(ctx.pKnown * 1000),
  ].join('|');
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

// ---------------------------------------------------------------------------
// Signal assembly — single place that stamps context_hash + actor
// ---------------------------------------------------------------------------

function makeSignal(
  type: string,
  t: number,
  confidence: number,
  ctx: BehaviorContext,
  payload: Record<string, unknown>
): Signal {
  return {
    type,
    confidence: Math.min(1, Math.max(0, confidence)),
    t,
    actor: ctx.actor,
    payload: { ...payload, context_hash: contextHash(ctx) },
  };
}

function lastT(span: readonly Event[]): number {
  return span.length > 0 ? span[span.length - 1].t : 0;
}

// ---------------------------------------------------------------------------
// idle — the largest inter-event gap in the span exceeds threshold.
// ---------------------------------------------------------------------------

export function detectIdle(
  span: readonly Event[],
  ctx: BehaviorContext,
  params: DetectorParams = DETECTOR_PARAMS
): Signal | null {
  const evs = actions(span);
  if (evs.length < 2) return null;

  let maxGap = 0;
  let gapEndT = evs[0].t;
  for (let i = 1; i < evs.length; i++) {
    const gap = evs[i].t - evs[i - 1].t;
    if (gap > maxGap) {
      maxGap = gap;
      gapEndT = evs[i].t;
    }
  }

  if (maxGap < params.idleThresholdMs) return null;

  const transient = maxGap >= params.transientIdleMs;
  const confidence = Math.min(1, maxGap / (2 * params.idleThresholdMs));
  return makeSignal('idle', gapEndT, confidence, ctx, { idleMs: maxGap, transient });
}

// ---------------------------------------------------------------------------
// rapid_submit — submit with NO meaningful work, below the per-child floor.
// Distinct from too_fast_correct (that one is correct+fast); this fires on the
// absence of work regardless of correctness.
// ---------------------------------------------------------------------------

export function detectRapidSubmit(
  span: readonly Event[],
  ctx: BehaviorContext,
  plausibleFloorMs: number
): Signal | null {
  const evs = actions(span);
  const present = evs.find((a) => a.type === 'problem_present');
  const submit = evs.find((a) => a.type === 'answer_submit');
  if (!present || !submit) return null;

  const worked = evs.some((a) => WORK_TYPES.has(a.type) || a.type === 'hint_shown');
  if (worked) return null;

  const latencyMs = submit.t - present.t;
  if (latencyMs >= plausibleFloorMs) return null;

  const confidence = Math.min(1, 1 - latencyMs / plausibleFloorMs);
  return makeSignal('rapid_submit', submit.t, confidence, ctx, {
    latencyMs,
    floorMs: plausibleFloorMs,
  });
}

// ---------------------------------------------------------------------------
// orphaned_interaction — work started then abandoned (net committed pieces
// returns to ≤0 by submit), or a typed value cleared. The wheel-spin that
// self_corrections (oscillation reversals) miss because it counts reversals,
// not the ABANDONED end-state.
// ---------------------------------------------------------------------------

export function detectOrphanedInteraction(
  span: readonly Event[],
  ctx: BehaviorContext
): Signal | null {
  const evs = actions(span);

  let net = 0;
  let peaked = false; // committed at least one piece at some point
  let abandonments = 0;
  for (const a of evs) {
    if (WORK_TYPES.has(a.type)) {
      net += 1;
      peaked = true;
    } else if (REMOVE_TYPES.has(a.type)) {
      net -= 1;
      if (peaked && net <= 0) abandonments += 1;
    }
  }

  // Orphaned only when there WAS work and it ended abandoned (nothing committed
  // at submit). A re-commit (net > 0 at the end) clears the flag.
  if (!peaked || net > 0 || abandonments === 0) return null;

  const confidence = Math.min(1, 0.5 + 0.25 * abandonments);
  return makeSignal('orphaned_interaction', lastT(span), confidence, ctx, {
    abandonments,
  });
}

// ---------------------------------------------------------------------------
// latency_stall — total latency residual high vs the child's own baseline.
// Observe-only (returns null) until the baseline is established.
// ---------------------------------------------------------------------------

export function detectLatencyStall(
  span: readonly Event[],
  ctx: BehaviorContext,
  residual: ResidualSummary,
  params: DetectorParams = DETECTOR_PARAMS
): Signal | null {
  if (!residual.established) return null;
  const byZ = residual.z >= params.stallZ;
  const byFrac = residual.expectedMs > 0 && residual.residualMs >= residual.expectedMs * params.stallFrac;
  if (!byZ && !byFrac) return null;

  // Confidence from whichever signal is stronger.
  const fracScore = residual.expectedMs > 0 ? residual.residualMs / (residual.expectedMs * 2 * params.stallFrac) : 0;
  const confidence = Math.min(1, Math.max(residual.z / (2 * params.stallZ), fracScore));
  return makeSignal('latency_stall', lastT(span), confidence, ctx, {
    residualMs: residual.residualMs,
    z: residual.z,
    expectedMs: residual.expectedMs,
  });
}

// ---------------------------------------------------------------------------
// scribble_burst — a transient: many removals within a short window (a violent
// scribble-out). Emitted in parallel with smoothing so one sharp event survives.
// ---------------------------------------------------------------------------

export function detectScribbleBurst(
  span: readonly Event[],
  ctx: BehaviorContext,
  params: DetectorParams = DETECTOR_PARAMS
): Signal | null {
  const removals = actions(span).filter((a) => REMOVE_TYPES.has(a.type));
  if (removals.length < params.scribbleCount) return null;

  // Sliding window: any scribbleCount removals inside scribbleWindowMs.
  for (let i = 0; i + params.scribbleCount - 1 < removals.length; i++) {
    const j = i + params.scribbleCount - 1;
    if (removals[j].t - removals[i].t <= params.scribbleWindowMs) {
      return makeSignal('scribble_burst', removals[j].t, 1, ctx, {
        removals: removals.length,
        transient: true,
      });
    }
  }
  return null;
}
