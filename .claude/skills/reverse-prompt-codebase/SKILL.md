---
name: reverse-prompt-codebase
description: >-
  Master methodology for reverse-prompting a codebase: analyze an existing repo and
  emit a multi-file, rebuildable specification under docs/<repo>-rebuild-spec/ so a
  fresh agent could recreate the project from the spec alone. Runs a 5-phase pipeline
  (recon → structural extraction → per-component deep dive → cross-cutting synthesis →
  verification) starting from entry points, extracting WHY as hard as WHAT. Use when
  asked to "reverse prompt this repo", "generate a rebuild spec", "document everything
  so Claude can rebuild it", or "produce a spec to recreate this project from scratch".
---

# reverse-prompt-codebase

Turn an existing repository into a **rebuildable specification** — a folder of plain-text
documents so complete and unambiguous that a fresh agent, given only the spec (no source
code), could recreate the project with matching structure and behavior.

This is the master methodology. Two companion skills handle specialized slices:
[[wireframe-from-code]] (the UI wireframe artifacts) and [[spec-rebuild-test]] (the
verification gate). Invoke them at the phases noted below.

## North star: the rebuild test

The spec is correct when it passes the **rebuild test**: delete the source, hand a fresh
agent only the spec files, ask it to rebuild, and the result matches the original in
structure and behavior. Every decision below serves that bar. The single most common cause
of a failed rebuild is **missing rationale** ("why 403 not 404", "why this schema") — not
missing facts. Extract *why* as aggressively as *what*.

## Output location & schema

Write everything under `docs/<repo-name>-rebuild-spec/`. Define this exact structure up
front and never let the output drift into ad-hoc files:

```
docs/<repo>-rebuild-spec/
  README.md            # index + how to use this spec to rebuild; reading order
  constitution.md      # immutable constraints: stack choices, security/auth model,
                       #   non-negotiable architecture rules. Everything else references this.
  requirements.md      # user stories (As a / I want / So that) + Given/When/Then acceptance criteria
  design.md            # tech stack WITH VERSIONS, component architecture, data flow,
                       #   error-handling strategy, auth model, key patterns
  data-model.md        # entities, fields + types, constraints, relationships (+ ERD ref)
  api-contracts.md     # every endpoint: method, path, request/response schema,
                       #   status codes WITH rationale, auth requirements
  env-and-config.md    # env vars + config keys (NAMES + purpose, never values),
                       #   build/run/test commands, deployment targets
  ui-wireframes.md     # one block per screen/route (produced via wireframe-from-code)
  tasks.md             # sequenced build plan; each task traceable to a requirement
  gotchas.md           # non-obvious behavior, perf hacks, workarounds, known bugs, edge cases
  glossary.md          # domain + technical terms, defined precisely
  adrs/ADR-001.md ...  # one ADR per significant non-obvious decision (5–15 typical)
  diagrams/
    architecture.mmd   # system context + container view (Mermaid)
    data-model.mmd     # entity-relationship diagram (Mermaid)
    key-flows.mmd      # sequence diagram(s) for the 2–3 most complex journeys
```

Right-size, don't pad. A small repo may collapse several files into one — but always emit
`constitution.md`, `design.md`, `data-model.md`, `api-contracts.md` (if there's an API),
`ui-wireframes.md` (if there's a UI), and at least a few ADRs. Note any intentionally-skipped
file in `README.md` so the reader knows it was a choice, not an omission.

### Sizing (three tiers)

- **Always-loaded** (`constitution.md`, `README.md`): 400–700 lines. Must not overflow a
  rebuild agent's context. Declarative, dense, no filler.
- **Per-subsystem** (`design.md`, `data-model.md`, component sections): 200–500 lines each.
- **Reference** (`api-contracts.md`, `glossary.md`): as long as completeness requires;
  these are looked up, not pre-loaded.

## The 5-phase pipeline

Never do this in one pass. Run distinct phases, each producing distinct artifacts. For a
large repo, fan out parallel sub-agents within a phase (one per subsystem/entry point) and
synthesize.

### Phase 1 — Reconnaissance (cheap, mostly no-LLM)
- Map the file tree; read `package.json`/`pyproject.toml`/`go.mod`/etc. for stack + versions.
- Identify build/run/test commands, env vars, config files, CI.
- Classify the architecture (monolith / service / CLI / library / frontend+backend).
- Produce the skeleton: list every **entry point** — routes, `main()`, CLI commands,
  exported API surface, page/route files, background jobs, cron. These seed Phase 2.
- Respect `.gitignore`; ignore `node_modules/`, `dist/`, build artifacts, lockfiles' internals.

### Phase 2 — Structural extraction (entry-point first)
Do **not** walk files alphabetically. Start from the zero-in-degree nodes found in Phase 1
(routes, `main`, exported surfaces) and recurse into their dependencies. Build the
dependency/call map: which component calls which, which data flows where. Extract the
structural skeleton (function/class/interface names, signatures, route registrations)
*without* full bodies first — this is the cheap architectural map. Pull full bodies only for
high-significance files (schemas, auth, core business logic).

### Phase 3 — Per-component deep dive
For each component, document: purpose, public interface, inputs/outputs, dependencies, data
it touches, and the **business logic**. For non-trivial logic use **structured
chain-of-thought** before writing: (a) enumerate every conditional branch, (b) enumerate
loops and their exit conditions, (c) enumerate state mutations, then (d) write the spec.
This is also where you mine **rationale**: for every non-obvious choice (error codes, data
structures, algorithm/library selection, schema shape), hypothesize the *why* from comments,
test cases, variable names, and git history — and write it inline next to the decision. Each
such decision that's architecturally significant becomes an ADR.

### Phase 4 — Cross-cutting synthesis
Assemble the output schema. Write `constitution.md` first (it constrains everything else),
then `design.md`, `data-model.md`, `api-contracts.md`, `requirements.md`, `tasks.md`,
`gotchas.md`, `glossary.md`, the ADRs, and the Mermaid diagrams. Invoke
[[wireframe-from-code]] to produce `ui-wireframes.md` and `diagrams/key-flows.mmd` for the UI.
Write `README.md` last as the index + reading order + rebuild instructions.

### Phase 5 — Verification (quality gate)
Run [[spec-rebuild-test]]: pick the highest-value files, predict their contents from the spec
alone, diff against reality, and patch every gap back into the spec. Repeat on the worst gaps
until the spec is self-sufficient. Record the residual risk in `README.md`.

## Authoring rules (bake into every file)

- **Plain text only** — Markdown, Mermaid, YAML. No binaries. One concept per file; prefer
  short files. The spec must diff cleanly in a PR.
- **RFC 2119 keywords** (MUST/SHOULD/MAY) for requirements; **Given/When/Then** for behavior.
- **Kill ambiguity**: if a statement could be read two ways, add a concrete example or a
  constraint. Ambiguity is the #1 failure mode for spec-driven rebuilds.
- **Versions and exact commands**, never "the usual setup."
- **Secrets**: document env-var *names* and purpose; never copy values. Add a Boundaries note
  in `constitution.md` (Always / Ask-first / Never) for any destructive rebuild action.
- **Don't critique or improve** the code — document what IS and why, not what should change.

## Worked micro-example (file → spec)

Given `src/auth/middleware.ts` that returns `403` for an expired token and `401` for a
missing one, the spec entry in `api-contracts.md` reads:

> **Auth middleware** — MUST reject requests without a bearer token with `401 Unauthorized`.
> MUST reject requests with a present-but-expired/invalid token with `403 Forbidden`
> (rationale: distinguishes "who are you?" from "you may not"; the SPA uses 403 to trigger a
> silent re-auth rather than a login redirect — see ADR-004). Token validated against
> `JWT_SECRET` (env). On success, attaches `req.user = { id, role }`.

Note what makes it rebuildable: exact status codes, the *why*, the env dependency, the shape
of the attached object, and a pointer to the ADR.
