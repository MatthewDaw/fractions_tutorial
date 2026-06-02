// affect/index.js — Phase 2 (plan 005, S5): the corroboration engine entry point.
//
// composeAffect() ties together the four Phase-2 pieces and produces the value that
// FILLS THE recentBehavior AFFECT SLOT (isDisengaged today; richer AffectState as
// the seam owner widens it). It is the one place behavior-only adaptation decides a
// tier, and it does so by CORROBORATION (composite), under a FATIGUE BUDGET
// (governor), recording every raised hypothesis to the PRECISION LEDGER.
//
// FIREWALL: this engine reads behavioral Signals and emits an advisory tier + an
// AffectState. It NEVER produces or mutates a MasteryEstimate, and valence stays
// neutral (no emotion inference). The recommendation is advisory to the Tier-2/3
// nudge layer — it has no path into gate.ts.
//
// PURE/IMMUTABLE: returns new governor + ledger; no React, no wall-clock.

import { computeComposite } from './composite.js';
import { deriveAffect, smoothAffect, neutralAffect } from './affectState.js';
import { canOffer, registerOffer } from './governor.js';
import { record } from './ledger.js';

/** Deterministic priority for naming the dominant (most-corroborating) channel. */
const CHANNEL_PRIORITY = [
  'latency_stall',
  'idle',
  'orphaned_interaction',
  'rapid_submit',
  'hint_spend',
];

function dominantChannel(byChannel) {
  let best = null;
  let bestPts = -1;
  for (const ch of CHANNEL_PRIORITY) {
    const pts = byChannel[ch] || 0;
    if (pts > bestPts) {
      bestPts = pts;
      best = ch;
    }
  }
  return best;
}

const HYPOTHESIS = {
  latency_stall: 'stuck',
  idle: 'disengaged',
  orphaned_interaction: 'wheel-spinning',
  rapid_submit: 'guessing',
  hint_spend: 'over-reliant',
};

/**
 * Compose the behavior-only affect read for one attempt boundary.
 *
 * @param {{
 *   observed: Array,                       // ObservedSignal[] from observe/index
 *   ctx: {hintState?:number, attemptIndex?:number, context_hash?:string},
 *   prevAffect?: object,                   // previous smoothed AffectState
 *   governor: object,                      // nudge-fatigue governor state
 *   ledger: object,                        // precision ledger
 * }} input
 * @returns {{
 *   composite: object, affectState: object, recommendedTier: 'none'|'T2'|'T3',
 *   isDisengaged: boolean, governor: object, ledger: object,
 * }}
 */
export function composeAffect(input) {
  const { observed = [], ctx = {}, governor, ledger } = input;
  const prevAffect = input.prevAffect || neutralAffect();
  const attemptIndex = ctx.attemptIndex || 0;

  const composite = computeComposite(observed, { hintState: ctx.hintState || 0 });
  const affectState = smoothAffect(prevAffect, deriveAffect(composite, observed));
  const isDisengaged = composite.band === 'T3';

  // T1 → quiet by default: nothing logged, nothing spent.
  if (composite.band === 'T1') {
    return { composite, affectState, recommendedTier: 'none', isDisengaged, governor, ledger };
  }

  // Actionable band (T2/T3): raise a hypothesis from the dominant channel.
  const channel = dominantChannel(composite.byChannel);
  const severity = composite.band === 'T3' ? 'high' : 'low';
  const offerOk = canOffer(governor, attemptIndex);

  const entry = {
    trigger: channel,
    hypothesis: HYPOTHESIS[channel] || 'unknown',
    action: offerOk ? composite.band : 'suppressed',
    severity,
    context_hash: ctx.context_hash || null,
    behavior_confirmed: null, // pending — corroborated by self-report / outcome later
    observeOnly: !offerOk,    // suppressed offers are logged but never scored
  };

  return {
    composite,
    affectState,
    recommendedTier: offerOk ? composite.band : 'none',
    isDisengaged,
    governor: offerOk ? registerOffer(governor, attemptIndex) : governor,
    ledger: record(ledger, entry),
  };
}
