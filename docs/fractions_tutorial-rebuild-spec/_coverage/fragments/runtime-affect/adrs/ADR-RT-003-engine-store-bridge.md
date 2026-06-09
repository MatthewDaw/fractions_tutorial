# ADR-RT-003 — An observable singleton bridges runtime to the surfaces

Status: Accepted (reflects what IS). Slice: `runtime-affect`.

## Context
The live `Decision`, `rationale`, and `MasteryEstimate` map are produced inside
whichever lesson's `useLessonEngine` instance is currently mounted. The
always-mounted model surfaces that must display them — the rationale banner
("why did this change?"), the DEV mastery inspector (counter-metrics incl.
`uiChurn`), and the Tier-2 nudge toast — live in `Shell`, ABOVE every lesson.
Threading callbacks down through every lesson + `LessonShell` + `LessonUnlikeDen`
+ `MomsRoom` would be many fragile edits and easy to get wrong, and partial
adopters would be missed.

## Decision
Use a tiny React-free observable singleton, `runtime/engineStore.js`, with
`subscribe`/`getSnapshot`/`publishDecision`/`publishNudge`/`clearNudge`/
`resetEngineStore`. `useLessonEngine` PUBLISHES once (at the boundary, via
`publishDecision`); `useLessonScaffold` publishes nudges (`publishNudge`); `Shell`
SUBSCRIBES once. The React binding is a SEPARATE file, `useEngineStore.js`
(`useSyncExternalStore(subscribe, getSnapshot, getSnapshot)`), so the store itself
stays a plain module the engine runtime can publish to and unit tests can drive
without a renderer.

## Rationale
- **Coverage for free**: every lesson — including partial adopters — is covered
  by a single publish/subscribe pair instead of N prop chains.
- **Testability/purity**: the store is React-free; `getSnapshot` returns a stable
  identity until a publish (required by `useSyncExternalStore` to avoid loops).
- **Counter-metrics in one place**: `publishDecision` is the natural choke point
  to count `uiChurn` (Fade/Raise structural changes) and cap the decision log
  (≤50), feeding the inspector the brief's anti-shallow guards.

## Consequences
- Module-level mutable state means tests/new sessions must `resetEngineStore()`
  (gotcha G10).
- The surfaces (ui-surfaces slice) depend on this store by pointer; this slice
  owns the store + binding, not the surfaces.
