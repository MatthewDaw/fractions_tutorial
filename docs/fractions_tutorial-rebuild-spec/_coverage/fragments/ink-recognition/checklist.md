# ink-recognition — coverage checklist

Tracks every owned glob/item and where it is documented. All fragments live under
`_coverage/fragments/ink-recognition/`.

## Owned source files
- [x] `web/src/ink/recognizer.js` — entry point. Full pipeline (ONNX CNN,
  rasterize preprocessing, $P fallback, segmentation, public API, debug probes).
  → design.md §2–§7, requirements R-INK-1..7, gotchas G-INK-1..8.
- [x] `web/tools/train_mnist.py` — model training reproduction (MLP → mnist.json),
  and the JSON-vs-ONNX mismatch with the runtime model.
  → design.md §6 note, requirements R-INK-8, tasks (out-of-band), gotchas G-INK-3.
- [x] `web/tools/dump-ink.mjs` — dev ink-sample decoder (ink-log.jsonl → PNGs +
  guess/correct summary). → requirements R-INK-9, tasks, gotchas G-INK-9.
- [x] `web/public/mnist-12.onnx` — pretrained ONNX-zoo mnist-12 model asset (~26KB);
  served at `/mnist-12.onnx`; I/O `Input3`→`Plus214_Output_0`, raw 0..255.
  → design.md §3, tasks step 1, gotchas G-INK-4.
- [x] `web/tests/runtime/test_recognizer_segment.test.jsx` — segmentation tests
  (CNN mocked to null → $P path). → tasks "Tests owned by this slice".

## Cross-cutting facts captured
- [x] onnxruntime-web Vite `optimizeDeps.exclude` + no wasmPaths + no public/ort
  (pointer to `leftovers`/vite.config.js). → gotchas G-INK-1, G-INK-2.
- [x] Digits-only scope rationale. → requirements R-INK-1, design §1.
- [x] Non-blocking load + graceful fallback. → requirements R-INK-4, design §3.3.
- [x] Confidence semantics (CNN softmax / $P synthesized / number weakest-link).
  → requirements R-INK-7, design §3.4/§5.2/§7.
- [x] Consumers InkPad/Slate + Observation.recognizer_confidence (by pointer to
  `lessons-rooms` / `engine-core`). → design §8.
- [x] `/__ink` + `ink-log.jsonl` referenced ONLY by pointer to `leftovers`. → not
  re-documented; design header + gotchas G-INK-9 + requirements R-INK-9.

## Fragment files written
- design.md
- requirements.md
- tasks.md
- gotchas.md
- checklist.md (this file)

## Undocumented owned items
- None. `web/tools/ink-dump/*.png` are generated artifacts owned by `leftovers`
  (per partition), not this slice — referenced only as the output dir of
  `dump-ink.mjs`.
