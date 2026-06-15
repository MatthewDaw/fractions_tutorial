---
name: spec-coverage-map
description: >-
  Make reverse-prompting both fully-covered and non-repetitive by partitioning the codebase
  ONCE, up front, into MECE slices and tracking them in a shared coverage ledger. Builds an
  authoritative census of every file/route/endpoint/model/config, derives mutually-exclusive +
  collectively-exhaustive ownership slices (one per subsystem), and runs the final audit that
  diffs documented-vs-census (gaps) and flags the same concept documented twice (dupes). Use to
  plan a parallel documentation run, assign disjoint slices to workers, or audit spec coverage.
---

# spec-coverage-map

The control plane for a parallel reverse-prompting run. It exists to make two properties
**structural** instead of hoped-for:

- **Full coverage** — every file/route/endpoint/model/config is documented somewhere.
- **Non-repetition** — no concept is documented in two places.

You get both by partitioning the codebase **once, before any parallel work starts**, into a
**MECE** set of slices — **M**utually **E**xclusive (no two slices share a file ⇒ no dupes)
and **C**ollectively **E**xhaustive (every file is in exactly one slice ⇒ no gaps) — and by
auditing the result against the census you started from. Companion to
[[reverse-prompt-codebase]]; it powers that skill's Phase 1 (partition) and Phase 5 (audit),
and feeds [[wireframe-from-code]] the screen inventory and [[spec-rebuild-test]] the target list.

## The core idea

> Don't enforce coverage and non-duplication through workers coordinating at runtime — that
> produces both gaps and dupes. Compute a disjoint, exhaustive partition once, give each worker
> exactly one slice, route all genuinely-shared content to a single synthesis owner, then prove
> the result by diffing against the census.

The supervisor's per-tick "is this worker duplicating something?" check is a **backstop**, not
the mechanism. The partition is the mechanism.

## Artifacts (write under the spec folder's `_coverage/`)

```
docs/<repo>-rebuild-spec/_coverage/
  census.md       # authoritative inventory: every file + every route/endpoint/model/config
  partition.md    # the MECE slices: slice id, owned paths (globs), entry points, deps
  ledger.md       # live status per slice AND a per-item checklist (which census items in the
                  #   slice are documented) — the resume surface; + owner ticket
  audit.md        # final report: coverage diff, duplication findings, verdict
```

`census.md` and `partition.md` are the contract every worker reads. `ledger.md` is the single
source of truth the supervisor updates each tick. `audit.md` is the gate.

## Phase A — Census (do this first, sequentially)

Walk the **entire** repo (respect `.gitignore`; skip `node_modules/`, build output, lockfile
internals, vendored code) and produce the ground-truth inventory:

- **Every source file**, grouped by directory, with a one-line "what it is."
- **Every entry point** — routes/pages, `main()`, CLI commands, exported API surface,
  background jobs, cron, event handlers.
- **Every data model / schema / table / type-of-record.**
- **Every API endpoint** (method + path) and every external integration.
- **Every config key / env var / feature flag.**
- **Every UI screen/route** (hand this list to [[wireframe-from-code]]).

Record counts (files, routes, endpoints, models). These counts are what the audit reconciles
against — coverage is only provable because the census is the denominator.

## Phase B — Partition into MECE slices

Group the census into slices along the repo's **natural module boundaries** (subsystem,
feature, service, layer). Rules that make it MECE:

- **Exhaustive:** assign every census file to exactly one slice. Maintain a `leftovers` slice
  for orphans (top-level config, scripts, docs) so nothing is silently dropped — an unassigned
  file is a coverage hole by construction.
- **Exclusive:** express ownership as **non-overlapping path globs**. If two slices' globs can
  match the same file, tighten them until they can't. A file matched by two slices is a
  guaranteed duplication.
- **Right-sized:** each slice should fit one worker's context (roughly one cohesive subsystem).
  Split a slice that's too big; merge trivially-small ones.
- **Shared concepts are NOT a slice** — cross-cutting content (top-level architecture, the
  glossary, spanning ADRs, the wireframe nav-graph) is owned by a single **synthesis** step
  that runs after all slices, so workers never describe shared things. List those items
  explicitly in `partition.md` under "synthesis-owned (do not document in a slice)."

Each slice entry in `partition.md`: `{ id, title, owned-globs, entry-points, documents (which
spec sections/files it writes), depends-on (other slices it may reference by pointer) }`.

## Phase C — Ledger (track status, drive the DAG, survive restarts)

`ledger.md` is both the DAG state and the **resume surface**. It holds two levels:

- **Per-slice row:** `slice-id · owner-ticket · status · notes`, status `todo → in-progress →
  done → audited`. The orchestration DAG falls straight out of the partition: census/partition
  is the root; every slice depends on it; synthesis depends on all slices; audit depends on
  synthesis. Update it every supervision tick — it is the single source of truth for what's in
  flight, so a slice is never double-assigned.
- **Per-item checklist (under each slice):** one line per census item the slice owns
  (`file / route / endpoint / model`), marked `[ ]` undocumented or `[x]` documented, with the
  spec section it landed in. This is what makes a worker **restartable**.

### Resumable workers (defeats context bloat)

A slice worker is one long session, so it can bloat. The partition right-sizes slices as the
first defense; this ledger makes a restart **lossless** as the second. Every slice worker MUST:

1. **Write incrementally, never batch.** Document one census item, write its spec section to
   disk, tick it `[x]` in the ledger — then move to the next. Never hold the whole slice in
   context to dump at the end; a crash or kill then loses nothing already on disk.
2. **Resume from the ledger on (re)start.** First action: read the slice's checklist and the
   already-written spec sections, then work **only the `[ ]` items**. A fresh worker spawned to
   replace a bloated/stalled one picks up exactly where the last left off — no rework, no gaps.
3. **Sub-slice if still too big.** If a worker finds its slice can't fit even with incremental
   writes, split it in `partition.md` into child slices (each a new ticket) rather than pushing
   through a degraded, bloated context.

**Supervisor trigger:** when a worker shows bloat/stall symptoms — slow progress, repeated
re-reads, degrading output, checklist not advancing across ticks — the supervisor should
**restart it** (kill + respawn a fresh worker on the same ticket), not just nudge. The restart is
safe precisely because of (1)+(2): the replacement resumes from the ledger. This is the one case
where a restart beats a nudge.

## Phase D — Audit (the gate)

Run after synthesis, before declaring done. Produce `audit.md` with three checks:

1. **Coverage diff.** For every item in `census.md` (file, route, endpoint, model, config),
   confirm it is documented in at least one spec section. List every uncovered item. **Any
   uncovered item = a gap → reopen the owning slice.** Report coverage as `documented/total`
   per category; the bar is 100% of routes, endpoints, and models, and ≥95% of source files
   (trivial/generated files may be cited in bulk).
2. **Duplication scan.** Find any concept described in 2+ places (same entity, endpoint, or
   rule). Collapse each to one canonical location + links from the others. Workers writing into
   shared reference files (`data-model.md`, `api-contracts.md`, `glossary.md`) must use their
   slice's namespaced region; the audit reconciles and dedupes these.
3. **Rebuild sufficiency.** Hand the target list to [[spec-rebuild-test]]; record its verdict.

Verdict in `audit.md`: `COVERAGE <documented/total per category> · DUPES <n collapsed> ·
REBUILD <pass/needs-work>`. Only `PASS` on all three closes the run; otherwise name the slices
to reopen.

## Why this composes with the orchestration

Census → partition is the **DAG root** (one sequential worker). The slices are the **parallel
fan-out** (one worker each, file-disjoint so they can't collide). Synthesis is the **join** (one
worker owns all shared content). The audit is the **validation gate** (reopens slices on a gap
or dupe). That single shape delivers exhaustive coverage and zero duplication without workers
ever having to coordinate at runtime.
