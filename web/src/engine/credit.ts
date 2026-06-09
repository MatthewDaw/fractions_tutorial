// credit.ts — U6: DAG credit assignment (measurement §4.7.4 step 3).
//
// assignCredit(observation, bindingNodeId, graph) -> CreditUpdate[]
//
// First-pass rule:
//   - Correct answer: update the binding node ONLY (no prereq credit by default).
//   - Wrong answer: update binding node FULLY + discounted update to the implicated
//     prerequisite (if any). The implication map ties each error_signature to the
//     prereq it implicates. Unknown/ambiguous → binding-only.
//
// ENGINE PURITY: NO React imports, NO wall-clock calls.

import type { Observation, ErrorSignature } from './types.js';
import type { SkillNode } from './types.js';
import { PARAMS } from './params.js';

// ---------------------------------------------------------------------------
// Error-signature → prerequisite implication map
//
// Key:   ErrorSignature value (or null for "correct / no pattern")
// Value: id of the prerequisite node that this error implicates, or null
//        meaning "binding node only."
//
// Design reasoning (measurement §4.7.4 step 3 + room docs):
//   add_denominators     — child is treating unlike denominators as like ones
//                          → implicates ADD_SAME_DEN (they're confused about what
//                            "same denominator" even means).
//   add_across_unlike    — cross-multiply / scale-one step completely missed
//                          → implicates ADD_UNLIKE_NESTED (the scale-one prereq
//                            for ADD_UNLIKE_COPRIME; or ADD_SAME_DEN for an
//                            ADD_UNLIKE_NESTED error itself).
//                          We assign the DIRECT prereq of the binding node (one
//                          hop upstream), not the root.
//   scaled_bottom_only   — child attempted renaming but forgot to scale numerator
//                          → this is an error IN the current skill (re-cutting
//                            step), NOT a prereq gap. Binding-node only.
//   forced_leftover      — improper→mixed conversion error
//                          → no specific prereq; binding-node only.
//   not_simplified       — simplification skip; could implicate SIMPLIFY prereq
//                          but that IS the binding skill when simplify is being
//                          tested; binding-node only.
//   other / null         — ambiguous; binding-node only.
// ---------------------------------------------------------------------------

/** Maps an ErrorSignature to the ID of the prereq it implicates. */
export const ERROR_PREREQ_IMPLICATION: Readonly<Record<NonNullable<ErrorSignature> | 'null', string | null>> = {
  add_denominators:    'ADD_SAME_DEN',      // confused about same-denominator rule
  add_across_unlike:   null,                // resolved at runtime to direct prereq
  scaled_bottom_only:  null,                // error in current skill, not a prereq gap
  forced_leftover:     null,                // improper→mixed error; binding-only
  not_simplified:      null,                // simplification miss; binding-only
  // 006 O1: mult misconceptions are errors WITHIN the current mult skill, not a
  // fraction-prereq gap → binding-node only (no cross-strand credit propagation).
  add_factors:            null,             // a×b → a+b; error in the mult skill itself
  skip_count_drift:       null,             // skip-count drift; binding-only
  array_perimeter:        null,             // perimeter-for-area; binding-only
  distributive_add_parts: null,             // summed split sizes; binding-only
  other:               null,
  null:                null,                // correct or unclassified
};

// ---------------------------------------------------------------------------
// Credit update records
// ---------------------------------------------------------------------------

export interface CreditUpdate {
  /** The node id to update. */
  nodeId: string;
  /** Whether the observation counts as correct for this node's BKT update. */
  correct: boolean;
  /**
   * Weight to apply to the update ∈ (0, 1].
   * 1.0 = full binding-node update.
   * < 1.0 = discounted prereq update.
   */
  weight: number;
}

// ---------------------------------------------------------------------------
// Resolve the implicated prereq for an observation
// ---------------------------------------------------------------------------

/**
 * Given an error_signature and a binding node, return the id of the prereq
 * that should receive a discounted update, or null (binding-only).
 *
 * For add_across_unlike we resolve to the direct prereq of the binding node
 * rather than always routing to ADD_SAME_DEN: if the child is working on
 * ADD_UNLIKE_COPRIME, the more proximate gap is ADD_UNLIKE_NESTED; if they're
 * working on ADD_UNLIKE_NESTED, the gap is ADD_SAME_DEN.
 */
function resolveImplicatedPrereq(
  sig: ErrorSignature,
  bindingNode: SkillNode,
  graph: ReadonlyMap<string, SkillNode>
): string | null {
  if (sig === null) return null;

  const mapped = ERROR_PREREQ_IMPLICATION[sig];

  // add_across_unlike → direct prereq of binding node (one hop upstream)
  if (sig === 'add_across_unlike') {
    const directPrereq = bindingNode.prereqs[bindingNode.prereqs.length - 1] ?? null;
    return directPrereq;
  }

  // For add_denominators mapped to ADD_SAME_DEN — verify the node exists in
  // the graph; if the binding node IS ADD_SAME_DEN then there's no prereq to
  // implicate.
  if (mapped !== null) {
    if (mapped === bindingNode.id) return null; // binding node IS the implicated node
    if (graph.has(mapped)) return mapped;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public assignCredit function
// ---------------------------------------------------------------------------

/**
 * Compute credit updates for an Observation.
 *
 * @param observation   The segmented attempt.
 * @param bindingNodeId The node being practiced (from the lesson).
 * @param graph         The full skill graph as a map from id → SkillNode.
 * @returns             An array of CreditUpdate records (1 or 2 entries).
 */
export function assignCredit(
  observation: Observation,
  bindingNodeId: string,
  graph: ReadonlyMap<string, SkillNode>
): CreditUpdate[] {
  const bindingNode = graph.get(bindingNodeId);
  if (!bindingNode) {
    // Unknown node — return binding-only with a safe default.
    return [{ nodeId: bindingNodeId, correct: observation.correct, weight: 1.0 }];
  }

  // Binding node gets a full update.
  const updates: CreditUpdate[] = [
    { nodeId: bindingNodeId, correct: observation.correct, weight: 1.0 },
  ];

  // Only propagate to a prereq on an incorrect answer.
  if (!observation.correct && observation.error_signature !== null) {
    const prereqId = resolveImplicatedPrereq(
      observation.error_signature,
      bindingNode,
      graph
    );

    if (prereqId !== null && graph.has(prereqId)) {
      // Discounted incorrect update to the implicated prereq.
      updates.push({
        nodeId: prereqId,
        correct: false,
        weight: PARAMS.creditDiscount,
      });
    }
  }

  return updates;
}
