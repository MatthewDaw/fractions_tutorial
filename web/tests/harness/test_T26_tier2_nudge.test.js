// test_T26_tier2_nudge.test.js — T26: wire the dead Tier-2 in-the-moment nudge.
//
// FINDING (round-2 redteam §T26): the Tier-2 nudge (idle / oscillation /
// too-fast-correct) recorded ZERO firings on the run path because the live
// recentBehavior channel is empty (useLessonEngine's recentObsRef is allocated but
// never appended) and the runner mirrored that empty channel. The T03 disengaged
// writer feeds disengagedScaffoldCount only — it does NOT reach this channel.
//
// FIX (reversible flag `tier2Nudge`, default-off): the runner now builds a REAL
// recentBehavior from the segment()-derived observations and records a Tier-2 nudge
// per eligible attempt, reusing tier2.js's existing detectors (no duplication, no
// invented signal). These tests prove:
//   1. flags-OFF: NO nudge is ever recorded (channel still dead — prior behavior).
//   2. flags-ON: a session with idle/oscillation/too-fast windows records ≥1 nudge.
//   3. the recorded nudge type matches the window (idle→HINT_OFFER,
//      oscillation→TAKE_YOUR_TIME, too-fast→TRANSFER_PROBE_QUEUED).
//   4. the engine's banked DECISION sequence is byte-identical off vs on (the nudge
//      is advisory — it never changes escalation or the engine decision).
//   5. the harness nudge-gap detector no longer flags a skill once the nudge fires.

import { describe, it, expect } from 'vitest';
import { runSession, runSweep } from '../../src/harness/sessionRunner.js';
import { allPersonas, personaById } from '../../src/harness/personas/library.js';
import { buildBacklog } from '../../src/harness/findings.js';
import { OSCILLATION_THRESHOLD, PAUSE_THRESHOLD_MS } from '../../src/runtime/tier2.js';

/** Count the steps on a tape that carry a recorded Tier-2 nudge. */
function recordedNudgeCount(tape) {
  return (tape.steps || []).filter((s) => s.nudge && typeof s.nudge.type === 'string').length;
}

/** Does any step's observation sit in a Tier-2-eligible window? */
function hasEligibleWindow(tape) {
  return (tape.steps || []).some((s) => {
    const o = s.observation;
    if (!o) return false;
    return (
      (o.self_corrections ?? 0) >= OSCILLATION_THRESHOLD ||
      (o.latency ?? 0) >= PAUSE_THRESHOLD_MS ||
      o.too_fast_correct === true
    );
  });
}

/** The banked engine-decision sequence (kind only) — what escalation/gating drive. */
function decisionKinds(tape) {
  return (tape.steps || []).map((s) => s.decision.kind);
}

describe('T26 — Tier-2 nudge wiring (was a dead channel)', () => {
  // Sweep all personas × all skills at both flag settings so we hit every window.
  const personaIds = allPersonas().map((p) => p.id);

  it('flags-OFF: the channel is dead — NOT a single nudge is recorded', () => {
    const tapes = runSweep({ personaIds, seed: 7, stepCap: 30, flags: {} });
    const total = tapes.reduce((n, t) => n + recordedNudgeCount(t), 0);
    // Sanity: the sweep actually produces eligible windows (so OFF=0 is meaningful).
    expect(tapes.some(hasEligibleWindow)).toBe(true);
    expect(total).toBe(0);
  });

  it('flags-ON: a session with idle/oscillation/too-fast windows records ≥1 nudge', () => {
    const tapes = runSweep({ personaIds, seed: 7, stepCap: 30, flags: { tier2Nudge: true } });
    const total = tapes.reduce((n, t) => n + recordedNudgeCount(t), 0);
    // The headline acceptance: recordable nudge count > 0 on the run path.
    expect(total).toBeGreaterThan(0);

    // Every recorded nudge is one of the three Tier-2 kinds.
    const kinds = new Set();
    for (const t of tapes) for (const s of t.steps || []) if (s.nudge) kinds.add(s.nudge.type);
    for (const k of kinds) {
      expect(['HINT_OFFER', 'TAKE_YOUR_TIME', 'TRANSFER_PROBE_QUEUED']).toContain(k);
    }
  });

  it('flags-ON: each recorded nudge matches the window of its own attempt', () => {
    const tapes = runSweep({ personaIds, seed: 7, stepCap: 30, flags: { tier2Nudge: true } });
    let checked = 0;
    for (const t of tapes) {
      for (const s of t.steps || []) {
        if (!s.nudge) continue;
        const o = s.observation;
        // Priority: long-pause > oscillation > too-fast (mirrors tier2.checkTier2).
        if ((o.latency ?? 0) >= PAUSE_THRESHOLD_MS) {
          expect(s.nudge.type).toBe('HINT_OFFER');
        } else if ((o.self_corrections ?? 0) >= OSCILLATION_THRESHOLD) {
          expect(s.nudge.type).toBe('TAKE_YOUR_TIME');
        } else if (o.too_fast_correct === true) {
          expect(s.nudge.type).toBe('TRANSFER_PROBE_QUEUED');
        }
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('advisory firewall: the banked engine-decision sequence is IDENTICAL off vs on', () => {
    // The nudge must never change the engine Decision (escalation, gating, scaffold).
    for (const pid of personaIds) {
      for (const sk of ['ADD_SAME_DEN', 'ADD_UNLIKE_NESTED', 'MULT_EQUAL_GROUPS']) {
        const off = runSession({ persona: personaById(pid), skillId: sk, seed: 7, stepCap: 30, flags: {} });
        const on = runSession({ persona: personaById(pid), skillId: sk, seed: 7, stepCap: 30, flags: { tier2Nudge: true } });
        expect(decisionKinds(on)).toEqual(decisionKinds(off));
        expect(on.terminal).toEqual(off.terminal);
      }
    }
  });

  it('a persona with a known idle window fires the nudge under the flag (off-task)', () => {
    const tape = runSession({ persona: personaById('off-task'), skillId: 'ADD_SAME_DEN', seed: 2, stepCap: 30, flags: { tier2Nudge: true } });
    // off-task emits idle signals and slow/refusal attempts → at least one nudge.
    expect(recordedNudgeCount(tape)).toBeGreaterThan(0);
  });

  it('nudge-gap detector: the dead-channel gap ("no recorded nudge") is cleared once the nudge fires', () => {
    // The nudge-gap detector has TWO reasons: "no recorded nudge" (the dead channel)
    // and "nudge fired but persona kept failing" (an ineffective-nudge gap). Wiring
    // the nudge must eliminate the FIRST reason — the dead channel — for skills where
    // a nudge now fires. (An ineffective-nudge gap is a separate, downstream lever:
    // authoring a BETTER nudge, not wiring the channel — out of T26's scope.)
    const skillIds = ['ADD_SAME_DEN', 'ADD_UNLIKE_NESTED', 'MULT_EQUAL_GROUPS'];
    const off = runSweep({ personaIds, skillIds, seed: 7, stepCap: 30, flags: {} });
    const on = runSweep({ personaIds, skillIds, seed: 7, stepCap: 30, flags: { tier2Nudge: true } });

    const gapsOff = buildBacklog(off, {}).items.filter((i) => i.category === 'nudge-gap');
    const gapsOn = buildBacklog(on, {}).items.filter((i) => i.category === 'nudge-gap');

    // OFF must have at least one nudge gap (the dead channel) for this to be meaningful.
    expect(gapsOff.length).toBeGreaterThan(0);

    // OFF: every nudge-gap item is the DEAD-channel reason (no recorded nudge).
    const offDeadChannel = gapsOff.filter((i) =>
      i.evidence.some((e) => e.nudgeRecorded === false)
    );
    expect(offDeadChannel.length).toBeGreaterThan(0);

    // ON: NO nudge-gap item is the dead-channel reason any more — every remaining
    // gap (if any) is the "nudge fired but persona kept failing" ineffective reason,
    // i.e. its evidence records a fired nudge. The channel is alive.
    const onDeadChannel = gapsOn.filter((i) =>
      i.evidence.some((e) => e.nudgeRecorded === false)
    );
    expect(onDeadChannel.length).toBe(0);
    for (const item of gapsOn) {
      expect(item.evidence.every((e) => e.nudgeRecorded === true)).toBe(true);
    }
  });
});
