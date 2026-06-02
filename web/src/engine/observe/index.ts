// observe/index.ts — Phase 1 (plan 005): the behavioral-observation orchestrator.
//
// observeBehavior(log, baseline?) is the sensor-free floor end to end:
//   1. walk the flat event log into attempt spans (same boundaries segment() uses),
//   2. build a BehaviorContext per attempt from the present/judged payloads,
//   3. compute the per-child latency residual + plausible floor from the baseline,
//   4. run every detector, collecting Signals,
//   5. fold CORRECT attempts into the baseline (EWMA over the child's own speed),
//   6. apply cold-start gating: the first driftControlN attempts are the control
//      (observe-only); after that, signals are actionable. latency_stall stays
//      observe-only until the baseline establishes (the detector enforces this).
//
// This is the SAME path real children, the replay log, and the persona harness
// feed (S7 "one signal path"): the input is a plain Event[] log.
//
// FIREWALL: the output is ObservedSignal[] (Signal + gating metadata) ONLY. No
// MasteryEstimate is produced or mutated anywhere in this module.
//
// ENGINE PURITY: NO React imports, NO wall-clock calls. Time is event.t only.

import type { Event, Action, Signal, Actor } from '../types.js';
import { PARAMS } from '../params.js';
import {
  type LatencyBaseline,
  emptyBaseline,
  updateBaseline,
  latencyResidual,
  plausibleFloorMs,
  difficultyForScaffold,
} from './baseline.js';
import {
  type BehaviorContext,
  detectIdle,
  detectRapidSubmit,
  detectOrphanedInteraction,
  detectLatencyStall,
  detectScribbleBurst,
} from './detectors.js';

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------

export interface ObserveParams {
  /** Attempts at the start of a session treated as pure control (observe-only). */
  driftControlN: number;
}

export const OBSERVE_PARAMS: ObserveParams = {
  driftControlN: 3,
};

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export interface ObservedSignal {
  /** The derived behavioral Signal (inert telemetry). */
  signal: Signal;
  /**
   * True while the signal must be LOGGED but not acted on — the cold-start
   * control window. The corroboration engine (Phase 2) honours this.
   */
  observeOnly: boolean;
  /** 0-based attempt index within the observed log. */
  attemptIndex: number;
}

export interface ObserveResult {
  signals: ObservedSignal[];
  /** The baseline after folding every correct attempt in the log. */
  baseline: LatencyBaseline;
}

// ---------------------------------------------------------------------------
// Span extraction — re-derived here so observe/ stays self-contained and does
// not edit the seam-owned observation.ts. Mirrors its (present … judged) rule.
// ---------------------------------------------------------------------------

function isActionEvent(ev: Event): ev is Action {
  return !('confidence' in ev);
}

function attemptSpans(log: readonly Event[]): Event[][] {
  const spans: Event[][] = [];
  let presentIdx = -1;
  for (let i = 0; i < log.length; i++) {
    const ev = log[i];
    if (!isActionEvent(ev)) continue;
    if (ev.type === 'problem_present') {
      presentIdx = i;
    } else if (ev.type === 'judged' && presentIdx >= 0) {
      spans.push(log.slice(presentIdx, i + 1));
      presentIdx = -1;
    }
  }
  return spans;
}

// ---------------------------------------------------------------------------
// Per-attempt context + latency
// ---------------------------------------------------------------------------

function numAt(payload: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = payload[k];
    if (typeof v === 'number') return v;
  }
  return undefined;
}

function buildContext(span: readonly Event[]): BehaviorContext {
  const evs = span.filter(isActionEvent);
  const present = evs.find((a) => a.type === 'problem_present');
  const judged = evs.find((a) => a.type === 'judged');

  const scaffoldLevel =
    numAt(present?.payload ?? {}, 'scaffold_level') ??
    numAt(judged?.payload ?? {}, 'scaffold_level') ??
    0;
  const hintState = evs
    .filter((a) => a.type === 'hint_shown')
    .reduce((max, a) => Math.max(max, numAt(a.payload, 'rung') ?? 0), 0);
  const pKnown =
    numAt(present?.payload ?? {}, 'p_known', 'P_known') ??
    numAt(judged?.payload ?? {}, 'p_known', 'P_known') ??
    0.5;
  const itemId =
    (typeof present?.payload['problem_id'] === 'string' ? (present!.payload['problem_id'] as string) : undefined) ??
    (typeof judged?.payload['problem_id'] === 'string' ? (judged!.payload['problem_id'] as string) : undefined);
  const actor: Actor = (present?.actor ?? 'human') as Actor;

  return { scaffoldLevel, hintState, pKnown, actor, itemId };
}

function attemptLatency(span: readonly Event[]): number {
  const evs = span.filter(isActionEvent);
  const present = evs.find((a) => a.type === 'problem_present');
  const submit = evs.find((a) => a.type === 'answer_submit');
  const judged = evs.find((a) => a.type === 'judged');
  if (!present) return 0;
  const end = submit ?? judged;
  return end ? end.t - present.t : 0;
}

function isCorrect(span: readonly Event[]): boolean {
  const judged = span.filter(isActionEvent).find((a) => a.type === 'judged');
  return judged?.payload['correct'] === true;
}

// ---------------------------------------------------------------------------
// Single attempt
// ---------------------------------------------------------------------------

/**
 * Observe one attempt span against a baseline. Returns the emitted signals
 * (gated by attemptIndex) and the baseline AFTER folding this attempt (if correct).
 */
export function observeAttempt(
  span: readonly Event[],
  baseline: LatencyBaseline,
  attemptIndex: number,
  params: ObserveParams = OBSERVE_PARAMS
): { signals: ObservedSignal[]; baseline: LatencyBaseline } {
  const ctx = buildContext(span);
  const difficulty = difficultyForScaffold(ctx.scaffoldLevel as 0 | 1 | 2 | 3 | 4);
  const latency = attemptLatency(span);

  // Reads against the PRE-update baseline (judge the attempt vs history).
  const residual = latencyResidual(baseline, latency, difficulty);
  const floor = plausibleFloorMs(baseline, difficulty, PARAMS.latencyFloorMs);

  const emitted: (Signal | null)[] = [
    detectIdle(span, ctx),
    detectRapidSubmit(span, ctx, floor),
    detectOrphanedInteraction(span, ctx),
    detectLatencyStall(span, ctx, residual),
    detectScribbleBurst(span, ctx),
  ];

  const observeOnly = attemptIndex < params.driftControlN;
  const signals: ObservedSignal[] = emitted
    .filter((s): s is Signal => s !== null)
    .map((signal) => ({ signal, observeOnly, attemptIndex }));

  // Fold correct attempts into the latency baseline (calibrate on corrects, like fluency).
  const nextBaseline = isCorrect(span)
    ? updateBaseline(baseline, latency, difficulty)
    : baseline;

  return { signals, baseline: nextBaseline };
}

// ---------------------------------------------------------------------------
// Whole-log fold
// ---------------------------------------------------------------------------

/**
 * Observe an entire event log. Folds the baseline forward across attempts so each
 * attempt is judged against the child's history up to that point.
 *
 * @param log       Flat event log (Actions + any prior Signals; Signals ignored).
 * @param baseline  Optional warm-start baseline (e.g. persona param file, Phase 5).
 */
export function observeBehavior(
  log: readonly Event[],
  baseline: LatencyBaseline = emptyBaseline(),
  params: ObserveParams = OBSERVE_PARAMS
): ObserveResult {
  const spans = attemptSpans(log);
  const signals: ObservedSignal[] = [];
  let b = baseline;
  for (let i = 0; i < spans.length; i++) {
    const out = observeAttempt(spans[i], b, i, params);
    signals.push(...out.signals);
    b = out.baseline;
  }
  return { signals, baseline: b };
}
