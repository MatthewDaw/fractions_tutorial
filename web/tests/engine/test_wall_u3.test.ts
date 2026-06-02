// U3 — binding-gap (pure engine). After the routed binding node is mastered, the
// stumping recipe's predictedSuccess crosses wallTheta so re-presentation is
// genuinely solvable; a recipe with a SECOND unmastered required skill still
// walls (the routed node was a gap, not THE binding gap → must re-route, not
// promise a payoff).
import { describe, it, expect } from 'vitest';
import { detectWall, requiredSkills } from '../../src/engine/wall.js';
import type { RecipeShape } from '../../src/engine/wall.js';
import type { MasteryEstimate } from '../../src/engine/types.js';
import { PARAMS } from '../../src/engine/params.js';

function mastered(P_known = 0.97): MasteryEstimate {
  return { P_known, fluency_stats: { median_latency: 4000, slope: -10, n: 8 }, max_scaffold_passed: 3, transfer_passed: true, hint_dependence: 0, last_retention_probe: null };
}
function weak(P_known = 0.3): MasteryEstimate {
  return { P_known, fluency_stats: { median_latency: null, slope: null, n: 1 }, max_scaffold_passed: 1, transfer_passed: false, hint_dependence: 0, last_retention_probe: null };
}

describe('U3 binding-gap: re-presented stumping recipe becomes solvable', () => {
  const SAME_DEN: RecipeShape = { op: 'add', operands: [[3, 8], [2, 8]], target: [5, 8] };

  it('routed binding node mastered → predictedSuccess crosses wallTheta (no wall on return)', () => {
    const skills = requiredSkills(SAME_DEN);
    expect(skills).toContain('ADD_SAME_DEN');
    const est = new Map<string, MasteryEstimate>();
    for (const s of skills) est.set(s, mastered());
    const res = detectWall(SAME_DEN, est, false);
    expect(res.predictedSuccess).toBeGreaterThanOrEqual(PARAMS.wallTheta);
    expect(res.wallHit).toBe(false);
    expect(res.bindingNode).toBeNull();
  });

  it('a SECOND unmastered required skill still walls after the routed node is mastered (re-route, not payoff)', () => {
    const COPRIME: RecipeShape = { op: 'add', operands: [[1, 4], [1, 6]], target: [5, 12] };
    const skills = requiredSkills(COPRIME);
    expect(skills.length).toBeGreaterThanOrEqual(2);
    const est = new Map<string, MasteryEstimate>();
    est.set('ADD_SAME_DEN', mastered());
    est.set('ADD_UNLIKE_NESTED', weak());
    est.set('ADD_UNLIKE_COPRIME', weak());
    const res = detectWall(COPRIME, est, false);
    expect(res.predictedSuccess).toBeLessThan(PARAMS.wallTheta);
    expect(res.wallHit).toBe(true);
    expect(res.bindingNode).not.toBeNull();
    expect(res.bindingNode).not.toBe('ADD_SAME_DEN');
  });
});
