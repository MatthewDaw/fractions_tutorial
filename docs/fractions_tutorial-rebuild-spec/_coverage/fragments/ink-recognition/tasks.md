# ink-recognition — tasks

> Slice fragment. Contributes to canonical `tasks.md`. Rebuild order + the one
> test file owned by this slice.

---

## Rebuild order

1. **Stage the model asset.** Place the pretrained ONNX-zoo `mnist-12.onnx`
   (~26 KB) at `web/public/mnist-12.onnx` so it is served at `/mnist-12.onnx`.
2. **Configure Vite for onnxruntime-web (pointer: `leftovers`/`vite.config.js`).**
   Add `optimizeDeps: { exclude: ["onnxruntime-web"] }` so ort self-resolves its
   `.wasm`/`.mjs` siblings. Do NOT set `wasmPaths`. Do NOT hand-stage `public/ort`.
3. **Build `web/src/ink/recognizer.js`:**
   - Import `* as ort from "onnxruntime-web/wasm"` (plain WASM build).
   - Set `ort.env.wasm.numThreads = 1`, `ort.env.logLevel = "error"`.
   - Fire `sessionPromise` (fetch → arrayBuffer → `InferenceSession.create`,
     `executionProviders:["wasm"]`), capturing `SESSION`/`LOAD_ERR`, never throwing.
   - `rasterize` (28×28, 20px box, centroid-centered) — §4 of design.
   - `cnnDigit` (Input3 → Plus214_Output_0, ×255, softmax conf, conf>0.5).
   - `$P` fallback: `normalizeStrokes`/`resample(32)`/`scale`/`translateToOrigin`,
     `cloudDistance`/`greedyMatch`, `RAW_TEMPLATES`, `pdollarDigit`.
   - `segment` (densify → occupancy histogram → whitespace cuts → `assignByCuts`
     → `forceSplitWide`), `recognizeDigit`, `recognizeNumber`.
   - `modelStatus`, `classifyDebug` debug probes.
4. **Wire consumers (pointer: `lessons-rooms`):** `InkPad.jsx`, `Slate.jsx` import
   `recognizeNumber`/`recognizeDigit`.
5. **Dev tooling:** `web/tools/dump-ink.mjs` (decode `ink-log.jsonl` → PNGs);
   `web/tools/train_mnist.py` (ad-hoc model retraining — see gotchas re: JSON vs
   ONNX mismatch).

## Tests owned by this slice

- `web/tests/runtime/test_recognizer_segment.test.jsx` — **segmentation tests
  only**. It `vi.mock`s `onnxruntime-web/wasm` so `InferenceSession.create`
  resolves to `null`, forcing the `$P` fallback; the assertions are purely about
  **how many digit groups** `recognizeNumber(...).digits.length` produces. Cases:
  1. "42" with a visible gap → 2 groups.
  2. "42" close together (gap too small for whitespace) → 2 groups (force-split).
  3. single wide "4" → 1 group.
  4. multi-stroke "8" (two loops + stray dot) → 1 group.
  5. three-digit "144" → 3 groups.
  Run via `npm test` (Vitest, jsdom). WHY mock the CNN: segmentation is
  independent of which digit is ultimately read, so the test is deterministic
  without the WASM model.

## Out-of-band tasks (not part of the app build/test)
- `python tools/train_mnist.py` — downloads MNIST to a temp cache, trains, exports
  a model artifact. Ad hoc; `pyproject.toml` (pointer: `leftovers`) declares no
  deps (needs `numpy` installed manually).
- `node tools/dump-ink.mjs` — inspect captured samples after drawing on a tablet.
