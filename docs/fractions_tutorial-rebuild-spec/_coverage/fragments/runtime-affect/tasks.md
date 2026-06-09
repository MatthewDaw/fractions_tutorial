# Tasks — `runtime-affect` slice

Sequenced rebuild plan for the React runtime + advisory affect layer. Each task
traces to a requirement (R-RT-* / R-AF-*). Depends on **engine-core** (the log,
`measurementReduce`, `policy.nextDecision`, `gate.isMastered`, `PARAMS`, the
`Decision`/`MasteryEstimate`/`Observation` DTOs) and **generators**
(`generateFor`, `surfaceFormsFor`) existing first — both by pointer.

## T1 — `scaffoldMap.js` (no deps) → R-RT-10
Implement `toScaffoldLevel(lessonId, beat)` and the inverse
`toBeatForLevel(lessonId, designLevel)` with the per-lesson tables and
`parseStageN`. Conservative mapping; default 0 / `'1'`. Pure JS, no imports.

## T2 — `tier2.js` (no deps) → R-RT-11
Implement `makeTier2Window`, `checkTier2` (priority HINT_OFFER > TAKE_YOUR_TIME >
TRANSFER_PROBE_QUEUED, idempotent per window), and the isolated
`checkOscillation`/`checkLongPause`/`checkTooFastCorrect`. Constants
`PAUSE_THRESHOLD_MS=8000`, `OSCILLATION_THRESHOLD=3`. No engine/React imports;
caller injects timestamps.

## T3 — `engineStore.js` + `useEngineStore.js` → R-RT-12
React-free observable singleton (`subscribe`/`getSnapshot`/`publishDecision`/
`publishNudge`/`clearNudge`/`resetEngineStore`); capped decisionLog (≤50);
`uiChurn` increment on Fade/Raise. Then the `useSyncExternalStore` binding in a
SEPARATE file so the store stays renderer-free. (ADR-RT-003.)

## T4 — `practiceFlow.js` (deps: generators) → R-RT-7
`nextPractice(decision, state, opts)` + `otherSurfaceForm(skill, current)`. Pure;
keep level on `PresentProblem` (gotcha G5); clamp/floor on Fade/Raise.

## T5 — `useLessonEngine.js` (deps: engine-core, scaffoldMap, tier2, engineStore)
→ R-RT-1..6, R16, U2
`emit` (stamp/append/persist; on `problem_present` reset Tier-2 window + sync
policy scaffold WITHOUT resetting consecutiveErrors). `judgeAndAdvance` per the
12-step boundary sequence: emit submit+judged burst, one `measurementReduce`, one
`nextDecision`, U2 `isCertified` from the same fold, `publishDecision`, apply
Fade/Raise. The boundary-once rule (R16) is load-bearing — keep `nextDecision`
out of every effect/render.

## T6 — `useGeneratedPractice.js` (deps: T5, generators, practiceFlow) → R-RT-8
Cursor `{level,index,surfaceForm}`; `useMemo` problem from `generateFor`; emit
`problem_present` once per distinct cursor (guard ref); `submit` grades, calls
`judgeAndAdvance`, maps via `nextPractice`, advances cursor or sets `exit`.

## T7 — `useLessonScaffold.js` (deps: T5, scaffoldMap, tier2, engineStore,
generators, practiceFlow, shell-nav `voice.js` pointer) → R-RT-9
The shared lesson controller: opaque stage keys, outcome state, refs+effects,
guarded mount `problem_present` (skip when `emitMountPresent:false`), unmount
`stopVoice`, Tier-2 idle/oscillation `setInterval` watcher → `publishNudge`,
generated-practice mode (genLevel spanning 0..4), `applyEngineDecision` with the
U2 certified terminator checked FIRST, deferred-advance mode.

## T8 — `affect/composite.js` (no deps) → R-AF-2
`computeComposite` with the corroboration cap (`maxChannelPoints` < `t2`),
`SIGNAL_CHANNEL` map, `hint_spend` channel, observe-only exclusion. (ADR-RT-004.)

## T9 — `affect/affectState.js` (no deps) → R-AF-3
`neutralAffect`/`deriveAffect`/`smoothAffect`; valence pinned `'neutral'`; clamp
[0,1]; EWMA `alpha=0.4`.

## T10 — `affect/governor.js` (no deps) → R-AF-4
Budget + dismissal backoff in ATTEMPTS; immutable `register*`.

## T11 — `affect/ledger.js` (no deps) → R-AF-5
Immutable `record`/`resolve`; `report` with cost-weighted precision
(`SEVERITY_COST {low:1,med:3,high:9}`); pending + observe-only exclusions.

## T12 — `affect/selfReport.js` (deps: ledger shape) → R-AF-6
`evaluateSelfReport` (discard signal on contradiction, always keep goldLabel);
`applySelfReportToLedger` (tricky confirms / easy contradicts pending).

## T13 — `affect/index.js` (deps: T8–T12) → R-AF-1
`composeAffect`: composite → affectState → dominant channel → governor gate →
ledger record. FIREWALL: returns `isDisengaged`/`recommendedTier`/`affectState`
only; never a MasteryEstimate; no `gate.ts` path. (ADR-RT-002.)

## T14 — verify the owned tests pass
Run the slice's owned test files (see checklist). The affect tests are pure and
run as-is; the `.jsx` hook tests rely on the vite `.js→.ts` resolution
(constitution §2; gotcha G9).
