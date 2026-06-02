// U7 — due-probe detection + probe recording (the live emission half of retention).
import { describe, it, expect, beforeEach } from 'vitest';
import { dueProbes, recordRetentionProbe } from '../../src/kitchenProgress.js';
import { loadLog, saveLog } from '../../src/engine/index.js';
import { PROBE_DELAYS_MS } from '../../src/engine/decay.js';

const INTERVAL = PROBE_DELAYS_MS[0];
const NOW = 100 * 24 * 60 * 60 * 1000; // 100 days in, so "long ago" is safe

function masteredEst(o = {}) {
  return {
    P_known: 0.97, fluency_stats: { median_latency: 4000, slope: -10, n: 8 },
    max_scaffold_passed: 3, transfer_passed: true, hint_dependence: 0,
    last_retention_probe: null, mastered_at: 0, ...o,
  };
}

describe('U7 dueProbes', () => {
  it('a node mastered longer ago than the interval, never probed, is due', () => {
    const map = { ADD_SAME_DEN: masteredEst({ mastered_at: NOW - INTERVAL - 1 }) };
    expect(dueProbes(map, NOW)).toContain('ADD_SAME_DEN');
  });
  it('a freshly mastered node is NOT due', () => {
    const map = { ADD_SAME_DEN: masteredEst({ mastered_at: NOW - 1000 }) };
    expect(dueProbes(map, NOW)).not.toContain('ADD_SAME_DEN');
  });
  it('a recently-probed node is NOT due (clock reset by the last probe)', () => {
    const map = { ADD_SAME_DEN: masteredEst({ mastered_at: NOW - 10 * INTERVAL, last_retention_probe: NOW - 1000 }) };
    expect(dueProbes(map, NOW)).not.toContain('ADD_SAME_DEN');
  });
  it('a non-mastered node is never due', () => {
    const map = { ADD_SAME_DEN: masteredEst({ mastered_at: NOW - 10 * INTERVAL, transfer_passed: false, P_known: 0.3 }) };
    expect(dueProbes(map, NOW)).not.toContain('ADD_SAME_DEN');
  });
  it('null map → []', () => { expect(dueProbes(null, NOW)).toEqual([]); });
});

describe('U7 recordRetentionProbe', () => {
  beforeEach(() => saveLog([]));
  it('appends a retention_probe event carrying node, result, and timestamp', () => {
    recordRetentionProbe('ADD_SAME_DEN', false, 12345);
    const ev = loadLog().find((e) => e.type === 'retention_probe');
    expect(ev).toBeTruthy();
    expect(ev.payload.node_id).toBe('ADD_SAME_DEN');
    expect(ev.payload.correct).toBe(false);
    expect(ev.payload.probe_t).toBe(12345);
  });
});
