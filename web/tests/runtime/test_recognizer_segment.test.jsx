import { describe, it, expect, vi } from 'vitest';

// Mock the ONNX runtime so recognizeNumber falls back to the geometric matcher.
// These tests assert SEGMENTATION (how many digit groups the strokes split into),
// which is independent of which digit the CNN/fallback ultimately reads.
vi.mock('onnxruntime-web/wasm', () => ({
  env: { wasm: {}, logLevel: 'error' },
  InferenceSession: { create: vi.fn(async () => null) },
  Tensor: vi.fn(),
}));

const { recognizeNumber } = await import('../../src/ink/recognizer.js');

const groups = async (strokes) => (await recognizeNumber(strokes)).digits.length;

// Roughly 50px-tall digits, ~30px wide, typical of a child writing in one box.
const FOUR = [
  [[24, 8], [6, 40], [44, 40]],   // diagonal + crossbar (reaches right edge)
  [[36, 8], [36, 64]],            // right vertical bar
];
// A "2" placed just right of the 4, separated by a small whitespace gap.
const twoAt = (dx) => [
  [[6 + dx, 18], [26 + dx, 12], [32 + dx, 28], [10 + dx, 50], [6 + dx, 64], [40 + dx, 64]],
];

describe('recognizer segmentation — two-digit answers in one box', () => {
  it('splits "42" written with a visible gap into two digits', async () => {
    expect(await groups([...FOUR, ...twoAt(56)])).toBe(2);
  });

  it('splits "42" written close together (gap too small for whitespace) into two', async () => {
    expect(await groups([...FOUR, ...twoAt(46)])).toBe(2);
  });

  it('keeps a single wide digit (4) as one group', async () => {
    expect(await groups(FOUR)).toBe(1);
  });

  it('keeps a single multi-stroke digit as one group', async () => {
    // an "8" as two stacked loops, plus a stray dot inside — one numeral
    const eight = [
      [[24, 8], [12, 16], [20, 28], [32, 22], [24, 8]],
      [[24, 28], [10, 42], [22, 60], [38, 46], [24, 28]],
    ];
    expect(await groups(eight)).toBe(1);
  });

  it('handles a three-digit number (144) as three groups', async () => {
    const one = [[[10, 8], [10, 64]]];
    const fourA = [[[34, 8], [22, 40], [54, 40]], [[46, 8], [46, 64]]];
    const fourB = [[[78, 8], [66, 40], [98, 40]], [[90, 8], [90, 64]]];
    expect(await groups([...one, ...fourA, ...fourB])).toBe(3);
  });
});
