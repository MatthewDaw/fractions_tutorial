# Bundled reference docs (`docs/**`, except the rebuild-spec itself)

> The pre-existing `docs/` tree is **reference material** that ships with the repo.
> Per the partition, this slice LISTS it (so the catalog is exhaustive) but does NOT
> re-document its content. Excludes `docs/fractions_tutorial-rebuild-spec/**` (the
> spec being authored). Source comments cite some of these as `state-model §X`,
> `measurement §4.x` (constitution §6 — pointer).

## `docs/design/` — design references (cited by source comments)
- `fraction-app-state-model.md` — the `state-model §X` design doc engine/runtime comments reference.
- `student-state-measurement.md` — the `measurement §4.x` design doc.
- `presentation-scene-architecture.md` — lesson scene architecture.
- `2026-05-31-spec-clarifications.md`, `asset-generation-prompt-test.md`,
  `asset-manifest.md`, `themed-load-isomorphism-rubric.md`.
- `prompts/`, `design_handoff_matching_sizes/`, `design_handoff_same_pieces/` (asset/handoff folders).

## `docs/plans/` — dated implementation plans (the `U#`/`KTD#`/`R#` provenance)
9 plan docs (`2026-05-31-001…` through `2026-06-02-002-feat-activate-dormant-pedagogy-plan.md`),
plus `2026-05-31-003-plan-readiness-review.md` and `2026-06-01-005-typed-requests-to-seam-owner.md`.

## `docs/ideation/` — pre-plan ideation (music, observation/affect, CCSS, pedagogy, harness).

## `docs/inspiration/` — `app_philosophy.md`, `hyper_responsive_ui.pdf`, `synthetic_challenger.pdf`.

## `docs/room_break_down/` — per-room teaching breakdowns
`README.md`, `_TEMPLATE.md`, `00_kitchen_hub.md`, `03_R1…` `04_R2…` `05_R3…`
`06_R4…`, `ASSET_CATALOG.md`. (Room *content* is `lessons-rooms`-owned — pointer.)

## `docs/wireframes/` — static HTML wireframe mocks
`index.html`, `kitchen.html`, `R1.html`…`R4.html`, `styles.css`. (The authored
nav-graph wireframes are synthesis-owned — pointer.)

## `docs/proof/adaptive-engine-proof.md` — engine-behavior proof writeup (engine content → `engine-core`).

## `docs/harness/` — committed harness artifacts (the `harness` slice's emitted output)
`baseline-report.md`, `decision-log.md`, `improvement-backlog.md`, `limitations-memo.md`,
`research-notes.md`, `verdict-cards.md`, `champions/`, `tapes/`. **Owned/documented by the
`harness` slice** (its `report` subcommand re-projects these byte-for-byte) — listed here
only because they live under `docs/`. Pointer: see `harness`.

## `docs/HANDOFF-engine-surfaces.md` — a one-off engineering handoff note (ui-surfaces content → pointer).

## `.claude/**` — agent harness scaffolding (NOT app code)
`.claude/agents/` (`codebase-reverse-prompt.md`, `docs-supervisor.md`),
`.claude/skills/` (bundled skill defs incl. `reverse-prompt-codebase`),
`.claude/orchestrate/` (run state, e.g. `rp-260608-2215.json`),
`.claude/worktrees/` (per-agent git worktrees), `.claude/scheduled_tasks.lock`.
These are tooling for authoring/agents, not part of the shipped app or its build.

## Root: `CLAUDE.md` (gstack project instructions + browsing policy + skill list),
`hiring_partners.csv` (unrelated recruiting data dropped at repo root — not app code).
