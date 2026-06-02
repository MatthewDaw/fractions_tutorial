// U11 — report projections: verdict cards, baseline report, decision log,
// limitations memo. Every quantitative artifact is a PURE projection of the tapes
// (re-deriving reproduces it byte-for-byte); the limitations memo is fully grounded;
// verdict cards rank the most damning failure first.
import { describe, it, expect } from 'vitest';
import {
  buildVerdictCards,
  projectCardFromTape,
  renderVerdictCardsMarkdown,
  buildBaselineReport,
  renderBaselineReportMarkdown,
  buildDecisionLog,
  renderDecisionLogMarkdown,
  buildLimitationsMemo,
  renderLimitationsMemoMarkdown,
  renderResearchNotesMarkdown,
  canonicalStringify,
} from '../../src/harness/report.js';

const TAU = 0.8;

// ---------------------------------------------------------------------------
// Fabricated tapes — deterministic control over the failure mix.
// ---------------------------------------------------------------------------

// A quietly-drowning learner: 8 attempts at floor scaffold, heavy hints, flat low
// P_known, low flat latent, never escalated → MISSED ESCALATION (harm 5).
function missedEscalationTape() {
  const steps = [];
  for (let i = 0; i < 8; i++) {
    steps.push({
      decision: { kind: 'RaiseScaffold', rationale: 'stuck' },
      observation: { correct: false, scaffold_level: 0, hint_max_rung: 3, latency: 5000 },
      gate: false,
      latent: 0.3,
      pknown: 0.4,
    });
  }
  return {
    run_id: 'r-missed', seed: 5, persona_id: 'drowning', persona_latents: { pGuess: 0.1 },
    params_hash: 'aaaa1111', engine_sha: 'dev', flags: {}, skillId: 'ADD_UNLIKE_COPRIME',
    steps, terminal: { kind: 'StepCap', step: 8 },
  };
}

// A lucky guesser the engine over-credits: one gate-open while latent < τ → FALSE
// MASTERY (harm 4), discounted by a higher pGuess.
function falseMasteryTape() {
  return {
    run_id: 'r-false', seed: 6, persona_id: 'guesser', persona_latents: { pGuess: 0.3 },
    params_hash: 'aaaa1111', engine_sha: 'dev', flags: {}, skillId: 'ADD_SAME_DEN',
    steps: [
      { decision: { kind: 'PresentProblem', rationale: '' }, observation: { correct: true, scaffold_level: 3, hint_max_rung: 0, latency: 300 }, gate: true, latent: 0.5, pknown: 0.97 },
    ],
    terminal: { kind: 'StepCap', step: 1 },
  };
}

// A clean, honest master: gate-open while latent ≥ τ → NO label (no card).
function cleanTape() {
  return {
    run_id: 'r-clean', seed: 7, persona_id: 'honest', persona_latents: { pGuess: 0.05 },
    params_hash: 'aaaa1111', engine_sha: 'dev', flags: {}, skillId: 'ADD_SAME_DEN',
    steps: [
      { decision: { kind: 'PresentProblem', rationale: '' }, observation: { correct: true, scaffold_level: 3, hint_max_rung: 0, latency: 3000 }, gate: true, latent: 0.95, pknown: 0.97 },
    ],
    terminal: { kind: 'ReturnToKitchen', step: 1 },
  };
}

const TAPES = [missedEscalationTape(), falseMasteryTape(), cleanTape()];

// ---------------------------------------------------------------------------

describe('verdict cards — ranked, pure projections', () => {
  it('ranks the highest-harm failure (missed escalation) first', () => {
    const cards = buildVerdictCards(TAPES, { tauLatent: TAU });
    expect(cards.length).toBe(2); // the clean tape produces no card
    expect(cards[0].metricFired).toBe('missedEscalation');
    expect(cards[0].harm).toBe(5);
    expect(cards[1].metricFired).toBe('falsePositiveMastery');
    // harm-weighted: missed (5×0.9×1=4.5) outranks false mastery (4×0.7×1=2.8).
    expect(cards[0].rank).toBeGreaterThan(cards[1].rank);
  });

  it('carries the replay key + latent truth + decision sequence', () => {
    const cards = buildVerdictCards(TAPES, { tauLatent: TAU });
    const missed = cards[0];
    expect(missed.replaySeed).toBe(5);
    expect(missed.run_id).toBe('r-missed');
    expect(missed.latentTruth.belowTau).toBe(true);
    expect(missed.latentTruth.tauLatent).toBe(TAU);
    expect(missed.decisionSequence).toContain('RaiseScaffold');
    expect(missed.scope).toBe('engine-path');
    expect(missed.claim).toMatch(/never escalated/i);
  });

  it('re-derives a card from its tape alone (projection purity)', () => {
    const fromAll = buildVerdictCards([missedEscalationTape()], { tauLatent: TAU })[0];
    const fromTape = projectCardFromTape(missedEscalationTape(), { tauLatent: TAU });
    expect(canonicalStringify(fromTape)).toBe(canonicalStringify(fromAll));
  });

  it('is byte-stable across two builds', () => {
    const a = buildVerdictCards(TAPES, { tauLatent: TAU });
    const b = buildVerdictCards(TAPES, { tauLatent: TAU });
    expect(canonicalStringify(b)).toBe(canonicalStringify(a));
  });

  it('renders markdown with the claim and replay seed', () => {
    const md = renderVerdictCardsMarkdown(buildVerdictCards(TAPES, { tauLatent: TAU }));
    expect(md).toMatch(/Missed escalation/);
    expect(md).toMatch(/seed 5/);
    expect(md).toMatch(/engine path/i);
  });
});

describe('baseline report — counter-paired metrics + clusters', () => {
  it('builds counter-paired metrics and byte-stable output', () => {
    const a = buildBaselineReport(TAPES, { tauLatent: TAU });
    const b = buildBaselineReport(TAPES, { tauLatent: TAU });
    expect(canonicalStringify(b)).toBe(canonicalStringify(a));
    expect(a.n_tapes).toBe(3);
    // headline mastery_rate is paired with its counter false_mastery_rate.
    expect(a.metrics).toHaveProperty('false_mastery_rate');
    expect(a.metrics).toHaveProperty('evidence_count_at_gate_open');
  });

  it('renders the failure-cluster table', () => {
    const md = renderBaselineReportMarkdown(buildBaselineReport(TAPES, { tauLatent: TAU }));
    expect(md).toMatch(/Failure clusters/);
    expect(md).toMatch(/drowning/);
    expect(md).toMatch(/false_mastery_rate/);
  });
});

describe('decision log — pins hashes + verdict, certifies flags-off→on', () => {
  it('projects loop verdict entries with both param hashes + engine_sha', () => {
    const loopVerdicts = [
      { decisionLogEntry: { change: 'plan-002-flags', params_hash_before: 'h0', params_hash_after: 'h1', engine_sha: 'abc1234', verdict: 'REAL' } },
    ];
    const log = buildDecisionLog({ loopVerdicts });
    expect(log.entries).toHaveLength(1);
    expect(log.entries[0]).toMatchObject({
      change: 'plan-002-flags', params_hash_before: 'h0', params_hash_after: 'h1',
      engine_sha: 'abc1234', verdict: 'REAL',
    });
  });

  it('builds the certification matrix (present off → resolved on)', () => {
    const flagsOff = { findings: [
      { id: 'fluencyOk-always-true', persona_id: 'fast-shallow-guesser', flagThatResolves: 'fluencyHardMode', present: true },
      { id: 'dead-retention-probe', persona_id: 'oscillator', flagThatResolves: 'delayedProbe', present: true },
    ] };
    const flagsOn = { findings: [
      { id: 'fluencyOk-always-true', present: false }, // resolved
      { id: 'dead-retention-probe', present: true },   // still present
    ] };
    const log = buildDecisionLog({ flagsOff, flagsOn });
    const byId = Object.fromEntries(log.certification.map((c) => [c.finding, c]));
    expect(byId['fluencyOk-always-true'].resolved).toBe(true);
    expect(byId['dead-retention-probe'].resolved).toBe(false);
  });

  it('renders the decision-log markdown with the verdict', () => {
    const md = renderDecisionLogMarkdown(buildDecisionLog({
      loopVerdicts: [{ decisionLogEntry: { change: 'c', params_hash_before: 'a', params_hash_after: 'b', engine_sha: 's', verdict: 'GAMING' } }],
    }));
    expect(md).toMatch(/GAMING/);
    expect(md).toMatch(/engine path/i);
  });
});

describe('limitations memo — every line is grounded', () => {
  it('every line points at a tape field or an explicit not-observable note', () => {
    const memo = buildLimitationsMemo(TAPES, { llmAvailable: false, tauLatent: TAU });
    expect(memo.lines.length).toBeGreaterThan(0);
    for (const l of memo.lines) {
      expect(['tapeField', 'notObservable']).toContain(l.grounding.kind);
      expect(typeof l.grounding.ref).toBe('string');
      expect(l.grounding.ref.length).toBeGreaterThan(0);
      expect(typeof l.claim).toBe('string');
    }
  });

  it('flips the LLM-availability line on the flag', () => {
    const off = buildLimitationsMemo(TAPES, { llmAvailable: false });
    const on = buildLimitationsMemo(TAPES, { llmAvailable: true });
    expect(canonicalStringify(off)).not.toBe(canonicalStringify(on));
    const md = renderLimitationsMemoMarkdown(off);
    expect(md).toMatch(/not observable/i);
  });

  it('is byte-stable across two builds', () => {
    const a = buildLimitationsMemo(TAPES, { llmAvailable: false });
    const b = buildLimitationsMemo(TAPES, { llmAvailable: false });
    expect(canonicalStringify(b)).toBe(canonicalStringify(a));
  });
});

describe('research notes — authored companion', () => {
  it('renders a non-empty markdown doc', () => {
    const md = renderResearchNotesMarkdown();
    expect(md).toMatch(/Research notes/);
    expect(md).toMatch(/BKT/);
  });
});
