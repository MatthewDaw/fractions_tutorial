// generate-comparison.test.js — runs the arm comparison and writes the doc
// This is a vitest 'test' in name only; it is a one-shot data generation script.
import { it } from 'vitest';
import { writeFileSync } from 'fs';
import { runArmComparison } from '../../src/harness/sessionRunner.js';
import { buildArmComparison, renderArmComparisonMarkdown } from '../../src/harness/report.js';

it('generates adaptive-vs-static comparison doc (UI5)', () => {
  const { adaptiveTapes, staticTapes, seed } = runArmComparison({
    seed: 1,
    stepCap: 40,
  });

  console.log('adaptive tapes:', adaptiveTapes.length, '/ static tapes:', staticTapes.length);

  const cmp = buildArmComparison(adaptiveTapes, staticTapes, { seed });

  console.log('ARM SEPARATION:', JSON.stringify(cmp.arm_separation));
  for (const d of cmp.deltas) {
    console.log(d.metric + ': adaptive=' + (d.adaptive != null ? d.adaptive.toFixed(4) : 'null') +
      ' static=' + (d.static != null ? d.static.toFixed(4) : 'null') +
      ' delta=' + (d.delta != null ? d.delta.toFixed(4) : 'null') +
      ' helps=' + d.adaptationHelps);
  }

  const md = renderArmComparisonMarkdown(cmp);
  writeFileSync(
    'C:/Users/mattd/Documents/gauntlet/wt-UI5/docs/harness/adaptive-vs-static-comparison.md',
    md,
    'utf8'
  );
  console.log('Wrote adaptive-vs-static-comparison.md');
});
