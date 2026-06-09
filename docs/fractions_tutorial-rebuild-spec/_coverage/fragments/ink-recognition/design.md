# ink-recognition — design

> Slice fragment. Contributes to canonical `design.md`. Documents the on-device
> handwritten-digit recognition pipeline.
>
> **Owned globs:** `web/src/ink/**`, `web/tools/train_mnist.py`,
> `web/tools/dump-ink.mjs`, `web/public/mnist-12.onnx`,
> `web/tests/runtime/test_recognizer_segment.test.jsx`.
> **Entry point:** `web/src/ink/recognizer.js`.
> **Consumed by (pointer):** `lessons-rooms` — `components/InkPad.jsx` and
> `components/Slate.jsx` import `recognizeNumber`/`recognizeDigit`.
> **Dev capture endpoint (pointer):** `/__ink` middleware + `ink-log.jsonl` live in
> `web/vite.config.js`, owned by the `leftovers` slice — NOT re-documented here.

---

## 1. What it IS and WHY it exists

`web/src/ink/recognizer.js` is a single self-contained module that recognizes
**handwritten numerals (0–9 only)** drawn with a stylus, entirely **on-device, in
the browser, offline**. It exists to support a "stylus pivot": instead of typing
fraction answers, a child writes the numerator/denominator by hand on a tablet.

**WHY digits-only (deliberately narrow scope):** the child writes ONLY numerals.
The fraction bar, `+`, and `=` are **printed by the UI and never drawn**, so the
recognizer never has to parse operators, math layout, or 2-D structure. This is a
load-bearing scope decision — it lets the whole recognizer be a flat
left-to-right digit reader with no expression parser. (See `requirements.md`
R-INK-1, `gotchas.md`.)

**WHY on-device / offline:** the constitution states there is no backend; the only
runtime network use is a dev-only TTS call and this local ONNX model. The model
file (`public/mnist-12.onnx`, ~26 KB) and the onnxruntime-web WASM are served as
static assets, so recognition works with no server round-trip and offline.

---

## 2. Pipeline overview (end to end)

A "stroke" is an array of `[x, y]` points; "strokes" is an array of strokes in any
consistent pixel space (the module normalizes internally). The two public async
entry points:

```
recognizeDigit(strokes)        -> { digit: "0".."9"|null, conf, confident }
recognizeNumber(strokes, opts) -> { text, digits: [...], conf, confident }
```

`recognizeNumber` is the multi-digit reader used for full answers (e.g. "42" in
one box). Its pipeline:

```
strokes
  └─ segment(strokes, opts)         → split into left-to-right digit groups
       └─ for each group: recognizeDigit(group)
            ├─ cnnDigit(group)      → ONNX MNIST CNN  (primary, if model ready)
            └─ pdollarDigit(group)  → $P geometric matcher (fallback while loading)
  └─ join digit chars → text; min(conf) → overall conf; all(confident) → confident
```

So there are **two orthogonal concerns**: (A) **segmentation** — how a multi-digit
scribble is cut into individual numerals; (B) **classification** — what digit each
group is. They are independent (the segmentation test mocks the CNN to null and
still asserts correct group counts — see `tasks.md`).

---

## 3. Classification: ONNX MNIST CNN (primary)

### 3.1 The model
- A **pretrained MNIST CNN from the ONNX model zoo, "mnist-12"** (~26 KB),
  shipped as `web/public/mnist-12.onnx`. It is NOT trained in this repo (see §6
  on `train_mnist.py`, which is a decoupled/legacy artifact).
- Run with **onnxruntime-web** (`^1.26.0`). The module imports the **plain WASM
  build** explicitly: `import * as ort from "onnxruntime-web/wasm"`.
  **WHY the `/wasm` subpath and not the default:** the default jsep/WebGPU build
  fetches a separate ~26 MB `*.jsep.wasm`; the plain WASM build uses the single
  small `ort-wasm-simd-threaded.wasm`, keeping the bundle small and offline-friendly.
- Runtime env tuning:
  - `ort.env.wasm.numThreads = 1` — the page is not cross-origin-isolated, so
    threads (SharedArrayBuffer) are unavailable; force single-thread.
  - `ort.env.logLevel = "error"` — quiet the runtime.
- **No `wasmPaths` is set.** With `optimizeDeps.exclude: ['onnxruntime-web']` in
  `vite.config.js` (pointer: `leftovers`), ort resolves its own `.wasm`/`.mjs`
  siblings relative to the served package. WHY: letting Vite transform/optimize
  ort's loader produced a `/ort/*.mjs` 500 when paths were hand-placed. (See
  `gotchas.md`.) NOTE: the code comment mentions staging into `public/ort`, but
  **no `public/ort` directory is actually shipped** — the runtime self-resolves.

### 3.2 Model I/O contract (mnist-12 / CNTK graph)
- **Input tensor name:** `Input3`, shape `[1, 1, 28, 28]`, `float32`.
- **Output tensor name:** `Plus214_Output_0` — 10 raw logits (NOT softmaxed).
- **Input pixel range:** the mnist-12 (CNTK) graph wants **raw 0..255**. The
  rasterized `[0,1]` grid is multiplied by `INPUT_SCALE = 255` before inference.

### 3.3 Session load (non-blocking, fire-once)
A module-level `sessionPromise` runs at import time:
`fetch("/mnist-12.onnx") → arrayBuffer → ort.InferenceSession.create(buf, {executionProviders:["wasm"]})`.
On success it sets `SESSION`; on failure it sets `LOAD_ERR`, warns, and resolves to
`null` (never throws). WHY: the WASM runtime + model load only on first visit and
take time; recognition must never block or hang on it — `cnnDigit` returns `null`
when `SESSION` is not yet set, and the caller falls back to `$P` so the pad is
never dead.

### 3.4 `cnnDigit(strokes)`
- Returns `null` immediately if `SESSION` is not ready (signals the caller to fall
  back).
- Rasterizes strokes → `grid` (§4). If no grid, returns
  `{digit:null, conf:0, confident:false}`.
- Builds a 784-float input = `grid[i] * INPUT_SCALE`, runs the session.
- Picks `bi` = argmax of the 10 logits.
- **Confidence** = softmax probability of the winner, computed numerically stably:
  `conf = 1 / Σ_i exp(scores[i] - scores[bi])`.
- `confident = conf > 0.5`. Returns `{ digit: String(bi), conf, confident }`.

### 3.5 Debug probes (used by headless validation, not the UI)
- `modelStatus()` → `{ ready: !!SESSION, error: LOAD_ERR }`.
- `classifyDebug(strokes, scale)` → runs the model at an arbitrary pixel `scale`,
  returns top-3 `[digit, score]` and an ASCII rendering of the 28×28 ink grid.

---

## 4. Preprocessing: `rasterize(strokes)` — the real accuracy fix

The comment is emphatic that **preprocessing is what actually makes the model
accurate**, not the model choice. It converts strokes into the exact normalized
form MNIST models were trained on: a **white digit on black, scaled into a 20px
box, centered in 28×28 by center-of-mass**.

Steps:
1. Flatten all stroke points; bail (`null`) if empty.
2. Compute the ink bounding box `(minX,minY,maxX,maxY)`; `w`,`h` (each ≥ 1).
3. **Scale into a 20px inner box** preserving aspect: `scale = 20 / max(w,h)`;
   offset `(ox,oy)` centers the scaled glyph in 28×28.
4. **Render strokes with anti-aliased "splat" brush.** Stroke half-width
   `R = 1.7` in 28-space (WHY: MNIST strokes are fairly thick). `splat(gx,gy)`
   writes a radial falloff `v = max(0, 1 - dist/(R+0.5))` taking the max into the
   grid (so overlaps don't darken). Single-point strokes splat one dot;
   multi-point strokes interpolate ~2× along each segment so fast strokes stay
   gap-free.
5. **Center by mass (centroid).** Compute ink centroid; integer-shift the grid so
   the centroid lands at (14,14). WHY: MNIST centers the 20px digit in 28×28 by
   its centroid — matching this is what aligns hand input to the training
   distribution.

Returns a `Float32Array(784)` in `[0,1]` (row-major, 28×28).

---

## 5. Fallback classifier: `$P` geometric matcher (`pdollarDigit`)

Used **only until the CNN finishes loading on first visit** (when `cnnDigit`
returns `null`). It is a self-contained, dependency-free implementation of the
**$P point-cloud recognizer** against a small library of parametric digit
templates. WHY a fallback at all: so the pad is responsive instantly on first
visit while the WASM runtime + model download in the background.

### 5.1 Cloud normalization (`normalizeStrokes`)
- Concatenate stroke points, tagging each with its stroke index `id`.
- `resample(points, N=32)` to exactly 32 points — interval accumulation is
  **broken across stroke boundaries** (different `id`) so the cloud respects pen
  lifts.
- `scale` uniformly (preserve aspect) into a unit box, then `translateToOrigin`
  (centroid → 0).
- Returns `null` if fewer than 2 points.

### 5.2 Matching
- `cloudDistance(pts1, pts2, start)` — greedy nearest-point matching with a
  position-decaying `weight = 1 - ((i-start+n)%n)/n`.
- `greedyMatch` tries `√n`-spaced start indices in both directions, takes the min.
- `pdollarDigit` scores the input cloud against every template, tracks best +
  runner-up. **Confident** when `bestScore < 0.45` AND
  `margin = (second-best)/(second) > 0.06`. A `[0,1]` `conf` is synthesized to
  mirror the CNN's softmax: `conf = clamp((1 - bestScore/0.6) * (0.5 + 0.5*min(1, margin/0.3)))`.

### 5.3 Templates (`RAW_TEMPLATES`)
Parametric strokes in a unit box, y-down, one or more variants per glyph (e.g. two
"1" variants — with/without the entry serif — to widen tolerance). `0` and `8`
are built from `arc()` helpers; the rest are polylines. Compiled once into
normalized clouds (`TEMPLATES`), dropping any that fail to normalize.

---

## 6. `segment(strokes, opts)` — splitting a multi-digit scribble

The hard problem: a child writing "42" in one box. A handwritten `4` (or `7`) has
a **wide crossbar that reaches under the next digit**, so grouping strokes by
bounding-box overlap swallowed the "2" into the "4" and the CNN read the merged
blob as one wrong digit.

**Solution — split on the WHITESPACE between digits in the horizontal projection:**
- Build a **horizontal ink-occupancy histogram** (`occ`): which x-columns contain
  ink. Strokes are `densify`-ed to ~`step`-spaced points first so fast strokes
  don't leave false gaps. `step = max(0.5, H*0.06)`; bins clamped to `[4, 512]`.
- **Cut at the center of each empty band** wider than
  `minGapPx = (opts.gapFrac ?? 0.09) * H` (threshold measured in pixels as a
  fraction of ink **height**, so it's independent of bin resolution).
- `assignByCuts` bins **whole strokes** (by stroke center-x) into the slots
  between cuts. WHY whole-stroke: keeps a 4's crossbar with the 4 even when its
  right end pokes past the cut.
- **`forceSplitWide(seg, H)` fallback** for digits touching with no whitespace gap:
  a numeral advances the pen ≈`0.65·H` horizontally, so a group wider than that
  probably holds >1 digit. Estimate `k = clamp(round(width / (0.65·H)), 1, 3)` and
  even-split. The `0.65·H` advance keeps a lone wide "4"/"0" (≲0.95·H) intact while
  splitting a ≥1.1·H two-digit blob.
- Final groups sorted left-to-right by group center-x.

---

## 7. `recognizeNumber` aggregation
- `segment` → groups; empty → `{text:"", digits:[], conf:0, confident:false}`.
- `recognizeDigit` each group **in parallel** (`Promise.all`).
- `text` = join of `digit ?? ""`.
- `confident` = every digit confident.
- **Overall `conf` = `min` of per-digit conf** (weakest-link).

---

## 8. How consumers use it (pointer: `lessons-rooms`)
- `components/InkPad.jsx` imports `recognizeNumber`; reads strokes on draw, shows
  the read text with an `unsure` style when `!confident`; captures
  `{text, digits, confident}` at Check time.
- `components/Slate.jsx` imports both: `recognizeNumber` for multi-digit slots,
  `recognizeDigit` for single-digit slots; shows a `slate-guess`/`unsure` badge.
- The `recognizer_confidence` field on the engine `Observation` (pointer:
  `engine-core` data-model) is fed from this module's `conf`/`confident`.
