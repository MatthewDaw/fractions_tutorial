// U5 — expected-findings audit (expectedFindings.js) + latentTruth fixture labels.
//
// runExpectedFindings encodes the 6 audited dead-pedagogy defects as expected
// BEHAVIORAL signatures, each tied to a diagnostic persona. humanAgreement =
// fraction of the 6 the harness REPRODUCES on the current engine.
//
// ROBUSTNESS (review): plan-002's on-main work MAY have resolved some defects, so
// these assertions pin the finding-object SHAPE + that humanAgreement is computed
// — NOT that any specific defect is present. (The certification of which defects
// are present vs resolved lives in the agent's summary, not as a brittle assert.)
import { describe, it, expect } from 'vitest';
import { runExpectedFindings } from '../../src/harness/oracle/expectedFindings.js';
import { runSession } from '../../src/harness/sessionRunner.js';
import { personaById } from '../../src/harness/personas/library.js';
import { detectImplausibleFluencyGate } from '../../src/harness/oracle/positiveControl.js';
import { labelTape } from '../../src/harness/oracle/latentTruth.js';

// ---------------------------------------------------------------------------
// runExpectedFindings — shape + humanAgreement (robust to present|resolved).
// ---------------------------------------------------------------------------

describe('runExpectedFindings — 6 audit-defect findings, each shaped + humanAgreement computed', () => {
  const result = runExpectedFindings({});

  it('returns exactly the 6 audit-defect findings', () => {
    expect(result.findings).toHaveLength(6);
    const ids = result.findings.map((f) => f.id);
    expect(ids).toEqual([
      'fluencyOk-always-true',
      'independence-answer-value-proxy',
      'transfer-denominator-proxy',
      'dead-retention-probe',
      'disengaged-never-escalates',
      'single-correct-stage-advance',
    ]);
  });

  it('every finding carries { present:boolean, evidence, persona_id }', () => {
    for (const f of result.findings) {
      expect(typeof f.present).toBe('boolean');
      expect(typeof f.persona_id).toBe('string');
      expect(f.persona_id.length).toBeGreaterThan(0);
      expect(f.evidence).toBeTypeOf('object');
      expect(f.evidence).not.toBeNull();
      // each finding names the 002 flag that WILL resolve it (or null for the
      // scaffold-rewire defect that no flag covers).
      expect('flagThatResolves' in f).toBe(true);
    }
  });

  it('humanAgreement is a computed fraction in [0,1] equal to reproduced/6', () => {
    const reproduced = result.findings.filter((f) => f.present).length;
    expect(result.humanAgreement).toBeCloseTo(reproduced / 6, 10);
    expect(result.humanAgreement).toBeGreaterThanOrEqual(0);
    expect(result.humanAgreement).toBeLessThanOrEqual(1);
  });

  it('threads the resolved (defaulted) flag state through the result', () => {
    expect(result.flags).toMatchObject({
      fluencyHardMode: false,
      frustrationScaffold: false,
      delayedProbe: false,
      unifiedTaxonomy: false,
    });
  });

  it('flags-ON run still returns 6 shaped findings (002 flags are inert stubs today)', () => {
    const flagged = runExpectedFindings({
      flags: { fluencyHardMode: true, unifiedTaxonomy: true, delayedProbe: true, frustrationScaffold: true },
    });
    expect(flagged.findings).toHaveLength(6);
    expect(typeof flagged.humanAgreement).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Persona-level behavioral signatures (robust facts, not defect presence).
// ---------------------------------------------------------------------------

describe('expected-findings persona signatures', () => {
  it('the off-task persona reaches stepCap with NO EscalateToHuman (disengaged trigger unreachable)', () => {
    const tape = runSession({ persona: personaById('off-task'), skillId: 'ADD_SAME_DEN', seed: 2, stepCap: 40 });
    expect(tape.terminal.kind).not.toBe('EscalateToHuman');
    // It runs the full cap (the disengaged escalation path never fires).
    expect(tape.terminal.kind).toBe('StepCap');
    // …and every attempt is a refusal/incorrect (maximally disengaged).
    expect(tape.steps.every((s) => s.observation && s.observation.correct === false)).toBe(true);
  });

  it('the fast-shallow gate-opener opens the gate at IMPLAUSIBLY low latency', () => {
    // Stand-in fast-shallow gate-opener (same recipe expectedFindings uses): corrects
    // land just above the engine transfer floor but far below a plausible compute time.
    const p = personaById('fast-mastery');
    p.latent.truePknownBySkill = { ADD_SAME_DEN: 0.98 };
    p.latent.pSlip = 0;
    p.latent.pGuess = 1;
    p.latent.hintAppetite = 0;
    p.latent.latency = { base: 1250, spread: 60, fatiguePerStep: 0 };
    const tape = runSession({ persona: p, skillId: 'ADD_SAME_DEN', seed: 7, stepCap: 30 });
    const gateStep = tape.steps.findIndex((s) => s.gate === true);
    expect(gateStep).toBeGreaterThanOrEqual(0); // the gate DOES open
    const flagged = detectImplausibleFluencyGate(tape);
    expect(flagged).not.toBeNull(); // …at an implausibly fast median latency
    expect(flagged.medianLatency).toBeLessThan(1500);
  });
});

// ---------------------------------------------------------------------------
// latentTruth — labelTape on a hand-built fixture produces the expected labels.
// ---------------------------------------------------------------------------

describe('latentTruth.labelTape — fixture labels', () => {
  function mkTape(steps, terminal = { kind: 'StepCap', step: steps.length }) {
    return {
      run_id: 'fx', seed: 1, persona_id: 'fixture', skillId: 'ADD_SAME_DEN',
      persona_latents: {}, params_hash: 'h', engine_sha: 'dev', flags: {},
      steps, terminal,
    };
  }
  function step(over = {}) {
    return {
      decision: { kind: 'PracticeAtLevel', rationale: '' },
      observation: { correct: true, scaffold_level: 3, hint_max_rung: 0, latency: 3000, answer_value: [1, 2] },
      gate: false, latent: 0.5, pknown: 0.5, ...over,
    };
  }

  it('a gate-open step below τ_latent yields falsePositiveMastery (falseTransfer requires surface_form data)', () => {
    // T13 fix: falseTransfer is now independent of latent < τ. It keys on whether
    // surface_form varied across the session, NOT on latent < τ. This fixture has
    // no surface_form field in its observations, so hasNoSurfaceVariation returns
    // false (no data = no claim) and falseTransfer stays false.
    // For the combined case (no surface variation AND latent < τ), see
    // tests/harness/test_false_transfer_independence.test.js tape B.
    const tape = mkTape([step(), step({ gate: true, latent: 0.5 })]);
    const label = labelTape(tape, { tauLatent: 0.8 });
    expect(label.labels.falsePositiveMastery).toBe(true);
    expect(label.labels.falseTransfer).toBe(false); // no surface_form data → no claim
    expect(label.labels.evidence.falsePositiveMastery).toHaveLength(1);
    expect(label.labels.evidence.falsePositiveMastery[0].latent).toBe(0.5);
  });

  it('a gate-open step at/above τ_latent is clean (no labels)', () => {
    const tape = mkTape([step({ latent: 0.9 }), step({ gate: true, latent: 0.9 })]);
    const label = labelTape(tape, { tauLatent: 0.8 });
    expect(label.labels.falsePositiveMastery).toBe(false);
    expect(label.labels.falseTransfer).toBe(false);
    expect(label.labels.missedEscalation).toBe(false);
    expect(label.labels.falseEscalation).toBe(false);
  });

  it('an EscalateToHuman terminal while latently competent yields falseEscalation', () => {
    const tape = mkTape(
      [step({ latent: 0.9 }), step({ latent: 0.9 })],
      { kind: 'EscalateToHuman', step: 2 }
    );
    const label = labelTape(tape, { tauLatent: 0.8 });
    expect(label.labels.falseEscalation).toBe(true);
  });

  it('the labeler echoes the τ_latent it was given', () => {
    const tape = mkTape([step()]);
    expect(labelTape(tape, { tauLatent: 0.7 }).tauLatent).toBe(0.7);
  });
});
