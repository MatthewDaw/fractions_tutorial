# ADR (harness) 0001 — Personas are parameter-disjoint from the engine (lint-enforced)

## Status
Accepted (reflects shipped code).

## Context
The harness is a RED-TEAM, not a spec suite. If each synthetic learner were just a
re-parameterisation of the engine's own BKT inference model, then "the harness
passes" would be a tautology — the engine would only ever be tested against its own
assumptions.

## Decision
A persona's generative model of a child MUST be parameter-disjoint from the
engine's mastery-inference params. Enforced by a hard LINT: no file under
`web/src/harness/personas/**` may contain the literal substring `engine/params`
(`test_param_disjointness`). Personas sample correctness from their OWN latent
(`truePknownBySkill`, `learnRate`, `pSlip`, `pGuess`), never from `PARAMS`.
Where a persona must reference an engine constant (e.g. the oscillator period being
coprime with `fadeStreakK`=3), the value is HARDCODED with a comment
(`FADE_STREAK_K_LITERAL = 3`) rather than imported.

## Consequences
- The lint is the safest possible check (literal substring), so even a prose
  comment mentioning the path would fail it.
- Train vs held-out families further enforce disjointness via non-overlapping
  latent RANGES and a genuinely non-BKT held-out generative law (oscillatory /
  bimodal / fluency-spoof), so passing the sealed judge means something.
- `PARAMS` is still read READ-ONLY in `config.js` for tape attribution
  (`params_hash`) only — never to seed personas.
