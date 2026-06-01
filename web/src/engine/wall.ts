// wall.ts — U7: Wall detection + binding-skill diagnosis (state-model §5.3).
//
// predictedSuccess(recipeSkills, estimates) = Π_{s∈S} P_known(s)
// WALL_HIT ⟺ predicted_success < wallTheta (0.6) OR an actual attempt failed.
// binding = most-upstream unmastered node in S (ADD_SAME_DEN before unlike-den).
// Fluency is intentionally NOT in wall detection.
//
// Recipe → skill mapping is inferred from the momsProblems.js problem shapes
// (op + operands) — this module reads those shapes but does NOT import the
// live momsProblems.js (engine must stay pure). Instead, it encodes the
// skill-inference rules over the problem shape.
//
// ENGINE PURITY: NO React imports, NO wall-clock calls.

import type { MasteryEstimate } from './types.js';
import { allNodes, mostUpstreamUnmastered } from './graph.js';
import { isMastered } from './gate.js';
import { PARAMS } from './params.js';

// ---------------------------------------------------------------------------
// Recipe shape (minimal mirror of the momsProblems.js question shape)
//
// We replicate only the fields the wall-detector reads; the rest stay in the
// momsProblems.js domain.
// ---------------------------------------------------------------------------

export interface RecipeShape {
  /** Problem operation type from momsProblems.js. */
  op: 'add' | 'sub' | 'simplify' | 'add-then-simplify' | 'improper' | 'add-then-mixed';
  /**
   * The fraction operands [[numerator, denominator], ...].
   * May be undefined for ops that don't have operands (simplify, improper).
   */
  operands?: (readonly [number, number | null])[];
  /**
   * The target answer [numerator, denominator] — used to determine if a
   * simplification result is required.
   */
  target?: readonly [number, number];
  /** Whether the problem requires a simplified answer. */
  requireSimplified?: boolean;
}

// ---------------------------------------------------------------------------
// Recipe → required skill set
//
// Infers which SkillNode ids are required to solve a kitchen recipe.
// Rules derived from the curriculum order and momsProblems.js problem shapes.
// ---------------------------------------------------------------------------

/**
 * Infer the set of skill node ids required to solve a kitchen recipe.
 *
 * Rules (in order of precedence):
 *   - op='improper' | 'add-then-mixed'  → requires IMPROPER_TO_MIXED
 *   - op='simplify' | 'add-then-simplify' → requires SIMPLIFY
 *   - any op that adds/subtracts fractions → inspect denominators:
 *       same denominator         → ADD_SAME_DEN
 *       one divides the other    → ADD_UNLIKE_NESTED + ADD_SAME_DEN
 *       coprime / general unlike → ADD_UNLIKE_COPRIME + ADD_UNLIKE_NESTED + ADD_SAME_DEN
 *   - add-then-simplify also chains SIMPLIFY on top of the add skill.
 *   - add-then-mixed chains IMPROPER_TO_MIXED on top of the add skill.
 */
export function requiredSkills(recipe: RecipeShape): readonly string[] {
  const skills = new Set<string>();

  const { op, operands } = recipe;

  // --- ops that directly test a specific skill ---
  if (op === 'improper') {
    skills.add('IMPROPER_TO_MIXED');
    return [...skills];
  }

  if (op === 'simplify') {
    skills.add('SIMPLIFY');
    return [...skills];
  }

  // --- addition/subtraction: infer from denominators ---
  const addOps: RecipeShape['op'][] = ['add', 'sub', 'add-then-simplify', 'add-then-mixed'];
  if (addOps.includes(op) && operands && operands.length >= 2) {
    const da = operands[0][1];
    const db = operands[1][1];

    if (da !== null && db !== null) {
      if (da === db) {
        // Same denominator — only ADD_SAME_DEN required.
        skills.add('ADD_SAME_DEN');
      } else if (da % db === 0 || db % da === 0) {
        // One divides the other — scale-one technique (ADD_UNLIKE_NESTED).
        // ADD_UNLIKE_NESTED has ADD_SAME_DEN as its prereq, so both are needed.
        skills.add('ADD_SAME_DEN');
        skills.add('ADD_UNLIKE_NESTED');
      } else {
        // Coprime / general unlike — cross-multiply (ADD_UNLIKE_COPRIME).
        // Full chain required.
        skills.add('ADD_SAME_DEN');
        skills.add('ADD_UNLIKE_NESTED');
        skills.add('ADD_UNLIKE_COPRIME');
      }
    } else {
      // Null denominator (fill-in-the-blank problems in r1): same-den assumed.
      skills.add('ADD_SAME_DEN');
    }
  }

  // --- compound ops also require their secondary skill ---
  if (op === 'add-then-simplify') {
    skills.add('SIMPLIFY');
  }
  if (op === 'add-then-mixed') {
    skills.add('IMPROPER_TO_MIXED');
  }

  return [...skills];
}

// ---------------------------------------------------------------------------
// Wall detection
// ---------------------------------------------------------------------------

export interface WallDetectionResult {
  /** True when a wall is detected. */
  wallHit: boolean;
  /** Predicted success probability ∈ [0, 1]. */
  predictedSuccess: number;
  /** True when the wall was triggered by an actual failed attempt. */
  triggeredByFailure: boolean;
  /**
   * The most-upstream unmastered skill node in the recipe's required set.
   * null if all required skills are mastered.
   */
  bindingNode: string | null;
}

/**
 * Detect a wall for a given recipe and the child's current mastery estimates.
 *
 * @param recipe          The kitchen problem shape.
 * @param estimates       Map from skill node id → MasteryEstimate.
 * @param actuallyFailed  True when the child just failed an actual attempt at
 *                        this recipe (fires the wall regardless of predictedSuccess).
 * @param fluencyHardMode Passed through to isMastered(); default false.
 */
export function detectWall(
  recipe: RecipeShape,
  estimates: ReadonlyMap<string, MasteryEstimate>,
  actuallyFailed = false,
  fluencyHardMode = false
): WallDetectionResult {
  const skills = requiredSkills(recipe);

  // Predicted success: product of P_known over all required skills.
  let predictedSuccess = 1;
  for (const skillId of skills) {
    const est = estimates.get(skillId);
    const pKnown = est?.P_known ?? PARAMS.P_L0; // default to prior if no estimate
    predictedSuccess *= pKnown;
  }

  const triggeredByFailure = actuallyFailed;
  const wallHit = predictedSuccess < PARAMS.wallTheta || triggeredByFailure;

  // Binding: most-upstream unmastered node in the required skill set.
  const bindingNode = mostUpstreamUnmastered(
    skills,
    (id) => {
      const est = estimates.get(id);
      return est !== undefined && isMastered(est, fluencyHardMode);
    }
  );

  return {
    wallHit,
    predictedSuccess,
    triggeredByFailure,
    bindingNode: bindingNode?.id ?? null,
  };
}

// ---------------------------------------------------------------------------
// Convenience: wall check over a collection of recipes
//
// Returns the first wall hit (if any) across the given recipes.
// ---------------------------------------------------------------------------

export interface MultiRecipeWallResult {
  wallHit: boolean;
  /** Which recipe triggered the wall (index into recipes array). */
  recipeIndex: number | null;
  result: WallDetectionResult | null;
}

/**
 * Check a list of recipes for a wall. Returns on the first hit.
 *
 * @param recipes         Array of recipe shapes.
 * @param estimates       Master estimate map.
 * @param failedIndices   Set of recipe indices where the child actually failed.
 */
export function detectFirstWall(
  recipes: readonly RecipeShape[],
  estimates: ReadonlyMap<string, MasteryEstimate>,
  failedIndices: ReadonlySet<number> = new Set()
): MultiRecipeWallResult {
  for (let i = 0; i < recipes.length; i++) {
    const result = detectWall(recipes[i], estimates, failedIndices.has(i));
    if (result.wallHit) {
      return { wallHit: true, recipeIndex: i, result };
    }
  }
  return { wallHit: false, recipeIndex: null, result: null };
}

// Re-export for consumers that want to enumerate nodes.
export { allNodes };
