// harness/quarantine/llmDiscriminator.js — U10 QUARANTINED facet: a BLIND
// Turing check on synthetic learner error-streams (KTD11).
//
// QUARANTINE CONTRACT (hard): this module is ISOLATED from the tuning loop. It
// imports NOTHING from search.js / recursiveLoop.js and exposes NO hook the loop
// consumes. Its output (hit-rate, tells) is a CREDIBILITY signal for a human red-
// teamer — it is NEVER fed back into search/recursiveLoop, and the LLM is used as
// a JUDGE ONLY (it never generates a persona). It is separately seeded so a judge
// run can never perturb the deterministic tuning RNG stream.
//
// The "blind discriminator" mixes synthetic error-streams (extracted from tapes,
// with the synthetic ACTOR stripped so the judge cannot cheat off the label) with
// real / hand-authored streams, asks an injected `llmCall(prompt) -> label` which
// items are FAKE, and reports the hit-rate against chance (50%) plus the human-
// readable TELLS that distinguish synthetic from real. A hit-rate near 50% means
// the synthetic learners are indistinguishable from real ones (good); a high hit-
// rate with crisp tells is a FINDING about how to make personas more lifelike.
//
// DEGRADE GRACEFULLY (concrete modes):
//   - ≥ MIN_REAL real streams + a usable llmCall → mode:'human-vs-synthetic'.
//   - a real corpus present but llmCall === null/absent → mode:'skipped-no-llm'.
//   - NO real corpus (but a llmCall) → mode:'intra-synthetic' (lower credibility):
//       the judge sorts purely-synthetic streams, which can only surface internal
//       tells, never a true human baseline.
//   - neither a usable llmCall NOR any stream → mode:'skipped-empty'.
// In EVERY mode we still compute and record the static `tells`.

import { personaRng } from '../rng.js';

/** Minimum real streams to run a credible human-vs-synthetic discrimination. */
export const MIN_REAL = 5;

// ---------------------------------------------------------------------------
// Stream extraction — tape → blinded error-stream (actor stripped)
// ---------------------------------------------------------------------------

/**
 * Project a session tape onto a compact, blinded "error-stream": the per-attempt
 * behavioral trace a judge actually reasons over. The synthetic ACTOR is dropped
 * (never surfaced into the stream) so the judge cannot read the label off the
 * data — this is what makes the check BLIND.
 *
 * @param {object} tape  a sessionRunner tape ({ steps:[{ observation, ... }] }).
 * @returns {{ source:'tape', items: object[] }}
 */
export function streamFromTape(tape) {
  const steps = Array.isArray(tape?.steps) ? tape.steps : [];
  const items = steps
    .map((s) => s.observation)
    .filter(Boolean)
    .map((o) => ({
      // ONLY behavioral fields — no actor, no persona_id, no latent truth.
      correct: !!o.correct,
      error_signature: o.error_signature ?? null,
      latency: typeof o.latency === 'number' ? o.latency : null,
      hint_max_rung: typeof o.hint_max_rung === 'number' ? o.hint_max_rung : 0,
      self_corrections:
        typeof o.self_corrections === 'number' ? o.self_corrections : 0,
      scaffold_level:
        typeof o.scaffold_level === 'number' ? o.scaffold_level : 0,
      modality: o.modality ?? 'tap',
      too_fast_correct: !!o.too_fast_correct,
    }));
  return { source: 'tape', items };
}

// ---------------------------------------------------------------------------
// Tells — static features that betray a synthetic stream (recorded in EVERY mode)
// ---------------------------------------------------------------------------

/**
 * Compute human-readable "tells": features that distinguish a synthetic stream
 * from a real child's. These are descriptive statistics over a stream's items,
 * each with a heuristic synthetic-likelihood score in [0,1] (higher = more
 * machine-like). The score is advisory — the judge is the arbiter — but it lets
 * us rank the EASIEST-TO-SPOT stream even when no llmCall is available.
 *
 * @param {{ items: object[] }} stream
 * @returns {{ tells: object[], suspicion: number }}
 */
export function computeTells(stream) {
  const items = stream?.items ?? [];
  const n = items.length;
  const tells = [];
  if (n === 0) return { tells, suspicion: 0 };

  const latencies = items
    .map((i) => i.latency)
    .filter((x) => typeof x === 'number');
  // 1) latency quantization — synthetic latencies cluster on round numbers.
  const rounded = latencies.filter((x) => x % 50 === 0).length;
  const quantFrac = latencies.length ? rounded / latencies.length : 0;
  if (quantFrac > 0.5) {
    tells.push({
      name: 'latency_quantization',
      detail: `${Math.round(quantFrac * 100)}% of latencies land on 50ms grid`,
      score: quantFrac,
    });
  }

  // 2) latency variance — real humans are noisy; a low spread is suspicious.
  let lowVariance = 0;
  if (latencies.length >= 3) {
    const mean = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const varr =
      latencies.reduce((a, b) => a + (b - mean) * (b - mean), 0) /
      latencies.length;
    const cv = mean > 0 ? Math.sqrt(varr) / mean : 0;
    if (cv < 0.15) {
      lowVariance = 1 - cv / 0.15;
      tells.push({
        name: 'low_latency_variance',
        detail: `coefficient of variation ${cv.toFixed(3)} (humans vary more)`,
        score: lowVariance,
      });
    }
  }

  // 3) error-signature monotony — a single repeated misconception code is a
  //    classic inverse-error persona tell.
  const sigs = items.map((i) => i.error_signature).filter(Boolean);
  if (sigs.length >= 3) {
    const uniq = new Set(sigs).size;
    const monotony = 1 - (uniq - 1) / Math.max(1, sigs.length - 1);
    if (monotony > 0.7) {
      tells.push({
        name: 'error_signature_monotony',
        detail: `${uniq} distinct error signature(s) across ${sigs.length} errors`,
        score: monotony,
      });
    }
  }

  // 4) zero self-corrections — real children oscillate pieces; a stream with no
  //    self-corrections at all on a manipulative modality is machine-clean.
  const totalSelfCorr = items.reduce((a, i) => a + (i.self_corrections || 0), 0);
  if (n >= 4 && totalSelfCorr === 0) {
    tells.push({
      name: 'no_self_corrections',
      detail: 'zero piece oscillations across the whole stream',
      score: 0.6,
    });
  }

  // Aggregate suspicion = max single tell (the easiest thing to spot).
  const suspicion = tells.reduce((m, t) => Math.max(m, t.score), 0);
  return { tells, suspicion };
}

// ---------------------------------------------------------------------------
// Default llmCall — tries the dev /api proxy; absence → null (caller skips).
// ---------------------------------------------------------------------------

/**
 * Build the default judge `llmCall`. It POSTs to the dev `/api/judge` proxy
 * (sibling of the existing `/api/tts` ElevenLabs proxy). NO such proxy exists in
 * the repo today, so in practice this resolver returns `null` unless one is wired
 * later — which the caller treats as "skip gracefully" rather than an error. The
 * proxy, if present, is JUDGE-ONLY: it returns a label, never a generated persona,
 * and its result is never returned into the tuning loop.
 *
 * @returns {(prompt:string)=>Promise<string>|null} a llmCall, or null if no proxy.
 */
export function defaultLlmCall() {
  // Only a browser/dev-server context exposes the proxy. Under Node/vitest there
  // is no fetch-backed proxy and we degrade to null (skip) rather than throw.
  if (typeof fetch !== 'function' || typeof window === 'undefined') return null;
  return async (prompt) => {
    const res = await fetch('/api/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res || !res.ok) return null;
    const data = await res.json().catch(() => null);
    return data && typeof data.label === 'string' ? data.label : null;
  };
}

// ---------------------------------------------------------------------------
// Prompt assembly (judge-only; never a generation prompt)
// ---------------------------------------------------------------------------

/** Render one blinded stream as a compact judge-readable block. */
function renderStream(stream, idx) {
  const rows = (stream.items ?? []).map((i) => {
    const sig = i.error_signature ? ` sig=${i.error_signature}` : '';
    return `  ${i.correct ? 'OK ' : 'X  '} lat=${i.latency}ms hint=${i.hint_max_rung} sc=${i.self_corrections} scaf=${i.scaffold_level} ${i.modality}${sig}${i.too_fast_correct ? ' [too-fast]' : ''}`;
  });
  return `Stream #${idx}:\n${rows.join('\n')}`;
}

/**
 * Build the BLIND judge prompt: "which of these learner streams are FAKE
 * (machine-generated)?". The judge sees only behavior, never the actor label.
 */
export function buildJudgePrompt(streams) {
  const body = streams.map((s, i) => renderStream(s, i)).join('\n\n');
  return (
    'You are judging learner-behavior traces from a fractions tutor. Some streams ' +
    'are from REAL children; some are machine-generated (FAKE). For each stream, ' +
    'decide if it is FAKE. Reply with a comma-separated list of the 0-based indices ' +
    'you believe are FAKE.\n\n' +
    body +
    '\n\nFAKE indices:'
  );
}

/** Parse a judge label ("0, 2, 3" or "none") into a Set of flagged indices. */
function parseJudgeLabel(label, n) {
  const flagged = new Set();
  if (typeof label !== 'string') return flagged;
  for (const m of label.matchAll(/\d+/g)) {
    const v = Number(m[0]);
    if (Number.isInteger(v) && v >= 0 && v < n) flagged.add(v);
  }
  return flagged;
}

// ---------------------------------------------------------------------------
// discriminate — the blind Turing check
// ---------------------------------------------------------------------------

/**
 * Run the blind discriminator.
 *
 * @param {object} args
 *   @param {object[]} args.syntheticStreams  blinded synthetic streams (or tapes).
 *   @param {object[]} [args.realStreams]     real / hand-authored streams.
 *   @param {(prompt:string)=>(string|Promise<string>)} [args.llmCall]
 *           judge-ONLY label function; defaults to the dev /api proxy (or null).
 *   @param {number} [args.seed=0]  SEPARATE seed (KTD11) for the blind shuffle.
 * @returns {Promise<{ mode:string, hitRate:number|null, tells:object[],
 *                      n:number, easiestTell:object|null }>}
 */
export async function discriminate({
  syntheticStreams = [],
  realStreams = [],
  llmCall = defaultLlmCall(),
  seed = 0,
} = {}) {
  // Accept either pre-extracted streams or raw tapes; normalize to streams.
  const synth = syntheticStreams.map(toStream).filter((s) => s.items.length > 0);
  const real = (realStreams || []).map(toStream).filter((s) => s.items.length > 0);

  // Tells are ALWAYS recorded (every mode). Rank the easiest-to-spot synthetic.
  const synthTells = synth.map((s) => ({ stream: s, ...computeTells(s) }));
  const easiest = synthTells.reduce(
    (best, t) => (best === null || t.suspicion > best.suspicion ? t : best),
    null
  );
  const tells = easiest ? easiest.tells : [];
  const easiestTell =
    easiest && easiest.tells.length
      ? easiest.tells.reduce((m, t) => (t.score > m.score ? t : m))
      : null;

  // Mode selection (the concrete graceful-degrade ladder).
  if (!llmCall) {
    if (real.length > 0 || synth.length > 0) {
      return { mode: 'skipped-no-llm', hitRate: null, tells, n: synth.length + real.length, easiestTell };
    }
    return { mode: 'skipped-empty', hitRate: null, tells, n: 0, easiestTell };
  }
  if (synth.length === 0 && real.length === 0) {
    return { mode: 'skipped-empty', hitRate: null, tells, n: 0, easiestTell };
  }

  // Build the labeled, blind-shuffled mixture. Separately seeded (KTD11).
  const intra = real.length < MIN_REAL;
  const mixture = intra
    ? synth.map((s) => ({ stream: s, fake: true }))
    : [
        ...synth.map((s) => ({ stream: s, fake: true })),
        ...real.map((s) => ({ stream: s, fake: false })),
      ];

  const shuffled = shuffle(mixture, personaRng('llm-discriminator', seed, 0));
  const prompt = buildJudgePrompt(shuffled.map((m) => m.stream));

  let label = null;
  try {
    label = await llmCall(prompt);
  } catch (_) {
    // A judge that throws degrades to a skip rather than crashing the harness.
    return { mode: 'skipped-no-llm', hitRate: null, tells, n: shuffled.length, easiestTell };
  }
  const flagged = parseJudgeLabel(label, shuffled.length);

  // Hit-rate = fraction of items the judge classified correctly (fake↔flagged).
  let hits = 0;
  for (let i = 0; i < shuffled.length; i++) {
    const judgedFake = flagged.has(i);
    if (judgedFake === shuffled[i].fake) hits++;
  }
  const hitRate = shuffled.length ? hits / shuffled.length : null;

  return {
    mode: intra ? 'intra-synthetic' : 'human-vs-synthetic',
    hitRate,
    tells,
    n: shuffled.length,
    easiestTell,
  };
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** Normalize a tape OR an already-extracted stream into a stream. */
function toStream(x) {
  if (x && Array.isArray(x.items)) return x; // already a stream
  if (x && Array.isArray(x.steps)) return streamFromTape(x); // a tape
  return { source: 'unknown', items: [] };
}

/** Fisher–Yates shuffle driven by an injected rng (() => [0,1)). */
function shuffle(arr, rng) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
