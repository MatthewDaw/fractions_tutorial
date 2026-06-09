// T08 / plan-002 U1 activation — calibrated hard-mode fluency + the emission guard
// that keeps the spoofable independence/transfer proxies from silently re-arming.
//
// docs/improvements/2026-06-08-activate-fluency-hardmode.md.
//
// These are PURE engine tests (real imports, no React, no wall-clock). They prove:
//   • hard-mode fluencyOk is now a TWO-SIDED plausibility band: it rejects an
//     over-target latency AND an implausibly-FAST median (the leniency trap).
//   • the reversible flag still defaults soft (rollback no-op).
//   • auditEmissionGuard flags any gate-relevant correct that would fall back to a
//     spoofable proxy (missing problem_id / surface_form).
import { describe, it, expect, afterEach } from 'vitest';
import {
  fluencyOk,
  auditEmissionGuard,
} from '../../src/engine/dimensions.js';
import { PARAMS } from '../../src/engine/params.js';
import type { Observation, FluencyStats } from '../../src/engine/types.js';

function obs(o: Partial<Observation> = {}): Observation {
  return {
    correct: true,
    answer_value: [3, 4],
    error_signature: null,
    latency: PARAMS.latencyFloorMs + 500,
    hint_max_rung: 0,
    self_corrections: 0,
    scaffold_level: 3,
    modality: 'tap',
    recognizer_confidence: null,
    too_fast_correct: false,
    affect_window: [],
    ...o,
  } as Observation;
}

function stat(median: number, slope = 0): FluencyStats {
  return { median_latency: median, slope, n: PARAMS.fluencyMinN };
}

// ---------------------------------------------------------------------------
// Calibrated hard-mode fluency — the two-sided plausibility band.
// ---------------------------------------------------------------------------

describe('fluencyOk — calibrated hard mode (over-target AND too-fast both fail)', () => {
  it('hard mode: over-target latency fails (above the calibrated age-band ceiling)', () => {
    expect(fluencyOk(stat(PARAMS.fluencyLatencyTargetMs + 1), true)).toBe(false);
  });

  it('hard mode: an implausibly FAST median fails (the leniency-trap fix)', () => {
    // 200ms is the exact spoof the harness `fluencyOk-always-true` finding uses.
    expect(fluencyOk(stat(200), true)).toBe(false);
    // anything below the calibrated plausible-compute floor fails.
    expect(fluencyOk(stat(PARAMS.fluencyPlausibleFloorMs - 1), true)).toBe(false);
  });

  it('hard mode: a genuine in-band median passes (fast enough, not implausible)', () => {
    const mid = Math.floor(
      (PARAMS.fluencyPlausibleFloorMs + PARAMS.fluencyLatencyTargetMs) / 2
    );
    expect(fluencyOk(stat(mid, -10), true)).toBe(true);
  });

  it('hard mode: a deteriorating slope still fails even at a plausible median', () => {
    const mid = Math.floor(
      (PARAMS.fluencyPlausibleFloorMs + PARAMS.fluencyLatencyTargetMs) / 2
    );
    expect(fluencyOk(stat(mid, 1000), true)).toBe(false);
  });

  it('the plausible-compute floor is STRICTER than the too-fast-correct floor', () => {
    expect(PARAMS.fluencyPlausibleFloorMs).toBeGreaterThan(PARAMS.latencyFloorMs);
  });
});

describe('fluencyOk — reversible default stays soft (rollback no-op)', () => {
  afterEach(() => {
    (PARAMS as unknown as { fluencyHardMode: boolean }).fluencyHardMode = false;
  });

  it('default flag is OFF (gated-three: capability built, default rollback)', () => {
    expect(PARAMS.fluencyHardMode).toBe(false);
  });

  it('soft mode waves through BOTH an implausibly fast and a too-slow median', () => {
    expect(fluencyOk(stat(200), false)).toBe(true);
    expect(fluencyOk(stat(99_999), false)).toBe(true);
  });

  it('flipping the flag on (then off) toggles the hard band — no other change needed', () => {
    (PARAMS as unknown as { fluencyHardMode: boolean }).fluencyHardMode = true;
    expect(fluencyOk(stat(200))).toBe(false); // reads PARAMS by default
    (PARAMS as unknown as { fluencyHardMode: boolean }).fluencyHardMode = false;
    expect(fluencyOk(stat(200))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Emission guard — the proxy fallbacks must never silently re-arm.
// ---------------------------------------------------------------------------

describe('auditEmissionGuard — proxy fallbacks cannot silently re-arm', () => {
  it('clean when every gate-relevant correct carries problem_id AND surface_form', () => {
    const stream = [
      { ...obs({ scaffold_level: 3 }), problem_id: 'P1', surface_form: 'proper' },
      { ...obs({ scaffold_level: 3 }), problem_id: 'P2', surface_form: 'makes_whole' },
    ] as Observation[];
    const r = auditEmissionGuard(stream);
    expect(r.clean).toBe(true);
    expect(r.hits).toHaveLength(0);
  });

  it('flags an independence-relevant correct missing problem_id (answer_value proxy would re-arm)', () => {
    const stream = [
      { ...obs({ scaffold_level: 3 }), surface_form: 'proper' }, // no problem_id
    ] as Observation[];
    const r = auditEmissionGuard(stream);
    expect(r.clean).toBe(false);
    expect(r.hits.some((h) => h.dimension === 'independence' && h.missingField === 'problem_id')).toBe(true);
  });

  it('flags a transfer-relevant correct missing surface_form (denominator proxy would re-arm)', () => {
    const stream = [
      { ...obs({ scaffold_level: 3 }), problem_id: 'P1' }, // no surface_form
    ] as Observation[];
    const r = auditEmissionGuard(stream);
    expect(r.clean).toBe(false);
    expect(r.hits.some((h) => h.dimension === 'transfer' && h.missingField === 'surface_form')).toBe(true);
  });

  it('does NOT flag attempts that could never reach the proxy (hinted / wrong / too-fast)', () => {
    const stream = [
      obs({ correct: false }), // wrong — not gate-relevant
      obs({ hint_max_rung: 2 }), // hinted — excluded from both conjuncts
      obs({ scaffold_level: 3, latency: PARAMS.latencyFloorMs - 1, correct: true }), // below-floor: not transfer-relevant…
    ] as Observation[];
    const r = auditEmissionGuard(stream);
    // The below-floor correct is still INDEPENDENCE-relevant (L3, hint-free) and
    // lacks a problem_id, so exactly one independence hit is expected — and NO
    // transfer hit (it is too fast for transfer).
    expect(r.hits.every((h) => h.dimension !== 'transfer')).toBe(true);
    expect(r.hits.filter((h) => h.dimension === 'independence')).toHaveLength(1);
  });

  it('is a pure, deterministic, order-stable projection (no mutation)', () => {
    const stream = [
      { ...obs({ scaffold_level: 3 }), problem_id: 'P1' }, // transfer hit
      { ...obs({ scaffold_level: 3 }), surface_form: 'proper' }, // independence hit
    ] as Observation[];
    const before = JSON.stringify(stream);
    const r1 = auditEmissionGuard(stream);
    const r2 = auditEmissionGuard(stream);
    expect(JSON.stringify(stream)).toBe(before); // unchanged
    expect(r1).toEqual(r2); // deterministic
    expect(r1.hits.map((h) => h.index)).toEqual([0, 1]); // input order
  });
});
