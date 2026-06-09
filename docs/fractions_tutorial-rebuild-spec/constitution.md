# Constitution

The foundational, non-negotiable facts every slice worker must respect. Tech
stack with versions, build/run/test commands, the top-level architecture, and the
hard constraints. Dense and declarative — document what IS.

---

## 1. What this is

`fractions_tutorial` is a single-page web application: an adaptive, manipulative-
first math tutor for elementary fractions (and the multiplication foundations
under them), themed as "Babushka's Fractions" — a Russian-grandmother kitchen.
A child moves through ten lesson **rooms** on a two-level map, practices in
**Babushka's Kitchen** (a word-problem transfer hub), and a **mastery /
measurement engine** continuously estimates per-skill knowledge and decides what
to present next. A separate **synthetic-learner harness** red-teams the engine
offline.

There is no backend server. The app is a static Vite/React SPA; all state
(the append-only engine log, progress, settings) persists in browser
localStorage. The only network calls are dev-only (ElevenLabs TTS via Vite
middleware) and a local in-browser ONNX model for handwriting recognition.

---

## 2. Tech stack (WITH VERSIONS)

Read from `web/package.json`, `web/tsconfig.json`, `pyproject.toml`.

### Runtime dependencies
- **React** `^18.3.1` + **react-dom** `^18.3.1` — UI. Mounted via
  `createRoot` in `web/src/main.jsx`. No router library — routing is hand-rolled
  hash routing in `Shell.jsx`.
- **onnxruntime-web** `^1.26.0` — in-browser ONNX inference for the MNIST digit
  recognizer (`web/src/ink/recognizer.js`, model `web/public/mnist-12.onnx`).

### Build / dev / test toolchain (devDependencies)
- **Vite** `^5.4.11` (+ `@vitejs/plugin-react` `^4.3.4`) — bundler + dev server.
- **vite-node** `^3.2.4` — runs the harness CLI with Vite's TS pipeline
  (`npm run harness`).
- **TypeScript** `^5.7.3` — the engine (`web/src/engine/**`) is authored in TS;
  the rest of the app is `.js`/`.jsx`.
- **Vitest** `^3.2.3` + **jsdom** `^26.1.0` + **@testing-library/react**
  `^16.3.0`, **@testing-library/jest-dom** `^6.6.3`,
  **@testing-library/user-event** `^14.5.2` — test stack.
- **Playwright** `^1.60.0` — screenshot/QA scripts (`scripts/shoot*.mjs`, the
  `.ui-sweep/` tooling).
- **ffmpeg-static** `^5.3.0` — used by music-fetch scripts to transcode audio.

### Python (ad hoc, not part of the app runtime)
- `pyproject.toml`: project `fractions-tutorial`, `requires-python >=3.13`, no
  declared dependencies. Used only by `web/tools/train_mnist.py` to (re)train and
  export the MNIST ONNX model.

### Language posture
- **TypeScript strict mode is ON** (`tsconfig.json`: `"strict": true`,
  `target ES2022`, `module ESNext`, `moduleResolution Bundler`, `allowJs: true`,
  `isolatedModules: true`, `noEmit: true`, `jsx: preserve`, `lib ES2022 + DOM`).
  `include: ["src", "tests"]`.
- The TS engine is imported from `.js`/`.jsx` callers using **explicit `.js`
  specifiers** (TS-idiomatic ESM). Vite/Rollup do not map a `.js` specifier onto
  a `.ts` file on disk, so a custom Vite plugin `resolveTsFromJs` (in
  `vite.config.js`) resolves relative `./x.js` → `./x.ts` for dev, build, AND
  vitest in one place. **Do not "fix" the `.js` import extensions** — they are
  the contract; the plugin is what makes them resolve.

---

## 3. Build / run / test commands

All commands run from `web/` (`web/package.json` scripts):

| Command | What it does |
|---|---|
| `npm run dev` | `vite --host` — dev server on `0.0.0.0:5173` (strictPort). The `--host` binds to LAN so a tablet on the same Wi-Fi can open the printed Network URL. Enables the dev-only `/__ink` + `/api/tts` middleware. |
| `npm run build` | `vite build` — production static bundle (dev endpoints do NOT exist in the build). |
| `npm run preview` | `vite preview --host` — preview the build on `0.0.0.0:4173` (strictPort). |
| `npm test` | `vitest run` — full test suite (jsdom env, `tests/**/*.test.{js,jsx,ts,tsx}`, setup `vitest.setup.js`). |
| `npm run test:watch` | `vitest` — watch mode. |
| `npm run harness -- <sub>` | `vite-node src/harness/cli.js --` — synthetic-learner harness. Subcommands: `baseline`, `search`, `loop`, `report` (flags `--seed N`, `--flags-on`, `--skill ID`, `--dry`). Writes artifacts under `docs/harness/`. |
| `npm run voice` | Bake voice clips via ElevenLabs (needs `web/.env`). |
| `npm run audition` / `music-audition` / `music-fetch` | Voice/music asset tooling. |

No CI config or deploy config is checked in at the repo root beyond these.

---

## 4. Top-level architecture (1–2 paragraphs)

The app is layered around a **pure mastery engine** and a **React runtime** that
drives it. `main.jsx` mounts `Shell.jsx`, which owns hash routing
(`#/<route>`), 1280×800 stage scaling, and the global always-mounted surfaces.
Routes resolve to a **lesson room** (`AppR1`, `AppM1`, `LessonUnlikeDen`, …), the
**world map** (`WorldMap`, built from `rooms.js` ROOMS/STRANDS), **Babushka's
Kitchen** (`MomsRoom`, the word-problem transfer layer), **Mixed Review**, or the
**Settings**/**Concept Map** overlays. Each room adopts the runtime hook
`useLessonEngine`, which emits a rich event burst per attempt, persists an
**append-only Event log** to localStorage (`moms-engine-log-v1`), and — ONLY at
the submit/entry boundary — folds the log through `measurementReduce` into a
per-node `MasteryEstimate` map and asks `policy.nextDecision` what to do next.
`practiceFlow` turns that `Decision` (PresentProblem / Fade / Raise / Transfer /
Return / Route / Escalate) into the next validated problem from the deterministic
**generator library** (`generators/index.js`, one generator per skill node).

The **engine** (`web/src/engine/**`, TypeScript) is a pure, deterministic,
wall-clock-free core: a 10-node skill DAG (`graph.ts`), BKT belief update
(`bkt.ts`), DAG credit assignment (`credit.ts`), spaced-retention decay
(`decay.ts`), the four-dimension mastery assembly (`mastery.ts`), the gate
(`gate.ts`), and the deterministic policy (`policy.ts`). All of its exported types
are wire DTOs (`types.ts`/`index.ts`) — the engine could relocate behind a Python
FastAPI backend by swapping `fetch` at the runtime call sites with zero contract
churn. Alongside, an **advisory affect layer** (`runtime/affect/**`) reads
behavioral signals and recommends Tier-2/3 nudges, surfaced through the **engine
UI surfaces** (`ui/**`: rationale banner, mastery inspector, nudge toast, affect
probe) via an observable store (`runtime/engineStore.js`). The **synthetic-learner
harness** (`harness/**`) replays seeded persona×skill sweeps against the same
engine to red-team it for false-mastery / missed-escalation, emitting reproducible
tape-projected reports under `docs/harness/`.

---

## 5. Non-negotiable constraints

These are enforced in the source and asserted by comments/tests. Violating them
breaks the design.

### 5.1 Engine purity (declared in every `engine/**` file header)
- **NO React imports and NO wall-clock calls anywhere in `web/src/engine/**`.**
  Time enters the engine ONLY as injected event timestamps (`event.t`) or a
  caller-supplied `now`. The fold (`foldLog`/`measurementReduce`) is replayable
  and side-effect-free. The localStorage persistence adapter (`log.ts`
  loadLog/saveLog) is the one I/O point and is intentionally a separate function
  family kept OUT of the fold. The React layer (`runtime/**`) is where
  `Date.now()` is allowed.

### 5.2 Advisory-only affect firewall
- The affect layer (`runtime/affect/**`) reads behavioral `Signal`s and emits an
  **advisory** tier + an `AffectState`. It **NEVER** produces or mutates a
  `MasteryEstimate`, and valence stays neutral (no emotion inference). It has
  **no path into `gate.ts`**. The firewall is STRUCTURAL: the only affect data in
  the log is the `affect_window` stub on `Observation` (always an empty array
  today), and neither `mastery.ts` nor `gate.ts` reads it. Mastery cannot be
  raised or lowered by affect.

### 5.3 Boundary-only decisions (R16)
- `policy.nextDecision` (and the engine consult) runs **ONLY** inside
  `useLessonEngine.judgeAndAdvance` — the submit/entry boundary. It MUST NOT be
  called on re-render, state change, or timer. Tier-2 nudges are deterministic,
  nudge-only, idempotent per activation window, and never restructure the
  workspace mid-attempt (a queued TransferProbe waits for the next boundary).

### 5.4 No `DeclareMastered` (R9)
- Mastery is never an emitted decision or a written flag. It is only ever READ via
  `gate.isMastered(estimate)`, derived from the folded log. There is no
  `DeclareMastered` in the `Decision` union.

### 5.5 Determinism
- Generators, the unlike-den math engine, and the entire harness are pure and
  deterministic — **NO `Math.random`, NO `Date`** in those paths. The harness
  uses a seeded `personaRng`; a re-run of `baseline --seed N` must be
  byte-identical (the CLI asserts this), and committed tapes re-project the docs
  byte-for-byte (`report` subcommand).

### 5.6 CCSS denominator contract (`.ccss-contract.md`)
- Lessons must stay inside the grade-3–5 denominator set
  `{2, 3, 4, 5, 6, 8, 10, 12, 100}` — **never 7 or 9**. Enforced via
  `ccss.js::isInGrade` / `filterBankInGrade`.

### 5.7 Skill-graph prereq ordering (load-bearing — `credit.ts:97`)
- `credit.ts` `resolveImplicatedPrereq` docks `bindingNode.prereqs[length - 1]`
  (the LAST prereq) on a straight-across fraction error. Therefore `MULT_FACTS`
  is **PREPENDED** (never appended) to `ADD_UNLIKE_COPRIME.prereqs` and
  `SIMPLIFY.prereqs`, so the original FRACTION prereq stays LAST. Node ids are
  canonical and `getNode` throws on an unknown id — any mismatch crashes the DAG
  at init.

### 5.8 Engine wire-contract stability
- Everything exported from `engine/index.ts` is a DTO that could travel over the
  wire. Treat `types.ts` (Event/Observation/MasteryEstimate/Decision/SkillNode)
  and `PARAMS` as a stable interface; the BKT MasteryEstimate shape is the public
  R8 interface.

### 5.9 Voice / TTS posture
- Every on-screen string is readable aloud in-character (`voice.js` + `TapToRead`)
  with a pre-baked clip (`public/voice/<key>.mp3`) or a dev TTS synthesis
  (`/api/tts`), falling back to browser Web Speech — but **never** a robotic voice
  on failure (silent instead). `voiceLines.js` is the single source of truth for
  spoken text; fractions are spelled out for the neural voice.

### 5.10 Persistence keys (stable)
- `moms-engine-log-v1` (engine log, authoritative), `moms-kitchen-progress-v1`
  (legacy binary progress; migration source + still written for back-compat),
  `bf_settings_v1` (settings), legacy `musicVolume`/`musicMuted` (one-time
  migrated). Do not rename without a migration.

---

## 6. Conventions

- Stage coordinate space is **1280×800**; `Shell.useStageFit` scales it to the
  visual viewport (uses `visualViewport`, not `innerHeight`, for iOS/iPadOS
  toolbar correctness).
- Scaffold levels are **L0 (max support) → L4 (independent)**; lessons map their
  native beats/stages to L0–L4 via `runtime/scaffoldMap.js`.
- Room ids (`m1 m3 nl r1 s1 cmp r3 r2 r4 r5`) are STABLE and historical; the
  displayed lesson number (`no`) and teaching order live in `rooms.js` and may
  differ from id order.
- Engine node ids are SCREAMING_SNAKE_CASE and map 1:1 to a room via
  `SkillNode.roomId`.
- Source comments reference design docs as `state-model §X`
  (`docs/design/fraction-app-state-model.md`) and `measurement §4.x`
  (`docs/design/student-state-measurement.md`), and units/requirements as
  `KTD#` / `R#` / `U#`.
