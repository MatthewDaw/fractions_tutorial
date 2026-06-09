# gotchas — leftovers slice (build/dev config traps)

> Slice `leftovers` contribution to `gotchas.md`. Other gotchas (engine prereq
> ordering, affect firewall, onnxruntime digits-only scope) are owned by their
> slices — referenced by pointer.

## G-L1 — `.js` import specifiers resolve to `.ts` engine sources (`resolveTsFromJs`)
The engine (`web/src/engine/**`) is authored in **TypeScript**, but every `.js`/`.jsx`
caller imports it with explicit **`.js`** specifiers (the TS-idiomatic ESM style,
because TS itself wants the `.js` extension that the emitted file *would* have).
Rollup/Vite/esbuild do NOT map a `.js` specifier onto a `.ts` file on disk, so an
import of `./policy.js` would 404. The custom Vite plugin **`resolveTsFromJs`**
(in `vite.config.js`, `enforce: 'pre'`) intercepts every relative `./x.js` /
`../x.js` specifier, checks if a sibling `./x.ts` exists, and redirects to it.

**Do NOT "fix" the `.js` extensions to `.ts`** — the `.js` specifier IS the contract,
and the plugin is what makes it resolve. It fixes dev, `vite build`, AND vitest in
one place (vitest reuses the same `vite.config.js`). (Cross-ref constitution §2;
spanning ADR is synthesis-owned.)

## G-L2 — the dev middleware endpoints do NOT exist in production
`/__ink`, `/__ink` `DELETE`/`GET`, and `POST /api/tts` are registered only via
`configureServer` (dev server hook) in `vite.config.js`. A `vite build` bundle has
**none** of them. Anything that calls them must degrade gracefully when they 404:
- The tablet ink-capture POST is best-effort (failure ignored).
- `/api/tts` callers fall back to a pre-baked `public/voice/<key>.mp3`, then to
  browser Web Speech, then to silence — **never** a robotic voice (constitution
  §5.9; `voice.js` is `shell-nav`-owned — pointer). In a static deploy, only the
  pre-baked clips exist, so all spoken lines must be baked ahead of time via the
  `scripts/*voice*.mjs` bakers.

## G-L3 — `onnxruntime-web` must be excluded from Vite dep-optimization
`vite.config.js` sets `optimizeDeps.exclude: ["onnxruntime-web"]`. The package ships
its own `.wasm` + `.mjs` loader; if Vite pre-bundles/transforms it, the loader 500s
at runtime. The recognizer (`ink-recognition` slice — pointer) only loads with this
exclude in place.

## G-L4 — `web/.env` is the ONLY secret surface, and it is dev/offline-only
`.env` (gitignored; `!.env.example` is the only committed `.env*`) holds the
ElevenLabs key + voice ids. They are read solely by the dev `/api/tts` middleware
and the offline bake scripts. The shipped SPA reads no env vars and makes no
ElevenLabs calls — so a missing/empty `.env` breaks only voice *generation*, not the
app (it just plays the already-baked clips).

## G-L5 — committed-but-not-shipped artifacts
`web/_fit.png`, `web/_ink_big.png` (stray debug screenshots), `web/ink-log.jsonl`
(5 sample capture records), `web/tools/ink-dump/*.png` (decoded sample cells), and
all of `web/.ui-sweep/**` are checked into the repo but are dev evidence/scratch,
NOT part of any build. A rebuild does not need to reproduce them.
