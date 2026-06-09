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
// Baseline report — the failure-mode report (clusters + counter-paired metrics).
// ---------------------------------------------------------------------------

/**
 * @param {object[]} tapes
 * @param {object} [opts] { tauLatent? }
 * @returns {{ metrics:object, clusters:object[], cards:object[], tauLatent:number,
 *             n_tapes:number }}
 */
export function buildBaselineReport(tapes, { tauLatent = DEFAULT_TAU_LATENT } = {}) {
  const metrics = aggregate(tapes, { tauLatent });
  const clusters = clusterFailures(tapes, { tauLatent });
  const cards = buildVerdictCards(tapes, { tauLatent });
  return {
    tauLatent,
    n_tapes: tapes.length,
    metrics: metrics.toJSON ? metrics.toJSON() : metrics,
    clusters,
    cards,
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

// Re-export so the projection-purity test can canonicalize a built artifact.
export { canonicalize, canonicalStringify };
