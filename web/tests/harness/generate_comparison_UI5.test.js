// UI5 — adaptive-vs-static arm comparison smoke test.
// The comparison doc (docs/harness/adaptive-vs-static-comparison.md) is committed;
// this asserts the comparison pipeline runs end-to-end and renders a non-empty
// report. It does NOT write any file (a CI run must not regenerate committed docs
// or depend on a developer worktree path).
import { it, expect } from 'vitest';
import { runArmComparison } from '../../src/harness/sessionRunner.js';
import { buildArmComparison, renderArmComparisonMarkdown } from '../../src/harness/report.js';

it('runs the adaptive-vs-static arm comparison end-to-end (UI5)', () => {
  const { adaptiveTapes, staticTapes, seed } = runArmComparison({ seed: 1, stepCap: 40 });
  expect(adaptiveTapes.length).toBeGreaterThan(0);
  expect(staticTapes.length).toBe(adaptiveTapes.length); // both arms run the identical population

  const cmp = buildArmComparison(adaptiveTapes, staticTapes, { seed });
  expect(cmp.arm_separation).toBeTruthy();
  expect(Array.isArray(cmp.deltas)).toBe(true);
  expect(cmp.deltas.length).toBeGreaterThan(0);

  const md = renderArmComparisonMarkdown(cmp);
  expect(typeof md).toBe('string');
  expect(md.length).toBeGreaterThan(0);
});
