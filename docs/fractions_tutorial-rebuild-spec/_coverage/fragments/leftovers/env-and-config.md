# env-and-config — leftovers slice (root config, build/dev, env vars)

> Slice `leftovers` contribution to `env-and-config.md`. Constraints live in
> `constitution.md` §2 (versions), §3 (commands), §5.9 (voice posture) — referenced
> by pointer, not duplicated. This fragment documents the build/dev **configuration**
> and the **environment variables** (NAMES + purpose only, never values).

---

## 1. Build / dev toolchain config

### `web/vite.config.js` — the single build/dev/test config
One `defineConfig` drives dev server, production build, preview, AND vitest.

**Plugins (order is load-bearing):** `resolveTsFromJs()` → `react()` → `inkLogger()` → `ttsServer()`.
- `resolveTsFromJs()` has `enforce: 'pre'` so it resolves `.js`→`.ts` specifiers
  before any other resolver. See `gotchas.md` (leftovers) for the why.
- `inkLogger()` / `ttsServer()` only register middleware via `configureServer`, so
  they are **dev-only** (absent from `vite build` output). See §3 below.

**`optimizeDeps.exclude: ["onnxruntime-web"]`** — onnxruntime-web ships its own
`.wasm`/`.mjs` loader; letting Vite pre-bundle/transform it 500s the loader. The
exclude is what makes the recognizer load. (Recognizer itself: `ink-recognition`
slice — pointer.)

**`server` / `preview`:** `host: true` (binds `0.0.0.0` so a tablet on the same
Wi-Fi can open the printed Network URL), `port: 5173` / `4173`, `strictPort: true`
(URL stays stable for the tablet bookmark).

**`test` block (vitest):** `globals: true`, `environment: 'jsdom'`,
`setupFiles: ['./vitest.setup.js']`, `include: ['tests/**/*.test.{js,jsx,ts,tsx}']`.

### `web/vitest.setup.js`
Imports `@testing-library/jest-dom`, then installs minimal no-op `ResizeObserver`
and `IntersectionObserver` stubs (jsdom lacks both; ScratchCanvas and layout-aware
components observe them on mount, so the smoke tests would otherwise crash mounting
real components).

### `web/tsconfig.json`
`target ES2022`, `module ESNext`, `moduleResolution Bundler`, `jsx: preserve`,
`strict: true`, `allowJs: true`, `noEmit: true`, `skipLibCheck: true`,
`esModuleInterop: true`, `isolatedModules: true`, `lib: ["ES2022","DOM"]`,
`include: ["src","tests"]`. (Engine is TS, the rest is `.js`/`.jsx`; see
constitution §2.) Used for type-checking only — Vite/esbuild do the transpile.

### `pyproject.toml` (repo root)
`[project] name = "fractions-tutorial"`, `version = "0.1.0"`,
`requires-python = ">=3.13"`, `dependencies = []`. Not part of the app runtime —
only the Python tooling (`web/tools/train_mnist.py`, owned by `ink-recognition`)
uses it. `uv.lock` is the resolved lockfile for this (empty-dep) project.

### npm scripts (`web/package.json`)
Verbatim command strings (versions in constitution §2):
| script | command | purpose |
|---|---|---|
| `dev` | `vite --host` | dev server :5173, enables `/__ink` + `/api/tts` |
| `build` | `vite build` | static prod bundle (no dev endpoints) |
| `preview` | `vite preview --host` | preview built bundle :4173 |
| `test` | `vitest run` | full suite |
| `test:watch` | `vitest` | watch mode |
| `harness` | `vite-node src/harness/cli.js --` | synthetic-learner CLI (→ `harness` slice) |
| `voice` | `node scripts/generate-voice.mjs` | bake voice clips (see §2 + §4) |
| `audition` | `node scripts/audition-voices.mjs` | voice-candidate comparison page |
| `music-audition` | `node scripts/fetch-music-audition.mjs` | music-candidate page |
| `music-fetch` | `node scripts/fetch-music.mjs` | download chosen music tracks |

---

## 2. Environment variables (NAMES + purpose only — never values)

All env vars are read from **`web/.env`** (gitignored; template is `web/.env.example`).
They exist solely for the **dev-only TTS path and the offline voice-baking scripts**.
The production SPA reads NO env vars. `.env` parsing is identical across
`vite.config.js`, `generate-voice.mjs`, and the other bake scripts (hand-rolled:
skip `#` comments, `KEY=VALUE`, strip surrounding quotes; `process.env` wins).

| env var | purpose |
|---|---|
| `ELEVENLABS_API_KEY` | ElevenLabs account key. Required by every TTS path (dev `/api/tts` + all bake scripts). Absent ⇒ the dev endpoint stays silent (never robotic); the scripts exit with an error. |
| `ELEVEN_VOICE_COOK` | Voice id for the **Cook** (male tutor narrator; also narrates all 8 intros). |
| `ELEVEN_VOICE_MOM` | Voice id for **Mom** (female). |
| `ELEVEN_VOICE_KID` | Voice id for the **Kid** (bright child apprentice — Babushka's-Room counter cast). |
| `ELEVEN_VOICE_GRANDPA` | Voice id for **Grandpa** (gruff old elder — counter cast). |

The Cat has **no** env var — its meows are ElevenLabs sound-generation SFX
(`MEOW_SFX` in `voiceLines.js`, a `shell-nav`-owned file — pointer). The
speaker→`voiceEnv` mapping lives in `SPEAKERS` (`voiceLines.js`, `shell-nav` —
pointer); `vite.config.js`'s `ttsServer` imports `SPEAKERS` to resolve `voiceEnv`
→ id. `.env.example` documents discovery: `npm run voice -- --find russian` /
`--mine` list candidate voice ids.

---

## 3. Vite dev-middleware endpoints (dev-only — NOT in `vite build`)

Both are registered via `configureServer` in `vite.config.js`, so they exist only
under `npm run dev`. A production build silently lacks them (clients degrade
gracefully — see `gotchas.md`).

### `/__ink` (ink-logger middleware) — captures real tablet handwriting samples
Appends to `web/ink-log.jsonl` (laptop side) so real tablet strokes can be
inspected to improve digit recognition. The **recognizer that produces the captured
guess** is `ink-recognition`-owned (pointer); this slice owns only the endpoint +
the `ink-log.jsonl` sink.
| method | behavior |
|---|---|
| `POST` | Read body (capped at ~8 MB, else `req.destroy()`), strip CR/LF to keep one record per line, `appendFileSync` one JSONL line to `ink-log.jsonl`, respond `204`. Each record is a captured sample: raw stroke points + a PNG thumbnail + the recognizer's guess. |
| `DELETE` | Truncate `ink-log.jsonl` (`writeFileSync('')`), respond `204`. |
| `GET` | Respond JSON `{ entries: N }` where N = non-empty line count of the log. |

### `POST /api/tts` (tts-server middleware) — dev in-character TTS synthesis
Synthesizes one on-screen line in the matching ElevenLabs character voice (same
model/settings as `generate-voice.mjs`) and caches the mp3. This is what lets
EVERY string be read aloud in-character without a robotic browser voice (voice
posture: constitution §5.9; `voice.js`/`voiceLines.js` are `shell-nav`-owned —
pointer).
- **Request:** `POST` only (other methods ⇒ `405`). JSON body `{ text, speaker }`;
  `text` trimmed to ≤600 chars, `speaker` defaults `"cook"`. Body capped ~100 KB.
- **Resolution:** `apiKey = ELEVENLABS_API_KEY`; `voiceId = SPEAKERS[speaker].voiceEnv → env id`.
  Missing key OR unset voice (e.g. the Cat) ⇒ silent `204` (never robotic).
- **Cache:** key = `sha1(speaker + '|' + text)` (first 16 hex) → file
  `public/voice/cache/<speaker>-<hash>.mp3`. Cache hit ⇒ serve from disk; the cache
  dir is gitignored (`web/.gitignore`) and regenerated lazily. Concurrent identical
  requests are deduped via an `inflight` Map.
- **Upstream:** `POST {ELEVENLABS_API}/v1/text-to-speech/{voiceId}` with
  `model_id eleven_multilingual_v2`, `output_format mp3_44100_128`, and
  `voice_settings { stability 0.22, similarity_boost 0.8, style 0.7, use_speaker_boost true }`.
  On any error: log a warn, respond silent `204`.
- **Response (success):** `audio/mpeg`, `Cache-Control: public, max-age=31536000`.

---

## 4. Generated / on-disk artifacts produced by the toolchain
- `web/public/voice/<key>.mp3` — pre-baked clips (offline bake scripts, §below).
- `web/public/voice/cache/` — lazily synthesized dev `/api/tts` clips (gitignored).
- `web/.voice-manifest.json` — fingerprint store written by `generate-voice.mjs`;
  hashes `{speaker, sfx, text}` per clip so a clip is re-baked only when its WORDS
  or SPEAKER change (NOT just when the mp3 is missing). Kept OUT of `public/` so it
  never ships. A pre-existing clip with no recorded hash is adopted on first run
  (no surprise API spend).
- `web/public/music/<slug>.mp3` — background tracks downloaded by `fetch-music.mjs`
  (always mp3; Ogg sources are transcoded via bundled static ffmpeg).
- `web/ink-log.jsonl` — dev `/__ink` capture sink (in repo, 5 sample records).

---

## 5. Build/asset scripts (`web/scripts/**`) — purpose + entry behavior
These run under Node directly (not Vite) and only touch ElevenLabs / Wikimedia
Commons; none are part of the runtime bundle. Spoken text source of truth is
`voiceLines.js` / the `intro*.js` cue sheets (`shell-nav` — pointer).

| script | npm | what it does |
|---|---|---|
| `generate-voice.mjs` | `voice` | Bake `LINES` + intro cues → `public/voice/<key>.mp3`. `--force` re-bake all, `--only k1,k2`, `--find russian` / `--mine` discover voice ids. Cat lines bake as sound-generation SFX. Manifest-driven (re-bakes on text/speaker change). |
| `bake-all-voice.mjs` | (node) | Authoritative comprehensive baker: every static keyed line across ALL lessons + 8 intro sheets + meows. Diffs against existing clips (empty file = missing). `--dry` / `--force` / `--only`. |
| `bake-intro-voice.mjs` | (node) | Re-bake just the 8 intro narration cue sheets (all Cook). `--dry` / `--force`. |
| `audition-voices.mjs` | `audition` | Bake a per-character comparison table of candidate voices → `public/voice/_audition/index.html`. |
| `fetch-music.mjs` | `music-fetch` | Download the chosen free-licensed Commons tracks → `public/music/<slug>.mp3`; transcode Ogg→mp3 via `ffmpeg-static`; retry/back-off on Commons 429. |
| `fetch-music-audition.mjs` | `music-audition` | Build a music-candidate audition page that streams straight from Commons' CDN (deterministic MD5-derived URL; no download). |
| `shoot.mjs` | (node) | Parameterized headless-Chromium (Playwright) screenshot tool driven by a spec JSON (`route`/`url`, viewport, ordered `steps` actions). Backbone of the `.ui-sweep` workflow. `SHOOT_BASE` env overrides base URL (default `http://localhost:5173`). |
| `shoot-intros.mjs` | (node) | Capture each intro "video" at its equation-reveal beat via `window.__anim.seek/play`. Output `scripts/intro-shots/`. |

`web/.ui-sweep/**` is a one-off UI-bug-sweep harness (workflow `.mjs` orchestrators
+ per-page spec JSONs + captured `shots/`/`out/` PNGs + `REPORT.md`). It is dev
tooling/evidence, not shipped — driven by `scripts/shoot.mjs`.
