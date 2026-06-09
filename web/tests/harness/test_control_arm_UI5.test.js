// UI5 — Static control-arm tests.
import { describe, it, expect } from 'vitest';
import {
  runSession,
  runSweep,
  runArmComparison,
} from '../../src/harness/sessionRunner.js';
import {
  buildArmComparison,
  renderArmComparisonMarkdown,
} from '../../src/harness/report.js';
import { personaById } from '../../src/harness/personas/library.js';

function freshPersona(id) { return personaById(id); }

function countDecision(tape, kind) {
  return (tape.steps || []).filter((s) => s.decision && s.decision.kind === kind).length;
}

function scaffoldLevels(tape) {
  return (tape.steps || [])
    .map((s) => s.observation ? s.observation.scaffold_level : null)
    .filter((x) => x !== null);
}

// (A) Arm separation
describe('control arm UI5 — arm separation', () => {
  it('adaptive arm has arm=adaptive', () => {
    const tape = runSession({ persona: freshPersona('fast-mastery'), skillId: 'ADD_SAME_DEN', seed: 1, stepCap: 5, controlArm: false });
    expect(tape.arm).toBe('adaptive');
  });

  it('static arm has arm=static', () => {
    const tape = runSession({ persona: freshPersona('fast-mastery'), skillId: 'ADD_SAME_DEN', seed: 1, stepCap: 5, controlArm: true });
    expect(tape.arm).toBe('static');
  });

  it('static arm: scaffold stays at 0 throughout', () => {
    const persona = freshPersona('fast-mastery');
    persona.latent.truePknownBySkill = { ADD_SAME_DEN: 0.95 };
    persona.latent.pSlip = 0.0;
    persona.latent.hintAppetite = 0;
    const tape = runSession({ persona, skillId: 'ADD_SAME_DEN', seed: 1, stepCap: 30, controlArm: true });
    const levels = scaffoldLevels(tape);
    for (const l of levels) { expect(l).toBe(0); }
  });

  it('static arm with startScaffold=2: scaffold stays at 2', () => {
    const tape = runSession({ persona: freshPersona('slow-but-steady'), skillId: 'ADD_SAME_DEN', seed: 5, stepCap: 20, controlArm: true, startScaffold: 2 });
    const levels = scaffoldLevels(tape);
    for (const l of levels) { expect(l).toBe(2); }
  });

  it('adaptive arm: if FadeScaffold fires, max scaffold > 0', () => {
    const persona = freshPersona('fast-mastery');
    persona.latent.truePknownBySkill = { ADD_SAME_DEN: 0.95 };
    persona.latent.pSlip = 0.0;
    persona.latent.hintAppetite = 0;
    const tape = runSession({ persona, skillId: 'ADD_SAME_DEN', seed: 1, stepCap: 30, controlArm: false });
    const fades = countDecision(tape, 'FadeScaffold');
    const levels = scaffoldLevels(tape);
    if (fades > 0 && levels.length > 0) {
      expect(Math.max(...levels)).toBeGreaterThan(0);
    }
  });
});

// (B) Default arm
describe('control arm UI5 — default arm tag', () => {
  it('runSession default is adaptive', () => {
    const tape = runSession({ persona: freshPersona('fast-mastery'), skillId: 'ADD_SAME_DEN', seed: 1, stepCap: 5 });
    expect(tape.arm).toBe('adaptive');
  });
});

// (C) Determinism
describe('control arm UI5 — determinism', () => {
  it('static arm is deterministic', () => {
    const args = { skillId: 'ADD_SAME_DEN', seed: 42, stepCap: 15, controlArm: true };
    const t1 = runSession({ ...args, persona: freshPersona('oscillator') });
    const t2 = runSession({ ...args, persona: freshPersona('oscillator') });
    expect(t1.steps.length).toBe(t2.steps.length);
    for (let i = 0; i < t1.steps.length; i++) {
      expect(t1.steps[i].decision.kind).toBe(t2.steps[i].decision.kind);
    }
  });
});

// (D) buildArmComparison
describe('control arm UI5 — buildArmComparison', () => {
  function runCmp() {
    const { adaptiveTapes, staticTapes, seed } = runArmComparison({
      personaIds: ['fast-mastery', 'slow-but-steady'],
      skillIds: ['ADD_SAME_DEN'],
      seed: 1,
      stepCap: 20,
    });
    return buildArmComparison(adaptiveTapes, staticTapes, { seed });
  }

  it('has required top-level fields', () => {
    const cmp = runCmp();
    expect(typeof cmp.n_adaptive).toBe('number');
    expect(typeof cmp.n_static).toBe('number');
    expect(Array.isArray(cmp.deltas)).toBe(true);
    expect(cmp.arm_separation).toBeDefined();
    // UI5 structural-unreachability field
    expect('static_gate_structurally_unreachable' in cmp).toBe(true);
    expect(typeof cmp.static_gate_structurally_unreachable).toBe('boolean');
  });

  it('tape counts match', () => {
    const cmp = runCmp();
    expect(cmp.n_adaptive).toBe(2);
    expect(cmp.n_static).toBe(2);
  });

  it('deltas has 5 entries', () => {
    const cmp = runCmp();
    expect(cmp.deltas.length).toBe(5);
  });

  it('each delta has required fields', () => {
    const cmp = runCmp();
    for (const d of cmp.deltas) {
      expect(typeof d.metric).toBe('string');
      expect(typeof d.higherIsBetter).toBe('boolean');
      expect('adaptive' in d).toBe(true);
      expect('static' in d).toBe(true);
      expect('delta' in d).toBe(true);
      expect('adaptationHelps' in d).toBe(true);
    }
  });

  it('arm_separation has morph-decision counts', () => {
    const cmp = runCmp();
    expect(typeof cmp.arm_separation.adaptive_fades).toBe('number');
    expect(typeof cmp.arm_separation.static_fades).toBe('number');
  });

  it('static arm final scaffold is 0', () => {
    const cmp = runCmp();
    const s = cmp.arm_separation.static_avg_final_scaffold;
    if (s !== null) { expect(s).toBe(0); }
  });

  it('renderArmComparisonMarkdown returns markdown with required sections', () => {
    const md = renderArmComparisonMarkdown(runCmp());
    expect(typeof md).toBe('string');
    expect(md).toContain('Adaptive UI vs static');
    expect(md).toContain('Arm separation');
    expect(md).toContain('Outcome deltas');
    expect(md).toContain('Interpretation');
  });
});

// (E) Positive control
describe('control arm UI5 — positive control', () => {
  it('strong persona gates in adaptive arm', () => {
    const persona = freshPersona('fast-mastery');
    persona.latent.truePknownBySkill = { ADD_SAME_DEN: 0.98 };
    persona.latent.pSlip = 0.0;
    persona.latent.hintAppetite = 0;
    const tape = runSession({ persona, skillId: 'ADD_SAME_DEN', seed: 1, stepCap: 40 });
    expect(tape.steps.some((s) => s.gate === true)).toBe(true);
  });

  it('runArmComparison produces same tape count in both arms', () => {
    const { adaptiveTapes, staticTapes } = runArmComparison({
      personaIds: ['fast-mastery'],
      skillIds: ['ADD_SAME_DEN', 'SIMPLIFY'],
      seed: 7,
      stepCap: 30,
    });
    expect(adaptiveTapes.length).toBe(staticTapes.length);
  });
});

// (F) runSweep threading
describe('control arm UI5 — runSweep threading', () => {
  it('controlArm:true tags all tapes static', () => {
    const tapes = runSweep({ personaIds: ['fast-mastery'], skillIds: ['ADD_SAME_DEN'], seed: 1, stepCap: 10, controlArm: true });
    expect(tapes.length).toBeGreaterThan(0);
    for (const t of tapes) { expect(t.arm).toBe('static'); }
  });

  it('default (no controlArm) tags all tapes adaptive', () => {
    const tapes = runSweep({ personaIds: ['fast-mastery'], skillIds: ['ADD_SAME_DEN'], seed: 1, stepCap: 10 });
    expect(tapes.length).toBeGreaterThan(0);
    for (const t of tapes) { expect(t.arm).toBe('adaptive'); }
  });
});
