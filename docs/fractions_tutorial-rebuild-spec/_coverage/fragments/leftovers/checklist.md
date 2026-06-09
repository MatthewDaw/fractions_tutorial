# leftovers — coverage checklist (one line per owned item)

Fragments: `env-and-config.md` (E), `gotchas.md` (G), `bundled-docs.md` (D).

## Root config
- [x] `pyproject.toml` — E §1 (Python tooling project, py>=3.13, no deps)
- [x] `uv.lock` — E §1 (resolved lockfile for empty-dep py project)
- [x] `CLAUDE.md` — D (gstack instructions / browsing policy / skill list)
- [x] `.ccss-contract.md` — pointer: it IS constitution §5.6 + the CCSS build contract; engine/lesson content owned by engine-core/lessons-rooms/shell-nav. Noted as reference; not re-documented.
- [x] `.gitignore` (root) — E §2/G-L4 (.env secret ignore, py/IDE/OS ignores)
- [x] `hiring_partners.csv` — D (unrelated recruiting CSV at repo root)

## Build / dev / test config (web/)
- [x] `web/package.json` — E §1 (scripts table + deps; versions → constitution §2)
- [x] `web/package-lock.json` — E §1 (npm lockfile; pins constitution §2 versions)
- [x] `web/vite.config.js` — E §1 (config) + E §3 (dev endpoints) + G-L1/G-L2/G-L3
- [x] `web/tsconfig.json` — E §1 (TS strict config)
- [x] `web/vitest.setup.js` — E §1 (jest-dom + RO/IO stubs)
- [x] `web/.env.example` — E §2 (env var NAMES table)
- [x] `web/.gitignore` — E §1/§4 (node_modules/dist/.vite + voice cache ignore)

## Dev middleware endpoints (in vite.config.js)
- [x] `POST /__ink` — E §3 (append capture to ink-log.jsonl); recognizer → ink-recognition (pointer)
- [x] `DELETE /__ink` — E §3 (truncate log)
- [x] `GET /__ink` — E §3 (entry count)
- [x] `POST /api/tts` — E §3 (in-character TTS synth + cache); voice → shell-nav (pointer)

## Scripts (web/scripts/**)
- [x] `generate-voice.mjs` — E §4 (`npm run voice`) + E §1 manifest note
- [x] `bake-all-voice.mjs` — E §4 (comprehensive baker)
- [x] `bake-intro-voice.mjs` — E §4 (8 intro cue sheets)
- [x] `audition-voices.mjs` — E §4 (`npm run audition`)
- [x] `fetch-music.mjs` — E §4 (`npm run music-fetch`; ffmpeg transcode)
- [x] `fetch-music-audition.mjs` — E §4 (`npm run music-audition`)
- [x] `shoot.mjs` — E §4 (Playwright screenshot tool, spec JSON)
- [x] `shoot-intros.mjs` — E §4 (intro beat capture)
- [x] `scripts/intro-shots/` — captured intro screenshots (output of shoot-intros) — E §4 (pointer)

## Tools / assets / generated artifacts
- [x] `web/tools/ink-dump/**` — G-L5 (decoded sample-cell PNGs; output of dump-ink.mjs which is ink-recognition-owned — pointer)
- [x] `web/.ui-sweep/**` — E §4 + G-L5 (one-off UI-bug-sweep harness + REPORT.md + shots)
- [x] `web/ink-log.jsonl` — E §3/§4 + G-L5 (dev /__ink capture sink, 5 records)
- [x] `web/_fit.png` — G-L5 (stray debug screenshot)
- [x] `web/_ink_big.png` — G-L5 (stray debug screenshot)

## Bundled docs (listed, not re-documented)
- [x] `docs/design/**` — D
- [x] `docs/plans/**` — D
- [x] `docs/ideation/**` — D
- [x] `docs/inspiration/**` — D
- [x] `docs/room_break_down/**` — D
- [x] `docs/wireframes/**` — D
- [x] `docs/proof/**` — D
- [x] `docs/harness/**` — D (pointer → harness slice owns content)
- [x] `docs/HANDOFF-engine-surfaces.md` — D (pointer → ui-surfaces)

## .claude/**
- [x] `.claude/agents/**`, `.claude/skills/**`, `.claude/orchestrate/**`, `.claude/worktrees/**`, `.claude/scheduled_tasks.lock` — D (agent harness scaffolding, not app code)

## Excluded by partition (NOT mine)
- `docs/fractions_tutorial-rebuild-spec/**` — the spec itself (excluded from leftovers globs)
- `web/tools/train_mnist.py`, `web/tools/dump-ink.mjs` — ink-recognition (referenced by pointer only)
