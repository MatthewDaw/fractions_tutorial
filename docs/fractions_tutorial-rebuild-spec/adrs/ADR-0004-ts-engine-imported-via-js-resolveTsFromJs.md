# ADR-0004 — TypeScript engine imported via `.js` specifiers, resolved by `resolveTsFromJs` (spanning)

## Status
Accepted (reflects what IS in the codebase).

## Context
The engine (`web/src/engine/**`) is authored in TypeScript (strict mode) for the
type safety the wire-DTO contract demands (ADR-0001), but the rest of the app is
`.js`/`.jsx`. TS-idiomatic ESM requires that relative imports carry explicit `.js`
extensions even when the file on disk is `.ts`. Vite/Rollup (and Vitest) do not, by
default, map a `./x.js` specifier onto a `./x.ts` file on disk — so the explicit,
correct TS import extension would fail to resolve at dev, build, AND test time. We
need ONE place that makes the `.js`-specifier-onto-`.ts`-file convention work
everywhere, rather than littering callers with extensionless imports or build hacks.

## Decision
Keep the TS-idiomatic explicit `.js` import specifiers in `.js`/`.jsx` callers and
add a small custom Vite plugin, **`resolveTsFromJs`** (in `vite.config.js`), that
rewrites a relative `./x.js` import to `./x.ts` when the `.ts` file exists. Because
Vitest runs through Vite's config, the same plugin covers dev server, production
build, and the test suite in one place. The `.js` extensions on engine imports are
the CONTRACT, not a mistake — the plugin is what makes them resolve. Do NOT "fix"
them to extensionless or `.ts`.

## Consequences
- The engine stays strict TS and authored to the ESM/TS convention while every
  consumer (JS runtime, JSX rooms, JS harness) imports it uniformly.
- A single resolver covers all three pipelines; there is no per-tool shim.
- A common pitfall (documented in `gotchas.md` G9): `.jsx`/`.js` tests that import
  the TS engine rely on this plugin — a config that bypasses it will fail those
  imports.
- This is the build-time mechanism underpinning the relocation seam in ADR-0001.
