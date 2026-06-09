// harness/findings.js — U7: the improvement-findings BACKLOG.
//
// buildBacklog(tapes, {tauLatent}) folds a synthetic-learner tape population into a
// RANKED, deduplicated backlog of concrete engine/pedagogy weaknesses. It is the
// red-team's "what to fix, in what order" output — consumed by U9 (the report) and
// U11 (the prioritized fix queue), so the ITEM SCHEMA here is a contract.
//
// FOUR finding categories, ranked highest-first by severity:
//   1. dead/bypassed pedagogy (HIGHEST) — reproduced audit defects from
//      runExpectedFindings. Each carries humanAgreementFlag:true (the audit
//      corroborates the harness) + a concrete proposed lever.
//   2. hint-ladder gaps — a (skill) the engine can only steer with RaiseScaffold/
//      EscalateToHuman because NO H1–H4 hint ladder exists: stuck personas plateau
//      (repeated errors → scaffold-down/escalate) while observation.hint_max_rung
//      never rises above 0 across the whole population for that skill.
//   3. nudge gaps — behavior windows (idle / oscillation / too_fast_correct) where a
//      Tier-2 nudge SHOULD fire but none is recorded on the tape, OR a nudge-eligible
//      window recurs and the persona keeps failing (ineffective nudge).
//   4. pedagogically-hard skills — skills ranked by a COMPOSITE risk score
//      (false-mastery + failed-transfer + mis-routing + reps-to-mastery) over the
//      population (via metrics.aggregate on the per-skill tape slice).
//
// RECONCILIATION (no double-counting): an audit-found weakness (category 1) for a
// skill SUPPRESSES the harness-found duplicate. A hint-ladder gap and a nudge gap on
// the same skill are DISTINCT levers (author a rung vs wire a nudge) and both stand.
//
// PURE PROJECTION: buildBacklog reads ONLY the tapes (+ the static audit probes) and
// is deterministic — re-deriving from the same tapes reproduces the same backlog
// byte-for-byte. No wall-clock, no fs.

import { aggregate } from './metrics.js';
import { DEFAULT_TAU_LATENT, labelTape } from './oracle/latentTruth.js';
import { runExpectedFindings } from './oracle/expectedFindings.js';
import { canonicalStringify } from './tape.js';
import { OSCILLATION_THRESHOLD, PAUSE_THRESHOLD_MS } from '../runtime/tier2.js';

// ---------------------------------------------------------------------------
// Severity bands (rank tiers). Higher = surfaces earlier in the backlog.
// ---------------------------------------------------------------------------

/** Category base severities — dead pedagogy outranks everything (KTD: ship-blocking). */
const CATEGORY_SEVERITY = Object.freeze({
  'dead-pedagogy': 100,
  'hint-ladder-gap': 60,
  'nudge-gap': 40,
  'pedagogically-hard-skill': 20,
});

// ---------------------------------------------------------------------------
// Per-skill tape grouping
// ---------------------------------------------------------------------------

function groupBySkill(tapes) {
  const bySkill = new Map();
  for (const t of tapes) {
    const sk = t.skillId;
    if (!bySkill.has(sk)) bySkill.set(sk, []);
    bySkill.get(sk).push(t);
  }
  return bySkill;
}

/** A tape is "stuck" when it ends on escalation OR the engine had to scaffold DOWN. */
function tapeIsStuck(tape) {
  const terminalEscalate = tape.terminal && tape.terminal.kind === 'EscalateToHuman';
  const raised = (tape.steps || []).some(
    (s) => s.decision && s.decision.kind === 'RaiseScaffold'
  );
  const repeatedErrors =
    (tape.steps || []).filter((s) => s.observation && s.observation.correct === false).length >= 2;
  return (terminalEscalate || raised) && repeatedErrors;
}

/** The MAX hint rung ever surfaced across a tape's observations (0 = no ladder seen). */
function maxHintRung(tape) {
  let max = 0;
  for (const s of tape.steps || []) {
    const r = s.observation ? s.observation.hint_max_rung ?? 0 : 0;
    if (r > max) max = r;
  }
  return max;
}

/**
 * Was the engine FORCED to steer this stuck tape with only RaiseScaffold/Escalate
 * (no FadeScaffold ever, i.e. no path that rewards progress)? Used to confirm the
 * skill's steering collapsed to "push the child down / hand off".
 */
function steeredOnlyByRaiseOrEscalate(tape) {
  const kinds = new Set((tape.steps || []).map((s) => (s.decision ? s.decision.kind : null)));
  const hasRaiseOrEscalate =
    kinds.has('RaiseScaffold') || (tape.terminal && tape.terminal.kind === 'EscalateToHuman');
  const hasFade = kinds.has('FadeScaffold');
  return hasRaiseOrEscalate && !hasFade;
}

// ---------------------------------------------------------------------------
// 1. dead/bypassed pedagogy — reproduced audit defects (HIGHEST rank).
// ---------------------------------------------------------------------------

/** Map an audit finding id → the concrete engineering lever that resolves it. */
const AUDIT_LEVERS = Object.freeze({
  'fluencyOk-always-true': 'certify-002-flag: calibrate AGE_BAND_MS + route fluencyHardMode through PARAMS',
  'independence-answer-value-proxy': 'fix distinctness proxy: key isIndependent on problem_id, not answer_value',
  'transfer-denominator-proxy': 'fix denominator proxy: key hasTransferred on structural surface_form, not the denominator',
  'dead-retention-probe': 'emit retention_probe: set last_retention_probe so the time-based demotion path can fire',
  'disengaged-never-escalates': 'wire disengagedCount: increment it from recentBehavior so the disengaged escalation trigger is reachable',
  'single-correct-stage-advance': 'certify-002-flag: rewire useLessonScaffold to advance on the mastery gate, not one correct',
});

/** The skill the audit probe exercises (all six run against ADD_SAME_DEN today). */
const AUDIT_SKILL = 'ADD_SAME_DEN';

function deadPedagogyItems(flags) {
  const { findings } = runExpectedFindings({ flags });
  const items = [];
  for (const f of findings) {
    if (!f.present) continue; // only REPRODUCED defects become backlog items.
    items.push({
      id: `dead-pedagogy:${f.id}`,
      category: 'dead-pedagogy',
      severity: CATEGORY_SEVERITY['dead-pedagogy'],
      skill: AUDIT_SKILL,
      personas: [f.persona_id],
      evidence: [
        { kind: 'auditFinding', findingId: f.id, persona_id: f.persona_id, evidence: f.evidence },
      ],
      humanAgreementFlag: true, // corroborated by the human audit (KTD14).
      proposedLever: AUDIT_LEVERS[f.id] || `resolve audit defect ${f.id}`,
    });
  }
  return items;
}

// ---------------------------------------------------------------------------
// 2. hint-ladder gaps — stuck personas plateau with a FLAT hint ladder.
// ---------------------------------------------------------------------------

function hintLadderGapItems(bySkill, suppressedSkills) {
  const items = [];
  for (const [skill, tapes] of bySkill) {
    if (suppressedSkills.has(skill)) continue; // reconciled by an audit item.

    const stuckTapes = tapes.filter(tapeIsStuck);
    if (stuckTapes.length === 0) continue;

    // The gap exists when, across EVERY stuck tape for this skill, the hint ladder
    // never rose above rung 0 — there is no H1–H4 to climb, so the only lever the
    // engine had was RaiseScaffold / EscalateToHuman.
    const ladderClimbed = tapes.some((t) => maxHintRung(t) > 0);
    if (ladderClimbed) continue;

    const onlyRaiseOrEscalate = stuckTapes.every(steeredOnlyByRaiseOrEscalate);
    if (!onlyRaiseOrEscalate) continue;

    const personas = [...new Set(stuckTapes.map((t) => t.persona_id))].sort();
    items.push({
      id: `hint-ladder-gap:${skill}`,
      category: 'hint-ladder-gap',
      severity: CATEGORY_SEVERITY['hint-ladder-gap'] + personas.length, // more affected → earlier.
      skill,
      personas,
      evidence: stuckTapes.slice(0, 5).map((t) => ({
        kind: 'tapeRef',
        run_id: t.run_id,
        persona_id: t.persona_id,
        maxHintRung: maxHintRung(t),
        terminal: t.terminal ? t.terminal.kind : null,
        raiseOrEscalateOnly: true,
      })),
      humanAgreementFlag: false,
      proposedLever: `author hint rung: add an H1–H4 hint ladder for ${skill} so stuck learners get graded support before RaiseScaffold/EscalateToHuman`,
    });
  }
  return items;
}

// ---------------------------------------------------------------------------
// 3. nudge gaps — Tier-2 windows that fire no nudge (or an ineffective one).
//
// Tapes do NOT record Tier-2 nudge events (the runner mirrors the empty
// recentBehavior channel — see sessionRunner header), so a behavior window that
// WOULD trigger a nudge always lacks a recorded one. We detect the eligible windows
// from the observation stream using the SAME thresholds tier2.js uses.
// ---------------------------------------------------------------------------

/** Classify the Tier-2 nudge a step's observation would be eligible for, if any. */
function nudgeWindowFor(obs) {
  if (!obs) return null;
  if ((obs.self_corrections ?? 0) >= OSCILLATION_THRESHOLD) return 'OSCILLATION';
  if ((obs.latency ?? 0) >= PAUSE_THRESHOLD_MS) return 'IDLE';
  if (obs.too_fast_correct === true) return 'TOO_FAST_CORRECT';
  return null;
}

/**
 * Did the tape record ANY Tier-2 nudge? Historically NONE did (the dead channel —
 * this was the gap). T26 wires the in-the-moment nudge: with the `tier2Nudge` flag
 * on, the runner records a `step.nudge` ({ type, payload }) for an idle / oscillation
 * / too-fast-correct window. We count that recorded nudge here (in addition to the
 * legacy decision-kind probe), so a flags-on tape with a fired nudge is no longer
 * flagged as a nudge gap. Flags-off tapes carry no nudge field → behavior unchanged.
 */
function tapeRecordedNudge(tape) {
  return (tape.steps || []).some(
    (s) =>
      (s.nudge && typeof s.nudge.type === 'string') ||
      (s.decision && /nudge|hint_offer|take_your_time|transfer_probe/i.test(s.decision.kind || ''))
  );
}

function nudgeGapItems(bySkill, suppressedSkills) {
  const items = [];
  for (const [skill, tapes] of bySkill) {
    if (suppressedSkills.has(skill)) continue;

    // Collect eligible windows + whether the persona kept failing afterward.
    const windows = [];
    for (const tape of tapes) {
      const recorded = tapeRecordedNudge(tape);
      const steps = tape.steps || [];
      for (let i = 0; i < steps.length; i++) {
        const kind = nudgeWindowFor(steps[i].observation);
        if (!kind) continue;
        // "ineffective" = the persona is still failing on a later attempt.
        const keptFailing = steps
          .slice(i + 1)
          .some((s) => s.observation && s.observation.correct === false);
        windows.push({
          run_id: tape.run_id,
          persona_id: tape.persona_id,
          step: i,
          window: kind,
          nudgeRecorded: recorded,
          keptFailing,
        });
      }
    }
    if (windows.length === 0) continue;

    const noNudge = windows.filter((w) => !w.nudgeRecorded);
    const ineffective = windows.filter((w) => w.nudgeRecorded && w.keptFailing);
    const gapWindows = noNudge.length ? noNudge : ineffective;
    if (gapWindows.length === 0) continue;

    const personas = [...new Set(gapWindows.map((w) => w.persona_id))].sort();
    const kinds = [...new Set(gapWindows.map((w) => w.window))].sort();
    const reason = noNudge.length ? 'no recorded nudge' : 'nudge fired but persona kept failing';
    items.push({
      id: `nudge-gap:${skill}`,
      category: 'nudge-gap',
      severity: CATEGORY_SEVERITY['nudge-gap'] + Math.min(personas.length, 10),
      skill,
      personas,
      evidence: gapWindows.slice(0, 5).map((w) => ({
        kind: 'tapeRef',
        run_id: w.run_id,
        persona_id: w.persona_id,
        step: w.step,
        window: w.window,
        nudgeRecorded: w.nudgeRecorded,
      })),
      humanAgreementFlag: false,
      proposedLever:
        `wire disengagedCount / emit nudge: feed recentBehavior so Tier-2 (${kinds.join('+')}) fires for ${skill} — ${reason}.`,
    });
  }
  return items;
}

// ---------------------------------------------------------------------------
// 4. pedagogically-hard skills — composite-risk ranking via metrics.aggregate.
// ---------------------------------------------------------------------------

/**
 * Composite risk per skill, in [0, ~4]. Weighted sum of the dangerous population
 * rates plus a reps-to-mastery penalty (normalized by stepCap-ish 40). All inputs
 * come from metrics.aggregate over the per-skill tape slice, so the score is a pure
 * projection of the tapes.
 */
function compositeRisk(metrics) {
  const fm = metrics.false_positive_mastery_rate ?? 0;
  const ft = metrics.false_transfer_rate ?? 0;
  const mr = metrics.mis_routing_rate_at_walls ?? 0;
  const me = metrics.missed_escalation_rate ?? 0;
  const reps = metrics.reps_to_mastery; // null when nothing ever gated.
  const repPenalty = typeof reps === 'number' ? Math.min(reps / 40, 1) : 0.5; // never-gated is risky.
  return 1.5 * fm + 1.2 * ft + 1.0 * mr + 1.0 * me + 0.5 * repPenalty;
}

function pedagogicallyHardItems(bySkill, tauLatent, suppressedSkills) {
  const scored = [];
  for (const [skill, tapes] of bySkill) {
    const metrics = aggregate(tapes, { tauLatent });
    scored.push({ skill, risk: compositeRisk(metrics), metrics, tapes });
  }
  // Stable order: risk desc, then skill id asc.
  scored.sort((a, b) => (b.risk - a.risk) || a.skill.localeCompare(b.skill));

  const items = [];
  for (const { skill, risk, metrics, tapes } of scored) {
    if (suppressedSkills.has(skill)) continue;
    if (risk <= 0) continue; // a skill with zero population risk is not a backlog item.
    const personas = [...new Set(tapes.map((t) => t.persona_id))].sort();
    items.push({
      id: `pedagogically-hard:${skill}`,
      category: 'pedagogically-hard-skill',
      // severity = base + risk*10 so the riskiest skill ranks first WITHIN the tier.
      severity: CATEGORY_SEVERITY['pedagogically-hard-skill'] + risk * 10,
      skill,
      personas,
      evidence: [
        {
          kind: 'verdict',
          risk,
          false_positive_mastery_rate: metrics.false_positive_mastery_rate,
          false_transfer_rate: metrics.false_transfer_rate,
          mis_routing_rate_at_walls: metrics.mis_routing_rate_at_walls,
          missed_escalation_rate: metrics.missed_escalation_rate,
          reps_to_mastery: metrics.reps_to_mastery,
          n_tapes: metrics.n_tapes,
        },
      ],
      humanAgreementFlag: false,
      proposedLever:
        `harden ${skill}: composite risk ${risk.toFixed(3)} (false-mastery ${(metrics.false_positive_mastery_rate ?? 0).toFixed(2)}, ` +
        `false-transfer ${(metrics.false_transfer_rate ?? 0).toFixed(2)}) — add transfer probes / tighten the gate evidence for this skill.`,
    });
  }
  return items;
}

// ---------------------------------------------------------------------------
// buildBacklog — the ranked, reconciled projection.
// ---------------------------------------------------------------------------

/**
 * Build the ranked improvement backlog from a tape population.
 *
 * @param {object[]} tapes  session tapes (sessionRunner schema).
 * @param {object} [opts]
 *   @param {number} [opts.tauLatent=DEFAULT_TAU_LATENT]  latent-mastery threshold.
 *   @param {object} [opts.flags={}]  plan-002 flag state threaded into the audit probe.
 * @returns {{ items: object[], humanAgreementWith: number }}
 *   items — ranked (severity desc) backlog of finding objects (schema below).
 *   humanAgreementWith — fraction of backlog items corroborated by the human audit.
 *
 * Item schema (the U9/U11 contract):
 *   {
 *     id: string,                 // unique, "<category>:<key>"
 *     category: 'dead-pedagogy' | 'hint-ladder-gap' | 'nudge-gap' | 'pedagogically-hard-skill',
 *     severity: number,           // higher = ranked earlier
 *     skill?: string,             // the skill node id this item implicates
 *     personas: string[],         // affected persona ids (sorted)
 *     evidence: Array<            // ≥1 ref backing the item
 *       { kind:'tapeRef', run_id, ... } |
 *       { kind:'verdict', risk, ... } |
 *       { kind:'auditFinding', findingId, ... }
 *     >,
 *     humanAgreementFlag: boolean,// true ⟺ corroborated by the human audit
 *     proposedLever: string,      // the concrete fix to make
 *   }
 */
export function buildBacklog(tapes, { tauLatent = DEFAULT_TAU_LATENT, flags = {} } = {}) {
  const bySkill = groupBySkill(tapes);

  // (1) dead/bypassed pedagogy — highest rank, corroborated by the audit.
  const dead = deadPedagogyItems(flags);

  // Reconcile: a skill already carrying an audit (dead-pedagogy) item is SUPPRESSED
  // from the harness-found categories so we never double-count the same skill's
  // weakness. (The audit item already names a concrete lever for it.)
  const suppressedSkills = new Set(dead.map((d) => d.skill));

  // (2) hint-ladder gaps, (3) nudge gaps, (4) pedagogically-hard skills.
  const hintGaps = hintLadderGapItems(bySkill, suppressedSkills);
  const nudgeGaps = nudgeGapItems(bySkill, suppressedSkills);
  const hardSkills = pedagogicallyHardItems(bySkill, tauLatent, suppressedSkills);

  const items = [...dead, ...hintGaps, ...nudgeGaps, ...hardSkills];

  // Rank by severity desc; tie-break by category order then id for stable output.
  const catOrder = Object.keys(CATEGORY_SEVERITY);
  items.sort((a, b) => {
    if (b.severity !== a.severity) return b.severity - a.severity;
    const ca = catOrder.indexOf(a.category);
    const cb = catOrder.indexOf(b.category);
    if (ca !== cb) return ca - cb;
    return a.id.localeCompare(b.id);
  });

  const corroborated = items.filter((it) => it.humanAgreementFlag).length;
  const humanAgreementWith = items.length ? corroborated / items.length : 0;

  return { items, humanAgreementWith };
}

// ---------------------------------------------------------------------------
// renderBacklogMarkdown — the docs/harness/improvement-backlog.md projection.
//
// PURE: returns the markdown STRING; the caller (a Node-only doc sink) writes it.
// This unit never touches fs.
// ---------------------------------------------------------------------------

const CATEGORY_LABEL = Object.freeze({
  'dead-pedagogy': 'Dead / bypassed pedagogy (audit-corroborated)',
  'hint-ladder-gap': 'Hint-ladder gaps',
  'nudge-gap': 'Tier-2 nudge gaps',
  'pedagogically-hard-skill': 'Pedagogically-hard skills',
});

/**
 * Project a backlog into markdown (the improvement-backlog.md body).
 * @param {{items:object[], humanAgreementWith:number}} backlog
 * @returns {string}
 */
export function renderBacklogMarkdown(backlog) {
  const { items, humanAgreementWith } = backlog;
  const lines = [];
  lines.push('# Improvement backlog (synthetic-learner red-team)');
  lines.push('');
  lines.push(`Ranked findings: **${items.length}**  ·  human-audit agreement: **${(humanAgreementWith * 100).toFixed(0)}%**`);
  lines.push('');

  // Group by category in rank-tier order.
  const catOrder = Object.keys(CATEGORY_SEVERITY);
  for (const cat of catOrder) {
    const inCat = items.filter((it) => it.category === cat);
    if (inCat.length === 0) continue;
    lines.push(`## ${CATEGORY_LABEL[cat] || cat}`);
    lines.push('');
    for (const it of inCat) {
      const agree = it.humanAgreementFlag ? ' ✓audit' : '';
      lines.push(`### ${it.id}${agree}`);
      lines.push(`- **severity**: ${it.severity}`);
      if (it.skill) lines.push(`- **skill**: ${it.skill}`);
      lines.push(`- **personas**: ${it.personas.length ? it.personas.join(', ') : '—'}`);
      lines.push(`- **proposed lever**: ${it.proposedLever}`);
      lines.push(`- **evidence**: ${it.evidence.length} ref(s) — ${summarizeEvidence(it.evidence)}`);
      lines.push('');
    }
  }
  return lines.join('\n');
}

function summarizeEvidence(evidence) {
  return evidence
    .map((e) => {
      if (e.kind === 'tapeRef') return `tape ${e.run_id}`;
      if (e.kind === 'auditFinding') return `audit ${e.findingId}`;
      if (e.kind === 'verdict') return `verdict risk=${typeof e.risk === 'number' ? e.risk.toFixed(3) : e.risk}`;
      return e.kind;
    })
    .join('; ');
}

// Re-export canonicalStringify so the pure-projection test can compare backlogs.
export { canonicalStringify };
