// test_policy.test.ts — U8: Deterministic policy tests.
//
// Test scenarios (from the plan U8):
//   1. 3 clean corrects (in-band, hint-free) → FadeScaffold.
//   2. A hinted correct breaks the fade streak.
//   3. 2 errors → RaiseScaffold (preserveWork = true).
//   4. Dimensions green except transfer → TransferProbe.
//   5. Gate passes → ReturnToKitchen{recipe} for the stumping recipe.
//   6. Re-entry starts one level below max_scaffold_passed, floored at L0.
//   7. Every returned Decision includes a non-empty rationale string.
//   8. nextDecision emits only moves present in legalMoves (no illegal move).
//   9. Escalation: stuck profile (floor scaffold, no P_known gain, H4 hints)
//      → EscalateToHuman{reason:"stuck"} with populated handoff_packet.
//  10. Normal-but-slow profile does NOT escalate (false-escalation guard).
//  11. Disengaged profile → EscalateToHuman{reason:"disengaged"}.
//  12. There is no code path that emits a Decision with kind "DeclareMastered" (R9).
//  13. legalMoves returns only valid moves for the given state.

import { describe, it, expect, afterEach } from 'vitest';
import { legalMoves, nextDecision } from '../../src/engine/policy.js';
import type { PolicyState, RecentBehavior } from '../../src/engine/policy.js';
import type { MasteryEstimate, Observation } from '../../src/engine/types.js';
import { PARAMS } from '../../src/engine/params.js';

// ---------------------------------------------------------------------------
// Helpers — build state and mastery objects
// ---------------------------------------------------------------------------

/** Build a baseline "in-lesson" policy state with sensible defaults. */
function baseState(overrides: Partial<PolicyState> = {}): PolicyState {
  return {
    currentNodeId: 'ADD_SAME_DEN',
    currentScaffold: 2,
    stumpingRecipe: null,
    inKitchen: false,
    sessionMaxScaffoldPassed: null,
    consecutiveErrors: 0,
    consecutiveCleanCorrects: 0,
    pendingTransferProbe: false,
    pKnownHistory: [],
    heavyHintAtFloorCount: 0,
    disengagedCount: 0,
    disengagedScaffoldCount: 0,
    ...overrides,
  };
}

/** Build a passing (mastered) MasteryEstimate. */
function masteredEst(): MasteryEstimate {
  return {
    P_known: 0.97,
    fluency_stats: { median_latency: 4000, slope: -10, n: 8 },
    max_scaffold_passed: 3,
    transfer_passed: true,
    hint_dependence: 0,
    last_retention_probe: null,
  };
}

/** Build a weak (not mastered) MasteryEstimate. */
function weakEst(P_known = 0.3): MasteryEstimate {
  return {
    P_known,
    fluency_stats: { median_latency: null, slope: null, n: 1 },
    max_scaffold_passed: 1,
    transfer_passed: false,
    hint_dependence: 0,
    last_retention_probe: null,
  };
}

/** Build a "near mastery" estimate: accuracy + independence green, but no transfer yet. */
function nearMasteryEst(): MasteryEstimate {
  return {
    P_known: 0.82,
    fluency_stats: { median_latency: 4000, slope: -10, n: 6 },
    max_scaffold_passed: 3,
    transfer_passed: false,
    hint_dependence: 0,
    last_retention_probe: null,
  };
}

/** Build a minimal correct Observation. */
function correctObs(opts: Partial<Observation> = {}): Observation {
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
    ...opts,
  };
}

/** Minimal empty recent-behavior. */
function emptyBehavior(observations: Observation[] = []): RecentBehavior {
  return {
    observations,
    isDisengaged: false,
  };
}

/** All nodes' mastery: all weak. Includes the multiplication strand (plan 006). */
function allWeakMastery(): Record<string, MasteryEstimate> {
  return {
    MULT_EQUAL_GROUPS: weakEst(0.2),
    MULT_ARRAYS: weakEst(0.2),
    MULT_FACTS: weakEst(0.2),
    ADD_SAME_DEN: weakEst(0.3),
    ADD_UNLIKE_NESTED: weakEst(0.2),
    ADD_UNLIKE_COPRIME: weakEst(0.2),
    SIMPLIFY: weakEst(0.2),
    IMPROPER_TO_MIXED: weakEst(0.2),
  };
}

/**
 * Mastery where the whole multiplication strand is mastered but the fraction
 * strand is weak — i.e. the upstream foundations are done, so RouteToRoom /
 * upstream walks resolve to the first unmastered FRACTION node.
 */
function multMasteredFractionsWeak(): Record<string, MasteryEstimate> {
  return {
    ...allWeakMastery(),
    MULT_EQUAL_GROUPS: masteredEst(),
    MULT_ARRAYS: masteredEst(),
    MULT_FACTS: masteredEst(),
  };
}

/** All nodes' mastery: all mastered. Includes the multiplication strand. */
function allMasteredMastery(): Record<string, MasteryEstimate> {
  return {
    MULT_EQUAL_GROUPS: masteredEst(),
    MULT_ARRAYS: masteredEst(),
    MULT_FACTS: masteredEst(),
    ADD_SAME_DEN: masteredEst(),
    ADD_UNLIKE_NESTED: masteredEst(),
    ADD_UNLIKE_COPRIME: masteredEst(),
    SIMPLIFY: masteredEst(),
    IMPROPER_TO_MIXED: masteredEst(),
  };
}

const NOW = 1_700_000_000_000; // arbitrary fixed "now"

// ---------------------------------------------------------------------------
// 1. FadeScaffold after 3 clean corrects
// ---------------------------------------------------------------------------

describe('nextDecision — FadeScaffold', () => {
  it('3 consecutive clean corrects → FadeScaffold', () => {
    const state = baseState({
      currentScaffold: 2,
      consecutiveCleanCorrects: PARAMS.fadeStreakK, // 3
      consecutiveErrors: 0,
    });
    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    expect(decision.kind).toBe('FadeScaffold');
  });

  it('only 2 clean corrects → NOT FadeScaffold (no streak yet)', () => {
    const state = baseState({
      currentScaffold: 2,
      consecutiveCleanCorrects: 2,
      consecutiveErrors: 0,
    });
    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    expect(decision.kind).not.toBe('FadeScaffold');
  });

  it('FadeScaffold not returned when already at L4 (max scaffold — no room to fade)', () => {
    const state = baseState({
      currentScaffold: 4,
      consecutiveCleanCorrects: PARAMS.fadeStreakK,
    });
    const legal = legalMoves(state, allWeakMastery());
    // At L4 there's no higher scaffold — FadeScaffold should NOT be in legal moves
    expect(legal).not.toContain('FadeScaffold');
    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    expect(decision.kind).not.toBe('FadeScaffold');
  });
});

// ---------------------------------------------------------------------------
// 2. Hinted correct breaks the fade streak (test through legalMoves / state)
// ---------------------------------------------------------------------------

describe('nextDecision — hinted correct breaks streak', () => {
  it('streak=0 after a hinted attempt → no FadeScaffold', () => {
    // The hint check happens in the runtime (it resets consecutiveCleanCorrects).
    // From the policy's perspective, if consecutiveCleanCorrects < fadeStreakK,
    // FadeScaffold is not chosen.
    const state = baseState({
      currentScaffold: 2,
      consecutiveCleanCorrects: 1, // hinted attempt reset the streak
      consecutiveErrors: 0,
    });
    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    expect(decision.kind).not.toBe('FadeScaffold');
  });
});

// ---------------------------------------------------------------------------
// 3. RaiseScaffold after m≥2 errors
// ---------------------------------------------------------------------------

describe('nextDecision — RaiseScaffold', () => {
  it('2 consecutive errors at L2 → RaiseScaffold', () => {
    const state = baseState({
      currentScaffold: 2,
      consecutiveErrors: PARAMS.raiseErrorsM, // 2
      consecutiveCleanCorrects: 0,
    });
    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    expect(decision.kind).toBe('RaiseScaffold');
  });

  it('RaiseScaffold always has preserveWork === true', () => {
    const state = baseState({
      currentScaffold: 2,
      consecutiveErrors: PARAMS.raiseErrorsM,
    });
    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    expect(decision.kind).toBe('RaiseScaffold');
    if (decision.kind === 'RaiseScaffold') {
      expect(decision.preserveWork).toBe(true);
    }
  });

  it('RaiseScaffold not returned when at floor (L0) — no room to raise', () => {
    const state = baseState({
      currentScaffold: 0,
      consecutiveErrors: PARAMS.raiseErrorsM + 5,
    });
    const legal = legalMoves(state, allWeakMastery());
    expect(legal).not.toContain('RaiseScaffold');
  });

  it('only 1 error → NOT RaiseScaffold', () => {
    const state = baseState({
      currentScaffold: 2,
      consecutiveErrors: 1,
    });
    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    expect(decision.kind).not.toBe('RaiseScaffold');
  });
});

// ---------------------------------------------------------------------------
// 4. TransferProbe when other dims green but transfer isn't
// ---------------------------------------------------------------------------

describe('nextDecision — TransferProbe', () => {
  it('near-mastery estimate (accuracy+independence green, no transfer) → TransferProbe', () => {
    const mastery = {
      ...allWeakMastery(),
      ADD_SAME_DEN: nearMasteryEst(),
    };
    const state = baseState({
      currentNodeId: 'ADD_SAME_DEN',
      currentScaffold: 3,
      consecutiveErrors: 0,
      consecutiveCleanCorrects: 0,
    });
    const decision = nextDecision(state, mastery, emptyBehavior(), NOW);
    expect(decision.kind).toBe('TransferProbe');
  });

  it('pendingTransferProbe=true → TransferProbe immediately', () => {
    const state = baseState({
      currentNodeId: 'ADD_SAME_DEN',
      currentScaffold: 2,
      pendingTransferProbe: true,
    });
    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    expect(decision.kind).toBe('TransferProbe');
  });

  it('TransferProbe decision carries the current nodeId', () => {
    const state = baseState({
      currentNodeId: 'ADD_SAME_DEN',
      pendingTransferProbe: true,
    });
    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    if (decision.kind === 'TransferProbe') {
      expect(decision.node).toBe('ADD_SAME_DEN');
    }
  });
});

// ---------------------------------------------------------------------------
// 5. ReturnToKitchen on mastery
// ---------------------------------------------------------------------------

describe('nextDecision — ReturnToKitchen', () => {
  it('node mastered + stumpingRecipe set → ReturnToKitchen', () => {
    const mastery = {
      ...allWeakMastery(),
      ADD_SAME_DEN: masteredEst(),
    };
    const state = baseState({
      currentNodeId: 'ADD_SAME_DEN',
      stumpingRecipe: 'recipe_7',
      inKitchen: false,
    });
    const decision = nextDecision(state, mastery, emptyBehavior(), NOW);
    expect(decision.kind).toBe('ReturnToKitchen');
    if (decision.kind === 'ReturnToKitchen') {
      expect(decision.recipe).toBe('recipe_7');
    }
  });

  it('ReturnToKitchen not in legal moves when in kitchen', () => {
    const mastery = { ...allWeakMastery(), ADD_SAME_DEN: masteredEst() };
    const state = baseState({
      currentNodeId: 'ADD_SAME_DEN',
      stumpingRecipe: 'recipe_7',
      inKitchen: true, // in kitchen → not legal
    });
    const legal = legalMoves(state, mastery);
    expect(legal).not.toContain('ReturnToKitchen');
  });

  it('ReturnToKitchen not returned when node not mastered', () => {
    const state = baseState({
      currentNodeId: 'ADD_SAME_DEN',
      stumpingRecipe: 'recipe_7',
      inKitchen: false,
    });
    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    expect(decision.kind).not.toBe('ReturnToKitchen');
  });
});

// ---------------------------------------------------------------------------
// 6. Scaffold entry: one below max_scaffold_passed, floored at L0
// ---------------------------------------------------------------------------

describe('nextDecision — scaffold entry', () => {
  it('first visit (no history) → PresentProblem at L0', () => {
    const state = baseState({
      currentScaffold: 0,
      sessionMaxScaffoldPassed: null,
      consecutiveErrors: 0,
      consecutiveCleanCorrects: 0,
    });
    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    expect(decision.kind).toBe('PresentProblem');
    if (decision.kind === 'PresentProblem') {
      expect(decision.scaffold).toBe(0);
    }
  });

  it('re-entry with max_scaffold_passed=3 → PresentProblem at L2', () => {
    const state = baseState({
      currentScaffold: 0,
      sessionMaxScaffoldPassed: 3, // passed L3 → entry at L2
      consecutiveErrors: 0,
      consecutiveCleanCorrects: 0,
    });
    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    expect(decision.kind).toBe('PresentProblem');
    if (decision.kind === 'PresentProblem') {
      expect(decision.scaffold).toBe(2); // 3 - 1 = 2
    }
  });

  it('re-entry with max_scaffold_passed=0 → floored at L0', () => {
    const state = baseState({
      currentScaffold: 0,
      sessionMaxScaffoldPassed: 0, // max=0 → 0-1 = -1 → floored at 0
      consecutiveErrors: 0,
      consecutiveCleanCorrects: 0,
    });
    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    if (decision.kind === 'PresentProblem') {
      expect(decision.scaffold).toBe(0);
    }
  });

  it('max_scaffold_passed from estimate used when session has no evidence', () => {
    const mastery = {
      ...allWeakMastery(),
      ADD_SAME_DEN: { ...weakEst(), max_scaffold_passed: 2 as const },
    };
    const state = baseState({
      currentScaffold: 0,
      sessionMaxScaffoldPassed: null, // no session history
      consecutiveErrors: 0,
      consecutiveCleanCorrects: 0,
    });
    const decision = nextDecision(state, mastery, emptyBehavior(), NOW);
    if (decision.kind === 'PresentProblem') {
      // Entry should be one below estimate's max_scaffold_passed = 2 → L1
      expect(decision.scaffold).toBe(1);
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Every Decision has a non-empty rationale
// ---------------------------------------------------------------------------

describe('nextDecision — non-empty rationale', () => {
  const scenarios: Array<{ name: string; state: Partial<PolicyState>; mastery?: Record<string, MasteryEstimate> }> = [
    {
      name: 'FadeScaffold',
      state: { currentScaffold: 2, consecutiveCleanCorrects: PARAMS.fadeStreakK },
    },
    {
      name: 'RaiseScaffold',
      state: { currentScaffold: 2, consecutiveErrors: PARAMS.raiseErrorsM },
    },
    {
      name: 'TransferProbe',
      state: { currentScaffold: 2, pendingTransferProbe: true },
    },
    {
      name: 'ReturnToKitchen',
      state: { currentScaffold: 3, stumpingRecipe: 'r1', inKitchen: false },
      mastery: { ...allWeakMastery(), ADD_SAME_DEN: masteredEst() },
    },
    {
      name: 'PresentProblem (default)',
      state: {},
    },
  ];

  for (const sc of scenarios) {
    it(`${sc.name} → rationale is non-empty string`, () => {
      const state = baseState(sc.state);
      const mastery = sc.mastery ?? allWeakMastery();
      const decision = nextDecision(state, mastery, emptyBehavior(), NOW);
      expect(typeof decision.rationale).toBe('string');
      expect(decision.rationale.length).toBeGreaterThan(0);
    });
  }
});

// ---------------------------------------------------------------------------
// 8. nextDecision only emits moves from legalMoves
// ---------------------------------------------------------------------------

describe('nextDecision — legal-move constraint', () => {
  it('every decision emitted by nextDecision is in legalMoves', () => {
    const testStates: PolicyState[] = [
      baseState(),
      baseState({ currentScaffold: 0, consecutiveErrors: PARAMS.raiseErrorsM }),
      baseState({ currentScaffold: 2, consecutiveCleanCorrects: PARAMS.fadeStreakK }),
      baseState({ pendingTransferProbe: true }),
      baseState({ inKitchen: true }),
      baseState({ stumpingRecipe: 'r1', inKitchen: false }, ),
    ];

    for (const state of testStates) {
      const mastery = allWeakMastery();
      const legal = new Set(legalMoves(state, mastery));
      const decision = nextDecision(state, mastery, emptyBehavior(), NOW);
      expect(legal.has(decision.kind)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 9. Escalation — stuck profile
// ---------------------------------------------------------------------------

describe('nextDecision — EscalateToHuman stuck', () => {
  it('stuck profile at floor (L0) with flat P_known + heavy hints → EscalateToHuman', () => {
    // Build a P_known history that is flat (no improvement over nStuck attempts)
    const flatHistory = new Array(PARAMS.escalation.nStuck).fill(0.15);

    const state = baseState({
      // The stuck trigger requires being at the MOST-UPSTREAM node, which is now
      // the front of the DAG (MULT_EQUAL_GROUPS) after the plan-006 strand insert.
      currentNodeId: 'MULT_EQUAL_GROUPS',
      currentScaffold: 0,              // at floor
      heavyHintAtFloorCount: PARAMS.escalation.nStuck, // H3/H4 for nStuck attempts
      pKnownHistory: flatHistory,       // flat P_known
      consecutiveErrors: 0,
      consecutiveCleanCorrects: 0,
    });

    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    expect(decision.kind).toBe('EscalateToHuman');
    if (decision.kind === 'EscalateToHuman') {
      expect(decision.reason).toBe('stuck');
    }
  });

  it('EscalateToHuman (stuck) has a populated handoff_packet', () => {
    const flatHistory = new Array(PARAMS.escalation.nStuck).fill(0.15);
    const state = baseState({
      currentNodeId: 'MULT_EQUAL_GROUPS', // most-upstream node (stuck-trigger requirement)
      currentScaffold: 0,
      heavyHintAtFloorCount: PARAMS.escalation.nStuck,
      pKnownHistory: flatHistory,
    });
    // T30: escalationCompetenceGuard is now default-ON, so a genuinely-stuck learner
    // must present a LOW competence signal (flat-low P_known AND not-all-correct recent
    // attempts) to still escalate. The handoff-packet shape assertion is unchanged; only
    // the observation stream is made consistent with a genuinely-stuck (failing) learner
    // — previously two all-correct obs (incidental to this packet-shape test) would now
    // trip the succeeding-plateau guard and suppress the escalation (covered by the T27
    // block below).
    const obs = [correctObs({ correct: false }), correctObs({ correct: false })];
    const decision = nextDecision(
      state,
      allWeakMastery(),
      { observations: obs, isDisengaged: false },
      NOW
    );
    expect(decision.kind).toBe('EscalateToHuman');
    if (decision.kind === 'EscalateToHuman') {
      expect(decision.handoff_packet.length).toBeGreaterThan(10);
      expect(decision.handoff_packet).toContain('stuck');
    }
  });

  it('stuck with short P_known history (< nStuck) → NOT escalated', () => {
    // Only 3 history points vs nStuck=6 → too few to confirm stuck
    const state = baseState({
      currentScaffold: 0,
      heavyHintAtFloorCount: PARAMS.escalation.nStuck,
      pKnownHistory: [0.15, 0.15, 0.15], // only 3 entries
    });
    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    expect(decision.kind).not.toBe('EscalateToHuman');
  });
});

// ---------------------------------------------------------------------------
// 10. False-escalation guard — normal-but-slow does NOT escalate
// ---------------------------------------------------------------------------

describe('nextDecision — false-escalation guard', () => {
  it('normal-but-slow profile does NOT escalate', () => {
    // Slow but improving P_known: not flat
    const improvingHistory = [0.10, 0.15, 0.20, 0.28, 0.35, 0.42];

    const state = baseState({
      currentScaffold: 1,          // not at floor
      heavyHintAtFloorCount: 2,    // low hint count
      pKnownHistory: improvingHistory,
      consecutiveErrors: 0,
      consecutiveCleanCorrects: 2,
      disengagedCount: 0,
    });

    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    expect(decision.kind).not.toBe('EscalateToHuman');
  });

  it('slow progress but P_known is improving → no escalation', () => {
    // Improving P_known — not flat
    const history = [0.10, 0.12, 0.16, 0.22, 0.30, 0.35];
    const state = baseState({
      currentScaffold: 0,
      heavyHintAtFloorCount: PARAMS.escalation.nStuck,
      pKnownHistory: history, // improving, not flat
      disengagedCount: 0,
    });
    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    expect(decision.kind).not.toBe('EscalateToHuman');
  });

  it('at floor but insufficient heavy-hint count → no escalation', () => {
    const flatHistory = new Array(PARAMS.escalation.nStuck).fill(0.15);
    const state = baseState({
      currentScaffold: 0,
      heavyHintAtFloorCount: 2, // < nStuck (6)
      pKnownHistory: flatHistory,
      disengagedCount: 0,
    });
    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    expect(decision.kind).not.toBe('EscalateToHuman');
  });
});

// ---------------------------------------------------------------------------
// T27. Escalation competence-guard — a heavy-hint-but-SUCCEEDING learner is NOT
// escalated; a genuinely-stuck (low-accuracy) learner still escalates.
//
// Verdict-card #74: an over-hinter on MULT_EQUAL_GROUPS at GENUINE mastery
// (latent 0.9314) was escalated to a human because the stuck trigger read heavy
// hints + a flat P_known trajectory as distress — WITHOUT checking whether the
// learner was actually succeeding. The competence-guard (PARAMS.escalationCompetenceGuard,
// default-off, reversible) gates the stuck trigger on LOW recent accuracy / low
// P_known, so a flat-AT-CEILING plateau is nudged (Tier-2), not escalated.
// ---------------------------------------------------------------------------

describe('nextDecision — T27 escalation competence-guard', () => {
  // T30 flipped escalationCompetenceGuard DEFAULT-ON, so restore to the true default
  // (true) after each case that mutates it — not to the pre-T30 false.
  afterEach(() => {
    (PARAMS as any).escalationCompetenceGuard = true;
  });

  /** The over-hinter at genuine mastery: floor + heavy hints + flat P_known,
   *  but the plateau sits NEAR THE CEILING (latent 0.9314 → P_known ≈ 0.93). */
  function succeedingOverHinterState(): PolicyState {
    const flatHighHistory = new Array(PARAMS.escalation.nStuck).fill(0.9314);
    return baseState({
      currentNodeId: 'MULT_EQUAL_GROUPS', // most-upstream node (stuck-trigger requirement)
      currentScaffold: 0,                 // at floor
      heavyHintAtFloorCount: PARAMS.escalation.nStuck, // over-hinting
      pKnownHistory: flatHighHistory,     // flat — but flat at the CEILING
      consecutiveErrors: 0,
      consecutiveCleanCorrects: 2,
    });
  }

  it('succeeding over-hinter (high P_known, flat at ceiling) with guard ON → NOT escalated (nudged instead)', () => {
    (PARAMS as any).escalationCompetenceGuard = true;
    const decision = nextDecision(
      succeedingOverHinterState(),
      allWeakMastery(),
      emptyBehavior(),
      NOW
    );
    expect(decision.kind).not.toBe('EscalateToHuman');
  });

  it('genuinely-stuck learner (low P_known, flat at floor) with guard ON → STILL escalates (stuck)', () => {
    (PARAMS as any).escalationCompetenceGuard = true;
    const flatLowHistory = new Array(PARAMS.escalation.nStuck).fill(0.15);
    const state = baseState({
      currentNodeId: 'MULT_EQUAL_GROUPS',
      currentScaffold: 0,
      heavyHintAtFloorCount: PARAMS.escalation.nStuck,
      pKnownHistory: flatLowHistory, // flat AND low — genuinely stuck
    });
    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    expect(decision.kind).toBe('EscalateToHuman');
    if (decision.kind === 'EscalateToHuman') {
      expect(decision.reason).toBe('stuck');
    }
  });

  it('REVERSIBLE: with guard explicitly OFF the succeeding over-hinter escalates (pre-T27 rollback path)', () => {
    // T30 flipped the guard DEFAULT-ON, so this case sets it OFF explicitly to document
    // the rollback: with the guard off, behavior is byte-identical to the pre-T27 bug
    // (the succeeding over-hinter is escalated), proving the change is reversible.
    (PARAMS as any).escalationCompetenceGuard = false;
    const decision = nextDecision(
      succeedingOverHinterState(),
      allWeakMastery(),
      emptyBehavior(),
      NOW
    );
    expect(decision.kind).toBe('EscalateToHuman');
  });

  it('guard ON + all-correct recent attempts (even without a ceiling plateau) → NOT escalated', () => {
    (PARAMS as any).escalationCompetenceGuard = true;
    // Flat-low P_known would normally escalate, but every recent attempt is correct
    // → the learner is succeeding (over-hinting), so the accuracy signal spares them.
    const flatLowHistory = new Array(PARAMS.escalation.nStuck).fill(0.15);
    const state = baseState({
      currentNodeId: 'MULT_EQUAL_GROUPS',
      currentScaffold: 0,
      heavyHintAtFloorCount: PARAMS.escalation.nStuck,
      pKnownHistory: flatLowHistory,
    });
    const behavior: RecentBehavior = {
      observations: [correctObs(), correctObs(), correctObs()],
      isDisengaged: false,
    };
    const decision = nextDecision(state, allWeakMastery(), behavior, NOW);
    expect(decision.kind).not.toBe('EscalateToHuman');
  });
});

// ---------------------------------------------------------------------------
// 11. Disengaged trigger
// ---------------------------------------------------------------------------

describe('nextDecision — EscalateToHuman disengaged', () => {
  it('sustained disengaged count ≥ nDiseng → EscalateToHuman disengaged', () => {
    const state = baseState({
      currentScaffold: 2,
      disengagedCount: PARAMS.escalation.nDiseng, // ≥ threshold
      consecutiveErrors: 0,
      pKnownHistory: [0.3, 0.31, 0.29], // not stuck (short history)
    });
    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    expect(decision.kind).toBe('EscalateToHuman');
    if (decision.kind === 'EscalateToHuman') {
      expect(decision.reason).toBe('disengaged');
    }
  });

  it('isDisengaged=true in behavior + nDiseng threshold → EscalateToHuman', () => {
    const state = baseState({
      currentScaffold: 2,
      disengagedCount: 0,  // counter is 0 but behavior flag is set
    });
    const behavior: RecentBehavior = {
      observations: [],
      isDisengaged: true,
    };
    // isDisengaged=true alone doesn't trigger unless it reaches nDiseng
    // (per the policy: effectiveCount = max(state.disengagedCount, isDisengaged ? nDiseng : 0))
    const decision = nextDecision(state, allWeakMastery(), behavior, NOW);
    // isDisengaged=true pushes effectiveCount to nDiseng → triggers escalation
    expect(decision.kind).toBe('EscalateToHuman');
    if (decision.kind === 'EscalateToHuman') {
      expect(decision.reason).toBe('disengaged');
    }
  });
});

// ---------------------------------------------------------------------------
// 12. No DeclareMastered in the Decision union (R9)
// ---------------------------------------------------------------------------

describe('policy — no DeclareMastered', () => {
  it('no Decision kind is "DeclareMastered" across all scenarios', () => {
    const states: PolicyState[] = [
      baseState(),
      baseState({ currentScaffold: 0, consecutiveErrors: PARAMS.raiseErrorsM }),
      baseState({ currentScaffold: 2, consecutiveCleanCorrects: PARAMS.fadeStreakK }),
      baseState({ pendingTransferProbe: true }),
      baseState({ inKitchen: true }),
      baseState({ stumpingRecipe: 'r1' }),
      baseState({ currentScaffold: 0, heavyHintAtFloorCount: PARAMS.escalation.nStuck,
                   pKnownHistory: new Array(PARAMS.escalation.nStuck).fill(0.15) }),
    ];
    const masteries = [allWeakMastery(), allMasteredMastery()];

    for (const state of states) {
      for (const mastery of masteries) {
        const decision = nextDecision(state, mastery, emptyBehavior(), NOW);
        expect(decision.kind).not.toBe('DeclareMastered');
      }
    }
  });

  it('legalMoves never contains "DeclareMastered"', () => {
    const states: PolicyState[] = [
      baseState(),
      baseState({ inKitchen: true }),
      baseState({ stumpingRecipe: 'r1', inKitchen: false }),
    ];
    for (const state of states) {
      const legal = legalMoves(state, allMasteredMastery());
      expect(legal).not.toContain('DeclareMastered');
    }
  });
});

// ---------------------------------------------------------------------------
// 13. legalMoves — structural tests
// ---------------------------------------------------------------------------

describe('legalMoves', () => {
  it('PresentProblem and EscalateToHuman are always present', () => {
    const states = [
      baseState(),
      baseState({ inKitchen: true }),
      baseState({ currentScaffold: 0 }),
      baseState({ currentScaffold: 4 }),
    ];
    for (const state of states) {
      const legal = legalMoves(state, allWeakMastery());
      expect(legal).toContain('PresentProblem');
      expect(legal).toContain('EscalateToHuman');
    }
  });

  it('FadeScaffold not legal at L4 (cannot go higher)', () => {
    const state = baseState({ currentScaffold: 4 });
    const legal = legalMoves(state, allWeakMastery());
    expect(legal).not.toContain('FadeScaffold');
  });

  it('RaiseScaffold not legal at L0 (already at floor)', () => {
    const state = baseState({ currentScaffold: 0 });
    const legal = legalMoves(state, allWeakMastery());
    expect(legal).not.toContain('RaiseScaffold');
  });

  it('RaiseScaffold not legal when node is mastered', () => {
    const mastery = { ...allWeakMastery(), ADD_SAME_DEN: masteredEst() };
    const state = baseState({ currentScaffold: 2 });
    const legal = legalMoves(state, mastery);
    expect(legal).not.toContain('RaiseScaffold');
  });

  it('RouteToRoom legal when in kitchen', () => {
    const state = baseState({ inKitchen: true });
    const legal = legalMoves(state, allWeakMastery());
    expect(legal).toContain('RouteToRoom');
  });

  it('RouteToRoom not legal when not in kitchen', () => {
    const state = baseState({ inKitchen: false });
    const legal = legalMoves(state, allWeakMastery());
    expect(legal).not.toContain('RouteToRoom');
  });

  it('ReturnToKitchen legal when: not in kitchen + stumpingRecipe + mastered', () => {
    const mastery = { ...allWeakMastery(), ADD_SAME_DEN: masteredEst() };
    const state = baseState({
      inKitchen: false,
      stumpingRecipe: 'recipe_5',
    });
    const legal = legalMoves(state, mastery);
    expect(legal).toContain('ReturnToKitchen');
  });

  it('ReturnToKitchen not legal when stumpingRecipe is null', () => {
    const mastery = { ...allWeakMastery(), ADD_SAME_DEN: masteredEst() };
    const state = baseState({
      inKitchen: false,
      stumpingRecipe: null,
    });
    const legal = legalMoves(state, mastery);
    expect(legal).not.toContain('ReturnToKitchen');
  });

  it('TransferProbe legal for ADD_SAME_DEN (has ≥2 transfer forms)', () => {
    const state = baseState({ currentNodeId: 'ADD_SAME_DEN' });
    const legal = legalMoves(state, allWeakMastery());
    expect(legal).toContain('TransferProbe');
  });
});

// ---------------------------------------------------------------------------
// 14. RouteToRoom decision carries the most-upstream unmastered node
// ---------------------------------------------------------------------------

describe('nextDecision — RouteToRoom', () => {
  it('in kitchen with all weak mastery → RouteToRoom to most-upstream (MULT_EQUAL_GROUPS)', () => {
    // After plan 006, the multiplication strand sits at the front of the DAG, so
    // the most-upstream unmastered node for a fresh learner is MULT_EQUAL_GROUPS.
    const state = baseState({ inKitchen: true, currentNodeId: 'MULT_EQUAL_GROUPS' });
    const decision = nextDecision(state, allWeakMastery(), emptyBehavior(), NOW);
    expect(decision.kind).toBe('RouteToRoom');
    if (decision.kind === 'RouteToRoom') {
      expect(decision.node).toBe('MULT_EQUAL_GROUPS');
    }
  });

  it('in kitchen with the multiplication strand mastered → routes to FRACTION_ON_LINE', () => {
    // Mult foundations done → the first unmastered node is the most-upstream
    // fraction node, which (after the CCSS gap-fill) is FRACTION_ON_LINE.
    const state = baseState({ inKitchen: true });
    const decision = nextDecision(state, multMasteredFractionsWeak(), emptyBehavior(), NOW);
    expect(decision.kind).toBe('RouteToRoom');
    if (decision.kind === 'RouteToRoom') {
      expect(decision.node).toBe('FRACTION_ON_LINE');
    }
  });

  it('in kitchen with everything up to ADD_UNLIKE_NESTED mastered → routes to ADD_UNLIKE_NESTED', () => {
    // Master the whole upstream fraction chain (number line, same-den, subtract,
    // compare) so the next unmastered node in teaching order is ADD_UNLIKE_NESTED.
    const mastery = {
      ...multMasteredFractionsWeak(),
      FRACTION_ON_LINE: masteredEst(),
      ADD_SAME_DEN: masteredEst(),
      SUB_SAME_DEN: masteredEst(),
      COMPARE_BENCHMARK: masteredEst(),
    };
    const state = baseState({ inKitchen: true });
    const decision = nextDecision(state, mastery, emptyBehavior(), NOW);
    expect(decision.kind).toBe('RouteToRoom');
    if (decision.kind === 'RouteToRoom') {
      expect(decision.node).toBe('ADD_UNLIKE_NESTED');
    }
  });
});
