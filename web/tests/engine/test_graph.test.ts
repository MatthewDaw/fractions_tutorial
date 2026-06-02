// test_graph.test.ts — Unit tests for the skill graph (graph.ts).
//
// Tests:
//   1. ADD_UNLIKE_COPRIME.prereqs includes ADD_UNLIKE_NESTED.
//   2. Every node's roomId exists in the real rooms.js ROOMS array.
//   3. mostUpstreamUnmastered returns the deepest unmastered node (closest to root).
//   4. Edge structure is correct for the full DAG.

import { describe, it, expect } from 'vitest';
import {
  getNode,
  prereqsOf,
  allNodes,
  mostUpstreamUnmastered,
  MULT_EQUAL_GROUPS,
  MULT_FACTS,
  ADD_SAME_DEN,
  ADD_UNLIKE_NESTED,
  ADD_UNLIKE_COPRIME,
  SIMPLIFY,
  IMPROPER_TO_MIXED,
} from '../../src/engine/graph.js';

// ---------------------------------------------------------------------------
// The set of valid room ids from web/src/rooms.js (read at test time to avoid
// coupling the test to a module that uses browser globals).
// rooms.js exports ROOMS as a plain array of objects; we inline the ids here
// so the test runs in jsdom without the import-chain touching JSX/React.
// ---------------------------------------------------------------------------
const KNOWN_ROOM_IDS = new Set(['m1', 'm3', 'nl', 'r1', 's1', 'cmp', 'r2', 'r3', 'r4', 'r5']);

// ---------------------------------------------------------------------------
// 1. Prerequisite structure
// ---------------------------------------------------------------------------

describe('prerequisite edges', () => {
  // --- Multiplication foundations strand (plan 006) ---
  it('MULT_EQUAL_GROUPS is a DAG root (no prerequisites)', () => {
    expect(MULT_EQUAL_GROUPS.prereqs).toHaveLength(0);
  });

  it('MULT_FACTS has MULT_EQUAL_GROUPS as its sole prerequisite (arrays cut)', () => {
    expect(MULT_FACTS.prereqs).toContain('MULT_EQUAL_GROUPS');
    expect(MULT_FACTS.prereqs).toHaveLength(1);
  });

  it('ADD_SAME_DEN has no prerequisites (root node)', () => {
    expect(ADD_SAME_DEN.prereqs).toHaveLength(0);
  });

  it('ADD_UNLIKE_NESTED has ADD_SAME_DEN as its sole prerequisite', () => {
    expect(ADD_UNLIKE_NESTED.prereqs).toContain('ADD_SAME_DEN');
    expect(ADD_UNLIKE_NESTED.prereqs).toHaveLength(1);
  });

  it('ADD_UNLIKE_COPRIME.prereqs includes ADD_UNLIKE_NESTED', () => {
    expect(ADD_UNLIKE_COPRIME.prereqs).toContain('ADD_UNLIKE_NESTED');
  });

  it('ADD_UNLIKE_COPRIME has two prerequisites with the fraction prereq LAST (R-B2)', () => {
    // MULT_FACTS is PREPENDED so credit.ts:97 (prereqs[length-1]) keeps docking
    // the fraction prereq (ADD_UNLIKE_NESTED) on a straight-across error.
    expect(ADD_UNLIKE_COPRIME.prereqs).toEqual(['MULT_FACTS', 'ADD_UNLIKE_NESTED']);
  });

  it('SIMPLIFY.prereqs includes ADD_UNLIKE_COPRIME with the fraction prereq LAST (R-B2)', () => {
    expect(SIMPLIFY.prereqs).toContain('ADD_UNLIKE_COPRIME');
    expect(SIMPLIFY.prereqs).toEqual(['MULT_FACTS', 'ADD_UNLIKE_COPRIME']);
  });

  it('IMPROPER_TO_MIXED.prereqs includes ADD_UNLIKE_COPRIME', () => {
    expect(IMPROPER_TO_MIXED.prereqs).toContain('ADD_UNLIKE_COPRIME');
  });

  it('SIMPLIFY and IMPROPER_TO_MIXED share the same parent (ADD_UNLIKE_COPRIME)', () => {
    expect(SIMPLIFY.prereqs).toContain('ADD_UNLIKE_COPRIME');
    expect(IMPROPER_TO_MIXED.prereqs).toContain('ADD_UNLIKE_COPRIME');
  });
});

// ---------------------------------------------------------------------------
// 2. Every node's roomId must be a valid room id from rooms.js
// ---------------------------------------------------------------------------

describe('roomId validity', () => {
  it('every node has a roomId that exists in rooms.js', () => {
    for (const node of allNodes()) {
      expect(KNOWN_ROOM_IDS.has(node.roomId)).toBe(true);
    }
  });

  it('MULT_EQUAL_GROUPS maps to m1', () => {
    expect(MULT_EQUAL_GROUPS.roomId).toBe('m1');
  });

  it('MULT_FACTS maps to m3', () => {
    expect(MULT_FACTS.roomId).toBe('m3');
  });

  it('ADD_SAME_DEN maps to r1', () => {
    expect(ADD_SAME_DEN.roomId).toBe('r1');
  });

  it('ADD_UNLIKE_NESTED maps to r3', () => {
    expect(ADD_UNLIKE_NESTED.roomId).toBe('r3');
  });

  it('ADD_UNLIKE_COPRIME maps to r2', () => {
    expect(ADD_UNLIKE_COPRIME.roomId).toBe('r2');
  });

  it('SIMPLIFY maps to r4', () => {
    expect(SIMPLIFY.roomId).toBe('r4');
  });

  it('IMPROPER_TO_MIXED maps to r5', () => {
    expect(IMPROPER_TO_MIXED.roomId).toBe('r5');
  });

  it('there are exactly ten nodes (2 multiplication + 8 fraction)', () => {
    expect(allNodes()).toHaveLength(10);
  });
});

// ---------------------------------------------------------------------------
// 3. Graph helpers
// ---------------------------------------------------------------------------

describe('getNode', () => {
  it('returns the correct node for a known id', () => {
    const node = getNode('ADD_SAME_DEN');
    expect(node.id).toBe('ADD_SAME_DEN');
    expect(node.roomId).toBe('r1');
  });

  it('throws for an unknown id', () => {
    expect(() => getNode('NONEXISTENT_NODE')).toThrow();
  });
});

describe('prereqsOf', () => {
  it('returns resolved SkillNode objects (not just ids)', () => {
    const prereqs = prereqsOf('ADD_UNLIKE_COPRIME');
    // R-B2: MULT_FACTS prepended, fraction prereq (ADD_UNLIKE_NESTED) stays LAST.
    expect(prereqs).toHaveLength(2);
    expect(prereqs[0].id).toBe('MULT_FACTS');
    expect(prereqs[0].roomId).toBe('m3');
    expect(prereqs[1].id).toBe('ADD_UNLIKE_NESTED');
    expect(prereqs[1].roomId).toBe('r3');
  });

  it('returns empty array for the root node', () => {
    expect(prereqsOf('ADD_SAME_DEN')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 4. mostUpstreamUnmastered
// ---------------------------------------------------------------------------

describe('mostUpstreamUnmastered', () => {
  it('returns MULT_EQUAL_GROUPS when all nodes are unmastered (front of the DAG)', () => {
    const ids = allNodes().map((n) => n.id);
    const result = mostUpstreamUnmastered(ids, () => false);
    expect(result?.id).toBe('MULT_EQUAL_GROUPS');
  });

  it('skips mastered nodes and returns the next deepest unmastered', () => {
    const ids = allNodes().map((n) => n.id);
    // Multiplication strand (now 2 nodes) mastered → next is FRACTION_ON_LINE,
    // the most-upstream fraction node in teaching order.
    const mastered = new Set(['MULT_EQUAL_GROUPS', 'MULT_FACTS']);
    const result = mostUpstreamUnmastered(ids, (id) => mastered.has(id));
    expect(result?.id).toBe('FRACTION_ON_LINE');
  });

  it('returns null when all nodes in the set are mastered', () => {
    const ids = ['ADD_SAME_DEN', 'ADD_UNLIKE_NESTED'];
    const result = mostUpstreamUnmastered(ids, () => true);
    expect(result).toBeNull();
  });

  it('works with a single-node set', () => {
    const result = mostUpstreamUnmastered(['ADD_UNLIKE_COPRIME'], () => false);
    expect(result?.id).toBe('ADD_UNLIKE_COPRIME');
  });

  it('returns null for an empty set', () => {
    const result = mostUpstreamUnmastered([], () => false);
    expect(result).toBeNull();
  });

  it('when both SIMPLIFY and IMPROPER_TO_MIXED are unmastered, returns neither ADD_UNLIKE_COPRIME from the set if it is mastered', () => {
    // Scenario: upstream nodes mastered, only the two leaf nodes unmastered.
    const mastered = new Set(['ADD_SAME_DEN', 'ADD_UNLIKE_NESTED', 'ADD_UNLIKE_COPRIME']);
    const ids = ['SIMPLIFY', 'IMPROPER_TO_MIXED'];
    const result = mostUpstreamUnmastered(ids, (id) => mastered.has(id));
    // Both SIMPLIFY and IMPROPER_TO_MIXED are unmastered; SIMPLIFY appears first in
    // topological order, so it should be returned.
    expect(result?.id).toBe('SIMPLIFY');
  });

  it('returns the deepest unmastered when called with all node ids and multiple mastered', () => {
    const ids = allNodes().map((n) => n.id);
    // Everything upstream of ADD_UNLIKE_COPRIME mastered → it is the next target.
    const mastered = new Set([
      'MULT_EQUAL_GROUPS', 'MULT_FACTS',
      'FRACTION_ON_LINE', 'ADD_SAME_DEN', 'SUB_SAME_DEN', 'COMPARE_BENCHMARK',
      'ADD_UNLIKE_NESTED',
    ]);
    const result = mostUpstreamUnmastered(ids, (id) => mastered.has(id));
    expect(result?.id).toBe('ADD_UNLIKE_COPRIME');
  });
});
