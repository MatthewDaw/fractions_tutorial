# ink-recognition — requirements

> Slice fragment. Contributes to canonical `requirements.md`. RFC-2119 +
> Given/When/Then for the on-device handwritten-digit recognizer.

---

## R-INK-1 — Digits-only scope
The recognizer **MUST** recognize only the numerals `0–9`. It **MUST NOT** attempt
to recognize the fraction bar, `+`, `=`, or any operator/layout — these are
printed by the UI and never drawn. The public surface returns digit characters and
numeric text only.

*WHY:* keeps the problem 1-D (left-to-right digits) with no expression parser.

## R-INK-2 — Fully on-device and offline
Recognition **MUST** run entirely in the browser with no backend call. The model
(`public/mnist-12.onnx`) and the onnxruntime-web WASM **MUST** be served as static
assets. There **MUST** be no network dependency at recognition time.

## R-INK-3 — Public API surface
The module **MUST** export exactly these async recognition functions plus debug
probes:
- `recognizeDigit(strokes) -> Promise<{ digit:"0".."9"|null, conf:number, confident:boolean }>`
- `recognizeNumber(strokes, opts?) -> Promise<{ text:string, digits:Array, conf:number, confident:boolean }>`
- `modelStatus() -> { ready:boolean, error:string|null }` (debug)
- `classifyDebug(strokes, scale) -> { scale, top, ascii } | { err }` (debug)

`strokes` is `Array<Array<[x,y]>>` in any consistent pixel space; the module
normalizes internally.

## R-INK-4 — Non-blocking model load with graceful fallback
- **Given** the page just loaded and the ONNX session is not yet ready,
  **When** `recognizeDigit`/`recognizeNumber` is called,
  **Then** the call **MUST** fall back to the `$P` geometric matcher and return a
  result without blocking (it MUST NOT await the session or hang the pad).
- **Given** the model fails to load,
  **Then** the failure **MUST** be captured (`LOAD_ERR`, console warn) and **MUST
  NOT** throw; the `$P` fallback **MUST** continue serving recognitions.

## R-INK-5 — MNIST-faithful preprocessing
Before inference the recognizer **MUST** rasterize strokes to a 28×28 grid that
matches MNIST conventions: white ink on black, scaled into a ~20px box preserving
aspect ratio, and **centered by center-of-mass** at (14,14). Pixels fed to the
mnist-12 graph **MUST** be in the raw `0..255` range (grid × `INPUT_SCALE`=255).

*WHY:* preprocessing fidelity — not model choice — is the dominant accuracy lever.

## R-INK-6 — Multi-digit segmentation
`recognizeNumber` **MUST** split a single-box multi-digit scribble into individual
digit groups left-to-right and recognize each.
- **Given** "42" written with a visible whitespace gap,
  **Then** it **MUST** split into 2 groups (whitespace-band cut in the horizontal
  ink projection).
- **Given** "42" written close together with no gap,
  **Then** the width-based `forceSplitWide` fallback **MUST** still split it into 2.
- **Given** a single wide digit (e.g. a "4" whose crossbar reaches the next
  column), **Then** it **MUST** remain a single group.
- **Given** a multi-stroke single digit (e.g. an "8" as two loops plus a stray
  dot), **Then** it **MUST** remain one group.
Whole strokes **MUST** be kept intact during cuts (a 4's crossbar stays with the
4 even when it pokes past a cut line).

## R-INK-7 — Confidence semantics
Each digit result **MUST** carry a `[0,1]` `conf` and a boolean `confident`.
- CNN: `conf` = softmax probability of the argmax logit; `confident` = `conf > 0.5`.
- `$P` fallback: `confident` requires `bestScore < 0.45` AND a separation `margin`
  over the runner-up `> 0.06`; `conf` is a synthesized `[0,1]` mirror.
- `recognizeNumber` overall: `confident` = ALL digits confident; `conf` = **min**
  of per-digit conf (weakest-link).

*WHY:* consumers (`InkPad`/`Slate`) render an "unsure" affordance and the engine
records `recognizer_confidence` on the `Observation`.

## R-INK-8 — Model training reproducibility (ad hoc, out of band)
`web/tools/train_mnist.py` **MUST** remain runnable to (re)produce a digit model
artifact offline (downloads MNIST, trains, exports). NOTE: in its current form it
trains a pure-JS MLP and writes `public/mnist.json` — it does **NOT** emit the
`mnist-12.onnx` actually loaded at runtime (see `gotchas.md` G-INK-3). The runtime
model is the pretrained ONNX-zoo "mnist-12".

## R-INK-9 — Dev ink-capture inspection (pointer)
A developer **MUST** be able to inspect real tablet handwriting samples offline.
`web/tools/dump-ink.mjs` reads `ink-log.jsonl` (written by the dev-only `/__ink`
endpoint — pointer: `leftovers`/`vite.config.js`) and writes per-cell PNGs plus a
summary of recognizer guess vs. correct answer to `tools/ink-dump/`.
