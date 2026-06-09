# Design — `runtime-affect` slice

> Scope: the React runtime that bridges lessons to the pure mastery engine, plus
> the ADVISORY affect layer. Owned globs: `web/src/runtime/**`.
> This fragment documents WHAT IS + WHY. Engine internals (`policy.nextDecision`,
> `gate.isMastered`, `measurementReduce`, `log.appendEvent`, the `Decision` union,
> `MasteryEstimate` shape, `PARAMS`) are **engine-core**-owned and referenced by
> pointer. Generators (`generateFor`, `surfaceFormsFor`) are **generators**-owned.
> The UI surfaces that subscribe to `engineStore` (RationaleBanner, MasteryInspector,
> AffectProbe) are **ui-surfaces**-owned. `kitchenProgress.js`, `rooms.js`, `voice.js`
> are **shell-nav**-owned. Lesson screens (`AppR1`, `LessonUnlikeDen`, …) are
> **lessons-rooms**-owned. See constitution §4–5 for the cross-cutting layering.

---

## 1. Layer purpose & the engine boundary

The runtime layer is the **only** place where:
- the browser wall-clock (`Date.now()`) is read (the engine is wall-clock-free —
  constitution §5.1), and
- the engine consult (`measurementReduce` → `nextDecision`) is invoked.

It exposes three composable hooks that lessons adopt — `useLessonEngine` (the
backbone), `useLessonScaffold` (the shared lesson controller), and
`useGeneratedPractice` (the estimator-driven practice loop) — plus three pure
helper modules — `practiceFlow` (Decision→next-problem), `scaffoldMap`
(beat↔ScaffoldLevel), and `tier2` (within-attempt nudges) — and a React-free
observable singleton `engineStore` (+ its `useEngineStore` binding) that
publishes the live Decision/MasteryEstimate to the always-mounted surfaces.

Layering (data direction):

```
lesson screen (lessons-rooms)
   │ adopts
   ▼
useLessonScaffold / useGeneratedPractice
   │ wraps
   ▼
useLessonEngine ──emit()──▶ engine/log.appendEvent + saveLog (localStorage)
   │ judgeAndAdvance() at the SUBMIT/ENTRY BOUNDARY only (R16)
   ├──▶ engine/measurementReduce(log, now, seedPriors) → mastery map
   ├──▶ engine/policy.nextDecision(policyState, mastery, recentBehavior, now) → Decision
   ├──▶ engine/gate.isMastered(estimate) → certified flag (U2)
   ├──▶ practiceFlow.nextPractice(decision, state) → next problem spec
   └──▶ engineStore.publishDecision(decision, mastery, t) ──▶ ui-surfaces
```

The advisory **affect** layer (`runtime/affect/**`) is a SEPARATE, parallel
pipeline. It reads behavioral Signals and emits an advisory tier + AffectState
that fills the `recentBehavior.isDisengaged` slot ONLY. It has **no path into
`gate.ts`** (constitution §5.2; ADR-RT-002).

---

## 2. `useLessonEngine.js` — the lesson↔engine backbone (KTD5, U9)

**Purpose.** One hook every lesson adopts to (a) emit the full per-attempt event
burst, (b) persist the append-only log, (c) consult the engine ONLY at the
submit/entry boundary, and (d) apply the returned Decision.

**Public surface** (`useLessonEngine({ nodeId, lessonConfig })`):

| Returned | Type | Meaning |
|---|---|---|
| `emit(eventFields)` | `(obj) => obj` | Stamp `t`+`actor:'human'`, append, persist, return the stamped event. |
| `judgeAndAdvance(answer, meta)` | `(obj,obj) => Decision` | The boundary call (see below). |
| `scaffoldLevel` | `0..4` | Current design scaffold level (React state). |
| `decision` | `Decision \| null` | Last Decision (null pre-first-submit). |
| `rationale` | `string` | `decision?.rationale ?? ''`. |
| `masteryFor(nodeId)` | `(id) => MasteryEstimate \| null` | Reads the last reduce result. |
| `isCertified()` | `() => boolean` | Ref-backed synchronous gate result (U2). |

**`lessonConfig`** fields: `lessonId` (room id for scaffoldMap), `initialBeat`
(starting beat/stage key), `stumpingRecipe` (recipe that routed here; makes
`ReturnToKitchen` legal — U3), `inKitchen` (boolean).

### 2.1 Internal state — refs vs React state (WHY)

| Holder | Kind | Why |
|---|---|---|
| `logRef` | ref | The append-only log. Initialized once from `loadLog()` on first mount; thereafter the in-memory ref is authoritative and synced to storage on every write (perf — avoid re-reading localStorage). |
| `policyStateRef` | ref | The mutable policy state fed to `nextDecision`. A ref so `judgeAndAdvance` can update it synchronously without an extra render. |
| `presentTimestampRef` | ref | `t` of the last `problem_present`, for latency. |
| `tier2WindowRef` | ref | One Tier-2 window per attempt; reset on each `problem_present`. |
| `certifiedRef` | ref (U2) | Synchronous certification result so a same-tick `applyEngineDecision` reads the FRESH value, not stale `masteryCache`. |
| `scaffoldLevel`, `decision`, `masteryCache` | React state | Drive renders / `masteryFor`. |

**Initial policy state** (`buildInitialPolicyState`): `{ currentNodeId,
currentScaffold, stumpingRecipe, inKitchen, sessionMaxScaffoldPassed:null,
consecutiveErrors:0, consecutiveCleanCorrects:0, pendingTransferProbe:false,
pKnownHistory:[], heavyHintAtFloorCount:0, disengagedCount:0 }`.

### 2.2 `emit` — branches & mutations (structured CoT)

Branches:
1. Always: spread defaults `{modality:'tap', actor:'human'}`, then override
   `t = Date.now()` (the React-layer clock read).
2. If `type === 'problem_present'`:
   - set `presentTimestampRef = t`;
   - reset `tier2WindowRef = makeTier2Window()` (re-arm pause/oscillation/too-fast);
   - if `payload.scaffold_level` is a number, set
     `policyStateRef.currentScaffold = lvl` (keep policy in sync with the
     lesson's ACTUAL stage — the lesson can change scaffold by a stage-tab click
     or its own advance-on-correct, which the engine didn't decide; without this
     the policy stays stuck at entry L0 and RaiseScaffold never becomes legal).
     **`consecutiveErrors` is intentionally NOT reset on a scaffold change** —
     in these lessons the stages ARE the scaffold ladder; cross-stage signals
     (a fading clean streak, a raising error run) are meant to span stages.
State mutation: `logRef = appendEvent(log, stamped); saveLog(log)`.

### 2.3 `judgeAndAdvance` — the BOUNDARY (R16) (structured CoT)

This is the ONE place `nextDecision` runs (constitution §5.3; ADR-RT-001).

Sequence (exactly once per call):
1. `now = Date.now()`. Destructure `answer` (value/modality/recognizerConfidence)
   and `meta` (correct/errorSignature/stars/hintMaxRung/selfCorrections/
   surfaceForm/problemId/nodeIdOverride). `effectiveNodeId = nodeIdOverride || nodeId`.
2. `latency = present!=null ? max(0, now-present) : 5000` (5000 default if no
   present was emitted).
3. Emit `answer_submit` then `judged` events (both appended + `saveLog` once).
   The `judged` payload carries the rich KTD3 Observation fields incl.
   `too_fast_correct: _isTooFastCorrect(correct, latency)` and
   `affect_window: []` (the firewall stub — see ADR-RT-002).
4. Reset `presentTimestampRef = null` (attempt closed).
5. `seedPriors = migrateFromKitchenProgress()`; `reduceResult =
   measurementReduce(log, now, seedPriors)`; `setMasteryCache(reduceResult.mastery)`.
6. `_updatePolicyState(policyStateRef, {correct, hintMaxRung, latency, currentScaffold})`.
7. Too-fast guard: `checkTooFastCorrect` (tier2) — if it fires, set
   `pendingTransferProbe = true`. Runs AFTER `_updatePolicyState` (which clears
   the flag on any correct) so the probe wins over a fade on a possible fluke.
8. Push the node's reduced `P_known` onto `pKnownHistory` (capped at 12).
9. **U2 certification**: `certifiedRef = !!(nodeEst && isMastered(nodeEst))` —
   reuses the SAME fold; no extra reduce, no extra `nextDecision` call.
10. Build `recentBehavior = {observations: recentObsRef.slice(-10),
    isDisengaged: disengagedCount>=3}`.
11. **BOUNDARY**: `dec = nextDecision(policyStateRef, reduceResult.mastery,
    recentBehavior, now)` — exactly once.
12. `setDecision(dec)`; `publishDecision(dec, reduceResult.mastery, now)`.
13. Apply scaffold change: `FadeScaffold` → `currentScaffold = min(4, +1)`;
    `RaiseScaffold` → `max(0, -1)`; both update the ref AND `setScaffoldLevel`.
14. `return dec`.

### 2.4 `_updatePolicyState` (in-place mutation, intentional)

- `correct` & `hintFree && inBandLatency` (`latency ∈ [PARAMS.latencyFloorMs,
  30000]`): `consecutiveErrors=0`; `consecutiveCleanCorrects+=1`; bump
  `sessionMaxScaffoldPassed` if `currentScaffold` exceeds it; clear
  `pendingTransferProbe`.
- `correct` but hinted/out-of-band: reset clean streak (no penalty);
  clear `pendingTransferProbe`.
- `!correct`: `consecutiveErrors+=1`; `consecutiveCleanCorrects=0`.
- `currentScaffold===0 && hintMaxRung>=3`: `heavyHintAtFloorCount+=1`
  (feeds stuck-escalation).

`_isTooFastCorrect(correct, latency) = correct && latency < PARAMS.latencyFloorMs`
— unified onto the single `latencyFloorMs` constant (U1) so too-fast, transfer
in-band, and clean-correct in-band share one threshold (no dead zone).

---

## 3. `practiceFlow.js` — Decision → next problem (pure)

**Purpose.** Map an engine `Decision` + the current `PracticeState`
(`{skill, level, index, surfaceForm}`) onto the next move. Pure & deterministic
(no `Date.now`/`Math.random`/React) so a replayed session reproduces the exact
problem stream.

`nextPractice(decision, state, opts={maxLevel=4})` returns
`{ action: 'present'|'return'|'route', spec?, decision }`:

| `decision.kind` | action | spec |
|---|---|---|
| `FadeScaffold` | present | `level=min(maxLevel,level+1)`, `index+1` (harder) |
| `RaiseScaffold` | present | `level=max(0,level-1)`, `index+1` (easier, keep work) |
| `TransferProbe` | present | same `level`, `index+1`, `surfaceForm=otherSurfaceForm(skill,current)` |
| `ReturnToKitchen` | return | — (exit: mastered → back to stumping recipe) |
| `RouteToRoom` | route | — (exit: routed upstream to a prerequisite) |
| `PresentProblem` / default | present | same `level`, `index+1`, `surfaceForm=decision.surface_form` |

**`otherSurfaceForm(skill, current)`**: reads `surfaceFormsFor(skill)`
(generators-owned); returns a form `!== current`, or `current`/`forms[0]` if
there is only one. Gotcha G5: `PresentProblem` keeps the SAME level (never pulls
back to entry L0 between reps).

---

## 4. `useGeneratedPractice.js` — estimator-driven loop (hook)

**Purpose.** A lesson that adopts it serves UNLIMITED generated variations and
lets the estimator pace them. Internally wraps `useLessonEngine`. Contract:
`useGeneratedPractice({ skill, lessonId, initialLevel=0, gradeAnswer, maxLevel=4 })`
→ `{ problem, level, surfaceForm, decision, rationale, exit, submit, masteryFor }`.

Loop (structured CoT):
1. `practice` cursor state `{level, index, surfaceForm}`.
2. `problem = useMemo(generateFor(skill, {level, index, surfaceForm}), [cursor])`
   — pure & deterministic for the cursor (generators-owned).
3. An effect emits `problem_present` exactly once per distinct
   `${level}:${index}:${surfaceForm}` (drives latency, Tier-2 window reset,
   engine scaffold sync) via a `presentedKeyRef` guard.
4. `submit(answer, meta)`: `grade = gradeAnswer(problem, answer)`; call
   `judgeAndAdvance({value,modality,recognizerConfidence}, {correct,
   errorSignature, stars, hintMaxRung, selfCorrections, surfaceForm:
   problem.surfaceForm, problemId: problem.problem_id})`; map via
   `nextPractice`; `present` → advance cursor, else `setExit({kind, decision})`.

---

## 5. `useLessonScaffold.js` — the shared lesson controller

**Purpose.** The ONE controller backbone every fixed-stage lesson shares,
collapsing ~95 lines of byte-identical glue that each `AppM*`/`AppR*` used to
hand-roll: the `useLessonEngine` setup, outcome state
(`solved/stars/badInput/cook/status`), the refs and their sync effects, the
guarded mount `problem_present`, unmount `stopVoice`, and the helpers
`goStage`/`nextStage`/`reportAttempt`/`applyEngineDecision`/`award`/`flashBad`.
Only the STAGE MODEL and per-stage RESET differ — passed as small callbacks.

**Stage keys are OPAQUE** — M1/M3 mix numeric stages with the string
`"showwork"`; the hook never coerces a key, so a lesson's `stage === 1` branches
keep matching. `LessonUnlikeDen` is a PARTIAL adopter: it uses the safe
primitives (state/refs/flashBad/reportAttempt/stopVoice) but keeps its own beat
navigation and does NOT call `goStage`/`nextStage` (set `emitMountPresent:false`
so the hook doesn't double-fire `problem_present`).

### 5.1 Tier-2 idle/oscillation watcher (within-attempt)

The hook wraps `emit` so any logged interaction bumps `lastInteractionTRef =
Date.now()` (a learner dragging pieces is not "stuck"). While a stage is
unsolved, a `setInterval(TIER2_TICK_MS=1500)` checks `checkOscillation` then
`checkLongPause` (tier2.js) and, on a fire, calls `publishNudge({type, text:
NUDGE_TEXT[type]})`. `NUDGE_TEXT` maps `HINT_OFFER`/`TAKE_YOUR_TIME` to gentle
copy. Nudges are nudge-only — they never restructure the workspace.

### 5.2 Generated-practice mode (opt-in, backward compatible)

`generatedStages` (`true` | key[] | predicate) marks stages that serve
auto-generated variations. On such a stage the hook owns `prob` (current
`GeneratedProblem`), `genLevelRef`/`genLevel` (the LIVE 0..4 level that spans the
single stage), `genIndexRef` (monotonic), and `genFormOverrideRef` (pins the
next surface form for a TransferProbe). `makeProbFor(key)` mints a fresh problem
at `genLevelRef.current`. `generatedStartLevel` default 2 (post-teaching).

`applyEngineDecision(dec, isCorrect)` on a generated stage:
- **U2 certified terminator FIRST**: if `isCertified()` → `onEnd({kind:
  'LessonComplete', certified:true})`. Checked first because at full mastery the
  engine may still return `FadeScaffold` on a clean streak; certification must
  win over the endless re-roll (a direct-entry generated stage has no legal
  Return/Route).
- `FadeScaffold` → `genLevel=min(4,+1)`, re-roll (`goStage(cur)`).
- `RaiseScaffold` → `genLevel=max(0,-1)`, re-roll.
- `TransferProbe` → set form override to `otherSurfaceForm`, re-roll.
- `ReturnToKitchen`/`RouteToRoom` → `onEnd(dec)` (U3 wall→room→return loop).
- else if `isCorrect` → re-roll (more practice at this level).

On a FIXED stage: `ReturnToKitchen`/`RouteToRoom` → `onEnd` (U3, from any
terminal stage); `FadeScaffold` → `nextStage()`; `RaiseScaffold` → `goStage(back)`;
else if `isCorrect` → `nextStage()`.

`award(line, voice, answerValue, opts)` is positional (callsite-stable). With
`advanceMode==='deferred'` it delays `applyEngineDecision` by `deferredDelayMs`
(R5 lingers on the celebration first).

---

## 6. `scaffoldMap.js` — beat ↔ ScaffoldLevel L0–L4

**Design scale**: L0 max support → L4 fully independent. Lessons map their native
beats/stages to L0–L4 so the engine's independence/transfer dimensions read a
uniform level (constitution §6). The mapping is **conservative**: assign the
LOWEST design level that accurately describes the child's scaffold context.

`toScaffoldLevel(lessonId, nativeBeat)` (forward map). Key tables:

- Universal: `showwork`/`show-work`/`show_work` → `3` (the additive blank "show
  your work" step; same independence as Applied — support gone but still a posed
  problem). Recognized by string key so adopting it never renumbers stages.
- `r2`/`r3` (LessonUnlikeDen beats): `L0→0, L2→1, L4→2, LW→1` (Workbench),
  `L5→3, L6→3, LA→3, L7→4`; default `0`.
- `r1` (7-stage arc, numeric or `N-name`): `1→0, 2→1, 3→2, 4→1` (Workbench),
  `5→3, 6→3, 7→4`; default `0`.
- `m1`/`m3` (same arc): identical to `r1`.
- `r4` (numeric or string `manipulate/bind/fade/numbers/applied/words`):
  `1/manipulate→0, 2/bind→1, 3/fade→2, 4/numbers→3, 5/applied→3, 6/words→4`.
- `r5`: `workbench→1`, `applied→3`, then numeric `1→0,2→1,3→2,4→3,5→4`.
- Unknown lesson → `0`.

`parseStageN(beat)`: leading-digit extractor (`"3-fade"`→3, `"manipulate"`→null).

`toBeatForLevel(lessonId, designLevel)` (INVERSE map). Returns the native beat at
(or just below) a target design level; used by `useLessonEngine`/room-entry to
resume a returning learner one notch below their `max_scaffold_passed`. Tables:
- `r2`/`r3`: `0→L0, 1→L2, 2→L4, 3→L6, 4→L7`.
- `r1`: `['1','2','3','5','7'][level]`.
- `m1`/`m3`: `['1-manipulate','2-bind','3-fade','5-numbers','7-words'][level]`.
- `r4`: `['manipulate','bind','fade','numbers','words'][level]`.
- `r5`: `['1-manipulate','2-bind','3-fade','4-numbers','5-words'][level]`.

`test_flow_integration` ties `entryScaffoldFor(node) = max(0,
max_scaffold_passed-1)` (kitchenProgress, **shell-nav**-owned — pointer) to
`toBeatForLevel`: e.g. `r2` with `max_scaffold_passed=4` → designLevel 3 → `'L6'`
(bare slate).

---

## 7. `tier2.js` — within-attempt nudges (U12, pure)

**Purpose.** Deterministic, nudge-only, boundary-safe, idempotent Tier-2 nudges.
NO engine imports, NO React, NO wall-clock (caller injects timestamps).

Config: `PAUSE_THRESHOLD_MS = 8000`, `OSCILLATION_THRESHOLD = 3`.

`makeTier2Window()` → `{pauseFired:false, oscillationFired:false,
transferQueued:false}` (one per attempt; caller resets on `problem_present`).

`checkTier2(recentBehavior, lastInteractionT, nowT, windowState)` — returns the
FIRST applicable nudge `{type, payload}` or `null`, priority
**HINT_OFFER > TAKE_YOUR_TIME > TRANSFER_PROBE_QUEUED**, each fires AT MOST ONCE
per window (mutates the window to prevent re-fire):
1. Long pause (`lastInteractionT>=0 && nowT-last >= PAUSE_THRESHOLD_MS`) →
   `HINT_OFFER{suggestedRung: lastObs.hint_max_rung+1, idleMs}`.
2. Oscillation (`lastObs.self_corrections >= OSCILLATION_THRESHOLD`) →
   `TAKE_YOUR_TIME{oscillations}`.
3. `lastObs.too_fast_correct === true` → `TRANSFER_PROBE_QUEUED{message}` — a
   FLAG only; the caller sets `pendingTransferProbe` at the NEXT boundary
   (never mid-attempt).

Isolated checks (used by `useLessonScaffold` / `useLessonEngine`):
`checkOscillation(recent, win)`, `checkLongPause(lastT, now, win, curRung=0)`,
`checkTooFastCorrect(lastObs, win)`. Nudges have a `type`, NEVER a `kind` — they
are NOT engine Decisions and never mutate game state (gotcha G2).

---

## 8. `engineStore.js` + `useEngineStore.js` — the surfaces bridge

**WHY a store, not props (ADR-RT-003).** The Decision/MasteryEstimate live inside
whichever lesson's `useLessonEngine` is mounted; the surfaces that show them live
in `Shell`, ABOVE the lessons. Threading a callback through every lesson +
shell + MomsRoom is N fragile edits. A tiny observable singleton lets
`useLessonEngine` PUBLISH once and `Shell` SUBSCRIBE once — every lesson covered
for free, including partial adopters.

`engineStore.js` is a plain React-free module. State shape:
`{ decision, rationale, masteryMap, decisionLog:[{kind,rationale,t}],
metrics:{uiChurn}, nudge:{type,text,t}|null }`.

API: `subscribe(fn)→unsub`, `getSnapshot()` (stable identity until a publish),
`publishDecision(decision, masteryMap, t)`, `publishNudge(nudge, t)`,
`clearNudge()`, `resetEngineStore()` (test/new-session).

`publishDecision` appends a capped (last 50) decisionLog entry and increments
`metrics.uiChurn` when `kind` is `FadeScaffold`/`RaiseScaffold` (a "T3"
structural change — the state-model success counter-metric the inspector shows).

`useEngineStore.js`: `useSyncExternalStore(subscribe, getSnapshot, getSnapshot)`
— kept separate so the store stays React-free and unit-testable without a
renderer. Consumed by **ui-surfaces** (RationaleBanner/MasteryInspector/nudge
toast) — pointer.

---

## 9. The ADVISORY affect layer (`runtime/affect/**`)

Plan-005 corroboration engine. **FIREWALL (constitution §5.2; ADR-RT-002):** it
reads behavioral `Signal`s and emits an advisory tier + `AffectState`; it NEVER
produces or mutates a `MasteryEstimate`; valence stays neutral; it has no path
into `gate.ts`. The only affect data in the log is the empty `affect_window` stub.
Pure/immutable: returns new governor + ledger; no React, no wall-clock.

### 9.1 `affect/index.js` — `composeAffect` (the entry)

Ties the four pieces into the value that FILLS the `recentBehavior` affect slot
(`isDisengaged` today). It is the ONE place behavior-only adaptation decides a
tier, by CORROBORATION (composite), under a FATIGUE BUDGET (governor), recording
every raised hypothesis to the precision LEDGER.

`composeAffect({observed, ctx, prevAffect, governor, ledger})`:
1. `composite = computeComposite(observed, {hintState})`.
2. `affectState = smoothAffect(prevAffect, deriveAffect(composite, observed))`.
3. `isDisengaged = composite.band === 'T3'`.
4. `band === 'T1'` → quiet: `recommendedTier:'none'`, ledger/governor untouched.
5. Actionable (T2/T3): `channel = dominantChannel(byChannel)` by deterministic
   `CHANNEL_PRIORITY [latency_stall, idle, orphaned_interaction, rapid_submit,
   hint_spend]`; `severity = T3?'high':'low'`; `offerOk = canOffer(governor,
   attemptIndex)`. Record a ledger entry `{trigger, hypothesis: HYPOTHESIS[ch],
   action: offerOk?band:'suppressed', severity, context_hash,
   behavior_confirmed:null, observeOnly:!offerOk}`. Return
   `recommendedTier: offerOk?band:'none'`, `governor: offerOk?registerOffer:governor`,
   `ledger: record(...)`.

`HYPOTHESIS`: `latency_stall→stuck, idle→disengaged,
orphaned_interaction→wheel-spinning, rapid_submit→guessing,
hint_spend→over-reliant`.

### 9.2 `affect/composite.js` — corroboration as arithmetic (ADR-RT-004)

A NEWS2-style early-warning score. Each behavioral CHANNEL contributes capped
points; the sum bands into T1/T2/T3. **Load-bearing invariant:** a single channel
(even maxed, even firing many times) caps at `maxChannelPoints=2`, BELOW the
`t2=3` threshold — so it can NEVER cross a band alone; at least two channels must
agree. This is the structural "no single channel intervenes."

`COMPOSITE_PARAMS`: `maxChannelPoints:2, t2:3, t3:5, strongConfidence:0.5,
hintSpendRung:2`.

`SIGNAL_CHANNEL`: `idle→idle, latency_stall→latency_stall,
orphaned_interaction→orphaned_interaction, rapid_submit→rapid_submit,
scribble_burst→orphaned_interaction`.

`computeComposite(observed, {hintState}, params)`: for each non-`observeOnly`
signal, `add(channel, pointsForSignal)` where points = `2` if
`payload.transient===true` OR `confidence>=strongConfidence`, else `1`, capped
per channel at `maxChannelPoints`. `hintState>=hintSpendRung` adds
`maxChannelPoints` to a separate `hint_spend` channel (the corroborating second
channel). `band = score>=t3?'T3':score>=t2?'T2':'T1'`.
**Cold-start:** `observeOnly` signals are excluded from the score (logged
elsewhere, never scored — can't manufacture precision).

### 9.3 `affect/affectState.js` — AffectState (VALENCE FIREWALL)

Derives `{engagement, attention, confidence, valence}` from the composite.
**`valence` is ALWAYS `'neutral'` in Phase 2** — NO emotion/valence inference
anywhere (the firewall taken into the model itself); it only becomes non-neutral
when a CONSENTED self-report (Phase 3) or presence camera (Phase 4) supplies it,
never inferred from behavior.

`neutralAffect()` = `{engagement:1, attention:1, confidence:0.5,
valence:'neutral'}`. `deriveAffect(composite)` (channel-derived, clamped [0,1]):
`engagement = 1 - 0.2·idle - 0.2·orphaned - 0.15·rapid`;
`attention = 1 - 0.25·idle - 0.25·stall`;
`confidence = 0.5 - 0.12·hint - 0.12·stall - 0.12·rapid`; `valence:'neutral'`.
`smoothAffect(prev, raw, alpha=0.4)` EWMA-blends per dimension; valence stays
`'neutral'` so a single spike doesn't swing the state.

### 9.4 `affect/governor.js` — nudge-fatigue governor

A per-child intervention budget + dismissal-driven cooldown, so the watcher is
quiet by default and CAN'T pester a child into the disengagement it then detects.
Measured in ATTEMPTS, not wall-clock (caller passes the attempt index).
`GOVERNOR_PARAMS`: `maxOffers:5, baseCooldown:2, backoffPerDismissal:2`.
`makeGovernor()` → `{budget, dismissals:0, lastOfferAttempt:null, params}`.
`effectiveCooldown(g) = baseCooldown + backoffPerDismissal·dismissals`.
`canOffer(g, i)` = budget>0 AND (no prior offer OR `i-lastOffer >= effectiveCooldown`).
`registerOffer` spends a budget unit + stamps the attempt. `registerDismissal`
grows backoff. `registerAccepted` resets `dismissals=0` (real help isn't penalized).
All `register*` are immutable.

### 9.5 `affect/ledger.js` — the precision ledger (counter-metric)

The "earn its place" artifact: every affect-raised hypothesis logged with
`{trigger, hypothesis, action, severity, context_hash, behavior_confirmed?,
observeOnly?}`. The report computes affect's precision (confirmed/resolved) both
unweighted AND WEIGHTED BY INTERVENTION COST, so a false high-severity escalation
hurts far more than a false "take your time".
`SEVERITY_COST = {low:1, med:3, high:9}`. `makeLedger()` → `{entries:[],nextId:0}`.
`record(ledger, e)` appends an id'd entry (immutable). `resolve(ledger, id,
confirmed)` flips a pending entry. `report(ledger)` →
`{total, confirmed, unconfirmed, pending, precision, costWeightedPrecision,
falseInterventionCost, byTrigger:{[t]:{raised,confirmed,precision}}}`.
**Pending** (`behavior_confirmed===null`) excluded from precision; **observeOnly**
entries logged but NEVER scored.

### 9.6 `affect/selfReport.js` — self-report companion (Phase 3)

A consented tap (`'tricky'`/`'easy'`) is a FIRST-CLASS signal AND the gold-
standard label the inferred layer is graded against (the pure logic; the React
probe is `ui/AffectProbe.jsx`, ui-surfaces-owned — pointer).
`SELF_REPORT_PARAMS`: `window:3, contradictWrongCount:3, contradictCleanCount:3`.
`evaluateSelfReport(choice, recentObservations)`:
- examines the last `window` observations;
- `'easy'` contradicted if `wrong >= contradictWrongCount` →
  `contradictedBy:'recent_errors'`;
- `'tricky'` contradicted if clean-hint-free corrects `>= contradictCleanCount` →
  `contradictedBy:'recent_clean_corrects'`;
- returns `{choice, corroborated, signal, goldLabel}`. The actionable `signal`
  (`{type:'self_report', confidence:1, payload:{choice,corroborated:true}}`) is
  DISCARDED (null) when behavior contradicts; the raw `goldLabel` is ALWAYS kept
  (a contradiction is itself data).
`applySelfReportToLedger(ledger, choice)`: resolves all pending non-observeOnly
entries — `'tricky'` CONFIRMS, `'easy'` CONTRADICTS; already-resolved untouched.

---

## 10. Retention probe (U7) — boundary note

`test_retention_probe_u7.test.js` (owned here) exercises `dueProbes` and
`recordRetentionProbe`, which live in **`kitchenProgress.js` (shell-nav-owned)**
and consume `PROBE_DELAYS_MS` from **`engine/decay.ts` (engine-core-owned)**.
This slice owns the test only as a runtime-emission boundary check: a mastered
node older than the probe interval (and never/long-ago probed) is "due"; a fresh
or recently-probed or non-mastered node is not; `recordRetentionProbe(node,
correct, t)` appends a `retention_probe` event carrying `{node_id, correct,
probe_t}`. The live retention-probe LOOP runs in `Shell` (shell-nav) — pointer.

## 11. Lesson-emission contract (boundary note)

`test_stage_lessons_emission.test.jsx` and `test_unlikeden_emission.test.jsx`
(owned here) verify the RUNTIME EMISSION CONTRACT that the lesson screens
(**lessons-rooms**-owned — pointer) must satisfy through these hooks: a judged
correct emits a complete KTD3 Observation burst (every field present and
well-typed; `handwriting` carries `recognizer_confidence`, `tap` carries null;
`affect_window` is always `[]`). Lesson configs (`r2-unit`/`r3-nonunit`) must
expose ≥2 structurally-distinct `surface_forms` for the transfer tracker. The
pure lesson helpers (`nodeIdFromLesson`, `surfaceFormFor`, `errorSignatureFor`)
are replicated in the test and are lessons-rooms-owned; documented there.
