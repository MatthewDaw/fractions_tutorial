<!-- slice: engine-core — fragment for env-and-config.md -->

# Engine tunables and persistence (engine-core)

The engine has NO env vars and NO build config of its own. Its "configuration"
is the centralized `PARAMS` object (`params.ts`) plus a few module-local tunable
records. These are runtime tunables (the harness sweeps them), not environment
values. The one persistence key the engine owns is documented below.

---

## `PARAMS` — `web/src/engine/params.ts` (KTD10)

All measurement tunables in one place so the synthetic harness can tune them
without code changes. Defaults (the committed `PARAMS`):

| Param | Default | Purpose |
|---|---|---|
| `bkt.P_T` | `0.20` | BKT probability of learning (unknown→known per attempt) |
| `bkt.P_S` | `0.10` | BKT probability of slip (known→wrong) |
| `bkt.P_G` | `0.20` | BKT probability of guess (unknown→correct) |
| `P_L0` | `0.10` | cold-start prior before prereq propagation |
| `prereqWeight` | `0.3` | prereq propagation weight (`w` in coldStart) |
| `priorClamp` | `[0.05, 0.85]` | clamp on the cold-start prior (no vacuous certainty) |
| `pKnownClamp` | `[0.01, 0.99]` | clamp on P_known after each BKT update |
| `gateThreshold` | `0.95` | P_known threshold the mastery gate opens at (Chain A) |
| `wallTheta` | `0.6` | predicted-success θ below which WALL_HIT fires |
| `fadeStreakK` | `3` | consecutive clean corrects to FadeScaffold |
| `raiseErrorsM` | `2` | errors in a segment to RaiseScaffold |
| `fluencyMinN` | `5` | min corrects before fluency is evaluated |
| `creditDiscount` | `0.3` | discount on a prereq BKT update (DAG credit) |
| `latencyFloorMs` | `1200` | plausible-compute floor; correct below it → too_fast_correct |
| `fluencyHardMode` | `false` | **flag** — make fluency a HARD gate conjunct (default soft/advisory, KTD2, reversible) |
| `fluencyLatencyTargetMs` | `15000` | latency ceiling used by fluencyOk when hardMode on |
| `frustrationScaffold` | `false` | **flag** — warm reachable-foothold rationale on a frustration RaiseScaffold (U9, default off, reversible) |
| `escalation.nStuck` | `6` | stuck-attempts at floor before EscalateToHuman |
| `escalation.nDiseng` | `5` | sustained disengaged observations before escalate |

### Feature-flag-like booleans
- `fluencyHardMode` and `frustrationScaffold` are inert-by-default reversible
  flags (both `false`). They are flipped in tests by mutating `PARAMS` directly
  (`(PARAMS as any).fluencyHardMode = true`), then reset in `afterEach`. The
  harness owns the plan-002 flags `delayedProbe`/`unifiedTaxonomy` (NOT in
  `params.ts`) — see harness slice.

### Module-local constants (NOT in PARAMS, but configuration-relevant)
- `dimensions.ts`: `SLOPE_EPS = 500` (fluency slope ε, "future tunable; not yet a
  PARAMS field"), `INDEPENDENCE_MIN_SCAFFOLD = 3`, `INDEPENDENCE_MIN_COUNT = 2`,
  `INDEPENDENCE_MIN_DISTINCT_PROBLEMS = 2`, `TRANSFER_MAX_SCAFFOLD = 3`,
  `TRANSFER_MIN_COUNT = 2`, `TRANSFER_MIN_DISTINCT_FORMS = 2`,
  `HINT_DEPENDENCE_THRESHOLD = 2`, `HINT_DEPENDENCE_WINDOW = 5`.
- `decay.ts`: `PROBE_DELAYS_MS = [1d, 3d, 1w, 3w, 2mo]` (in ms).

---

## `observe/**` tunables (plan 005)

Separate hand-seeded records (the persona warm-start re-seeds these in Phase 5):

- **`OBSERVE_PARAMS`** (`observe/index.ts`): `driftControlN: 3` — first 3 attempts
  are observe-only control.
- **`BASELINE_PARAMS`** (`observe/baseline.ts`): `alpha 0.3` (EWMA weight),
  `minSamples 5` (until `established`), `floorK 1.5` (sd below expected for the
  personal floor), `floorMarginFrac 0.4`, `minFloorMs 300`,
  `scaffoldDifficultySlope 0.15`.
- **`DETECTOR_PARAMS`** (`observe/detectors.ts`): `idleThresholdMs 5000`,
  `transientIdleMs 8000`, `stallZ 2.0`, `stallFrac 1.0`, `scribbleCount 5`,
  `scribbleWindowMs 2000`.

---

## Persistence keys (engine-owned)

- **`moms-engine-log-v1`** (`log.ts` `LOG_STORAGE_KEY`) — the authoritative
  append-only Event log (JSON array). Read/written ONLY by the `loadLog`/`saveLog`
  adapter (the React runtime calls them; never inside a fold). Errors are
  swallowed → `[]` / no-op. Stable; do not rename without a migration
  (constitution §5.10).
- **`moms-kitchen-progress-v1`** (`log.ts` `KITCHEN_PROGRESS_KEY`) — legacy binary
  `{ mastered: string[] }`. The engine only READS it (in
  `migrateFromKitchenProgress`) to seed cold-start priors; it is owned/written by
  the shell-nav slice (`kitchenProgress.js`). Migration seeds: mastered room →
  `MASTERED_SEED_PRIOR 0.80`, absent → `DEFAULT_SEED_PRIOR 0.10`.

> The engine has NO env vars (`ELEVENLABS_*` etc. and the Vite build env belong
> to shell-nav/leftovers). Engine purity forbids reading any ambient config.
