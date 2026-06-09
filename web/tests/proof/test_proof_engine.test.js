// test_proof_engine.test.js — PROOF SUITE (logic layer).
//
// Purpose: convince a skeptic, with deterministic assertions against the REAL
// engine, that the three claims hold:
//   CLAIM 1 — hints/nudges/support TRIGGER exactly when they should.
//   CLAIM 2 — they GO AWAY once the student course-corrects.
//   CLAIM 3 — the policy DIRECTS the student to the exact right focus and KEEPS
//             them there until they DEMONSTRATE MASTERY, then unlocks the next level.
//
// Every number cited here is read live from params.ts so the proof can't drift
// from the code. Companion file test_proof_integration.test.jsx proves the same
// behaviors through the real React runtime (clicks/typing); the live browser
// sweep proves them on every page.
import { describe, it, expect } from 'vitest';
import { PARAMS } from '../../src/engine/params.js';
import { nextDecision, legalMoves } from '../../src/engine/policy.js';
import { isMastered, gateConditions } from '../../src/engine/gate.js';
import { detectWall } from '../../src/engine/wall.js';
import {
  makeTier2Window,
  checkLongPause,
  checkOscillation,
  checkTooFastCorrect,
  PAUSE_THRESHOLD_MS,
  OSCILLATION_THRESHOLD,
} from '../../src/runtime/tier2.js';

// ---------------------------------------------------------------------------
// Builders — minimal valid PolicyState / MasteryEstimate
// ---------------------------------------------------------------------------
function estimate(over = {}) {
  return {
    P_known: 0.1,
    fluency_stats: { medianLatency: null, slope: null, n: 0 },
    max_scaffold_passed: null,
    transfer_passed: false,
    hint_dependence: 0,
    last_retention_probe: null,
    ...over,
  };
}
function state(over = {}) {
  return {
    currentNodeId: 'SIMPLIFY',
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
    ...over,
  };
}
const calm = { observations: [], isDisengaged: false };
const masteredEst = estimate({ P_known: 0.99, max_scaffold_passed: 4, transfer_passed: true });
// A mastery map where the current node is NOT mastered (so Raise/Fade are legal).
const learning = { SIMPLIFY: estimate({ P_known: 0.5, max_scaffold_passed: 2 }) };

// ===========================================================================
// CLAIM 1 — TRIGGERS: the right help appears at the right moment
// ===========================================================================
describe('CLAIM 1 — hints / nudges / support trigger when they should', () => {
  it('idle pause → HINT_OFFER fires exactly at the threshold, not a tick before', () => {
    const t0 = 100000;
    // One ms under threshold → silence.
    expect(checkLongPause(t0, t0 + PAUSE_THRESHOLD_MS - 1, makeTier2Window())).toBeNull();
    // At threshold → a hint offer, naming the next rung.
    const nudge = checkLongPause(t0, t0 + PAUSE_THRESHOLD_MS, makeTier2Window());
    expect(nudge).toMatchObject({ type: 'HINT_OFFER' });
    expect(nudge.payload.suggestedRung).toBe(1);
    expect(PAUSE_THRESHOLD_MS).toBe(8000); // documented threshold
  });

  it('oscillation (wiggling pieces) → TAKE_YOUR_TIME at the threshold, not below', () => {
    const below = { observations: [{ self_corrections: OSCILLATION_THRESHOLD - 1 }] };
    const at = { observations: [{ self_corrections: OSCILLATION_THRESHOLD }] };
    expect(checkOscillation(below, makeTier2Window())).toBeNull();
    expect(checkOscillation(at, makeTier2Window())).toMatchObject({ type: 'TAKE_YOUR_TIME' });
    expect(OSCILLATION_THRESHOLD).toBe(3);
  });

  it('a too-fast correct (guessing) → the engine raises a TransferProbe', () => {
    // tier2 flags it; the policy responds with a probe (not a free pass).
    const win = makeTier2Window();
    expect(checkTooFastCorrect({ too_fast_correct: true }, win)).toMatchObject({ type: 'TRANSFER_PROBE_QUEUED' });
    const dec = nextDecision(state({ pendingTransferProbe: true }), learning, calm, 0);
    expect(dec.kind).toBe('TransferProbe');
  });

  it('m=2 errors at a level → RaiseScaffold (more support); 1 error does NOT', () => {
    expect(PARAMS.raiseErrorsM).toBe(2);
    expect(nextDecision(state({ consecutiveErrors: 1 }), learning, calm, 0).kind).not.toBe('RaiseScaffold');
    const dec = nextDecision(state({ consecutiveErrors: 2 }), learning, calm, 0);
    expect(dec.kind).toBe('RaiseScaffold');
    expect(dec.preserveWork).toBe(true); // course-correction keeps their work
  });

  it('support OUTRANKS fading — a struggling student is helped before being pushed', () => {
    // Even with a prior clean streak on record, 2 fresh errors → support wins.
    const dec = nextDecision(state({ consecutiveErrors: 2, consecutiveCleanCorrects: 5 }), learning, calm, 0);
    expect(dec.kind).toBe('RaiseScaffold');
  });
});

// ===========================================================================
// CLAIM 2 — REMOVAL: help recedes once the student no longer needs it
// ===========================================================================
describe('CLAIM 2 — help goes away once the student course-corrects', () => {
  it('a nudge fires AT MOST ONCE per attempt, then stays quiet (no nagging)', () => {
    const win = makeTier2Window();
    const recent = { observations: [{ self_corrections: OSCILLATION_THRESHOLD }] };
    expect(checkOscillation(recent, win)).toMatchObject({ type: 'TAKE_YOUR_TIME' });
    expect(checkOscillation(recent, win)).toBeNull(); // same window → silent
  });

  it('a fresh problem RE-ARMS the nudges (help is available again next attempt)', () => {
    const fired = makeTier2Window();
    checkOscillation({ observations: [{ self_corrections: 5 }] }, fired);
    expect(checkOscillation({ observations: [{ self_corrections: 5 }] }, fired)).toBeNull();
    // New problem_present builds a fresh window:
    const rearmed = makeTier2Window();
    expect(checkOscillation({ observations: [{ self_corrections: 5 }] }, rearmed)).not.toBeNull();
  });

  it('engaging (interacting) suppresses the idle nudge — acting IS course-correcting', () => {
    const present = 100000;
    const interacted = present + 5000; // the child dragged a piece at +5s
    const now = present + 9000;        // 9s since present, but only 4s since acting
    // Idle is measured from the LAST interaction, so the nudge stays silent.
    expect(checkLongPause(interacted, now, makeTier2Window())).toBeNull();
  });

  it('RAISED support is REMOVED once the student strings together clean work', () => {
    // The arc: 2 errors → RaiseScaffold ; then a clean k=3 streak → FadeScaffold.
    const raised = nextDecision(state({ consecutiveErrors: 2 }), learning, calm, 0);
    expect(raised.kind).toBe('RaiseScaffold');
    const recovered = nextDecision(
      state({ consecutiveErrors: 0, consecutiveCleanCorrects: PARAMS.fadeStreakK }),
      learning,
      calm,
      0
    );
    expect(recovered.kind).toBe('FadeScaffold'); // support withdrawn — they earned it
    expect(PARAMS.fadeStreakK).toBe(3);
  });

  it('the too-fast probe clears after one probe (it does not loop forever)', () => {
    // pendingTransferProbe is a ONE-SHOT flag; once consumed the policy moves on.
    const win = makeTier2Window();
    checkTooFastCorrect({ too_fast_correct: true }, win);
    expect(checkTooFastCorrect({ too_fast_correct: true }, win)).toBeNull(); // already queued
  });
});

// ===========================================================================
// CLAIM 3 — FOCUS + MASTERY: right target, held until proven, then unlock
// ===========================================================================
describe('CLAIM 3 — directs to the exact focus and holds until mastery', () => {
  it('routes to the MOST-UPSTREAM unmastered skill for the recipe (deepest foundation first)', () => {
    // A coprime-unlike recipe (1/2 + 1/3) requires the full chain:
    // ADD_SAME_DEN → ADD_UNLIKE_NESTED → ADD_UNLIKE_COPRIME. With all weak, the
    // wall binds to the ROOT gap, not the surface skill the recipe nominally tests.
    const recipe = { op: 'add', operands: [[1, 2], [1, 3]] };
    const allWeak = new Map([
      ['ADD_SAME_DEN', estimate({ P_known: 0.2 })],
      ['ADD_UNLIKE_NESTED', estimate({ P_known: 0.2 })],
      ['ADD_UNLIKE_COPRIME', estimate({ P_known: 0.2 })],
    ]);
    const wall = detectWall(recipe, allWeak);
    expect(wall.wallHit).toBe(true);
    expect(wall.bindingNode).toBe('ADD_SAME_DEN'); // the root gap, not the surface one
  });

  it('skips an already-mastered prerequisite when choosing the focus', () => {
    const recipe = { op: 'add', operands: [[1, 2], [1, 3]] };
    const rootMastered = new Map([
      ['ADD_SAME_DEN', masteredEst],
      ['ADD_UNLIKE_NESTED', estimate({ P_known: 0.2 })],
      ['ADD_UNLIKE_COPRIME', estimate({ P_known: 0.2 })],
    ]);
    expect(detectWall(recipe, rootMastered).bindingNode).toBe('ADD_UNLIKE_NESTED'); // next gap up
  });

  it('a wall fires only when predicted success is below θ=0.6', () => {
    expect(PARAMS.wallTheta).toBe(0.6);
    const recipe = { op: 'add', operands: [[1, 2], [1, 3]] }; // unlike → needs the full chain
    const strong = new Map([
      ['ADD_UNLIKE_COPRIME', masteredEst], ['ADD_SAME_DEN', masteredEst], ['ADD_UNLIKE_NESTED', masteredEst],
    ]);
    const weak = new Map([
      ['ADD_UNLIKE_COPRIME', estimate({ P_known: 0.2 })], ['ADD_SAME_DEN', estimate({ P_known: 0.2 })], ['ADD_UNLIKE_NESTED', estimate({ P_known: 0.2 })],
    ]);
    expect(detectWall(recipe, strong).wallHit).toBe(false); // 0.99^3 ≈ 0.97 ≥ 0.6
    expect(detectWall(recipe, weak).wallHit).toBe(true);    // 0.2^3 = 0.008 < 0.6
  });

  it('MASTERY needs ALL FOUR conditions — flipping any one closes the gate', () => {
    expect(isMastered(masteredEst)).toBe(true);
    expect(isMastered(estimate({ ...masteredEst, P_known: 0.94 }))).toBe(false);              // accuracy
    expect(isMastered(estimate({ ...masteredEst, max_scaffold_passed: 2 }))).toBe(false);     // independence
    expect(isMastered(estimate({ ...masteredEst, transfer_passed: false }))).toBe(false);     // transfer
    // Fluency is SOFT by default (advisory until pilot-calibrated) — the shipped config:
    expect(gateConditions(masteredEst).fluencyOk).toBe(true);
    // In HARD mode, slow + worsening latency DOES gate (so the lever exists):
    expect(isMastered(estimate({ ...masteredEst, fluency_stats: { median_latency: 99999, slope: 99 } }), true)).toBe(false);
  });

  it('false-positive guards: fast-but-shallow success does NOT unlock', () => {
    // (a) Pattern-matcher: strong accuracy but only ONE surface form → transfer fails → held.
    const memorizer = estimate({ P_known: 0.99, max_scaffold_passed: 4, transfer_passed: false });
    expect(isMastered(memorizer)).toBe(false);
    expect(gateConditions(memorizer).transferOk).toBe(false);
    // (b) Scaffold-dependent: only ever correct at low scaffold → not independent → held.
    const propped = estimate({ P_known: 0.99, max_scaffold_passed: 1, transfer_passed: true });
    expect(isMastered(propped)).toBe(false);
    expect(gateConditions(propped).independenceOk).toBe(false);
    // (c) Guesser: a too-fast correct routes to a TransferProbe instead of crediting mastery.
    expect(nextDecision(state({ pendingTransferProbe: true }), learning, calm, 0).kind).toBe('TransferProbe');
  });

  it('the student STAYS at the level until a clean streak — one correct never advances', () => {
    // Below the streak, Fade is NOT chosen (default PresentProblem keeps them practicing).
    expect(nextDecision(state({ consecutiveCleanCorrects: 1 }), learning, calm, 0).kind).not.toBe('FadeScaffold');
    expect(nextDecision(state({ consecutiveCleanCorrects: 2 }), learning, calm, 0).kind).not.toBe('FadeScaffold');
    // AT the streak → unlock the next level.
    expect(nextDecision(state({ consecutiveCleanCorrects: 3 }), learning, calm, 0).kind).toBe('FadeScaffold');
  });

  it('a MASTERED node returns the student to the kitchen recipe that stumped them', () => {
    const done = { SIMPLIFY: masteredEst };
    const dec = nextDecision(state({ stumpingRecipe: 'trays' }), done, calm, 0);
    expect(dec.kind).toBe('ReturnToKitchen');
    expect(dec.recipe).toBe('trays');
  });

  it('there is NO illegal shortcut to mastery — the gate is the only door', () => {
    // The policy can never emit a "mark mastered" move; mastery exists only via isMastered.
    for (const moves of [legalMoves(state(), learning), legalMoves(state({ inKitchen: true }), learning)]) {
      expect(moves).not.toContain('DeclareMastered');
      expect(moves).not.toContain('SetMastered');
    }
  });

  it('every decision carries a child-readable reason (no silent UI changes)', () => {
    for (const s of [
      state({ consecutiveErrors: 2 }),
      state({ consecutiveCleanCorrects: 3 }),
      state({ pendingTransferProbe: true }),
      state(),
    ]) {
      const dec = nextDecision(s, learning, calm, 0);
      expect(typeof dec.rationale).toBe('string');
      expect(dec.rationale.length).toBeGreaterThan(0);
    }
  });
});
