# Harness — API contracts (CLI surface + emitted artifacts)

> Slice `harness` fragment. The CLI surface, its subcommands/flags, and every
> artifact file it emits. The engine/generator functions the harness binds to are
> documented by `engine-core` / `generators`; here we document only the harness's
> own contracts. Source: `web/src/harness/cli.js`, `index.js`, `config.js`,
> `engineApi.js`, `tape.js`.

---

## 1. The CLI — `npm run harness -- <subcommand> [flags]`

The package script (`web/package.json`) is:

```
"harness": "vite-node src/harness/cli.js --"
```

So the literal invocation is `npm run harness -- <sub> [flags]`. `vite-node`
reuses Vite's TS pipeline, so the engine's `.ts` imports (reached via `.js`
specifiers) resolve with zero extra config (this is why the CLI runs the *real*
engine, not a mock). `fs` is permitted in `cli.js` only — it is the single
Node-only doc/tape sink; every pure core (`sessionRunner`, `metrics`, `report`,
`findings`, `search`, `recursiveLoop`, `oracle/**`, `tape` serialization) never
touches `fs`.

### 1.1 Argument parsing (`parseArgs`)

The harness MUST parse argv with its own minimal parser (`cli.js::parseArgs`),
NOT a CLI library:

- It strips a literal `--` separator token from argv.
- The FIRST non-`--`-prefixed token is the subcommand (`sub`).
- A `--key value` pair becomes `opts.key = value`; a `--key` followed by another
  `--flag` (or end of argv) becomes `opts.key = true` (boolean flag).
- Remaining positionals collect into `opts._`.

### 1.2 Subcommands

| Subcommand | What it does | Determinism guarantee |
|---|---|---|
| `baseline` | Full seeded sweep (all personas × all skills) → tapes + every report projection. | Runs the sweep TWICE and asserts the two JSONL serializations are byte-identical; sets `process.exitCode = 1` on mismatch. |
| `search` | Adversarial nearest-decision-flip search on one skill → frozen champion fixture JSON. | Reported `{ latent, seed }` replays the exact flip. |
| `loop` | Recursive certification loop with plan-002's flags as the canonical change, + the flags-off→on certification matrix → decision log. | Verdict reads `NO_CHANGE` today (inert flags) — the seal must NOT fabricate a `REAL`. |
| `report` | RE-PROJECTS every doc from the committed baseline tapes (proves docs are pure projections). | Re-projection from the committed tape reproduces the docs byte-for-byte. |
| `(none)` + `--dry` | Smoke check: prints skill-node count, generator count, and `params_hash`. | n/a |
| `(unknown)` | Prints the usage line. | n/a |

Usage line (exact):
`usage: harness <baseline|search|loop|report> [--seed N] [--flags-on] [--skill ID] [--dry]`

### 1.3 Flags (per `flagsFrom` / each `cmd*`)

| Flag | Type | Default | Read by | Meaning |
|---|---|---|---|---|
| `--seed N` | number | `1` | all subcommands | Run seed. `baseline`/`report` name the tape file `baseline-seed<N>.jsonl`. `loop` derives the sealed held-out seed as `(seed ^ 0x5ea1ed) >>> 0`. |
| `--flags-on` | boolean | off | `baseline`, (implicit in `loop`) | Turn ON all four plan-002 flags `{fluencyHardMode, frustrationScaffold, delayedProbe, unifiedTaxonomy}`. OFF = `defaultFlags()` (all false = today's behavior). |
| `--skill ID` | string | `ADD_SAME_DEN` | `search` | Engine skill node id the search targets (and the champion fixture replays against). |
| `--n N` | number | `5` | `search` | Number of champion fixtures to distil/freeze. |
| `--dry` | boolean | off | all | Compute but DO NOT write any artifact. With no subcommand, prints the dry smoke line. |

RFC-2119: A `--flags-on` run MUST still report the six audit defects as present,
because the flags are inert stubs (see ADR: inert-002-flags). The CLI MUST NOT
silently treat `--flags-on` as "defects resolved".

---

## 2. Emitted artifacts (all under repo-root `docs/harness/`)

`cli.js` resolves `DOCS = <harness>/../../../docs/harness` (repo root, NOT
`web/`). `TAPES_DIR = docs/harness/tapes`, `CHAMPIONS_DIR = docs/harness/champions`.
`writeDoc(name, contents)` `mkdir -p`s `docs/harness/` and ensures a trailing
newline.

### 2.1 `baseline` writes

| Path | Producer | Notes |
|---|---|---|
| `docs/harness/tapes/baseline-seed<N>.jsonl` | `tapesToJsonl(runSweep(...))` | The signed replay tape — one canonical JSON session per line. The single source of truth all docs project from. |
| `docs/harness/baseline-report.md` | `renderBaselineReportMarkdown(buildBaselineReport(tapes))` | Failure-mode report: counter-paired metrics table + ranked failure clusters. |
| `docs/harness/improvement-backlog.md` | `renderBacklogMarkdown(buildBacklog(tapes,{flags}))` | Ranked, reconciled findings backlog. |
| `docs/harness/verdict-cards.md` | `renderVerdictCardsMarkdown(buildVerdictCards(tapes))` | One card per failure cluster, ranked most-damning first, each with a replay key. |
| `docs/harness/limitations-memo.md` | `renderLimitationsMemoMarkdown(buildLimitationsMemo(tapes,{llmAvailable:false}))` | Every line grounded in a tape field or "(not observable)". |
| `docs/harness/research-notes.md` | `renderResearchNotesMarkdown()` | Authored companion (the only NON-projection doc). |

Console output (baseline): session count + determinism verdict, `false_mastery_rate`,
`missed_escalation_rate`, backlog item count, human-audit agreement %, top verdict card.

### 2.2 `search` writes

| Path | Producer | Notes |
|---|---|---|
| `docs/harness/champions/champions-<skillId>-seed<N>.json` | `JSON.stringify(distillChampions({searchResults, n, skillId}), null, 2)` | Frozen adversarial champion fixtures (the minimal `{latent, seed, skillId, flip, flipKind, distance, tauLatent}` replay keys). Only written when `found` and not `--dry`. |

The committed example fixture is `docs/harness/champions/champions-ADD_SAME_DEN-seed4.json`.

### 2.3 `loop` writes

| Path | Producer | Notes |
|---|---|---|
| `docs/harness/decision-log.md` | `renderDecisionLogMarkdown(buildDecisionLog({loopVerdicts, flagsOff, flagsOn}))` | Loop changes (REAL/GAMING/NO_CHANGE) with params_hash before→after + engine_sha, PLUS the flags-off→on certification matrix (each of the 6 audit defects: present-off / present-on / resolved). |

### 2.4 `report` writes

Re-projects (from `docs/harness/tapes/baseline-seed<N>.jsonl`):
`baseline-report.md`, `improvement-backlog.md`, `verdict-cards.md`,
`limitations-memo.md`, `research-notes.md`. If the committed tape is missing it
prints a hint to run `baseline --seed <N>` first and sets `process.exitCode = 1`.

---

## 3. Public module surface — `harness/index.js`

`harness/index.js` is the harness barrel. It re-exports:

- everything from `./engineApi.js` (the engine/generator/runtime bind — see §4),
- from `./rng.js`: `personaRng`, `randInt`, `pick`, `chance`,
- from `./tape.js`: `canonicalize`, `canonicalStringify`, `fnv1a`, `hashObject`,
  `serializeSession`, `tapesToJsonl`, `jsonlToTapes`, `writeTapesFile`,
  `readTapesFile`,
- from `./config.js`: `makeRun`, `defaultFlags`, `paramsHash`.

## 4. `engineApi.js` — the single engine bind point (wire-DTO seam)

The harness's ONE binding to the engine + generators + runtime. The rest of the
harness imports from this barrel so the "bind to the public API" claim is literal,
and a future Python relocation swaps `fetch` at THIS file only. Re-exports (by
pointer — owned by engine-core/generators/runtime-affect):

- engine: `measurementReduce`, `nextDecision`, `legalMoves`, `isMastered`,
  `PARAMS`, `allNodes`, `getNode`, `prereqsOf`, `mostUpstreamUnmastered`,
  `appendEvent`, `foldLog`, `segment`.
- generators: `generateFor`, `generatorSkills`, `surfaceFormsFor`, `hasGenerator`.
- runtime: `nextPractice`, `otherSurfaceForm` (from `runtime/practiceFlow.js`).

## 5. Run config — `config.js`

- `defaultFlags()` → `{ fluencyHardMode:false, frustrationScaffold:false, delayedProbe:false, unifiedTaxonomy:false }` (all default OFF = baseline).
- `makeRun(opts)` → normalized `{ run_id, seed, stepCap (default 40), personaIds|null, skillIds|null, flags, params_hash }`. `null` persona/skill ids mean "all". `params_hash = hashObject(PARAMS)` — attribution only; PARAMS is read READ-ONLY and never seeds personas (disjointness).
- `paramsHash()` → `hashObject(PARAMS)` (current engine param hash).

## 6. Tape (de)serialization contract — `tape.js`

The signed replay tape is the SINGLE SOURCE OF TRUTH. Serialization is CANONICAL:

- `canonicalize(v)` — recursively sorts object keys and rounds finite numbers to
  1e-9 precision (`roundFloat`), killing cross-runtime float drift.
- `canonicalStringify(obj)` — `JSON.stringify(canonicalize(obj))`.
- `fnv1a(str)` — FNV-1a 32-bit hex (8-char, zero-padded).
- `hashObject(obj)` — `fnv1a(canonicalStringify(obj))`.
- `serializeSession(session)` — one session → one canonical JSON line.
- `tapesToJsonl(sessions)` — many sessions → a JSONL string (trailing `\n`).
  Browser-safe (no `fs`).
- `jsonlToTapes(text)` — parse JSONL back to session objects.
- `writeTapesFile` / `readTapesFile` — Node-only sink (dynamic `import('node:fs/promises')`
  so the browser bundle never touches `fs`).

RFC-2119: Two runs of the same `(persona, seed, flags)` MUST serialize
byte-identically. The CLI `baseline` subcommand asserts this; the committed
tape MUST re-project the docs byte-for-byte via `report`.

## 7. Dashboard public surface — `dashboard/index.js`

- Default export + named `HarnessDashboard`, `FailureHeatmap`, `RecursivePanel`,
  `VerdictCard`.
- Data projections: `buildHeatmap`, `cardsForCell`, `runDemoSweep`,
  `replaySession`, `DEMO_PERSONA_IDS`, `DEMO_SKILL_IDS`.
- `mountHarnessDashboard(el, props)` — standalone mount; dynamically imports
  `react-dom/client` + `react` so the module stays importable under Node.
- WIRING NOTE: the dashboard is intentionally NOT wired into `Shell.jsx` (a
  runtime-owned file). The intended dev-only branch is `if (import.meta.env.DEV &&
  route === 'harness') return <HarnessDashboard/>` — pointer only; `Shell.jsx` is
  shell-nav-owned and not edited by this slice.
