// test_credit.test.ts — U6: Credit assignment tests.
//
// Test scenarios (from the plan U6):
//   1. Wrong coprime-unlike answer with same-den-arithmetic signature →
//      full update to ADD_UNLIKE_COPRIME + discounted update to ADD_UNLIKE_NESTED.
//   2. Same wrong answer with scaled_bottom_only signature → binding-node only.
//   3. Correct answer credits only the binding node.
//   4. Discount factor applied exactly once, config-driven.
//   5. Unknown/ambiguous signatures → binding-node only (no spurious propagation).
//   6. add_denominators implicates ADD_SAME_DEN specifically.

import { describe, it, expect } from 'vitest';
import { assignCredit, ERROR_PREREQ_IMPLICATION } from '../../src/engine/credit.js';
import type { Observation } from '../../src/engine/types.js';
import { PARAMS } from '../../src/engine/params.js';
import { allNodes } from '../../src/engine/graph.js';
import type { SkillNode } from '../../src/engine/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build the graph map from allNodes(). */
function buildGraphMap(): Map<string, SkillNode> {
  const map = new Map<string, SkillNode>();
  for (const node of allNodes()) {
    map.set(node.id, node);
  }
  return map;
}

const GRAPH = buildGraphMap();

/** Build a minimal incorrect Observation with the given error_signature. */
function wrongObs(sig: Observation['error_signature']): Observation {
  return {
    correct: false,
    answer_value: [5, 6],
    error_signature: sig,
    latency: 3000,
    hint_max_rung: 0,
    self_corrections: 0,
    scaffold_level: 2,
    modality: 'tap',
    recognizer_confidence: null,
    too_fast_correct: false,
    affect_window: [],
  };
}

/** Build a minimal correct Observation. */
function correctObs(): Observation {
  return {
    correct: true,
    answer_value: [5, 6],
    error_signature: null,
    latency: 3500,
    hint_max_rung: 0,
    self_corrections: 0,
    scaffold_level: 2,
    modality: 'tap',
    recognizer_confidence: null,
    too_fast_correct: false,
    affect_window: [],
  };
}

// ---------------------------------------------------------------------------
// 1. add_across_unlike → full update to binding + discounted update to direct prereq
// ---------------------------------------------------------------------------

describe('credit assignment — add_across_unlike', () => {
  it('wrong ADD_UNLIKE_COPRIME answer with add_across_unlike → 2 updates', () => {
    const updates = assignCredit(
      wrongObs('add_across_unlike'),
      'ADD_UNLIKE_COPRIME',
      GRAPH
    );
    expect(updates.length).toBe(2);
  });

  it('binding node (ADD_UNLIKE_COPRIME) gets weight 1.0', () => {
    const updates = assignCredit(
      wrongObs('add_across_unlike'),
      'ADD_UNLIKE_COPRIME',
      GRAPH
    );
    const binding = updates.find((u) => u.nodeId === 'ADD_UNLIKE_COPRIME');
    expect(binding).toBeDefined();
    expect(binding!.weight).toBe(1.0);
    expect(binding!.correct).toBe(false);
  });

  it('prereq (ADD_UNLIKE_NESTED) gets discounted update', () => {
    const updates = assignCredit(
      wrongObs('add_across_unlike'),
      'ADD_UNLIKE_COPRIME',
      GRAPH
    );
    const prereq = updates.find((u) => u.nodeId === 'ADD_UNLIKE_NESTED');
    expect(prereq).toBeDefined();
    expect(prereq!.weight).toBe(PARAMS.creditDiscount);
    expect(prereq!.correct).toBe(false);
  });

  it('add_across_unlike on ADD_UNLIKE_NESTED → implicates ADD_SAME_DEN', () => {
    const updates = assignCredit(
      wrongObs('add_across_unlike'),
      'ADD_UNLIKE_NESTED',
      GRAPH
    );
    expect(updates.length).toBe(2);
    const prereq = updates.find((u) => u.nodeId === 'ADD_SAME_DEN');
    expect(prereq).toBeDefined();
    expect(prereq!.weight).toBe(PARAMS.creditDiscount);
  });
});

// ---------------------------------------------------------------------------
// 2. scaled_bottom_only → binding-node only (re-cutting error, not a prereq gap)
// ---------------------------------------------------------------------------

describe('credit assignment — scaled_bottom_only', () => {
  it('wrong ADD_UNLIKE_COPRIME answer with scaled_bottom_only → 1 update only', () => {
    const updates = assignCredit(
      wrongObs('scaled_bottom_only'),
      'ADD_UNLIKE_COPRIME',
      GRAPH
    );
    expect(updates.length).toBe(1);
    expect(updates[0].nodeId).toBe('ADD_UNLIKE_COPRIME');
    expect(updates[0].weight).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// 3. Correct answer → binding-node only by default
// ---------------------------------------------------------------------------

describe('credit assignment — correct answer', () => {
  it('correct answer credits only the binding node', () => {
    const updates = assignCredit(correctObs(), 'ADD_UNLIKE_COPRIME', GRAPH);
    expect(updates.length).toBe(1);
    expect(updates[0].nodeId).toBe('ADD_UNLIKE_COPRIME');
    expect(updates[0].correct).toBe(true);
    expect(updates[0].weight).toBe(1.0);
  });

  it('correct answer on ADD_SAME_DEN → binding only', () => {
    const updates = assignCredit(correctObs(), 'ADD_SAME_DEN', GRAPH);
    expect(updates.length).toBe(1);
    expect(updates[0].nodeId).toBe('ADD_SAME_DEN');
  });
});

// ---------------------------------------------------------------------------
// 4. Discount factor is config-driven and applied exactly once
// ---------------------------------------------------------------------------

describe('credit assignment — discount factor', () => {
  it('discount factor matches PARAMS.creditDiscount', () => {
    const updates = assignCredit(
      wrongObs('add_across_unlike'),
      'ADD_UNLIKE_COPRIME',
      GRAPH
    );
    const prereq = updates.find((u) => u.nodeId !== 'ADD_UNLIKE_COPRIME');
    expect(prereq).toBeDefined();
    expect(prereq!.weight).toBe(PARAMS.creditDiscount);
  });

  it('discount is applied only once (exactly one discounted update)', () => {
    const updates = assignCredit(
      wrongObs('add_across_unlike'),
      'ADD_UNLIKE_COPRIME',
      GRAPH
    );
    const discounted = updates.filter((u) => u.weight < 1.0);
    expect(discounted.length).toBe(1);
  });

  it('no update weight exceeds 1.0', () => {
    for (const sig of ['add_across_unlike', 'add_denominators', 'scaled_bottom_only', 'other', null] as const) {
      const updates = assignCredit(wrongObs(sig), 'ADD_UNLIKE_COPRIME', GRAPH);
      for (const u of updates) {
        expect(u.weight).toBeLessThanOrEqual(1.0);
        expect(u.weight).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Unknown/ambiguous signatures → binding-node only
// ---------------------------------------------------------------------------

describe('credit assignment — unknown/ambiguous signatures', () => {
  it("signature 'other' → binding-node only", () => {
    const updates = assignCredit(wrongObs('other'), 'ADD_UNLIKE_COPRIME', GRAPH);
    expect(updates.length).toBe(1);
    expect(updates[0].nodeId).toBe('ADD_UNLIKE_COPRIME');
  });

  it('null signature (correct or no pattern) → binding-node only', () => {
    const updates = assignCredit(wrongObs(null), 'ADD_UNLIKE_COPRIME', GRAPH);
    expect(updates.length).toBe(1);
    expect(updates[0].nodeId).toBe('ADD_UNLIKE_COPRIME');
  });

  it('forced_leftover → binding-node only', () => {
    const updates = assignCredit(wrongObs('forced_leftover'), 'IMPROPER_TO_MIXED', GRAPH);
    expect(updates.length).toBe(1);
    expect(updates[0].nodeId).toBe('IMPROPER_TO_MIXED');
  });

  it('not_simplified → binding-node only', () => {
    const updates = assignCredit(wrongObs('not_simplified'), 'SIMPLIFY', GRAPH);
    expect(updates.length).toBe(1);
    expect(updates[0].nodeId).toBe('SIMPLIFY');
  });
});

// ---------------------------------------------------------------------------
// 6. add_denominators specifically implicates ADD_SAME_DEN
// ---------------------------------------------------------------------------

describe('credit assignment — add_denominators', () => {
  it('add_denominators on ADD_UNLIKE_NESTED → implicates ADD_SAME_DEN', () => {
    const updates = assignCredit(
      wrongObs('add_denominators'),
      'ADD_UNLIKE_NESTED',
      GRAPH
    );
    expect(updates.length).toBe(2);
    const sameDen = updates.find((u) => u.nodeId === 'ADD_SAME_DEN');
    expect(sameDen).toBeDefined();
    expect(sameDen!.weight).toBe(PARAMS.creditDiscount);
  });

  it('add_denominators on ADD_SAME_DEN itself → no self-implication (binding-only)', () => {
    // When binding IS ADD_SAME_DEN, the implication map points to ADD_SAME_DEN,
    // but we must not credit the same node twice.
    const updates = assignCredit(
      wrongObs('add_denominators'),
      'ADD_SAME_DEN',
      GRAPH
    );
    // Should be binding-only since the binding IS the implicated node.
    expect(updates.length).toBe(1);
    expect(updates[0].nodeId).toBe('ADD_SAME_DEN');
  });

  it('add_denominators on ADD_UNLIKE_COPRIME → implicates ADD_SAME_DEN', () => {
    const updates = assignCredit(
      wrongObs('add_denominators'),
      'ADD_UNLIKE_COPRIME',
      GRAPH
    );
    // add_denominators maps to ADD_SAME_DEN which is a valid prereq (transitive)
    const sameDen = updates.find((u) => u.nodeId === 'ADD_SAME_DEN');
    expect(sameDen).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 7. Implication map sanity check
// ---------------------------------------------------------------------------

describe('ERROR_PREREQ_IMPLICATION map', () => {
  it('all mapped prereqs (non-null) exist in the graph', () => {
    for (const [sig, prereqId] of Object.entries(ERROR_PREREQ_IMPLICATION)) {
      if (prereqId !== null && sig !== 'add_across_unlike') {
        // add_across_unlike is resolved dynamically; skip here.
        expect(GRAPH.has(prereqId)).toBe(true);
      }
    }
  });
});
