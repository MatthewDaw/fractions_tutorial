<!-- slice: ui-surfaces → tasks.md -->

## Rebuild tasks — engine model surfaces (`web/src/ui/**`)

Prereqs (by pointer): the engine store + `useEngineStore` (`runtime-affect`), and
the `MasteryEstimate`/`Decision` shapes (`engine-core`) must exist first — these
surfaces only read them.

1. **`RationaleBanner.jsx`** — pure prop-driven dismissible status bar.
   - Props: `rationale` (string, `''` = hidden), optional `className`.
   - Local state: `dismissed`, `lastRationale`; un-dismiss on a new non-empty
     rationale; reset on empty. `visible = Boolean(rationale) && !dismissed`.
   - `role="status"`, `aria-live="polite"`, `aria-atomic`, `data-testid="rationale-banner"`,
     `×` dismiss button (`aria-label="Dismiss"`). No engine import.

2. **`MasteryInspector.jsx`** — collapsible observer panel.
   - Inline gate mirror: `isMastered` (`P_known≥0.95` ∧ `max_scaffold_passed≥3` ∧
     `transfer_passed`; fluency soft=true), `gateConditions`, `statusLabel`.
   - `NODE_ORDER` mirrors `graph.ts` topo order (5 nodes w/ room-id labels).
   - Sub-components: `GateBadge`, `NodeRow` (P%, 4 badges, status, hint-dep%),
     `DecisionLog` (newest-first), `CounterMetrics` (uiChurn / dependence /
     falsePosRate).
   - Derive `dependence` (avg `hint_dependence` over in-progress) and
     `falsePosRate` (probed nodes no longer mastered) from `masteryMap`; caller
     value overrides when not `undefined`.
   - Toggle button starts collapsed; `data-testid`s: `mastery-inspector`,
     `inspector-toggle`, `inspector-panel`, `status-<nodeId>`, `metric-*`.

3. **`EngineSurfaces.jsx`** — store→surface bridge container.
   - `useEngineStore()` once; fan out `{ decision, rationale, nudge, masteryMap,
     decisionLog, metrics }`.
   - `CHANGE_KINDS` set → `bannerRationale` only for change decisions (anti-churn).
   - Inner `NudgeToast`: `NUDGE_TTL_MS=5000` auto-dismiss via `clearNudge()`, manual
     dismiss, `data-nudge-type`, `data-testid="engine-nudge"`.
   - Props `active` (gates banner + toast), `showInspector` (gates inspector),
     `fallbackMasteryMap` (used when store map is null).
   - Import `engine-surfaces.css`.

4. **`AffectProbe.jsx`** — presentational self-report overlay.
   - Props `open`, `onReport('easy'|'tricky')`, `onDismiss`, `nickname='solnyshko'`.
   - Two face buttons (emoji `aria-hidden` + visible label), Babushka prompt tagged
     `data-vox-speaker="Babushka"`, "Not now" skip. `role="dialog"`,
     `data-testid="affect-probe"`. No engine import. Import `affectprobe.css`.

5. **Stylesheets** — `styles/engine-surfaces.css` (fixed-position banner/toast/
   inspector in viewport space, theme tokens, lifted above the answer bar) and
   `styles/affectprobe.css` (absolute-inset overlay, big tap targets).

6. **Mount** in `Shell.jsx` (slice `shell-nav`): one `<EngineSurfaces>` with
   `active={inLesson || route==='mom'}`, `showInspector={active && import.meta.env.DEV}`,
   `fallbackMasteryMap`. (Documented by `shell-nav`; listed here as the integration
   point.)

7. **Tests** — `tests/runtime/test_engine_surfaces.test.jsx` (store assertions +
   driven render: banner shows for change kinds, hidden for `PresentProblem`,
   hidden when inactive, toast appears, inspector toggle renders, live re-render) and
   `tests/runtime/test_affectProbe.test.jsx` (open/closed, reader-safe labels,
   report routing, in-fiction speaker tag, skip).
