# ADR-RT-001 — Boundary-only engine decisions (R16)

Status: Accepted (reflects what IS in the code). Slice: `runtime-affect`.

## Context
The pure engine (`policy.nextDecision`, `measurementReduce`, `gate.isMastered`)
is consulted from the React runtime. React re-renders frequently and on many
triggers (state, props, timers). If the engine consult were tied to rendering,
the same attempt could be judged many times, the decision log would churn, and
the deterministic, replayable contract (constitution §5) would break.

## Decision
`nextDecision` (and the whole engine consult: one `measurementReduce` fold, the
`nextDecision` call, and the U2 `gate.isMastered` check that reuses that fold) is
invoked from EXACTLY ONE place — `useLessonEngine.judgeAndAdvance`, the
submit/entry boundary — and EXACTLY ONCE per call. It is never placed in a
`useEffect`, never fired by `emit` (not even on `problem_present`), never fired on
re-render or by a timer. Tier-2 within-attempt nudges are the only adaptation
allowed between boundaries, and they are nudge-only and queue any structural
probe (`pendingTransferProbe`) for the NEXT boundary.

## Rationale
- **Determinism / replay**: one fold + one decision per judged attempt makes a
  recorded session reproduce byte-for-byte.
- **No mid-attempt restructuring**: a workspace can't be yanked out from under a
  child mid-thought; a queued `TransferProbe` waits for the boundary.
- **Truthful counters**: `consecutiveErrors`/clean-streak increment exactly once
  per submit; rationales report real counts (verified by the tests).

## Consequences
- The boundary sequence in `judgeAndAdvance` is fixed and ordered (see design
  §2.3); the too-fast guard must run after `_updatePolicyState` (gotcha G4).
- `.jsx` tests assert `nextDecision` is not called on mount or by `emit` alone.
- This is the runtime-side expression of the spanning engine-purity / wire-DTO
  decision (synthesis-owned ADR) — referenced here by pointer, not restated.
