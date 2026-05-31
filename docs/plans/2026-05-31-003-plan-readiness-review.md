# Plan Readiness Review — Fraction App (2026-05-31)

Multi-lens review + expansion pass over the fraction-adding tutoring-game project plan (`docs/plans/2026-05-31-001` Phase 1 + `docs/plans/2026-05-31-002` Phase 2) and the design corpus (`docs/design/*`, `docs/room_break_down/*`, `docs/inspiration/app_philosophy.md`). Seven lenses reviewed; twelve build-ready spec sections were authored to close the gaps and are collected verbatim in `docs/design/2026-05-31-spec-clarifications.md`.

## Verdict

**READY-WITH-FIXES.** The architecture is genuinely sound and the lenses agree on it: a pure `action→reducer→state→event-log` engine, server-authoritative over WebSocket, verifier-first, a clean Policy/Skin/three-layer seam, and an honest Phase-1/Phase-2 boundary. No lens found a structural flaw that requires re-architecting. But Phase 1 is **not buildable end-to-end without invention** today: the load-bearing data contracts (Action/Event/GameState/Decision schemas, RoomSpec, the curriculum table, the `error_signature` vocabulary, per-attempt metadata) exist only as prose, and four cross-lens blockers (no concrete schemas, a voice-first vs. no-audio contradiction that strands the target user, no headless test-driver seam, and no client/server reconciliation model) must be resolved before coding. All four now have written specs; the remaining work is to ratify them into the design docs and seed a thin first slice.

## Readiness scorecard

| Lens | Score (1–5) | One-line take |
|------|:-----------:|---------------|
| game-design-theory | 3 | Excellent competence loop; under-specified felt experience (drill micro-flow, reward schedule, autonomy, relatedness). |
| game-ui-design | 3 | Strong readability discipline; the voice-first promise is contradicted by deferring all audio — strands pre-readers. |
| motion | 2 | Every animation surface named, none parameterized; no AnimatePresence/FLIP/drag/scale decisions — the riskiest gap. |
| develop-web-game | 3 | Engine is superbly headless-testable; the browser dev loop has no snapshot/selector/settle/dispatch/seed seams. |
| game-development | 3 | Correct decoupling; silent on the game loop, latency budget, and client/server reconciliation. |
| phaser-gamedev | 4 | KEEP DOM/SVG — load sits well inside its envelope; just pin a frame budget + the Canvas-boundary trigger. |
| implement-specs | 3 | Unusually disciplined plan; the data contracts it hinges on are prose, and there is no designated thin first slice. |

## Blockers (must-fix before coding, merged & deduped)

**B1 — No concrete schema for the wire/state contracts (Action / Signal / Event / GameState / Decision / AnswerValue).** Raised by implement-specs (high) and develop-web-game/game-development (depend on it). Every layer — reducer, Pydantic→TS codegen (KTD4), presentation nodes, verifier, the Phase-2 fold — hinges on these shapes, which appear only as illustrative fragments. **Fix:** ratify the closed Pydantic-level definitions now written as the U2 acceptance artifact. **Doc to change:** add `docs/design/.../engine-SCHEMA.md` (or a TECH.md §) from spec-clarifications §1; cross-reference from plan-001 U2/KTD4.

**B2 — No RoomSpec / Beat / ScaffoldLevel data schema, though U7 is "driven by RoomSpec."** Raised by implement-specs (high). The §4.4 room tables are explicitly non-machine-readable; the beat sequencer and presentation selectors both need the structure. **Fix:** adopt the declarative `RoomSpec` schema + R1 authored fully as data (spec-clarifications §2), including the promoted "advance on submit, never a timer" invariant (resolves plan-001 Open Q3). **Doc to change:** new `content/room_spec.py` spec section referenced from plan-001 U7; note the invariant in state-model §7.

**B3 — Voice-first goal communication is mandated but all audio is deferred out of Phase 1 (doc-vs-doc contradiction).** Raised by game-ui-design (blocker) and game-design-theory/develop-web-game (related). R0a/R0b target pre/early readers; with no voice and minimal text, a non-reader has no "what do I do" channel — the core guarantee collapses for the exact user the first rooms exist for. The hint ladder H1–H4 has the same hole (text-only quotes). **Fix:** adopt the dual-channel decision (spec-clarifications §4): a deterministic ghost-hand **pantomime + askVerb icon + ask-again** as the floor (the contract U7 certifies), with browser `SpeechSynthesis` TTS of the existing goal string as the preferred top layer; non-reading forms for every hint rung. **Doc to change:** re-scope plan-001 "Deferred to Follow-Up" line; amend presentation §4/§5.1 and asset-manifest §8; add the U7-NONREADER-GOAL test.

**B4 — No headless test-driver seam: no state snapshot, no selector grammar, no settle hook, no semantic dispatch, no session seeding.** Raised by develop-web-game (high ×4). The reference dev-loop client assumes a single `<canvas>`; this app is DOM/SVG behind a WebSocket the Playwright page can't read. **Fix:** adopt the `window.__GAME__` contract (spec-clarifications §5): `renderToText()`/`presentationNodes()`, `data-testid={instanceKey}` + `data-drop` selector grammar, `awaitSettled()` + `?test=1` motion-zeroing, test-only `dispatchAction`/`injectSignal`, and `init_session` seeding with a fixtures catalog. **Doc to change:** plan-001 U6/U7/U8.

**B5 — No client/server reconciliation, optimistic-update, or pending model; the round-trip is treated as synchronous; the "T1 fired but engine rejected" race is unresolved.** Raised by game-development (high) and motion (drag reconciliation). On flaky tablet wifi the action-sent→state-returned window is real. **Fix:** adopt optimistic-apply-then-reconcile scoped to structural moves only, engine-assigned stable `instanceKey`/`entity_id`, snapshot-driven revert with `shake_reject`, action-id idempotency, `MAX_INFLIGHT` backpressure, and queue-then-resync on disconnect (spec-clarifications §6). **Doc to change:** plan-001 U5/U6, refine the "One action round-trip" diagram.

**B6 — No concrete Motion transition spec, no scene/beat-transition (AnimatePresence/FLIP) strategy, no drag contract, no stage-scaling/Motion-layout-bug guard.** Raised by motion (high ×3) and game-development/phaser (timing). The most visible transitions (space-trade fade, ghost dissolve, slice/merge/fuse, KITCHEN↔ROOM) are undesigned, and Framer-Motion `layout` under a CSS-`scale` stage mis-positions. **Fix:** adopt the T1 Motion-spec table + per-outcome grammar (spec-clarifications §8) and the animation architecture (spec-clarifications §9): one always-mounted `AnimatePresence` per region keyed by `instanceKey`; transform-only mass re-layout with `layout`/`layoutId` capped at ≤2/beat; the scale-boundary rule; the `@use-gesture`↔Motion drag contract; the ≤50-animating-node budget. Also pin the package to `motion` (`motion/react`) not `framer-motion`. **Doc to change:** plan-001 KTD5/U6/U7; presentation §6/§7.

## High-value improvements (prioritized, deduped)

**High**

- **Frame budget + Canvas-boundary trigger (phaser, game-development, motion).** "~100ms" is a latency figure, not a render-pacing one. Name a reference device (T-REF) and a measurable trigger (two consecutive >16.7ms frames on the worst R2 multi-slice ⇒ migrate that beat's Skin to Canvas, layers 1–2 untouched). See spec-clarifications §7 (budget) + §9 (Canvas-boundary candidate).
- **Closed `error_signature` vocabulary + ScriptedPolicy curriculum table + per-attempt metadata contract (implement-specs).** Three content contracts that gate Phase-1 tests and bind Phase-2 by construction. Adopt spec-clarifications §3 (curriculum is the single source of `order`; `error_signature` is a closed StrEnum; the `judged` record IS the Phase-2 Observation minus the affect stub; latency is engine-clock present→submit).
- **Game-loop / timing decision stated explicitly (game-development).** Declare the engine a discrete event-driven machine with no fixed timestep and no server tick; the client render loop owns all animation; Tier-2 idle is an injected timestamped Signal (one external clock owner, harness-drivable). spec-clarifications §7.
- **Accessibility layer: redundant (non-color) block↔numeral link, colorblind-safe palette, reduced-motion, text-size/contrast (game-ui, motion, phaser).** The link is partly hue-only today; ~8% of boys can't read it. Adopt the three-channel link (hue + per-denominator pattern + connector), CVD-safe palette, prefers-reduced-motion degraded forms, and the legibility floor. spec-clarifications §10.
- **Felt-experience layer: drill micro-flow + reward schedule + bounded autonomy + relatedness arc + non-affect relief valve (game-design-theory).** The macro loop is flow-tuned; the intra-room drill (the longest segment) is not. Adopt the `bored-but-not-yet-fluent` detector, the no-points milestone reward schedule, `OfferChoice` bounded autonomy, mom's `BondLevel` arc, and the Phase-1/2 confidence-rebuild relief valve. spec-clarifications §11.

**Medium**

- **Per-room degenerate-strategy analysis + a brute-forcer persona per room (game-design-theory).** Generalize the R2 §4.6 over-slice treatment to every room (T-MECH/T-BLOCK/T-GATE tier per room) with a matching harness persona. spec-clarifications §12 Artifact A.
- **Long-arc motivation pivot as explicit beats (game-design-theory).** Promote `skill_map` to the named late-game motivator; add a non-cooking transfer beat (which is also a §4.4 transfer probe) and tie the bare-slate beats to a mastery achievement that is the gate surfaced. spec-clarifications §12 Artifact B.
- **Input-affordance / answer-entry grammar per beat (game-ui).** Declare the primary input per beat, render a verb-first prompt, and pin the structured `AnswerValue` (incl. how `1 2/7` is entered) at U2/U3, not U8. Covered by spec-clarifications §1 (AnswerValue) + §4 (affordance).
- **Per-outcome feedback grammar incl. the bare slate (game-ui, motion).** Define correct/incorrect/at_target/over_target reads with a silent-friendly form and the bare-slate "write again" recovery. spec-clarifications §8.
- **Responsive scaling contract beyond 1280×800 (game-ui, phaser).** Fixed logical root + CSS scale-to-fit/letterbox, min sizes on the smallest tablet, a UI-scale option. spec-clarifications §10 §E.
- **Console/transport error surfacing + Signal injection path + e2e operational contract (develop-web-game).** Socket client must `console.error` on disconnect/error-frame/deserialize-failure; Signals injectable with explicit timestamps. spec-clarifications §5 §6.4 + §4.2.

**Low**

- **Phase-1 framing note + optional `SKIP_ROOM` affordance (game-design-theory).** State that the scripted shell is an engineering scaffold, not a fun/flow playtest target, and add an OFF-by-default, mastery-neutral skip so playtesters aren't marched through skills they own. spec-clarifications §12 §C.
- **Per-beat animated-node cap + `willChange` hygiene + list/perf for R0a scatter/R4 overflow (motion, phaser).** ≤50 animating nodes/beat, `willChange` only on currently-springing nodes. spec-clarifications §9 U7.6.
- **Memoized presentation-node selectors (game-development).** Stable references keyed by `instanceKey` so untouched nodes don't re-render/re-animate per snapshot.

## Cross-cutting themes (raised by 2+ lenses)

- **Concrete schemas are missing (implement-specs, develop-web-game, game-development, motion).** Action/Event/GameState/Decision/AnswerValue, RoomSpec, and the selector grammar are all named-but-not-written; four lenses each hit a wall that the same schema closes. → spec-clarifications §1, §2, §5.
- **`instanceKey` / stable logical identity is load-bearing everywhere (develop-web-game, game-development, motion, phaser).** It is the test selector, the reconciliation key, the FLIP `layoutId`, and the no-remount guarantee — but no doc says the engine assigns it. → made engine-owned in §1 §0.2, §6 §2.
- **Animation/timing is named at the state level, never parameterized (motion, game-development, phaser, game-ui).** No durations, no AnimatePresence, no drag/scale decisions, no frame budget, no reduced-motion. → §7, §8, §9, §10.
- **Reduced-motion / accessibility is absent for a young-child audience (game-ui, motion, phaser).** prefers-reduced-motion, colorblind-safe encoding, text-size/contrast all unspecified. → §10.
- **The "~100ms hyper-responsive" claim is asserted but never allocated or measured (game-development, phaser, motion).** Latency budget vs. render-pacing budget conflated; no device, no measurement. → §7.
- **The deterministic firewall must be preserved while filling felt/engagement gaps (game-design-theory, implement-specs).** Every felt-experience, autonomy, reward, and motivation-pivot addition rides the seam and never touches the gate, the verifier, or mastery truth. → §11, §12 (explicit firewall clauses).
- **Phase-1 scripted shell is not a representative play experience (game-design-theory, implement-specs).** It forces a fixed path; fun/flow evaluation must wait for Phase-2 adaptivity. → §12 §C.

## Renderer call (DOM/SVG vs Phaser/Canvas)

**Recommendation: KEEP DOM/SVG + React + Framer Motion (the plan's KTD5 choice). Do not adopt Phaser/Canvas now.** The phaser-gamedev lens (score 4, the highest) is explicit: this game's worst-case load — tens of blocks, single bars of ~12 pieces, one or two simultaneously animating stacks — sits comfortably inside DOM/SVG's envelope, where pooling/culling/atlasing (what Phaser buys you) are unnecessary. DOM/SVG is the *better* renderer for this product's hard requirements: voice-first low-text play for pre-readers leans on accessible, selectable, screen-reader-addressable text and large hit targets that DOM gives for free and Canvas must re-implement; inspectability (the `data-testid` test seam, B4) is native to DOM and absent on a canvas; and the wireframe-Skin-first contract + Skin seam keep the renderer genuinely swappable. The plan already names Canvas/PixiJS as a deferred upgrade behind the U6 render boundary — the correct posture.

The conditions to make this defensible, all now specified: (1) a stated frame budget + the explicit Canvas-boundary trigger (two consecutive dropped frames on the worst R2 multi-slice ⇒ migrate *that beat's* Skin only — spec-clarifications §7/§9); (2) the U6 render boundary made contractual (a Skin's Visual/Transition is renderer-agnostic enough that a Canvas Skin mounts without touching layers 1–2 — §9 U7.5); (3) mass re-layout done with transform-only springs, reserving Framer-Motion `layout` for ≤1–2 elements/beat (§9 U7.2 — the real DOM jank hazard); (4) a thin Canvas/Lottie overlay permitted *alongside* the DOM scene only for high-count particle/celebration effects (§9 — a hybrid, not a switch). Net: keep DOM/SVG, build the escape hatch, never pre-optimize.

## Expanded specs (index → `docs/design/2026-05-31-spec-clarifications.md`)

1. **Engine wire/state schema reference (Action/Signal/Event/GameState/Decision)** — closed Pydantic-level unions, `instanceKey` rule, AnswerValue, the U2 acceptance artifact. (closes B1)
2. **RoomSpec / Beat / ScaffoldLevel data schema + R1 authored as data** — declarative beat structure, the advance-on-submit invariant, R1 fully as data. (closes B2)
3. **ScriptedPolicy curriculum table + error_signature vocabulary + per-attempt metadata contract** — `content/curriculum.py`, closed `ErrorSignature`, the `judged` record = Phase-2 Observation.
4. **Phase-1 goal-communication channel for non-readers** — pantomime floor + TTS top layer + non-reading hint ladder + U7-NONREADER-GOAL. (closes B3)
5. **Headless test-driver contract** — `window.__GAME__` snapshot, selector grammar, `awaitSettled`, dispatch/inject, `init_session` + fixtures. (closes B4)
6. **Client/server reconciliation, in-flight model, and WebSocket lifecycle** — optimistic-apply-then-reconcile, engine-owned identity, idempotency, queue-then-resync. (closes B5)
7. **Game-loop / timing model and responsiveness budget** — discrete event-driven engine, allocated B1–B8 budget, Canvas trigger, the Tier-2 injected clock.
8. **T1 feedback transition parameters and per-outcome feedback grammar (incl. bare slate)** — the M1–M8 Motion-spec table, the four-outcome grammar, non-color separation. (part of B6)
9. **Animation architecture: scene/beat transitions, drag contract, mass re-layout, stage scaling** — AnimatePresence-per-region, drag contract, transform-only re-layout, the scale-boundary rule, the budget. (part of B6)
10. **Accessibility & responsive scaling layer** — reduced-motion, colorblind-safe three-channel link, text-size/contrast, multi-resolution letterbox.
11. **Felt-experience layer** — drill micro-flow, no-points reward schedule, bounded autonomy, mom's relatedness arc, the non-affect relief valve, engagement counter-metrics.
12. **Per-room degenerate-strategy analysis, harness personas, and the long-arc motivation pivot** — per-room T-MECH/T-BLOCK/T-GATE table + brute-forcers; skill_map/non-cooking-transfer/bare-slate-achievement pivot; Phase-1 framing + SKIP_ROOM.

## Pre-development punch list (ordered — do these to be ready to build Phase 1)

- [ ] **Ratify the engine schema (B1).** Land spec-clarifications §1 as `engine/SCHEMA.md` (or TECH.md §); confirm the closed Action(12)/Signal(4)/Decision(9)/AnswerValue(4)/ErrorSignature(7)/NodeId(7)/Scaffold(7) unions and the `instanceKey` rule. This is the entry gate to everything else.
- [ ] **Ratify the RoomSpec schema + author R1 as data (B2).** Land spec-clarifications §2; promote plan-001 Open Q3 to the "advance-on-submit, no timer" invariant in state-model §7.
- [ ] **Ratify the curriculum table, `error_signature` enum, and per-attempt metadata contract (§3).** Resolve plan-001 Open Q#1 and state-model Open Q#7; freeze the `error_signature` values so Phase-2 binds without drift.
- [ ] **Resolve the voice-first contradiction (B3).** Re-scope the plan-001 deferral line to recorded VO only; pull client TTS + the pantomime floor into Phase 1; amend presentation §4/§5.1 + asset-manifest §8; add the non-reading hint forms.
- [ ] **Land the headless test-driver contract (B4).** Specify `window.__GAME__`, the `data-testid`/`data-drop` selector grammar, `awaitSettled`, `dispatchAction`/`injectSignal`, `init_session`, and the fixtures catalog in plan-001 U6/U7/U8.
- [ ] **Land the reconciliation + transport contract (B5).** Add the optimistic-echo/`instanceKey`/idempotency/resync model to plan-001 U5/U6 and refine the round-trip diagram.
- [ ] **Land the animation + timing contracts (B6).** Pin the package to `motion`/`motion-react` + React major + StrictMode decision; add the M1–M8 Motion-spec table, the AnimatePresence-per-region + drag + mass-re-layout + scale-boundary rules, and the game-loop/latency-budget statement (incl. the Canvas-boundary trigger).
- [ ] **Land the accessibility + scaling layer.** Add the three-channel link, CVD-safe palette, reduced-motion table, text/contrast floors, and the letterbox scaling contract to presentation §6/§7 + asset-manifest §1/§2.
- [ ] **Land the felt-experience + degenerate-strategy + motivation-pivot specs.** Add §11 and §12 (these are mostly Phase-2 `Policy`/fold logic + Phase-1 render states + harness personas) so the `params.py` knobs and persona list exist before Phase 2.
- [ ] **Define "Slice 0" — the thin first vertical (implement-specs).** Cut kitchen opener + R1 only through U1–U8 with explicit acceptance criteria (engine replay green; one socket round-trip; wireframe Skin renders every R1 functional ID+state; a non-reader can identify the next action with audio off; Playwright drives kitchen→R1→kitchen by selector). Gate Slice 0 on the schema items above being ratified.
- [ ] **Declare the source-of-truth mapping.** Note which docs are PRODUCT (app_philosophy + room_break_down) vs TECH (state-model + presentation-scene-architecture + the new schema docs), and the rule that the implementing PR updates them in place.
- [ ] **Build Phase 1 Slice 0, then fan out room-by-room** (R0a, R0b, R2, R3, R4), reusing the Slice-0 acceptance template per room.
