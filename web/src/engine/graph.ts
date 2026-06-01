// graph.ts — Skill DAG mapped to the ACTUAL rooms in web/src/rooms.js (KTD11).
// Nodes and edges encode the teaching sequence; roomId fields are the stable room ids.
// ENGINE PURITY: NO React imports, NO wall-clock calls.

import type { SkillNode } from './types.js';

// ---------------------------------------------------------------------------
// Node definitions (KTD11 / measurement §4.7.4 step 3)
// ---------------------------------------------------------------------------

// Room ids verified against web/src/rooms.js:
//   r1 — Same Denominators
//   r3 — Scale One (Add Unlike, one already fits)
//   r2 — Cross-Multiply (Add Unlike, neither fits)
//   r4 — Simplify
//   r5 — Mixed Numbers (Improper→Mixed)

const ADD_SAME_DEN: SkillNode = {
  id: 'ADD_SAME_DEN',
  roomId: 'r1',
  prereqs: [],
  scaffold_ladder: [
    ['same_den_visual'],           // L0 — full visual fraction bar
    ['same_den_guided'],           // L1 — guided tap
    ['same_den_partial'],          // L2 — partial cue
    ['same_den_bare'],             // L3 — bare expression, no cue
    ['same_den_transfer'],         // L4 — novel denominator transfer
  ],
  transfer_forms: ['same_den_bare', 'same_den_transfer'],
};

const ADD_UNLIKE_NESTED: SkillNode = {
  id: 'ADD_UNLIKE_NESTED',
  roomId: 'r3',
  prereqs: ['ADD_SAME_DEN'],
  scaffold_ladder: [
    ['nested_visual'],
    ['nested_guided'],
    ['nested_partial'],
    ['nested_bare'],
    ['nested_transfer'],
  ],
  transfer_forms: ['nested_bare', 'nested_transfer'],
};

const ADD_UNLIKE_COPRIME: SkillNode = {
  id: 'ADD_UNLIKE_COPRIME',
  roomId: 'r2',
  prereqs: ['ADD_UNLIKE_NESTED'],
  scaffold_ladder: [
    ['coprime_visual'],
    ['coprime_guided'],
    ['coprime_partial'],
    ['coprime_bare'],
    ['coprime_transfer'],
  ],
  transfer_forms: ['coprime_bare', 'coprime_transfer'],
};

const SIMPLIFY: SkillNode = {
  id: 'SIMPLIFY',
  roomId: 'r4',
  prereqs: ['ADD_UNLIKE_COPRIME'],
  scaffold_ladder: [
    ['simplify_visual'],
    ['simplify_guided'],
    ['simplify_partial'],
    ['simplify_bare'],
    ['simplify_transfer'],
  ],
  transfer_forms: ['simplify_bare', 'simplify_transfer'],
};

const IMPROPER_TO_MIXED: SkillNode = {
  id: 'IMPROPER_TO_MIXED',
  roomId: 'r5',
  prereqs: ['ADD_UNLIKE_COPRIME'],
  scaffold_ladder: [
    ['mixed_visual'],
    ['mixed_guided'],
    ['mixed_partial'],
    ['mixed_bare'],
    ['mixed_transfer'],
  ],
  transfer_forms: ['mixed_bare', 'mixed_transfer'],
};

// ---------------------------------------------------------------------------
// The skill graph
// ---------------------------------------------------------------------------

/** All nodes, in topological (teaching) order. */
const ALL_NODES: readonly SkillNode[] = [
  ADD_SAME_DEN,
  ADD_UNLIKE_NESTED,
  ADD_UNLIKE_COPRIME,
  SIMPLIFY,
  IMPROPER_TO_MIXED,
];

/** Fast id → node lookup. */
const NODE_MAP: ReadonlyMap<string, SkillNode> = new Map(
  ALL_NODES.map((n) => [n.id, n])
);

// ---------------------------------------------------------------------------
// Public graph API
// ---------------------------------------------------------------------------

/** Return a node by id, or throw if not found. */
export function getNode(id: string): SkillNode {
  const node = NODE_MAP.get(id);
  if (!node) throw new Error(`Unknown skill node id: "${id}"`);
  return node;
}

/** Return the prerequisite SkillNodes for a given node id. */
export function prereqsOf(id: string): readonly SkillNode[] {
  return getNode(id).prereqs.map(getNode);
}

/** Return all nodes (topological order). */
export function allNodes(): readonly SkillNode[] {
  return ALL_NODES;
}

/**
 * Given a set of node ids and a predicate `isMastered(id) -> boolean`, return
 * the most-upstream (earliest in teaching sequence) unmastered node.
 *
 * "Most upstream" = deepest foundation first: we walk from the root toward the
 * leaves and return the first unmastered node encountered.
 *
 * Returns null if all nodes in `ids` are mastered.
 */
export function mostUpstreamUnmastered(
  ids: readonly string[],
  isMastered: (id: string) => boolean
): SkillNode | null {
  // Walk ALL_NODES in topological order; return the first unmastered id in `ids`.
  const idSet = new Set(ids);
  for (const node of ALL_NODES) {
    if (idSet.has(node.id) && !isMastered(node.id)) {
      return node;
    }
  }
  return null;
}

// Export node constants for use by other engine modules.
export { ADD_SAME_DEN, ADD_UNLIKE_NESTED, ADD_UNLIKE_COPRIME, SIMPLIFY, IMPROPER_TO_MIXED };
