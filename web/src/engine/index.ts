// index.ts — Public API surface of the knowledge-prediction engine.
//
// This file is the future wire-contract entry point (KTD1): every type exported
// here is a DTO that would travel over the wire if the engine is relocated behind
// a Python FastAPI backend.  A Python relocation requires only a `fetch` swap at
// the U9/U11 call sites — zero churn here.
//
// ENGINE PURITY: NO React imports, NO wall-clock calls anywhere in this module.

// ---------------------------------------------------------------------------
// Types (the contract / wire DTOs)
// ---------------------------------------------------------------------------
export type {
  Modality,
  Actor,
  ScaffoldLevel,
  Action,
  Signal,
  Event,
  ErrorSignature,
  Observation,
  FluencyStats,
  MasteryEstimate,
  Decision,
  DecisionPresentProblem,
  DecisionRouteToRoom,
  DecisionReturnToKitchen,
  DecisionFadeScaffold,
  DecisionRaiseScaffold,
  DecisionTransferProbe,
  DecisionEscalateToHuman,
  SkillNode,
} from './types.js';

// ---------------------------------------------------------------------------
// Parameters
// ---------------------------------------------------------------------------
export { PARAMS } from './params.js';
export type { EngineParams, BktParams, EscalationParams } from './params.js';

// ---------------------------------------------------------------------------
// Skill graph helpers
// ---------------------------------------------------------------------------
export {
  getNode,
  prereqsOf,
  allNodes,
  mostUpstreamUnmastered,
  // Named node constants (useful for tests and policy code)
  ADD_SAME_DEN,
  ADD_UNLIKE_NESTED,
  ADD_UNLIKE_COPRIME,
  SIMPLIFY,
  IMPROPER_TO_MIXED,
} from './graph.js';

// ---------------------------------------------------------------------------
// Append-only log + persistence adapter + migration
// ---------------------------------------------------------------------------
export {
  appendEvent,
  foldLog,
  loadLog,
  saveLog,
  migrateFromKitchenProgress,
} from './log.js';
export type { SeedPriors } from './log.js';
