// U1 — replay determinism + canonical tape + seeded RNG (plan U1 test scenarios).
import { describe, it, expect } from 'vitest';
import {
  canonicalStringify,
  serializeSession,
  tapesToJsonl,
  jsonlToTapes,
  hashObject,
} from '../../src/harness/tape.js';
import { personaRng } from '../../src/harness/rng.js';
import { paramsHash } from '../../src/harness/config.js';

describe('canonical tape serialization', () => {
  it('is key-order independent (canonical)', () => {
    const a = { b: 1, a: 2, nested: { y: 1, x: 2 } };
    const b = { a: 2, nested: { x: 2, y: 1 }, b: 1 };
    expect(canonicalStringify(a)).toBe(canonicalStringify(b));
  });

  it('fixes float precision so equivalent numbers serialize identically', () => {
    const a = { p: 0.1 + 0.2 }; // 0.30000000000000004
    const b = { p: 0.3 };
    expect(canonicalStringify(a)).toBe(canonicalStringify(b));
  });

  it('round-trips a session tape through JSONL', () => {
    const session = {
      run_id: 'run-1',
      seed: 1,
      persona_id: 'guesser',
      steps: [{ decision: 'FadeScaffold', gate: false, latent: 0.4 }],
    };
    const [back] = jsonlToTapes(tapesToJsonl([session]));
    expect(back).toEqual(session);
  });

  it('two serializations of the same session are byte-identical', () => {
    const s = { run_id: 'r', seed: 7, steps: [{ a: 1 }, { a: 2 }] };
    expect(serializeSession(s)).toBe(serializeSession({ ...s }));
  });
});

describe('personaRng', () => {
  it('is pure and order-sensitive: same inputs → same stream', () => {
    const r1 = personaRng('guesser', 5, 0);
    const r2 = personaRng('guesser', 5, 0);
    const a = [r1(), r1(), r1()];
    const b = [r2(), r2(), r2()];
    expect(a).toEqual(b);
  });

  it('differs across persona / seed / step', () => {
    const base = personaRng('guesser', 5, 0)();
    expect(personaRng('memorizer', 5, 0)()).not.toBe(base);
    expect(personaRng('guesser', 6, 0)()).not.toBe(base);
    expect(personaRng('guesser', 5, 1)()).not.toBe(base);
  });
});

describe('params hash (attribution, read-only)', () => {
  it('is a stable hex string and order-independent over the same object', () => {
    expect(paramsHash()).toMatch(/^[0-9a-f]{8}$/);
    expect(hashObject({ a: 1, b: 2 })).toBe(hashObject({ b: 2, a: 1 }));
  });

  it('changes when a param value changes', () => {
    expect(hashObject({ gateThreshold: 0.95 })).not.toBe(
      hashObject({ gateThreshold: 0.9 })
    );
  });
});
