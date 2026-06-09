# ADR-0003 — Stylus handwriting via an in-browser ONNX MNIST model with a geometric fallback (spanning)

## Status
Accepted (reflects what IS in the codebase).

## Context
Many lessons want a child to WRITE a numerator/denominator with a finger or stylus
on a tablet rather than tap a keypad — handwriting is the authentic transfer task.
The app is a static SPA with no backend, so digit recognition has to run entirely
in the browser, offline, and start instantly. A heavy or network-dependent model
would break the offline, tablet-on-Wi-Fi deployment and the determinism posture.

## Decision
Recognize handwritten digits in `web/src/ink/recognizer.js` with a two-tier
strategy:
1. **Primary: a tiny pretrained ONNX MNIST CNN** (`mnist-12.onnx`, ~26 KB from the
   ONNX model zoo, served at `/mnist-12.onnx`). It runs via `onnxruntime-web/wasm`
   (plain WASM build, `numThreads = 1`). The session is created lazily and NEVER
   throws — a load failure is captured (`LOAD_ERR`) so the app degrades instead of
   crashing. Strokes are rasterized to a 28×28, 20px centroid-centered box; the CNN
   reads `Input3 → Plus214_Output_0`, softmaxes, and accepts at `conf > 0.5`.
2. **Fallback: a `$P` point-cloud recognizer** (geometric template matcher:
   normalize/resample(32)/scale/translate, cloud distance + greedy match against
   `RAW_TEMPLATES`). Used when the model is unavailable or low-confidence.
3. **Multi-digit numbers** are handled by a pure segmentation pass (densify →
   occupancy histogram → whitespace cuts → `assignByCuts` → `forceSplitWide`)
   feeding per-digit recognition.
- Build glue (owned by `leftovers`): `optimizeDeps.exclude: ["onnxruntime-web"]`
  in `vite.config.js` so ort self-resolves its `.wasm`/`.mjs` siblings. Do NOT set
  `wasmPaths` and do NOT hand-stage `public/ort`.

## Consequences
- Recognition is fully client-side and offline — fits the no-backend, static-bundle
  constraint and works on a tablet over LAN.
- Segmentation is decoupled from digit identity, so it is unit-tested with the CNN
  mocked to `null` (forcing the `$P` path) — assertions are purely about group
  counts, deterministic without WASM.
- Retraining (`tools/train_mnist.py`) is ad hoc and out-of-band; the shipped model
  is a fixed artifact. (See `gotchas.md` re: the JSON-vs-ONNX export mismatch.)
- The recognizer is consumed by `Slate.jsx` / `InkPad.jsx` (lessons-rooms) gated by
  `settings.inputMode` (shell-nav), keeping a keypad path always available.
