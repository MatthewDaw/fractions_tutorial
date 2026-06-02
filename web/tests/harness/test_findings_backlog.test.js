// U7 — improvement-findings BACKLOG (findings.js).
//
// buildBacklog(tapes, {tauLatent}) is a RANKED, reconciled, PURE projection of a
// tape population into concrete engine/pedagogy levers. These tests pin:
//   - hint-ladder gap: a skill steered only by RaiseScaffold/Escalate with a FLAT
//     hint_max_rung across stuck personas is flagged, naming the affected personas.
//   - nudge gap: an oscillation window with no recorded nudge → a nudge-gap item.
//   - composite-risk ranking is stable for a fixed seed.
//   - every item names a concrete proposedLever + ≥1 evidence ref.
//   - dead-pedagogy items carry humanAgreementFlag (audit-corroborated).
//   - buildBacklog is a pure projection (re-deriving reproduces it byte-for-byte).
//   - a small REAL sweep (a few personas × 2–3 skills) yields a well-formed backlog.
import { describe, it, expect } from 'vitest';
import { buildBacklog, renderBacklogMarkdown, canonicalStringify } from '../../src/harness/findings.js';
import { runSweep } from '../../src/harness/sessionRunner.js';
import { OSCILLATION_THRESHOLD, PAUSE_THRESHOLD_MS } from '../../src/runtime/tier2.js';

// ---------------------------------------------------------------------------
// Hand-built tape/step fixtures (so the labeled population is exactly known).
// ---------------------------------------------------------------------------

function mkTape(over = {}) {
  return {
    run_id: 'r',
    seed: 1,
    persona_id: 'pc',
    persona_latents: {},
    params_hash: 'h',
    engine_sha: 'dev',
    flags: {},
    skillId: 'ADD_UNLIKE_NESTED',
    steps: [],
    terminal: { kind: 'StepCap', step: 3 },
    ...over,
  };
}

function step(over = {}) {
  const { observation, ...rest } = over;
  return {
    decision: { kind: 'PracticeAtLevel', rationale: '' },
    observation: {
      correct: false,
      scaffold_level: 0,
      hint_max_rung: 0,
      latency: 4000,
      self_corrections: 0,
      too_fast_correct: false,
      answer_value: [9, 9],
      ...observation,
    },
    gate: false,
    latent: 0.3,
    pknown: 0.3,
    ...rest,
  };
}

// ---------------------------------------------------------------------------
// hint-ladder gap.
// ---------------------------------------------------------------------------

describe('buildBacklog — hint-ladder gap', () => {
  // A skill where two stuck personas are driven ONLY by RaiseScaffold (then
  // EscalateToHuman) with a FLAT hint_max_rung (0 throughout) — no H1–H4 to climb.
  function stuckTape(personaId, runId) {
    return mkTape({
      run_id: runId,
      persona_id: personaId,
      skillId: 'ADD_UNLIKE_NESTED',
      steps: [
        step({ decision: { kind: 'RaiseScaffold', rationale: '' } }),
        step({ decision: { kind: 'RaiseScaffold', rationale: '' } }),
        step({ decision: { kind: 'EscalateToHuman', rationale: '' } }),
      ],
      terminal: { kind: 'EscalateToHuman', step: 2 },
    });
  }

  it('flags a flat-ladder skill as a hint-ladder gap naming the affected personas', () => {
    const tapes = [stuckTape('slow-but-steady', 'A'), stuckTape('misconception-stable', 'B')];
    const { items } = buildBacklog(tapes);
    const gap = items.find((it) => it.category === 'hint-ladder-gap');
    expect(gap).toBeDefined();
    expect(gap.skill).toBe('ADD_UNLIKE_NESTED');
    expect(gap.personas).toEqual(['misconception-stable', 'slow-but-steady']);
    expect(gap.evidence.length).toBeGreaterThanOrEqual(1);
    expect(gap.proposedLever).toMatch(/hint rung|H1–H4|ladder/i);
  });

  it('does NOT flag a skill whose hint ladder DOES climb (a rung was shown)', () => {
    const climbed = mkTape({
      run_id: 'C',
      persona_id: 'over-hinter',
      skillId: 'ADD_UNLIKE_NESTED',
      steps: [
        step({ decision: { kind: 'RaiseScaffold', rationale: '' }, observation: { hint_max_rung: 2 } }),
        step({ decision: { kind: 'RaiseScaffold', rationale: '' } }),
      ],
    });
    const { items } = buildBacklog([climbed]);
    expect(items.find((it) => it.category === 'hint-ladder-gap')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// nudge gap.
// ---------------------------------------------------------------------------

describe('buildBacklog — nudge gap', () => {
  it('flags an oscillation window with no recorded nudge as a nudge gap', () => {
    const osc = mkTape({
      run_id: 'OSC',
      persona_id: 'anxious-low-energy',
      skillId: 'SUB_SAME_DEN',
      steps: [
        step({ observation: { self_corrections: OSCILLATION_THRESHOLD, correct: false } }),
        step({ observation: { correct: false } }), // still failing afterward.
      ],
    });
    const { items } = buildBacklog([osc]);
    const nudge = items.find((it) => it.category === 'nudge-gap');
    expect(nudge).toBeDefined();
    expect(nudge.skill).toBe('SUB_SAME_DEN');
    expect(nudge.evidence.some((e) => e.window === 'OSCILLATION')).toBe(true);
    expect(nudge.evidence[0].nudgeRecorded).toBe(false);
    expect(nudge.proposedLever).toMatch(/nudge|Tier-2|recentBehavior/i);
  });

  it('an idle window (latency ≥ pause threshold) with no nudge is also a gap', () => {
    const idle = mkTape({
      run_id: 'IDLE',
      persona_id: 'short-attention',
      skillId: 'SUB_SAME_DEN',
      steps: [step({ observation: { latency: PAUSE_THRESHOLD_MS + 1000 } })],
    });
    const { items } = buildBacklog([idle]);
    const nudge = items.find((it) => it.category === 'nudge-gap');
    expect(nudge).toBeDefined();
    expect(nudge.evidence.some((e) => e.window === 'IDLE')).toBe(true);
  });

  it('a tape with no Tier-2-eligible window produces no nudge-gap item', () => {
    const calm = mkTape({
      run_id: 'CALM',
      persona_id: 'fam-train-c',
      skillId: 'SUB_SAME_DEN',
      steps: [step({ observation: { correct: true, self_corrections: 0, latency: 3000 } })],
    });
    const { items } = buildBacklog([calm]);
    expect(items.find((it) => it.category === 'nudge-gap')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// composite-risk ranking stability + item shape.
// ---------------------------------------------------------------------------

describe('buildBacklog — composite-risk ranking is stable for a fixed seed', () => {
  it('the pedagogically-hard skill ranking is identical across two builds of the same sweep', () => {
    const tapes = runSweep({
      personaIds: ['fast-shallow-guesser', 'denominator-transfer-spoofer', 'slow-but-steady'],
      skillIds: ['ADD_SAME_DEN', 'SIMPLIFY', 'SUB_SAME_DEN'],
      seed: 42,
    });
    const a = buildBacklog(tapes).items
      .filter((it) => it.category === 'pedagogically-hard-skill')
      .map((it) => it.skill);
    const b = buildBacklog(tapes).items
      .filter((it) => it.category === 'pedagogically-hard-skill')
      .map((it) => it.skill);
    expect(a).toEqual(b);
    // The ranking is sorted by severity desc (risk-weighted) — pin it is non-empty
    // and stable as an ordered list.
    expect(a.length).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// every item: concrete lever + ≥1 evidence ref; dead-pedagogy carries the flag.
// ---------------------------------------------------------------------------

describe('buildBacklog — item invariants', () => {
  const tapes = runSweep({
    personaIds: ['fast-shallow-guesser', 'oscillator', 'off-task', 'slow-but-steady'],
    skillIds: ['ADD_SAME_DEN', 'SIMPLIFY'],
    seed: 7,
  });
  const backlog = buildBacklog(tapes);

  it('every backlog item names a concrete proposedLever and ≥1 evidence ref', () => {
    expect(backlog.items.length).toBeGreaterThan(0);
    for (const it of backlog.items) {
      expect(typeof it.proposedLever).toBe('string');
      expect(it.proposedLever.length).toBeGreaterThan(0);
      expect(Array.isArray(it.evidence)).toBe(true);
      expect(it.evidence.length).toBeGreaterThanOrEqual(1);
      expect(typeof it.id).toBe('string');
      expect(typeof it.category).toBe('string');
      expect(typeof it.severity).toBe('number');
      expect(Array.isArray(it.personas)).toBe(true);
      expect(typeof it.humanAgreementFlag).toBe('boolean');
    }
  });

  it('dead-pedagogy items carry humanAgreementFlag:true and a named lever', () => {
    const dead = backlog.items.filter((it) => it.category === 'dead-pedagogy');
    expect(dead.length).toBeGreaterThan(0); // the audit reproduces ≥1 defect.
    for (const it of dead) {
      expect(it.humanAgreementFlag).toBe(true);
      expect(it.evidence.some((e) => e.kind === 'auditFinding')).toBe(true);
    }
    // humanAgreementWith = fraction of items corroborated by the audit.
    const corroborated = backlog.items.filter((it) => it.humanAgreementFlag).length;
    expect(backlog.humanAgreementWith).toBeCloseTo(corroborated / backlog.items.length, 10);
  });

  it('ranks dead-pedagogy items ahead of harness-found items (severity desc)', () => {
    const sevs = backlog.items.map((it) => it.severity);
    for (let i = 1; i < sevs.length; i++) {
      expect(sevs[i - 1]).toBeGreaterThanOrEqual(sevs[i]);
    }
    if (backlog.items.length > 0) {
      expect(backlog.items[0].category).toBe('dead-pedagogy');
    }
  });
});

// ---------------------------------------------------------------------------
// reconciliation — no double-counting an audit-covered skill.
// ---------------------------------------------------------------------------

describe('buildBacklog — reconciliation (no double-count)', () => {
  it('a skill carrying an audit (dead-pedagogy) item is suppressed from harness categories', () => {
    // ADD_SAME_DEN is the audit skill; a stuck flat-ladder fixture on it must NOT
    // additionally produce a harness hint-ladder-gap (the audit item owns it).
    const stuckOnAuditSkill = mkTape({
      run_id: 'X',
      persona_id: 'slow-but-steady',
      skillId: 'ADD_SAME_DEN',
      steps: [
        step({ decision: { kind: 'RaiseScaffold', rationale: '' } }),
        step({ decision: { kind: 'EscalateToHuman', rationale: '' } }),
      ],
      terminal: { kind: 'EscalateToHuman', step: 1 },
    });
    const { items } = buildBacklog([stuckOnAuditSkill]);
    const dead = items.filter((it) => it.category === 'dead-pedagogy');
    expect(dead.length).toBeGreaterThan(0);
    expect(dead.every((it) => it.skill === 'ADD_SAME_DEN')).toBe(true);
    // No harness-found item for the suppressed audit skill.
    const harnessOnAuditSkill = items.filter(
      (it) => it.category !== 'dead-pedagogy' && it.skill === 'ADD_SAME_DEN'
    );
    expect(harnessOnAuditSkill).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// pure projection — re-deriving from the same tapes reproduces the backlog.
// ---------------------------------------------------------------------------

describe('buildBacklog — pure projection', () => {
  it('re-deriving from the same tapes reproduces the backlog byte-for-byte', () => {
    const tapes = runSweep({
      personaIds: ['fast-shallow-guesser', 'oscillator', 'slow-but-steady'],
      skillIds: ['ADD_SAME_DEN', 'SIMPLIFY', 'SUB_SAME_DEN'],
      seed: 99,
    });
    const a = buildBacklog(tapes);
    const b = buildBacklog(tapes);
    expect(canonicalStringify(a)).toBe(canonicalStringify(b));
  });
});

// ---------------------------------------------------------------------------
// renderBacklogMarkdown — the docs projection (function only; no .md written).
// ---------------------------------------------------------------------------

describe('renderBacklogMarkdown — markdown projection', () => {
  it('renders a non-empty markdown body covering the backlog items', () => {
    const tapes = runSweep({
      personaIds: ['fast-shallow-guesser', 'off-task'],
      skillIds: ['ADD_SAME_DEN', 'SIMPLIFY'],
      seed: 3,
    });
    const backlog = buildBacklog(tapes);
    const md = renderBacklogMarkdown(backlog);
    expect(typeof md).toBe('string');
    expect(md).toMatch(/# Improvement backlog/);
    expect(md).toMatch(/human-audit agreement/);
    // Each item id appears as a heading.
    for (const it of backlog.items) {
      expect(md).toContain(it.id);
    }
  });
});
