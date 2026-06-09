# ink-recognition — gotchas

> Slice fragment. Contributes to canonical `gotchas.md`. Non-obvious traps in the
> handwriting recognizer, model loading, and training reproduction.

---

## G-INK-1 — onnxruntime-web MUST be excluded from Vite optimizeDeps
`vite.config.js` (pointer: `leftovers`) sets `optimizeDeps: { exclude: ["onnxruntime-web"] }`.
ort ships its own `.wasm`/`.mjs` loader and resolves those siblings relative to the
served package. If Vite is allowed to pre-bundle/transform the loader, ort's
`/ort/*.mjs` requests 500. **Do NOT remove the exclude, do NOT set `wasmPaths`, and
do NOT hand-place files under `public/ort`** — the code comment mentions a
`public/ort` staging dir, but no such directory is shipped and adding one
reintroduces the bug.

## G-INK-2 — Import the `/wasm` subpath, not the default ort build
`import * as ort from "onnxruntime-web/wasm"` is deliberate. The default
(jsep/WebGPU) build fetches a separate ~26 MB `*.jsep.wasm`. The plain WASM build
uses the single small `ort-wasm-simd-threaded.wasm`. Threads are disabled
(`numThreads = 1`) because the page is not cross-origin-isolated (no
SharedArrayBuffer) — re-enabling threads without COOP/COEP headers will break.

## G-INK-3 — `train_mnist.py` does NOT produce the runtime model
The file header says it exports `mnist.json` for a "pure-JS recognizer (no runtime
ML library)". The CURRENT runtime recognizer (`recognizer.js`) instead loads the
**pretrained ONNX-zoo `mnist-12.onnx`** via onnxruntime-web. So:
- `train_mnist.py` trains a 784→128→10 MLP and writes `public/mnist.json`.
- `public/mnist.json` is **not present** in the repo and is **not loaded** by the
  app — `recognizer.js` never reads it.
- Re-running `train_mnist.py` does NOT regenerate `mnist-12.onnx`.
These are two different lineages (an earlier pure-JS MLP era vs. the current ONNX
era). To reproduce the shipped model, obtain `mnist-12` from the ONNX model zoo;
to use the Python script's output you would have to re-point `recognizer.js` at the
JSON MLP. Treat the Python tool as historical/ad-hoc, not the model's build step.

## G-INK-4 — Model I/O tensor names are graph-specific (CNTK mnist-12)
The session is fed input under the name `Input3` and reads output `Plus214_Output_0`
— these are baked into the mnist-12 (CNTK-exported) graph. Swapping in a different
ONNX digit model with different I/O names will break inference silently
(`out["Plus214_Output_0"]` becomes undefined). Also: the graph expects **raw
0..255** pixels, so the `[0,1]` rasterized grid is multiplied by `INPUT_SCALE=255`;
feeding `[0,1]` directly tanks accuracy.

## G-INK-5 — Preprocessing is the accuracy, not the model
The dominant accuracy lever is `rasterize` matching MNIST conventions (20px box,
center-of-mass centering, ~`R=1.7` thick anti-aliased strokes). Naively dumping raw
canvas pixels into the model produces poor results. Keep the centroid-shift and the
20px-inner-box scaling.

## G-INK-6 — Segmentation must keep whole strokes & split touching digits
Two opposite failure modes are both handled and must stay handled:
- A "4"/"7" crossbar reaches under the next digit. Grouping by bounding-box overlap
  merged the next digit in. Fix: cut on **whitespace bands in the horizontal ink
  projection**, and bin **whole strokes** by center-x (so the crossbar stays with
  its 4).
- Digits written touching leave no whitespace gap. Fix: `forceSplitWide` estimates
  the digit count from width (≈`0.65·H` pen-advance per numeral) and even-splits.
  The `0.65·H` constant is tuned to keep a lone wide "4"/"0" (≲0.95·H) as one digit
  while splitting a ≥1.1·H blob — changing it regresses the segmentation tests.

## G-INK-7 — `$P` fallback is transient-only
The geometric matcher exists only to cover the first-visit window while the WASM
runtime + model download. It is less accurate than the CNN. Do not assume it is the
primary path; once `SESSION` is set, `cnnDigit` wins and the fallback is unused.

## G-INK-8 — `recognizeDigit`/`recognizeNumber` are async and model-state dependent
Results can differ between the first call (fallback) and later calls (CNN) on the
same strokes. Tests that need determinism mock the ONNX runtime to force one path
(see `test_recognizer_segment.test.jsx`, which mocks `InferenceSession.create` →
`null` to assert segmentation under the fallback).

## G-INK-9 — `dump-ink.mjs` / `ink-log.jsonl` are dev-only
`ink-log.jsonl` only exists when the `/__ink` dev endpoint (pointer:
`leftovers`/`vite.config.js`) has captured samples from a tablet during
`npm run dev`. It does not exist in a production build, and `dump-ink.mjs` prints a
"draw an answer and press Check" hint when the log is empty.
