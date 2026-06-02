// harness/config.js — a run is { run_id, seed, stepCap, personaIds, skillIds, flags }.
//
// `flags` carries plan-002 flag overrides (fluencyHardMode, frustrationScaffold,
// delayedProbe, unifiedTaxonomy) so a sweep can run flags-off (baseline) vs
// flags-on (activated) WITHOUT editing the engine (KTD15). PARAMS is read
// READ-ONLY here, only to hash into the tape — never to seed personas (KTD2).
import { PARAMS } from './engineApi.js';
import { hashObject } from './tape.js';

/**
 * Plan-002 reversible flags. All default OFF = today's (baseline) behavior.
 * Until 002 lands, these are STUBS the harness threads through explicitly; an
 * arg-backed flag (e.g. fluencyHardMode) only changes engine gating once 002
 * routes it through PARAMS (review F1 / Open Q on PARAMS-backed vs arg-backed).
 */
export function defaultFlags() {
  return {
    fluencyHardMode: false, // arg-backed today; PARAMS-backed once 002 wires it
    frustrationScaffold: false,
    delayedProbe: false,
    unifiedTaxonomy: false,
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
