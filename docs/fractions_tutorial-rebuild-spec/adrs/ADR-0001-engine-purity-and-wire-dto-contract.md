# ADR-0001 — Engine purity and the wire-DTO contract (spanning)

## Status
Accepted (reflects what IS in the codebase).

## Context
The mastery/measurement engine (`web/src/engine/**`) is the high-stakes core: it
decides what a child knows and what to present next. For that decision to be
trustworthy, auditable, and relocatable, the engine must be a pure function of a
recorded event log — not entangled with React rendering, wall-clock time, or any
host-specific concern. The product also wants the option to later move the engine
behind a Python/FastAPI backend without rewriting every caller. Both goals require
a single, deliberate boundary between the engine and everything that drives it.

## Decision
1. **Purity.** Every file under `web/src/engine/**` carries a purity header and
   contains **no React imports and no wall-clock calls**. Time enters the engine
   only as injected event timestamps (`event.t`) or a caller-supplied `now`. The
   fold (`foldLog` / `measurementReduce`) is replayable and side-effect-free. The
   one I/O point — the localStorage persistence adapter in `log.ts`
   (`loadLog`/`saveLog`) — is a separate function family kept OUT of the fold.
   `Date.now()` is allowed only in the React layer (`runtime/**`).
2. **Wire-DTO contract.** Everything exported from `engine/index.ts` is a plain
   data-transfer object that could travel over a network boundary: `Event` /
   `Action` / `Signal`, `Observation`, `MasteryEstimate`, the `Decision`
   discriminated union (7 kinds), `SkillNode`, plus `PARAMS`. These shapes are a
   STABLE interface — the BKT `MasteryEstimate` shape is the public R8 contract.
   The TS engine is imported from `.js`/`.jsx` callers via explicit `.js`
   specifiers; the relocation seam is the `fetch`-able shape of these DTOs, so the
   engine could move behind a server by swapping the call sites with zero contract
   churn (see ADR-0004 for the build-time resolution detail).

## Consequences
- Determinism and replay come for free: one recorded log re-folds byte-identically
  (the harness depends on this — see harness ADR 0002).
- Mastery is **read-only** via `gate.isMastered(estimate)`; there is no
  `DeclareMastered` decision and no written `mastered` flag (R9, constitution §5.4).
- New engine features must be expressible as additions to the DTOs and the fold,
  never as a React/timer side effect.
- The runtime-side expression of the boundary rule (one consult per attempt) is
  documented in ADR-RT-001; this spanning ADR owns the purity + DTO contract that
  makes it possible.
