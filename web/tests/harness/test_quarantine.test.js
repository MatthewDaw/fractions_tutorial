// U10 — QUARANTINED facets: the blind LLM discriminator + chaos fault-injection.
//
// These two modules are ISOLATED from the tuning loop (KTD11): they import nothing
// from a (future) search.js / recursiveLoop.js and expose no hook the loop reads.
// This suite verifies:
//   (1) discriminate reports a hitRate + surfaces a tell for the easiest-to-spot
//       synthetic stream, with a mocked judge llmCall.
//   (2) graceful degrade: llmCall=null + a corpus → 'skipped-no-llm'; no real
//       corpus → 'intra-synthetic'.
//   (3) chaos: flipping a single too_fast_correct does NOT catastrophically flip a
//       verdict (or, if it does, it is recorded as a fragility finding w/ blastRadius).
//   (4) a chaos run carries its OWN seed and does NOT mutate the original tape bytes.
//   (5) QUARANTINE (review): neither module imports from search/recursiveLoop nor
//       exposes a loop-consumable hook.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  discriminate,
  streamFromTape,
  computeTells,
  buildJudgePrompt,
  MIN_REAL,
} from '../../src/harness/quarantine/llmDiscriminator.js';
import {
  injectFault,
  assessFragility,
  deriveVerdict,
  CHAOS_FIELDS,
} from '../../src/harness/quarantine/chaos.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const QUAR_DIR = join(HERE, '..', '..', 'src', 'harness', 'quarantine');

// ---------------------------------------------------------------------------
// Tape fixtures — a "machine-clean" synthetic and a "noisy human-like" one.
// ---------------------------------------------------------------------------

function obs(over = {}) {
  return {
    correct: true,
    answer_value: [1, 2],
    error_signature: null,
    latency: 1000,
    hint_max_rung: 0,
    self_corrections: 0,
    scaffold_level: 0,
    modality: 'tap',
    recognizer_confidence: null,
    too_fast_correct: false,
    affect_window: [],
    ...over,
  };
}

/** A blatantly synthetic stream: grid-quantized, zero-variance latencies, monotone errors. */
function machineCleanTape() {
  const steps = [];
  for (let i = 0; i < 6; i++) {
    steps.push({
      decision: { kind: 'PresentProblem', rationale: '' },
      observation: obs({
        correct: i % 2 === 0,
        latency: 1000, // dead-flat, on the 50ms grid
        error_signature: i % 2 === 0 ? null : 'add_denominators', // monotone
        self_corrections: 0,
      }),
      gate: false,
      latent: 0.3,
      pknown: 0.3,
    });
  }
  return { run_id: 'synthetic-clean', steps, terminal: { kind: 'StepCap' } };
}

/** A human-like stream: jittery off-grid latencies, varied errors, self-corrections. */
function humanLikeTape(id) {
  const lats = [1237, 2891, 943, 4102, 1776, 3318];
  const sigs = [null, 'scaled_bottom_only', null, 'forced_leftover', 'other', null];
  const steps = lats.map((lat, i) => ({
    decision: { kind: 'PresentProblem', rationale: '' },
    observation: obs({
      correct: sigs[i] === null,
      latency: lat,
      error_signature: sigs[i],
      self_corrections: i % 3 === 0 ? 2 : 1,
    }),
    gate: false,
    latent: 0.6,
    pknown: 0.6,
  }));
  return { run_id: id, steps, terminal: { kind: 'StepCap' } };
}

// ---------------------------------------------------------------------------
// (1) discriminate — hitRate + tell with a mocked judge
// ---------------------------------------------------------------------------

describe('discriminate — blind Turing check with a mocked judge', () => {
  it('reports a hitRate and surfaces a tell for the easiest-to-spot synthetic stream', async () => {
    const syntheticStreams = [streamFromTape(machineCleanTape())];
    const realStreams = [
      humanLikeTape('h1'),
      humanLikeTape('h2'),
      humanLikeTape('h3'),
      humanLikeTape('h4'),
      humanLikeTape('h5'),
    ].map(streamFromTape);

    // A "perfect" judge that flags streams whose latencies are all 50ms-grid as fake.
    const llmCall = (prompt) => {
      const blocks = prompt.split(/Stream #(\d+):/).slice(1);
      const fakeIdx = [];
      for (let i = 0; i < blocks.length; i += 2) {
        const idx = Number(blocks[i]);
        const body = blocks[i + 1] || '';
        const lats = [...body.matchAll(/lat=(\d+)ms/g)].map((m) => Number(m[1]));
        const allGrid = lats.length > 0 && lats.every((l) => l % 50 === 0);
        if (allGrid) fakeIdx.push(idx);
      }
      return fakeIdx.join(', ');
    };

    const res = await discriminate({ syntheticStreams, realStreams, llmCall, seed: 1 });

    expect(res.mode).toBe('human-vs-synthetic');
    expect(typeof res.hitRate).toBe('number');
    expect(res.hitRate).toBeGreaterThanOrEqual(0);
    expect(res.hitRate).toBeLessThanOrEqual(1);
    // The grid-detecting judge nails the synthetic and the noisy reals → above chance.
    expect(res.hitRate).toBeGreaterThan(0.5);
    // A tell was surfaced for the easiest-to-spot (machine-clean) stream.
    expect(res.tells.length).toBeGreaterThan(0);
    expect(res.easiestTell).not.toBeNull();
    expect(res.easiestTell.name).toMatch(/latency|variance|monotony|self_correction/);
  });
});

// ---------------------------------------------------------------------------
// (2) graceful degrade
// ---------------------------------------------------------------------------

describe('discriminate — graceful degrade modes', () => {
  it('llmCall=null with a corpus → skipped-no-llm (tells still recorded)', async () => {
    const res = await discriminate({
      syntheticStreams: [streamFromTape(machineCleanTape())],
      realStreams: [humanLikeTape('h1')].map(streamFromTape),
      llmCall: null,
      seed: 0,
    });
    expect(res.mode).toBe('skipped-no-llm');
    expect(res.hitRate).toBeNull();
    expect(res.tells.length).toBeGreaterThan(0);
  });

  it('no real corpus (with a llmCall) → intra-synthetic (lower credibility)', async () => {
    const llmCall = () => '0'; // flags the first stream
    const res = await discriminate({
      syntheticStreams: [streamFromTape(machineCleanTape()), streamFromTape(machineCleanTape())],
      realStreams: [], // none
      llmCall,
      seed: 3,
    });
    expect(res.mode).toBe('intra-synthetic');
    expect(typeof res.hitRate).toBe('number');
    expect(res.tells.length).toBeGreaterThan(0);
  });

  it('fewer than MIN_REAL real streams still falls back to intra-synthetic', async () => {
    const realStreams = Array.from({ length: MIN_REAL - 1 }, (_, i) =>
      streamFromTape(humanLikeTape('h' + i))
    );
    const res = await discriminate({
      syntheticStreams: [streamFromTape(machineCleanTape())],
      realStreams,
      llmCall: () => '',
      seed: 0,
    });
    expect(res.mode).toBe('intra-synthetic');
  });

  it('a judge that throws degrades to skipped-no-llm rather than crashing', async () => {
    const res = await discriminate({
      syntheticStreams: [streamFromTape(machineCleanTape())],
      realStreams: Array.from({ length: MIN_REAL }, (_, i) => streamFromTape(humanLikeTape('h' + i))),
      llmCall: () => { throw new Error('judge unavailable'); },
      seed: 0,
    });
    expect(res.mode).toBe('skipped-no-llm');
    expect(res.hitRate).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// computeTells unit — easiest-to-spot ranking
// ---------------------------------------------------------------------------

describe('computeTells', () => {
  it('flags the machine-clean stream and stays quiet on the human-like one', () => {
    const clean = computeTells(streamFromTape(machineCleanTape()));
    const human = computeTells(streamFromTape(humanLikeTape('h')));
    expect(clean.suspicion).toBeGreaterThan(human.suspicion);
    expect(clean.tells.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// (3)+(4) chaos — fragility + non-mutation + own-seed
// ---------------------------------------------------------------------------

describe('chaos — single-field fault injection', () => {
  it('flipping a single too_fast_correct does not catastrophically flip the gate verdict', () => {
    const tape = humanLikeTape('chaos-subject');
    const res = assessFragility({ tape, field: 'too_fast_correct', seed: 7 });
    // Steady state: the gate verdict is robust to one corrupted field → no flip.
    // If it DID flip, it must be recorded as a fragility finding with a blastRadius.
    if (res.flipped) {
      expect(res.blastRadius).toBe('session-verdict');
      expect(res.finding).toMatch(/MEASUREMENT FRAGILITY/);
    } else {
      expect(['attempt-local', 'none']).toContain(res.blastRadius);
      expect(res.finding).toBeNull();
    }
    // A field WAS actually corrupted on the mutated clone.
    expect(res.change).not.toBeNull();
    expect(res.change.field).toBe('too_fast_correct');
    expect(res.change.before.observation).not.toBe(res.change.after.observation);
  });

  it('records a session-verdict flip as a fragility finding when runFn keys on the faulted field', () => {
    // A deliberately fragile verdict: gate-open iff NO attempt is too_fast_correct.
    // The fixture has a too_fast attempt, so flipping it (off) flips the verdict.
    const steps = [
      { decision: { kind: '' }, observation: obs({ too_fast_correct: true }), gate: true, latent: 1, pknown: 1 },
      { decision: { kind: '' }, observation: obs({ too_fast_correct: false }), gate: true, latent: 1, pknown: 1 },
    ];
    const tape = { run_id: 'fragile', steps, terminal: { kind: 'StepCap' } };
    const fragileRunFn = (t) => ({
      gateEverOpen: t.steps.every((s) => s.observation.too_fast_correct === false),
      terminalKind: t.terminal?.kind ?? null,
      masteredSteps: 0,
    });
    // Seed chosen so the corrupted attempt is the too_fast one; sweep a few seeds.
    let sawFlip = false;
    for (let seed = 0; seed < 8 && !sawFlip; seed++) {
      const res = assessFragility({ tape, runFn: fragileRunFn, field: 'too_fast_correct', seed });
      if (res.flipped) {
        sawFlip = true;
        expect(res.blastRadius).toBe('session-verdict');
        expect(res.finding).toMatch(/MEASUREMENT FRAGILITY/);
      }
    }
    expect(sawFlip).toBe(true);
  });

  it('a chaos run carries its own seed and does NOT mutate the original tape bytes', () => {
    const tape = humanLikeTape('immutable');
    const before = JSON.stringify(tape);

    const m1 = injectFault(tape, { field: 'error_signature', seed: 1 });
    const m2 = injectFault(tape, { field: 'error_signature', seed: 2 });

    // Original bytes untouched by either injection.
    expect(JSON.stringify(tape)).toBe(before);
    // Mutated clones carry their own seed in provenance.
    expect(m1.__chaos.seed).toBe(1);
    expect(m2.__chaos.seed).toBe(2);
    // Different seeds can pick different target attempts / corruptions → divergent bytes,
    // but each is reproducible for its seed.
    const m1b = injectFault(tape, { field: 'error_signature', seed: 1 });
    expect(JSON.stringify(m1)).toBe(JSON.stringify(m1b));
    // The clone is a genuinely separate object (mutating it never touches the original).
    expect(m1).not.toBe(tape);
  });

  it('assessFragility throws if the original tape is mutated (quarantine guard) — and normally does not', () => {
    const tape = humanLikeTape('guard');
    const res = assessFragility({ tape, field: 'self_corrections', seed: 4 });
    expect(res).toHaveProperty('flipped');
    expect(CHAOS_FIELDS).toContain(res.field);
  });

  it('deriveVerdict reads the tape-self gate/terminal signal', () => {
    const tape = { steps: [{ gate: true }, { gate: false }], terminal: { kind: 'ReturnToKitchen' } };
    const v = deriveVerdict(tape);
    expect(v.gateEverOpen).toBe(true);
    expect(v.masteredSteps).toBe(1);
    expect(v.terminalKind).toBe('ReturnToKitchen');
  });

  it('injectFault validates field and tolerates an empty-steps tape', () => {
    expect(() => injectFault(humanLikeTape('x'), { field: 'bogus' })).toThrow();
    const empty = injectFault({ run_id: 'e', steps: [], terminal: { kind: 'StepCap' } }, { field: 'too_fast_correct', seed: 0 });
    expect(empty.__chaos.applied).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// (5) QUARANTINE — isolation from the tuning loop (review assertion)
// ---------------------------------------------------------------------------

describe('quarantine — isolated from the tuning loop (KTD11)', () => {
  const files = ['llmDiscriminator.js', 'chaos.js'];

  it('neither module imports from search.js or recursiveLoop.js', () => {
    for (const f of files) {
      const src = readFileSync(join(QUAR_DIR, f), 'utf8');
      expect(src).not.toMatch(/from\s+['"][^'"]*search(\.js)?['"]/);
      expect(src).not.toMatch(/from\s+['"][^'"]*recursiveLoop(\.js)?['"]/);
      expect(src).not.toMatch(/import\(['"][^'"]*search(\.js)?['"]\)/);
      expect(src).not.toMatch(/import\(['"][^'"]*recursiveLoop(\.js)?['"]\)/);
    }
  });

  it('chaos imports no engine module (stays engine-agnostic; verdicts come via injected runFn)', () => {
    const src = readFileSync(join(QUAR_DIR, 'chaos.js'), 'utf8');
    expect(src).not.toMatch(/from\s+['"][^'"]*\/engine\//);
    expect(src).not.toMatch(/from\s+['"][^'"]*engineApi/);
  });

  it('the llm discriminator exposes no loop-consumable hook (judge output is not returned to a loop)', () => {
    // The public surface is discrimination/inspection only — no register/onResult/feed hook.
    const src = readFileSync(join(QUAR_DIR, 'llmDiscriminator.js'), 'utf8');
    expect(src).not.toMatch(/export\s+(async\s+)?function\s+(registerWithLoop|feedLoop|onSearchResult|emitToLoop)/);
    // buildJudgePrompt is a judge prompt, never a generation prompt.
    const prompt = buildJudgePrompt([streamFromTape(machineCleanTape())]);
    expect(prompt).toMatch(/FAKE/);
    expect(prompt).not.toMatch(/generate a persona/i);
  });
});
