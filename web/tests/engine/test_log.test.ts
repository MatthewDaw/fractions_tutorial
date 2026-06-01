// test_log.test.ts — Unit tests for the append-only event log and migration.
//
// Tests:
//   1. appendEvent is immutable and pure (folding a fixed list twice is identical).
//   2. A Signal is present in the log but flagged no-op by any game-state projection.
//   3. migrateFromKitchenProgress seeds a mastered room's node with a high prior.
//   4. migrateFromKitchenProgress falls back to the default prior when absent.

import { describe, it, expect } from 'vitest';
import { appendEvent, foldLog, migrateFromKitchenProgress } from '../../src/engine/log.js';
import type { Action, Signal, Event } from '../../src/engine/types.js';
import { allNodes } from '../../src/engine/graph.js';
import { PARAMS } from '../../src/engine/params.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAction(type: string, t = 1000): Action {
  return {
    type,
    payload: { value: 42 },
    modality: 'tap',
    t,
    actor: 'human',
  };
}

function makeSignal(type: string, t = 2000): Signal {
  return {
    type,
    payload: { level: 'calm' },
    confidence: 0.75,
    t,
    actor: 'human',
  };
}

// A simple fold reducer that counts events of a given type.
function countType(targetType: string) {
  return (count: number, event: Event): number =>
    event.type === targetType ? count + 1 : count;
}

// ---------------------------------------------------------------------------
// 1. appendEvent — immutability + pure replay determinism
// ---------------------------------------------------------------------------

describe('appendEvent', () => {
  it('returns a new array, does not mutate the original', () => {
    const original: readonly Event[] = [];
    const event = makeAction('problem_present');
    const next = appendEvent(original, event);

    expect(next).not.toBe(original);
    expect(next).toHaveLength(1);
    expect(original).toHaveLength(0);
  });

  it('preserves all existing events and appends the new one at the end', () => {
    const a = makeAction('problem_present', 1000);
    const b = makeAction('answer_submit', 2000);
    const c = makeSignal('affect_idle', 3000);

    const log0: readonly Event[] = [];
    const log1 = appendEvent(log0, a);
    const log2 = appendEvent(log1, b);
    const log3 = appendEvent(log2, c);

    expect(log3).toHaveLength(3);
    expect(log3[0]).toBe(a);
    expect(log3[1]).toBe(b);
    expect(log3[2]).toBe(c);
  });

  it('is pure: appending the same event twice to the same base produces identical results', () => {
    const base: readonly Event[] = [makeAction('problem_present', 1000)];
    const event = makeAction('answer_submit', 2000);

    const result1 = appendEvent(base, event);
    const result2 = appendEvent(base, event);

    // Deep equality — same content, independently constructed.
    expect(result1).toEqual(result2);
    // The base is unchanged.
    expect(base).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// 2. foldLog — determinism across two identical folds
// ---------------------------------------------------------------------------

describe('foldLog', () => {
  it('folding a fixed list twice yields identical results (replay determinism)', () => {
    const log: readonly Event[] = [
      makeAction('problem_present', 1000),
      makeAction('answer_submit', 2500),
      makeSignal('affect_calm', 3000),
      makeAction('judged', 3100),
    ];

    const fold1 = foldLog(log, 0, countType('answer_submit'));
    const fold2 = foldLog(log, 0, countType('answer_submit'));

    expect(fold1).toBe(1);
    expect(fold2).toBe(1);
    expect(fold1).toBe(fold2);
  });

  it('counts multiple events of the same type correctly', () => {
    const log: readonly Event[] = [
      makeAction('answer_submit', 1000),
      makeAction('hint_shown', 1500),
      makeAction('answer_submit', 2000),
      makeSignal('affect_distracted', 2500),
      makeAction('answer_submit', 3000),
    ];

    const submitCount = foldLog(log, 0, countType('answer_submit'));
    expect(submitCount).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 3. Signal in the log — present but does not affect game-state projections
// ---------------------------------------------------------------------------

describe('Signal no-op in game-state fold', () => {
  it('a Signal is present in the log but does not increment an attempt counter', () => {
    const log: readonly Event[] = [
      makeAction('problem_present', 1000),
      makeSignal('affect_idle', 1500),   // Signal — should be ignored by this fold
      makeAction('answer_submit', 2000),
      makeSignal('affect_calm', 2500),   // another Signal — still no-op
      makeAction('judged', 2600),
    ];

    // Fold counts only 'answer_submit' Actions — Signals should not be counted.
    const submitCount = foldLog(log, 0, countType('answer_submit'));
    const signalCount = foldLog(log, 0, countType('affect_idle'));

    // Signals ARE in the log (verifying presence).
    expect(signalCount).toBe(1);

    // But the game-state fold (counting submits) is unaffected by Signals.
    expect(submitCount).toBe(1);

    // Total log length: 3 Actions + 2 Signals = 5.
    expect(log).toHaveLength(5);
  });

  it('a fold that only processes Actions ignores all Signals deterministically', () => {
    const events: Event[] = [];
    for (let i = 0; i < 5; i++) {
      events.push(makeAction('problem_present', i * 1000));
      events.push(makeSignal('affect_noise', i * 1000 + 500));
    }

    // Reducer that counts only Actions (type-checks for absence of 'confidence').
    const actionOnlyCount = foldLog(events, 0, (count, ev) =>
      'confidence' in ev ? count : count + 1
    );

    expect(actionOnlyCount).toBe(5); // 5 Actions, 5 Signals ignored.
  });
});

// ---------------------------------------------------------------------------
// 4. migrateFromKitchenProgress — seeds correct priors
// ---------------------------------------------------------------------------

describe('migrateFromKitchenProgress', () => {
  it('seeds a high prior for a mastered room\'s node', () => {
    // r1 is the roomId for ADD_SAME_DEN.
    const storage = {
      getItem: (key: string) =>
        key === 'moms-kitchen-progress-v1'
          ? JSON.stringify({ mastered: ['r1'] })
          : null,
    };

    const priors = migrateFromKitchenProgress(storage);

    // ADD_SAME_DEN maps to r1 — should have a high prior.
    expect(priors['ADD_SAME_DEN']).toBeGreaterThan(PARAMS.P_L0);
    expect(priors['ADD_SAME_DEN']).toBeGreaterThanOrEqual(0.50);
  });

  it('gives the default cold-start prior for rooms not in the mastered list', () => {
    const storage = {
      getItem: (key: string) =>
        key === 'moms-kitchen-progress-v1'
          ? JSON.stringify({ mastered: ['r1'] })
          : null,
    };

    const priors = migrateFromKitchenProgress(storage);

    // Rooms not mastered should get the default low prior.
    expect(priors['ADD_UNLIKE_NESTED']).toBeLessThanOrEqual(PARAMS.P_L0 + 0.01);
    expect(priors['ADD_UNLIKE_COPRIME']).toBeLessThanOrEqual(PARAMS.P_L0 + 0.01);
  });

  it('returns default priors for all nodes when the storage key is absent', () => {
    const storage = {
      getItem: (_key: string) => null,
    };

    const priors = migrateFromKitchenProgress(storage);

    for (const node of allNodes()) {
      expect(priors[node.id]).toBeDefined();
      // Default prior should be low (cold-start).
      expect(priors[node.id]).toBeLessThanOrEqual(PARAMS.P_L0 + 0.01);
    }
  });

  it('returns default priors when the stored JSON is malformed', () => {
    const storage = {
      getItem: (_key: string) => 'not-valid-json{{{',
    };

    const priors = migrateFromKitchenProgress(storage);

    for (const node of allNodes()) {
      expect(priors[node.id]).toBeDefined();
    }
  });

  it('covers all known skill nodes in its output', () => {
    const storage = { getItem: (_key: string) => null };
    const priors = migrateFromKitchenProgress(storage);
    const nodeIds = allNodes().map((n) => n.id);

    for (const id of nodeIds) {
      expect(priors[id]).toBeDefined();
    }
  });

  it('all priors are valid probabilities [0, 1]', () => {
    const storage = {
      getItem: (key: string) =>
        key === 'moms-kitchen-progress-v1'
          ? JSON.stringify({ mastered: ['r1', 'r3', 'r2'] })
          : null,
    };

    const priors = migrateFromKitchenProgress(storage);

    for (const [, prior] of Object.entries(priors)) {
      expect(prior).toBeGreaterThanOrEqual(0);
      expect(prior).toBeLessThanOrEqual(1);
    }
  });
});
