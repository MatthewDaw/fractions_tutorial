// T12 — the flag→PARAMS overlay: a flags-ON sweep must actually change ENGINE
// gating vs flags-OFF (closing the gap where flags only ever reached the tape).
//
// Before T12 the harness threaded its plan-002 flags into the session TAPE only and
// never APPLIED them to the engine PARAMS, so any flags-on sweep was a no-op and the
// U13/T07 certification could only read NO_CHANGE. These tests prove the overlay now
// drives the engine: the SAME {persona, skill, seed} produces genuinely different
// engine gating (gate opens / decision rationale / params_hash) under a routed flag,
// while a no-flags run is byte-identical to today and PARAMS never leaks across runs.

import { describe, it, expect } from 'vitest';
import { runSession } from '../../src/harness/sessionRunner.js';
import { personaById } from '../../src/harness/personas/library.js';
import { PARAMS } from '../../src/harness/engineApi.js';
import { applyFlagOverlay, withFlags } from '../../src/harness/flagOverlay.js';

const SEED = 3;
const STEP_CAP = 30;

function gateOpens(tape) {
  return tape.steps.reduce((acc, s) => acc + (s.gate ? 1 : 0), 0);
}
function firstRaiseRationale(tape) {
  const s = tape.steps.find((st) => st.decision.kind === 'RaiseScaffold');
  return s ? s.decision.rationale : null;
}
function run(personaId, skillId, flags, opts = {}) {
  return runSession({
    persona: personaById(personaId),
    skillId,
    seed: opts.seed ?? SEED,
    stepCap: opts.stepCap ?? STEP_CAP,
    flags,
  });
}

// ---------------------------------------------------------------------------
// (1) fluencyHardMode CLOSES the mastery gate — the headline proof.
// ---------------------------------------------------------------------------

describe('flag overlay — fluencyHardMode changes engine GATING (not just the tape)', () => {
  it('a flags-on run opens FEWER mastery gates than flags-off (same persona/skill/seed)', () => {
    // short-attention: latency CLIMBS across the session → a rising fluency slope.
    // With fluencyHardMode the hard fluency conjunct (gate.ts) closes the gate the
    // soft default left open. Empirically: 6 gate-opens off → 0 on at this seed.
    const off = run('short-attention', 'ADD_SAME_DEN', {});
    const on = run('short-attention', 'ADD_SAME_DEN', { fluencyHardMode: true });

    expect(gateOpens(off)).toBeGreaterThan(0);
    expect(gateOpens(on)).toBeLessThan(gateOpens(off)); // the hard gate genuinely closed gates.
    expect(off.params_hash).not.toBe(on.params_hash); // the gated PARAMS differs → tape attribution differs.
  });

  it('the gate difference is REPRODUCED on a second persona with rising latency', () => {
    const off = run('anxious-low-energy', 'ADD_SAME_DEN', {});
    const on = run('anxious-low-energy', 'ADD_SAME_DEN', { fluencyHardMode: true });
    expect(gateOpens(on)).toBeLessThan(gateOpens(off));
  });
});

// ---------------------------------------------------------------------------
// (2) frustrationScaffold changes the engine DECISION (RaiseScaffold rationale).
// ---------------------------------------------------------------------------

describe('flag overlay — frustrationScaffold changes the engine DECISION', () => {
  it('flips the RaiseScaffold rationale from neutral to the warm-foothold variant', () => {
    // misconception-stable reliably hits ≥ raiseErrorsM errors → RaiseScaffold fires.
    const off = run('misconception-stable', 'ADD_UNLIKE_COPRIME', {});
    const on = run('misconception-stable', 'ADD_UNLIKE_COPRIME', { frustrationScaffold: true });

    const rOff = firstRaiseRationale(off);
    const rOn = firstRaiseRationale(on);
    expect(rOff).toBeTruthy();
    expect(rOn).toBeTruthy();
    expect(rOff).not.toBe(rOn); // the engine chose a different rationale under the flag.
    expect(rOn.toLowerCase()).toContain('smaller step'); // the warm-foothold rationale (policy.ts U9).
  });
});

// ---------------------------------------------------------------------------
// (3) no flags → byte-identical to today; PARAMS restored after every run.
// ---------------------------------------------------------------------------

describe('flag overlay — baseline is unchanged and PARAMS never leaks', () => {
  it('a no-flags run equals a baseline run and does not mutate the live PARAMS', () => {
    const beforeHard = PARAMS.fluencyHardMode;
    const beforeFrust = PARAMS.frustrationScaffold;

    const a = run('slow-but-steady', 'ADD_SAME_DEN', {});
    const b = run('slow-but-steady', 'ADD_SAME_DEN', {});
    // Determinism holds and the empty-flags overlay is a true no-op.
    expect(b.steps).toEqual(a.steps);
    expect(b.params_hash).toBe(a.params_hash);

    // PARAMS is restored to its baseline after the runs (no leak).
    expect(PARAMS.fluencyHardMode).toBe(beforeHard);
    expect(PARAMS.frustrationScaffold).toBe(beforeFrust);
  });

  it('a flags-on run RESTORES PARAMS afterward, so a later flags-off run is baseline', () => {
    const baseline = run('short-attention', 'ADD_SAME_DEN', {});
    // Interleave an ON run — its overlay must not bleed into the next OFF run.
    run('short-attention', 'ADD_SAME_DEN', { fluencyHardMode: true });
    const afterOn = run('short-attention', 'ADD_SAME_DEN', {});
    expect(afterOn.steps).toEqual(baseline.steps);
    expect(PARAMS.fluencyHardMode).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// (4) inert flags (no engine routing) are honestly no-ops on gating.
// ---------------------------------------------------------------------------

describe('flag overlay — flags with NO engine routing stay inert', () => {
  it('delayedProbe / unifiedTaxonomy do not change gating (no PARAMS key yet)', () => {
    const off = run('short-attention', 'ADD_SAME_DEN', {});
    const inert = run('short-attention', 'ADD_SAME_DEN', { delayedProbe: true, unifiedTaxonomy: true });
    expect(inert.steps).toEqual(off.steps);
    expect(inert.params_hash).toBe(off.params_hash);
  });
});

// ---------------------------------------------------------------------------
// (5) overlay primitives — apply/restore and escalation dotted paths.
// ---------------------------------------------------------------------------

describe('flag overlay — apply/restore primitives', () => {
  it('applyFlagOverlay mutates the live PARAMS then restore() reverts exactly', () => {
    expect(PARAMS.fluencyHardMode).toBe(false);
    expect(PARAMS.escalation.nDiseng).toBe(5);

    const handle = applyFlagOverlay({ fluencyHardMode: true, 'escalation.nDiseng': 2 });
    expect(PARAMS.fluencyHardMode).toBe(true);
    expect(PARAMS.escalation.nDiseng).toBe(2); // dotted path reached the nested knob.

    handle.restore();
    expect(PARAMS.fluencyHardMode).toBe(false);
    expect(PARAMS.escalation.nDiseng).toBe(5);

    // restore() is idempotent.
    handle.restore();
    expect(PARAMS.escalation.nDiseng).toBe(5);
  });

  it('withFlags restores PARAMS even when the body throws', () => {
    expect(PARAMS.frustrationScaffold).toBe(false);
    expect(() =>
      withFlags({ frustrationScaffold: true }, () => {
        expect(PARAMS.frustrationScaffold).toBe(true);
        throw new Error('boom');
      })
    ).toThrow('boom');
    expect(PARAMS.frustrationScaffold).toBe(false);
  });

  it('baseline/falsy and inert flag values apply no override', () => {
    const handle = applyFlagOverlay({
      fluencyHardMode: false, // baseline → skip
      frustrationScaffold: undefined, // baseline → skip
      delayedProbe: true, // inert (no routing) → skip
    });
    expect(handle.applied).toEqual([]);
    expect(PARAMS.fluencyHardMode).toBe(false);
    handle.restore();
  });
});
