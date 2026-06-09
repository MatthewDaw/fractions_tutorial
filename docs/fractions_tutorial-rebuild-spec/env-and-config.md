# Environment & configuration

Env var NAMES + purpose (values NEVER recorded), engine PARAMS tunables + feature
flags, the Vite build/dev config, the dev-only middleware endpoints, the settings
record + localStorage keys, and the static-asset config. Three slices contribute:
engine-core (PARAMS + engine-owned keys), shell-nav (settings + chrome env), leftovers
(build/dev toolchain + env vars + dev middleware).

---

# Engine tunables and persistence (engine-core)

The engine has NO env vars and NO build config of its own. Its "configuration" is the
centralized `PARAMS` object (`params.ts`) plus a few module-local tunable records —
runtime tunables (the harness sweeps them), not environment values.

## `PARAMS` — `web/src/engine/params.ts` (KTD10)

| Param | Default | Purpose |
|---|---|---|
| `bkt.P_T` | `0.20` | BKT probability of learning |
| `bkt.P_S` | `0.10` | BKT probability of slip |
| `bkt.P_G` | `0.20` | BKT probability of guess |
| `P_L0` | `0.10` | cold-start prior before prereq propagation |
| `prereqWeight` | `0.3` | prereq propagation weight (`w` in coldStart) |
| `priorClamp` | `[0.05, 0.85]` | clamp on the cold-start prior |
| `pKnownClamp` | `[0.01, 0.99]` | clamp on P_known after each BKT update |
| `gateThreshold` | `0.95` | P_known threshold the gate opens at (Chain A) |
| `wallTheta` | `0.6` | predicted-success θ below which WALL_HIT fires |
| `fadeStreakK` | `3` | consecutive clean corrects to FadeScaffold |
| `raiseErrorsM` | `2` | errors in a segment to RaiseScaffold |
| `fluencyMinN` | `5` | min corrects before fluency is evaluated |
| `creditDiscount` | `0.3` | discount on a prereq BKT update (DAG credit) |
| `latencyFloorMs` | `1200` | plausible-compute floor; correct below it → too_fast_correct |
| `fluencyHardMode` | `false` | **flag** — make fluency a HARD gate conjunct (default soft, reversible) |
| `fluencyLatencyTargetMs` | `15000` | latency ceiling used by fluencyOk when hardMode on |
| `frustrationScaffold` | `false` | **flag** — warm reachable-foothold rationale on a frustration RaiseScaffold (U9, default off, reversible) |
| `escalation.nStuck` | `6` | stuck-attempts at floor before EscalateToHuman |
| `escalation.nDiseng` | `5` | sustained disengaged observations before escalate |

### Feature-flag-like booleans
`fluencyHardMode` and `frustrationScaffold` are inert-by-default reversible flags
(both `false`), flipped in tests by mutating `PARAMS` directly and reset in `afterEach`.
The harness owns the plan-002 flags `delayedProbe`/`unifiedTaxonomy` (NOT in `params.ts`).

### Module-local constants (NOT in PARAMS)
- `dimensions.ts`: `SLOPE_EPS = 500`, `INDEPENDENCE_MIN_SCAFFOLD = 3`,
  `INDEPENDENCE_MIN_COUNT = 2`, `INDEPENDENCE_MIN_DISTINCT_PROBLEMS = 2`,
  `TRANSFER_MAX_SCAFFOLD = 3`, `TRANSFER_MIN_COUNT = 2`, `TRANSFER_MIN_DISTINCT_FORMS = 2`,
  `HINT_DEPENDENCE_THRESHOLD = 2`, `HINT_DEPENDENCE_WINDOW = 5`.
- `decay.ts`: `PROBE_DELAYS_MS = [1d, 3d, 1w, 3w, 2mo]` (in ms).

## `observe/**` tunables (plan 005)
- **`OBSERVE_PARAMS`** (`observe/index.ts`): `driftControlN: 3`.
- **`BASELINE_PARAMS`** (`observe/baseline.ts`): `alpha 0.3`, `minSamples 5`,
  `floorK 1.5`, `floorMarginFrac 0.4`, `minFloorMs 300`, `scaffoldDifficultySlope 0.15`.
- **`DETECTOR_PARAMS`** (`observe/detectors.ts`): `idleThresholdMs 5000`,
  `transientIdleMs 8000`, `stallZ 2.0`, `stallFrac 1.0`, `scribbleCount 5`,
  `scribbleWindowMs 2000`.

## Persistence keys (engine-owned)
- **`moms-engine-log-v1`** (`log.ts` `LOG_STORAGE_KEY`) — the authoritative append-only
  Event log. Read/written ONLY by `loadLog`/`saveLog` (never inside a fold). Errors
  swallowed. Stable; do not rename without a migration (constitution §5.10).
- **`moms-kitchen-progress-v1`** (`log.ts` `KITCHEN_PROGRESS_KEY`) — legacy binary
  `{ mastered: string[] }`. The engine only READS it (in `migrateFromKitchenProgress`)
  to seed priors (mastered room → 0.80, absent → 0.10); owned/written by shell-nav.

> The engine has NO env vars; engine purity forbids reading any ambient config.

---

# Shell / nav configuration (shell-nav)

## Persistence keys (localStorage)

| Key | Owner-of-write | Shape | Notes |
|---|---|---|---|
| `bf_settings_v1` | `settings.js` | `{ voiceVol, musicVol, inputMode }` | The settings record. |
| `moms-kitchen-progress-v1` | `kitchenProgress.js` (legacy) + engine migration (read) | `{ mastered: string[] }` | Legacy binary progress; still written for back-compat, read by the engine to seed priors. |
| `moms-engine-log-v1` | engine `log.ts` | append-only Event log | Authoritative; this slice READS it via `loadLog()`/`measurementReduce`. |
| `musicVolume` (legacy) | none (read-once) | `"0".."1"` float string | Pre-settings music level; one-time migrated. |
| `musicMuted` (legacy) | none (read-once) | `"1"` = muted | Pre-settings mute; one-time migrated. |
| `<STAGE_PERSIST_KEY>:t` | iframe intro `<Stage>` + `RoomIntro` (reset/read) | seconds (float string) | The intro video's playhead clock. One key per room. |
| `stumpingRecipeId` (**sessionStorage**) | kitchen (write) + Shell (read-once+clear) | recipe id string | Wall→room→return handoff; cleared on read. |

> Constitution §5.10: `bf_settings_v1`, `moms-kitchen-progress-v1`, `moms-engine-log-v1`,
> and the legacy `musicVolume`/`musicMuted` are stable — do not rename without a
> migration.

### Settings record migration (`settings.js`)
On first run only (no `bf_settings_v1`), the loader migrates the legacy
`BackgroundMusic` keys: `musicMuted === "1"` → `musicVol = 0`; else finite `musicVolume`
(0–1 float) → `musicVol = clamp(round(mv*100))`. After that the legacy keys are never
read again. `setSettings(patch)` merges → normalizes → writes → notifies subscribers.

## Build env (Vite `import.meta.env`) — reads in this slice

| Name | Where read | Purpose |
|---|---|---|
| `import.meta.env.DEV` | `Shell.jsx` | Gate the DEV `MasteryInspector` mount. |
| `import.meta.env.BASE_URL` | `music.js`, `voice.js`, `RoomIntro.jsx` | Asset base prefix so the app works under a non-root deploy base; `voice.js` builds `BASE_URL + "api/tts"`. |

## Voice env vars (NAMES only) — `web/.env.example`
Used by the voice-baking scripts and the dev `/api/tts` service;
`voiceLines.js::SPEAKERS[*].voiceEnv` points at these names.

| Env var name | Purpose |
|---|---|
| `ELEVENLABS_API_KEY` | ElevenLabs API auth for TTS synthesis/baking. |
| `ELEVEN_VOICE_COOK` | Voice id for the Cook (male tutor). |
| `ELEVEN_VOICE_MOM` | Voice id for Babushka (female). |
| `ELEVEN_VOICE_KID` | Voice id for the Kid (kitchen banter). |
| `ELEVEN_VOICE_GRANDPA` | Voice id for Grandpa (kitchen banter). |

The Cat is NOT a speaker (no env var) — its clips are SFX from `MEOW_SFX`.

## Static asset config
- `web/public/intros/*.html` (10) — self-contained animated intro "videos".
- `web/public/music/*.mp3` (5 tracks + `_audition/`) — slugs MUST match `music.js`
  `MUSIC` and `scripts/fetch-music.mjs`. All MP3.
- `web/public/voice/*.mp3` (~203 clips + `README.md`) — pre-baked clips keyed by `LINES`
  keys and `intro*.js` cue `key`s; TTS cache lands in `public/voice/cache/`.
- `web/public/settings-gear.png` — the gear icon.
- `index.html` loads Google Fonts (Old Standard TT, Russo One, Stardos Stencil, Special
  Elite, JetBrains Mono); the viewport is locked (`maximum-scale=1, user-scalable=no`).

---

# Build / dev toolchain + env vars (leftovers)

## 1. Build / dev toolchain config

### `web/vite.config.js` — the single build/dev/test config
One `defineConfig` drives dev server, production build, preview, AND vitest.
**Plugins (order load-bearing):** `resolveTsFromJs()` → `react()` → `inkLogger()` →
`ttsServer()`. `resolveTsFromJs()` has `enforce: 'pre'` so it resolves `.js`→`.ts`
specifiers before any other resolver (see `gotchas.md` G-L1). `inkLogger()`/`ttsServer()`
register middleware via `configureServer`, so they are **dev-only**.

**`optimizeDeps.exclude: ["onnxruntime-web"]`** — ort ships its own `.wasm`/`.mjs`
loader; letting Vite pre-bundle it 500s the loader. (See `gotchas.md` G-L3 / G-INK-1.)

**`server`/`preview`:** `host: true` (binds `0.0.0.0` for a same-Wi-Fi tablet), `port:
5173`/`4173`, `strictPort: true`. **`test` block:** `globals: true`, `environment:
'jsdom'`, `setupFiles: ['./vitest.setup.js']`, `include: ['tests/**/*.test.{js,jsx,ts,tsx}']`.

### `web/vitest.setup.js`
Imports `@testing-library/jest-dom`, installs no-op `ResizeObserver`/`IntersectionObserver`
stubs (jsdom lacks both).

### `web/tsconfig.json`
`target ES2022`, `module ESNext`, `moduleResolution Bundler`, `jsx: preserve`, `strict:
true`, `allowJs: true`, `noEmit: true`, `skipLibCheck: true`, `esModuleInterop: true`,
`isolatedModules: true`, `lib: ["ES2022","DOM"]`, `include: ["src","tests"]`.
Type-checking only; Vite/esbuild transpile.

### `pyproject.toml` (repo root)
`name = "fractions-tutorial"`, `version = "0.1.0"`, `requires-python = ">=3.13"`,
`dependencies = []`. Only the Python tooling (`web/tools/train_mnist.py`) uses it.
`uv.lock` is the resolved (empty-dep) lockfile.

### npm scripts (`web/package.json`)
| script | command | purpose |
|---|---|---|
| `dev` | `vite --host` | dev server :5173, enables `/__ink` + `/api/tts` |
| `build` | `vite build` | static prod bundle (no dev endpoints) |
| `preview` | `vite preview --host` | preview built bundle :4173 |
| `test` | `vitest run` | full suite |
| `test:watch` | `vitest` | watch mode |
| `harness` | `vite-node src/harness/cli.js --` | synthetic-learner CLI |
| `voice` | `node scripts/generate-voice.mjs` | bake voice clips |
| `audition` | `node scripts/audition-voices.mjs` | voice-candidate comparison page |
| `music-audition` | `node scripts/fetch-music-audition.mjs` | music-candidate page |
| `music-fetch` | `node scripts/fetch-music.mjs` | download chosen music tracks |

## 2. Environment variables (NAMES + purpose only — never values)

All env vars are read from **`web/.env`** (gitignored; template `web/.env.example`).
They exist solely for the **dev-only TTS path and the offline voice-baking scripts**.
The production SPA reads NO env vars. `.env` parsing is hand-rolled (skip `#`, `KEY=VALUE`,
strip quotes; `process.env` wins).

| env var | purpose |
|---|---|
| `ELEVENLABS_API_KEY` | ElevenLabs account key. Required by every TTS path. Absent ⇒ the dev endpoint stays silent (never robotic); scripts exit with an error. |
| `ELEVEN_VOICE_COOK` | Voice id for the Cook (male tutor; also narrates the intros). |
| `ELEVEN_VOICE_MOM` | Voice id for Mom (female). |
| `ELEVEN_VOICE_KID` | Voice id for the Kid (counter cast). |
| `ELEVEN_VOICE_GRANDPA` | Voice id for Grandpa (counter cast). |

The Cat has **no** env var — its meows are ElevenLabs SFX (`MEOW_SFX`).

## 3. Vite dev-middleware endpoints (dev-only — NOT in `vite build`)

Both are registered via `configureServer`, so they exist only under `npm run dev`.

### `/__ink` (ink-logger middleware) — captures real tablet handwriting samples
Appends to `web/ink-log.jsonl` so real strokes can be inspected to improve recognition.
| method | behavior |
|---|---|
| `POST` | Read body (capped ~8 MB, else `req.destroy()`), strip CR/LF, `appendFileSync` one JSONL line, respond `204`. Each record = raw stroke points + a PNG thumbnail + the recognizer's guess. |
| `DELETE` | Truncate `ink-log.jsonl`, respond `204`. |
| `GET` | Respond JSON `{ entries: N }` (non-empty line count). |

### `POST /api/tts` (tts-server middleware) — dev in-character TTS synthesis
Synthesizes one on-screen line in the matching ElevenLabs character voice and caches the
mp3. This is what lets EVERY string be read aloud in-character without a robotic voice
(constitution §5.9).
- **Request:** `POST` only (else `405`). JSON `{ text, speaker }`; `text` trimmed to ≤600
  chars, `speaker` defaults `"cook"`. Body capped ~100 KB.
- **Resolution:** `apiKey = ELEVENLABS_API_KEY`; `voiceId = SPEAKERS[speaker].voiceEnv →
  env id`. Missing key OR unset voice ⇒ silent `204`.
- **Cache:** key = `sha1(speaker + '|' + text)` (first 16 hex) →
  `public/voice/cache/<speaker>-<hash>.mp3`; cache dir gitignored. Concurrent identical
  requests deduped via an `inflight` Map.
- **Upstream:** `POST {ELEVENLABS_API}/v1/text-to-speech/{voiceId}` with `model_id
  eleven_multilingual_v2`, `output_format mp3_44100_128`, `voice_settings { stability
  0.22, similarity_boost 0.8, style 0.7, use_speaker_boost true }`. On any error: warn +
  silent `204`.
- **Response (success):** `audio/mpeg`, `Cache-Control: public, max-age=31536000`.

## 4. Generated / on-disk artifacts produced by the toolchain
- `web/public/voice/<key>.mp3` — pre-baked clips. `web/public/voice/cache/` — lazily
  synthesized dev clips (gitignored). `web/.voice-manifest.json` — fingerprint store
  (hashes `{speaker, sfx, text}` so a clip is re-baked only on WORD/SPEAKER change; kept
  OUT of `public/`). `web/public/music/<slug>.mp3` — downloaded by `fetch-music.mjs`.
  `web/ink-log.jsonl` — dev `/__ink` capture sink (5 sample records in repo).

## 5. Build/asset scripts (`web/scripts/**`)
Run under Node directly; none ship in the bundle. Spoken-text source of truth is
`voiceLines.js` / the `intro*.js` cue sheets.
| script | npm | what it does |
|---|---|---|
| `generate-voice.mjs` | `voice` | Bake `LINES` + intro cues → `public/voice/<key>.mp3` (`--force`/`--only`/`--find`/`--mine`). Manifest-driven. |
| `bake-all-voice.mjs` | (node) | Comprehensive baker: every static keyed line + 8 intro sheets + meows. `--dry`/`--force`/`--only`. |
| `bake-intro-voice.mjs` | (node) | Re-bake just the 8 intro cue sheets (all Cook). |
| `audition-voices.mjs` | `audition` | Per-character candidate-voice comparison page. |
| `fetch-music.mjs` | `music-fetch` | Download chosen Commons tracks; transcode Ogg→mp3 via `ffmpeg-static`; retry/back-off. |
| `fetch-music-audition.mjs` | `music-audition` | Music-candidate page streaming from Commons' CDN. |
| `shoot.mjs` | (node) | Parameterized headless-Chromium screenshot tool (spec JSON). `SHOOT_BASE` overrides base URL. |
| `shoot-intros.mjs` | (node) | Capture each intro at its equation-reveal beat. Output `scripts/intro-shots/`. |

`web/.ui-sweep/**` is a one-off UI-bug-sweep harness (dev evidence, not shipped).

## 6. CCSS denominator contract (`.ccss-contract.md`)
Lessons must stay inside the grade-3–5 denominator set `{2, 3, 4, 5, 6, 8, 10, 12, 100}`
— never 7 or 9 — enforced via `ccss.js::isInGrade`/`filterBankInGrade` (shell-nav).
NOTE: the *generator* tier pools are NOT run through this filter and several include 7/9
at higher tiers — a latent contract tension flagged in `gotchas.md` G-GOTCHA-3.
