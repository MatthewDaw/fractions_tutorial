// U8 — adversarial search for the nearest decision-FLIP.
//
// Asserts: (1) against a deliberately weak (high-pGuess-but-<0.5) latent baseline
// the (μ,λ) search FINDS a latent that opens the gate while latent < τ, reporting
// distanceToHonest + a replayable seed; (2) re-running the reported seed reproduces
// the flip; (3) the plausibility box NEVER returns pGuess≥0.5 (or pSlip≥0.5); (4)
// coverage mode hits ≥ the fixed-panel branch count; (5) against a robust baseline
// the search terminates with found:false — an honest negative ("no flip in box").
//
// generations/mu/lambda are kept SMALL so the whole suite runs in a few seconds.

import { describe, it, expect } from 'vitest';
import {
  searchNearestFlip,
  searchCoverage,
  distanceToHonest,
  LATENT_DIMS,
  PLAUSIBILITY_CEILINGS,
} from '../../src/harness/search.js';
import { runSession } from '../../src/harness/sessionRunner.js';
import { makePersona } from '../../src/harness/personas/model.js';
import { labelTape } from '../../src/harness/oracle/latentTruth.js';

// A deliberately WEAK baseline: low true P(known) + a high (but plausible, <0.5)
// guess rate. Its honest run does NOT itself open the gate, so the search must
// MOVE inside the box to find a false-mastery flip — distanceToHonest > 0.
const WEAK = {
  id: 'weak-baseline',
  klass: 'red-team:weak',
  latent: {
    truePknownDefault: 0.2,
    learnRate: 0.01,
    pSlip: 0.1,
    pGuess: 0.2,
    misconceptionStrength: 0.7,
    hintAppetite: 0.05,
  },
  meta: { approximates: 'a low-knowledge child who guesses', mightMiss: 'n/a' },
};

// A ROBUST baseline: a true master (high P, no slip/guess). The engine crediting
// mastery here is HONEST, never a false positive — so no false-mastery flip exists
// anywhere in the box. The search must report an honest negative.
const ROBUST = {
  id: 'robust-baseline',
  klass: 'red-team:robust',
  latent: {
    truePknownDefault: 0.99,
    learnRate: 0.3,
    pSlip: 0.0,
    pGuess: 0.0,
    misconceptionStrength: 0.0,
    hintAppetite: 0.0,
  },
  meta: { approximates: 'a true master', mightMiss: 'n/a' },
};

const SKILL = 'ADD_SAME_DEN';
const TAU = 0.8;

describe('searchNearestFlip — finds the nearest false-mastery flip in the box', () => {
  it('finds a latent that opens the gate while latent < τ, with distance + seed', () => {
    const r = searchNearestFlip({
      baseSpec: WEAK,
      skillId: SKILL,
      objective: 'falseMastery',
      seed: 4,
      generations: 6,
      mu: 3,
      lambda: 8,
      stepCap: 40,
      tauLatent: TAU,
    });

    expect(r.found).toBe(true);
    expect(r.flipKind).toBe('falseMastery');
    expect(typeof r.seed).toBe('number');
    // distanceToHonest is a finite, non-negative norm; the weak baseline does not
    // self-flip, so the search had to move (> 0).
    expect(Number.isFinite(r.distanceToHonest)).toBe(true);
    expect(r.distanceToHonest).toBeGreaterThan(0);
    expect(r.tape).not.toBeNull();

    // The reported tape genuinely carries the false-positive-mastery label.
    const label = labelTape(r.tape, { tauLatent: TAU });
    expect(label.labels.falsePositiveMastery).toBe(true);
    // …and there is a gate-open step whose latent is below τ (the flip itself).
    const flipStep = r.tape.steps.find((s) => s.gate === true && s.latent < TAU);
    expect(flipStep).toBeDefined();
  });

  it('re-running the reported { latent, seed } reproduces the exact flip', () => {
    const r = searchNearestFlip({
      baseSpec: WEAK,
      skillId: SKILL,
      objective: 'falseMastery',
      seed: 4,
      generations: 6,
      mu: 3,
      lambda: 8,
      stepCap: 40,
      tauLatent: TAU,
    });
    expect(r.found).toBe(true);

    // Replay 1: re-run the SEARCH (deterministic) → same champion latent + seed.
    const again = searchNearestFlip({
      baseSpec: WEAK,
      skillId: SKILL,
      objective: 'falseMastery',
      seed: 4,
      generations: 6,
      mu: 3,
      lambda: 8,
      stepCap: 40,
      tauLatent: TAU,
    });
    expect(again.seed).toBe(r.seed);
    expect(again.distanceToHonest).toBe(r.distanceToHonest);
    expect(again.latent).toEqual(r.latent);

    // Replay 2: re-run the SESSION from the reported { latent, seed } → the flip
    // reproduces (this is what U9 will do to confirm a champion).
    const persona = makePersona({ id: WEAK.id, klass: WEAK.klass, meta: WEAK.meta, latent: r.latent });
    const tape = runSession({ persona, skillId: SKILL, seed: r.seed, stepCap: 40 });
    const label = labelTape(tape, { tauLatent: TAU });
    expect(label.labels.falsePositiveMastery).toBe(true);
  });

  it('NEVER returns a latent with pGuess ≥ 0.5 or pSlip ≥ 0.5 (plausibility box)', () => {
    // Even pushed hard across many seeds, the box ceilings hold.
    for (const seed of [1, 2, 3, 7, 11]) {
      const r = searchNearestFlip({
        baseSpec: WEAK,
        skillId: SKILL,
        objective: 'falseMastery',
        seed,
        generations: 5,
        mu: 3,
        lambda: 8,
        stepCap: 30,
        tauLatent: TAU,
      });
      if (r.found) {
        expect(r.latent.pGuess).toBeLessThan(PLAUSIBILITY_CEILINGS.pGuess);
        expect(r.latent.pSlip).toBeLessThan(PLAUSIBILITY_CEILINGS.pSlip);
        expect(r.latent.pGuess).toBeGreaterThanOrEqual(0);
        expect(r.latent.pSlip).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('against a robust master baseline, terminates with an honest found:false', () => {
    const r = searchNearestFlip({
      baseSpec: ROBUST,
      skillId: SKILL,
      objective: 'falseMastery',
      seed: 5,
      generations: 5,
      mu: 3,
      lambda: 8,
      stepCap: 30,
      tauLatent: TAU,
    });
    expect(r.found).toBe(false);
    expect(r.latent).toBeNull();
    expect(r.seed).toBeNull();
    expect(r.distanceToHonest).toBeNull();
    expect(r.flipKind).toBeNull();
    // It still reports the honest anchor + that it did the work (no flip in box).
    expect(r.honest).toBeDefined();
    expect(r.evaluations).toBeGreaterThan(0);
  });
});

describe('searchCoverage — coverage-guided variant hits ≥ the fixed-panel baseline', () => {
  it('keeps novel (decision_kind, skill, scaffold_level) mutants and reports a delta', () => {
    const cov = searchCoverage({
      baseSpec: WEAK,
      skillId: SKILL,
      seed: 4,
      generations: 6,
      lambda: 8,
      stepCap: 40,
      tauLatent: TAU,
    });

    // Coverage hits at LEAST the fixed-panel baseline's branch count.
    expect(cov.branchesHit).toBeGreaterThanOrEqual(cov.baselineBranches);
    expect(cov.coverageDelta).toBe(cov.branchesHit - cov.baselineBranches);
    expect(cov.coverageDelta).toBeGreaterThanOrEqual(0);

    // The corpus always contains at least the baseline entry, and every entry is a
    // replayable champion (latent + seed + tuples) for U9.
    expect(cov.corpus.length).toBeGreaterThanOrEqual(1);
    for (const c of cov.corpus) {
      expect(typeof c.seed).toBe('number');
      expect(c.latent).toBeDefined();
      expect(Array.isArray(c.tuples)).toBe(true);
      expect(c.tuples.length).toBeGreaterThan(0);
      // box ceilings hold for corpus champions too
      expect(c.latent.pGuess).toBeLessThan(PLAUSIBILITY_CEILINGS.pGuess);
      expect(c.latent.pSlip).toBeLessThan(PLAUSIBILITY_CEILINGS.pSlip);
    }

    // Coverage is deterministic (replay-exact).
    const cov2 = searchCoverage({
      baseSpec: WEAK,
      skillId: SKILL,
      seed: 4,
      generations: 6,
      lambda: 8,
      stepCap: 40,
      tauLatent: TAU,
    });
    expect(cov2.branchesHit).toBe(cov.branchesHit);
    expect(cov2.tuples).toEqual(cov.tuples);
  });
});

describe('distanceToHonest — normalized L2 over the bounded latent dims', () => {
  it('is 0 at the anchor and grows with per-dim displacement', () => {
    const anchor = {};
    for (const d of LATENT_DIMS) anchor[d.key] = (d.lo + d.hi) / 2;
    expect(distanceToHonest(anchor, anchor)).toBe(0);

    // Move pGuess to its ceiling-edge → strictly positive, ≤ 1 per normalized dim.
    const moved = { ...anchor, pGuess: 0.499 };
    const dist = distanceToHonest(moved, anchor);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThanOrEqual(Math.sqrt(LATENT_DIMS.length));
  });
});
