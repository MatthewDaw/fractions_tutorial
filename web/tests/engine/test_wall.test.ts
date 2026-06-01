// test_wall.test.ts — U7: Wall detection + binding-skill diagnosis tests.
//
// Test scenarios (from the plan U7):
//   1. Recipe needing two weak skills (Π P_known < 0.6) fires WALL_HIT.
//   2. Recipe needing only strong skills does NOT fire.
//   3. Actual failed attempt fires WALL_HIT even when predicted_success ≥ θ.
//   4. Binding selection returns the deepest unmastered prereq
//      (both same-den and unlike weak → routes to ADD_SAME_DEN first).
//   5. A mastered prereq is skipped in binding selection.
//   6. Threshold θ is config-driven (PARAMS.wallTheta).
//   7. requiredSkills() correctly infers skills from recipe shapes.

import { describe, it, expect } from 'vitest';
import { detectWall, requiredSkills, detectFirstWall } from '../../src/engine/wall.js';
import type { MasteryEstimate } from '../../src/engine/types.js';
import type { RecipeShape } from '../../src/engine/wall.js';
import { PARAMS } from '../../src/engine/params.js';
import { isMastered } from '../../src/engine/gate.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a weak estimate (P_known well below 0.6). */
function weakEst(P_known = 0.3): MasteryEstimate {
  return {
    P_known,
    fluency_stats: { median_latency: null, slope: null, n: 1 },
    max_scaffold_passed: 1,
    transfer_passed: false,
    hint_dependence: 0,
    last_retention_probe: null,
  };
}

/** Build a strong (mastered) estimate. */
function strongEst(): MasteryEstimate {
  return {
    P_known: 0.97,
    fluency_stats: { median_latency: 4000, slope: -10, n: 8 },
    max_scaffold_passed: 3,
    transfer_passed: true,
    hint_dependence: 0,
    last_retention_probe: null,
  };
}

/** Same-denominator recipe (r1). */
const SAME_DEN_RECIPE: RecipeShape = {
  op: 'add',
  operands: [[3, 8], [2, 8]],
  target: [5, 8],
};

/** Scale-one recipe (r3): 1/2 + 1/4 (one divides the other). */
const SCALE_ONE_RECIPE: RecipeShape = {
  op: 'add',
  operands: [[1, 2], [1, 4]],
  target: [3, 4],
};

/** Coprime / cross-multiply recipe (r2): 1/2 + 1/3. */
const COPRIME_RECIPE: RecipeShape = {
  op: 'add',
  operands: [[1, 2], [1, 3]],
  target: [5, 6],
};

/** Simplify recipe (r4). */
const SIMPLIFY_RECIPE: RecipeShape = {
  op: 'simplify',
  target: [3, 4],
};

/** Improper-to-mixed recipe (r5). */
const IMPROPER_RECIPE: RecipeShape = {
  op: 'improper',
  target: [14, 4],
};

/** add-then-simplify recipe. */
const ADD_THEN_SIMPLIFY_RECIPE: RecipeShape = {
  op: 'add-then-simplify',
  operands: [[1, 8], [3, 8]],
  target: [1, 2],
  requireSimplified: true,
};

// ---------------------------------------------------------------------------
// 7. requiredSkills() inference from recipe shapes
// ---------------------------------------------------------------------------

describe('requiredSkills', () => {
  it('same-denominator add → [ADD_SAME_DEN]', () => {
    const skills = requiredSkills(SAME_DEN_RECIPE);
    expect(skills).toContain('ADD_SAME_DEN');
    expect(skills).not.toContain('ADD_UNLIKE_NESTED');
    expect(skills).not.toContain('ADD_UNLIKE_COPRIME');
  });

  it('scale-one add (one denominator divides the other) → [ADD_SAME_DEN, ADD_UNLIKE_NESTED]', () => {
    const skills = requiredSkills(SCALE_ONE_RECIPE);
    expect(skills).toContain('ADD_SAME_DEN');
    expect(skills).toContain('ADD_UNLIKE_NESTED');
    expect(skills).not.toContain('ADD_UNLIKE_COPRIME');
  });

  it('coprime add (general unlike) → [ADD_SAME_DEN, ADD_UNLIKE_NESTED, ADD_UNLIKE_COPRIME]', () => {
    const skills = requiredSkills(COPRIME_RECIPE);
    expect(skills).toContain('ADD_SAME_DEN');
    expect(skills).toContain('ADD_UNLIKE_NESTED');
    expect(skills).toContain('ADD_UNLIKE_COPRIME');
  });

  it('simplify → [SIMPLIFY]', () => {
    const skills = requiredSkills(SIMPLIFY_RECIPE);
    expect(skills).toContain('SIMPLIFY');
    expect(skills).not.toContain('ADD_SAME_DEN');
  });

  it('improper → [IMPROPER_TO_MIXED]', () => {
    const skills = requiredSkills(IMPROPER_RECIPE);
    expect(skills).toContain('IMPROPER_TO_MIXED');
    expect(skills).not.toContain('ADD_SAME_DEN');
  });

  it('add-then-simplify → includes both ADD_SAME_DEN (add chain) and SIMPLIFY', () => {
    const skills = requiredSkills(ADD_THEN_SIMPLIFY_RECIPE);
    expect(skills).toContain('ADD_SAME_DEN');
    expect(skills).toContain('SIMPLIFY');
  });

  it('add-then-mixed (coprime) → includes ADD_UNLIKE_COPRIME and IMPROPER_TO_MIXED', () => {
    const recipe: RecipeShape = {
      op: 'add-then-mixed',
      operands: [[3, 4], [3, 4]],
      target: [6, 4],
    };
    const skills = requiredSkills(recipe);
    expect(skills).toContain('ADD_SAME_DEN');
    expect(skills).toContain('IMPROPER_TO_MIXED');
  });
});

// ---------------------------------------------------------------------------
// 1. Two weak skills → Π P_known < θ → WALL_HIT
// ---------------------------------------------------------------------------

describe('detectWall — weak profile fires wall', () => {
  it('coprime recipe with weak ADD_SAME_DEN + ADD_UNLIKE_COPRIME → WALL_HIT', () => {
    const estimates = new Map([
      ['ADD_SAME_DEN', weakEst(0.5)],
      ['ADD_UNLIKE_NESTED', weakEst(0.5)],
      ['ADD_UNLIKE_COPRIME', weakEst(0.5)],
    ]);
    // Π = 0.5 * 0.5 * 0.5 = 0.125 < 0.6
    const result = detectWall(COPRIME_RECIPE, estimates);
    expect(result.wallHit).toBe(true);
  });

  it('predicted_success is below wallTheta', () => {
    const estimates = new Map([
      ['ADD_SAME_DEN', weakEst(0.5)],
      ['ADD_UNLIKE_NESTED', weakEst(0.5)],
      ['ADD_UNLIKE_COPRIME', weakEst(0.5)],
    ]);
    const result = detectWall(COPRIME_RECIPE, estimates);
    expect(result.predictedSuccess).toBeLessThan(PARAMS.wallTheta);
  });
});

// ---------------------------------------------------------------------------
// 2. Strong skills → no wall
// ---------------------------------------------------------------------------

describe('detectWall — strong profile no wall', () => {
  it('coprime recipe with all mastered skills → no WALL_HIT', () => {
    const estimates = new Map([
      ['ADD_SAME_DEN', strongEst()],
      ['ADD_UNLIKE_NESTED', strongEst()],
      ['ADD_UNLIKE_COPRIME', strongEst()],
    ]);
    const result = detectWall(COPRIME_RECIPE, estimates);
    expect(result.wallHit).toBe(false);
  });

  it('predicted_success is above wallTheta for strong profile', () => {
    const estimates = new Map([
      ['ADD_SAME_DEN', strongEst()],
      ['ADD_UNLIKE_NESTED', strongEst()],
      ['ADD_UNLIKE_COPRIME', strongEst()],
    ]);
    const result = detectWall(COPRIME_RECIPE, estimates);
    expect(result.predictedSuccess).toBeGreaterThanOrEqual(PARAMS.wallTheta);
  });

  it('same-den recipe with only ADD_SAME_DEN strong → no wall', () => {
    const estimates = new Map([
      ['ADD_SAME_DEN', strongEst()],
    ]);
    const result = detectWall(SAME_DEN_RECIPE, estimates);
    expect(result.wallHit).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Actual failed attempt fires wall regardless of predicted_success
// ---------------------------------------------------------------------------

describe('detectWall — actual failure triggers wall', () => {
  it('strong profile but actuallyFailed=true → WALL_HIT', () => {
    const estimates = new Map([
      ['ADD_SAME_DEN', strongEst()],
      ['ADD_UNLIKE_NESTED', strongEst()],
      ['ADD_UNLIKE_COPRIME', strongEst()],
    ]);
    const result = detectWall(COPRIME_RECIPE, estimates, true /* actuallyFailed */);
    expect(result.wallHit).toBe(true);
    expect(result.triggeredByFailure).toBe(true);
  });

  it('triggeredByFailure is false when no actual failure', () => {
    const estimates = new Map([
      ['ADD_SAME_DEN', weakEst(0.3)],
      ['ADD_UNLIKE_NESTED', weakEst(0.3)],
      ['ADD_UNLIKE_COPRIME', weakEst(0.3)],
    ]);
    const result = detectWall(COPRIME_RECIPE, estimates, false);
    expect(result.triggeredByFailure).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. Binding selection — most-upstream unmastered
// ---------------------------------------------------------------------------

describe('detectWall — binding selection', () => {
  it('both ADD_SAME_DEN and ADD_UNLIKE_COPRIME weak → binding is ADD_SAME_DEN (most upstream)', () => {
    const estimates = new Map([
      ['ADD_SAME_DEN', weakEst(0.3)],
      ['ADD_UNLIKE_NESTED', weakEst(0.3)],
      ['ADD_UNLIKE_COPRIME', weakEst(0.3)],
    ]);
    const result = detectWall(COPRIME_RECIPE, estimates);
    expect(result.bindingNode).toBe('ADD_SAME_DEN');
  });

  it('only ADD_UNLIKE_COPRIME is weak → binding is ADD_UNLIKE_COPRIME', () => {
    const estimates = new Map([
      ['ADD_SAME_DEN', strongEst()],
      ['ADD_UNLIKE_NESTED', strongEst()],
      ['ADD_UNLIKE_COPRIME', weakEst(0.3)],
    ]);
    const result = detectWall(COPRIME_RECIPE, estimates);
    // predicted_success = 0.97 * 0.97 * 0.3 ≈ 0.283 < 0.6 → wall hit
    expect(result.wallHit).toBe(true);
    expect(result.bindingNode).toBe('ADD_UNLIKE_COPRIME');
  });

  it('no estimate → defaults to P_L0 prior → wall hits for multi-skill recipes', () => {
    const estimates = new Map<string, MasteryEstimate>();
    const result = detectWall(COPRIME_RECIPE, estimates);
    // All three skills default to P_L0 (0.10) → 0.001 < 0.6 → wall
    expect(result.wallHit).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Mastered prereq is skipped in binding selection
// ---------------------------------------------------------------------------

describe('detectWall — mastered prereq skipped', () => {
  it('ADD_SAME_DEN mastered, ADD_UNLIKE_NESTED weak → binding is ADD_UNLIKE_NESTED', () => {
    const estimates = new Map([
      ['ADD_SAME_DEN', strongEst()],
      ['ADD_UNLIKE_NESTED', weakEst(0.3)],
      ['ADD_UNLIKE_COPRIME', weakEst(0.3)],
    ]);
    const result = detectWall(COPRIME_RECIPE, estimates);
    // ADD_SAME_DEN is mastered → skip it; ADD_UNLIKE_NESTED is first unmastered
    expect(result.bindingNode).toBe('ADD_UNLIKE_NESTED');
  });

  it('all skills mastered → bindingNode is null', () => {
    const estimates = new Map([
      ['ADD_SAME_DEN', strongEst()],
      ['ADD_UNLIKE_NESTED', strongEst()],
      ['ADD_UNLIKE_COPRIME', strongEst()],
    ]);
    const result = detectWall(COPRIME_RECIPE, estimates);
    expect(result.bindingNode).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 6. wallTheta is config-driven
// ---------------------------------------------------------------------------

describe('detectWall — wallTheta config', () => {
  it('PARAMS.wallTheta is 0.6', () => {
    expect(PARAMS.wallTheta).toBe(0.6);
  });

  it('predicted_success just below theta fires wall', () => {
    // One skill at P_known = 0.59 for a single-skill recipe → 0.59 < 0.6
    const estimates = new Map([['ADD_SAME_DEN', weakEst(0.59)]]);
    const result = detectWall(SAME_DEN_RECIPE, estimates);
    expect(result.wallHit).toBe(true);
  });

  it('predicted_success exactly at theta does NOT fire wall', () => {
    const estimates = new Map([['ADD_SAME_DEN', weakEst(0.6)]]);
    const result = detectWall(SAME_DEN_RECIPE, estimates);
    // 0.6 is NOT < 0.6, so no wall (strict inequality)
    expect(result.wallHit).toBe(false);
  });

  it('predicted_success just above theta does NOT fire wall', () => {
    const estimates = new Map([['ADD_SAME_DEN', weakEst(0.7)]]);
    const result = detectWall(SAME_DEN_RECIPE, estimates);
    expect(result.wallHit).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// detectFirstWall — multi-recipe check
// ---------------------------------------------------------------------------

describe('detectFirstWall', () => {
  it('no recipes → no wall', () => {
    const result = detectFirstWall([], new Map());
    expect(result.wallHit).toBe(false);
    expect(result.recipeIndex).toBeNull();
  });

  it('first failing recipe triggers wall and returns its index', () => {
    const estimates = new Map([
      ['ADD_SAME_DEN', weakEst(0.3)],
      ['ADD_UNLIKE_NESTED', weakEst(0.3)],
      ['ADD_UNLIKE_COPRIME', weakEst(0.3)],
    ]);
    const recipes: RecipeShape[] = [SAME_DEN_RECIPE, COPRIME_RECIPE];
    // SAME_DEN_RECIPE: only ADD_SAME_DEN (0.3) → 0.3 < 0.6 → wall
    const result = detectFirstWall(recipes, estimates);
    expect(result.wallHit).toBe(true);
    expect(result.recipeIndex).toBe(0);
  });

  it('failed recipe index triggers wall for that recipe', () => {
    const estimates = new Map([
      ['ADD_SAME_DEN', strongEst()],
      ['ADD_UNLIKE_NESTED', strongEst()],
      ['ADD_UNLIKE_COPRIME', strongEst()],
    ]);
    // All strong, but recipe index 1 (COPRIME_RECIPE) actually failed.
    const result = detectFirstWall(
      [SAME_DEN_RECIPE, COPRIME_RECIPE],
      estimates,
      new Set([1])
    );
    // SAME_DEN_RECIPE strong + not failed → no wall for index 0
    // COPRIME_RECIPE strong but failed → wall at index 1
    expect(result.wallHit).toBe(true);
    expect(result.recipeIndex).toBe(1);
  });
});
