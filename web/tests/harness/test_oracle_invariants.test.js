// U5 — metamorphic invariants: ground-truth-FREE relations over re-run tapes.
import { describe, it, expect } from 'vitest';
import { checkInvariants } from '../../src/harness/oracle/invariants.js';
import { labelTape, DEFAULT_TAU_LATENT, LABEL_KINDS } from '../../src/harness/oracle/latentTruth.js';
import { runSession } from '../../src/harness/sessionRunner.js';
import { personaById } from '../../src/harness/personas/library.js';

describe('checkInvariants — relations hold on the current engine (or report a violation)', () => {
  it('returns one result per relation, each with a name + boolean held + evidence', () => {
    const results = checkInvariants({ seed: 1 });
    expect(results.length).toBe(3);
    for (const r of results) {
      expect(typeof r.name).toBe('string');
      expect(typeof r.held).toBe('boolean');
      expect(r.evidence).toBeDefined();
      // A violation must carry the minimal differing detail (non-empty evidence).
      if (!r.held) {
        expect(Object.keys(r.evidence).length).toBeGreaterThan(0);
      }
    }
  });

  it('surface-form permutation does not flip the final mastery verdict', () => {
    const r = checkInvariants({ seed: 1 }).find(
      (x) => x.name === 'surface-form-permutation-preserves-mastery-verdict'
    );
    expect(r.held).toBe(true);
  });

  it('monotonicity — one extra correct never LOWERS final P_known', () => {
    const r = checkInvariants({ seed: 1 }).find(
      (x) => x.name === 'monotonicity-extra-correct-never-lowers-pknown'
    );
    expect(r.held).toBe(true);
    expect(r.evidence.pBoost).toBeGreaterThanOrEqual(r.evidence.pBase - 1e-9);
  });

  it('strict dominance — a uniformly-higher-slip twin does not gate-open earlier', () => {
    const r = checkInvariants({ seed: 1 }).find(
      (x) => x.name === 'strict-dominance-higher-slip-not-earlier-gate'
    );
    expect(r.held).toBe(true);
  });

  it('invariants are deterministic across re-runs (same seed → same verdicts)', () => {
    const a = checkInvariants({ seed: 3 });
    const b = checkInvariants({ seed: 3 });
    expect(a.map((x) => x.held)).toEqual(b.map((x) => x.held));
  });
});

describe('labelTape — τ_latent is named, configurable, and disjoint from gate 0.95', () => {
  it('DEFAULT_TAU_LATENT is 0.8 (disjoint from the engine gateThreshold 0.95)', () => {
    expect(DEFAULT_TAU_LATENT).toBe(0.8);
    expect(DEFAULT_TAU_LATENT).not.toBe(0.95);
  });

  it('exposes the four label kinds', () => {
    expect(LABEL_KINDS).toEqual([
      'falsePositiveMastery',
      'missedEscalation',
      'falseEscalation',
      'falseTransfer',
    ]);
  });

  it('a confident-guesser that gates below τ_latent is flagged falsePositiveMastery', () => {
    const tape = runSession({ persona: personaById('confident-guesser'), skillId: 'ADD_SAME_DEN', seed: 2, stepCap: 60 });
    const label = labelTape(tape, { tauLatent: 0.8 });
    expect(label.labels.falsePositiveMastery).toBe(true);
    expect(label.labels.evidence.falsePositiveMastery.length).toBeGreaterThan(0);
    // every flagged step had latent strictly below τ.
    for (const ev of label.labels.evidence.falsePositiveMastery) {
      expect(ev.latent).toBeLessThan(0.8);
    }
  });

  it('the label set must be reported as a curve over τ_latent (raising τ can only add FPs)', () => {
    const tape = runSession({ persona: personaById('confident-guesser'), skillId: 'ADD_SAME_DEN', seed: 2, stepCap: 60 });
    const low = labelTape(tape, { tauLatent: 0.5 }).labels.evidence.falsePositiveMastery.length;
    const high = labelTape(tape, { tauLatent: 0.9 }).labels.evidence.falsePositiveMastery.length;
    // monotone: a higher latent bar flags at least as many gate-open steps.
    expect(high).toBeGreaterThanOrEqual(low);
  });
});
