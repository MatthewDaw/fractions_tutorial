// U1 — isMastered honors PARAMS.fluencyHardMode by default (policy.ts callers
// pick up the flag without threading the arg); affect firewall preserved.
import { describe, it, expect, afterEach } from 'vitest';
import { isMastered } from '../../src/engine/gate.js';
import type { MasteryEstimate } from '../../src/engine/types.js';
import { PARAMS } from '../../src/engine/params.js';

function passing(): MasteryEstimate {
  return { P_known: 0.96, fluency_stats: { median_latency: 5000, slope: -50, n: 7 }, max_scaffold_passed: 3, transfer_passed: true, hint_dependence: 0, last_retention_probe: null };
}
function badFluency(): MasteryEstimate { return { ...passing(), fluency_stats: { median_latency: 30000, slope: 2000, n: 7 } }; }

describe('U1 isMastered honors PARAMS.fluencyHardMode default', () => {
  afterEach(() => { (PARAMS as any).fluencyHardMode = false; });
  it('flag off: failing fluency does NOT close the gate (default lenient)', () => {
    (PARAMS as any).fluencyHardMode = false;
    expect(isMastered(badFluency())).toBe(true);
  });
  it('flag on: ONLY fluency failing closes the gate; all-pass still opens', () => {
    (PARAMS as any).fluencyHardMode = true;
    expect(isMastered(badFluency())).toBe(false);
    expect(isMastered(passing())).toBe(true);
  });
  it('affect firewall: a populated affect-ish extra field never changes gate output', () => {
    (PARAMS as any).fluencyHardMode = false;
    const withAffect = { ...passing(), affect_window: [{ tense: 0.9 }] } as unknown as MasteryEstimate;
    expect(isMastered(withAffect)).toBe(isMastered(passing()));
  });
});
