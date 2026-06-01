// bkt.ts — U3: Bayesian Knowledge Tracing accuracy model (measurement §4.1).
//
// Two pure entry points:
//   coldStart(node, prereqPKnowns, params?)  — cold-start prior with prereq propagation
//   bktUpdate(prior, correct, params?)       — corrected correct/incorrect update + learn step
//
// ENGINE PURITY: NO React imports, NO wall-clock calls, NO external libraries.
// All equations follow measurement §4.1 verbatim.

import type { SkillNode } from './types.js';
import type { BktParams } from './params.js';
import { PARAMS } from './params.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ---------------------------------------------------------------------------
// Cold-start prior with prerequisite propagation (measurement §4.1)
//
// P_known = clamp(P_L0 + Σ_prereqs w·(P_known(p) − 0.5), [priorClamp.min, priorClamp.max])
//
// prereqPKnowns: map from nodeId → current P_known for each prerequisite.
// ---------------------------------------------------------------------------

export interface ColdStartOptions {
  P_L0?: number;
  prereqWeight?: number;
  priorClamp?: readonly [number, number];
}

/**
 * Compute the cold-start prior for a skill node given the current P_known
 * values of its prerequisites.
 *
 * @param node          The SkillNode being cold-started.
 * @param prereqPKnowns Map from prerequisite node id → current P_known.
 * @param opts          Optional overrides for P_L0, prereqWeight, priorClamp.
 */
export function coldStart(
  node: SkillNode,
  prereqPKnowns: ReadonlyMap<string, number>,
  opts?: ColdStartOptions
): number {
  const P_L0 = opts?.P_L0 ?? node.bkt_params?.P_L0 ?? PARAMS.P_L0;
  const w = opts?.prereqWeight ?? PARAMS.prereqWeight;
  const [clampMin, clampMax] = opts?.priorClamp ?? PARAMS.priorClamp;

  let prior = P_L0;
  for (const prereqId of node.prereqs) {
    const prereqPK = prereqPKnowns.get(prereqId);
    if (prereqPK !== undefined) {
      prior += w * (prereqPK - 0.5);
    }
  }

  return clamp(prior, clampMin, clampMax);
}

// ---------------------------------------------------------------------------
// BKT update (measurement §4.1, verbatim equations)
//
// Given prior P_known:
//   correct:   P = P_known·(1−S) / [P_known·(1−S) + (1−P_known)·G]
//   incorrect: P = P_known·S     / [P_known·S     + (1−P_known)·(1−G)]
//   learn:     P_known' = P + (1−P)·T
//   clamp P_known' to [pKnownClamp.min, pKnownClamp.max]
// ---------------------------------------------------------------------------

/**
 * Apply one BKT update step.
 *
 * @param prior   Current P_known ∈ [0,1].
 * @param correct Whether the child's answer was correct.
 * @param params  BKT parameters {P_T, P_S, P_G}. Defaults to PARAMS.bkt.
 * @returns       Updated P_known, clamped to pKnownClamp.
 */
export function bktUpdate(
  prior: number,
  correct: boolean,
  params?: Partial<BktParams>
): number {
  const P_T = params?.P_T ?? PARAMS.bkt.P_T;
  const P_S = params?.P_S ?? PARAMS.bkt.P_S;
  const P_G = params?.P_G ?? PARAMS.bkt.P_G;

  // Posterior given the observation (before the learn step).
  let P: number;
  if (correct) {
    const num = prior * (1 - P_S);
    const denom = prior * (1 - P_S) + (1 - prior) * P_G;
    P = denom === 0 ? prior : num / denom;
  } else {
    const num = prior * P_S;
    const denom = prior * P_S + (1 - prior) * (1 - P_G);
    P = denom === 0 ? prior : num / denom;
  }

  // Learn step: the child may have learned even if they were wrong.
  const posterior = P + (1 - P) * P_T;

  const [clampMin, clampMax] = PARAMS.pKnownClamp;
  return clamp(posterior, clampMin, clampMax);
}
