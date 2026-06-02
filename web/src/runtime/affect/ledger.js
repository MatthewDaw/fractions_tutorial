// affect/ledger.js — Phase 2 (plan 005, S5): the precision ledger.
//
// The "earn its place" counter-metric artifact. Every affect-raised hypothesis is
// logged with {trigger, hypothesis, action, behavior_confirmed?, severity}. The
// report computes affect's precision — confirmed-by-behavior over resolved — both
// unweighted and WEIGHTED BY INTERVENTION COST, so a false high-severity escalation
// hurts the score far more than a false "take your time". This is the running
// scorecard each new signal (and, later, the camera) must beat behavior-only on.
//
// Pending hypotheses (behavior_confirmed === null) are logged but excluded from
// precision until resolved. observe-only (cold-start control) entries are logged
// but never scored — they can't manufacture or flatter precision.
//
// PURE/IMMUTABLE: record/resolve return new ledgers. No React, no wall-clock.

/** Intervention cost by severity — a false escalation ≫ a false nudge. */
export const SEVERITY_COST = { low: 1, med: 3, high: 9 };

export function makeLedger() {
  return { entries: [], nextId: 0 };
}

/**
 * Append a hypothesis entry. Returns a NEW ledger.
 *
 * @param {object} ledger
 * @param {{trigger:string, hypothesis:string, action:string, severity:'low'|'med'|'high',
 *          context_hash?:string, behavior_confirmed?:boolean|null, observeOnly?:boolean}} e
 */
export function record(ledger, e) {
  const id = ledger.nextId;
  const stored = {
    id,
    trigger: e.trigger,
    hypothesis: e.hypothesis,
    action: e.action,
    severity: e.severity || 'low',
    context_hash: e.context_hash || null,
    behavior_confirmed: e.behavior_confirmed === undefined ? null : e.behavior_confirmed,
    observeOnly: e.observeOnly === true,
  };
  return { entries: [...ledger.entries, stored], nextId: id + 1 };
}

/** Resolve a previously-pending entry to confirmed (true) or contradicted (false). */
export function resolve(ledger, id, confirmed) {
  return {
    ...ledger,
    entries: ledger.entries.map((e) =>
      e.id === id ? { ...e, behavior_confirmed: confirmed === true } : e
    ),
  };
}

function costOf(severity) {
  return SEVERITY_COST[severity] != null ? SEVERITY_COST[severity] : 1;
}

/**
 * Summarize the ledger into the counter-metric report.
 *
 * @returns {{
 *   total:number, confirmed:number, unconfirmed:number, pending:number,
 *   precision:number, costWeightedPrecision:number, falseInterventionCost:number,
 *   byTrigger: Record<string,{raised:number, confirmed:number, precision:number}>,
 * }}
 */
export function report(ledger) {
  let confirmed = 0;
  let unconfirmed = 0;
  let pending = 0;
  let confirmedCost = 0;
  let resolvedCost = 0;
  let falseInterventionCost = 0;
  const byTrigger = {};

  for (const e of ledger.entries) {
    if (e.observeOnly) continue; // logged, never scored

    if (e.behavior_confirmed === null) {
      pending += 1;
      continue;
    }

    const cost = costOf(e.severity);
    resolvedCost += cost;
    const t = (byTrigger[e.trigger] = byTrigger[e.trigger] || { raised: 0, confirmed: 0, precision: 0 });
    t.raised += 1;

    if (e.behavior_confirmed) {
      confirmed += 1;
      confirmedCost += cost;
      t.confirmed += 1;
    } else {
      unconfirmed += 1;
      falseInterventionCost += cost;
    }
  }

  for (const k of Object.keys(byTrigger)) {
    const t = byTrigger[k];
    t.precision = t.raised > 0 ? t.confirmed / t.raised : 0;
  }

  const resolved = confirmed + unconfirmed;
  return {
    total: ledger.entries.length,
    confirmed,
    unconfirmed,
    pending,
    precision: resolved > 0 ? confirmed / resolved : 0,
    costWeightedPrecision: resolvedCost > 0 ? confirmedCost / resolvedCost : 0,
    falseInterventionCost,
    byTrigger,
  };
}
