// harness/quarantine/chaos.js — U10 QUARANTINED facet: chaos fault-injection on
// the Observation pipeline (KTD11), framed as a steady-state-hypothesis +
// blast-radius experiment (Principles of Chaos Engineering).
//
// QUARANTINE CONTRACT (hard): this module is ISOLATED from the tuning loop. It
// imports NOTHING from search.js / recursiveLoop.js and exposes NO hook the loop
// consumes. A chaos run carries its OWN seed (separately seeded per KTD11), never
// touches the tuning RNG, and NEVER mutates the original tape bytes — every fault
// is applied to a deep CLONE. A finding is a measurement-fragility observation for
// a human, not a signal fed back into search.
//
// STEADY-STATE HYPOTHESIS: a single-field Observation fault should NOT flip a
// mastery/gate verdict. If the verdict holds, the engine is GRACEFUL under that
// fault (no flip). If a one-field fault DOES flip the verdict, that is a recorded
// measurement-fragility FINDING with a blast radius (how far the corruption
// propagated: this attempt only, vs the whole-session verdict).

/** The Observation fields chaos is allowed to corrupt (the chaos targets). */
export const CHAOS_FIELDS = Object.freeze([
  'too_fast_correct',     // boolean flip
  'self_corrections',     // drop one oscillation
  'error_signature',      // corrupt the misconception fingerprint
  'recognizer_confidence',// mis-set the handwriting confidence
]);

// ---------------------------------------------------------------------------
// deep clone — guarantees the original tape bytes are never mutated
// ---------------------------------------------------------------------------

/** Structured deep clone (JSON round-trip is sufficient for plain tape data). */
function deepClone(x) {
  return JSON.parse(JSON.stringify(x));
}

/** A tiny seeded PRNG (mulberry32) so a chaos run carries its OWN seed. */
function chaosRng(seed) {
  let a = (seed | 0) + 0x6d2b79f5;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Field corruption — flip/corrupt ONE field on ONE judged event per session.
// ---------------------------------------------------------------------------

/**
 * Corrupt a single Observation field in place on a (cloned) judged payload AND
 * the derived step.observation if present. Returns a description of what changed.
 */
function corruptField(field, judgedPayload, observation, rng) {
  const before = {
    payload: judgedPayload ? judgedPayload[field] : undefined,
    observation: observation ? observation[field] : undefined,
  };

  switch (field) {
    case 'too_fast_correct': {
      // Boolean flip.
      if (judgedPayload) judgedPayload[field] = !judgedPayload[field];
      if (observation) observation[field] = !observation[field];
      break;
    }
    case 'self_corrections': {
      // Drop one oscillation (floor at 0).
      const dec = (v) => Math.max(0, (typeof v === 'number' ? v : 0) - 1);
      if (judgedPayload) judgedPayload[field] = dec(judgedPayload[field]);
      if (observation) observation[field] = dec(observation[field]);
      break;
    }
    case 'error_signature': {
      // Corrupt the fingerprint to a DIFFERENT valid-shaped (but wrong) code.
      const alts = ['add_denominators', 'add_across_unlike', 'scaled_bottom_only', 'forced_leftover', 'not_simplified', 'other'];
      const cur = judgedPayload ? judgedPayload[field] : (observation ? observation[field] : null);
      const choices = alts.filter((c) => c !== cur);
      const next = choices[Math.floor(rng() * choices.length)] ?? 'other';
      if (judgedPayload) judgedPayload[field] = next;
      if (observation) observation[field] = next;
      break;
    }
    case 'recognizer_confidence': {
      // Mis-set confidence to an implausible extreme (clamped to [0,1]).
      const next = rng() < 0.5 ? 0.01 : 0.99;
      if (judgedPayload) judgedPayload[field] = next;
      if (observation) observation[field] = next;
      break;
    }
    default:
      throw new Error(`chaos: unknown field "${field}"`);
  }

  return {
    field,
    before,
    after: {
      payload: judgedPayload ? judgedPayload[field] : undefined,
      observation: observation ? observation[field] : undefined,
    },
  };
}

/**
 * Inject ONE fault into ONE session tape, corrupting a single Observation field
 * on a single attempt (deterministically chosen by the chaos seed). The original
 * tape is NEVER mutated — the returned tape is a deep clone with `__chaos` provenance.
 *
 * The fault touches BOTH the on-tape `judged` event payload (if the tape carries a
 * raw `log`) AND the derived `steps[*].observation`, so a re-derivation that reads
 * either surface sees the corruption.
 *
 * @param {object} tape  a sessionRunner tape ({ steps:[...], log?:[...] }).
 * @param {object} opts
 *   @param {string} opts.field  one of CHAOS_FIELDS.
 *   @param {number} [opts.seed=0]  chaos seed (separate from tuning RNG).
 * @returns {object} a NEW, mutated tape (deep clone).
 */
export function injectFault(tape, { field, seed = 0 } = {}) {
  if (!tape) throw new Error('injectFault: tape is required');
  if (!CHAOS_FIELDS.includes(field)) {
    throw new Error(`injectFault: field must be one of ${CHAOS_FIELDS.join(', ')}`);
  }

  const mutated = deepClone(tape);
  const rng = chaosRng(seed);

  const steps = Array.isArray(mutated.steps) ? mutated.steps : [];
  if (steps.length === 0) {
    mutated.__chaos = { field, seed, applied: false, reason: 'no-steps' };
    return mutated;
  }

  // Pick ONE attempt to corrupt (deterministic in the chaos seed).
  const targetStep = Math.floor(rng() * steps.length);
  const observation = steps[targetStep] ? steps[targetStep].observation : null;

  // If the tape carries a raw event log, find the corresponding judged event.
  let judgedPayload = null;
  if (Array.isArray(mutated.log)) {
    const judgedEvents = mutated.log.filter((e) => e && e.type === 'judged');
    const je = judgedEvents[targetStep] ?? judgedEvents[judgedEvents.length - 1];
    if (je) judgedPayload = je.payload;
  }

  const change = corruptField(field, judgedPayload, observation, rng);

  mutated.__chaos = {
    field,
    seed,
    applied: true,
    targetStep,
    change,
  };
  return mutated;
}

// ---------------------------------------------------------------------------
// Verdict derivation + fragility assessment
// ---------------------------------------------------------------------------

/**
 * Derive a coarse mastery/gate VERDICT from a tape. The verdict is the boolean
 * "did the session's gate ever open?" plus the terminal kind — the steady-state
 * signal we test for flips. We read off the tape's own derived fields so chaos
 * stays ENGINE-AGNOSTIC (no engine import); a caller wanting an engine-recomputed
 * verdict passes its own `runFn` (see assessFragility).
 *
 * @param {object} tape
 * @returns {{ gateEverOpen:boolean, terminalKind:string|null, masteredSteps:number }}
 */
export function deriveVerdict(tape) {
  const steps = Array.isArray(tape?.steps) ? tape.steps : [];
  const masteredSteps = steps.filter((s) => s.gate === true).length;
  return {
    gateEverOpen: masteredSteps > 0,
    terminalKind: tape?.terminal?.kind ?? null,
    masteredSteps,
  };
}

/** Did two verdicts diverge? (a flip of the steady-state hypothesis). */
function verdictsDiffer(a, b) {
  return (
    a.gateEverOpen !== b.gateEverOpen ||
    a.terminalKind !== b.terminalKind ||
    a.masteredSteps !== b.masteredSteps
  );
}

/**
 * Assess measurement fragility under a single-field fault.
 *
 * Steady-state hypothesis: the verdict is INVARIANT to a single-field Observation
 * fault. We compute the baseline verdict, inject the fault on a deep clone, re-
 * derive the verdict on the mutated tape, and report whether it FLIPPED plus the
 * blast radius (how far the corruption propagated).
 *
 * `runFn` is the verdict re-derivation. It is INJECTED (never an engine import in
 * this module) so chaos stays quarantined:
 *   - runFn(tape) -> verdict  : a custom re-derivation (e.g. engine recompute).
 *   - omitted                 : defaults to deriveVerdict (tape-self verdict).
 * The runFn is called once on the ORIGINAL tape (baseline) and once on the MUTATED
 * clone — the original tape bytes are never altered.
 *
 * @param {object} args
 *   @param {object} args.tape   the session tape under test.
 *   @param {(tape:object)=>object} [args.runFn]  verdict re-derivation.
 *   @param {string} args.field  one of CHAOS_FIELDS.
 *   @param {number} [args.seed=0]  chaos seed.
 * @returns {{ flipped:boolean, blastRadius:string, field:string, seed:number,
 *             baseline:object, mutated:object, change:object|null, finding:string|null }}
 */
export function assessFragility({ tape, runFn = deriveVerdict, field, seed = 0 } = {}) {
  if (!tape) throw new Error('assessFragility: tape is required');

  // Snapshot the original bytes to PROVE non-mutation post-hoc.
  const originalBytes = JSON.stringify(tape);

  const baseline = runFn(tape);
  const mutatedTape = injectFault(tape, { field, seed });
  const mutatedVerdict = runFn(mutatedTape);

  // Hard guarantee: the original tape was not mutated by this assessment.
  if (JSON.stringify(tape) !== originalBytes) {
    throw new Error('assessFragility: original tape was mutated (quarantine violation)');
  }

  const flipped = verdictsDiffer(baseline, mutatedVerdict);

  // Blast radius framing:
  //   none           — verdict held (graceful; the desirable steady state).
  //   attempt-local  — a derived per-attempt field changed but the verdict held.
  //   session-verdict— a single-field fault flipped the whole-session verdict.
  let blastRadius;
  if (flipped) {
    blastRadius = 'session-verdict';
  } else if (mutatedTape.__chaos?.applied) {
    blastRadius = 'attempt-local';
  } else {
    blastRadius = 'none';
  }

  const finding = flipped
    ? `MEASUREMENT FRAGILITY: a single ${field} fault flipped the session verdict ` +
      `(blastRadius=${blastRadius}, seed=${seed}). Verdicts should be robust to one ` +
      `corrupted Observation field.`
    : null;

  return {
    flipped,
    blastRadius,
    field,
    seed,
    baseline,
    mutated: mutatedVerdict,
    change: mutatedTape.__chaos?.change ?? null,
    finding,
  };
}
