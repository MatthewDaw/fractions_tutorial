# env-and-config — shell-nav fragment

Config owned by the shell/nav slice: the settings record + its localStorage keys,
the other persistence keys this slice reads/writes, the build-env reads used by the
chrome screens and audio, and the voice env-var NAMES. Engine PARAMS and the
Vite-middleware config are owned by engine-core / leftovers respectively.

---

## Persistence keys (localStorage)

| Key | Owner-of-write | Shape | Notes |
|---|---|---|---|
| `bf_settings_v1` | `settings.js` | `{ voiceVol, musicVol, inputMode }` | The settings record (see below). |
| `moms-kitchen-progress-v1` | `kitchenProgress.js` (legacy write) + engine migration (read) | `{ mastered: string[] }` | Legacy binary progress; STILL written by `saveMastered` for back-compat, and read by the engine's `migrateFromKitchenProgress` to seed priors. |
| `moms-engine-log-v1` | engine `log.ts` (pointer: engine-core) | append-only Event log | Authoritative mastery source; this slice READS it via `loadLog()`/`measurementReduce` (Shell, conceptTree, kitchenProgress). |
| `musicVolume` (legacy) | none (read-once) | `"0".."1"` float string | Pre-settings music level; one-time migrated by `settings.js` on first run. |
| `musicMuted` (legacy) | none (read-once) | `"1"` = muted | Pre-settings music mute; one-time migrated. |
| `<STAGE_PERSIST_KEY>:t` | iframe intro `<Stage>` (write) + `RoomIntro` (reset/read) | seconds (float string) | The intro video's playhead clock; narration gates ride it. One key per room (e.g. `samesize.v2:t`). |
| `stumpingRecipeId` (**sessionStorage**, not localStorage) | kitchen (write) + Shell (read-once+clear) | recipe id string | Wall→room→return handoff; cleared on read so a stale key can't mislabel a later direct entry. |

> Constitution §5.10: `bf_settings_v1`, `moms-kitchen-progress-v1`,
> `moms-engine-log-v1`, and the legacy `musicVolume`/`musicMuted` are stable — do not
> rename without a migration.

### Settings record migration (`settings.js`)
- On first run only (no `bf_settings_v1` stored), the loader migrates the legacy
  `BackgroundMusic` keys: `musicMuted === "1"` → `musicVol = 0`; else a finite
  `musicVolume` (0–1 float) → `musicVol = clamp(round(mv*100))`. After that the
  legacy keys are never read again.
- `setSettings(patch)` merges → normalizes → writes the JSON → notifies subscribers.
  All consumers (`BackgroundMusic`, `voice.js`, `Slate`) subscribe for live updates.

---

## Build env (Vite `import.meta.env`) — reads in this slice

| Name | Where read | Purpose |
|---|---|---|
| `import.meta.env.DEV` | `Shell.jsx` | Gate the DEV `MasteryInspector` mount (`showInspector`). |
| `import.meta.env.BASE_URL` | `music.js`, `voice.js`, `RoomIntro.jsx` | Asset base prefix for `music/`, `voice/`, and the `/api/tts` URL — so the app works under a non-root deploy base. |

> The dev-only `/api/tts` endpoint that `voice.js` POSTs to (and `/__ink`) are Vite
> middleware owned by `leftovers` (`vite.config.js`); documented there. `voice.js`
> builds the URL as `import.meta.env.BASE_URL + "api/tts"`.

---

## Voice env vars (NAMES only) — `web/.env.example`

Used by the voice-baking scripts (pointer: leftovers `scripts/*voice*.mjs`) and the
dev `/api/tts` service; `voiceLines.js` `SPEAKERS[*].voiceEnv` points at these names.

| Env var name | Purpose |
|---|---|
| `ELEVENLABS_API_KEY` | ElevenLabs API auth for TTS synthesis/baking. |
| `ELEVEN_VOICE_COOK` | Voice id for the Cook (male tutor). |
| `ELEVEN_VOICE_MOM` | Voice id for Babushka (female). |
| `ELEVEN_VOICE_KID` | Voice id for the Kid (child apprentice, kitchen banter). |
| `ELEVEN_VOICE_GRANDPA` | Voice id for Grandpa (kitchen banter). |

The Cat is NOT a speaker (no env var) — its clips are generated as sound effects
from `MEOW_SFX`.

---

## Static asset config

- `web/public/intros/*.html` (10) — self-contained animated intro "videos",
  referenced by `rooms.js` `intro` URLs.
- `web/public/music/*.mp3` (5 tracks + `_audition/`) — slugs MUST match `music.js`
  `MUSIC` and `scripts/fetch-music.mjs` (change a pick in both, then
  `npm run music-fetch -- --force`). All MP3 (Ogg is not universally decoded).
- `web/public/voice/*.mp3` (~203 clips + `README.md`) — pre-baked clips keyed by
  `voiceLines.js` `LINES` keys and `intro*.js` cue `key`s; TTS cache lands in
  `public/voice/cache/`.
- `web/public/settings-gear.png` — the gear icon used by the FAB + `SettingsButton`.

---

## Other config notes

- No router/config file — routing is hash-based in `Shell.jsx`. No env-driven
  feature flags in this slice (engine feature flags live in engine PARAMS;
  pointer: engine-core).
- `index.html` loads Google Fonts (Old Standard TT, Russo One, Stardos Stencil,
  Special Elite, JetBrains Mono) via `<link>`; the viewport is locked
  (`maximum-scale=1, user-scalable=no`) for the tablet stage.
