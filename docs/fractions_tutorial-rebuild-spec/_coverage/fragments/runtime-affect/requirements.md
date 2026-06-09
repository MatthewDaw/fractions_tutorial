# Requirements — `runtime-affect` slice

RFC-2119 keywords. Each requirement carries Given/When/Then acceptance criteria
drawn from the owned tests. Engine/generator/kitchenProgress behaviors are
referenced by pointer (owned by engine-core / generators / shell-nav).

---

## Runtime hooks

### R-RT-1 — emit stamps and persists every event
The runtime `emit` MUST stamp `t = Date.now()` and `actor:'human'` onto each
event (defaulting `modality:'tap'`), append it via the engine log, and persist.

- Given a mounted `useLessonEngine`, When `emit({type:'problem_present',
  payload})` is called, Then the returned event has a numeric `t > 0`,
  `actor==='human'`, and `appendEvent` + `saveLog` are both called.
- Given an emitted event, When the hook remounts (simulated reload), Then
  `loadLog` is called on init so the log survives.

### R-RT-2 — judgeAndAdvance emits exactly the answer_submit + judged pair
`judgeAndAdvance` MUST append EXACTLY one `answer_submit` and one `judged` event
per call and MUST return a `Decision`.

- Given a prior `problem_present`, When `judgeAndAdvance({value,modality},
  {correct,stars})` runs, Then exactly two events are appended whose types are
  `answer_submit` and `judged`, and the return has string `kind` + non-empty
  `rationale`.

### R-RT-3 — judged event carries the full KTD3 Observation metadata
The `judged` payload MUST include `correct`, `error_signature`, `hint_max_rung`,
`self_corrections`, `recognizer_confidence`, `modality`, and an `affect_window`
array that MUST be empty `[]` (the firewall stub — see ADR-RT-002).

- Given a handwriting attempt with `recognizerConfidence:0.92,
  errorSignature:'add_denominators', hintMaxRung:1, selfCorrections:2`, When
  judged, Then the `judged` payload mirrors those fields and
  `Array.isArray(affect_window) && affect_window.length===0`.

### R-RT-4 — measurementReduce runs exactly once per submit
`judgeAndAdvance` MUST call `measurementReduce` exactly once per call (one fold),
and MUST update `masteryFor`.

- Given one `judgeAndAdvance`, When it completes, Then `measurementReduce` was
  called once and `masteryFor(nodeId)` returns an estimate with numeric `P_known`
  (and `null` for an unknown node id / before the first submit).

### R-RT-5 — boundary-only decisions (R16)
`nextDecision` MUST be called ONLY inside `judgeAndAdvance` (the submit/entry
boundary), exactly once per call, and MUST NOT be called on mount, re-render, or
by `emit` alone (constitution §5.3; ADR-RT-001).

- Given a freshly mounted hook, When nothing is submitted, Then `nextDecision`
  has NOT been called.
- Given several `emit` calls (`problem_present`, `place_block`, `remove_block`),
  When no submit occurs, Then `nextDecision` has NOT been called.
- Given two `judgeAndAdvance` calls, Then `nextDecision` was called exactly twice,
  each receiving the policy state (with a string `currentNodeId`), the mastery
  map, and a numeric `now`.

### R-RT-6 — scaffold changes apply on Fade/Raise; U2 certification is synchronous
On `FadeScaffold` the level MUST increase by 1 (clamped at 4); on `RaiseScaffold`
it MUST decrease by 1 (floored at 0). `isCertified()` MUST reflect
`gate.isMastered` on the freshly-reduced estimate WITHOUT an extra `nextDecision`
call.

- Given a `RaiseScaffold` decision with `preserveWork:true`, When judged from
  stage 3 (L2), Then the returned decision preserves `preserveWork` and
  `scaffoldLevel` does not increase.
- Given a fully-mastered reduced estimate, When judged once, Then `isCertified()`
  returns `true` synchronously and `nextDecision` was called exactly once.

### R-RT-7 — practiceFlow maps Decision → next problem (pure)
`nextPractice` MUST be pure and map each Decision kind per the design table;
`otherSurfaceForm` MUST return a different surface form for a multi-form skill.

- Given `base={skill:'SIMPLIFY',level:2,index:5,surfaceForm:'single_factor'}`:
  `PresentProblem` → `{level:2,index:6,surfaceForm:'single_factor'}`;
  `FadeScaffold` → `{level:3,index:6}` (clamped at 4);
  `RaiseScaffold` → `{level:1,index:6}` (floored at 0);
  `TransferProbe` → `{level:2, surfaceForm:'multi_factor'}`;
  `ReturnToKitchen` → `action:'return'` (no spec); `RouteToRoom` → `action:'route'`.
- Given repeated `PresentProblem`, Then `index` increments monotonically
  `[1,2,3,4,5]`.

### R-RT-8 — useGeneratedPractice runs the estimator-driven loop through the real engine
A lesson adopting `useGeneratedPractice` MUST serve a valid generated problem,
hand a fresh variation after each correct, fade scaffold on a clean streak,
transfer-probe a too-fast guesser onto a different surface form, and MUST NOT
exit mid-practice.

- Given `SIMPLIFY`/`r4`, When started, Then `problem.skill==='SIMPLIFY'`,
  `level===0`, and the problem is correct-by-construction.
- Given 5 diligent (in-band) corrects, Then the learner saw >2 distinct prompts.
- Given 6 clean corrects, Then `max(level)>0` (a FadeScaffold fired).
- Given one suspiciously-fast correct (latency 100ms < floor), Then the next
  problem is still valid and a transfer probe was queued.
- Given one mid-practice correct, Then `exit` is `null`.

### R-RT-9 — useLessonScaffold owns the shared lesson controller
The hook MUST own the identical lesson glue and MUST treat stage keys as opaque.
On a generated stage it MUST pace in place (re-roll/fade/raise/transfer) and MUST
terminate on certification before any endless re-roll.

### R-RT-10 — scaffoldMap is the single beat↔level map
`toScaffoldLevel` and `toBeatForLevel` MUST be the single source of beat↔level
mapping, conservative (lowest accurate level), and MUST default to `0` / `'1'`
for unknown lessons.

- Given `('r2','L6')`→ ≥3; `('r1','5')`→ ≥3; `('r4','numbers')`→ ≥3;
  `('r1','1')`→ 0; `('r1','7')`→ 4; `('unknown','L6')`→ 0.
- Given `entryScaffoldFor` (shell-nav, pointer) yields designLevel 3 for `r2`,
  Then `toBeatForLevel('r2',3)==='L6'`; for `r1` designLevel 2 → `'3'`; for `r4`
  level 1 → `'bind'`; for `r5` level 3 → `'3-fade'`.

### R-RT-11 — Tier-2 nudges are deterministic, idempotent, boundary-safe, nudge-only
`tier2` MUST fire each nudge at most once per window, in priority
HINT_OFFER > TAKE_YOUR_TIME > TRANSFER_PROBE_QUEUED, MUST NOT mutate game state,
MUST NOT return a Decision (`kind`), and MUST queue (not fire) a transfer probe.

- Given idle `>= PAUSE_THRESHOLD_MS (8000)`, Then `HINT_OFFER{suggestedRung:
  hint_max_rung+1}`; a second check returns `null` (idempotent).
- Given `self_corrections >= OSCILLATION_THRESHOLD (3)` and no pause, Then
  `TAKE_YOUR_TIME{oscillations}` once.
- Given `too_fast_correct:true` and nothing else, Then `TRANSFER_PROBE_QUEUED`
  and `windowState.transferQueued===true`.
- Given any nudge, Then it has a `type` and no `kind`, and the recentBehavior /
  observation objects are unchanged. `windowState===null` → `null`.

### R-RT-12 — engineStore bridges runtime to surfaces
`engineStore` MUST be a React-free observable singleton with a stable snapshot
identity until a publish. `publishDecision` MUST append a capped (≤50) decision
log and increment `uiChurn` on Fade/Raise. `useEngineStore` MUST bind it via
`useSyncExternalStore`. (ADR-RT-003.)

---

## Advisory affect (firewall — constitution §5.2; ADR-RT-002)

### R-AF-1 — composeAffect decides a tier by corroboration under a budget
`composeAffect` MUST be pure/immutable, MUST return a new governor + ledger, MUST
be quiet (`recommendedTier:'none'`, untouched ledger/governor) at band T1, and at
T2/T3 MUST log a pending hypothesis and spend the governor only if `canOffer`.

- Given two corroborating channels and budget, Then band T2,
  `recommendedTier:'T2'`, governor budget −1, one pending ledger entry
  (`behavior_confirmed===null`).
- Given three strong channels, Then band T3 and `isDisengaged===true`,
  severity `'high'`.
- Given an exhausted budget, Then `recommendedTier:'none'` and the ledger entry
  is `observeOnly` (logged, not scored).
- Given identical input, Then identical output (determinism).

### R-AF-2 — corroboration invariant (no single channel intervenes)
`computeComposite` MUST cap any single channel at `maxChannelPoints (2)`, below
`t2 (3)`, so one channel (even maxed/repeated) CANNOT cross from T1 to T2; at
least two channels MUST agree. `observeOnly` signals MUST NOT score (ADR-RT-004).

- Given three `idle` signals, Then `byChannel.idle<=2`, `score<3`, band T1.
- Given `idle`+`orphaned_interaction`, Then band T2. Given those + `latency_stall`,
  Then band T3.
- Given `idle` alone (T1) vs `idle` + `hintState>hintSpendRung`, Then the latter
  is T2 (hint_spend is the corroborating channel).
- Given two observe-only signals, Then `score===0`, band T1.

### R-AF-3 — AffectState valence firewall (no emotion inference)
`deriveAffect`/`smoothAffect` MUST keep `valence==='neutral'` regardless of
behavioral signals; dimensions MUST stay in `[0,1]`; engagement MUST drop as the
composite rises; smoothing MUST damp a single spike.

### R-AF-4 — governor caps and backs off without manufacturing disengagement
The governor MUST exhaust after `maxOffers`, MUST block until the cooldown
elapses, MUST grow the cooldown per dismissal, and an accepted offer MUST reset
the backoff. `register*` MUST be immutable.

### R-AF-5 — precision ledger is the cost-weighted counter-metric
`record`/`resolve`/`report` MUST be immutable; precision MUST count confirmed
over resolved (pending excluded); cost-weighted precision MUST punish a false
HIGH-severity escalation harder than a false low; `observeOnly` entries MUST be
logged but excluded from scoring; per-trigger precision MUST be reported.

### R-AF-6 — self-report is a first-class signal AND the gold label
`evaluateSelfReport` MUST discard the actionable signal when behavior flatly
contradicts the tap, but MUST ALWAYS return the raw `goldLabel`.
`applySelfReportToLedger` MUST resolve pending non-observeOnly hypotheses
(`'tricky'` confirms, `'easy'` contradicts) and leave resolved entries untouched.

- Given `'easy'` after three wrong, Then `corroborated:false`, `signal:null`,
  `goldLabel.report:'easy'`.
- Given `'tricky'` amid struggle, Then a gold-standard `signal{type:'self_report',
  confidence:1}`.
