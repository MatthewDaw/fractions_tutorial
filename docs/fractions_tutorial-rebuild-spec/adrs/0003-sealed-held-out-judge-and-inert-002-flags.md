# ADR (harness) 0003 — Sealed held-out judge; inert plan-002 flags read NO_CHANGE

## Status
Accepted (reflects shipped code).

## Context
Improving a metric on the SAME personas a tuner optimizes against is exactly what
"gaming"/Goodharting looks like. Separately, the harness threads plan-002's reversible
flags (`fluencyHardMode`, `frustrationScaffold`, `delayedProbe`, `unifiedTaxonomy`)
through runs BEFORE 002 has wired them into the engine's `PARAMS`.

## Decision
1. **Sealed held-out judge** (`recursiveLoop.runLoop`): a change is blessed `REAL`
   ONLY when a SEALED held-out family — DISJOINT latents, a FRESH seed lineage
   `(seed ^ 0x5ea1ed)>>>0`, and a non-BKT generative law — improves on a target
   metric AND the off-limits guardrail (transfer-on-novel-forms) does not degrade
   AND a search-trials-DEFLATED bar holds. Train-only improvement reads `GAMING`.
2. **Inert-flag honesty** (`config.js`, `oracle/expectedFindings.js`): the 002 flags
   are INERT STUBS today — threaded through tapes but NOT routed into `PARAMS`. So a
   flags-ON run STILL shows the six audit defects present, and the canonical
   plan-002-flags change reads `NO_CHANGE`. The mechanism is built now and will
   report REAL/GAMING the moment 002 routes a flag through `PARAMS`. The seal MUST
   NOT fabricate a `REAL` from inert flags.

## Consequences
- The held-out family deliberately carries a real false-mastery defect
  (`fam-held-fluency-spoofer`, latent pinned < τ) — a defect-free held-out set
  could never measure an fm improvement.
- Test hooks (`perturbMetrics`/`perturbTapes`) exercise REAL/GAMING/regression
  deterministically without waiting for 002; they are absent in production.
- Each finding records its `flagThatResolves`, documenting (not asserting) the
  not-yet-observable resolution.
