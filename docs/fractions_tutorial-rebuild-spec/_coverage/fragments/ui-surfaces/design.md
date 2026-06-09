<!-- slice: ui-surfaces → design.md -->

## Engine model surfaces (`web/src/ui/**`)

> Scope: the four always-available, observer/learner-facing surfaces that make the
> engine's internal model *visible*. They are a **pure display layer** — every
> surface receives its data as props or reads the observable store; **none of them
> imports the engine** and **none can write to the engine**. The store bridge
> (`runtime/engineStore.js` / `useEngineStore`) and the `MasteryEstimate` /
> `Decision` shapes they render are owned by other slices and referenced here by
> pointer only (see `runtime-affect`, `engine-core`).

### Why these surfaces exist (rationale)

The product brief imposes three guards that these surfaces operationalize, and the
file headers name them explicitly:

- **"No Choice Paralysis" / "why did the interface change?"** — when the engine
  silently re-shapes the lesson (fades a scaffold, raises support, queues a
  transfer probe, routes elsewhere), the child should get a one-line, in-language
  reason. → `RationaleBanner` + the `EngineSurfaces` change-kind filter.
- **Anti "shallow success"** — a teacher/observer must be able to inspect the live
  per-node model and the *counter-metrics* that catch false mastery (UI churn,
  dependence, false-positive rate), not just a happy score. → `MasteryInspector`.
- **Advisory affect via consented self-report** — the only ground-truth affect
  label is a child's own tap; it is collected by a calm, reader-safe, in-fiction
  probe and is structurally walled off from the mastery gate. → `AffectProbe`.

### Mounting model — one mount, total coverage

`EngineSurfaces` is mounted **exactly once**, by `Shell.jsx`, *outside* the scaled
`#stage` (it lives in viewport coordinates; see the CSS fragment). Because it
subscribes to the global `engineStore` rather than per-lesson state, **every**
lesson — including rooms that only partially adopted the runtime hook — is covered
with **zero per-lesson wiring**. This is the load-bearing design decision: the
surfaces are a global observer of engine output, not a lesson feature.

Shell wires it as:

```
<EngineSurfaces
  active={engineActive}                               // inLesson || route === "mom"
  showInspector={engineActive && import.meta.env.DEV} // DEV-gated inspector
  fallbackMasteryMap={masteryMap}                     // Shell's loaded map until a live one publishes
/>
```

- `active` gates the **learner-facing** surfaces (banner + nudge toast) to
  in-lesson / kitchen routes. On the title screen and world map there is no attempt
  in progress, so a stale rationale would be noise — it is suppressed.
- `showInspector` gates the **observer-facing** inspector toggle separately, and is
  `import.meta.env.DEV`-gated in Shell (the inspector component itself can still be
  toggled open in any build via its own header button — see below).
- `fallbackMasteryMap` lets the inspector show Shell's already-loaded folded map
  before the first live `publishDecision` populates `store.masteryMap`.

### Data flow into the surfaces (by pointer)

```
useLessonEngine.judgeAndAdvance  (runtime-affect, boundary-only)
   └─ publishDecision(decision, masteryMap, t) ─┐
   └─ publishNudge({type,text}, t) ─────────────┤→ engineStore (observable)
                                                 │
                  useEngineStore() ◄─────────────┘
                       │
                       ▼
              EngineSurfaces  → RationaleBanner / NudgeToast / MasteryInspector
```

The store snapshot fields consumed here are `{ decision, rationale, nudge,
masteryMap, decisionLog, metrics }` (store shape owned by `runtime-affect`).

---

### `EngineSurfaces.jsx` — the store→surface bridge container

A thin container with no markup of its own beyond the surfaces it composes. It
calls `useEngineStore()` once and fans the snapshot out to the three surfaces.

**Change-kind filter (anti-churn).** The banner must answer *"why did the interface
change?"*, not narrate every problem. A routine `PresentProblem` ("continue at this
level") fires on **every** answer, so surfacing it would read as churn. The
container therefore only passes a non-empty rationale to the banner when
`decision.kind` is a *change* kind:

```
CHANGE_KINDS = { FadeScaffold, RaiseScaffold, TransferProbe,
                 RouteToRoom, ReturnToKitchen, EscalateToHuman }
bannerRationale = decision && CHANGE_KINDS.has(decision.kind) ? rationale : ''
```

The full rationale stream (including routine `PresentProblem`) still lands in the
inspector's decision log — nothing is lost, it is just routed away from the banner.

**`NudgeToast` (inner component).** Renders a transient Tier-2 nudge
(`{ type, text }`) as a status toast. It self-dismisses after `NUDGE_TTL_MS = 5000`
ms via `clearNudge()` (a nudge is transient, not a mode), and also offers a manual
`×` dismiss. The toast className is derived from the nudge type
(`engine-nudge--${type.toLowerCase()}`) and carries `data-nudge-type` for tests and
styling.

RFC-2119 behavior:

- The system MUST render `RationaleBanner` and `NudgeToast` only when `active` is
  true.
- The system MUST render the banner ONLY for a change-kind decision; it MUST NOT
  show the banner for a routine `PresentProblem`.
- The toast MUST auto-dismiss after 5 s and MUST also be manually dismissible.

Given/When/Then:

- Given `active` is false (world map), When any decision is published, Then no
  banner and no toast render.
- Given `active` is true, When a `FadeScaffold` decision is published, Then the
  banner shows its rationale.
- Given `active` is true, When a `PresentProblem` decision is published, Then no
  banner renders (but the decision still appears in the inspector log).
- Given a nudge is published, When 5 s elapse, Then `clearNudge()` fires and the
  toast disappears.

### `RationaleBanner.jsx` — the "Why did this change?" bar (KTD8 / U12)

A thin, dismissible status bar showing the latest Decision rationale string. It is
deliberately a **pure prop-driven display** — it imports nothing from the engine;
the caller supplies `rationale` (from `useLessonEngine().rationale`, surfaced via
the store).

Local state machine:

- Tracks `dismissed` (did the child close *this* rationale?) and `lastRationale`
  (the last string shown).
- When a **new** non-empty rationale arrives (`rationale !== lastRationale`), it
  **un-dismisses** so the new reason is shown even if the previous one was closed.
- When `rationale` becomes empty, it resets `lastRationale` to `''`.
- `visible = Boolean(rationale) && !dismissed`; renders `null` when not visible.

Accessibility: `role="status"`, `aria-live="polite"`, `aria-atomic="true"`,
`data-testid="rationale-banner"`. The dismiss control is a real `<button>` with
`aria-label="Dismiss"`.

RFC-2119:

- The banner MUST hide when `rationale` is empty OR when the child has dismissed
  the current rationale.
- The banner MUST re-appear (un-dismiss) when a different non-empty rationale
  arrives.

### `MasteryInspector.jsx` — counter-metrics + per-node model window (U12)

A collapsible observer panel that renders the live model so an adult can audit for
*shallow success*. It is **toggle-gated**: it starts hidden and a header button
(`Mastery Inspector` / `Hide`) opens it; it renders its toggle in any build, while
Shell additionally gates whether it is mounted at all to DEV. It computes mastery
status **inline** (mirroring `gate.ts`) precisely so it has **no engine import**.

**Inline gate mirror** (kept in sync by hand with `engine-core`'s `gate.ts` — a
known duplication, see gotchas fragment):

- `isMastered(est)` ⇔ `P_known ≥ 0.95` AND `max_scaffold_passed ≥ 3` AND
  `transfer_passed` (fluency is *soft* = always true, advisory pre-calibration).
- `gateConditions(est)` returns the four booleans `{ accuracyOk, independenceOk,
  transferOk, fluencyOk }` rendered as the Acc / Ind / Xfr / Flu badges.
- `statusLabel(est)`: `not-started` (no est, or `P_known ≤ 0.15`) → `in-progress`
  → `needs-review` (a retention probe ran and `P_known ≥ 0.50`) → `mastered`.

**Node table.** Rows follow a fixed `NODE_ORDER` mirroring `graph.ts` topological
order (`ADD_SAME_DEN`, `ADD_UNLIKE_NESTED`, `ADD_UNLIKE_COPRIME`, `SIMPLIFY`,
`IMPROPER_TO_MIXED`) with human labels carrying room ids. Each row shows P(known) %,
the four gate badges, the status label (`data-testid="status-<nodeId>"`), and hint
dependence %.

**Counter-metrics** (`CounterMetrics` + `effectiveMetrics`). These are the brief's
anti-shallow-success guards:

- **UI churn** — count of T3 scaffold-level changes this session (supplied by the
  store: `metrics.uiChurn`, which counts only `FadeScaffold`/`RaiseScaffold`).
- **Dependence** — average `hint_dependence` across in-progress nodes; derived from
  `masteryMap` when the caller does not supply it (`derivedDependence`).
- **False-positive rate** — fraction of retention-probed nodes that are no longer
  `isMastered` (i.e., were mastered but later failed/decayed); derived as
  `derivedFalsePosRate`. The inline comment flags the subtlety: it counts probed
  nodes that FAILED post-probe (`P_known < 0.95` ⇒ not mastered), not those that
  passed.
- A caller-supplied value (when not `undefined`) always overrides the derived one.

**Decision log.** Renders `decisionLog` newest-first (`[...log].reverse()`), each as
`[kind] rationale @t`; shows an empty-state message when no decisions yet.

RFC-2119:

- The inspector MUST NOT import from the engine; it MUST mirror the gate inline.
- The inspector MUST start collapsed and expand only on the toggle.
- The inspector SHOULD derive dependence and false-positive rate from `masteryMap`
  when the caller omits them, and MUST let an explicit caller value override.

### `AffectProbe.jsx` — consented self-report probe (plan 005 / S3)

A calm, modal, **presentational** overlay shown only at rare T3 boundaries where the
child has already paused. Babushka asks *"…was that tricky, or easy-peasy?"* with
two big tappable faces; the tap is the **gold-standard self-report label** that
every inferred affect signal is graded against.

**Design constraints honoured (from the file header):**

- **Reader-safe** — each face carries a visible TEXT label ("Easy-peasy" / "Tricky"),
  not just an emoji; the emoji is `aria-hidden` decoration. (Serves early readers +
  the on-screen-caption decision.)
- **In-fiction** — the prompt is Babushka's voice, tagged
  `data-vox-speaker="Babushka"` for the app-wide tap-to-read/TTS layer; the address
  uses a `nickname` (default `solnyshko`). The face `<button>`s are controls that
  the TapToRead layer deliberately skips.
- **Firewall-respecting** — the component **NEVER touches the engine**. It is
  purely presentational: the **parent** decides *when* to show it (rare T3 pauses
  governed by nudge-fatigue) and what to do with the report; corroboration/recording
  happens in `runtime/affect/selfReport.js` (slice `runtime-affect`), never near the
  mastery gate. (See constitution §5.2.)

**Props / behavior:** `open` (render only when true; returns `null` otherwise),
`onReport('easy' | 'tricky')` fired on a face tap, `onDismiss()` fired by the
"Not now" skip, `nickname`. Accessibility: `role="dialog"`,
`aria-label="How did that feel?"`, `data-testid="affect-probe"`.

> Integration note (current state): `AffectProbe` is defined and unit-tested but is
> **not yet mounted** by Shell or any lesson — it is a ready presentational surface
> awaiting a caller that owns the rare-T3 timing. This is intentional per its
> "parent decides when" contract, not an oversight.

RFC-2119:

- The probe MUST render nothing when `open` is false.
- Each affect choice MUST be conveyed by a visible text label, not emoji alone.
- The probe MUST NOT read or write engine state; reporting MUST flow only through
  `onReport`/`onDismiss` to the parent.
