# ADR (harness) 0002 — The signed tape is the single source of truth; docs are pure projections

## Status
Accepted (reflects shipped code).

## Context
A red-team report is only credible if a skeptic can reproduce it. Hand-maintained
report numbers drift from the code and cannot be re-derived.

## Decision
One canonical, signed REPLAY TAPE per synthetic session is the SINGLE SOURCE OF
TRUTH (`tape.js`). Serialization is canonical (sorted keys + 1e-9 float rounding)
so two runs of the same `(persona, seed, flags)` serialize byte-identically. Every
emitted document EXCEPT the authored `research-notes.md` is a PURE PROJECTION of
the committed tapes (+ static audit probes): `report.js`/`findings.js`/`metrics.js`
read tapes only and never `fs`. The `report` CLI subcommand re-projects every doc
from the committed `docs/harness/tapes/baseline-seed<N>.jsonl` and must reproduce
the docs byte-for-byte (`test_report_projections`).

## Consequences
- `build*`/`render*` are split so the projection (data) is browser-safe and the
  Node-only markdown sink lives only in `cli.js`.
- The dashboard reuses the SAME projections, so demo and headless reports never
  disagree.
- Determinism is load-bearing: any `Math.random`/`Date` in the harness paths would
  break byte-stability. The `baseline` CLI asserts a byte-identical re-run.
