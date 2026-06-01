// test_tier2.test.js — U12: Tests for tier2.js Tier-2 nudges.
//
// Test scenarios (from plan U12):
//   1. Long pause triggers a hint-rung offer (HINT_OFFER) without changing game state.
//   2. Oscillation triggers "TAKE_YOUR_TIME" exactly once per window (not per wiggle).
//   3. too_fast_correct queues a transfer probe at the next boundary (TRANSFER_PROBE_QUEUED)
//      — not mid-attempt.
//   4. Each nudge fires at most once per window (idempotency).
//   5. No nudge changes any game state — the return is a hint/prompt, not a state mutation.
//   6. makeTier2Window returns a fresh unfired state.
//   7. Each individual check function works in isolation.
//
// NOTE: Do NOT run the full test suite. This file is checked by the orchestrator.

import { describe, it, expect } from 'vitest';
import {
  makeTier2Window,
  checkTier2,
  checkOscillation,
  checkLongPause,
  checkTooFastCorrect,
  PAUSE_THRESHOLD_MS,
  OSCILLATION_THRESHOLD,
} from '../../src/runtime/tier2.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Build a minimal Observation-like object for tests. */
function makeObs(overrides = {}) {
  return {
    correct: true,
    answer_value: [5, 7],
    error_signature: null,
    latency: 3000,
    hint_max_rung: 0,
    self_corrections: 0,
    scaffold_level: 0,
    modality: 'tap',
    recognizer_confidence: null,
    too_fast_correct: false,
    affect_window: [],
    ...overrides,
  };
}

/** Build a recentBehavior object from an optional last observation. */
function makeRecent(lastObs = null) {
  return {
    observations: lastObs ? [lastObs] : [],
    isDisengaged: false,
  };
}

// ---------------------------------------------------------------------------
// makeTier2Window
// ---------------------------------------------------------------------------

describe('makeTier2Window', () => {
  it('returns an object with all flags false', () => {
    const w = makeTier2Window();
    expect(w.pauseFired).toBe(false);
    expect(w.oscillationFired).toBe(false);
    expect(w.transferQueued).toBe(false);
  });

  it('each call returns a fresh independent object', () => {
    const w1 = makeTier2Window();
    const w2 = makeTier2Window();
    w1.pauseFired = true;
    expect(w2.pauseFired).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Long-pause → HINT_OFFER
// ---------------------------------------------------------------------------

describe('checkTier2 — long pause → HINT_OFFER', () => {
  it('fires HINT_OFFER when idle time exceeds PAUSE_THRESHOLD_MS', () => {
    const w = makeTier2Window();
    const presentT = 1000;
    const nowT = presentT + PAUSE_THRESHOLD_MS + 1;
    const recent = makeRecent(makeObs({ hint_max_rung: 0 }));

    const nudge = checkTier2(recent, presentT, nowT, w);
    expect(nudge).not.toBeNull();
    expect(nudge.type).toBe('HINT_OFFER');
  });

  it('HINT_OFFER payload includes suggestedRung = currentHintRung + 1', () => {
    const w = makeTier2Window();
    const presentT = 0;
    const nowT = PAUSE_THRESHOLD_MS + 100;
    const recent = makeRecent(makeObs({ hint_max_rung: 2 }));

    const nudge = checkTier2(recent, presentT, nowT, w);
    expect(nudge.payload.suggestedRung).toBe(3);
  });

  it('does NOT fire when idle time is below threshold', () => {
    const w = makeTier2Window();
    const presentT = 1000;
    const nowT = presentT + PAUSE_THRESHOLD_MS - 1;
    const recent = makeRecent();

    const nudge = checkTier2(recent, presentT, nowT, w);
    expect(nudge).toBeNull();
  });

  it('fires HINT_OFFER at most once per window (idempotent)', () => {
    const w = makeTier2Window();
    const presentT = 0;
    const nowT = PAUSE_THRESHOLD_MS + 100;
    const recent = makeRecent();

    const first = checkTier2(recent, presentT, nowT, w);
    const second = checkTier2(recent, presentT, nowT + 1000, w);

    expect(first.type).toBe('HINT_OFFER');
    expect(second).toBeNull(); // pauseFired is set; no second fire
  });

  it('does not fire if lastInteractionT is -1 (no interaction yet)', () => {
    const w = makeTier2Window();
    const nudge = checkTier2(makeRecent(), -1, PAUSE_THRESHOLD_MS + 100, w);
    expect(nudge).toBeNull();
  });
});

describe('checkLongPause — isolated check', () => {
  it('fires at the threshold', () => {
    const w = makeTier2Window();
    const nudge = checkLongPause(0, PAUSE_THRESHOLD_MS, w, 1);
    expect(nudge).not.toBeNull();
    expect(nudge.type).toBe('HINT_OFFER');
    expect(nudge.payload.suggestedRung).toBe(2);
  });

  it('does not fire below the threshold', () => {
    const w = makeTier2Window();
    const nudge = checkLongPause(0, PAUSE_THRESHOLD_MS - 1, w, 0);
    expect(nudge).toBeNull();
  });

  it('does not fire if already fired this window', () => {
    const w = makeTier2Window();
    w.pauseFired = true;
    const nudge = checkLongPause(0, PAUSE_THRESHOLD_MS + 100, w, 0);
    expect(nudge).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Oscillation → TAKE_YOUR_TIME
// ---------------------------------------------------------------------------

describe('checkTier2 — oscillation → TAKE_YOUR_TIME', () => {
  it('fires TAKE_YOUR_TIME when self_corrections meets threshold', () => {
    const w = makeTier2Window();
    // Need more than PAUSE_THRESHOLD_MS idle to avoid HINT_OFFER taking priority.
    // Use lastInteractionT = 0 to suppress long-pause.
    const recent = makeRecent(makeObs({ self_corrections: OSCILLATION_THRESHOLD }));

    const nudge = checkTier2(recent, 0, 1000, w);
    expect(nudge).not.toBeNull();
    expect(nudge.type).toBe('TAKE_YOUR_TIME');
  });

  it('fires TAKE_YOUR_TIME only once per window (not per additional wiggle)', () => {
    const w = makeTier2Window();
    const recent = makeRecent(makeObs({ self_corrections: OSCILLATION_THRESHOLD + 5 }));

    const first = checkTier2(recent, 0, 1000, w);
    expect(first.type).toBe('TAKE_YOUR_TIME');
    // Set oscillation higher — should not re-fire.
    const second = checkTier2(recent, 0, 2000, w);
    expect(second).toBeNull();
  });

  it('does NOT fire when self_corrections is below threshold', () => {
    const w = makeTier2Window();
    const recent = makeRecent(makeObs({ self_corrections: OSCILLATION_THRESHOLD - 1 }));
    const nudge = checkTier2(recent, 0, 1000, w);
    expect(nudge).toBeNull();
  });

  it('TAKE_YOUR_TIME payload includes the oscillation count', () => {
    const w = makeTier2Window();
    const recent = makeRecent(makeObs({ self_corrections: 5 }));
    const nudge = checkTier2(recent, 0, 1000, w);
    expect(nudge.payload.oscillations).toBe(5);
  });
});

describe('checkOscillation — isolated check', () => {
  it('fires at the threshold', () => {
    const w = makeTier2Window();
    const recent = makeRecent(makeObs({ self_corrections: OSCILLATION_THRESHOLD }));
    const nudge = checkOscillation(recent, w);
    expect(nudge).not.toBeNull();
    expect(nudge.type).toBe('TAKE_YOUR_TIME');
  });

  it('does not fire below threshold', () => {
    const w = makeTier2Window();
    const recent = makeRecent(makeObs({ self_corrections: OSCILLATION_THRESHOLD - 1 }));
    expect(checkOscillation(recent, w)).toBeNull();
  });

  it('does not fire if already fired', () => {
    const w = makeTier2Window();
    w.oscillationFired = true;
    const recent = makeRecent(makeObs({ self_corrections: OSCILLATION_THRESHOLD + 10 }));
    expect(checkOscillation(recent, w)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// too_fast_correct → TRANSFER_PROBE_QUEUED
// ---------------------------------------------------------------------------

describe('checkTier2 — too_fast_correct → TRANSFER_PROBE_QUEUED', () => {
  it('queues a TRANSFER_PROBE_QUEUED when too_fast_correct is true', () => {
    const w = makeTier2Window();
    const recent = makeRecent(makeObs({ too_fast_correct: true }));
    const nudge = checkTier2(recent, 0, 1000, w);
    expect(nudge).not.toBeNull();
    expect(nudge.type).toBe('TRANSFER_PROBE_QUEUED');
  });

  it('TRANSFER_PROBE_QUEUED fires at most once per window', () => {
    const w = makeTier2Window();
    const recent = makeRecent(makeObs({ too_fast_correct: true }));
    const first = checkTier2(recent, 0, 1000, w);
    const second = checkTier2(recent, 0, 2000, w);
    expect(first.type).toBe('TRANSFER_PROBE_QUEUED');
    expect(second).toBeNull();
  });

  it('does NOT fire when too_fast_correct is false', () => {
    const w = makeTier2Window();
    const recent = makeRecent(makeObs({ too_fast_correct: false }));
    expect(checkTier2(recent, 0, 1000, w)).toBeNull();
  });

  it('marks transferQueued on the windowState', () => {
    const w = makeTier2Window();
    const recent = makeRecent(makeObs({ too_fast_correct: true }));
    checkTier2(recent, 0, 1000, w);
    expect(w.transferQueued).toBe(true);
  });
});

describe('checkTooFastCorrect — isolated check', () => {
  it('returns TRANSFER_PROBE_QUEUED when too_fast_correct is true', () => {
    const w = makeTier2Window();
    const obs = makeObs({ too_fast_correct: true });
    const nudge = checkTooFastCorrect(obs, w);
    expect(nudge).not.toBeNull();
    expect(nudge.type).toBe('TRANSFER_PROBE_QUEUED');
  });

  it('returns null when too_fast_correct is false', () => {
    const w = makeTier2Window();
    const obs = makeObs({ too_fast_correct: false });
    expect(checkTooFastCorrect(obs, w)).toBeNull();
  });

  it('returns null when already queued', () => {
    const w = makeTier2Window();
    w.transferQueued = true;
    const obs = makeObs({ too_fast_correct: true });
    expect(checkTooFastCorrect(obs, w)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Priority ordering
// ---------------------------------------------------------------------------

describe('checkTier2 — priority: HINT_OFFER > TAKE_YOUR_TIME > TRANSFER_PROBE_QUEUED', () => {
  it('HINT_OFFER takes priority over TAKE_YOUR_TIME when both conditions are met', () => {
    const w = makeTier2Window();
    const presentT = 0;
    const nowT = PAUSE_THRESHOLD_MS + 100;
    // Both oscillation and long pause triggered
    const recent = makeRecent(makeObs({ self_corrections: OSCILLATION_THRESHOLD }));

    const nudge = checkTier2(recent, presentT, nowT, w);
    expect(nudge.type).toBe('HINT_OFFER');
  });

  it('TAKE_YOUR_TIME is returned when only oscillation fires (no long pause)', () => {
    const w = makeTier2Window();
    // No long pause: lastInteractionT = 0 disables it
    const recent = makeRecent(makeObs({ self_corrections: OSCILLATION_THRESHOLD }));

    const nudge = checkTier2(recent, 0, 1000, w);
    expect(nudge.type).toBe('TAKE_YOUR_TIME');
  });

  it('TRANSFER_PROBE_QUEUED only when nothing else fires', () => {
    const w = makeTier2Window();
    // No pause, no oscillation, but too_fast_correct
    const recent = makeRecent(makeObs({ too_fast_correct: true, self_corrections: 0 }));

    const nudge = checkTier2(recent, 0, 100, w);
    expect(nudge.type).toBe('TRANSFER_PROBE_QUEUED');
  });
});

// ---------------------------------------------------------------------------
// Game state is NOT modified
// ---------------------------------------------------------------------------

describe('tier2 nudges — game state not modified', () => {
  it('checkTier2 does not modify the recentBehavior object', () => {
    const w = makeTier2Window();
    const obs = makeObs({ too_fast_correct: true });
    const recent = makeRecent(obs);
    const obsBefore = { ...obs };
    const recentBefore = { observations: [...recent.observations], isDisengaged: false };

    checkTier2(recent, 0, 1000, w);

    // recent is unchanged
    expect(recent.observations.length).toBe(recentBefore.observations.length);
    expect(recent.isDisengaged).toBe(recentBefore.isDisengaged);
    // obs is unchanged
    expect(obs.too_fast_correct).toBe(obsBefore.too_fast_correct);
  });

  it('HINT_OFFER payload does not mutate the observation', () => {
    const w = makeTier2Window();
    const obs = makeObs({ hint_max_rung: 1 });
    const recent = makeRecent(obs);

    checkTier2(recent, 0, PAUSE_THRESHOLD_MS + 100, w);

    expect(obs.hint_max_rung).toBe(1); // unchanged
  });

  it('T2 nudges do NOT return a Decision kind (no game-state decision)', () => {
    const w = makeTier2Window();
    const recent = makeRecent(makeObs({ too_fast_correct: true }));
    const nudge = checkTier2(recent, 0, 1000, w);

    // T2 nudges have type, not kind (they are NOT engine Decisions).
    expect(nudge).not.toBeNull();
    expect(nudge.type).toBeTruthy();
    expect(nudge.kind).toBeUndefined(); // NOT a Decision shape
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('checkTier2 — edge cases', () => {
  it('returns null when windowState is null', () => {
    const recent = makeRecent(makeObs({ too_fast_correct: true }));
    expect(checkTier2(recent, 0, 1000, null)).toBeNull();
  });

  it('returns null when recentBehavior is null and no pause (lastInteractionT=-1)', () => {
    const w = makeTier2Window();
    // -1 = no interaction yet, so long-pause cannot fire; null behavior → no other nudge
    expect(checkTier2(null, -1, PAUSE_THRESHOLD_MS + 100, w)).toBeNull();
  });

  it('returns null when recentBehavior has no observations and no pause', () => {
    const w = makeTier2Window();
    // lastInteractionT=-1 means no interaction yet; idle time cannot be computed.
    expect(checkTier2(makeRecent(), -1, 1000, w)).toBeNull();
  });
});
