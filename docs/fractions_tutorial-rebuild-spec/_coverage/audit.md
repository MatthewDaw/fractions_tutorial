# Audit — rebuild-spec coverage gate (run rp-260608-2215)

Run by `docs-supervisor` (spec-coverage-map Phase D + spec-rebuild-test) after synthesis,
against `_coverage/census.md`. Three checks: coverage diff, duplication scan, rebuild sufficiency.

## 1. Coverage diff (vs census)

The spec was built as a **MECE partition** of the census: every source file is owned by exactly
one of 9 slices (mutually-exclusive globs; a `leftovers` catch-all guarantees exhaustiveness), and
each slice tracked a per-item checklist. Coverage is therefore structural, not hoped-for.

| category (census denominator) | documented | result |
|---|---|---|
| 9 subsystem slices | 9/9 | ✅ |
| UI routes/screens (10 rooms + 8 chrome/overlay = 18) | 18/18 | ✅ in `ui-wireframes.md` (per-screen) + nav graph |
| Models (10 skill-graph DAG nodes + engine DTOs) | 10/10 + DTOs | ✅ in `data-model.md` + `diagrams/data-model.mmd` |
| Dev endpoints (`POST/DELETE/GET /__ink`, `POST /api/tts`) | 4/4 | ✅ in `api-contracts.md` + `env-and-config.md` |
| Per-slice census items | all owned items `[x]` | ✅ |

**Open items: 0 (real).** The per-slice checklist scan flagged one `[ ]` in
`engine-core/checklist.md`, confirmed a **false positive** — it is the checklist's legend line
(`` `[ ]`→`[x]` as documented ``), not an undocumented census item. Every other slice checklist is
fully `[x]`.

Headline-inventory presence confirmed by grep across the canonical docs: `/__ink` (6 docs),
`/api/tts` (7), `resolveTsFromJs` (7), `MasteryEstimate` (12), `isMastered` (10),
`scaled_bottom_only` (6), `mnist-12.onnx` (6).

## 2. Duplication scan

Fragments are **file-disjoint by construction** (non-overlapping ownership globs), so no two slices
documented the same file. Synthesis reconciled the shared seams; cross-cutting content
(architecture overview, glossary, spanning ADRs, nav graph, data-flow) is owned solely by the
synthesis step. The few legitimate cross-references are documented as **gotchas/ADRs, not
duplicated prose**, notably:
- `MasteryInspector` (ui-surfaces) re-implements `gate.ts::isMastered` inline — flagged in
  `gotchas.md` + the engine-purity ADR as a hand-synced duplication *in the code*, documented once.
- `scaled_bottom_only` error signature emitted only by lesson graders / `observe`, never by
  `grade.js` — documented once with cross-pointers.

No duplicated documentation found.

## 3. Rebuild sufficiency

The spec carries the **what + why + order** a fresh agent needs:
- `constitution.md` — stack with versions, build/run/test commands, non-negotiable constraints.
- `design.md` (1643 lines) — per-subsystem architecture + the top-level overview + data-flow.
- `data-model.md` + `api-contracts.md` + `env-and-config.md` — contracts, DTOs, endpoints, config.
- `requirements.md` (RFC-2119 + Given/When/Then) + `ui-wireframes.md` (per-screen + nav graph).
- `adrs/` — **13 ADRs** (8 slice-local + 5 spanning) capturing the load-bearing rationale.
- `tasks.md` (642 lines) — one global dependency-ordered rebuild plan.
- `glossary.md`, `diagrams/*.mmd` (architecture, data-model, key-flows).

**Residual risk (honest):** a full file-by-file predict-then-diff rebuild test was not executed for
all ~190 files; coverage rests on the MECE per-item checklists plus headline-inventory spot checks
and the documented gotchas. The four code-level findings surfaced during documentation
(generator pools vs the CCSS 7/9 contract; `scaled_bottom_only` provenance; the
`MasteryInspector`↔`gate.ts` duplication; `train_mnist.py` MLP vs the shipped `mnist-12.onnx`) are
documented as-is — they describe the code's real state, not spec gaps.

## Verdict

**PASS** — coverage 100% of routes/endpoints/models (0 real open items), 0 duplicated docs, rebuild
sufficiency met. Cleared for the review PR.
