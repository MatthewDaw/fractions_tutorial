// affect/governor.js — Phase 2 (plan 005, S5): the nudge-fatigue governor.
//
// A per-child intervention budget plus a dismissal-driven cooldown. Two jobs:
//   1. Cap total interventions per child (budget) so the watcher is quiet by default.
//   2. Back off after dismissals — each ignored offer GROWS the cooldown — so the
//      system can't pester a child into the disengagement it then "detects".
// A genuinely accepted offer clears the backoff (real help isn't penalized).
//
// "Cooldown" is measured in ATTEMPTS, not wall-clock (engine purity holds in spirit:
// this module reads no clock; the caller passes the attempt index).
//
// PURE/IMMUTABLE: register* return new state.

export const GOVERNOR_PARAMS = {
  /** Max interventions offered per child per session. */
  maxOffers: 5,
  /** Minimum attempts between offers, with zero dismissals. */
  baseCooldown: 2,
  /** Extra cooldown attempts added per accumulated dismissal. */
  backoffPerDismissal: 2,
};

export function makeGovernor(params = GOVERNOR_PARAMS) {
  return {
    budget: params.maxOffers,
    dismissals: 0,
    /** Attempt index of the last offer; null = none yet. */
    lastOfferAttempt: null,
    params,
  };
}

/** Current cooldown (attempts) given accumulated dismissals. */
export function effectiveCooldown(g) {
  return g.params.baseCooldown + g.params.backoffPerDismissal * g.dismissals;
}

/**
 * May an offer fire at this attempt index? Requires budget AND that the
 * (dismissal-grown) cooldown has elapsed since the last offer.
 */
export function canOffer(g, attemptIndex) {
  if (g.budget <= 0) return false;
  if (g.lastOfferAttempt === null) return true;
  return attemptIndex - g.lastOfferAttempt >= effectiveCooldown(g);
}

/** Spend one budget unit and stamp the offer attempt. */
export function registerOffer(g, attemptIndex) {
  return { ...g, budget: g.budget - 1, lastOfferAttempt: attemptIndex };
}

/** A dismissed offer grows the backoff. */
export function registerDismissal(g) {
  return { ...g, dismissals: g.dismissals + 1 };
}

/** An accepted offer clears the dismissal penalty. */
export function registerAccepted(g) {
  return { ...g, dismissals: 0 };
}
