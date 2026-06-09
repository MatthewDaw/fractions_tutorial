// test_orientationReport.test.js — UI3 (gap-build-260609): orientation grading.
//
// A tap that matches the lesson's expected orientation is COHERENT (the child knows
// goal / why-changed); a mismatch is incoherent — itself useful coherence data.
// A skip yields neither a Signal nor a judgement (the probe never blocks). The tap
// is a consented, first-class Signal; the grading is advisory (firewalled from the
// mastery gate). Mirrors test_selfReport.test.js.

import { describe, it, expect } from 'vitest';
import { evaluateOrientationReport } from '../../../src/runtime/affect/orientationReport.js';

describe('evaluateOrientationReport — coherence grading', () => {
  it('a matching tap is coherent and yields a gold-standard Signal', () => {
    const r = evaluateOrientationReport('stack', 'stack');
    expect(r.coherent).toBe(true);
    expect(r.skipped).toBe(false);
    expect(r.signal).not.toBeNull();
    expect(r.signal.type).toBe('orientation_report');
    expect(r.signal.confidence).toBe(1); // consented gold standard
    expect(r.signal.actor).toBe('human');
    expect(r.signal.payload).toMatchObject({ choice: 'stack', expected: 'stack', coherent: true });
    expect(r.goldLabel).toMatchObject({ report: 'stack', expected: 'stack', coherent: true });
  });

  it('a mismatching tap is incoherent but STILL logged as a Signal (the coherence datum)', () => {
    const r = evaluateOrientationReport('compare', 'stack');
    expect(r.coherent).toBe(false);
    expect(r.signal).not.toBeNull();              // kept — wrong orientation is the datum
    expect(r.signal.payload.coherent).toBe(false);
    expect(r.goldLabel.report).toBe('compare');
    expect(r.goldLabel.expected).toBe('stack');
    expect(r.goldLabel.coherent).toBe(false);
  });

  it('a skip (null choice) yields no Signal and no coherence judgement', () => {
    const r = evaluateOrientationReport(null, 'stack');
    expect(r.skipped).toBe(true);
    expect(r.coherent).toBeNull();
    expect(r.signal).toBeNull();
    expect(r.goldLabel.coherent).toBeNull();
  });

  it('treats undefined choice as a skip too', () => {
    const r = evaluateOrientationReport(undefined, 'stack');
    expect(r.skipped).toBe(true);
    expect(r.signal).toBeNull();
  });
});
