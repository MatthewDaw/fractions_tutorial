// recognizer.js — on-device handwritten-DIGIT recognition for the stylus pivot.
//
// Scope (deliberately narrow): the child writes only NUMERALS (0–9). The fraction
// bar, +, and = are printed by the UI, never drawn — so this recognizer never has
// to parse operators or layout.
//
// Engine: a PRETRAINED MNIST CNN (ONNX model zoo "mnist-12", ~26KB) run in the
// browser with onnxruntime-web. The piece that actually makes it accurate is the
// PREPROCESSING (`rasterize` below): strokes are turned into a 28×28 image, scaled
// to a 20px box and centered by center-of-mass — exactly the form MNIST models
// expect. While the wasm runtime loads (first visit only), we fall back to a small
// geometric $P matcher so the pad is never dead. See memory: stylus-handwriting-decision.
//
// PUBLIC API (async):
//   recognizeDigit(strokes)  -> Promise<{ digit: "0".."9"|null, conf, confident }>
//   recognizeNumber(strokes) -> Promise<{ text, digits: [...], confident }>
// `strokes` is an array of strokes; each stroke is an array of [x, y] points in
// any consistent pixel space (we normalize internally).
// Import the plain WASM build (not the default jsep/WebGPU build, which fetches a
// separate 26MB *.jsep.wasm). This matches the single ort-wasm-simd-threaded.wasm
// we stage in public/ort and keeps it small + offline-friendly.
import * as ort from "onnxruntime-web/wasm";

// No wasmPaths: with `optimizeDeps.exclude: ['onnxruntime-web']` (see vite.config),
// ort resolves its own .wasm/.mjs siblings relative to the served package — which
// avoids Vite transforming the loader (the /ort/*.mjs 500 we hit when hand-placing).
ort.env.wasm.numThreads = 1;      // page isn't cross-origin-isolated → no threads
ort.env.logLevel = "error";

// Pixel range fed to the model. The mnist-12 (CNTK) graph wants raw 0..255.
const INPUT_SCALE = 255;
let SESSION = null;            // set once the model is ready
let LOAD_ERR = null;           // load failure message, for debugging

// Model URL. In the browser a bare "/mnist-12.onnx" is resolved against the
// document base, but Node's fetch (undici, as used by the jsdom test runner)
// rejects a path-only URL ("Failed to parse URL"). Resolve it against the Vite
// BASE_URL so the specifier is always absolute-relative-correct, and skip the
// network entirely under the test runner (jsdom serves no static assets, so the
// fetch could only ever fail; the recognizer's $P fallback covers tests).
const MODEL_URL = (import.meta.env?.BASE_URL ?? "/") + "mnist-12.onnx";
const sessionPromise = import.meta.env?.VITEST
  ? Promise.resolve(null) // test env: use the geometric $P fallback, no model fetch
  : fetch(MODEL_URL)
      .then((r) => r.arrayBuffer())
      .then((buf) => ort.InferenceSession.create(buf, { executionProviders: ["wasm"] }))
      .then((s) => { SESSION = s; return s; })
      .catch((e) => { LOAD_ERR = String((e && (e.message || e)) || e); console.warn("mnist model load failed; using fallback matcher", e); return null; });

// Debug probe (used by the headless validation harness).
export function modelStatus() { return { ready: !!SESSION, error: LOAD_ERR }; }

// Debug: run the model at a given pixel scale, return top-3 + the 28×28 grid.
export async function classifyDebug(strokes, scale) {
  const s = SESSION || (await sessionPromise);
  if (!s) return { err: "no session" };
  const grid = rasterize(strokes);
  if (!grid) return { err: "no grid" };
  const input = new Float32Array(784);
  for (let i = 0; i < 784; i++) input[i] = grid[i] * scale;
  const out = await s.run({ Input3: new ort.Tensor("float32", input, [1, 1, 28, 28]) });
  const sc = Array.from(out["Plus214_Output_0"].data);
  const top = sc.map((v, i) => [i, +v.toFixed(2)]).sort((a, b) => b[1] - a[1]).slice(0, 3);
  // ascii of the grid (ink density)
  let ascii = "";
  for (let y = 0; y < 28; y++) { let row = ""; for (let x = 0; x < 28; x++) { const v = grid[y * 28 + x]; row += v > 0.6 ? "#" : v > 0.25 ? "+" : v > 0.05 ? "." : " "; } ascii += row + "\n"; }
  return { scale, top, ascii };
}

// ---- preprocessing: strokes -> 28×28 float (MNIST-style), the real fix --------
// White digit on black, scaled into a 20px box and centered by mass, like MNIST.
function rasterize(strokes) {
  const pts = [];
  for (const s of strokes) for (const p of s) pts.push(p);
  if (!pts.length) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  const w = Math.max(1, maxX - minX), h = Math.max(1, maxY - minY);
  const INNER = 20, scale = INNER / Math.max(w, h);
  const dw = w * scale, dh = h * scale;
  const ox = (28 - dw) / 2, oy = (28 - dh) / 2;
  const g = new Float32Array(28 * 28);
  const R = 1.7; // stroke half-width in 28-space (MNIST strokes are fairly thick)
  const splat = (gx, gy) => {
    const x0 = Math.floor(gx - R), x1 = Math.ceil(gx + R), y0 = Math.floor(gy - R), y1 = Math.ceil(gy + R);
    for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
      if (xx < 0 || yy < 0 || xx >= 28 || yy >= 28) continue;
      const v = Math.max(0, 1 - Math.hypot(xx - gx, yy - gy) / (R + 0.5));
      const i = yy * 28 + xx; if (v > g[i]) g[i] = v;
    }
  };
  const map = ([x, y]) => [ox + (x - minX) * scale, oy + (y - minY) * scale];
  for (const s of strokes) {
    if (s.length === 1) { const [gx, gy] = map(s[0]); splat(gx, gy); continue; }
    for (let i = 1; i < s.length; i++) {
      const [ax, ay] = map(s[i - 1]), [bx, by] = map(s[i]);
      const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) * 2));
      for (let t = 0; t <= steps; t++) splat(ax + (bx - ax) * t / steps, ay + (by - ay) * t / steps);
    }
  }
  // center by mass (MNIST centers the 20px digit in 28×28 by its centroid)
  let m = 0, cx = 0, cy = 0;
  for (let y = 0; y < 28; y++) for (let x = 0; x < 28; x++) { const v = g[y * 28 + x]; m += v; cx += v * x; cy += v * y; }
  if (m > 0) {
    const sx = Math.round(14 - cx / m), sy = Math.round(14 - cy / m);
    if (sx || sy) {
      const g2 = new Float32Array(784);
      for (let y = 0; y < 28; y++) for (let x = 0; x < 28; x++) {
        const nx = x + sx, ny = y + sy;
        if (nx >= 0 && ny >= 0 && nx < 28 && ny < 28) g2[ny * 28 + nx] = g[y * 28 + x];
      }
      return g2;
    }
  }
  return g;
}

// Run one digit's strokes through the CNN. Returns null if the model isn't ready
// yet (non-blocking — the caller falls back to $P so the pad never hangs).
async function cnnDigit(strokes) {
  const session = SESSION;
  if (!session) return null;
  const grid = rasterize(strokes);
  if (!grid) return { digit: null, conf: 0, confident: false };
  const input = new Float32Array(784);
  for (let i = 0; i < 784; i++) input[i] = grid[i] * INPUT_SCALE;
  const out = await session.run({ Input3: new ort.Tensor("float32", input, [1, 1, 28, 28]) });
  const scores = out["Plus214_Output_0"].data;
  let bi = 0; for (let i = 1; i < 10; i++) if (scores[i] > scores[bi]) bi = i;
  let sum = 0; for (let i = 0; i < 10; i++) sum += Math.exp(scores[i] - scores[bi]);
  const conf = 1 / sum;
  return { digit: String(bi), conf, confident: conf > 0.5 };
}

const N = 32; // points each cloud is resampled to (legacy $P fallback)

// ---- geometry helpers ------------------------------------------------------
function dist(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
function pathLength(pts) { let d = 0; for (let i = 1; i < pts.length; i++) if (pts[i].id === pts[i - 1].id) d += dist(pts[i - 1], pts[i]); return d; }

// Resample the concatenated point list to exactly n points, breaking interval
// accumulation across stroke boundaries (different `id`).
function resample(points, n) {
  const I = pathLength(points) / (n - 1);
  let D = 0;
  const out = [{ ...points[0] }];
  for (let i = 1; i < points.length; i++) {
    if (points[i].id === points[i - 1].id) {
      const d = dist(points[i - 1], points[i]);
      if (D + d >= I) {
        const t = (I - D) / d;
        const nx = points[i - 1].x + t * (points[i].x - points[i - 1].x);
        const ny = points[i - 1].y + t * (points[i].y - points[i - 1].y);
        const np = { x: nx, y: ny, id: points[i].id };
        out.push(np);
        points.splice(i, 0, np);
        D = 0;
      } else {
        D += d;
      }
    }
  }
  while (out.length < n) out.push({ ...points[points.length - 1] });
  return out;
}

function scale(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }
  const s = Math.max(maxX - minX, maxY - minY) || 1; // uniform scale (preserve aspect)
  return points.map((p) => ({ x: (p.x - minX) / s, y: (p.y - minY) / s, id: p.id }));
}

function centroid(points) { let x = 0, y = 0; for (const p of points) { x += p.x; y += p.y; } return { x: x / points.length, y: y / points.length }; }
function translateToOrigin(points) { const c = centroid(points); return points.map((p) => ({ x: p.x - c.x, y: p.y - c.y, id: p.id })); }

// Turn raw strokes ([[x,y],...][]) into a normalized N-point cloud.
function normalizeStrokes(strokes) {
  const pts = [];
  strokes.forEach((s, id) => s.forEach(([x, y]) => pts.push({ x, y, id })));
  if (pts.length < 2) return null;
  let cloud = resample(pts, N);
  cloud = scale(cloud);
  cloud = translateToOrigin(cloud);
  return cloud;
}

// ---- $P cloud matching -----------------------------------------------------
function cloudDistance(pts1, pts2, start) {
  const n = pts1.length;
  const matched = new Array(n).fill(false);
  let sum = 0, i = start;
  do {
    let min = Infinity, index = -1;
    for (let j = 0; j < n; j++) {
      if (!matched[j]) { const d = dist(pts1[i], pts2[j]); if (d < min) { min = d; index = j; } }
    }
    matched[index] = true;
    const weight = 1 - ((i - start + n) % n) / n;
    sum += weight * min;
    i = (i + 1) % n;
  } while (i !== start);
  return sum;
}

function greedyMatch(pts1, pts2) {
  const n = pts1.length;
  const step = Math.max(1, Math.floor(Math.pow(n, 0.5)));
  let min = Infinity;
  for (let i = 0; i < n; i += step) {
    min = Math.min(min, cloudDistance(pts1, pts2, i), cloudDistance(pts2, pts1, i));
  }
  return min;
}

// ---- digit templates (parametric, unit box, y-down) ------------------------
// Each entry: [digit, strokes] where strokes is [[ [x,y], ... ], ...]. Several
// glyphs carry two variants (print + a rounder hand) to widen tolerance.
function arc(cx, cy, rx, ry, a0, a1, steps = 18) {
  const out = [];
  for (let i = 0; i <= steps; i++) { const a = a0 + (a1 - a0) * (i / steps); out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  return out;
}
const TAU = Math.PI * 2;
const RAW_TEMPLATES = [
  ["0", [arc(0.5, 0.5, 0.30, 0.44, -Math.PI / 2, -Math.PI / 2 + TAU, 28)]],
  ["1", [[[0.34, 0.24], [0.5, 0.12]], [[0.5, 0.12], [0.5, 0.9]]]],
  ["1", [[[0.5, 0.12], [0.5, 0.9]]]],
  ["2", [[[0.18, 0.3], [0.3, 0.14], [0.58, 0.12], [0.72, 0.3], [0.6, 0.5], [0.32, 0.72], [0.18, 0.9], [0.82, 0.9]]]],
  ["3", [[[0.2, 0.18], [0.55, 0.1], [0.72, 0.3], [0.46, 0.48]], [[0.46, 0.48], [0.74, 0.62], [0.58, 0.88], [0.22, 0.86]]]],
  ["4", [[[0.58, 0.1], [0.16, 0.62], [0.84, 0.62]], [[0.64, 0.1], [0.64, 0.9]]]],
  ["5", [[[0.72, 0.12], [0.3, 0.12], [0.27, 0.46], [0.55, 0.4], [0.76, 0.58], [0.6, 0.87], [0.26, 0.88]]]],
  ["6", [[[0.66, 0.14], [0.38, 0.34], [0.27, 0.62], [0.36, 0.86], [0.6, 0.88], [0.72, 0.66], [0.56, 0.5], [0.32, 0.58], [0.27, 0.7]]]],
  ["7", [[[0.2, 0.14], [0.8, 0.14], [0.44, 0.9]]]],
  ["8", [arc(0.5, 0.3, 0.2, 0.2, -Math.PI / 2, -Math.PI / 2 + TAU, 18).concat(arc(0.5, 0.7, 0.26, 0.22, -Math.PI / 2, -Math.PI / 2 + TAU, 20))]],
  ["9", [[[0.66, 0.5], [0.42, 0.36], [0.36, 0.2], [0.56, 0.12], [0.72, 0.28], [0.66, 0.5], [0.56, 0.78], [0.4, 0.9]]]],
];
const TEMPLATES = RAW_TEMPLATES.map(([digit, strokes]) => ({ digit, cloud: normalizeStrokes(strokes) })).filter((t) => t.cloud);

// ---- fallback: $P geometric match for a single digit (used only until the CNN
// finishes loading on first visit) ------------------------------------------
function pdollarDigit(strokes) {
  const cloud = normalizeStrokes(strokes);
  if (!cloud) return { digit: null, score: Infinity, conf: 0, confident: false };
  let best = null, bestScore = Infinity, second = Infinity;
  for (const t of TEMPLATES) {
    const score = greedyMatch(cloud, t.cloud);
    if (score < bestScore) { second = bestScore; bestScore = score; best = t.digit; }
    else if (score < second) { second = score; }
  }
  // Confident when the best is clearly ahead of the runner-up and not far off.
  const margin = second === Infinity ? 1 : (second - bestScore) / (second || 1);
  const confident = bestScore < 0.45 && margin > 0.06;
  // Derive a [0,1] confidence from the distance + margin (mirrors the CNN's softmax conf).
  // bestScore=0 → conf≈1; bestScore≥0.45 → conf≈0; margin amplifies separation.
  const conf = Math.max(0, Math.min(1, (1 - bestScore / 0.6) * (0.5 + 0.5 * Math.min(1, margin / 0.3))));
  return { digit: best, score: bestScore, conf, confident };
}

// ---- public: split a multi-digit scribble into digits, left-to-right -------
// The hard case is a child writing "42" in one box: a handwritten 4 (or 7) has a
// wide crossbar that reaches under the next digit, so grouping strokes by
// bounding-box overlap swallowed the "2" into the "4" and the CNN read the merged
// blob as one wrong digit. Instead we split on the WHITESPACE between digits as
// seen in the ink's horizontal projection: digits within a numeral overlap in x,
// but adjacent numerals leave an empty vertical band. A force-split fallback
// covers genuinely touching digits (no whitespace) by even spacing.

// Densify a polyline to ~`step`-spaced points so the x-projection is gap-free
// along each stroke (raw points can be far apart on fast strokes).
function densify(stroke, step) {
  if (stroke.length <= 1) return stroke.slice();
  const out = [];
  for (let i = 1; i < stroke.length; i++) {
    const [ax, ay] = stroke[i - 1], [bx, by] = stroke[i];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let t = 0; t < n; t++) out.push([ax + (bx - ax) * t / n, ay + (by - ay) * t / n]);
  }
  out.push(stroke[stroke.length - 1]);
  return out;
}

function strokeCx(s) { let a = Infinity, b = -Infinity; for (const [x] of s) { if (x < a) a = x; if (x > b) b = x; } return (a + b) / 2; }
function groupCx(g) { let sum = 0, n = 0; for (const s of g) { sum += strokeCx(s); n++; } return n ? sum / n : 0; }

// Bin whole strokes into the slots between sorted x-cut positions, by stroke
// center. Keeping each stroke intact means a 4's crossbar stays with the 4 even
// when its right end pokes past the cut.
function assignByCuts(strokes, cuts) {
  const bins = Array.from({ length: cuts.length + 1 }, () => []);
  for (const s of strokes) {
    const cx = strokeCx(s);
    let k = 0; while (k < cuts.length && cx > cuts[k]) k++;
    bins[k].push(s);
  }
  return bins.filter((b) => b.length);
}

// Fallback for digits written close together / touching (a gap too small for the
// whitespace test to catch). A numeral advances the pen by ≈0.65·H horizontally,
// so a group wider than that probably holds more than one digit: estimate the
// count from width and even-split. The 0.65·H advance keeps a lone wide "4" or
// "0" (≲0.95·H) as a single digit while splitting a ≥1.1·H two-digit blob.
function forceSplitWide(seg, H) {
  if (seg.length <= 1) return [seg];
  let a = Infinity, b = -Infinity;
  for (const s of seg) for (const [x] of s) { if (x < a) a = x; if (x > b) b = x; }
  const k = Math.min(3, Math.max(1, Math.round((b - a) / (0.65 * H))));
  if (k <= 1) return [seg];
  const cuts = [];
  for (let i = 1; i < k; i++) cuts.push(a + ((b - a) * i) / k);
  return assignByCuts(seg, cuts);
}

// Split a multi-digit scribble into digit groups, left-to-right. `opts.gapFrac`
// is the minimum empty-band width (as a fraction of ink height) that separates
// two digits.
function segment(strokes, opts = {}) {
  const valid = strokes.filter((s) => s && s.length > 0);
  if (!valid.length) return [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const s of valid) for (const [x, y] of s) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  const H = Math.max(1, maxY - minY), W = Math.max(1, maxX - minX);

  // Horizontal ink-occupancy histogram (which x-columns contain ink).
  const step = Math.max(0.5, H * 0.06);
  const BINS = Math.max(4, Math.min(512, Math.round(W / step)));
  const bw = W / BINS;
  const occ = new Uint16Array(BINS);
  for (const s of valid) for (const [x] of densify(s, step)) {
    let bi = Math.floor((x - minX) / bw);
    if (bi < 0) bi = 0; else if (bi >= BINS) bi = BINS - 1;
    occ[bi] = 1;
  }
  // Cut at the center of each empty band wide enough to separate digits. The
  // threshold is measured in pixels (a fraction of ink height) so it doesn't
  // depend on bin resolution.
  const minGapPx = (opts.gapFrac != null ? opts.gapFrac : 0.09) * H;
  const cuts = [];
  let run = 0, sawInk = false;
  for (let i = 0; i < BINS; i++) {
    if (!occ[i]) { if (sawInk) run++; }
    else { if (run * bw >= minGapPx) cuts.push(minX + (i - run / 2) * bw); run = 0; sawInk = true; }
  }

  const segs = assignByCuts(valid, cuts);
  const out = [];
  for (const seg of segs) out.push(...forceSplitWide(seg, H));
  out.sort((p, q) => groupCx(p) - groupCx(q));
  return out;
}

// ---- public: recognize one digit (CNN, with $P fallback while loading) ------
export async function recognizeDigit(strokes) {
  const cnn = await cnnDigit(strokes);
  if (cnn && cnn.digit != null) return cnn;
  return pdollarDigit(strokes); // model not ready yet
}

// ---- public: recognize a multi-digit number, left-to-right ------------------
export async function recognizeNumber(strokes, opts = {}) {
  const groups = segment(strokes, opts);
  if (!groups.length) return { text: "", digits: [], conf: 0, confident: false };
  const digits = await Promise.all(groups.map((g) => recognizeDigit(g)));
  const text = digits.map((d) => d.digit ?? "").join("");
  const confident = digits.length > 0 && digits.every((d) => d.confident);
  // Overall confidence = minimum per-digit confidence (weakest link).
  const conf = digits.length > 0 ? Math.min(...digits.map((d) => d.conf ?? 0)) : 0;
  return { text, digits, conf, confident };
}
