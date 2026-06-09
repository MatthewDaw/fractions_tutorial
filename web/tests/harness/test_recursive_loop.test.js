// U9 — the recursive improvement loop with a SEALED held-out judge.
//
// Asserts the verdict machinery end-to-end on SMALL families/seeds (runs in a few
// seconds):
//   (1) a change that helps TRAIN but NOT the sealed held-out → GAMING (overfit /
//       auto-revert intent).
//   (2) a change that helps BOTH families and leaves the guardrail (transfer-on-
//       novel-forms) intact → REAL.
//   (3) the canonical no-op (002's inert flags) → NO_CHANGE.
//   (4) a previously-passing persona that regresses after the change is FLAGGED.
//   (5) a change that degrades the guardrail → GAMING even if held-out "improved".
//   (6) distillChampions freezes N replayable fixtures; replayChampions goes
//       "regressed" when a deliberately weakened latent is applied and "clean" on
//       revert.
//   (7) decisionLogEntry pins params_hash BEFORE + AFTER and the verdict (the
//       U11/U13 consume-contract).
//
// The synthetic changes are modeled with the perturbMetrics TEST HOOK — a direct,
// family-targeted metric delta standing in for "002 wired a flag" — because 002's
// flags are inert today (an inert flag changes nothing; runLoop would read NO_CHANGE).

import { describe, it, expect } from 'vitest';
import {
  runLoop,
  distillChampions,
  replayChampions,
} from '../../src/harness/recursiveLoop.js';
import { searchNearestFlip } from '../../src/harness/search.js';

const SKILLS = ['ADD_SAME_DEN'];
const STEP_CAP = 18;
const TAU = 0.8;

// ---------------------------------------------------------------------------
// perturbMetrics helpers — synthesize the AFTER record from the BEFORE record.
// Returns a plain object (runLoop only READS the target/guardrail fields off it).
// ---------------------------------------------------------------------------

/** Lower false_mastery_rate for ONLY the named family (the rest passes through). */
function helpsFamilyOnly(targetFamily, drop = 0.5) {
  return ({ record, family }) => {
    const data = record.toJSON ? record.toJSON() : { ...record };
    if (family === targetFamily) {
      data.false_mastery_rate = Math.max(0, (data.false_mastery_rate ?? 0) - drop);
    }
    return data;
  };
}

/** Lower false_mastery_rate for BOTH families (a genuine improvement). */
function helpsBoth(drop = 0.5) {
  return ({ record }) => {
    const data = record.toJSON ? record.toJSON() : { ...record };
    data.false_mastery_rate = Math.max(0, (data.false_mastery_rate ?? 0) - drop);
    return data;
  };
}

/** Helps held-out fm BUT degrades the guardrail (transfer_after_fade ↓). */
function helpsButBreaksGuardrail(drop = 0.5) {
  return ({ record, family }) => {
    const data = record.toJSON ? record.toJSON() : { ...record };
    data.false_mastery_rate = Math.max(0, (data.false_mastery_rate ?? 0) - drop);
    if (family === 'heldOut') {
      // crater transfer-on-novel-forms so the guardrail trips.
      data.transfer_after_fade = -1; // strictly below any non-negative before-value.
    }
    return data;
  };
}

// ---------------------------------------------------------------------------
// (1) GAMING — helps train only.
// ---------------------------------------------------------------------------

describe('runLoop — sealed held-out judge separates REAL from GAMING', () => {
  it('a change that helps TRAIN but NOT held-out → GAMING (overfit)', () => {
    const verdict = runLoop({
      change: { id: 'train-only-overfit', flags: { fluencyHardMode: true }, perturbMetrics: helpsFamilyOnly('train') },
      seed: 3,
      skillIds: SKILLS,
      stepCap: STEP_CAP,
      tauLatent: TAU,
    });

    expect(verdict.verdict).toBe('GAMING');
    // train moved the right way…
    expect(verdict.trainDelta.false_mastery_rate.improvement).toBeGreaterThan(0);
    // …but the sealed judge did not.
    expect(verdict.heldOutDelta.netImprovement).toBeLessThanOrEqual(1e-9);
    expect(verdict.decisionLogEntry.verdict).toBe('GAMING');
  });

  // -------------------------------------------------------------------------
  // (2) REAL — helps both, guardrail intact.
  // -------------------------------------------------------------------------
  it('a change that helps BOTH families with guardrail intact → REAL', () => {
    const verdict = runLoop({
      change: { id: 'genuine-improvement', flags: { fluencyHardMode: true }, perturbMetrics: helpsBoth() },
      seed: 3,
      skillIds: SKILLS,
      stepCap: STEP_CAP,
      tauLatent: TAU,
    });

    expect(verdict.verdict).toBe('REAL');
    expect(verdict.heldOutDelta.false_mastery_rate.improvement).toBeGreaterThan(0);
    expect(verdict.guardrail.degraded).toBe(false);
    expect(verdict.decisionLogEntry.verdict).toBe('REAL');
  });

  // -------------------------------------------------------------------------
  // (3) NO_CHANGE — the inert canonical 002 flags.
  // -------------------------------------------------------------------------
  it('the canonical inert 002 flags move neither family → NO_CHANGE', () => {
    const verdict = runLoop({
      // canonical change: flags-off → flags-on, NO perturbMetrics (inert today).
      change: { id: 'plan-002-flags', flags: { fluencyHardMode: true, frustrationScaffold: true, delayedProbe: true, unifiedTaxonomy: true } },
      seed: 3,
      skillIds: SKILLS,
      stepCap: STEP_CAP,
      tauLatent: TAU,
    });

    expect(verdict.verdict).toBe('NO_CHANGE');
    expect(verdict.trainDelta.netImprovement).toBe(0);
    expect(verdict.heldOutDelta.netImprovement).toBe(0);
  });

  // -------------------------------------------------------------------------
  // (5) guardrail tripwire — helps held-out fm BUT degrades novel-form transfer.
  // -------------------------------------------------------------------------
  it('a change that helps fm but degrades the guardrail → GAMING', () => {
    const verdict = runLoop({
      change: { id: 'breaks-guardrail', flags: { fluencyHardMode: true }, perturbMetrics: helpsButBreaksGuardrail() },
      seed: 3,
      skillIds: SKILLS,
      stepCap: STEP_CAP,
      tauLatent: TAU,
    });

    expect(verdict.guardrail.degraded).toBe(true);
    expect(verdict.verdict).toBe('GAMING');
  });

  // -------------------------------------------------------------------------
  // (4) regression flagging — a previously-passing persona that fails after.
  // -------------------------------------------------------------------------
  it('flags a previously-passing persona that regresses after the change', () => {
    // We craft a change whose AFTER tapes BREAK one held-out persona's pass state by
    // injecting a false-mastery label on its tapes. The change hook here mutates the
    // AFTER tapes' steps directly (a stand-in for "the wired flag broke this child").
    const breakOnePersona = ({ tapes }) => {
      for (const tape of tapes) {
        if (tape.persona_id === 'fam-held-bimodal') {
          // force a gate-open while latent < τ on the first step → false mastery.
          if (tape.steps[0]) {
            tape.steps[0].gate = true;
            tape.steps[0].latent = 0.1; // below τ
          }
        }
      }
      return null; // metrics untouched here; regression reads the tapes.
    };

    const verdict = runLoop({
      change: {
        id: 'regression-injector',
        flags: { fluencyHardMode: true },
        // perturbMetrics is called per-family AFTER tapes are built; we use it as a
        // tape-mutation hook (it receives { record, family } — but we close over the
        // AFTER tapes via the loop's heldOutAfter). Simpler: use perturbTapes below.
        perturbMetrics: helpsBoth(), // keep verdict REAL so we isolate the regression flag
        perturbTapes: breakOnePersona,
      },
      seed: 3,
      skillIds: SKILLS,
      stepCap: STEP_CAP,
      tauLatent: TAU,
    });

    expect(verdict.regressions).toContain('fam-held-bimodal');
  });
});

// ---------------------------------------------------------------------------
// (6) champion distillation + replay.
// ---------------------------------------------------------------------------

describe('distillChampions + replayChampions — frozen CI regression fixtures', () => {
  it('distills N replayable champions from a search corpus and replays them', () => {
    // Surface a real adversary via the search (a deliberately weak baseline that the
    // engine over-credits). Keep generations small so this stays fast.
    const WEAK = {
      id: 'weak-baseline',
      klass: 'red-team:weak',
      latent: { truePknownDefault: 0.2, learnRate: 0.01, pSlip: 0.1, pGuess: 0.2, misconceptionStrength: 0.7, hintAppetite: 0.05 },
      meta: { approximates: 'a low-knowledge guesser', mightMiss: 'n/a' },
    };
    const found = searchNearestFlip({
      baseSpec: WEAK, skillId: 'ADD_SAME_DEN', objective: 'falseMastery',
      seed: 4, generations: 5, mu: 3, lambda: 8, stepCap: 30, tauLatent: TAU,
    });
    expect(found.found).toBe(true);

    // Build a small corpus (the champion + a couple box draws) → distill N=2.
    const corpus = [
      { latent: found.latent, seed: found.seed, flip: true, flipKind: 'falseMastery', distance: found.distanceToHonest, run_id: 'champ-0', tuples: [] },
      { latent: { ...found.latent, truePknownDefault: 0.05 }, seed: found.seed + 1, flip: true, flipKind: 'falseMastery', distance: 0.9, run_id: 'champ-1', tuples: [] },
    ];
    const fixtures = distillChampions({ searchResults: corpus, n: 2, skillId: 'ADD_SAME_DEN', tauLatent: TAU });
    expect(fixtures.length).toBe(2);
    for (const fx of fixtures) {
      expect(fx.skillId).toBe('ADD_SAME_DEN');
      expect(typeof fx.seed).toBe('number');
      expect(fx.latent).toBeDefined();
    }

    // Replay the frozen champion → it still beats the engine (regressed = the
    // adversary reproduces its false-mastery flip).
    const replay = replayChampions(fixtures, { stepCap: 30, tauLatent: TAU });
    expect(replay.regressed).toBe(true);
    expect(replay.falseMasteryRate).toBeGreaterThan(0);
  });

  it('goes "regressed" on a weakened latent and "clean" on a robust revert', () => {
    // A weakened (low-knowledge, guessy) latent reproduces a false-mastery flip.
    const weakened = {
      id: 'champion-weak',
      source: 'search',
      skillId: 'ADD_SAME_DEN',
      latent: { truePknownDefault: 0.25, learnRate: 0.02, pSlip: 0.1, pGuess: 0.45, misconceptionStrength: 0.7, hintAppetite: 0.05 },
      seed: 7,
      flip: true,
      tauLatent: TAU,
    };
    const weakReplay = replayChampions([weakened], { stepCap: 30, tauLatent: TAU });
    expect(weakReplay.regressed).toBe(true);

    // The "revert": a robust master latent — the engine crediting it is HONEST, so
    // no false-mastery flip → clean.
    const robust = {
      ...weakened,
      id: 'champion-robust',
      latent: { truePknownDefault: 0.99, learnRate: 0.3, pSlip: 0.0, pGuess: 0.0, misconceptionStrength: 0.0, hintAppetite: 0.0 },
    };
    const cleanReplay = replayChampions([robust], { stepCap: 30, tauLatent: TAU });
    expect(cleanReplay.regressed).toBe(false);
    expect(cleanReplay.falseMasteryRate).toBe(0);
  });

  it('distills worst tapes from a raw sweep when no search ran', () => {
    // Fabricate two tapes: one with a false-mastery gate-open, one clean.
    const badTape = {
      run_id: 'r-bad', seed: 1, persona_id: 'p-bad', persona_latents: { truePknownDefault: 0.2 },
      skillId: 'ADD_SAME_DEN',
      steps: [{ decision: { kind: 'Hold' }, observation: { correct: false }, gate: true, latent: 0.1, pknown: 0.96 }],
      terminal: { kind: 'StepCap', step: 1 },
    };
    const goodTape = {
      run_id: 'r-good', seed: 1, persona_id: 'p-good', persona_latents: { truePknownDefault: 0.9 },
      skillId: 'ADD_SAME_DEN',
      steps: [{ decision: { kind: 'Hold' }, observation: { correct: true }, gate: true, latent: 0.95, pknown: 0.96 }],
      terminal: { kind: 'StepCap', step: 1 },
    };
    const fixtures = distillChampions({ sweepTapes: [goodTape, badTape], n: 1, tauLatent: TAU });
    expect(fixtures.length).toBe(1);
    expect(fixtures[0].persona_id).toBe('p-bad'); // the worst tape ranked first.
  });
});

// ---------------------------------------------------------------------------
// (8) T07 guardrail_degraded WARNING — independent of the REAL/GAMING/NO_CHANGE
//     verdict.  A NO_CHANGE run where the held-out guardrail drops must surface
//     the warning; a run with no drop must not.
// ---------------------------------------------------------------------------

describe('guardrail_degraded warning (T07 gap) — independent of verdict', () => {
  /** Drop the held-out guardrail (transfer_after_fade) by a large margin while
   *  leaving all TARGET metrics (false_mastery_rate, transfer_after_fade used for
   *  improvement) unchanged on the train family. The trick: we only crater the
   *  guardrail on heldOut but do NOT move false_mastery_rate on either family, so
   *  the held-out net-improvement is 0 and the train net-improvement is 0 → verdict
   *  would naturally be NO_CHANGE — but the drop should still emit a warning. */
  function onlyCratersGuardrail() {
    // perturbMetrics receives { record, family, tapes, role }. We only touch
    // transfer_after_fade on the heldOut AFTER run, producing a deliberate 0.8→0.0
    // collapse that far exceeds GUARDRAIL_WARN_THRESHOLD (0.05).
    return ({ record, family }) => {
      const data = record.toJSON ? record.toJSON() : { ...record };
      if (family === 'heldOut') {
        // Crater transfer_after_fade so the held-out guardrail reading collapses.
        data.transfer_after_fade = Math.max(0, (data.transfer_after_fade ?? 0) - 0.8);
      }
      return data;
    };
  }

  it('(8a) NO_CHANGE+guardrail-drop → warnings includes guardrail_degraded', () => {
    // We need the verdict to be NO_CHANGE: neither false_mastery_rate nor
    // transfer_after_fade (on the improvement axis) should move. We accomplish that
    // by ONLY changing transfer_after_fade on heldOut AND ensuring the held-out
    // net-improvement is not positive (crashing transfer = negative improvement → net
    // is negative → heldOutImproved = false, and trainMoved = false → NO_CHANGE).
    const result = runLoop({
      change: {
        id: 'silent-guardrail-drop',
        flags: {},
        perturbMetrics: onlyCratersGuardrail(),
      },
      seed: 3,
      skillIds: SKILLS,
      stepCap: STEP_CAP,
      tauLatent: TAU,
    });

    // The verdict must be NO_CHANGE (target metrics didn't improve on either family).
    expect(result.verdict).toBe('NO_CHANGE');
    // The warning MUST fire despite the NO_CHANGE verdict.
    expect(result.warnings).toBeDefined();
    const guardWarn = result.warnings.find((w) => w.kind === 'guardrail_degraded');
    expect(guardWarn).toBeDefined();
    expect(guardWarn.before).toBeGreaterThan(guardWarn.after);
    expect(guardWarn.drop).toBeGreaterThan(0.05); // exceeds GUARDRAIL_WARN_THRESHOLD
    // The warning carries before/after values so the caller can report them.
    expect(typeof guardWarn.before).toBe('number');
    expect(typeof guardWarn.after).toBe('number');
  });

  it('(8b) NO_CHANGE+no-guardrail-drop → warnings is empty', () => {
    // The canonical inert 002 flags: neither family moves, guardrail is unchanged.
    const result = runLoop({
      change: {
        id: 'plan-002-flags-no-drop',
        flags: { fluencyHardMode: true, frustrationScaffold: true },
      },
      seed: 3,
      skillIds: SKILLS,
      stepCap: STEP_CAP,
      tauLatent: TAU,
    });

    expect(result.verdict).toBe('NO_CHANGE');
    expect(result.warnings).toBeDefined();
    expect(result.warnings).toHaveLength(0);
  });

  it('(8c) GAMING+guardrail-drop → warning still fires independent of verdict', () => {
    // A change that helps both fm + craters the guardrail → verdict is GAMING (guardrail
    // degraded), AND the warning should also fire.
    const result = runLoop({
      change: {
        id: 'gaming-plus-guardrail-drop',
        flags: { fluencyHardMode: true },
        perturbMetrics: helpsButBreaksGuardrail(0.5),
      },
      seed: 3,
      skillIds: SKILLS,
      stepCap: STEP_CAP,
      tauLatent: TAU,
    });

    expect(result.verdict).toBe('GAMING');
    expect(result.guardrail.degraded).toBe(true);
    // Warning fires independently of the verdict.
    const guardWarn = result.warnings.find((w) => w.kind === 'guardrail_degraded');
    expect(guardWarn).toBeDefined();
  });

  it('(8d) REAL verdict with no guardrail drop → warnings is empty', () => {
    // A genuine improvement where the guardrail holds → no warning.
    const result = runLoop({
      change: {
        id: 'genuine-no-guardrail-drop',
        flags: { fluencyHardMode: true },
        perturbMetrics: helpsBoth(0.5),
      },
      seed: 3,
      skillIds: SKILLS,
      stepCap: STEP_CAP,
      tauLatent: TAU,
    });

    expect(result.verdict).toBe('REAL');
    expect(result.guardrail.degraded).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// (7) decisionLogEntry contract (U11/U13 consume this).
// ---------------------------------------------------------------------------

describe('decisionLogEntry — pins both param hashes + the verdict', () => {
  it('pins params_hash_before, params_hash_after, engine_sha and verdict', () => {
    const verdict = runLoop({
      change: {
        id: 'attributed-change',
        flags: { fluencyHardMode: true },
        perturbMetrics: helpsBoth(),
        paramsAfter: { gateThreshold: 0.96 }, // a post-change PARAMS snapshot (attribution).
        engineSha: 'abc1234',
      },
      seed: 3,
      skillIds: SKILLS,
      stepCap: STEP_CAP,
      tauLatent: TAU,
    });

    const e = verdict.decisionLogEntry;
    expect(e.change).toBe('attributed-change');
    expect(typeof e.params_hash_before).toBe('string');
    expect(typeof e.params_hash_after).toBe('string');
    // A change carrying an explicit post-change PARAMS snapshot → after-hash differs.
    expect(e.params_hash_after).not.toBe(e.params_hash_before);
    expect(e.engine_sha).toBe('abc1234');
    expect(e.verdict).toBe('REAL');
  });

  it('is deterministic — same change + seed → identical verdict + log entry', () => {
    const args = {
      change: { id: 'det', flags: { fluencyHardMode: true }, perturbMetrics: helpsBoth() },
      seed: 3,
      skillIds: SKILLS,
      stepCap: STEP_CAP,
      tauLatent: TAU,
    };
    const a = runLoop(args);
    const b = runLoop(args);
    expect(b.verdict).toBe(a.verdict);
    expect(b.decisionLogEntry).toEqual(a.decisionLogEntry);
    expect(b.heldOutDelta).toEqual(a.heldOutDelta);
  });
});
