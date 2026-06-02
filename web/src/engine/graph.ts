// graph.ts — Skill DAG mapped to the ACTUAL rooms in web/src/rooms.js (KTD11).
// Nodes and edges encode the teaching sequence; roomId fields are the stable room ids.
// ENGINE PURITY: NO React imports, NO wall-clock calls.

import type { SkillNode } from './types.js';

// ---------------------------------------------------------------------------
// Node definitions (KTD11 / measurement §4.7.4 step 3)
// ---------------------------------------------------------------------------

// Room ids verified against web/src/rooms.js:
//   m1 — Equal Groups (whole-number multiplication: a groups of b)
//   m3 — Multiplication Facts (skip-count → fluent single-digit recall)
//   r1 — Same Denominators
//   r3 — Scale One (Add Unlike, one already fits)
//   r2 — Cross-Multiply (Add Unlike, neither fits)
//   r4 — Simplify
//   r5 — Mixed Numbers (Improper→Mixed)

// ---------------------------------------------------------------------------
// Multiplication-foundations strand (plan 006) — CANONICAL NODE IDS.
//
// The canonical ids are EXACTLY: MULT_EQUAL_GROUPS, MULT_FACTS.
// getNode() throws on an unknown id and prereqsOf maps every prereq through
// getNode, so any id mismatch crashes the DAG at init. Use these ids only.
//
// PREREQ-ORDERING CONSTRAINT (load-bearing — see credit.ts:97):
//   credit.ts resolveImplicatedPrereq() handles `add_across_unlike` by docking
//   `bindingNode.prereqs[prereqs.length - 1]` — the LAST prereq. MULT_FACTS is
//   therefore PREPENDED (never appended) to ADD_UNLIKE_COPRIME.prereqs and
//   SIMPLIFY.prereqs so the original FRACTION prereq stays LAST and credit.ts
//   keeps docking the fraction prereq (not multiplication fluency) on a
//   straight-across fraction error. credit.ts needs NO edit because of this.
// ---------------------------------------------------------------------------

// Inserted at INDEX 0 of ALL_NODES (front of the DAG). prereqs [] — DAG root.
const MULT_EQUAL_GROUPS: SkillNode = {
  id: 'MULT_EQUAL_GROUPS',
  roomId: 'm1',
  prereqs: [],
  scaffold_ladder: [
    ['equal_groups_visual'],   // L0
    ['equal_groups_guided'],   // L1
    ['equal_groups_partial'],  // L2
    ['equal_groups_bare'],     // L3
    ['equal_groups_transfer'], // L4
  ],
  transfer_forms: ['equal_groups_bare', 'equal_groups_transfer'], // length 2 → TransferProbe legal
  // bkt_params omitted → global PARAMS.bkt (meaning-level node; fluency tuning lives in MULT_FACTS)
};

// Inserted at INDEX 1 of ALL_NODES (after MULT_EQUAL_GROUPS, before ADD_SAME_DEN).
// The fluency layer: becomes a prereq of ADD_UNLIKE_COPRIME (r2) and SIMPLIFY (r4).
const MULT_FACTS: SkillNode = {
  id: 'MULT_FACTS',
  roomId: 'm3',
  prereqs: ['MULT_EQUAL_GROUPS'],
  scaffold_ladder: [
    ['facts_visual'],   // L0
    ['facts_guided'],   // L1
    ['facts_partial'],  // L2
    ['facts_bare'],     // L3
    ['facts_transfer'], // L4
  ],
  transfer_forms: ['facts_bare', 'facts_transfer'],
};

// CCSS 3.NF.A.2 — a fraction is a NUMBER located as a point on the line. Inserted
// before ADD_SAME_DEN (a grade-3 foundation under the fraction-adding strand).
const FRACTION_ON_LINE: SkillNode = {
  id: 'FRACTION_ON_LINE',
  roomId: 'nl',
  prereqs: [],
  scaffold_ladder: [
    ['nl_visual'],   // L0 — drag the point on a partitioned 0→1 line
    ['nl_guided'],   // L1 — guided placement
    ['nl_partial'],  // L2 — name the marked point
    ['nl_bare'],     // L3 — place past 1 (a/b > 1)
    ['nl_transfer'], // L4 — novel denominator / value transfer
  ],
  transfer_forms: ['nl_bare', 'nl_transfer'],
  grade: '3',
  standards: ['3.NF.A.2'],
};

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

// CCSS 4.NF.B.3a (subtract like-den) + 4.NF.B.3b (decompose). Inserted after
// ADD_SAME_DEN (its single prereq) — subtraction mirrors same-denominator adding.
const SUB_SAME_DEN: SkillNode = {
  id: 'SUB_SAME_DEN',
  roomId: 's1',
  prereqs: ['ADD_SAME_DEN'],
  scaffold_ladder: [
    ['sub_same_visual'],   // L0 — decompose 5/8 into unit fractions
    ['sub_same_guided'],   // L1 — drag pieces off (take away)
    ['sub_same_partial'],  // L2 — locked-den Slate, count what's left
    ['sub_same_bare'],     // L3 — bare 7/8 − 3/8
    ['sub_same_transfer'], // L4 — kitchen word problem transfer
  ],
  transfer_forms: ['sub_same_bare', 'sub_same_transfer'],
  grade: '4',
  standards: ['4.NF.B.3a', '4.NF.B.3b'],
};

// CCSS 3.NF.A.3d / 4.NF.A.2 / 5.NF.A.2 — compare fractions and reason about a
// sum's size from benchmarks. Inserted after SUB_SAME_DEN; prereq FRACTION_ON_LINE
// (comparison is reasoning about points on the line).
const COMPARE_BENCHMARK: SkillNode = {
  id: 'COMPARE_BENCHMARK',
  roomId: 'cmp',
  prereqs: ['FRACTION_ON_LINE'],
  scaffold_ladder: [
    ['cmp_visual'],   // L0 — pick < = > from two number lines
    ['cmp_guided'],   // L1 — same-numerator comparison
    ['cmp_partial'],  // L2 — nearest benchmark {0, 1/2, 1}
    ['cmp_bare'],     // L3 — reason about a sum's size (no computing)
    ['cmp_transfer'], // L4 — novel comparison / reasonableness transfer
  ],
  transfer_forms: ['cmp_bare', 'cmp_transfer'],
  grade: '4',
  standards: ['3.NF.A.3d', '4.NF.A.2', '5.NF.A.2'],
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
  // R-B2: MULT_FACTS PREPENDED — fraction prereq (ADD_UNLIKE_NESTED) stays LAST
  // so credit.ts:97 (prereqs[length-1]) keeps docking the fraction prereq.
  prereqs: ['MULT_FACTS', 'ADD_UNLIKE_NESTED'],
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
  // R-B2: MULT_FACTS PREPENDED — fraction prereq (ADD_UNLIKE_COPRIME) stays LAST
  // so credit.ts:97 (prereqs[length-1]) keeps docking the fraction prereq.
  prereqs: ['MULT_FACTS', 'ADD_UNLIKE_COPRIME'],
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
  // Multiplication foundations (plan 006) — inserted at the FRONT (indices 0–1),
  // strictly upstream of the fraction strand. Order is load-bearing for
  // mostUpstreamUnmastered / escalation / suggestedNextRoom (all walk front-to-back).
  // Equal Groups builds the meaning of multiplication; Facts is the fluency layer
  // the fraction-renaming steps (cross-multiply, scaling, simplify) consume. The
  // arrays/area lesson was cut — its only downstream use is multiplying fractions,
  // which this app never does.
  MULT_EQUAL_GROUPS,
  MULT_FACTS,
  // CCSS gap-fill: FRACTION_ON_LINE precedes ADD_SAME_DEN (grade-3 foundation).
  FRACTION_ON_LINE,
  ADD_SAME_DEN,
  // SUB_SAME_DEN after ADD_SAME_DEN; COMPARE_BENCHMARK after SUB_SAME_DEN.
  SUB_SAME_DEN,
  COMPARE_BENCHMARK,
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
export {
  MULT_EQUAL_GROUPS,
  MULT_FACTS,
  FRACTION_ON_LINE,
  ADD_SAME_DEN,
  SUB_SAME_DEN,
  COMPARE_BENCHMARK,
  ADD_UNLIKE_NESTED,
  ADD_UNLIKE_COPRIME,
  SIMPLIFY,
  IMPROPER_TO_MIXED,
};
