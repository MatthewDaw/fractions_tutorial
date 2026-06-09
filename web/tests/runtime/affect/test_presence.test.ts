// test_presence.test.ts — Phase 4 (plan 005, S2): the presence/validity camera gate.
//
// Proves the HARD privacy requirements behaviourally:
//   • OPT-IN: no camera access (no landmarker.start) without explicit consent.
//   • Single-primary-face lock + suppression on multiple/switched faces.
//   • ONLY {present, sensor_valid} ever leave the gate — no emotion field.
//   • sensor_unavailable Signal fires on invalid readings (not attention:away).
//   • The ablation gate yields a ship/don't-ship decision DERIVED from the ledger.

import { describe, it, expect, vi } from 'vitest';
import {
  makeSession,
  hasConsent,
  derivePresence,
  presenceSignal,
  grantConsentAndStart,
  revokeConsentAndStop,
  ablationGate,
  decideAndLog,
  PRESENCE_STATE_KEYS,
  type FaceLandmarker,
  type FaceReading,
  type DetectedFace,
} from '../../../src/runtime/affect/presence.js';

// A fake on-device landmarker that records start/stop — NEVER a real camera.
function fakeLandmarker(): FaceLandmarker & { started: number; stopped: number } {
  const obj = {
    started: 0,
    stopped: 0,
    async start() {
      obj.started += 1;
    },
    async stop() {
      obj.stopped += 1;
    },
    read(): FaceReading | null {
      return null;
    },
  };
  return obj;
}

function face(over: Partial<DetectedFace> = {}): DetectedFace {
  return { id: 'child', area: 0.2, gazeAtScreen: true, ...over };
}

function reading(faces: DetectedFace[], cameraOk = true): FaceReading {
  return { faces, cameraOk };
}

// ---------------------------------------------------------------------------
// OPT-IN consent: camera is OFF until explicit consent.
// ---------------------------------------------------------------------------

describe('presence — opt-in consent gate', () => {
  it('a fresh session is unconsented with the camera OFF', () => {
    const s = makeSession();
    expect(hasConsent(s)).toBe(false);
    expect(s.cameraRunning).toBe(false);
    expect(s.phase).toBe('unconsented');
  });

  it('derivePresence NEVER reads faces without consent (present=false, sensor_valid=false)', () => {
    const s = makeSession();
    // Even handed a perfectly present face, an unconsented session reveals nothing.
    const d = derivePresence(s, reading([face({ gazeAtScreen: true })]));
    expect(d.state).toEqual({ present: false, sensor_valid: false });
    expect(d.invalidReason).toBe('unconsented');
  });

  it('the landmarker is NOT started until consent is explicitly granted', async () => {
    const lm = fakeLandmarker();
    // No start should have happened just by constructing a session.
    makeSession();
    expect(lm.started).toBe(0);

    const s = await grantConsentAndStart(makeSession(), lm);
    expect(lm.started).toBe(1);
    expect(hasConsent(s)).toBe(true);
    expect(s.cameraRunning).toBe(true);
  });

  it('revoking consent stops the camera and re-closes the gate', async () => {
    const lm = fakeLandmarker();
    let s = await grantConsentAndStart(makeSession(), lm);
    s = await revokeConsentAndStop(s, lm);
    expect(lm.stopped).toBe(1);
    expect(hasConsent(s)).toBe(false);
    expect(s.cameraRunning).toBe(false);
    // And a post-revoke read still reveals nothing.
    const d = derivePresence(s, reading([face()]));
    expect(d.state.sensor_valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// The two booleans, and ONLY the two booleans.
// ---------------------------------------------------------------------------

describe('presence — only present + sensor_valid (no emotion field)', () => {
  function consented() {
    return { ...makeSession(), phase: 'consented' as const, cameraRunning: true };
  }

  it('present=true when a single primary face is oriented at the screen', () => {
    const d = derivePresence(consented(), reading([face({ gazeAtScreen: true })]));
    expect(d.state).toEqual({ present: true, sensor_valid: true });
  });

  it('present=false (but valid) when the primary face looks away', () => {
    const d = derivePresence(consented(), reading([face({ gazeAtScreen: false })]));
    expect(d.state).toEqual({ present: false, sensor_valid: true });
  });

  it('present=false, valid=true when nobody is in frame (left the room)', () => {
    const d = derivePresence(consented(), reading([]));
    expect(d.state).toEqual({ present: false, sensor_valid: true });
  });

  it('the derived state has EXACTLY the two boolean keys — no emotion/valence/arousal', () => {
    const d = derivePresence(consented(), reading([face()]));
    expect(Object.keys(d.state).sort()).toEqual([...PRESENCE_STATE_KEYS].sort());
    const asRecord = d.state as unknown as Record<string, unknown>;
    for (const k of Object.keys(d.state)) {
      expect(typeof asRecord[k]).toBe('boolean');
    }
    // No banned channels anywhere on the state.
    const json = JSON.stringify(d.state);
    expect(json).not.toMatch(/valence|emotion|arousal|facs|expression|mood/i);
  });
});

// ---------------------------------------------------------------------------
// Single-primary-face lock.
// ---------------------------------------------------------------------------

describe('presence — single-primary-face lock', () => {
  function consented() {
    return { ...makeSession(), phase: 'consented' as const, cameraRunning: true };
  }

  it('locks the largest/nearest face when one clearly dominates', () => {
    const d = derivePresence(
      consented(),
      reading([face({ id: 'child', area: 0.30 }), face({ id: 'toy', area: 0.05 })])
    );
    expect(d.state).toEqual({ present: true, sensor_valid: true });
    expect(d.session.lockedFaceId).toBe('child');
  });

  it('suppresses (invalid) when two co-primary faces are in frame — a helping parent', () => {
    const d = derivePresence(
      consented(),
      reading([face({ id: 'child', area: 0.30 }), face({ id: 'parent', area: 0.29 })])
    );
    expect(d.state).toEqual({ present: false, sensor_valid: false });
    expect(d.invalidReason).toBe('multiple_faces');
  });

  it('invalidates when the locked face SWITCHES (parent takes over)', () => {
    const s0 = consented();
    const d1 = derivePresence(s0, reading([face({ id: 'child', area: 0.30 })]));
    expect(d1.session.lockedFaceId).toBe('child');
    // Next tick a different single face — a switch invalidates this reading.
    const d2 = derivePresence(d1.session, reading([face({ id: 'parent', area: 0.30 })]));
    expect(d2.state.sensor_valid).toBe(false);
    expect(d2.invalidReason).toBe('face_switched');
  });
});

// ---------------------------------------------------------------------------
// sensor_unavailable Signal — invalid readings do not masquerade as attention:away.
// ---------------------------------------------------------------------------

describe('presence — Signal emission (inert telemetry on the shared seam)', () => {
  function consented() {
    return { ...makeSession(), phase: 'consented' as const, cameraRunning: true };
  }
  const ctx = { t: 1000, actor: 'human' as const, context_hash: 'abc' };

  it('emits sensor_unavailable when the camera is down', () => {
    const d = derivePresence(consented(), reading([], /* cameraOk */ false));
    const sig = presenceSignal(d, ctx);
    expect(sig?.type).toBe('sensor_unavailable');
    expect(sig?.payload.reason).toBe('camera_down');
  });

  it('emits a presence signal (absent) when valid but nobody is there', () => {
    const d = derivePresence(consented(), reading([]));
    const sig = presenceSignal(d, ctx);
    expect(sig?.type).toBe('presence');
    expect(sig?.payload).toMatchObject({ present: false, sensor_valid: true });
  });

  it('emits nothing when present + valid (nothing to corroborate)', () => {
    const d = derivePresence(consented(), reading([face({ gazeAtScreen: true })]));
    expect(presenceSignal(d, ctx)).toBeNull();
  });

  it('every emitted Signal payload is free of emotion fields', () => {
    const d = derivePresence(consented(), reading([], false));
    const sig = presenceSignal(d, ctx);
    expect(JSON.stringify(sig)).not.toMatch(/valence|emotion|arousal|facs|expression|mood/i);
  });
});

// ---------------------------------------------------------------------------
// Ablation gate — the logged ship/don't-ship decision from the ledger.
// ---------------------------------------------------------------------------

describe('presence — ablation gate (ship / don\'t-ship from the ledger)', () => {
  it("SHIPs when presence measurably beats behavior-only on cost-weighted precision", () => {
    const baseline = { costWeightedPrecision: 0.60, falseInterventionCost: 18 };
    const withPresence = { costWeightedPrecision: 0.80, falseInterventionCost: 9 };
    const d = ablationGate(baseline, withPresence);
    expect(d.ship).toBe(true);
    expect(d.precisionGain).toBeCloseTo(0.20, 5);
    expect(d.falseInterventionReduction).toBe(9);
    expect(d.rationale).toMatch(/^SHIP/);
  });

  it("does NOT ship when the gain misses the bar (behavior-only is sufficient)", () => {
    const baseline = { costWeightedPrecision: 0.78, falseInterventionCost: 10 };
    const withPresence = { costWeightedPrecision: 0.79, falseInterventionCost: 10 };
    const d = ablationGate(baseline, withPresence);
    expect(d.ship).toBe(false);
    expect(d.rationale).toMatch(/DON'T SHIP/);
  });

  it("does NOT ship when presence INCREASES false-intervention cost", () => {
    const baseline = { costWeightedPrecision: 0.60, falseInterventionCost: 6 };
    const withPresence = { costWeightedPrecision: 0.90, falseInterventionCost: 12 };
    const d = ablationGate(baseline, withPresence);
    expect(d.ship).toBe(false);
  });

  it('decideAndLog logs the rationale and returns the decision', () => {
    const lines: string[] = [];
    const d = decideAndLog(
      { costWeightedPrecision: 0.6, falseInterventionCost: 18 },
      { costWeightedPrecision: 0.8, falseInterventionCost: 9 },
      (line) => lines.push(line)
    );
    expect(d.ship).toBe(true);
    expect(lines.length).toBe(1);
    expect(lines[0]).toMatch(/presence ablation/);
  });
});
