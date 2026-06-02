// test_detectors.test.ts — Phase 1 (plan 005, S1): behavioral Signal detectors.
//
// Each detector is a PURE function over one attempt's event span (the same span
// segment() consumes — "one signal path") + a context. It returns a Signal or
// null and NEVER mutates the span or game state (firewall: Signal-only).
//
// Detectors:
//   idle                 — a freeze: the largest inter-event gap exceeds threshold.
//   rapid_submit         — submit with no work AND below the per-child floor.
//   orphaned_interaction — work started then abandoned (net-zero at submit) — the
//                          silent wheel-spin self_corrections miss.
//   latency_stall        — total latency residual high vs the child's own baseline.
//   scribble_burst       — a transient: many removals in a short window (survives smoothing).
//   contextHash          — deterministic compact hash for after-the-fact slicing.

import { describe, it, expect } from 'vitest';
import type { Event, Action, Actor } from '../../../src/engine/types.js';
import {
  detectIdle,
  detectRapidSubmit,
  detectOrphanedInteraction,
  detectLatencyStall,
  detectScribbleBurst,
  contextHash,
  DETECTOR_PARAMS,
} from '../../../src/engine/observe/detectors.js';

// ---------------------------------------------------------------------------
// Builders — mirror the canonical harness/runtime burst.
// ---------------------------------------------------------------------------

function action(type: string, t: number, payload: Record<string, unknown> = {}): Action {
  return { type, payload, modality: 'tap', t, actor: 'human' };
}

const CTX = {
  scaffoldLevel: 2,
  hintState: 0,
  pKnown: 0.4,
  actor: 'human' as Actor,
  itemId: 'item-A',
};

function isSignal(ev: Event): boolean {
  return 'confidence' in ev && typeof (ev as { confidence: unknown }).confidence === 'number';
}

// ---------------------------------------------------------------------------
// idle
// ---------------------------------------------------------------------------

describe('detectIdle', () => {
  it('fires on a large mid-attempt gap, carrying idleMs', () => {
    const span = [
      action('problem_present', 0),
      action('piece_place', 200),
      action('answer_submit', 12_000), // ~11.8s freeze before submit
      action('judged', 12_100, { correct: true }),
    ];
    const sig = detectIdle(span, CTX);
    expect(sig).not.toBeNull();
    expect(sig!.type).toBe('idle');
    expect(sig!.payload.idleMs as number).toBeGreaterThan(10_000);
    expect(sig!.confidence).toBeGreaterThan(0);
    expect(sig!.confidence).toBeLessThanOrEqual(1);
  });

  it('does not fire when interactions stay below the idle threshold', () => {
    const span = [
      action('problem_present', 0),
      action('piece_place', 500),
      action('piece_place', 1000),
      action('answer_submit', 1500),
      action('judged', 1600, { correct: true }),
    ];
    expect(detectIdle(span, CTX)).toBeNull();
  });

  it('flags a sharp freeze as transient so smoothing cannot erase it', () => {
    const span = [
      action('problem_present', 0),
      action('answer_submit', DETECTOR_PARAMS.transientIdleMs + 1000),
      action('judged', DETECTOR_PARAMS.transientIdleMs + 1100, { correct: false }),
    ];
    const sig = detectIdle(span, CTX);
    expect(sig).not.toBeNull();
    expect(sig!.payload.transient).toBe(true);
  });

  it('does not mutate the input span', () => {
    const span = Object.freeze([
      action('problem_present', 0),
      action('answer_submit', 9_000),
      action('judged', 9_100, { correct: true }),
    ]);
    expect(() => detectIdle(span as readonly Event[], CTX)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// rapid_submit
// ---------------------------------------------------------------------------

describe('detectRapidSubmit', () => {
  it('fires when the child submits with no work below the personal floor', () => {
    const span = [
      action('problem_present', 0),
      action('answer_submit', 400),
      action('judged', 450, { correct: false }),
    ];
    const sig = detectRapidSubmit(span, CTX, 1200);
    expect(sig).not.toBeNull();
    expect(sig!.type).toBe('rapid_submit');
    expect(sig!.payload.floorMs).toBe(1200);
  });

  it('does not fire when the child actually worked (placed a piece)', () => {
    const span = [
      action('problem_present', 0),
      action('piece_place', 200),
      action('answer_submit', 400),
      action('judged', 450, { correct: false }),
    ];
    expect(detectRapidSubmit(span, CTX, 1200)).toBeNull();
  });

  it('does not fire when the submit was above the plausible floor (took time)', () => {
    const span = [
      action('problem_present', 0),
      action('answer_submit', 5_000),
      action('judged', 5_100, { correct: false }),
    ];
    expect(detectRapidSubmit(span, CTX, 1200)).toBeNull();
  });

  it('respects a per-child floor: the same fast submit is rapid for a slow child, not a fast one', () => {
    const span = [
      action('problem_present', 0),
      action('answer_submit', 900),
      action('judged', 950, { correct: false }),
    ];
    expect(detectRapidSubmit(span, CTX, 2000)).not.toBeNull(); // slow child: 900 < 2000
    expect(detectRapidSubmit(span, CTX, 500)).toBeNull();      // fast child: 900 > 500
  });
});

// ---------------------------------------------------------------------------
// orphaned_interaction
// ---------------------------------------------------------------------------

describe('detectOrphanedInteraction', () => {
  it('fires when a placed piece is abandoned (net-zero at submit)', () => {
    const span = [
      action('problem_present', 0),
      action('piece_place', 500),
      action('piece_remove', 1500),
      action('answer_submit', 3000),
      action('judged', 3100, { correct: false }),
    ];
    const sig = detectOrphanedInteraction(span, CTX);
    expect(sig).not.toBeNull();
    expect(sig!.type).toBe('orphaned_interaction');
  });

  it('does not fire when the child re-commits work before submit', () => {
    const span = [
      action('problem_present', 0),
      action('piece_place', 500),
      action('piece_remove', 1500),
      action('piece_place', 2000), // re-committed → not abandoned
      action('answer_submit', 3000),
      action('judged', 3100, { correct: true }),
    ];
    expect(detectOrphanedInteraction(span, CTX)).toBeNull();
  });

  it('fires on a typed-then-cleared value (wheel-spin self_corrections miss)', () => {
    const span = [
      action('problem_present', 0),
      action('value_set', 500, { value: 3 }),
      action('value_clear', 1500),
      action('answer_submit', 3000),
      action('judged', 3100, { correct: false }),
    ];
    expect(detectOrphanedInteraction(span, CTX)).not.toBeNull();
  });

  it('does not fire when there was no work at all', () => {
    const span = [
      action('problem_present', 0),
      action('answer_submit', 3000),
      action('judged', 3100, { correct: false }),
    ];
    expect(detectOrphanedInteraction(span, CTX)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// latency_stall (uses the per-child residual)
// ---------------------------------------------------------------------------

describe('detectLatencyStall', () => {
  const span = [action('problem_present', 0), action('answer_submit', 30_000), action('judged', 30_100)];

  it('fires when the residual is high and the baseline is established', () => {
    const residual = { residualMs: 18_000, z: 3.2, expectedMs: 12_000, established: true };
    const sig = detectLatencyStall(span, CTX, residual);
    expect(sig).not.toBeNull();
    expect(sig!.type).toBe('latency_stall');
    expect(sig!.payload.z as number).toBeCloseTo(3.2, 5);
  });

  it('stays silent during cold start (observe-only), even with a high residual', () => {
    const residual = { residualMs: 18_000, z: 3.2, expectedMs: 12_000, established: false };
    expect(detectLatencyStall(span, CTX, residual)).toBeNull();
  });

  it('does not fire when the residual is within the child\'s normal band', () => {
    const residual = { residualMs: 500, z: 0.3, expectedMs: 12_000, established: true };
    expect(detectLatencyStall(span, CTX, residual)).toBeNull();
  });

  it('fires on a gross slowdown even when spread is ~0 (z undefined): fractional fallback', () => {
    // A perfectly-consistent child (var≈0 → z reported 0) who suddenly takes 3×
    // as long must still stall-flag — z alone would silently suppress it.
    const residual = { residualMs: 24_000, z: 0, expectedMs: 12_000, established: true };
    expect(detectLatencyStall(span, CTX, residual)).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// scribble_burst (transient)
// ---------------------------------------------------------------------------

describe('detectScribbleBurst', () => {
  it('fires (transient) on many removals within a short window', () => {
    const span: Action[] = [action('problem_present', 0)];
    for (let i = 0; i < DETECTOR_PARAMS.scribbleCount; i++) {
      span.push(action('piece_remove', 1000 + i * 100));
    }
    span.push(action('answer_submit', 3000), action('judged', 3100));
    const sig = detectScribbleBurst(span, CTX);
    expect(sig).not.toBeNull();
    expect(sig!.type).toBe('scribble_burst');
    expect(sig!.payload.transient).toBe(true);
  });

  it('does not fire on a couple of calm removals spread out', () => {
    const span = [
      action('problem_present', 0),
      action('piece_remove', 2000),
      action('piece_remove', 9000),
      action('answer_submit', 12_000),
      action('judged', 12_100),
    ];
    expect(detectScribbleBurst(span, CTX)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// contextHash — Phase 0 seam carried in payload until the Signal type adds it
// ---------------------------------------------------------------------------

describe('contextHash', () => {
  it('is deterministic for identical context', () => {
    expect(contextHash(CTX)).toBe(contextHash({ ...CTX }));
  });

  it('changes when the scaffold level changes', () => {
    expect(contextHash(CTX)).not.toBe(contextHash({ ...CTX, scaffoldLevel: 3 }));
  });

  it('changes when P_known at emission changes', () => {
    expect(contextHash(CTX)).not.toBe(contextHash({ ...CTX, pKnown: 0.9 }));
  });
});

// ---------------------------------------------------------------------------
// firewall sanity — every detector emits ONLY Signals, each tagged with context_hash
// ---------------------------------------------------------------------------

describe('detectors emit Signal-only with context provenance', () => {
  it('idle / rapid_submit / orphaned signals are Signals carrying a context_hash', () => {
    const idleSpan = [action('problem_present', 0), action('answer_submit', 11_000), action('judged', 11_100)];
    const rapidSpan = [action('problem_present', 0), action('answer_submit', 300), action('judged', 350)];
    const sigs = [
      detectIdle(idleSpan, CTX),
      detectRapidSubmit(rapidSpan, CTX, 1200),
    ].filter((s): s is NonNullable<typeof s> => s !== null);
    expect(sigs.length).toBe(2);
    for (const s of sigs) {
      expect(isSignal(s)).toBe(true);
      expect(typeof s.payload.context_hash).toBe('string');
      expect((s.payload.context_hash as string).length).toBeGreaterThan(0);
    }
  });
});
