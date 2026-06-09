// T08 / plan-002 U1 activation — the harness `fluencyOk-always-true` finding is now
// RESOLVABLE: present under the reversible default-off rollback, RESOLVED once the
// calibrated hard-mode flag is on. This is the acceptance the improvement doc names:
// "Harness fluencyOk-always-true finding flips to resolved on held-out."
//
// docs/improvements/2026-06-08-activate-fluency-hardmode.md.
import { describe, it, expect } from 'vitest';
import { runExpectedFindings } from '../../src/harness/oracle/expectedFindings.js';

function fluencyFinding(result) {
  return result.findings.find((f) => f.id === 'fluencyOk-always-true');
}

describe('fluencyOk-always-true — resolvable via the calibrated, reversible flag', () => {
  it('PRESENT under the reversible default-off rollback (soft gate restored)', () => {
    const off = runExpectedFindings({ flags: { fluencyHardMode: false } });
    const f = fluencyFinding(off);
    expect(f.present).toBe(true);
    // The raw spoof still passes soft fluency (reversibility = the defect returns).
    expect(f.evidence.fluencyOkOnImplausibleStat.passes).toBe(true);
  });

  it('RESOLVED once fluencyHardMode is on AND the age band is calibrated', () => {
    const on = runExpectedFindings({ flags: { fluencyHardMode: true } });
    const f = fluencyFinding(on);
    expect(f.present).toBe(false);
    // Both manifestations are now closed:
    //   (1) the implausibly-fast tape gate no longer opens under hard mode.
    expect(f.evidence.gateOpenAtImplausibleLatency).toBeNull();
    //   (2) the raw 200ms spoof stat fails hard-mode fluency.
    expect(f.evidence.fluencyOkOnImplausibleStat.passes).toBe(false);
  });

  it('the finding still names fluencyHardMode as the resolving flag', () => {
    const on = runExpectedFindings({ flags: { fluencyHardMode: true } });
    expect(fluencyFinding(on).flagThatResolves).toBe('fluencyHardMode');
  });

  it('toggling the flag is a clean on/off (no hysteresis across runs)', () => {
    expect(fluencyFinding(runExpectedFindings({ flags: { fluencyHardMode: true } })).present).toBe(false);
    expect(fluencyFinding(runExpectedFindings({ flags: { fluencyHardMode: false } })).present).toBe(true);
    expect(fluencyFinding(runExpectedFindings({ flags: { fluencyHardMode: true } })).present).toBe(false);
  });
});
