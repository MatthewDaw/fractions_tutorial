# API contracts

The program-facing contracts. There is no production HTTP server; all contracts are
module exports, a CLI, and dev-only Vite middleware.

- **Engine public API** (`engine/index.ts` exports) — documented in `data-model.md`
  ("Public surface — `index.ts`"). It is the wire-DTO surface a Python relocation
  would re-implement; the harness binds to it via `engineApi.js` (§4 below).
- **Dev-only Vite HTTP endpoints** (`/__ink`, `POST /api/tts`) — documented in
  `env-and-config.md` (leftovers, "Vite dev-middleware endpoints"). They exist ONLY
  under `npm run dev`; a `vite build` bundle has none of them, and callers degrade
  gracefully (see `gotchas.md` G-L2).
- **Harness CLI + emitted artifacts + module surfaces** — below.

---

# Harness — CLI surface + emitted artifacts

> Source: `web/src/harness/cli.js`, `index.js`, `config.js`, `engineApi.js`, `tape.js`.

## 1. The CLI — `npm run harness -- <subcommand> [flags]`

The package script is `"harness": "vite-node src/harness/cli.js --"`. `vite-node`
reuses Vite's TS pipeline so the engine's `.ts` imports (reached via `.js` specifiers)
resolve with zero extra config — this is why the CLI runs the *real* engine, not a
mock. `fs` is permitted in `cli.js` ONLY (the single Node-only doc/tape sink).

### 1.1 Argument parsing (`parseArgs`)
A minimal own parser (NOT a CLI library): strips a literal `--`; the FIRST
non-`--`-prefixed token is the subcommand; a `--key value` pair becomes `opts.key =
value`; a `--key` followed by another `--flag` (or end) becomes `opts.key = true`;
remaining positionals collect into `opts._`.

### 1.2 Subcommands

| Subcommand | What it does | Determinism guarantee |
|---|---|---|
| `baseline` | Full seeded sweep (all personas × all skills) → tapes + every report projection. | Runs the sweep TWICE; asserts byte-identical JSONL; `process.exitCode = 1` on mismatch. |
| `search` | Adversarial nearest-decision-flip search on one skill → frozen champion fixture JSON. | Reported `{ latent, seed }` replays the exact flip. |
| `loop` | Recursive certification loop with plan-002's flags as the canonical change + the flags-off→on certification matrix → decision log. | Verdict reads `NO_CHANGE` today (inert flags); the seal must NOT fabricate a `REAL`. |
| `report` | RE-PROJECTS every doc from the committed baseline tapes. | Re-projection reproduces the docs byte-for-byte. |
| `(none)` + `--dry` | Smoke check: prints skill-node count, generator count, `params_hash`. | n/a |
| `(unknown)` | Prints the usage line. | n/a |

Usage line (exact):
`usage: harness <baseline|search|loop|report> [--seed N] [--flags-on] [--skill ID] [--dry]`

### 1.3 Flags

| Flag | Type | Default | Read by | Meaning |
|---|---|---|---|---|
| `--seed N` | number | `1` | all | Run seed. `baseline`/`report` name the tape `baseline-seed<N>.jsonl`. `loop` derives the sealed seed as `(seed ^ 0x5ea1ed) >>> 0`. |
| `--flags-on` | boolean | off | `baseline`, (implicit in `loop`) | Turn ON the four plan-002 flags `{fluencyHardMode, frustrationScaffold, delayedProbe, unifiedTaxonomy}`. OFF = `defaultFlags()` (all false). |
| `--skill ID` | string | `ADD_SAME_DEN` | `search` | Engine skill node id the search targets. |
| `--n N` | number | `5` | `search` | Number of champion fixtures to distil/freeze. |
| `--dry` | boolean | off | all | Compute but DO NOT write any artifact. |

RFC-2119: A `--flags-on` run MUST still report the six audit defects as present (the
flags are inert stubs; ADR 0001). The CLI MUST NOT treat `--flags-on` as "defects
resolved".

## 2. Emitted artifacts (all under repo-root `docs/harness/`)

`cli.js` resolves `DOCS = <harness>/../../../docs/harness` (repo root, NOT `web/`).
`TAPES_DIR = docs/harness/tapes`, `CHAMPIONS_DIR = docs/harness/champions`.
`writeDoc(name, contents)` `mkdir -p`s and ensures a trailing newline.

### 2.1 `baseline` writes

| Path | Producer |
|---|---|
| `docs/harness/tapes/baseline-seed<N>.jsonl` | `tapesToJsonl(runSweep(...))` — the signed replay tape, one canonical JSON session per line; the single source of truth all docs project from. |
| `docs/harness/baseline-report.md` | `renderBaselineReportMarkdown(buildBaselineReport(tapes))` |
| `docs/harness/improvement-backlog.md` | `renderBacklogMarkdown(buildBacklog(tapes,{flags}))` |
| `docs/harness/verdict-cards.md` | `renderVerdictCardsMarkdown(buildVerdictCards(tapes))` |
| `docs/harness/limitations-memo.md` | `renderLimitationsMemoMarkdown(buildLimitationsMemo(tapes,{llmAvailable:false}))` |
| `docs/harness/research-notes.md` | `renderResearchNotesMarkdown()` (the only NON-projection doc) |

Console output: session count + determinism verdict, `false_mastery_rate`,
`missed_escalation_rate`, backlog count, human-audit agreement %, top verdict card.

### 2.2 `search` writes

`docs/harness/champions/champions-<skillId>-seed<N>.json` =
`JSON.stringify(distillChampions({searchResults, n, skillId}), null, 2)` — the minimal
`{latent, seed, skillId, flip, flipKind, distance, tauLatent}` replay keys. Only
written when `found` and not `--dry`. Committed example:
`docs/harness/champions/champions-ADD_SAME_DEN-seed4.json`.

### 2.3 `loop` writes

`docs/harness/decision-log.md` = `renderDecisionLogMarkdown(buildDecisionLog({loopVerdicts,
flagsOff, flagsOn}))` — loop changes (REAL/GAMING/NO_CHANGE) with params_hash
before→after + engine_sha, PLUS the flags-off→on certification matrix (each of the 6
audit defects: present-off / present-on / resolved).

### 2.4 `report` writes

Re-projects (from `docs/harness/tapes/baseline-seed<N>.jsonl`): `baseline-report.md`,
`improvement-backlog.md`, `verdict-cards.md`, `limitations-memo.md`,
`research-notes.md`. Missing tape → prints a hint to run `baseline --seed <N>` first and
sets `process.exitCode = 1`.

## 3. Public module surface — `harness/index.js`

The harness barrel re-exports: everything from `./engineApi.js`; from `./rng.js`
`personaRng`, `randInt`, `pick`, `chance`; from `./tape.js` `canonicalize`,
`canonicalStringify`, `fnv1a`, `hashObject`, `serializeSession`, `tapesToJsonl`,
`jsonlToTapes`, `writeTapesFile`, `readTapesFile`; from `./config.js` `makeRun`,
`defaultFlags`, `paramsHash`.

## 4. `engineApi.js` — the single engine bind point (wire-DTO seam)

The harness's ONE binding to the engine + generators + runtime; a future Python
relocation swaps `fetch` at THIS file only. Re-exports:
- engine: `measurementReduce`, `nextDecision`, `legalMoves`, `isMastered`, `PARAMS`,
  `allNodes`, `getNode`, `prereqsOf`, `mostUpstreamUnmastered`, `appendEvent`,
  `foldLog`, `segment`.
- generators: `generateFor`, `generatorSkills`, `surfaceFormsFor`, `hasGenerator`.
- runtime: `nextPractice`, `otherSurfaceForm` (from `runtime/practiceFlow.js`).

## 5. Run config — `config.js`

- `defaultFlags()` → `{ fluencyHardMode:false, frustrationScaffold:false,
  delayedProbe:false, unifiedTaxonomy:false }`.
- `makeRun(opts)` → normalized `{ run_id, seed, stepCap (default 40), personaIds|null,
  skillIds|null, flags, params_hash }`. `null` ids mean "all". `params_hash =
  hashObject(PARAMS)` — attribution only; PARAMS is read READ-ONLY and never seeds
  personas (disjointness).
- `paramsHash()` → `hashObject(PARAMS)`.

## 6. Tape (de)serialization contract — `tape.js`

The signed replay tape is the SINGLE SOURCE OF TRUTH. Serialization is CANONICAL:
- `canonicalize(v)` — recursively sorts object keys and rounds finite numbers to 1e-9.
- `canonicalStringify(obj)` — `JSON.stringify(canonicalize(obj))`.
- `fnv1a(str)` — FNV-1a 32-bit hex (8-char). `hashObject(obj)` —
  `fnv1a(canonicalStringify(obj))`.
- `serializeSession(session)` — one session → one canonical JSON line.
- `tapesToJsonl(sessions)` / `jsonlToTapes(text)` — browser-safe (no `fs`).
- `writeTapesFile` / `readTapesFile` — Node-only sink (dynamic `import('node:fs/promises')`).

RFC-2119: Two runs of the same `(persona, seed, flags)` MUST serialize byte-identically.

## 7. Dashboard public surface — `dashboard/index.js`

Default export + named `HarnessDashboard`, `FailureHeatmap`, `RecursivePanel`,
`VerdictCard`. Data projections: `buildHeatmap`, `cardsForCell`, `runDemoSweep`,
`replaySession`, `DEMO_PERSONA_IDS`, `DEMO_SKILL_IDS`. `mountHarnessDashboard(el,
props)` dynamically imports `react-dom/client` + `react` so the module stays importable
under Node.

> WIRING NOTE: the dashboard is intentionally NOT wired into `Shell.jsx`. The intended
> dev-only branch is `if (import.meta.env.DEV && route === 'harness') return
> <HarnessDashboard/>` — pointer only.
