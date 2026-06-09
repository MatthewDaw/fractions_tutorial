// harness/metrics.js — U6: population metrics + failure clustering.
//
// HEADLINE/COUNTER PAIRING (KTD5): a headline metric that flatters the engine is
// MEANINGLESS without its counter-metric. We enforce the pairing in the TYPE: a
// MetricsRecord whose constructor THROWS if a headline lacks its counter, so a
// one-sided record can never be built or serialized.
//
//   mastery_rate          ⇒ false_mastery_rate + evidence_count_at_gate_open
//   hints_given           ⇒ independence_rate
//   reps_to_mastery       ⇒ transfer_after_fade
//
// T18 JOINT COUNTER-METRICS (PDF Req 7 — cross-conditioned gaming detectors):
// These are derived from PAIRS of scalars and require no additional pairing contract
// (they are themselves the cross-condition signal — each one IS a counter-metric).
//
//   transfer_per_mastery_gain  = false_transfer_rate / max(false_mastery_rate, ε)
//       Catches "score/mastery up but transfer flat": when mastery grows but
//       false_transfer_rate stays high relative to false_mastery_rate, the ratio
//       diverges — a gaming pattern where the engine credits mastery without genuine
//       structural breadth. Requires T13's independent false_transfer_rate.
//
//   hint_independence_divergence = hints_given × (1 − independence_rate)
//       Catches "hints up, independence down": scales hints_given by the fraction
//       of sessions that are NOT independent. Zero when hints are rare or independence
//       is high; large when both hints are heavy and independence is low.
//
// aggregate(tapes, {tauLatent}) folds the oracle-labeled tape population into one
// MetricsRecord (population + per-persona-class). clusterFailures groups labeled
// failures by (persona_class, skill, decision_kind) ranked by severity×count.
//
// PURE: no wall-clock, no fs.

import { labelTape, tapeHasAnyLabel, DEFAULT_TAU_LATENT } from './oracle/latentTruth.js';

// ---------------------------------------------------------------------------
// The top hint rung that "gives the answer away" (reveals the solution).
// ---------------------------------------------------------------------------
const ANSWER_GIVEAWAY_RUNG = 3;

// ---------------------------------------------------------------------------
// T18 — epsilon guard for the transfer_per_mastery_gain denominator.
// Prevents division-by-zero when false_mastery_rate is 0 or near-0.
// ---------------------------------------------------------------------------
const JOINT_METRIC_EPSILON = 1e-6;

// ---------------------------------------------------------------------------
// MetricsRecord — pairing enforced in the constructor (KTD5)
// ---------------------------------------------------------------------------

/**
 * The required counter for each headline metric. If a headline key is present,
 * ALL of its counters must be present (finite numbers), or the constructor throws.
 */
const REQUIRED_COUNTERS = Object.freeze({
  mastery_rate: ['false_mastery_rate', 'evidence_count_at_gate_open'],
  hints_given: ['independence_rate'],
  reps_to_mastery: ['transfer_after_fade'],
});

function isPresent(v) {
  return v !== undefined && v !== null;
}

export class MetricsRecord {
  /**
   * @param {object} fields  a flat metrics object. Headline keys trigger the
   *                         pairing check; every required counter must be present.
   */
  constructor(fields = {}) {
    for (const [headline, counters] of Object.entries(REQUIRED_COUNTERS)) {
      if (isPresent(fields[headline])) {
        const missing = counters.filter((c) => !isPresent(fields[c]));
        if (missing.length > 0) {
          throw new Error(
            `MetricsRecord: headline "${headline}" requires counter metric(s) ` +
              `[${missing.join(', ')}] — a one-sided (flattering) record is forbidden (KTD5).`
          );
        }
      }
    }
    Object.assign(this, fields);
    // Stamp the pairing contract so serialized records are self-describing.
    this.required_counters = REQUIRED_COUNTERS;
    Object.freeze(this);
  }

  /** Canonical, JSON-safe view (drops the frozen contract from the data plane). */
  toJSON() {
    const { required_counters, ...data } = this;
    return data;
  }
}

// ---------------------------------------------------------------------------
// Per-tape derived facts (used by both aggregate and clusterFailures)
// ---------------------------------------------------------------------------

function tapeFacts(tape, tauLatent) {
  const label = labelTape(tape, { tauLatent });
  const steps = tape.steps || [];
  const firstGate = steps.findIndex((s) => s.gate === true);
  const gated = firstGate >= 0;

  // evidence count at gate open = number of observations up to & including first gate.
  const evidenceAtGate = gated ? firstGate + 1 : null;

  // faded then transferred: a FadeScaffold decision precedes a later gate-open.
  const fadeIdx = steps.findIndex((s) => s.decision && s.decision.kind === 'FadeScaffold');
  const faded = fadeIdx >= 0;
  const transferAfterFade = faded && gated && firstGate > fadeIdx;

  // answers given away: a top-rung hint on a NON-correct (non-mastered) attempt.
  let answersGivenAway = 0;
  for (const s of steps) {
    const o = s.observation;
    if (!o) continue;
    if ((o.hint_max_rung ?? 0) >= ANSWER_GIVEAWAY_RUNG && o.correct === false) {
      answersGivenAway += 1;
    }
  }

  // avoidance + recovery: a stretch of incorrect/idle followed by a later correct.
  const firstWrong = steps.findIndex((s) => s.observation && s.observation.correct === false);
  const recovered =
    firstWrong >= 0 && steps.slice(firstWrong + 1).some((s) => s.observation && s.observation.correct === true);
  const hadAvoidance = firstWrong >= 0;

  // mis-routing at a wall: a RouteToRoom terminal/decision. (Structurally rare in
  // the headless runner since inKitchen is false; counted honestly when present.)
  const routed = (tape.terminal && tape.terminal.kind === 'RouteToRoom') ||
    steps.some((s) => s.decision && s.decision.kind === 'RouteToRoom');
  // A route is "mis-routed" when it routes despite the child being latently competent.
  const finalLatent = (() => {
    for (let i = steps.length - 1; i >= 0; i--) {
      if (typeof steps[i].latent === 'number') return steps[i].latent;
    }
    return null;
  })();
  const misRouted = routed && finalLatent !== null && finalLatent >= tauLatent;

  return {
    label,
    gated,
    firstGate,
    evidenceAtGate,
    faded,
    transferAfterFade,
    answersGivenAway,
    hadAvoidance,
    recovered,
    routed,
    misRouted,
    personaClass: tape.persona_id,
    skill: tape.skillId,
  };
}

function mean(xs) {
  const v = xs.filter((x) => typeof x === 'number' && Number.isFinite(x));
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
}

function rate(num, den) {
  return den > 0 ? num / den : 0;
}

// ---------------------------------------------------------------------------
// Population metrics computation (shared by aggregate + per-class)
// ---------------------------------------------------------------------------

function computeMetrics(factsList) {
  const n = factsList.length;
  const gatedFacts = factsList.filter((f) => f.gated);
  const fadedFacts = factsList.filter((f) => f.faded);
  const avoidanceFacts = factsList.filter((f) => f.hadAvoidance);
  const routedFacts = factsList.filter((f) => f.routed);

  const falseMastery = factsList.filter((f) => f.label.labels.falsePositiveMastery).length;

  const out = {
    n_tapes: n,
    // headline + counters.
    // mastery_rate is NULL (absent, not 0) when NO tape gated: its paired counter
    // evidence_count_at_gate_open is only meaningful once a gate has opened, so a
    // gateless population must not assert a flattering "0% mastery" headline whose
    // counter is null (that would trip the MetricsRecord pairing contract — KTD5).
    mastery_rate: gatedFacts.length ? rate(gatedFacts.length, n) : null,
    false_mastery_rate: rate(falseMastery, n),
    evidence_count_at_gate_open: gatedFacts.length
      ? Math.min(...gatedFacts.map((f) => f.evidenceAtGate))
      : null, // left-tail tripwire: the FEWEST observations that crossed the gate
    evidence_count_at_gate_open_mean: mean(gatedFacts.map((f) => f.evidenceAtGate)),

    hints_given: factsList.reduce((s, f) => s + f.answersGivenAway, 0),
    independence_rate: rate(
      factsList.filter((f) => f.gated && !f.label.labels.falsePositiveMastery).length,
      n
    ),

    reps_to_mastery: mean(gatedFacts.map((f) => f.firstGate + 1)),
    transfer_after_fade: rate(
      factsList.filter((f) => f.transferAfterFade).length,
      Math.max(1, fadedFacts.length)
    ),

    // additional population metrics (no pairing requirement)
    answers_given_away: factsList.reduce((s, f) => s + f.answersGivenAway, 0),
    avoidance_recovery_rate: rate(
      avoidanceFacts.filter((f) => f.recovered).length,
      Math.max(1, avoidanceFacts.length)
    ),
    mis_routing_rate_at_walls: rate(
      routedFacts.filter((f) => f.misRouted).length,
      Math.max(1, routedFacts.length)
    ),
    false_positive_mastery_rate: rate(falseMastery, n),
    missed_escalation_rate: rate(
      factsList.filter((f) => f.label.labels.missedEscalation).length,
      n
    ),
    false_escalation_rate: rate(
      factsList.filter((f) => f.label.labels.falseEscalation).length,
      n
    ),
    false_transfer_rate: rate(
      factsList.filter((f) => f.label.labels.falseTransfer).length,
      n
    ),
  };

  // T18 — joint counter-metrics: cross-condition gaming detectors (PDF Req 7).
  // Computed AFTER the scalar block so both inputs are available as named locals.

  // transfer_per_mastery_gain: high when transfer rate is elevated relative to
  // mastery rate — signals "mastery credited without structural breadth".
  // Uses T13-independent false_transfer_rate (not a duplicate of false_mastery_rate).
  out.transfer_per_mastery_gain =
    out.false_transfer_rate / Math.max(out.false_mastery_rate, JOINT_METRIC_EPSILON);

  // hint_independence_divergence: high when many hints were given AND independence
  // is low — signals "hints up, independence down" gaming pattern.
  out.hint_independence_divergence = out.hints_given * (1 - out.independence_rate);

  return out;
}

// ---------------------------------------------------------------------------
// aggregate — population + per-persona-class MetricsRecord
// ---------------------------------------------------------------------------

/**
 * Fold an oracle-labeled tape population into one MetricsRecord.
 *
 * @param {object[]} tapes
 * @param {object} [opts] { tauLatent? }
 * @returns {MetricsRecord}  population metrics + `per_persona_class` map of plain
 *          metrics objects (per-class records are kept as plain objects so a single
 *          top-level MetricsRecord enforces the pairing contract for the whole report).
 */
export function aggregate(tapes, { tauLatent = DEFAULT_TAU_LATENT } = {}) {
  const factsList = tapes.map((t) => tapeFacts(t, tauLatent));

  // Per-persona-class breakdown.
  const byClass = new Map();
  for (const f of factsList) {
    if (!byClass.has(f.personaClass)) byClass.set(f.personaClass, []);
    byClass.get(f.personaClass).push(f);
  }
  const per_persona_class = {};
  for (const [klass, list] of byClass) {
    per_persona_class[klass] = computeMetrics(list);
  }

  const population = computeMetrics(factsList);

  return new MetricsRecord({
    tau_latent: tauLatent,
    ...population,
    per_persona_class,
  });
}

// ---------------------------------------------------------------------------
// clusterFailures — group labeled failures by (persona_class, skill, decision_kind)
// ---------------------------------------------------------------------------

/**
 * Severity weight per oracle label — false mastery and missed escalation are the
 * most dangerous (a child wrongly advanced / wrongly abandoned).
 */
const LABEL_SEVERITY = Object.freeze({
  falsePositiveMastery: 4,
  missedEscalation: 4,
  falseTransfer: 3,
  falseEscalation: 2,
});

/**
 * Cluster failing tapes by (persona_class, skill, decision_kind), ranked by
 * severity×count. A "failure" is any tape carrying ≥1 oracle label; we attribute
 * it to the decision_kind of the FIRST labeled step (or the terminal kind when the
 * label is terminal, e.g. missed/false escalation).
 *
 * @param {object[]} tapes
 * @param {object} [opts] { tauLatent? }
 * @returns {Array<{ key:{persona_class,skill,decision_kind}, count:number,
 *                   severity:number, exemplars:Array<{run_id,seed,step,labels}> }>}
 */
export function clusterFailures(tapes, { tauLatent = DEFAULT_TAU_LATENT } = {}) {
  const clusters = new Map();

  for (const tape of tapes) {
    const label = labelTape(tape, { tauLatent });
    if (!tapeHasAnyLabel(label)) continue;

    // Which labels fired, and at what severity.
    const firedLabels = Object.keys(LABEL_SEVERITY).filter((k) => label.labels[k]);
    const sev = Math.max(...firedLabels.map((k) => LABEL_SEVERITY[k]));

    // Attribute to the decision_kind of the first labeled step. For step-level
    // labels (false mastery / false transfer) that is the first gate-open step's
    // decision; for terminal labels (escalation) it is the terminal kind.
    let decisionKind = null;
    let step = -1;
    const fpEv = label.labels.evidence.falsePositiveMastery;
    const ftEv = label.labels.evidence.falseTransfer;
    if (fpEv.length || ftEv.length) {
      step = (fpEv[0] || ftEv[0]).step;
      decisionKind = tape.steps[step] && tape.steps[step].decision
        ? tape.steps[step].decision.kind
        : null;
    } else {
      // escalation labels — attribute to the terminal kind.
      decisionKind = tape.terminal ? tape.terminal.kind : null;
      step = tape.terminal ? tape.terminal.step : -1;
    }

    const key = {
      persona_class: tape.persona_id,
      skill: tape.skillId,
      decision_kind: decisionKind,
    };
    const keyStr = `${key.persona_class}|${key.skill}|${key.decision_kind}`;

    if (!clusters.has(keyStr)) {
      clusters.set(keyStr, { key, count: 0, maxSeverity: 0, exemplars: [] });
    }
    const c = clusters.get(keyStr);
    c.count += 1;
    c.maxSeverity = Math.max(c.maxSeverity, sev);
    if (c.exemplars.length < 5) {
      c.exemplars.push({
        run_id: tape.run_id,
        seed: tape.seed,
        step,
        labels: firedLabels,
      });
    }
  }

  const out = [...clusters.values()].map((c) => ({
    key: c.key,
    count: c.count,
    severity: c.maxSeverity,
    exemplars: c.exemplars,
  }));

  // Rank by severity×count descending, then count, then key string for stability.
  out.sort((a, b) => {
    const sa = a.severity * a.count;
    const sb = b.severity * b.count;
    if (sb !== sa) return sb - sa;
    if (b.count !== a.count) return b.count - a.count;
    return `${a.key.persona_class}|${a.key.skill}|${a.key.decision_kind}`.localeCompare(
      `${b.key.persona_class}|${b.key.skill}|${b.key.decision_kind}`
    );
  });

  return out;
}
