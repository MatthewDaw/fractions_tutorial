// affect/composite.js — Phase 2 (plan 005, S5): the corroboration composite.
//
// A NEWS2-style early-warning score. Each behavioral CHANNEL contributes a small,
// capped number of points; the points sum into a band (T1/T2/T3). The whole point
// is CORROBORATION AS ARITHMETIC: a single channel — even maxed, even firing many
// times — caps below the T2 threshold, so it can never cross a band alone. At least
// two channels must agree before adaptation escalates. This is the structural answer
// to "no single channel intervenes" (S5).
//
// Cold-start: observe-only signals (the first driftControlN attempts, or pre-baseline
// latency residuals) are LOGGED elsewhere but excluded from the actionable score here.
//
// PURE: no React, no wall-clock. Time never appears in this module.

/** Map each behavioral Signal type to a corroboration channel. */
const SIGNAL_CHANNEL = {
  idle: 'idle',
  latency_stall: 'latency_stall',
  orphaned_interaction: 'orphaned_interaction',
  rapid_submit: 'rapid_submit',
  scribble_burst: 'orphaned_interaction', // a scribble-out is wheel-spin evidence
  // Phase 4 (S2): the presence gate is just ANOTHER corroborating channel — capped
  // like every other, so it can never cross a band alone (it disambiguates idle, it
  // does not drive intervention by itself). `sensor_unavailable` is deliberately NOT
  // mapped: an invalid/occluded reading must not read as disengagement (it would mask
  // attention:away — the Phase-0 sensor_unavailable reservation).
  presence: 'presence_away',
};

export const COMPOSITE_PARAMS = {
  /** Hard cap on any single channel's points — the corroboration guarantee. */
  maxChannelPoints: 2,
  /** Score at/above which the band is T2 (must exceed maxChannelPoints). */
  t2: 3,
  /** Score at/above which the band is T3. */
  t3: 5,
  /** Confidence at/above which a signal scores the full per-hit points. */
  strongConfidence: 0.5,
  /** Hint rung at/above which the hint_spend channel contributes. */
  hintSpendRung: 2,
};

function pointsForSignal(confidence, payload, params) {
  // A transient (sharp event) always counts as a strong hit.
  if (payload && payload.transient === true) return 2;
  return confidence >= params.strongConfidence ? 2 : 1;
}

function bandForScore(score, params) {
  if (score >= params.t3) return 'T3';
  if (score >= params.t2) return 'T2';
  return 'T1';
}

/**
 * Compute the corroboration composite over a set of observed signals.
 *
 * @param {Array<{signal:{type:string,confidence:number,payload?:object}, observeOnly?:boolean}>} observed
 * @param {{hintState?: number}} [ctx]
 * @param {typeof COMPOSITE_PARAMS} [params]
 * @returns {{ score:number, band:'T1'|'T2'|'T3', byChannel: Record<string,number> }}
 */
export function computeComposite(observed, ctx = {}, params = COMPOSITE_PARAMS) {
  const byChannel = {};

  const add = (channel, pts) => {
    const next = (byChannel[channel] || 0) + pts;
    byChannel[channel] = Math.min(params.maxChannelPoints, next);
  };

  for (const o of observed || []) {
    if (!o || o.observeOnly) continue; // cold-start: logged, not scored
    const sig = o.signal;
    const channel = SIGNAL_CHANNEL[sig.type];
    if (!channel) continue;
    add(channel, pointsForSignal(sig.confidence, sig.payload, params));
  }

  // hint_spend — a behavioral channel derived from scaffold support spent, not a Signal.
  const hintState = ctx.hintState || 0;
  if (hintState >= params.hintSpendRung) {
    add('hint_spend', params.maxChannelPoints);
  }

  let score = 0;
  for (const k of Object.keys(byChannel)) score += byChannel[k];

  return { score, band: bandForScore(score, params), byChannel };
}
