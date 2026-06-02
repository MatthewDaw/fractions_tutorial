// test_observe.test.ts — Phase 1 (plan 005): the observe orchestrator.
//
// observeBehavior(log, baseline?) walks a flat event log into attempt spans,
// runs the behavioral detectors against the PER-CHILD baseline, folds correct
// attempts into the baseline, and applies cold-start gating (observe-only until
// a baseline is established; first driftControlN attempts are the control).
//
// It emits Signals ONLY — the firewall holds: nothing here produces or mutates a
// MasteryEstimate.

import { describe, it, expect } from 'vitest';
import type { Event, Action } from '../../../src/engine/types.js';
import {
  observeBehavior,
  observeAttempt,
  OBSERVE_PARAMS,
} from '../../../src/engine/observe/index.js';
import { emptyBaseline } from '../../../src/engine/observe/baseline.js';

// ---------------------------------------------------------------------------
// Builders — one attempt = present … (work) … submit … judged.
// ---------------------------------------------------------------------------

function action(type: string, t: number, payload: Record<string, unknown> = {}): Action {
  return { type, payload, modality: 'tap', t, actor: 'human' };
}

/** Build one attempt burst at absolute start time `t0`, lasting `latency` ms. */
function attempt(
  t0: number,
  {
    latency = 4000,
    correct = true,
    scaffold = 2,
    work = ['piece_place'] as string[],
    gapBeforeSubmit = 0,
  } = {}
): Event[] {
  const evs: Event[] = [action('problem_present', t0, { scaffold_level: scaffold, problem_id: `p${t0}` })];
  let t = t0 + 200;
  for (const w of work) {
    evs.push(action(w, t));
    t += 200;
  }
  const submitT = t0 + latency - gapBeforeSubmit;
  evs.push(action('answer_submit', submitT, { scaffold_level: scaffold }));
  evs.push(action('judged', t0 + latency, { correct, scaffold_level: scaffold }));
  return evs;
}

function many(n: number, opts = {}): Event[] {
  const log: Event[] = [];
  let t = 0;
  for (let i = 0; i < n; i++) {
    log.push(...attempt(t, opts));
    t += 20_000; // generous spacing so cross-attempt gaps never read as idle
  }
  return log;
}

describe('observeBehavior — baseline folding', () => {
  it('folds each CORRECT attempt into the returned baseline', () => {
    const res = observeBehavior(many(6, { correct: true }));
    expect(res.baseline.n).toBe(6);
    expect(res.baseline.established).toBe(true);
  });

  it('does not fold incorrect attempts into the latency baseline', () => {
    const res = observeBehavior(many(4, { correct: false }));
    expect(res.baseline.n).toBe(0);
  });

  it('is deterministic — identical logs produce identical results', () => {
    const log = many(5);
    expect(observeBehavior(log)).toEqual(observeBehavior(log));
  });
});

describe('observeBehavior — cold-start gating', () => {
  it('marks the first driftControlN attempts observe-only, later ones actionable', () => {
    // Every attempt freezes long enough to emit an idle signal.
    const log = many(OBSERVE_PARAMS.driftControlN + 2, {
      latency: 12_000,
      work: [] as string[],
      correct: true,
    });
    const res = observeBehavior(log);
    const idles = res.signals.filter((s) => s.signal.type === 'idle');
    expect(idles.length).toBeGreaterThanOrEqual(OBSERVE_PARAMS.driftControlN + 1);
    // control window: observe-only
    expect(idles.slice(0, OBSERVE_PARAMS.driftControlN).every((s) => s.observeOnly)).toBe(true);
    // after the control window: actionable
    expect(idles.slice(OBSERVE_PARAMS.driftControlN).some((s) => !s.observeOnly)).toBe(true);
  });
});

describe('observeBehavior — detector integration', () => {
  it('surfaces an idle signal from a frozen attempt', () => {
    const res = observeBehavior(many(1, { latency: 12_000, work: [] as string[] }));
    expect(res.signals.some((s) => s.signal.type === 'idle')).toBe(true);
  });

  it('surfaces rapid_submit from a no-work below-floor attempt', () => {
    const res = observeBehavior(many(1, { latency: 400, work: [] as string[], correct: false }));
    expect(res.signals.some((s) => s.signal.type === 'rapid_submit')).toBe(true);
  });

  it('emits latency_stall only AFTER the baseline establishes, on a gross slowdown', () => {
    // Warm with varied-but-fast corrects, then one very slow attempt.
    const log: Event[] = [];
    let t = 0;
    const warmLatencies = [3500, 4500, 3800, 4200, 4000, 3900];
    for (const L of warmLatencies) {
      log.push(...attempt(t, { latency: L, correct: true }));
      t += 20_000;
    }
    log.push(...attempt(t, { latency: 40_000, correct: false })); // gross stall
    const res = observeBehavior(log);
    expect(res.signals.some((s) => s.signal.type === 'latency_stall')).toBe(true);
  });

  it('does NOT emit latency_stall while still cold (no established baseline)', () => {
    const log = [...attempt(0, { latency: 40_000, correct: false })];
    const res = observeBehavior(log);
    expect(res.signals.some((s) => s.signal.type === 'latency_stall')).toBe(false);
  });
});

describe('observeAttempt — streaming one span', () => {
  it('returns the emitted signals and the updated baseline for a single span', () => {
    const span = attempt(0, { latency: 12_000, work: [] as string[], correct: true });
    const out = observeAttempt(span, emptyBaseline(), 0);
    expect(out.baseline.n).toBe(1);
    expect(out.signals.some((s) => s.signal.type === 'idle')).toBe(true);
  });
});

describe('observeBehavior — firewall: Signal-only output', () => {
  it('every emitted item is a Signal (has a numeric confidence), never a mastery field', () => {
    const res = observeBehavior(many(8, { latency: 12_000, work: [] as string[] }));
    expect(res.signals.length).toBeGreaterThan(0);
    for (const s of res.signals) {
      expect(typeof s.signal.confidence).toBe('number');
      expect(s.signal).not.toHaveProperty('P_known');
      expect(s.signal).not.toHaveProperty('transfer_passed');
    }
  });
});
