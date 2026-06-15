# Plan-vs-Reality Compliance Gap Analysis — fractions_tutorial

**Assessor:** Plan Compliance Assessor (read-only)
**Date:** 2026-06-08
**Commit:** `2a8f0e7` (HEAD at task start) · verified against working tree at `717db7b`
**Branch:** `work/rp-260608-2215-spec`
**Scope:** All 9 plan documents in `docs/plans/` (U-IDs are the promises) vs. the live
source tree (`web/src/**`). The reverse-prompt `_coverage/` audit was used as a fast
index; every load-bearing claim was verified against live code and, where possible, by
running the test suite.

---

## Headline

**~95 plan promises checked across 7 active/draft plans. The codebase is far more built
than plan 002's own "what exists" snapshot implies: the headless TS engine, all 10
generators, the affect layer, the synthetic harness + dashboard, retention probes, the
ReturnToKitchen loop, interleaving, and the extra rooms (nl, s1, cmp, subtract) all ship.
The real gaps are concentrated:**

- **1 whole room missing** (m2 Baking Trays / `MULT_ARRAYS`, plan 006) — the largest gap.
- **1 dormant-pedagogy promise still dead** (`disengagedCount` never incremented, 002 U9
  R11) — capability built around it but the trigger is structurally unreachable.
- **1 learner-facing feature not built** (targeted reteach, 002 U5).
- **2 required fast-follows undone** (006 O1 mult error-signatures; 006 mult kitchen layer).
- **Several "built-but-default-off" flags** (002 U1 fluencyHardMode, U7 delayed-probe, U9
  frustrationScaffold) — sanctioned by 002 but the leniency-trap risk is now live.
- **Plan 001 (Python engine + FastAPI server) was abandoned wholesale** — explicitly
  superseded by 002's client-side pivot; recorded as DIVERGENT-by-design, not a gap.

**Tests:** 899/905 pass. The 6 failures are test-isolation flakiness (timeouts + duplicate
DOM matches under parallel load); both failing files pass green in isolation. No product
defect behind them.

---

## Compliance summary table

Status legend: BUILT · PARTIAL · MISSING · DIVERGENT · BROKEN. Priority: P1 (core/blocking)
→ P3 (nice-to-have).

| Plan | Unit | Promise (one line) | Status | Pri | Improvement file |
|---|---|---|---|---|---|
| 001 shell | U1–U8 | Pure **Python** engine + FastAPI/WebSocket server + server log | **DIVERGENT** (abandoned; superseded by 002 client-side TS) | — | (no action — by design) |
| 002 flow | U1–U8 | Headless TS engine (log/BKT/dimensions/gate/decay/credit/wall/policy) | **BUILT** | — | — |
| 002 flow | U1 | fluencyHardMode + problem_id/surface_form distinctness seam | **PARTIAL** (seam built; ships default-lenient; proxies remain as fallback) | P2 | `2026-06-08-activate-fluency-hardmode.md` |
| 002 flow | U2 | Certify lesson at the generated practice stage | **BUILT** | — | — |
| 002 flow | U3 | ReturnToKitchen wall→room→return loop | **BUILT** | — | — |
| 002 flow | U4 | Unify error-signature taxonomy (grade.js → engine union) | **BUILT** | — | — |
| 002 flow | U5 | **Targeted reteach** on a diagnosed misconception | **MISSING** | P2 | `2026-06-08-targeted-reteach-u5.md` |
| 002 flow | U6/U7 | Schedule/emit retention probes; delayed-probe demotion | **BUILT** (probe required for cert ships default-off) | P3 | `2026-06-08-delayed-probe-default.md` |
| 002 flow | U8 | Interleaved mixed-review practice | **BUILT** (MixedReview + Shell `#/review`) | — | — |
| 002 flow | U9 | Reliable frustration trigger (`disengagedCount` increments) + scaffold | **PARTIAL** (scaffold response built; **counter never written** → trigger dead) | P1 | `2026-06-08-wire-disengaged-count.md` |
| 002 flow | U10 | Themed-load isomorphism rubric + decorative suppression | **PARTIAL** (rubric doc exists; suppression wiring unverified) | P3 | `2026-06-08-themed-load-suppression.md` |
| 002 flow | U12 | Rationale banner, mastery inspector, Tier-2 nudges, playability net | **BUILT** | — | — |
| 004 split | all | Split R2 → unit (r2) + non-unit (r3); shared LessonUnlikeDen | **BUILT** | — | — |
| 005 observe | P0–P2 | Behavioral telemetry, baseline, composite, ledger, governor | **BUILT** (`engine/observe/*`, `runtime/affect/*`) | — | — |
| 005 observe | P3 | Self-report companion (AffectProbe) | **BUILT** | — | — |
| 005 observe | P4 | Presence/validity MediaPipe camera gate | **MISSING** (explicitly gated on Phase-2 ledger; deferred) | P3 | `2026-06-08-presence-camera-gate.md` |
| 006 mult | m1 | Equal Groups (`MULT_EQUAL_GROUPS`, AppM1) | **BUILT** | — | — |
| 006 mult | m2 | **Baking Trays / Arrays** (`MULT_ARRAYS`, AppM2, BakingTray) | **MISSING** (no component/node/generator/intro/CSS) | P1 | `2026-06-08-build-m2-arrays-room.md` |
| 006 mult | m3 | Times Facts (`MULT_FACTS`, AppM3) | **BUILT** | — | — |
| 006 mult | DAG | `MULT_EQUAL_GROUPS → MULT_ARRAYS → MULT_FACTS` chain | **DIVERGENT** (chain skips MULT_ARRAYS: FACTS.prereqs=[EQUAL_GROUPS]) | P1 | (folded into m2 file) |
| 006 mult | O1 | ErrorSignature union extension for mult misconceptions | **MISSING** (required fast-follow; all map to `other`) | P2 | `2026-06-08-mult-error-signatures.md` |
| 006 mult | O6 | Kitchen transfer layer for m1/m2/m3 (momsProblems) | **MISSING** (no `multiply` op in gradeAnswer) | P3 | `2026-06-08-mult-kitchen-layer.md` |
| 001/002/006 harness | U13 | Apply ≥1 held-out-proven improvement | **PARTIAL** (backlog + tapes shipped; no applied/certified fix landed) | P2 | `2026-06-08-harness-apply-certified-fix.md` |
| — | (test infra) | Suite green under parallel load | **BROKEN** (6 flaky failures; pass in isolation) | P3 | `2026-06-08-flaky-test-isolation.md` |

---

## Implementation gaps (static)

### MISSING — P1

**G1 · m2 Baking Trays / `MULT_ARRAYS` room (plan 006).**
Plan 006 specifies a **three-room** multiplication strand m1→m2→m3, with m2 (arrays / area
model) as the pedagogical bridge that makes commutativity and distributivity visible. Only
m1 and m3 exist.
- Spec: plan 006 "Level 2 — m2 Baking Trays" (full SkillNode, rooms.js entry, 7-stage
  scaffold arc, BakingTray manipulative, intro). Census expected `AppM2.jsx`,
  `components/BakingTray.jsx`, `styles/m2.css`, `public/intros/m2-baking-trays.html`,
  `introM2.js`.
- Reality (verified absent): `web/src/AppM2.jsx` ✗, `web/src/components/BakingTray.jsx` ✗,
  `web/src/styles/m2.css` ✗, `web/public/intros/m2-baking-trays.html` ✗, `web/src/introM2.js` ✗.
  No `m2` entry in `web/src/rooms.js`, no `MULT_ARRAYS` node in `web/src/engine/graph.ts`,
  no `m2`/`AppM2` branch in `web/src/Shell.jsx`, no `multArrays` generator.

**G2 · MULT DAG skips `MULT_ARRAYS` (plan 006, R-B1/R-B2 canonical chain).**
`web/src/engine/graph.ts:54-57` defines `MULT_FACTS.prereqs = ['MULT_EQUAL_GROUPS']`,
collapsing the planned three-node chain to two. The in-code comment (`graph.ts:23`) even
asserts "canonical ids are EXACTLY: MULT_EQUAL_GROUPS, MULT_FACTS" — a direct contradiction
of plan 006's "canonical ids are `MULT_EQUAL_GROUPS`, `MULT_ARRAYS`, `MULT_FACTS`;
`MULT_FACTS.prereqs = ['MULT_ARRAYS']`." Tightly coupled to G1; fixing m2 must restore the
edge.

### MISSING — P2

**G3 · Targeted reteach on a diagnosed misconception (002 U5, R7).**
The plan promises replacing the binary re-ask with a misconception-specific reteach beat
(at minimum for `add_denominators`), surfaced via `TutorRibbon`/`HintRail`, data-driven copy.
- Reality: no reteach surface, no copy table, and **no `web/tests/runtime/test_reteach.test.jsx`**
  (the plan's named test file). `web/src/runtime/useLessonScaffold.js` carries `errorSignature`
  through to the engine credit path (`:286,:303`) but never branches it to a learner-facing
  corrective. The credit→prereq half (U4) is live; the learner-facing half (U5) is not.

**G4 · Mult ErrorSignature fingerprinting (006 O1, "required fast-follow").**
Plan 006 R-B5/O1: `add_factors`, `skip_count_drift`, `array_perimeter`,
`distributive_add_parts` must extend the `ErrorSignature` union with matching fingerprinting,
declared "required near-term fast-follow, not optional."
- Reality: zero hits for any of those signatures in `engine/` or `generators/`. The union in
  `engine/types.ts:47` is unchanged (fraction-only + `other`/`null`). All mult misconceptions
  collapse to `other` → no error-specific routing for the entire multiplication strand.

**G5 · Harness applied-and-certified improvement (harness U13, R8).**
The harness ships its full apparatus (personas, oracle, tape, search, recursive loop,
dashboard, and the committed `docs/harness/improvement-backlog.md` + `tapes/baseline-seed1.jsonl`).
But U13's keystone deliverable — **apply one real fix and prove it on held-out personas with a
before/after** — has no landed evidence: `docs/harness/decision-log.md` carries no certified
REAL verdict tied to an `engine_sha`/`params_hash` flip, and no flags-on (activated) sweep
artifact sits beside the flags-off baseline. The "improve the app" mandate is staged but not
discharged.

### MISSING — P3

**G6 · Presence/validity camera gate (005 Phase 4).** No MediaPipe / `runtime/affect/presence.ts`.
Explicitly gated on the Phase-2 ledger clearing an ablation bar — a sanctioned deferral, logged
for completeness.

**G7 · Mult kitchen transfer layer (006 O6).** `web/src/momsProblems.js` has no `m1/m2/m3` BANK
entries and `gradeAnswer` has no `multiply` op. Plan marks this a non-blocking follow-up.

### PARTIAL / DIVERGENT

**G8 · `disengagedCount` writer (002 U9, R11) — see Behavioral gaps (the highest-value finding).**

**G9 · Plan 001 Python engine + FastAPI server — DIVERGENT by design.**
Plan 001 (U1–U8) specifies a pure Python `engine/` package, FastAPI/WebSocket `server/`,
Pydantic→TS codegen, and a server-side event log. **None exists** (`engine/`, `server/`, any
`*.py` app code absent at repo root; only `web/tools/train_mnist.py` exists). Plan 002's
front-matter explicitly supersedes 001's architecture ("None of that was built … the live app
is a pure client-side Vite + React app"). This is a deliberate, documented pivot — recorded as
DIVERGENT-by-design, **not** an open gap, and not actioned.

**G10 · Leniency-trap flags default-off (002 U1/U7/U9).** `fluencyHardMode:false`,
`frustrationScaffold:false` (`params.ts:93,95`), and delayed-probe-required-for-cert defaulted
lenient. 002 sanctions shipping lenient, but its own "leniency-vs-value trap" risk warns each
needs a scheduled flip commitment or the activation is inert. No flip schedule is in the tree.
P2/P3 nudges, not blockers.

---

## Behavioral gaps (dynamic)

### BROKEN-AT-RUNTIME — P1

**B1 · The disengagement trigger is structurally unreachable (`disengagedCount` never written).**
- Spec: 002 U9 R11 — "a frustration trigger fires reliably (disengagement / consecutive-error
  counters **actually increment**)." Also underpins `EscalateToHuman{reason:"disengaged"}`
  (state-model §5.5) and the Tier-2 disengaged path.
- Observed: `disengagedCount` is initialized to `0` (`useLessonEngine.js:60`) and **read** at
  `useLessonEngine.js:363` (`isDisengaged: policyStateRef.current.disengagedCount >= 3`) and in
  `policy.ts:359` (`>= nDiseng`), but **no code path anywhere increments or assigns it**
  (grep across `web/src/**` returns only the init, the two reads, and harness commentary).
  Therefore `isDisengaged` is permanently `false`, the disengaged escalation branch never fires,
  and — because the U9 frustration scaffold can be armed via the disengagement signal — the warm
  foothold can never be triggered by disengagement either (only by `consecutiveErrors`, which is
  a separate path).
- Corroboration (independent): the project's own synthetic harness behaviorally rediscovered
  this. `web/src/harness/oracle/expectedFindings.js:189-209` flags "disengaged trigger is
  UNREACHABLE: disengagedCount never increments and recentBehavior is empty," and
  `docs/harness/improvement-backlog.md:14-19` lists `dead-pedagogy:disengaged-never-escalates`
  at severity 100 with lever "wire disengagedCount."
- The *response* (warm scaffold rationale, `policy.ts:256-263`) and the *consumer* (escalation
  legality) are built — only the **input edge** is missing, so the whole feature is inert.

### BROKEN-AT-RUNTIME — P3

**B2 · Test suite flaky under parallel load (6/905 failures).**
- Observed: a full `vitest run` reports 6 failures in `tests/e2e/playability_smoke.test.jsx`
  ("Test timed out in 5000ms") and `tests/runtime/test_momsroom_flow.test.jsx`
  (`getByText(/read aloud/i)` → "Multiple elements found"). Running **either file in isolation
  is fully green** (23/23). Cause is test-isolation/timeout under concurrent workers (shared
  jsdom DOM bleed + an ONNX `mnist-12.onnx` URL-parse stderr during load), not a product defect.
- Plan impact: 002 KTD13/R19 lean on the playability net as the regression guard; a net that
  flakes under its own default runner undermines that guarantee. Quarantine-or-stabilize.

---

## Verification log (reproducible)

| Check | Command / file | Result |
|---|---|---|
| Plans read in full | `docs/plans/*.md` (9 files) | All read; U-IDs extracted |
| Census/ledger cross-index | `docs/fractions_tutorial-rebuild-spec/_coverage/{census,ledger}.md` | Read; trusted as index, verified against code |
| m2 absence | `ls AppM2.jsx BakingTray.jsx m2.css introM2.js`; grep `m2\|MULT_ARRAYS` in rooms.js/Shell/graph | All absent — G1/G2 confirmed |
| disengagedCount writer | grep `disengagedCount` across `web/src/**` | Only init + 2 reads; no writer — B1 confirmed |
| problem_id/surface_form emission | grep in `runtime/` | Emitted (`useLessonEngine.js:271-296`) — U1 seam live |
| Retention probe wiring | grep `retention_probe\|applyProbeResult` | Folded through `measurementReduce.ts:294-305`; `kitchenProgress.recordRetentionProbe` + `Shell.jsx:160` — U6/U7 BUILT |
| ReturnToKitchen loop | grep `stumpingRecipe` in Shell/scaffold/MomsRoom/AppR4 | Threaded end-to-end — U3 BUILT |
| Reteach surface | grep `reteach`; `ls test_reteach.test.jsx` | Absent — G3 confirmed |
| Interleaving | grep `MixedReview` in Shell | `#/review` → `<MixedReview>` — U8 BUILT |
| Frustration response | grep `frustrationScaffold` in policy.ts | Response at `:256-263`; flag default-off — partial |
| Taxonomy unification | grep signatures in `generators/grade.js` | Emits engine union — U4 BUILT |
| Mult fingerprinting | grep `add_factors\|skip_count_drift` | Absent — G4 confirmed |
| Python engine/server | `ls engine/ server/`; find `*.py` | Absent (only train_mnist.py) — G9 DIVERGENT-by-design |
| Flag defaults | `engine/params.ts:93,95` | fluencyHardMode/frustrationScaffold = false — G10 |
| Test suite | `npx vitest run` | 899/905 pass; 6 flaky (B2) |
| Failing files in isolation | `npx vitest run <2 files>` | 23/23 green — B2 = isolation flake |

---

## What IS compliant (so the gaps are trusted)

- **The whole headless TS engine (002 U1–U8)**: log/fold, BKT, four dimensions, deterministic
  gate, credit assignment, wall detection, policy + legal moves + rationale + escalation
  *structure* — all present, pure, and test-locked (`tests/engine/**`, 17 files green).
- **Retention (002 U6/U7)**: `decay.ts` is wired through the reducer with result-aware demotion
  and a needs-review presentation path — the plan's central "built but uncalled" complaint is
  resolved.
- **Goal loop (002 U3)** and **interleaving (002 U8)** ship end-to-end.
- **R2/R3 split (plan 004)**: shared `LessonUnlikeDen` + `lessons/{r2-unit,r3-nonunit}.js`,
  renumbered rooms — fully delivered.
- **Observation layer (plan 005 P0–P3)**: behavioral detectors, per-child baseline, composite
  corroboration, precision ledger, nudge governor, self-report probe — all present with the
  advisory firewall.
- **Synthetic harness (harness U1–U12)**: personas, inverse-errors, oracle, metrics, findings,
  search, recursive loop, quarantine, report, and the in-app dashboard — a large, complete build.
- **Beyond-plan rooms**: nl (number line), s1 (subtraction), cmp (compare) exist with generators,
  intros, and CCSS mapping — the curriculum is wider than any single plan demanded.

---

## Dependency ordering (feeds the build phase)

```
P1 work (do first, unblocks the rest):
  G1 (build AppM2 + BakingTray + m2 CSS/intro/generator)
    └─ requires G2 (restore MULT_ARRAYS node + rewire FACTS.prereqs=['MULT_ARRAYS'])
       └─ then renumber fraction rooms no:4..8 (plan 006 R-B4) — rooms.js only
  B1 (wire disengagedCount writer)  — independent; unblocks the U9 disengaged path
                                       AND EscalateToHuman-disengaged AND a Tier-2 nudge gap

P2 work (after P1):
  G4 (mult ErrorSignature union ext)  — depends on G1 existing so mult attempts emit
  G3 (targeted reteach U5)            — depends on U4 (done) + benefits from G4's richer signatures
  G5 (harness apply+certify a fix)    — best target is B1 (wire disengagedCount): high-leverage,
                                         audit-corroborated, gives a clean flags-off→on before/after
  G10a (flip/calibrate fluencyHardMode) — independent; needs age-band data or a tablet pilot

P3 work (last / optional):
  G6 (presence camera)  G7 (mult kitchen layer)  G10b (delayed-probe default)
  G5b (themed-load suppression verify)  B2 (stabilize flaky tests)
```

---

## Open questions / hand-offs

1. **m2 scope sign-off** — plan 006 R-B4 renumbers the five fraction rooms to `no:4..8` when
   the mult trio lands. m1/m3 are in, but the fraction rooms' `no` values and the m2 `pos`
   should be re-confirmed against the current `rooms.js` before building m2 (avoid a half-applied
   renumber). Ask the user.
2. **`consecutiveErrors` semantics** — 002 U9 / `HANDOFF-engine-surfaces.md` flag a *suspected*
   over-count that an in-code "verified" comment contradicts. This is a human ruling, not an
   assessor call; B1's writer work must not touch `consecutiveErrors` until ruled.
3. **Undocumented-behavior noted in passing (hand to the docs-sync agent, not this assessor):**
   the live app ships **four rooms with no dedicated plan** — `nl` (FRACTION_ON_LINE), `s1`
   (SUB_SAME_DEN), `cmp` (COMPARE_BENCHMARK), and the `AppSubtract` surface — plus CCSS standards
   mapping (`ccssStandards.js`, `ConceptMap.jsx`) that no plan in scope describes. These are code
   that does *more* than the docs; they belong to the docs-from-code reconciler.
4. **Whether G10 default-off flags count as "delivered."** 002 sanctions lenient defaults, so
   the *capability* is compliant; but its own leniency-trap risk says an un-scheduled lenient
   default re-creates "built but uncalled." Treat as a product decision: ship lenient + schedule a
   flip, or mark the units instrumentation-only.
