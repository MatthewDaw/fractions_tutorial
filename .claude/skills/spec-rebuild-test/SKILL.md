---
name: spec-rebuild-test
description: >-
  Verification gate for a reverse-engineered spec: prove it is rebuildable by predicting source
  files from the spec ALONE and diffing predictions against the real code, then patching every
  gap back into the spec. Scores spec completeness and reports residual risk. Use after
  generating a rebuild spec, or when asked to "verify the spec", "is this spec complete enough
  to rebuild", or "run the rebuild test".
---

# spec-rebuild-test

The quality gate for a reverse-engineered specification. A spec is only as good as its ability
to regenerate the system. This skill measures that directly via **predict-then-diff** and feeds
the gaps back into the spec. Companion to [[reverse-prompt-codebase]] (Phase 5).

## Why predict-then-diff

You can't cheaply re-run a whole rebuild after every edit. Instead, treat the spec as the only
input and ask: "Given only the spec, what would file X contain?" Then compare to the real file.
Every divergence is a concrete, located spec gap — far more actionable than a vague "looks
incomplete."

## Procedure

### 1. Pick high-value targets
Select 5–15 files that carry the most behavior and rationale: schemas/models, auth, core
business logic, the main API handlers, the primary UI screen, config/bootstrap. Skip trivial
files (pure types, generated code, boilerplate).

### 2. Predict from the spec alone
In a context that has **only the spec files** (not the source), for each target file describe
what it must contain: its exports/signatures, the logic and branches, the data it touches,
error handling, status codes, and dependencies. Be specific enough to compare.

### 3. Diff against reality
Compare each prediction to the actual file. Classify each divergence:
- **Cannot start** — spec lacks the stack, dependency, file location, or signature needed to
  even begin. (Highest severity — fix first.)
- **Contract gap** — a cross-component interface, schema field, or API shape is missing/wrong.
- **Logic gap** — a branch, edge case, validation, or business rule is absent.
- **Rationale gap** — the *what* is right but the *why* is missing, so a rebuild would plausibly
  choose differently (e.g. predicted 404 where the code returns 403).

### 4. Patch the spec
For each divergence, write the missing detail back into the correct spec file
(`api-contracts.md`, `data-model.md`, `gotchas.md`, a new ADR, etc.). Rationale gaps usually
become ADRs or inline "rationale:" notes. Do **not** edit the source — only the spec.

### 5. Score and report
Emit a completeness scorecard:

```
Rebuild-test: <N> files sampled
  Cannot-start gaps:  <x>   (must be 0 to pass)
  Contract gaps:      <x>
  Logic gaps:         <x>
  Rationale gaps:     <x>
  Files predicted clean: <k>/<N>
Verdict: PASS / NEEDS-WORK
Residual risk: <one-line note on what a rebuild might still get wrong>
```

**Pass bar:** zero cannot-start gaps and no open contract gaps on sampled files. Re-sample the
weakest area after patching; stop when a fresh sample predicts clean. Record the final verdict
and residual risk in the spec's `README.md`.

## Stronger gate (optional)
For high-stakes specs, do a real partial rebuild: hand a fresh agent only the spec, have it
implement one module, and run the original test suite (or behavior checks) against it. Where the
rebuild diverges from the original, the spec — not the rebuild — is at fault; patch it. This is
the ground-truth version of predict-then-diff when the budget allows.
