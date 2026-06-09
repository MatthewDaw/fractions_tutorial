# Gotchas

The non-obvious, load-bearing constraints and traps a re-implementer WILL break
unless warned. Grouped by subsystem. The cross-cutting "why" behind several of these
is captured as spanning ADRs (`adrs/`): engine purity & wire-DTO contract, advisory
affect firewall, the prereq-prepend credit constraint, and the TS-via-`.js`
resolveTsFromJs rule.

> **Cross-slice findings the audit flagged** (folded in below where they belong):
> `MasteryInspector` re-implements `gate.ts::isMastered` inline (E-7 / ADR
> 0001-engine-purity); `grade.js` never emits `scaled_bottom_only` (G-GOTCHA-2);
> generator tier pools include 7/9 vs the CCSS contract (G-GOTCHA-3); `train_mnist.py`
> trains an MLP that is NOT the shipped ONNX model (G-INK-3).

---

## Engine (engine-core)

### E-1. Prereq ordering is load-bearing (`credit.ts:97` ⇄ `graph.ts`)
`credit.ts::resolveImplicatedPrereq` handles `add_across_unlike` by docking
**`bindingNode.prereqs[prereqs.length − 1]`** — the LAST prereq. Therefore `MULT_FACTS`
is **PREPENDED** (never appended) to `ADD_UNLIKE_COPRIME.prereqs =
['MULT_FACTS','ADD_UNLIKE_NESTED']` and `SIMPLIFY.prereqs =
['MULT_FACTS','ADD_UNLIKE_COPRIME']`, so the original FRACTION prereq stays LAST and a
straight-across fraction error keeps docking the fraction prereq, not multiplication
fluency. Re-ordering these arrays silently mis-routes credit. `credit.ts` needs no edit
because of the prepend — that's the whole point. (See `adrs/0005-prereq-prepend-credit-constraint.md`.)

### E-2. The affect firewall is structural — do not add a back door
`Observation.affect_window` is a `readonly never[]` typed stub, **always `[]`**;
`segment()` collects the span's `Signal`s into `_signals` and discards them.
`mastery.ts`/`gate.ts` MUST NOT read `affect_window`, `last_retention_probe`, or any
Signal-derived field. `observe/**` emits `Signal`/`ObservedSignal` ONLY. `test_gate_u1`
asserts a populated `affect_window` does not change `isMastered`. (Constitution §5.2;
`adrs/0002-advisory-affect-firewall.md`.)

### E-3. Engine purity — no React, no wall-clock
Time enters ONLY as `event.t` or an injected `now`. The localStorage adapter
(`loadLog`/`saveLog`/`migrate...`) is the sole I/O and is kept OUT of the fold. Do not
call `Date.now()`, import React, or read ambient config inside `engine/**`.

### E-4. `getNode` throws on unknown ids — typos crash at init
`getNode(id)` throws `Unknown skill node id: "<id>"`; `prereqsOf` maps every prereq
through it. Any id mismatch crashes the DAG at construction, not silently.

### E-5. `ALL_NODES` topological order is load-bearing
`mostUpstreamUnmastered`, escalation's `findMostUpstreamNodeForEscalation`, and
`suggestedNextRoom` (shell-nav) all walk `ALL_NODES` front-to-back. The multiplication
foundations sit at indices 0–1 (strictly upstream). Re-ordering changes routing.

### E-6. Discounted credit blends, it does not re-run BKT
A credit `weight < 1.0` blends `P_known += weight·(fullPosterior − P_known)` and
re-clamps; it does not apply a separate BKT math. Only the BINDING node accumulates the
`Observation` (dimensions are per-binding); prereq docks move P_known only.

### E-7. `MasteryInspector` re-implements the gate inline (known duplication)
`ui/MasteryInspector.jsx` MUST NOT import the engine, so it carries its OWN copy of the
`isMastered`/`gateConditions`/`statusLabel` logic. This is a deliberate purity choice
but a real **duplication hazard**: a change to `gate.ts` Chain-A conjuncts must be
mirrored by hand in the inspector or the observer panel will silently disagree with the
real gate. (See `adrs/0001-engine-purity-wire-dto.md`.)

### E-8. `error_signature` trust seam + coercion
`segment()` trusts an `error_signature` already on the `judged` payload and coerces any
non-union value to `'other'`. It re-derives via `classifyErrorSignature` only when
nothing usable was emitted. Emitting a lesson-specific string (e.g. `'flipped'`) is safe
(→ `'other'`); a misspelled CANONICAL signature loses credit routing.

### E-9. Retention probe back-compat: missing `correct` = pass
`applyRetentionProbes` treats a `retention_probe` event with no explicit `correct` as a
PASS, so older timestamp-only probes never demote. Only an explicit `correct: false`
demotes. `mastered_at` is set once and PERSISTS across a later demoting probe (a lapsed
node still reads "was mastered" / needs-review).

### E-10. `fluencyHardMode` default threading
`isMastered`/`fluencyOk` default `fluencyHardMode` to the LIVE `PARAMS` value so
policy/wall callers pick up the flag without threading it. Tests flip it by mutating
`PARAMS` and reset in `afterEach`. Do not hard-code `false`.

---

## Generators

### G-GOTCHA-1 — Seed key is (skill, index), NOT (skill, level, index)
`rngFor(skill, index)` intentionally omits `level` from the seed: changing scaffold level
does NOT reshuffle the stream — only the difficulty *pools* change while the same `index`
keeps the same draw sequence. Folding `level` into the seed breaks the replay model.

### G-GOTCHA-2 — grade.js never emits `scaled_bottom_only`
`scaled_bottom_only` is in the engine `ErrorSignature` union and the U4 test's `UNION`
set, but `gradeAnswer` does NOT produce it. That signature is detected only by the
*lesson-level* graders (`AppR4.jsx:378`, `LessonUnlikeDen.jsx:82`) and by
`engine/observation.ts`. Do not "fix" `grade.js` to emit it — the generic shared grader
cannot reconstruct the expected scaled numerator without the lesson's renaming context.
The union-membership test passes because the value is simply never the *output* here.

### G-GOTCHA-3 — Generator number pools are NOT run through the CCSS filter
Constitution §5.6 forbids denominators 7 and 9, enforced by `ccss.js::isInGrade` /
`filterBankInGrade` on the *lesson banks*. The generator tier pools are hand-curated and
several DO include 7 or 9: `addSameDen` tier-1 `[6,7,8,9]` / tier-2 `[8,9,10,12]`;
`subSameDen` tier-1 `[6,7,8]` / tier-2 `[8,9,10,12]`; `addUnlikeCoprime` tier-1 coprime
pair `[2,7]`; `improperToMixed` tier-2 dens `[5,6,7,8]`. These are never passed through
`filterBankInGrade`, so generated practice CAN present a /7 or /9 at higher tiers. A
latent contract tension: either §5.6 is scoped to lesson banks only (generated practice
exempt by design) or the pools should be tightened. Document it; do not silently change
behavior.

### G-GOTCHA-4 — Unreduced answers are the CORRECT answers for the add skills
`addUnlikeNested`/`addUnlikeCoprime` return the sum **unreduced** over the
larger/cross-multiplied denominator. The default grader judges by EQUAL VALUE, so a
reduced or unreduced equal-value form both grade correct — reduction is a *separate*
skill (`SIMPLIFY`). Do not make these generators reduce their answer.

### G-GOTCHA-5 — SIMPLIFY validity guard order in grade.js
In the `SIMPLIFY` branch the invalid-input guard is `!(d > 0) || !(n >= 0)` → returns
`errorSignature: null` (not `'other'`). Only after passing the guard does a non-equal
answer become `'other'` and an equal-but-unreduced answer become `'not_simplified'`.
Preserve that ordering so garbage input is not mislabeled as a misconception.

### G-GOTCHA-6 — `.js` import specifiers are the contract
All generator imports use explicit `.js` specifiers. This slice is plain `.js` so it is
unaffected by `resolveTsFromJs`, BUT the same discipline applies — do NOT drop or rewrite
the extensions (constitution §2). See G-L1.

---

## Runtime + affect (runtime-affect)

### G1 — `nextDecision` is called EXACTLY ONCE, ONLY at the boundary (R16)
The single most load-bearing rule. `nextDecision` (and the whole engine consult) runs
ONLY inside `useLessonEngine.judgeAndAdvance`, never on mount, re-render, state change,
or timer. Tests assert: not called on mount, not by `emit` alone, called exactly N times
after N submits. Do NOT move the consult into a `useEffect`. (`adrs/ADR-RT-001`.)

### G2 — Tier-2 nudges NEVER mutate game state and are NOT Decisions
A Tier-2 nudge has a `type`, never a `kind`. `TRANSFER_PROBE_QUEUED` only sets a FLAG;
the actual probe waits for the next boundary. Firing a probe mid-attempt would
restructure the workspace and violate the boundary rule.

### G3 — `consecutiveErrors` is NOT reset on a scaffold change
A `problem_present` syncs `policyState.currentScaffold` to the lesson's actual stage but
DELIBERATELY does not reset `consecutiveErrors` — the stages ARE the scaffold ladder, and
cross-stage signals (a clean streak that fades, an error run that raises) must SPAN
stages. The counters reset only in `_updatePolicyState`.

### G4 — too-fast guard must run AFTER `_updatePolicyState`
`_updatePolicyState` clears `pendingTransferProbe` on any correct; the too-fast guard
(`checkTooFastCorrect`) runs AFTER it so a suspiciously-fast correct queues a probe
instead of being faded through. Reversing the order silently drops the probe. The single
`PARAMS.latencyFloorMs` constant is shared by too-fast / transfer in-band / clean-correct
in-band (U1) — no `[800,1200)` dead zone.

### G5 — `PresentProblem` holds the level (no collapse to L0)
In `practiceFlow.nextPractice`, a routine `PresentProblem` keeps the current `level` and
only advances `index`. It must NOT pull the level back to entry L0, or difficulty
collapses between reps. Level moves ONLY on Fade (+1) / Raise (−1).

### G6 — generated stage spans levels 0..4 in place; certified terminator FIRST
A generated stage is otherwise ENDLESS for a direct-entry lesson (Return/Route illegal
with no stumping recipe). The U2 `isCertified()` check is evaluated FIRST — at full
mastery the engine may still return `FadeScaffold`, and certification must win over the
re-roll, ending the stage with `onEnd({kind:'LessonComplete', certified:true})`.

### G7 — `LessonUnlikeDen` is a PARTIAL adopter of useLessonScaffold
It uses the safe primitives but keeps its OWN beat navigation and must be constructed with
`emitMountPresent:false` so the controller does not double-fire `problem_present`.
Forgetting this double-counts attempts and corrupts latency timing.

### G8 — the advisory-affect FIREWALL is STRUCTURAL (constitution §5.2)
`runtime/affect/**` reads behavioral `Signal`s and emits an advisory tier + `AffectState`.
It NEVER produces or mutates a `MasteryEstimate`, valence stays `'neutral'`, and it has NO
import of and NO path into `gate.ts`. The ONLY affect data in the log is the
`affect_window: []` stub. Do not "wire affect into the gate". `composeAffect`'s output
fills only `recentBehavior.isDisengaged`. (`adrs/ADR-RT-002`.)

### G9 — `.jsx` hook tests rely on the vite `.js→.ts` resolution
The runtime hooks import the engine via explicit `.js` specifiers that resolve to `.ts`
through `resolveTsFromJs`. Several `.jsx` runtime tests therefore MOCK the engine modules.
Do NOT "fix" the `.js` import extensions. (See G-L1.)

### G10 — `engineStore` is a module singleton; reset between tests/sessions
`engineStore` holds module-level mutable `state`. Tests must call `resetEngineStore()` in
`beforeEach` or stale decisions/uiChurn leak. `getSnapshot` returns a stable identity
until a publish — required by `useSyncExternalStore` to avoid render loops.

---

## Ink-recognition

### G-INK-1 — onnxruntime-web MUST be excluded from Vite optimizeDeps
`optimizeDeps: { exclude: ["onnxruntime-web"] }`. ort ships its own `.wasm`/`.mjs` loader
and resolves siblings relative to the served package; if Vite pre-bundles it, ort's
`/ort/*.mjs` requests 500. Do NOT remove the exclude, set `wasmPaths`, or hand-place
files under `public/ort` (the code comment mentions a `public/ort` staging dir, but none
is shipped and adding one reintroduces the bug).

### G-INK-2 — Import the `/wasm` subpath, not the default ort build
`import * as ort from "onnxruntime-web/wasm"` is deliberate (the default jsep/WebGPU build
fetches a ~26 MB `*.jsep.wasm`). Threads are disabled (`numThreads = 1`) because the page
is not cross-origin-isolated — re-enabling threads without COOP/COEP headers breaks it.

### G-INK-3 — `train_mnist.py` does NOT produce the runtime model
The current runtime recognizer loads the pretrained ONNX-zoo `mnist-12.onnx` via
onnxruntime-web. `train_mnist.py` instead trains a 784→128→10 MLP and writes
`public/mnist.json` (which is NOT present in the repo and NOT loaded). Re-running it does
NOT regenerate `mnist-12.onnx`. Two different lineages (an earlier pure-JS MLP era vs the
current ONNX era). Treat the Python tool as historical/ad-hoc, not the model's build step.

### G-INK-4 — Model I/O tensor names are graph-specific (CNTK mnist-12)
Input `Input3`, output `Plus214_Output_0` are baked into the mnist-12 graph. Swapping a
different ONNX digit model with different I/O names breaks inference silently. The graph
expects **raw 0..255** pixels (×`INPUT_SCALE=255`); feeding `[0,1]` directly tanks
accuracy.

### G-INK-5 — Preprocessing is the accuracy, not the model
The dominant accuracy lever is `rasterize` matching MNIST conventions (20px box,
center-of-mass centering, `R=1.7` thick anti-aliased strokes). Keep the centroid-shift
and the 20px-inner-box scaling.

### G-INK-6 — Segmentation must keep whole strokes & split touching digits
Two opposite failure modes both handled: a "4"/"7" crossbar reaching under the next digit
(cut on **whitespace bands in the horizontal projection**, bin **whole strokes** by
center-x); and touching digits with no gap (`forceSplitWide` estimates count from width
≈`0.65·H` per numeral). The `0.65·H` constant keeps a lone wide "4"/"0" (≲0.95·H) as one
digit while splitting a ≥1.1·H blob — changing it regresses the tests.

### G-INK-7 — `$P` fallback is transient-only
The geometric matcher covers only the first-visit window while the WASM runtime + model
download; it is less accurate than the CNN. Once `SESSION` is set, `cnnDigit` wins.

### G-INK-8 — `recognizeDigit`/`recognizeNumber` are async and model-state dependent
Results can differ between the first call (fallback) and later calls (CNN). Tests needing
determinism mock the ONNX runtime to force one path (`test_recognizer_segment.test.jsx`
mocks `InferenceSession.create` → `null`).

### G-INK-9 — `dump-ink.mjs` / `ink-log.jsonl` are dev-only
`ink-log.jsonl` only exists when `/__ink` has captured samples during `npm run dev`; it
does not exist in a production build, and `dump-ink.mjs` prints a hint when the log is
empty.

---

## Build / dev / toolchain (leftovers)

### G-L1 — `.js` import specifiers resolve to `.ts` engine sources (`resolveTsFromJs`)
The engine is TypeScript, but every `.js`/`.jsx` caller imports it with explicit `.js`
specifiers (TS-idiomatic ESM). Rollup/Vite/esbuild do NOT map a `.js` specifier onto a
`.ts` file, so `./policy.js` would 404. The custom Vite plugin `resolveTsFromJs`
(`enforce: 'pre'`) intercepts every relative `./x.js` and redirects to a sibling `./x.ts`.
**Do NOT "fix" the `.js` extensions to `.ts`** — the `.js` specifier IS the contract; the
plugin makes it resolve, for dev, `vite build`, AND vitest in one place. (Constitution §2;
`adrs/0004-ts-engine-imported-via-js-resolveTsFromJs.md`.)

### G-L2 — the dev middleware endpoints do NOT exist in production
`/__ink` (POST/DELETE/GET) and `POST /api/tts` are registered only via `configureServer`.
A `vite build` bundle has none. Callers degrade gracefully: ink-capture POST is
best-effort; `/api/tts` callers fall back to a pre-baked `public/voice/<key>.mp3`, then
to silence — **never** a robotic voice (§5.9). In a static deploy only pre-baked clips
exist, so all spoken lines must be baked ahead via the `scripts/*voice*.mjs` bakers.

### G-L3 — `onnxruntime-web` must be excluded from Vite dep-optimization
`optimizeDeps.exclude: ["onnxruntime-web"]`. The package ships its own `.wasm` + `.mjs`
loader; if Vite pre-bundles it, the loader 500s. (Same root as G-INK-1.)

### G-L4 — `web/.env` is the ONLY secret surface, and it is dev/offline-only
`.env` (gitignored; `!.env.example` committed) holds the ElevenLabs key + voice ids, read
solely by the dev `/api/tts` middleware and the offline bake scripts. The shipped SPA
reads no env vars — a missing `.env` breaks only voice *generation*, not the app.

### G-L5 — committed-but-not-shipped artifacts
`web/_fit.png`, `web/_ink_big.png` (debug screenshots), `web/ink-log.jsonl` (5 sample
records), `web/tools/ink-dump/*.png`, and all of `web/.ui-sweep/**` are checked in but are
dev evidence/scratch, NOT part of any build. A rebuild does not need to reproduce them.
