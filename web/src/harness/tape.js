// harness/tape.js — the signed replay tape: the single source of truth (KTD8).
//
// A tape is a deterministic, canonical record of one synthetic session:
//   { run_id, seed, persona_id, persona_latents, params_hash, engine_sha, flags,
//     steps: [{ decision, observation, gate, latent }] }
//
// Serialization is CANONICAL — explicit sorted keys + fixed float precision — so
// two runs of the same (persona, seed, flags) serialize byte-identically (review
// S5/F6). Pure serialization is browser-safe; the file SINK is Node-only and
// injected, so the same core runs under vite-node (CLI) and in the browser
// dashboard (review F5).

// ---------------------------------------------------------------------------
// Canonicalization
// ---------------------------------------------------------------------------

/** Round a finite number to a stable precision (kills cross-runtime float drift). */
function roundFloat(x) {
  if (!Number.isFinite(x)) return x;
  return Math.round(x * 1e9) / 1e9;
}

/** Recursively canonicalize: sort object keys, fix float precision. */
export function canonicalize(v) {
  if (typeof v === 'number') return roundFloat(v);
  if (Array.isArray(v)) return v.map(canonicalize);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = canonicalize(v[k]);
    return out;
  }
  return v;
}

/** Deterministic JSON for one object (canonical key order + float precision). */
export function canonicalStringify(obj) {
  return JSON.stringify(canonicalize(obj));
}

// ---------------------------------------------------------------------------
// Hashing (FNV-1a 32-bit, hex)
// ---------------------------------------------------------------------------

export function fnv1a(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Stable hash of an arbitrary (e.g. PARAMS) object. */
export function hashObject(obj) {
  return fnv1a(canonicalStringify(obj));
}

// ---------------------------------------------------------------------------
// Tape (de)serialization — JSONL, one canonical session per line
// ---------------------------------------------------------------------------

/** One session tape → one canonical JSON line. */
export function serializeSession(session) {
  return canonicalStringify(session);
}

/** Many sessions → a JSONL string (browser-safe; no fs). */
export function tapesToJsonl(sessions) {
  return sessions.map(serializeSession).join('\n') + '\n';
}

/** Parse a JSONL string back into session objects. */
export function jsonlToTapes(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

// ---------------------------------------------------------------------------
// Node-only file sink (dynamic import so the browser bundle never touches fs)
// ---------------------------------------------------------------------------

export async function writeTapesFile(path, sessions) {
  const fs = await import('node:fs/promises');
  await fs.writeFile(path, tapesToJsonl(sessions), 'utf8');
}

export async function readTapesFile(path) {
  const fs = await import('node:fs/promises');
  return jsonlToTapes(await fs.readFile(path, 'utf8'));
}
