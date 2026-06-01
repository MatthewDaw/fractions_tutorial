// test_observation.test.ts — U2: Observation pipeline tests.
//
// Tests:
//   1. A burst with correct submit → one Observation with correct fields.
//   2. hint_max_rung reflects the highest hint_shown; H0 when none.
//   3. Oscillation (place→remove→place) → self_corrections ≥ 1.
//   4. Wrong 2/7+3/7→5/14 → error_signature="add_denominators".
//   5. Wrong 1/2+1/3→2/5 → error_signature="add_across_unlike".
//   6. too_fast_correct: correct answer below the latency floor is flagged.
//   7. Segmentation: two consecutive attempts → exactly two Observations (no bleed).
//   8. handwriting modality → non-null recognizer_confidence; tap → null.
//   9. latency = submit.t − present.t.
//  10. affect_window is always an empty array (stub, firewall).

import { describe, it, expect } from 'vitest';
import { segment, classifyErrorSignature } from '../../src/engine/observation.js';
import type { Event, Action } from '../../src/engine/types.js';
import { PARAMS } from '../../src/engine/params.js';

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function action(
  type: string,
  t: number,
  payload: Record<string, unknown> = {},
  modality: Action['modality'] = 'tap'
): Action {
  return { type, payload, modality, t, actor: 'human' };
}

function signal(type: string, t: number): Event {
  return { type, payload: {}, confidence: 0.8, t, actor: 'human' };
}

/**
 * Build a minimal one-attempt event burst.
 */
function makeBurst({
  presentT = 1000,
  submitT = 3500,
  judgedT = 3600,
  correct = true,
  slip = null as string | null,
  answerNum = 5,
  answerDen = 8,
  targetNum = 5,
  targetDen = 8,
  operands = null as null | readonly (readonly [number, number])[],
  scaffoldLevel = 2 as 0 | 1 | 2 | 3 | 4,
  modality = 'tap' as Action['modality'],
  hintRungs = [] as number[],
  places = 0,
  removes = 0,
  recognizerConfidence = null as number | null,
}: {
  presentT?: number;
  submitT?: number;
  judgedT?: number;
  correct?: boolean;
  slip?: string | null;
  answerNum?: number;
  answerDen?: number;
  targetNum?: number;
  targetDen?: number;
  operands?: readonly (readonly [number, number])[] | null;
  scaffoldLevel?: 0 | 1 | 2 | 3 | 4;
  modality?: Action['modality'];
  hintRungs?: number[];
  places?: number;
  removes?: number;
  recognizerConfidence?: number | null;
} = {}): Event[] {
  const events: Event[] = [];

  events.push(action('problem_present', presentT, { scaffold_level: scaffoldLevel }, modality));

  // place/remove oscillation
  for (let i = 0; i < Math.max(places, removes); i++) {
    if (i < places) events.push(action('piece_place', presentT + 50 + i * 10));
    if (i < removes) events.push(action('piece_remove', presentT + 55 + i * 10));
  }

  // hints
  for (const rung of hintRungs) {
    events.push(action('hint_shown', presentT + 100, { rung }));
  }

  const submitPayload: Record<string, unknown> = {
    num: answerNum,
    den: answerDen,
  };
  if (modality === 'handwriting' && recognizerConfidence !== null) {
    submitPayload['recognizer_confidence'] = recognizerConfidence;
  }
  events.push(action('answer_submit', submitT, submitPayload, modality));

  const judgedPayload: Record<string, unknown> = {
    correct,
    answer_num: answerNum,
    answer_den: answerDen,
    target_num: targetNum,
    target_den: targetDen,
  };
  if (slip) judgedPayload['slip'] = slip;
  if (operands) judgedPayload['operands'] = operands;

  events.push(action('judged', judgedT, judgedPayload));

  return events;
}

// ---------------------------------------------------------------------------
// 1. Basic correct burst
// ---------------------------------------------------------------------------

describe('segment — basic correct burst', () => {
  it('produces exactly one Observation per attempt', () => {
    const log = makeBurst({ correct: true });
    const obs = segment(log);
    expect(obs).toHaveLength(1);
  });

  it('correct=true is set correctly', () => {
    const obs = segment(makeBurst({ correct: true }));
    expect(obs[0].correct).toBe(true);
  });

  it('scaffold_level comes from the present event', () => {
    const obs = segment(makeBurst({ scaffoldLevel: 3 }));
    expect(obs[0].scaffold_level).toBe(3);
  });

  it('answer_value is [answerNum, answerDen]', () => {
    const obs = segment(makeBurst({ answerNum: 5, answerDen: 8 }));
    expect(obs[0].answer_value).toEqual([5, 8]);
  });
});

// ---------------------------------------------------------------------------
// 2. Latency = submit.t − present.t
// ---------------------------------------------------------------------------

describe('segment — latency', () => {
  it('latency = submitT − presentT', () => {
    const obs = segment(makeBurst({ presentT: 1000, submitT: 3500 }));
    expect(obs[0].latency).toBe(2500);
  });

  it('falls back to judgedT − presentT when submit is missing', () => {
    // Build a burst without answer_submit
    const events: Event[] = [
      action('problem_present', 1000, { scaffold_level: 1 }),
      action('judged', 4000, { correct: true, answer_num: 3, answer_den: 4 }),
    ];
    const obs = segment(events);
    expect(obs).toHaveLength(1);
    expect(obs[0].latency).toBe(3000);
  });
});

// ---------------------------------------------------------------------------
// 3. hint_max_rung
// ---------------------------------------------------------------------------

describe('segment — hint_max_rung', () => {
  it('H0 when no hint events', () => {
    const obs = segment(makeBurst({ hintRungs: [] }));
    expect(obs[0].hint_max_rung).toBe(0);
  });

  it('reflects the highest hint rung shown', () => {
    const obs = segment(makeBurst({ hintRungs: [1, 3, 2] }));
    expect(obs[0].hint_max_rung).toBe(3);
  });

  it('single hint rung', () => {
    const obs = segment(makeBurst({ hintRungs: [2] }));
    expect(obs[0].hint_max_rung).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 4. Self-corrections from place/remove oscillation
// ---------------------------------------------------------------------------

describe('segment — self_corrections', () => {
  it('0 when no place/remove events', () => {
    const obs = segment(makeBurst());
    expect(obs[0].self_corrections).toBe(0);
  });

  it('place→remove counts as 1 correction', () => {
    const events: Event[] = [
      action('problem_present', 1000, { scaffold_level: 2 }),
      action('piece_place', 1100),
      action('piece_remove', 1200),
      action('answer_submit', 2000, { num: 3, den: 4 }),
      action('judged', 2100, { correct: true, answer_num: 3, answer_den: 4 }),
    ];
    const obs = segment(events);
    expect(obs[0].self_corrections).toBeGreaterThanOrEqual(1);
  });

  it('place→remove→place counts ≥ 1 correction (oscillation)', () => {
    const events: Event[] = [
      action('problem_present', 1000, { scaffold_level: 2 }),
      action('piece_place', 1100),
      action('piece_remove', 1200),
      action('piece_place', 1300),
      action('answer_submit', 2000, { num: 3, den: 4 }),
      action('judged', 2100, { correct: true, answer_num: 3, answer_den: 4 }),
    ];
    const obs = segment(events);
    expect(obs[0].self_corrections).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// 5. error_signature
// ---------------------------------------------------------------------------

describe('classifyErrorSignature', () => {
  it('add_denominators: 2/7 + 3/7 → 5/14 (sameBottom slip)', () => {
    const sig = classifyErrorSignature(
      'sameBottom',
      5, 14,
      5, 7,
      [[2, 7], [3, 7]]
    );
    expect(sig).toBe('add_denominators');
  });

  it('add_denominators: structural match na+nb / da+db with LIKE denominators', () => {
    // 2/5 + 1/5 → 3/10 (adds both tops AND bottoms; denominators are equal → add_denominators)
    const sig = classifyErrorSignature(
      null,
      3, 10,
      3, 5,
      [[2, 5], [1, 5]]
    );
    expect(sig).toBe('add_denominators');
  });

  it('add_across_unlike: structural match na+nb / da+db with UNLIKE denominators', () => {
    // 1/2 + 1/4 → 2/6 (adds straight across when denominators are unlike)
    const sig = classifyErrorSignature(
      null,
      2, 6,
      3, 4,
      [[1, 2], [1, 4]]
    );
    expect(sig).toBe('add_across_unlike');
  });

  it('add_across_unlike: 1/2 + 1/3 → 2/5', () => {
    const sig = classifyErrorSignature(
      'sameBottom',
      2, 5,
      5, 6,
      [[1, 2], [1, 3]]
    );
    expect(sig).toBe('add_across_unlike');
  });

  it('not_simplified: notSimplified slip', () => {
    const sig = classifyErrorSignature('notSimplified', 6, 8, 3, 4, null);
    expect(sig).toBe('not_simplified');
  });

  it('forced_leftover: leftoverOnly slip', () => {
    const sig = classifyErrorSignature('leftoverOnly', 7, 4, 14, 4, null);
    expect(sig).toBe('forced_leftover');
  });

  it('null (no signature) for null slip and no structural match', () => {
    const sig = classifyErrorSignature(null, 3, 5, 3, 5, null);
    expect(sig).toBeNull();
  });
});

describe('segment — error_signature from judged payload', () => {
  it('correct answer → error_signature is null', () => {
    const obs = segment(makeBurst({ correct: true }));
    expect(obs[0].error_signature).toBeNull();
  });

  it('sameBottom slip with operands → add_denominators', () => {
    const obs = segment(makeBurst({
      correct: false,
      slip: 'sameBottom',
      answerNum: 5,
      answerDen: 14,
      targetNum: 5,
      targetDen: 7,
      operands: [[2, 7], [3, 7]],
    }));
    expect(obs[0].error_signature).toBe('add_denominators');
  });

  it('sameBottom slip 1/2+1/3→2/5 → add_across_unlike', () => {
    const obs = segment(makeBurst({
      correct: false,
      slip: 'sameBottom',
      answerNum: 2,
      answerDen: 5,
      targetNum: 5,
      targetDen: 6,
      operands: [[1, 2], [1, 3]],
    }));
    expect(obs[0].error_signature).toBe('add_across_unlike');
  });
});

// ---------------------------------------------------------------------------
// 6. too_fast_correct
// ---------------------------------------------------------------------------

describe('segment — too_fast_correct', () => {
  it('flagged when correct and latency < latencyFloorMs', () => {
    const fastLatency = PARAMS.latencyFloorMs - 100;
    const obs = segment(makeBurst({
      correct: true,
      presentT: 1000,
      submitT: 1000 + fastLatency,
    }));
    expect(obs[0].too_fast_correct).toBe(true);
  });

  it('not flagged when latency ≥ latencyFloorMs', () => {
    const slowLatency = PARAMS.latencyFloorMs + 500;
    const obs = segment(makeBurst({
      correct: true,
      presentT: 1000,
      submitT: 1000 + slowLatency,
    }));
    expect(obs[0].too_fast_correct).toBe(false);
  });

  it('not flagged for incorrect answers even if fast', () => {
    const obs = segment(makeBurst({
      correct: false,
      slip: 'wrongValue',
      presentT: 1000,
      submitT: 1100,
    }));
    expect(obs[0].too_fast_correct).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 7. Segmentation — two attempts → exactly two Observations
// ---------------------------------------------------------------------------

describe('segment — two consecutive attempts', () => {
  it('produces exactly two Observations', () => {
    const attempt1 = makeBurst({ presentT: 1000, submitT: 3000, judgedT: 3100, answerNum: 3, answerDen: 4 });
    const attempt2 = makeBurst({ presentT: 5000, submitT: 7000, judgedT: 7100, answerNum: 5, answerDen: 6 });
    const log = [...attempt1, ...attempt2];
    const obs = segment(log);
    expect(obs).toHaveLength(2);
  });

  it('no bleed between attempts (each latency is independent)', () => {
    const attempt1 = makeBurst({ presentT: 1000, submitT: 3000, judgedT: 3100 });
    const attempt2 = makeBurst({ presentT: 5000, submitT: 6500, judgedT: 6600 });
    const log = [...attempt1, ...attempt2];
    const obs = segment(log);
    expect(obs[0].latency).toBe(2000); // 3000 − 1000
    expect(obs[1].latency).toBe(1500); // 6500 − 5000
  });
});

// ---------------------------------------------------------------------------
// 8. Modality & recognizer_confidence
// ---------------------------------------------------------------------------

describe('segment — modality and recognizer_confidence', () => {
  it('tap modality → recognizer_confidence is null', () => {
    const obs = segment(makeBurst({ modality: 'tap' }));
    expect(obs[0].modality).toBe('tap');
    expect(obs[0].recognizer_confidence).toBeNull();
  });

  it('handwriting modality → recognizer_confidence is non-null', () => {
    const obs = segment(makeBurst({
      modality: 'handwriting',
      recognizerConfidence: 0.92,
    }));
    expect(obs[0].modality).toBe('handwriting');
    expect(obs[0].recognizer_confidence).not.toBeNull();
    expect(obs[0].recognizer_confidence).toBeGreaterThanOrEqual(0);
    expect(obs[0].recognizer_confidence).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// 9. affect_window is always the empty stub (affect firewall)
// ---------------------------------------------------------------------------

describe('segment — affect_window firewall', () => {
  it('affect_window is always an empty array regardless of Signal events', () => {
    // Mix in some affect Signals.
    const events: Event[] = [
      action('problem_present', 1000, { scaffold_level: 2 }),
      signal('affect_idle', 1500),
      signal('affect_distracted', 2000),
      action('answer_submit', 3000, { num: 3, den: 4 }),
      signal('affect_calm', 3100),
      action('judged', 3200, { correct: true, answer_num: 3, answer_den: 4 }),
    ];
    const obs = segment(events);
    expect(obs).toHaveLength(1);
    expect(obs[0].affect_window).toEqual([]);
    expect(obs[0].affect_window).toHaveLength(0);
  });

  it('affect_window has type readonly never[] (cannot be mutated)', () => {
    const obs = segment(makeBurst({ correct: true }));
    // TypeScript should infer this as readonly never[] — runtime check
    expect(Array.isArray(obs[0].affect_window)).toBe(true);
    expect(obs[0].affect_window).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 10. Empty log and no-attempt log
// ---------------------------------------------------------------------------

describe('segment — edge cases', () => {
  it('empty log → empty Observation array', () => {
    expect(segment([])).toHaveLength(0);
  });

  it('log with only Signals → empty Observation array', () => {
    const log: Event[] = [
      signal('affect_idle', 1000),
      signal('affect_calm', 2000),
    ];
    expect(segment(log)).toHaveLength(0);
  });

  it('problem_present without matching judged → no Observation', () => {
    const log: Event[] = [
      action('problem_present', 1000, { scaffold_level: 1 }),
      action('answer_submit', 2000, { num: 3, den: 4 }),
      // no 'judged' event
    ];
    expect(segment(log)).toHaveLength(0);
  });
});
