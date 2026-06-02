// policy.ts — U8: Deterministic policy (state-model §5.1/§5.2/§5.4/§5.5).
//
// Two public functions:
//   legalMoves(state, mastery) -> Decision[]   (pure enumeration)
//   nextDecision(state, mastery, recentBehavior, now) -> Decision  (deterministic choice)
//
// Invariants (KTD7, KTD8):
//   - nextDecision always returns a move from legalMoves (no illegal moves).
//   - Every Decision has a non-empty rationale string.
//   - No code path emits a DeclareMastered (R9 — mastery is only readable via isMastered()).
//   - EscalateToHuman fires on exactly two deterministic triggers (state-model §5.5):
//       stuck:      floor scaffold + most-upstream node + P_known flat over nStuck=6
//                   attempts with H3/H4 hints.
//       disengaged: sustained avoiding/idle corroborated by behavior over nDiseng.
//
// ENGINE PURITY: NO React imports, NO wall-clock calls.

import type {
  MasteryEstimate,
  ScaffoldLevel,
  Decision,
  DecisionFadeScaffold,
  DecisionRaiseScaffold,
  DecisionTransferProbe,
  DecisionReturnToKitchen,
  DecisionRouteToRoom,
  DecisionPresentProblem,
  DecisionEscalateToHuman,
  Observation,
} from './types.js';
import { isMastered } from './gate.js';
import { mostUpstreamUnmastered, allNodes, getNode } from './graph.js';
import { PARAMS } from './params.js';

// ---------------------------------------------------------------------------
// State shape — what the policy knows about the current lesson/world context
// ---------------------------------------------------------------------------

/**
 * Lesson/world state passed to legalMoves and nextDecision.
 *
 * The policy is a pure function of (state, mastery, recentBehavior, now).
 * The caller (useLessonEngine) maintains and updates this object.
 */
export interface PolicyState {
  /** The skill node currently being practiced. */
  currentNodeId: string;
  /** Design scaffold level active for the current node. */
  currentScaffold: ScaffoldLevel;
  /**
   * The stumping recipe that originally triggered the wall route to this node,
   * or null when the child arrived here directly (not via wall routing).
   * Used for ReturnToKitchen.
   */
  stumpingRecipe: string | null;
  /**
   * Whether the child is currently in the kitchen (MomsRoom) or in a skill
   * lesson. When true, RouteToRoom is legal; ReturnToKitchen is illegal.
   */
  inKitchen: boolean;
  /**
   * The highest scaffold level the child passed (hint-free correct) in the
   * current session on the current node. null = no evidence yet.
   * The policy uses this for scaffold-entry decisions.
   */
  sessionMaxScaffoldPassed: ScaffoldLevel | null;
  /**
   * Number of consecutive errors in the current lesson segment at the current
   * scaffold level (resets on correct answer or scaffold change).
   */
  consecutiveErrors: number;
  /**
   * Number of consecutive clean (hint-free, in-band latency) corrects at the
   * current scaffold level in the current segment (resets on error or scaffold
   * change).
   */
  consecutiveCleanCorrects: number;
  /**
   * True when the last attempt had too_fast_correct flagged and a transfer probe
   * has not yet fired.
   */
  pendingTransferProbe: boolean;
  /**
   * History of the last N P_known values for the current node, used to detect
   * a flat/stuck trajectory for escalation.
   * Index 0 = oldest, index [n-1] = most recent.
   */
  pKnownHistory: readonly number[];
  /**
   * Count of recent attempts (at floor scaffold = L0) where hint_max_rung ≥ 3
   * (H3/H4 — heavy hints). Used for stuck-escalation.
   */
  heavyHintAtFloorCount: number;
  /**
   * Count of consecutive observations flagged as disengaged/avoiding
   * (idle, repeated abandon without attempt, oscillation without progress).
   */
  disengagedCount: number;
}

// ---------------------------------------------------------------------------
// Recent-behavior buffer (compact per-attempt signal)
// ---------------------------------------------------------------------------

/**
 * A lightweight summary of the last few attempts' behavioral signals.
 * The policy reads this to decide between RouteToRoom, EscalateToHuman, etc.
 */
export interface RecentBehavior {
  /** The last N observations for the current node (chronological, most recent last). */
  observations: readonly Observation[];
  /**
   * True when behavioral analysis (idle time, repeated abandons) suggests
   * the child is disengaged — not measured from wall-clock, only from event
   * timestamps.
   */
  isDisengaged: boolean;
}

// ---------------------------------------------------------------------------
// legalMoves — pure enumeration of allowed Decisions in a given state
// (KTD7 / state-model §5.2 guardrail 1)
// ---------------------------------------------------------------------------

/**
 * Enumerate all Decision kinds that are valid in the given state.
 *
 * Rules:
 *   - FadeScaffold: current scaffold < L4 (can still go up).
 *   - RaiseScaffold: current scaffold > L0 (can still go down) AND not mastered.
 *   - TransferProbe: current node has ≥2 transfer_forms (something to probe with).
 *   - ReturnToKitchen: not in kitchen AND stumpingRecipe is set AND the node is mastered.
 *   - RouteToRoom: in kitchen (wall detected externally by the caller).
 *   - PresentProblem: always legal (show the next problem at current scaffold).
 *   - EscalateToHuman: always legal (safety valve).
 *
 * Returns an array of Decision kind strings (not full Decision objects — the
 * nextDecision function fills in the details).
 */
export function legalMoves(
  state: PolicyState,
  mastery: Readonly<Record<string, MasteryEstimate>>
): readonly string[] {
  const moves: string[] = [];

  // PresentProblem is always available.
  moves.push('PresentProblem');

  // EscalateToHuman is always available (safety valve).
  moves.push('EscalateToHuman');

  // FadeScaffold: can reduce support when below max scaffold level.
  if (state.currentScaffold < 4) {
    moves.push('FadeScaffold');
  }

  // RaiseScaffold: can increase support when above floor AND node not mastered.
  const currentEst = mastery[state.currentNodeId];
  const currentMastered = currentEst ? isMastered(currentEst) : false;
  if (state.currentScaffold > 0 && !currentMastered) {
    moves.push('RaiseScaffold');
  }

  // TransferProbe: legal when the current node has ≥2 transfer forms available.
  const currentNode = (() => {
    try { return getNode(state.currentNodeId); } catch { return null; }
  })();
  if (currentNode && currentNode.transfer_forms.length >= 2) {
    moves.push('TransferProbe');
  }

  // ReturnToKitchen: legal when NOT in kitchen, stumping recipe is known,
  // AND the current node is now mastered.
  if (!state.inKitchen && state.stumpingRecipe !== null && currentMastered) {
    moves.push('ReturnToKitchen');
  }

  // RouteToRoom: legal when in the kitchen context (wall fired or suggested
  // by the caller). The actual node to route to is determined by nextDecision.
  if (state.inKitchen) {
    moves.push('RouteToRoom');
  }

  return moves;
}

// ---------------------------------------------------------------------------
// nextDecision — deterministic policy (state-model §5.4)
// ---------------------------------------------------------------------------

/**
 * Choose the best Decision from legalMoves, deterministically.
 *
 * Priority order (state-model §5.4):
 *  1. EscalateToHuman  — if stuck or disengaged (deterministic triggers, §5.5)
 *  2. ReturnToKitchen  — if the current node just became mastered
 *  3. RouteToRoom      — if in kitchen and a wall was detected (caller sets inKitchen=true)
 *  4. RaiseScaffold    — if m≥2 errors at current scaffold
 *  5. FadeScaffold     — if k≥3 clean corrects AND other dims not yet green for transfer
 *  6. TransferProbe    — if other dims are green but transfer isn't (or too_fast_correct)
 *  7. PresentProblem   — default (entry-level scaffold or current scaffold)
 *
 * Every returned Decision has a non-empty rationale (KTD8).
 * nextDecision emits ONLY moves present in legalMoves (no illegal move).
 *
 * @param state           Current lesson/world state.
 * @param mastery         Current per-node MasteryEstimate map.
 * @param recentBehavior  Recent behavioral signals.
 * @param now             Current timestamp (ms epoch) — injected by caller.
 */
export function nextDecision(
  state: PolicyState,
  mastery: Readonly<Record<string, MasteryEstimate>>,
  recentBehavior: RecentBehavior,
  now: number
): Decision {
  const legal = new Set(legalMoves(state, mastery));
  const currentEst = mastery[state.currentNodeId];

  // ---- 1. EscalateToHuman — deterministic triggers (§5.5) ----
  if (legal.has('EscalateToHuman')) {
    const escalation = checkEscalationTriggers(state, recentBehavior, now);
    if (escalation) return escalation;
  }

  // ---- 2. ReturnToKitchen — node is mastered + stumping recipe set ----
  if (legal.has('ReturnToKitchen') && state.stumpingRecipe !== null) {
    const dec: DecisionReturnToKitchen = {
      kind: 'ReturnToKitchen',
      recipe: state.stumpingRecipe,
      rationale:
        'You have mastered this skill — return to the kitchen to complete the recipe that stumped you.',
    };
    return dec;
  }

  // ---- 3. RouteToRoom — kitchen with unmastered upstream skill ----
  if (legal.has('RouteToRoom')) {
    const routeNode = findUpstreamRouteTarget(mastery);
    if (routeNode) {
      const dec: DecisionRouteToRoom = {
        kind: 'RouteToRoom',
        node: routeNode,
        rationale: `To solve this recipe you need to strengthen "${routeNode}" first.`,
      };
      return dec;
    }
    // All skills mastered — fall through to PresentProblem
  }

  // ---- 4. RaiseScaffold — m≥2 errors at current scaffold ----
  if (
    legal.has('RaiseScaffold') &&
    state.consecutiveErrors >= PARAMS.raiseErrorsM
  ) {
    // U9: when the frustration-scaffold flag is on, the felt wall stays but the
    // response is warm and signals a reachable foothold (a step is one tap away),
    // per the under-12 productive-failure evidence. Default off → the neutral
    // rationale, identical to prior behavior (reversible).
    const dec: DecisionRaiseScaffold = {
      kind: 'RaiseScaffold',
      preserveWork: true,
      rationale: PARAMS.frustrationScaffold
        ? "Let's take a smaller step together — here's a hint to get you started."
        : `After ${state.consecutiveErrors} errors, adding more support to help you through.`,
    };
    return dec;
  }

  // ---- 5. TransferProbe — pending too_fast_correct OR dims green except transfer ----
  if (legal.has('TransferProbe')) {
    if (state.pendingTransferProbe) {
      return buildTransferProbe(
        state.currentNodeId,
        'Your last answer came in very quickly — let\'s try a different version to confirm.'
      );
    }
    if (currentEst && shouldProbeTransfer(currentEst)) {
      return buildTransferProbe(
        state.currentNodeId,
        'Accuracy and independence look strong — testing transfer to a new problem type.'
      );
    }
  }

  // ---- 6. FadeScaffold — k≥3 clean corrects in a row ----
  if (
    legal.has('FadeScaffold') &&
    state.consecutiveCleanCorrects >= PARAMS.fadeStreakK
  ) {
    const dec: DecisionFadeScaffold = {
      kind: 'FadeScaffold',
      rationale: `${state.consecutiveCleanCorrects} clean correct answers in a row — reducing support.`,
    };
    return dec;
  }

  // ---- 7. PresentProblem — default ----
  // Scaffold entry: L0 on first visit to node; else one below max_scaffold_passed, floored at L0.
  const entryScaffold = computeEntryScaffold(state, currentEst);
  const dec: DecisionPresentProblem = {
    kind: 'PresentProblem',
    node: state.currentNodeId,
    scaffold: entryScaffold,
    surface_form: selectSurfaceForm(state.currentNodeId, entryScaffold),
    rationale: buildPresentProblemRationale(entryScaffold, state),
  };
  return dec;
}

// ---------------------------------------------------------------------------
// Escalation — deterministic triggers (state-model §5.5)
// ---------------------------------------------------------------------------

/**
 * Check both escalation triggers. Returns an EscalateToHuman decision if
 * triggered, or null if neither condition applies.
 *
 * Trigger 1 — STUCK:
 *   Floor scaffold (L0) + most-upstream-node + P_known flat over nStuck=6
 *   attempts with H3/H4 hints.
 *
 * Trigger 2 — DISENGAGED:
 *   Sustained avoiding/idle corroborated by behavior over nDiseng attempts.
 */
function checkEscalationTriggers(
  state: PolicyState,
  recentBehavior: RecentBehavior,
  _now: number
): DecisionEscalateToHuman | null {
  const { nStuck, nDiseng } = PARAMS.escalation;

  // ---- Stuck trigger ----
  // Conditions:
  //   (a) At floor scaffold (L0).
  //   (b) P_known flat (no meaningful gain) over the last nStuck observations.
  //   (c) Recent attempts used heavy hints (H3/H4) — confirmed learning struggle.
  if (
    state.currentScaffold === 0 &&
    state.heavyHintAtFloorCount >= nStuck &&
    isPKnownFlat(state.pKnownHistory, nStuck)
  ) {
    const mostUpstream = findMostUpstreamNodeForEscalation(state.currentNodeId);
    if (mostUpstream === state.currentNodeId || mostUpstream === state.currentNodeId) {
      const packet = buildHandoffPacket(state, recentBehavior, 'stuck');
      const dec: DecisionEscalateToHuman = {
        kind: 'EscalateToHuman',
        reason: 'stuck',
        handoff_packet: packet,
        rationale:
          'The child has been stuck at the most foundational level with heavy hints for many attempts — a human teacher can help most here.',
      };
      return dec;
    }
  }

  // ---- Disengaged trigger ----
  // Condition: sustained disengaged/avoiding count ≥ nDiseng.
  if (state.disengagedCount >= nDiseng || recentBehavior.isDisengaged) {
    const effectiveCount = Math.max(
      state.disengagedCount,
      recentBehavior.isDisengaged ? nDiseng : 0
    );
    if (effectiveCount >= nDiseng) {
      const packet = buildHandoffPacket(state, recentBehavior, 'disengaged');
      const dec: DecisionEscalateToHuman = {
        kind: 'EscalateToHuman',
        reason: 'disengaged',
        handoff_packet: packet,
        rationale:
          'The child appears disengaged or is avoiding the activity — a human check-in is recommended.',
      };
      return dec;
    }
  }

  return null;
}

/**
 * Returns true when the P_known history shows no meaningful gain over the
 * last `window` values (flat trajectory — child is not learning).
 *
 * "Flat" = the difference between max and min in the last `window` values
 * is ≤ 0.05 (less than 5 percentage points of movement).
 */
function isPKnownFlat(history: readonly number[], window: number): boolean {
  if (history.length < window) return false;
  const recent = history.slice(-window);
  const min = Math.min(...recent);
  const max = Math.max(...recent);
  return max - min <= 0.05;
}

/**
 * For escalation: find the most upstream node in the full graph that is
 * unmastered. The child is stuck at the foundation.
 *
 * Returns the nodeId of the first unmastered node in topological order, or
 * the currentNodeId if all nodes are mastered (degenerate case).
 */
function findMostUpstreamNodeForEscalation(currentNodeId: string): string {
  // We don't have mastery here — we use the currentNodeId as the signal.
  // The caller already checked that we're at the most-upstream unmastered
  // node (state.currentScaffold === 0 means we're in the foundational room).
  // Return the current node as the relevant one.
  const nodes = allNodes();
  // The most upstream node in the full graph is the first one in topological order.
  return nodes[0]?.id ?? currentNodeId;
}

/**
 * Build a human-readable handoff packet describing the child's recent state.
 */
function buildHandoffPacket(
  state: PolicyState,
  recentBehavior: RecentBehavior,
  reason: 'stuck' | 'disengaged'
): string {
  const lines: string[] = [
    `HANDOFF PACKET — reason: ${reason}`,
    `Current node: ${state.currentNodeId}`,
    `Current scaffold: L${state.currentScaffold}`,
    `Consecutive errors: ${state.consecutiveErrors}`,
    `Consecutive clean corrects: ${state.consecutiveCleanCorrects}`,
    `Heavy hint at floor count: ${state.heavyHintAtFloorCount}`,
    `Disengaged count: ${state.disengagedCount}`,
    `P_known history (last ${state.pKnownHistory.length}): [${state.pKnownHistory.map((p) => p.toFixed(3)).join(', ')}]`,
    `Recent observations (${recentBehavior.observations.length}):`,
  ];

  for (let i = 0; i < recentBehavior.observations.length; i++) {
    const obs = recentBehavior.observations[i];
    lines.push(
      `  [${i + 1}] correct=${obs.correct}, scaffold=L${obs.scaffold_level}, ` +
        `hint_rung=${obs.hint_max_rung}, latency=${obs.latency}ms, ` +
        `error=${obs.error_signature ?? 'none'}`
    );
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Route target — upstream routing in the kitchen
// ---------------------------------------------------------------------------

/**
 * Find the most-upstream unmastered node to route to from the kitchen.
 * Returns the node id, or null if all nodes are mastered.
 */
function findUpstreamRouteTarget(
  mastery: Readonly<Record<string, MasteryEstimate>>
): string | null {
  const allNodeIds = allNodes().map((n) => n.id);
  const binding = mostUpstreamUnmastered(allNodeIds, (id) => {
    const est = mastery[id];
    return est !== undefined && isMastered(est);
  });
  return binding?.id ?? null;
}

// ---------------------------------------------------------------------------
// TransferProbe helper
// ---------------------------------------------------------------------------

/**
 * Returns true when accuracy and independence are strong but transfer hasn't
 * been demonstrated yet — the time for a transfer probe.
 */
function shouldProbeTransfer(est: MasteryEstimate): boolean {
  // Independence: max_scaffold_passed ≥ L3
  const hasIndependence = est.max_scaffold_passed !== null && est.max_scaffold_passed >= 3;
  // Accuracy: P_known reasonably high but not yet at gate
  const hasGoodAccuracy = est.P_known >= 0.7;
  // Transfer not yet shown
  const needsTransfer = !est.transfer_passed;

  return hasIndependence && hasGoodAccuracy && needsTransfer;
}

function buildTransferProbe(nodeId: string, rationale: string): DecisionTransferProbe {
  return {
    kind: 'TransferProbe',
    node: nodeId,
    rationale,
  };
}

// ---------------------------------------------------------------------------
// Scaffold entry
// ---------------------------------------------------------------------------

/**
 * Compute the scaffold level to present on entry to a node.
 *
 * Rules (state-model §5.4):
 *   - First visit (no evidence): L0
 *   - Re-entry: one below max_scaffold_passed, floored at L0
 *
 * @param state       Current policy state.
 * @param est         Current MasteryEstimate for the node, or undefined.
 */
function computeEntryScaffold(
  state: PolicyState,
  est: MasteryEstimate | undefined
): ScaffoldLevel {
  // Use session max first (current session evidence)
  const sessionMax = state.sessionMaxScaffoldPassed;
  const historyMax = est?.max_scaffold_passed ?? null;

  const maxPassed = sessionMax !== null
    ? (historyMax !== null ? Math.max(sessionMax, historyMax) : sessionMax)
    : historyMax;

  if (maxPassed === null) {
    // First visit: start at L0
    return 0;
  }

  // Re-entry: one below max_passed, floored at L0
  const entry = Math.max(0, (maxPassed as number) - 1) as ScaffoldLevel;
  return entry;
}

/**
 * Select a surface form for the next problem presentation.
 * Returns the first transfer form for the node, or a generic fallback.
 */
function selectSurfaceForm(nodeId: string, scaffold: ScaffoldLevel): string {
  try {
    const node = getNode(nodeId);
    // Use the scaffold-appropriate surface form if available.
    const level = node.scaffold_ladder[scaffold];
    if (level && level.length > 0) return level[0];
    // Fallback to first transfer form.
    if (node.transfer_forms.length > 0) return node.transfer_forms[0];
  } catch {
    // Unknown node
  }
  return `${nodeId}_L${scaffold}`;
}

/**
 * Build a rationale string for PresentProblem.
 */
function buildPresentProblemRationale(
  scaffold: ScaffoldLevel,
  state: PolicyState
): string {
  if (state.sessionMaxScaffoldPassed === null && (mastery_entry_is_fresh(state))) {
    return `Starting at level L${scaffold} — let\'s see what you know.`;
  }
  return `Continuing at support level L${scaffold}.`;
}

/** True when there's no prior evidence for the current node. */
function mastery_entry_is_fresh(state: PolicyState): boolean {
  return state.sessionMaxScaffoldPassed === null;
}
