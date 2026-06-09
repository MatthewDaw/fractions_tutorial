// harness/recursiveLoop.js — U9: the recursive improvement loop with a SEALED
// held-out judge.
//
// This is the red-team's "did the change actually make the engine better, or did
// it just overfit the train family?" gate. A `change` proposes an alteration to
// the engine's flags/params; the loop runs BOTH families (train + the sealed
// held-out family) before and after, and only blesses the change REAL when the
// HELD-OUT family improved — never on the train family alone. That sealing is the
// whole point: improving train-only is exactly what "gaming" looks like, and the
// held-out family (non-BKT laws + DISJOINT latents — see personas/families.js) is
// the judge the change was not allowed to peek at.
//
// THE CANONICAL CHANGE is plan-002's flags: before = flags-off (baseline), after =
// flags-on (activated). As of T12 the ROUTED flags (fluencyHardMode,
// frustrationScaffold, escalation.*) are PARAMS-BACKED: harness/flagOverlay.js
// applies them to the live engine PARAMS for each session, so flags-on and
// flags-off runs gate DIFFERENTLY and the canonical change can produce a REAL /
// GAMING verdict instead of always NO_CHANGE. The verdict still reads NO_CHANGE
// only when neither family actually moves (e.g. a flag whose effect doesn't reach
// the target metrics on these families, or one of the still-inert flags —
// delayedProbe/unifiedTaxonomy — that has no engine routing yet). The MECHANISM
// (run before/after on both families, diff via aggregate, seal the judge) is
// unchanged; T12 just made the flags actually move the engine.
//
// VERDICT RULE:
//   REAL    ⟺ the held-out family IMPROVED on a target metric
//                 (false_mastery_rate ↓  OR  transfer_after_fade ↑)
//             AND the guardrail metric the change is NOT allowed to touch
//                 (transfer-on-novel-forms) did NOT degrade
//             AND the deflated pass-rate holds (when a search ran, deflate the
//                 improvement for #search-trials so a lucky single trial cannot pass).
//   GAMING  ⟺ TRAIN improved but the sealed held-out did NOT (overfit / auto-revert
//             intent), OR the guardrail degraded, OR the deflated bar failed.
//   NO_CHANGE ⟺ neither family moved (e.g. a flag with no effect on the target
//             metrics for these families, or a still-inert flag with no engine routing).
//
// A regression check flags any persona that PASSED before the change and FAILS
// after it (a previously-clean child the change broke), independent of the verdict.
//
// DETERMINISM: same seed → byte-identical runs (sessionRunner is replay-exact).
// The decisionLogEntry pins params_hash BEFORE and AFTER + the engine_sha so U11
// (the fix queue) and U13 (the audit ledger) can attribute every blessed change.
//
// PURE: no wall-clock, no fs. The family personas are built fresh per run so no
// session state leaks across the before/after comparison.

import { runSession } from './sessionRunner.js';
import { aggregate } from './metrics.js';
import { trainFamily, heldOutFamily } from './personas/families.js';
import { makePersona } from './personas/model.js';
import { labelTape, DEFAULT_TAU_LATENT } from './oracle/latentTruth.js';
import { paramsHash } from './config.js';
import { hashObject } from './tape.js';

// The skills the loop exercises. Kept SMALL by default (the canonical adders) so a
// before×after × train+held-out run stays fast; callers may widen via skillIds.
const DEFAULT_LOOP_SKILLS = Object.freeze([
  'ADD_SAME_DEN',
  'ADD_UNLIKE_COPRIME',
]);

// The improvement is only counted "real" if it clears the held-out bar by at least
// this margin (kills float-noise ties as improvements).
const IMPROVE_EPS = 1e-9;

// ---------------------------------------------------------------------------
// change specs.
// ---------------------------------------------------------------------------
//
// A `change` is EITHER a plain spec object or a function returning one. A spec:
//   {
//     id?: string,                         // human label for the decision log
//     flags?: object,                      // flag overrides for the AFTER run
//     paramsAfter?: object,                // a snapshot/hash of the post-change PARAMS
//                                          //   (attribution only — see note below)
//     searchTrials?: number,               // #search trials run to surface this change
//                                          //   (drives the deflated pass-rate)
//     perturbMetrics?: (ctx) => record,    // TEST HOOK: synthesize the AFTER metrics
//                                          //   from the BEFORE record without needing
//                                          //   002 to route a real flag. ctx =
//                                          //   { record, family, tapes, role:'after' }.
//     perturbTapes?: (ctx) => void,        // TEST HOOK: mutate the AFTER tapes in place
//                                          //   (e.g. inject a label) to exercise the
//                                          //   per-persona regression check. ctx =
//                                          //   { tapes, family }.
//   }
//
// THE perturbMetrics HOOK lets a test apply a direct, family-targeted metric delta
// to PRECISELY EXERCISE the REAL/GAMING/regression machinery in a few seconds —
// standing in for "a flag that helps train-only" (GAMING) or "helps both" (REAL)
// without depending on a specific flag's exact effect size on a specific family. As
// of T12 the routed flags DO move the engine (flagOverlay.js), so a real flags-on
// change can also produce a non-NO_CHANGE verdict from the genuine before/after
// tapes WITHOUT this hook; the hook remains for targeted, deterministic coverage.

function normalizeChange(change) {
  const spec = typeof change === 'function' ? change() : change || {};
  return {
    id: spec.id || 'change',
    flagsBefore: spec.flagsBefore || {}, // default: baseline (flags off)
    flagsAfter: spec.flags || spec.flagsAfter || {},
    paramsBefore: spec.paramsBefore || null,
    paramsAfter: spec.paramsAfter || null,
    searchTrials: Number.isFinite(spec.searchTrials) ? spec.searchTrials | 0 : 0,
    perturbMetrics: typeof spec.perturbMetrics === 'function' ? spec.perturbMetrics : null,
    perturbTapes: typeof spec.perturbTapes === 'function' ? spec.perturbTapes : null,
    engineSha: spec.engineSha || 'dev',
  };
}

// ---------------------------------------------------------------------------
// Family runs.
// ---------------------------------------------------------------------------

/**
 * Run a family (array of FRESH persona instances) across the skills at one seed +
 * flag state, returning { tapes, metrics } where metrics is an aggregate over the
 * whole family slice. Personas are consumed fresh by the factory so no state leaks.
 */
function runFamily(personas, { skillIds, seed, stepCap, flags, tauLatent }) {
  const tapes = [];
  for (const persona of personas) {
    for (const skillId of skillIds) {
      tapes.push(runSession({ persona, skillId, seed, stepCap, flags }));
    }
  }
  const metrics = aggregate(tapes, { tauLatent });
  return { tapes, metrics };
}

/**
 * The guardrail metric: TRANSFER ON NOVEL FORMS. The change is forbidden to touch
 * this. We compute it from the held-out family's tapes as the transfer-after-fade
 * rate restricted to the genuinely-novel-form members (the held-out family's
 * non-BKT laws are, by construction, the novel forms the engine never trained on).
 * Higher is better; "degraded" means it dropped after the change.
 */
function guardrailValue(metrics) {
  // transfer_after_fade is the population's "faded then transferred" rate. On the
  // held-out (novel-form) family this IS transfer-on-novel-forms.
  const v = metrics && typeof metrics.transfer_after_fade === 'number'
    ? metrics.transfer_after_fade
    : 0;
  return v;
}

// ---------------------------------------------------------------------------
// Per-persona pass/fail (regression detection).
// ---------------------------------------------------------------------------

/**
 * A persona "passes" a run when NONE of its tapes carry a dangerous oracle label
 * (false mastery / missed escalation / false transfer / false escalation). A
 * previously-passing persona that fails after the change is a regression.
 */
function personaPassMap(tapes, tauLatent) {
  const byPersona = new Map();
  for (const tape of tapes) {
    const label = labelTape(tape, { tauLatent });
    const bad =
      label.labels.falsePositiveMastery ||
      label.labels.missedEscalation ||
      label.labels.falseEscalation ||
      label.labels.falseTransfer;
    const prev = byPersona.get(tape.persona_id);
    byPersona.set(tape.persona_id, prev === false ? false : !bad);
  }
  return byPersona;
}

function findRegressions(beforeTapes, afterTapes, tauLatent) {
  const before = personaPassMap(beforeTapes, tauLatent);
  const after = personaPassMap(afterTapes, tauLatent);
  const regressions = [];
  for (const [pid, passedBefore] of before) {
    if (passedBefore && after.get(pid) === false) {
      regressions.push(pid);
    }
  }
  return regressions.sort();
}

// ---------------------------------------------------------------------------
// Metric delta + improvement test.
// ---------------------------------------------------------------------------

/** The directional delta of the two TARGET metrics (lower fm = better, higher tx = better). */
function metricDelta(before, after) {
  const fmBefore = before.false_mastery_rate ?? 0;
  const fmAfter = after.false_mastery_rate ?? 0;
  const txBefore = before.transfer_after_fade ?? 0;
  const txAfter = after.transfer_after_fade ?? 0;
  return {
    false_mastery_rate: { before: fmBefore, after: fmAfter, improvement: fmBefore - fmAfter },
    transfer_after_fade: { before: txBefore, after: txAfter, improvement: txAfter - txBefore },
    // net improvement: either lever moving the right way counts.
    netImprovement: Math.max(fmBefore - fmAfter, txAfter - txBefore),
  };
}

/**
 * Deflated pass-rate: when a SEARCH surfaced this change over `searchTrials`
 * trials, a single lucky improvement must be discounted for multiple comparisons.
 * We deflate the held-out net improvement by a Bonferroni-ish factor so the bar to
 * clear grows with the number of trials searched. With 0 trials the factor is 1.
 */
function deflatedImprovement(netImprovement, searchTrials) {
  const trials = Math.max(0, searchTrials | 0);
  const factor = trials > 0 ? 1 / (1 + Math.log2(1 + trials)) : 1;
  return netImprovement * factor;
}

// ---------------------------------------------------------------------------
// runLoop — the verdict.
// ---------------------------------------------------------------------------

/**
 * Run the recursive improvement loop for one `change` and return a verdict.
 *
 * @param {object} args
 *   @param {object|function} args.change  the change spec (or () => spec). The
 *          CANONICAL change is plan-002 flags: { flags: {fluencyHardMode:true,...} }.
 *   @param {number} [args.seed=1]         deterministic seed for the train run.
 *   @param {number} [args.heldOutSeed]    fresh seed lineage for the sealed judge
 *          (defaults to a derived, distinct seed so the judge is not a re-run of train).
 *   @param {string[]} [args.skillIds]     skills to exercise (default: the adders).
 *   @param {number} [args.stepCap=24]
 *   @param {number} [args.tauLatent=DEFAULT_TAU_LATENT]
 * @returns {object} verdict (schema below).
 */
export function runLoop({
  change,
  seed = 1,
  heldOutSeed,
  skillIds,
  stepCap = 24,
  tauLatent = DEFAULT_TAU_LATENT,
} = {}) {
  const spec = normalizeChange(change);
  const skills = skillIds && skillIds.length ? skillIds : DEFAULT_LOOP_SKILLS;
  // The sealed judge runs on a DIFFERENT seed lineage from train (fresh, derived but
  // distinct) so a "REAL" verdict cannot be an artifact of the train seed.
  const hoSeed = Number.isFinite(heldOutSeed) ? heldOutSeed : ((seed ^ 0x5ea1ed) >>> 0);

  // Capture the engine param hash BEFORE the change (the loop never mutates PARAMS;
  // a real 002 change would, and paramsAfter carries the post-change attribution).
  const paramsHashBefore = paramsHash();

  // --- TRAIN family: before (baseline flags) + after (changed flags), SAME seed. ---
  const trainBefore = runFamily(trainFamily(), {
    skillIds: skills, seed, stepCap, flags: spec.flagsBefore, tauLatent,
  });
  let trainAfter = runFamily(trainFamily(), {
    skillIds: skills, seed, stepCap, flags: spec.flagsAfter, tauLatent,
  });

  // --- SEALED HELD-OUT family: before + after, on the FRESH judge seed lineage. ---
  const heldOutBefore = runFamily(heldOutFamily(), {
    skillIds: skills, seed: hoSeed, stepCap, flags: spec.flagsBefore, tauLatent,
  });
  let heldOutAfter = runFamily(heldOutFamily(), {
    skillIds: skills, seed: hoSeed, stepCap, flags: spec.flagsAfter, tauLatent,
  });

  // TEST HOOK (perturbTapes): mutate the AFTER tapes in place — e.g. inject a label
  // — to exercise the per-persona regression check against a change 002 has not yet
  // wired. Applied BEFORE metrics so the regression read and the perturbed metrics
  // agree on the same after-tapes.
  if (spec.perturbTapes) {
    spec.perturbTapes({ tapes: trainAfter.tapes, family: 'train' });
    spec.perturbTapes({ tapes: heldOutAfter.tapes, family: 'heldOut' });
  }

  // TEST HOOK (perturbMetrics): synthesize the AFTER metrics for a change that 002
  // has not yet wired through PARAMS (inert flags ⇒ identical tapes). The hook
  // receives the BEFORE record + the family role and returns the perturbed AFTER
  // record, modeling the metric the wired flag WOULD have produced.
  if (spec.perturbMetrics) {
    trainAfter = {
      ...trainAfter,
      metrics: spec.perturbMetrics({ record: trainAfter.metrics, family: 'train', tapes: trainAfter.tapes, role: 'after' }),
    };
    heldOutAfter = {
      ...heldOutAfter,
      metrics: spec.perturbMetrics({ record: heldOutAfter.metrics, family: 'heldOut', tapes: heldOutAfter.tapes, role: 'after' }),
    };
  }

  // --- deltas ---
  const trainDelta = metricDelta(trainBefore.metrics, trainAfter.metrics);
  const heldOutDelta = metricDelta(heldOutBefore.metrics, heldOutAfter.metrics);

  // --- guardrail: transfer-on-novel-forms must NOT degrade (measured held-out) ---
  const guardBefore = guardrailValue(heldOutBefore.metrics);
  const guardAfter = guardrailValue(heldOutAfter.metrics);
  const guardrailDegraded = guardAfter < guardBefore - IMPROVE_EPS;

  // --- deflated pass-rate (discount for #search-trials) ---
  const heldOutDeflated = deflatedImprovement(heldOutDelta.netImprovement, spec.searchTrials);

  // --- regressions: a persona that passed before and fails after (either family) ---
  const regressions = [
    ...findRegressions(trainBefore.tapes, trainAfter.tapes, tauLatent),
    ...findRegressions(heldOutBefore.tapes, heldOutAfter.tapes, tauLatent),
  ].filter((v, i, a) => a.indexOf(v) === i).sort();

  // --- verdict ---
  const trainMoved = Math.abs(trainDelta.netImprovement) > IMPROVE_EPS;
  const heldOutMoved = Math.abs(heldOutDelta.netImprovement) > IMPROVE_EPS;
  const heldOutImproved = heldOutDeflated > IMPROVE_EPS;

  let verdict;
  if (!trainMoved && !heldOutMoved) {
    // Nothing downstream moved (the inert 002 flags, or a true no-op).
    verdict = 'NO_CHANGE';
  } else if (heldOutImproved && !guardrailDegraded) {
    // The sealed judge improved AND the off-limits guardrail held → genuinely real.
    verdict = 'REAL';
  } else {
    // Moved train (or claimed an improvement) but the sealed judge did not bless it,
    // or it degraded the guardrail / failed the deflated bar → overfit/gaming.
    verdict = 'GAMING';
  }

  // params_hash_after: a real 002 change MUTATES PARAMS; the loop never does, so we
  // hash the change's explicit post-change PARAMS snapshot when provided (attribution
  // only). Absent a snapshot, PARAMS did not move and the before-hash stands.
  const paramsHashAfter = spec.paramsAfter ? hashObject(spec.paramsAfter) : paramsHashBefore;

  const decisionLogEntry = {
    change: spec.id,
    params_hash_before: paramsHashBefore,
    params_hash_after: paramsHashAfter,
    engine_sha: spec.engineSha,
    verdict,
  };

  return {
    verdict,
    trainDelta,
    heldOutDelta,
    guardrail: { before: guardBefore, after: guardAfter, degraded: guardrailDegraded },
    deflated: { heldOutNet: heldOutDelta.netImprovement, deflatedNet: heldOutDeflated, searchTrials: spec.searchTrials },
    regressions,
    decisionLogEntry,
  };
}

// ---------------------------------------------------------------------------
// Champion distillation + replay (CI regression fixtures).
// ---------------------------------------------------------------------------

/**
 * Freeze the worst N adversaries as replayable CI fixtures. Accepts EITHER search
 * corpus entries (search.js: { latent, seed, flip, flipKind, distance, run_id,
 * tuples }) via `searchResults`, OR raw sweep tapes via `sweepTapes` (worst = most
 * oracle-labels, then most false-mastery steps). Each fixture is the MINIMAL replay
 * key: a fresh persona built from { latent, seed } reproduces the adversary exactly.
 *
 * @param {object} args
 *   @param {Array}  [args.searchResults]  search.js corpus entries (preferred).
 *   @param {Array}  [args.sweepTapes]     raw tapes (fallback when no search ran).
 *   @param {number} [args.n=5]            how many champions to freeze (keep small).
 *   @param {string} [args.skillId]        the skill the fixtures replay against
 *          (required when distilling from search corpus entries, which omit it).
 *   @param {number} [args.tauLatent=DEFAULT_TAU_LATENT]
 * @returns {Array} championFixtures
 */
export function distillChampions({
  searchResults,
  sweepTapes,
  n = 5,
  skillId,
  tauLatent = DEFAULT_TAU_LATENT,
} = {}) {
  if (Array.isArray(searchResults) && searchResults.length) {
    // Rank corpus entries: flippers first, then nearest-to-honest (smallest distance).
    const ranked = [...searchResults].sort((a, b) => {
      const fa = a.flip ? 0 : 1;
      const fb = b.flip ? 0 : 1;
      if (fa !== fb) return fa - fb;
      return (a.distance ?? Infinity) - (b.distance ?? Infinity);
    });
    return ranked.slice(0, Math.max(0, n)).map((c, i) => ({
      id: `champion-${i}:${c.run_id ?? 'corpus'}`,
      source: 'search',
      skillId: skillId || c.skillId || null,
      latent: c.latent,
      seed: c.seed,
      flip: !!c.flip,
      flipKind: c.flipKind ?? null,
      distance: c.distance ?? null,
      tauLatent,
    }));
  }

  if (Array.isArray(sweepTapes) && sweepTapes.length) {
    // Worst tapes = most oracle labels, then most false-mastery gate-open steps.
    const scored = sweepTapes.map((tape) => {
      const label = labelTape(tape, { tauLatent });
      const labelCount =
        (label.labels.falsePositiveMastery ? 1 : 0) +
        (label.labels.missedEscalation ? 1 : 0) +
        (label.labels.falseEscalation ? 1 : 0) +
        (label.labels.falseTransfer ? 1 : 0);
      const fmSteps = (label.labels.evidence.falsePositiveMastery || []).length;
      return { tape, labelCount, fmSteps };
    });
    scored.sort(
      (a, b) =>
        b.labelCount - a.labelCount ||
        b.fmSteps - a.fmSteps ||
        a.tape.run_id.localeCompare(b.tape.run_id)
    );
    return scored.slice(0, Math.max(0, n)).map(({ tape, labelCount }, i) => ({
      id: `champion-${i}:${tape.run_id}`,
      source: 'sweep',
      skillId: tape.skillId,
      latent: tape.persona_latents,
      persona_id: tape.persona_id,
      seed: tape.seed,
      flip: labelCount > 0,
      flipKind: null,
      distance: null,
      tauLatent,
    }));
  }

  return [];
}

/**
 * Replay frozen champions against the (current) engine — the fast CI regression
 * check (target < 60s; keep N small). A champion REGRESSES when replaying its
 * { latent, seed } reproduces a false-mastery flip (the adversary still beats the
 * engine). The check returns the worst-case false-mastery rate across the fixtures.
 *
 * @param {Array} fixtures  championFixtures from distillChampions.
 * @param {object} [opts] { stepCap?, tauLatent? }
 * @returns {{ regressed:boolean, falseMasteryRate:number, perChampion:Array }}
 */
export function replayChampions(fixtures, { stepCap = 24, tauLatent } = {}) {
  const list = Array.isArray(fixtures) ? fixtures : [];
  const perChampion = [];
  let flips = 0;

  for (const fx of list) {
    if (!fx.skillId) {
      // A fixture with no skill cannot be replayed against the engine; record it
      // as a non-regression but flag it so a malformed corpus is visible.
      perChampion.push({ id: fx.id, replayed: false, flip: false });
      continue;
    }
    const tau = typeof tauLatent === 'number' ? tauLatent : (fx.tauLatent ?? DEFAULT_TAU_LATENT);
    const persona = buildChampionPersona(fx);
    const tape = runSession({ persona, skillId: fx.skillId, seed: fx.seed, stepCap });
    const label = labelTape(tape, { tauLatent: tau });
    const flip = !!label.labels.falsePositiveMastery;
    if (flip) flips += 1;
    perChampion.push({ id: fx.id, replayed: true, flip });
  }

  const replayable = perChampion.filter((c) => c.replayed).length;
  return {
    regressed: flips > 0,
    falseMasteryRate: replayable > 0 ? flips / replayable : 0,
    perChampion,
  };
}

/** Build a FRESH persona from a champion fixture's minimal replay key. */
function buildChampionPersona(fx) {
  // Mirrors search.js: materialize a persona from a stored latent vector so the
  // stored { latent, seed } replays the adversary exactly.
  return makePersona({
    id: fx.persona_id || fx.id,
    klass: 'champion-replay',
    latent: fx.latent,
    meta: { approximates: 'a frozen adversary champion', mightMiss: 'n/a' },
  });
}
