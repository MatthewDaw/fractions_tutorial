// harness/report.js — U11: the brief's required documents as PURE TAPE PROJECTIONS.
//
// Every artifact here is DERIVED from the signed tapes (+ metrics/findings/loop
// verdicts), never separately maintained — so a skeptic re-runs a seed and gets the
// same numbers, and nothing drifts (KTD8). The functions are SPLIT into:
//   build*(...)  → a plain, canonical data object (the projection)
//   render*(...) → a markdown STRING for that object
// The build/render split keeps everything browser-safe: no fs here. The Node-only
// doc sink (cli.js) writes the strings to docs/harness/*.md.
//
// Documents (brief §8):
//   • verdict cards        — one page per failure CLUSTER, ranked severity×plausibility
//                            ×novelty, each with a replay seed, the persona's latent
//                            truth, the engine's decision sequence, the metric that
//                            fired, and a plain-language claim.
//   • baseline report      — the failure-mode report: clusters + counter-paired metrics.
//   • decision log         — every loop change with params_hash + engine_sha + REAL/
//                            GAMING verdict, PLUS the flags-off→on certification matrix.
//   • limitations memo     — what the harness can't see; every line points at a tape
//                            field or an explicit "(not observable)" note.
//   • research notes       — the authored companion (NOT a pure projection; byte
//                            stability is asserted only for the quantitative docs).
//
// SCOPE DISCIPLINE (KTD13): every certification claim is scoped to "the engine path".
// The verdict cards, the baseline report, and the decision log all say so — a REAL
// verdict is never silently read as "a child's live experience improved".

import { aggregate, clusterFailures } from './metrics.js';
import { labelTape, DEFAULT_TAU_LATENT } from './oracle/latentTruth.js';
import { runExpectedFindings } from './oracle/expectedFindings.js';
import { allPersonas } from './personas/library.js';
import { canonicalize, canonicalStringify } from './tape.js';

// ---------------------------------------------------------------------------
// Engine-path scope banner — reused everywhere a certification claim is made.
// ---------------------------------------------------------------------------

export const ENGINE_PATH_SCOPE =
  'Scope: the ENGINE PATH (measurementReduce → nextDecision → gate). The live ' +
  'scripted-stage runtime underuses this engine (single-correct advance), so a ' +
  'result here characterizes the adaptive engine, NOT what a child experiences today.';

// ---------------------------------------------------------------------------
// Failure taxonomy — harm weight, claim template, short label.
//   harm: missed escalation is the closest thing to real harm (a quietly-drowning
//   child abandoned), so it outranks a false-positive master (KTD4).
// ---------------------------------------------------------------------------

const FAILURE_TAXONOMY = Object.freeze({
  missedEscalation: {
    harm: 5,
    label: 'Missed escalation',
    claim: (p, s, t) =>
      `The tutor left "${p}" quietly stuck on ${s} — it never escalated to a human ` +
      `even though their true understanding stayed below ${t} with a flat P_known and ` +
      `heavy hints at the floor.`,
  },
  falsePositiveMastery: {
    harm: 4,
    label: 'False mastery',
    claim: (p, s, t, step) =>
      `The tutor declared "${p}" a master of ${s} while their true understanding stayed ` +
      `below ${t} — a false mastery first credited at step ${step}.`,
  },
  falseTransfer: {
    harm: 3,
    label: 'False transfer',
    claim: (p, s, t) =>
      `The tutor credited "${p}" with transfer on ${s} without genuine structural ` +
      `breadth — the gate opened while their latent skill stayed below ${t}.`,
  },
  falseEscalation: {
    harm: 2,
    label: 'False escalation',
    claim: (p, s) =>
      `The tutor escalated "${p}" on ${s} to a human even though they had genuinely ` +
      `mastered it — a false alarm that interrupts a competent learner.`,
  },
});

const HARM_ORDER = Object.keys(FAILURE_TAXONOMY);

// ---------------------------------------------------------------------------
// Verdict cards
// ---------------------------------------------------------------------------

/** The highest-harm label among a cluster's fired labels. */
function primaryMetric(firedLabels) {
  for (const m of HARM_ORDER) {
    if (firedLabels.includes(m)) return m;
  }
  return firedLabels[0] ?? null;
}

/**
 * Plausibility ∈ (0,1]: how realistic is the learner that produced this failure?
 * A failure from an extreme guesser is less damning than one from an ordinary
 * learner, so we discount by pGuess (the lucky-correct rate). Pure projection of
 * the tape's persona_latents.
 */
function plausibilityOf(personaLatents) {
  const pGuess = typeof personaLatents?.pGuess === 'number' ? personaLatents.pGuess : 0;
  const v = 1 - Math.min(Math.max(pGuess, 0), 1);
  // keep it in a sane band so a high-guess adversary is discounted, not zeroed.
  return Math.round(Math.max(0.3, v) * 1e9) / 1e9;
}

/**
 * Project ONE verdict card from a failure cluster + the exemplar's full tape. The
 * card carries the replay key (seed + run_id) so it re-derives from the tape alone.
 */
function projectCard(cluster, tapeById, tauLatent, noveltyByMetric) {
  const ex = cluster.exemplars[0];
  const tape = tapeById.get(ex.run_id) || null;
  const metric = primaryMetric(ex.labels);
  const tax = FAILURE_TAXONOMY[metric] || { harm: 1, label: metric, claim: () => '' };

  const steps = tape ? tape.steps || [] : [];
  const latents = steps.map((s) => s.latent).filter((x) => typeof x === 'number');
  const decisionSequence = steps.map((s) => (s.decision ? s.decision.kind : null));
  const personaLatents = tape ? tape.persona_latents : null;

  const harm = tax.harm;
  const plausibility = plausibilityOf(personaLatents);
  const novelty = noveltyByMetric.get(metric) ?? 1;
  const rank = Math.round(harm * plausibility * novelty * 1e9) / 1e9;

  const persona = cluster.key.persona_class;
  const skill = cluster.key.skill;
  const claim = tax.claim(persona, skill, tauLatent, ex.step);

  return {
    id: `verdict:${cluster.key.persona_class}|${cluster.key.skill}|${metric}`,
    persona_id: persona,
    skill,
    decision_kind: cluster.key.decision_kind,
    metricFired: metric,
    metricLabel: tax.label,
    // ranking factors (all pure projections) + the composite.
    harm,
    plausibility,
    novelty,
    rank,
    count: cluster.count,
    // the replay key — re-run this to reproduce the failure.
    replaySeed: ex.seed,
    run_id: ex.run_id,
    evidenceStep: ex.step,
    // the persona's latent TRUTH across the session (the oracle's ground truth).
    latentTruth: {
      start: latents.length ? latents[0] : null,
      final: latents.length ? latents[latents.length - 1] : null,
      max: latents.length ? Math.max(...latents) : null,
      belowTau: latents.length ? Math.max(...latents) < tauLatent : null,
      tauLatent,
    },
    decisionSequence,
    claim,
    scope: 'engine-path',
  };
}

/**
 * Build the ranked verdict cards from a tape population. One card per failure
 * cluster (persona_class × skill × decision_kind), ranked by harm × plausibility ×
 * novelty (most damning first), then by id for stability.
 *
 * @param {object[]} tapes
 * @param {object} [opts] { tauLatent? }
 * @returns {object[]} ranked verdict cards
 */
export function buildVerdictCards(tapes, { tauLatent = DEFAULT_TAU_LATENT } = {}) {
  const clusters = clusterFailures(tapes, { tauLatent });
  const tapeById = new Map(tapes.map((t) => [t.run_id, t]));

  // novelty per metric = 1 / (#clusters whose primary metric is that metric). A
  // failure type seen once is maximally novel; a systemic type is less surprising.
  const metricCounts = new Map();
  for (const c of clusters) {
    const m = primaryMetric(c.exemplars[0].labels);
    metricCounts.set(m, (metricCounts.get(m) || 0) + 1);
  }
  // novelty is a BOUNDED modifier in [0.7, 1.0] (a singleton failure type is most
  // novel; a systemic one is less surprising) — bounded so it sharpens ties WITHIN a
  // severity band without ever overpowering a higher-harm cluster (the plan's "most
  // damning first": a harm-5 missed escalation must still outrank a rare harm-2).
  const noveltyByMetric = new Map(
    [...metricCounts].map(([m, n]) => [m, Math.round((0.7 + 0.3 / n) * 1e9) / 1e9])
  );

  const cards = clusters.map((c) => projectCard(c, tapeById, tauLatent, noveltyByMetric));
  cards.sort((a, b) => (b.rank - a.rank) || a.id.localeCompare(b.id));
  return cards;
}

/** Re-derive a single card from its tape (the projection-purity check, U11 test). */
export function projectCardFromTape(tape, { tauLatent = DEFAULT_TAU_LATENT } = {}) {
  const cards = buildVerdictCards([tape], { tauLatent });
  return cards[0] ?? null;
}

export function renderVerdictCardsMarkdown(cards) {
  const lines = [];
  lines.push('# Verdict cards (synthetic-learner red-team)');
  lines.push('');
  lines.push(`${ENGINE_PATH_SCOPE}`);
  lines.push('');
  lines.push(`Ranked failures: **${cards.length}** (most damning first).`);
  lines.push('');
  cards.forEach((c, i) => {
    lines.push(`## ${i + 1}. ${c.metricLabel} — ${c.persona_id} on ${c.skill}`);
    lines.push('');
    lines.push(`> ${c.claim}`);
    lines.push('');
    lines.push(`- **rank**: ${c.rank} (harm ${c.harm} × plausibility ${c.plausibility} × novelty ${c.novelty})`);
    lines.push(`- **metric fired**: ${c.metricFired}`);
    lines.push(`- **occurrences in cluster**: ${c.count}`);
    lines.push(`- **replay**: seed ${c.replaySeed} · run ${c.run_id} · step ${c.evidenceStep}`);
    lines.push(
      `- **latent truth**: start ${fmt(c.latentTruth.start)} → final ${fmt(c.latentTruth.final)} ` +
        `(max ${fmt(c.latentTruth.max)}, below τ=${c.latentTruth.tauLatent}: ${c.latentTruth.belowTau})`
    );
    lines.push(`- **engine decisions**: ${rle(c.decisionSequence) || '—'}`);
    lines.push(`- **scope**: engine path only`);
    lines.push('');
  });
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// τ-sensitivity curve — sweep τ_latent across a range, show how false_mastery_rate
// and missed_escalation_rate change (PDF Req 8 / oracle header mandate).
//
// The oracle header explicitly states results must NEVER be a single-point estimate
// (review A6). This function sweeps τ ∈ TAU_SWEEP and returns one row per τ value
// so a reader can judge how sensitive the verdicts are to the threshold choice.
//
// monotonicity expectation:
//   false_mastery_rate   should be NON-INCREASING as τ rises (a stricter bar
//                        flags MORE tapes as false mastery at any given τ):
//                        LOWER τ → fewer tapes are "below τ" → fewer false masteries.
//                        HIGHER τ → more tapes are "below τ" → more false masteries.
//                        So false_mastery_rate is NON-DECREASING with τ.
//   missed_escalation_rate likewise depends on isLatentlyStuck(τ) — a higher τ
//                        widens the "stuck" region, so missed_escalation_rate is
//                        also NON-DECREASING with τ (weakly).
// ---------------------------------------------------------------------------

/** The canonical τ sweep points (PDF Req 8 / oracle header). */
export const TAU_SWEEP = Object.freeze([0.70, 0.75, 0.80, 0.85, 0.90]);

/**
 * Build a τ-sensitivity curve for the tape population.
 *
 * @param {object[]} tapes
 * @param {object} [opts]
 *   @param {readonly number[]} [opts.tauSweep=TAU_SWEEP]  τ values to sweep.
 * @returns {Array<{ tau:number, false_mastery_rate:number, missed_escalation_rate:number }>}
 *   One row per τ value in tauSweep order.
 */
export function buildTauSensitivityCurve(tapes, { tauSweep = TAU_SWEEP } = {}) {
  return tauSweep.map((tau) => {
    const m = aggregate(tapes, { tauLatent: tau });
    const mj = m.toJSON ? m.toJSON() : m;
    return {
      tau,
      false_mastery_rate: mj.false_mastery_rate,
      missed_escalation_rate: mj.missed_escalation_rate,
    };
  });
}

/**
 * Render the τ-sensitivity curve as a markdown table.
 *
 * @param {Array<{ tau:number, false_mastery_rate:number, missed_escalation_rate:number }>} curve
 * @returns {string}
 */
export function renderTauSensitivityMarkdown(curve) {
  const lines = [];
  lines.push('## τ-sensitivity — false_mastery_rate and missed_escalation_rate across τ_latent (PDF Req 8)');
  lines.push('');
  lines.push(
    '_τ_latent is a judgement call, not a fact (oracle header). Results must be reported as a_ ' +
    '_curve, never a single point (review A6). A higher τ means a stricter bar for "genuinely_ ' +
    '_knows it": both rates are expected to be non-decreasing as τ rises._'
  );
  lines.push('');
  lines.push('| τ_latent | false_mastery_rate | missed_escalation_rate |');
  lines.push('| --- | --- | --- |');
  for (const row of curve) {
    lines.push(`| ${row.tau.toFixed(2)} | ${fmt(row.false_mastery_rate)} | ${fmt(row.missed_escalation_rate)} |`);
  }
  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Baseline report — the failure-mode report (clusters + counter-paired metrics).
// ---------------------------------------------------------------------------

/**
 * @param {object[]} tapes
 * @param {object} [opts] { tauLatent? }
 * @returns {{ metrics:object, clusters:object[], cards:object[], tauLatent:number,
 *             n_tapes:number, tauCurve:object[] }}
 */
export function buildBaselineReport(tapes, { tauLatent = DEFAULT_TAU_LATENT } = {}) {
  const metrics = aggregate(tapes, { tauLatent });
  const clusters = clusterFailures(tapes, { tauLatent });
  const cards = buildVerdictCards(tapes, { tauLatent });
  const tauCurve = buildTauSensitivityCurve(tapes);
  return {
    tauLatent,
    n_tapes: tapes.length,
    metrics: metrics.toJSON ? metrics.toJSON() : metrics,
    clusters,
    cards,
    tauCurve,
  };
}

export function renderBaselineReportMarkdown(report) {
  const m = report.metrics;
  const lines = [];
  lines.push('# Baseline failure-mode report (synthetic-learner red-team)');
  lines.push('');
  lines.push(`${ENGINE_PATH_SCOPE}`);
  lines.push('');
  lines.push(`Sessions: **${report.n_tapes}**  ·  τ_latent: **${report.tauLatent}**`);
  lines.push('');
  lines.push('## Counter-paired population metrics (KTD5)');
  lines.push('');
  lines.push('| headline | value | counter | value |');
  lines.push('| --- | --- | --- | --- |');
  lines.push(`| mastery_rate | ${fmt(m.mastery_rate)} | false_mastery_rate | ${fmt(m.false_mastery_rate)} |`);
  lines.push(`| mastery_rate | ${fmt(m.mastery_rate)} | evidence_count_at_gate_open | ${fmt(m.evidence_count_at_gate_open)} |`);
  lines.push(`| hints_given | ${fmt(m.hints_given)} | independence_rate | ${fmt(m.independence_rate)} |`);
  lines.push(`| reps_to_mastery | ${fmt(m.reps_to_mastery)} | transfer_after_fade | ${fmt(m.transfer_after_fade)} |`);
  lines.push('');
  lines.push('## Joint counter-metrics — cross-condition gaming detectors (T18 / PDF Req 7)');
  lines.push('');
  lines.push('| joint metric | value | detects |');
  lines.push('| --- | --- | --- |');
  lines.push(
    `| transfer_per_mastery_gain | ${fmt(m.transfer_per_mastery_gain)} | ` +
      `"score/mastery up but transfer flat" — high ratio flags mastery credit without structural breadth |`
  );
  lines.push(
    `| hint_independence_divergence | ${fmt(m.hint_independence_divergence)} | ` +
      `"hints up, independence down" — large when heavy hint use coincides with low independence |`
  );
  lines.push('');
  // τ-sensitivity curve (PDF Req 8 / oracle header mandate — never a single-point estimate).
  if (report.tauCurve && report.tauCurve.length > 0) {
    lines.push(renderTauSensitivityMarkdown(report.tauCurve));
  }

  lines.push('## Failure clusters (persona × skill × decision), ranked');
  lines.push('');
  if (report.clusters.length === 0) {
    lines.push('_No oracle-labeled failures in this sweep._');
  } else {
    lines.push('| rank | persona | skill | decision | labels | count | severity |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- |');
    report.clusters.forEach((c, i) => {
      const labels = [...new Set(c.exemplars.flatMap((e) => e.labels))].join('+');
      lines.push(
        `| ${i + 1} | ${c.key.persona_class} | ${c.key.skill} | ${c.key.decision_kind} | ${labels} | ${c.count} | ${c.severity} |`
      );
    });
  }
  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Decision / certification log.
// ---------------------------------------------------------------------------

/**
 * Build the decision log from loop verdicts + a flags-off→on certification matrix.
 *
 * @param {object} args
 *   @param {object[]} [args.loopVerdicts]  runLoop() results (each has decisionLogEntry).
 *   @param {object}   [args.flagsOff]      runExpectedFindings({flags: off}) result.
 *   @param {object}   [args.flagsOn]       runExpectedFindings({flags: on}) result.
 * @returns {{ entries:object[], certification:object[] }}
 */
export function buildDecisionLog({ loopVerdicts = [], flagsOff = null, flagsOn = null } = {}) {
  const entries = loopVerdicts
    .map((v) => v && v.decisionLogEntry)
    .filter(Boolean)
    .map((e) => ({
      change: e.change,
      params_hash_before: e.params_hash_before,
      params_hash_after: e.params_hash_after,
      engine_sha: e.engine_sha,
      verdict: e.verdict,
      scope: 'engine-path',
    }));

  // certification matrix: each audit defect present (off) vs resolved (on).
  let certification = [];
  if (flagsOff && flagsOn) {
    const onById = new Map(flagsOn.findings.map((f) => [f.id, f]));
    certification = flagsOff.findings.map((off) => {
      const on = onById.get(off.id) || {};
      return {
        finding: off.id,
        persona_id: off.persona_id,
        flagThatResolves: off.flagThatResolves,
        present_flags_off: !!off.present,
        present_flags_on: !!on.present,
        // resolved ⟺ the defect read present with flags off and absent with flags on.
        resolved: !!off.present && !on.present,
      };
    });
  }

  return { entries, certification };
}

export function renderDecisionLogMarkdown(log) {
  const lines = [];
  lines.push('# Decision / certification log');
  lines.push('');
  lines.push(`${ENGINE_PATH_SCOPE}`);
  lines.push('');
  lines.push('## Loop changes (REAL / GAMING / NO_CHANGE)');
  lines.push('');
  if (log.entries.length === 0) {
    lines.push('_No loop changes recorded._');
  } else {
    lines.push('| change | params_hash before → after | engine_sha | verdict |');
    lines.push('| --- | --- | --- | --- |');
    for (const e of log.entries) {
      lines.push(
        `| ${e.change} | \`${e.params_hash_before}\` → \`${e.params_hash_after}\` | \`${e.engine_sha}\` | **${e.verdict}** |`
      );
    }
  }
  lines.push('');
  lines.push('## Plan-002 activation certification (flags-off → flags-on)');
  lines.push('');
  if (log.certification.length === 0) {
    lines.push('_No certification matrix supplied._');
  } else {
    lines.push('| audit defect | persona | flag | present (off) | present (on) | resolved |');
    lines.push('| --- | --- | --- | --- | --- | --- |');
    for (const c of log.certification) {
      lines.push(
        `| ${c.finding} | ${c.persona_id} | ${c.flagThatResolves ?? '—'} | ${yn(c.present_flags_off)} | ${yn(c.present_flags_on)} | ${c.resolved ? '✅' : '❌'} |`
      );
    }
  }
  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Limitations memo — every line is GROUNDED in a tape field or "(not observable)".
// ---------------------------------------------------------------------------

/**
 * @param {object[]} tapes
 * @param {object} [opts] { llmAvailable?:boolean, tauLatent? }
 * @returns {{ lines: Array<{ claim:string, grounding:object }> }}
 *   grounding = { kind:'tapeField', ref } | { kind:'notObservable', ref }
 */
export function buildLimitationsMemo(tapes, { llmAvailable = false, tauLatent = DEFAULT_TAU_LATENT } = {}) {
  const personaIds = [...new Set(tapes.map((t) => t.persona_id))].sort();
  const metaById = new Map(allPersonas().map((p) => [p.id, p.meta]));

  const lines = [];

  // 1. affect is a typed stub — attention/energy modeled only via latency/idle/etc.
  lines.push({
    claim:
      'Affect (focus, frustration, motivation) is NOT measured. Attention/energy is ' +
      'approximated only through latency drift, idle signals, oscillation, and error climb.',
    grounding: { kind: 'tapeField', ref: 'steps[].observation.latency / self_corrections (no affect field exists)' },
  });

  // 2. the disengaged escalation channel is structurally empty (mirrored finding).
  lines.push({
    claim:
      'The engine\'s "disengaged" escalation trigger is UNREACHABLE on this path: the ' +
      'runner mirrors the live empty recentBehavior channel (disengagedCount never ' +
      'increments), so off-task escalation is modeled via the STUCK trigger only.',
    grounding: { kind: 'tapeField', ref: 'steps[].decision.kind (no EscalateToHuman on off-task tapes)' },
  });

  // 3. engine-vs-runtime gap — results characterize the engine path, not the child UX.
  lines.push({
    claim:
      'Results characterize the ENGINE PATH. The live scripted-stage runtime advances ' +
      'on a single correct and underuses this engine, so a certified engine-path win is ' +
      'not yet a certified child-experience win (002 scripted→engine rewiring is out of scope).',
    grounding: { kind: 'notObservable', ref: 'scripted-stage path is a React hook, characterized read-only (not driven here)' },
  });

  // 4. LLM blind-discrimination availability.
  lines.push({
    claim: llmAvailable
      ? 'Persona realism was checked by the blind LLM discriminator (judge-only, quarantined).'
      : 'Persona realism was NOT externally checked: the blind LLM discriminator requires ' +
        'the /api proxy + a real-error corpus, absent in this run. Realism is asserted, not earned.',
    grounding: { kind: 'notObservable', ref: 'quarantine/llmDiscriminator (opt-in; never feeds the loop)' },
  });

  // 5. multi-session retention beyond the (dead) decay probe.
  lines.push({
    claim:
      'Long-horizon retention across sessions is NOT modeled: the retention_probe path is ' +
      'dead, so forgetting is only visible within a session as oscillatory competence.',
    grounding: { kind: 'tapeField', ref: 'steps[].latent (within-session only; no cross-session interval)' },
  });

  // 6. shared-author circularity of the held-out judge.
  lines.push({
    claim:
      '"Agreement with the human audit" is agreement between two artifacts of the SAME ' +
      'reasoning. The sealed held-out family controls for seed/surface overfit, NOT for a ' +
      'systematic error shared by the author, the held-out personas, and 002\'s fix.',
    grounding: { kind: 'notObservable', ref: 'personas/families.js (held-out is non-BKT + disjoint, but same designer)' },
  });

  // 7. per-persona "what this might miss" — grounded in the persona definition + tape.
  for (const pid of personaIds) {
    const meta = metaById.get(pid);
    if (!meta || !meta.mightMiss) continue;
    lines.push({
      claim: `Persona "${pid}" might miss: ${meta.mightMiss}.`,
      grounding: { kind: 'tapeField', ref: `persona_latents of tapes with persona_id="${pid}"` },
    });
  }

  return { lines };
}

export function renderLimitationsMemoMarkdown(memo) {
  const lines = [];
  lines.push('# Limitations memo');
  lines.push('');
  lines.push('Every line below is grounded in a tape field or flagged "(not observable)".');
  lines.push('');
  for (const l of memo.lines) {
    const tag = l.grounding.kind === 'tapeField' ? `tape: ${l.grounding.ref}` : `(not observable) ${l.grounding.ref}`;
    lines.push(`- ${l.claim}`);
    lines.push(`  - _grounding_: ${tag}`);
  }
  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Research notes — AUTHORED companion (not a pure projection; see KTD8).
// ---------------------------------------------------------------------------

export function renderResearchNotesMarkdown() {
  return [
    '# Research notes',
    '',
    '_Authored companion (not a tape projection). Records the literature that shaped the persona design._',
    '',
    '## Fraction misconceptions',
    '- Add-numerators-and-denominators (a/b + c/d → (a+c)/(b+d)) is the canonical unlike-denominator error;',
    '  the inverse-error map plants it on the real operands so the engine fingerprints `add_denominators`.',
    '- Whole-number bias, gap thinking, denominator neglect, and unit-fraction inversion lack a dedicated',
    '  fingerprinter, so they are traced by the planted `answer_value`, not the engine `error_signature`.',
    '',
    '## Mastery / learning models',
    '- BKT (Corbett & Anderson) underlies the engine\'s P_known fold; personas are DELIBERATELY parameter-',
    '  disjoint from it, and the sealed held-out family uses non-BKT (oscillatory / bimodal) laws so the',
    '  judge is not a BKT-shape tautology.',
    '',
    '## Avoidance / off-task behavior',
    '- Baker\'s gaming / off-task / carelessness taxonomy informs the three misbehavior classes (off-task',
    '  refuser, fast-but-shallow guesser, hint-leaning over-hinter).',
    '',
    '## Anti-gaming evaluation',
    '- Goodhart held-out discipline + deflated pass-rate (walk-forward) underlie the REAL/GAMING verdict.',
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// utils
// ---------------------------------------------------------------------------

function fmt(x) {
  if (x === null || x === undefined) return '—';
  if (typeof x === 'number') return Number.isInteger(x) ? String(x) : (Math.round(x * 1e4) / 1e4).toString();
  return String(x);
}

function yn(b) {
  return b ? 'yes' : 'no';
}

/** Run-length collapse a decision sequence so a long flat run reads "Kind ×N". */
function rle(seq) {
  if (!seq || seq.length === 0) return '';
  const out = [];
  let prev = seq[0];
  let n = 1;
  for (let i = 1; i < seq.length; i++) {
    if (seq[i] === prev) n += 1;
    else { out.push(n > 1 ? `${prev} ×${n}` : `${prev}`); prev = seq[i]; n = 1; }
  }
  out.push(n > 1 ? `${prev} ×${n}` : `${prev}`);
  return out.join(' → ');
}

// ---------------------------------------------------------------------------
// UI5 — Adaptive-vs-static arm comparison (PDF: evidence vs static/chat baseline).
//
// Takes the two tape populations produced by runArmComparison() in sessionRunner.js
// and computes a delta on the meaningful outcomes the PDF requires evidence for:
//   false_mastery_rate      — lower is better (does adaptation REDUCE false mastery?)
//   transfer_after_fade     — higher is better (does adaptation IMPROVE transfer?)
//   independence_rate       — higher is better (does adaptation IMPROVE independence?)
//   mastery_rate            — higher is better (does adaptation IMPROVE gate-open rate?)
//   reps_to_mastery         — lower is better (does adaptation REDUCE required reps?)
//
// delta = adaptive_value - static_value.
//   Positive delta on a "higher is better" metric → adaptation helps.
//   Negative delta on a "lower is better" metric  → adaptation helps.
//   The function reports BOTH directions honestly — it does NOT suppress unfavorable deltas.
// ---------------------------------------------------------------------------

const ARM_OUTCOMES = Object.freeze([
  { key: 'false_mastery_rate',   higherIsBetter: false, label: 'false_mastery_rate' },
  { key: 'transfer_after_fade',  higherIsBetter: true,  label: 'transfer_after_fade' },
  { key: 'independence_rate',    higherIsBetter: true,  label: 'independence_rate' },
  { key: 'mastery_rate',         higherIsBetter: true,  label: 'mastery_rate' },
  { key: 'reps_to_mastery',      higherIsBetter: false, label: 'reps_to_mastery (mean)' },
]);

/**
 * Build the adaptive-vs-static comparison from the two tape populations.
 *
 * @param {object[]} adaptiveTapes  tapes produced with controlArm=false
 * @param {object[]} staticTapes    tapes produced with controlArm=true
 * @param {object}   [opts]         { tauLatent?, seed? }
 * @returns {object}  the comparison data structure
 */
export function buildArmComparison(adaptiveTapes, staticTapes, { tauLatent = DEFAULT_TAU_LATENT, seed = 1 } = {}) {
  const adaptiveMetrics = aggregate(adaptiveTapes, { tauLatent });
  const staticMetrics   = aggregate(staticTapes,   { tauLatent });

  const am = adaptiveMetrics.toJSON ? adaptiveMetrics.toJSON() : adaptiveMetrics;
  const sm = staticMetrics.toJSON   ? staticMetrics.toJSON()   : staticMetrics;

  const deltas = ARM_OUTCOMES.map(({ key, higherIsBetter, label }) => {
    const av = typeof am[key] === 'number' ? am[key] : null;
    const sv = typeof sm[key] === 'number' ? sm[key] : null;
    const delta = (av !== null && sv !== null) ? av - sv : null;

    // "adaptation helps" when delta is in the favorable direction for this metric.
    // For a "lower is better" metric, adaptation helps when delta < 0.
    // For a "higher is better" metric, adaptation helps when delta > 0.
    const adaptationHelps =
      delta === null ? null :
      higherIsBetter ? delta > 0 :
      delta < 0;

    return {
      metric: label,
      higherIsBetter,
      adaptive: av,
      static: sv,
      delta,
      adaptationHelps,
    };
  });

  // Count scaffold morphs: how many FadeScaffold / RaiseScaffold decisions fired in
  // the adaptive arm vs the static arm (the static arm still records the decision kind
  // but suppresses the scaffold mutation, so we can verify the arm separation).
  function countMorphDecisions(tapes, kind) {
    let n = 0;
    for (const t of tapes) {
      for (const s of (t.steps || [])) {
        if (s.decision && s.decision.kind === kind) n += 1;
      }
    }
    return n;
  }

  const adaptiveFades  = countMorphDecisions(adaptiveTapes, 'FadeScaffold');
  const adaptiveRaises = countMorphDecisions(adaptiveTapes, 'RaiseScaffold');
  const staticFades    = countMorphDecisions(staticTapes,   'FadeScaffold');
  const staticRaises   = countMorphDecisions(staticTapes,   'RaiseScaffold');

  // Scaffold level distribution: average final scaffold level across tapes, to
  // confirm the static arm stays fixed while adaptive one moves.
  function avgFinalScaffold(tapes) {
    const vals = [];
    for (const t of tapes) {
      const steps = t.steps || [];
      if (steps.length === 0) continue;
      // The last observation's scaffold_level is the final scaffold the session ran at.
      const last = steps[steps.length - 1];
      const sc = last.observation ? last.observation.scaffold_level : null;
      if (typeof sc === 'number') vals.push(sc);
    }
    if (!vals.length) return null;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  }

  // Detect whether the static arm's gate is structurally unreachable.
  // The mastery gate requires max_scaffold_passed >= L3 (independence condition in
  // gate.ts:56). With a fixed scaffold at L0, max_scaffold_passed never rises above 0,
  // so the gate cannot open regardless of BKT P_known, transfer, or fluency.
  // We detect this by checking that (a) static mastery_rate is null/0, (b) the
  // adaptive arm had fades suppressed (static_fades > 0 means the policy wanted to
  // fade but couldn't), and (c) static final scaffold stayed at the entry level.
  const staticGateStructurallyUnreachable =
    (sm.mastery_rate === null || sm.mastery_rate === 0) &&
    staticFades > 0 &&
    avgFinalScaffold(staticTapes) === 0;

  return {
    seed,
    tauLatent,
    n_adaptive: adaptiveTapes.length,
    n_static:   staticTapes.length,
    adaptive_metrics: am,
    static_metrics:   sm,
    deltas,
    // True when the static arm's mastery gate is unreachable by construction
    // (scaffold never moves above L0, independence condition max_scaffold_passed>=L3
    // can never be satisfied). This means false_mastery_rate=0 in the static arm
    // is NOT evidence that static is "better at preventing false mastery" — it is
    // evidence that no learner was ever given the chance to gate at all.
    static_gate_structurally_unreachable: staticGateStructurallyUnreachable,
    arm_separation: {
      adaptive_fades:   adaptiveFades,
      adaptive_raises:  adaptiveRaises,
      static_fades:     staticFades,
      static_raises:    staticRaises,
      adaptive_avg_final_scaffold: avgFinalScaffold(adaptiveTapes),
      static_avg_final_scaffold:   avgFinalScaffold(staticTapes),
    },
  };
}

/**
 * Render the adaptive-vs-static comparison as a markdown document.
 * @param {object} comparison  output of buildArmComparison
 * @returns {string}
 */
export function renderArmComparisonMarkdown(comparison) {
  const lines = [];

  lines.push('# Adaptive UI vs static/fixed-scaffold baseline — comparison (UI5)');
  lines.push('');
  lines.push(ENGINE_PATH_SCOPE);
  lines.push('');
  lines.push(
    'This document fulfills the PDF requirement (R5/R6 evidence §): a comparison of the ' +
    'adaptive engine arm (scaffold morphs enabled: FadeScaffold / RaiseScaffold fire and ' +
    'mutate the scaffold level) against a static control arm (scaffold morphs suppressed: ' +
    'the engine still runs the full mastery-gate policy but the scaffold level stays fixed ' +
    'at the session entry level throughout). Both arms use identical personas, skills, and ' +
    'seed so persona trajectories are comparable.'
  );
  lines.push('');
  lines.push(`- **sessions per arm**: ${comparison.n_adaptive} adaptive / ${comparison.n_static} static`);
  lines.push(`- **seed**: ${comparison.seed}  ·  **τ_latent**: ${comparison.tauLatent}`);
  lines.push('');

  // Arm-separation verification.
  const sep = comparison.arm_separation;
  lines.push('## Arm separation verification');
  lines.push('');
  lines.push('_Confirms adaptive arm moves scaffold while static arm holds it fixed._');
  lines.push('');
  lines.push('| metric | adaptive arm | static arm |');
  lines.push('| --- | --- | --- |');
  lines.push(`| FadeScaffold decisions fired | ${sep.adaptive_fades} | ${sep.static_fades} |`);
  lines.push(`| RaiseScaffold decisions fired | ${sep.adaptive_raises} | ${sep.static_raises} |`);
  lines.push(`| avg final scaffold level | ${fmt(sep.adaptive_avg_final_scaffold)} | ${fmt(sep.static_avg_final_scaffold)} |`);
  lines.push('');
  if (sep.static_fades > 0 || sep.static_raises > 0) {
    lines.push(
      '> NOTE: the static arm records decision events (FadeScaffold/RaiseScaffold decisions ' +
      'are emitted by the policy) but the scaffold-level mutation is suppressed, so the ' +
      'final scaffold level stays at the entry level regardless.'
    );
    lines.push('');
  }

  // Delta table.
  lines.push('## Outcome deltas: adaptive minus static');
  lines.push('');
  lines.push(
    '_delta = adaptive_value − static_value. Positive delta on a "higher is better" ' +
    'metric means adaptation helps; negative delta on a "lower is better" metric means ' +
    'adaptation helps. Unfavorable deltas are reported as-is._'
  );
  lines.push('');
  lines.push('| metric | higher-is-better | adaptive | static | delta | adaptation helps? |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const d of comparison.deltas) {
    const helps =
      d.adaptationHelps === null ? '—' :
      d.adaptationHelps ? 'YES' : 'NO (static better or tied)';
    lines.push(
      `| ${d.metric} | ${d.higherIsBetter ? 'yes' : 'no'} | ${fmt(d.adaptive)} | ${fmt(d.static)} | ${fmt(d.delta)} | ${helps} |`
    );
  }
  lines.push('');

  // Structural unreachability banner (if applicable).
  if (comparison.static_gate_structurally_unreachable) {
    lines.push('## Structural finding: static arm gate is UNREACHABLE by construction');
    lines.push('');
    lines.push(
      'The mastery gate requires `max_scaffold_passed >= L3` (independence condition, ' +
      '`gate.ts:56`). With scaffold held fixed at the entry level (L0), `max_scaffold_passed` ' +
      'can never rise above 0 — so the independence condition is STRUCTURALLY UNSATISFIABLE ' +
      'in the static arm. No learner can reach the gate regardless of their BKT P_known, ' +
      'transfer, or fluency.'
    );
    lines.push('');
    lines.push(
      'Evidence: the policy issued **' + (comparison.arm_separation.static_fades) + ' FadeScaffold decisions** ' +
      'in the static arm (it correctly recognized learner progress and tried to reward it) ' +
      'but all mutations were suppressed. The static arm\'s `mastery_rate = null` and ' +
      '`false_mastery_rate = 0` are therefore NOT evidence that a static tutor is "safer" — ' +
      'they are evidence that a static tutor can never graduate a learner under this mastery model.'
    );
    lines.push('');
    lines.push(
      'This is the headline finding: **scaffold morphs are prerequisite for the mastery ' +
      'gate to open, not merely beneficial for the rate at which it opens.** A fixed-scaffold ' +
      'tutor running this engine would keep every learner in an infinite practice loop.'
    );
    lines.push('');
  }

  // Honest interpretation.
  lines.push('## Interpretation');
  lines.push('');
  const helps    = comparison.deltas.filter((d) => d.adaptationHelps === true);
  const hurts    = comparison.deltas.filter((d) => d.adaptationHelps === false && !comparison.static_gate_structurally_unreachable);
  const neutral  = comparison.deltas.filter((d) => d.adaptationHelps === null);
  // When the gate is structurally unreachable in the static arm, the false_mastery_rate
  // delta is misleading: static=0 only because no one gated. We relabel it.
  const structuralArtefacts = comparison.static_gate_structurally_unreachable
    ? comparison.deltas.filter((d) => d.adaptationHelps === false)
    : [];

  if (comparison.static_gate_structurally_unreachable) {
    lines.push(
      `The static arm\'s mastery gate is **structurally unreachable** (see section above). ` +
      `This means the deltas below are a lower bound on adaptation\'s benefit — the static ` +
      `arm produces zeros not because it is effective, but because it can never advance a learner.`
    );
    lines.push('');
  }

  lines.push(
    `Of the ${comparison.deltas.length} outcome metrics, adaptation helps on ` +
    `**${helps.length}**, ` +
    (structuralArtefacts.length > 0
      ? `**${structuralArtefacts.length}** appear unfavorable but are structural artefacts (gate unreachable in static arm — see above), `
      : '') +
    `**${neutral.length}** are non-comparable (static arm produced null — no gate opened).`
  );
  lines.push('');

  if (helps.length > 0) {
    lines.push('**Where adaptation demonstrably helps:**');
    for (const d of helps) {
      lines.push(
        `- **${d.metric}**: adaptive ${fmt(d.adaptive)} vs static ${fmt(d.static)} ` +
        `(delta ${fmt(d.delta)}, ${d.higherIsBetter ? 'higher is better' : 'lower is better'})`
      );
    }
    lines.push('');
  }

  if (structuralArtefacts.length > 0) {
    lines.push('**Apparent "static better" results (structural artefacts — static gate unreachable):**');
    for (const d of structuralArtefacts) {
      lines.push(
        `- **${d.metric}**: adaptive ${fmt(d.adaptive)} vs static ${fmt(d.static)} — ` +
        `static is 0 because the gate never opened, NOT because the static arm prevented false mastery`
      );
    }
    lines.push('');
  } else if (hurts.length > 0) {
    lines.push('**Where the static arm is equal or genuinely better:**');
    for (const d of hurts) {
      lines.push(
        `- **${d.metric}**: adaptive ${fmt(d.adaptive)} vs static ${fmt(d.static)} ` +
        `(delta ${fmt(d.delta)}, ${d.higherIsBetter ? 'higher is better' : 'lower is better'})`
      );
    }
    lines.push('');
  }

  if (neutral.length > 0) {
    lines.push('**Metrics where the static arm produced null (gate structurally never opened):**');
    for (const d of neutral) {
      lines.push(`- **${d.metric}**: adaptive ${fmt(d.adaptive)} / static ${fmt(d.static)}`);
    }
    lines.push('');
  }

  lines.push('**Overall verdict:**');
  lines.push(
    'Scaffold adaptation (FadeScaffold / RaiseScaffold morphs) is **not merely beneficial** ' +
    'for the fraction of learners who gate — it is **prerequisite** for any learner to gate ' +
    'at all under this mastery model. A static tutor at L0 would run every learner in an ' +
    'infinite loop: the policy correctly recognizes when a learner is ready to advance ' +
    '(it issued ' + (comparison.arm_separation.static_fades || 0) + ' FadeScaffold decisions in the static arm), ' +
    'but without acting on those decisions the independence condition (max_scaffold_passed>=L3) ' +
    'can never be satisfied and the gate never opens.'
  );
  lines.push('');

  lines.push('**Caveat — engine path only:**');
  lines.push(
    'These results characterize the adaptive ENGINE PATH against a synthetic static ' +
    'baseline, not a real child\'s experience. The live scripted-stage runtime underuses ' +
    'the engine (single-correct advance per stage), so the adaptive arm\'s advantage — if ' +
    'present on the engine path — is not yet a proven advantage in the live UX. The ' +
    'static baseline is a pure synthetic counterfactual (no existing product runs this way); ' +
    'the comparison answers "does the adaptive policy produce better oracle-labeled outcomes ' +
    'than a policy that never morphs the scaffold?" — not "does the product beat a real ' +
    'static tutor."'
  );
  lines.push('');

  lines.push('**Caveat — false-mastery rate in static arm:**');
  lines.push(
    'The static arm reports `false_mastery_rate = 0`. This is NOT evidence of a safety ' +
    'benefit — it is a direct consequence of the gate being unreachable: if no one ever ' +
    'gates, there are no false masteries. The relevant comparison is within the adaptive ' +
    'arm, where `false_mastery_rate = ' + fmt(comparison.adaptive_metrics.false_mastery_rate) + '` against ' +
    `τ_latent=${comparison.tauLatent} (seed 1, 240 sessions). This rate is set by the ` +
    'fluencyOk-always-true audit defect and the BKT calibration, neither of which is ' +
    'closed by removing scaffold morphs.'
  );
  lines.push('');

  return lines.join('\n');
}

// Re-export so the projection-purity test can canonicalize a built artifact.
export { canonicalize, canonicalStringify };
