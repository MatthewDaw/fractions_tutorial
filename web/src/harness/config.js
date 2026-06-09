// harness/config.js — a run is { run_id, seed, stepCap, personaIds, skillIds, flags }.
//
// `flags` carries plan-002 flag overrides (fluencyHardMode, frustrationScaffold,
// delayedProbe, unifiedTaxonomy) so a sweep can run flags-off (baseline) vs
// flags-on (activated) WITHOUT editing the engine (KTD15). The routed flags
// (fluencyHardMode, frustrationScaffold, escalation.*) are now APPLIED to the
// live engine PARAMS per-session by harness/flagOverlay.js (T12) — the engine's
// 002 PARAMS routing already exists; the harness flips it for the flags-on sweep.
// HERE PARAMS is read READ-ONLY, only to hash into the tape for attribution —
// never to seed personas (KTD2).
import { PARAMS } from './engineApi.js';
import { hashObject } from './tape.js';

/**
 * Plan-002 reversible flags. All default OFF = today's (baseline) behavior.
 * The ROUTED flags (fluencyHardMode, frustrationScaffold, and escalation.*) are
 * PARAMS-backed: harness/flagOverlay.js applies them to the live engine PARAMS for
 * the duration of a session, so a flags-on sweep gates DIFFERENTLY from flags-off.
 * delayedProbe + unifiedTaxonomy have NO engine PARAMS routing yet, so they remain
 * inert attribution-only flags (carried onto the tape but not applied) until the
 * engine grows a knob for them (e.g. T09 for delayedProbe).
 */
export function defaultFlags() {
  return {
    fluencyHardMode: false, // PARAMS-backed via flagOverlay.js (gate.ts fluency conjunct)
    frustrationScaffold: false, // PARAMS-backed via flagOverlay.js (policy.ts RaiseScaffold)
    delayedProbe: false, // inert: no engine PARAMS routing yet (attribution-only)
    unifiedTaxonomy: false, // inert: no engine PARAMS routing yet (attribution-only)
  };
}

/**
 * Build a normalized run config.
 * @param {object} [opts]
 * @returns {{run_id:string, seed:number, stepCap:number, personaIds:string[]|null,
 *           skillIds:string[]|null, flags:object, params_hash:string}}
 */
export function makeRun(opts = {}) {
  const seed = Number.isFinite(opts.seed) ? (opts.seed | 0) : 1;
  const flags = { ...defaultFlags(), ...(opts.flags || {}) };
  return {
    run_id: opts.run_id || `run-${seed}`,
    seed,
    stepCap: Number.isFinite(opts.stepCap) ? opts.stepCap | 0 : 40,
    personaIds: opts.personaIds || null, // null = all
    skillIds: opts.skillIds || null, // null = all
    flags,
    // attribution only — pins the engine's param state into every tape (KTD15)
    params_hash: hashObject(PARAMS),
  };
}

/** The current engine param hash (attribution for tapes/decision-log). */
export function paramsHash() {
  return hashObject(PARAMS);
}
