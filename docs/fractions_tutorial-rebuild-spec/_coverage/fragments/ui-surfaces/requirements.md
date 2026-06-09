<!-- slice: ui-surfaces → requirements.md -->

## Engine model surfaces — requirements

These requirements cover `web/src/ui/**` (the always-mounted engine surfaces) and
their stylesheets. They reference but do NOT re-specify the engine store
(`runtime-affect`) or the `MasteryEstimate`/`Decision` DTOs (`engine-core`).

### R-UI-1 — Single mount, universal coverage
The system MUST mount `EngineSurfaces` exactly once (in `Shell.jsx`), outside the
scaled `#stage`, subscribed to the global engine store. It MUST NOT require any
per-lesson wiring; every lesson route is covered by virtue of the single mount.

### R-UI-2 — Rationale banner answers "why did this change?" (KTD8)
WHEN the engine publishes a *change* decision (`FadeScaffold`, `RaiseScaffold`,
`TransferProbe`, `RouteToRoom`, `ReturnToKitchen`, `EscalateToHuman`) AND the
surfaces are `active` (in a lesson or the kitchen), THE system MUST display the
decision's one-line rationale in a dismissible banner.
- WHEN the decision is a routine `PresentProblem`, THE system MUST NOT show the
  banner (anti-churn); the rationale MUST still be recorded in the decision log.
- WHEN a different non-empty rationale arrives after the child dismissed the prior
  one, THE banner MUST re-appear.
- WHEN the surfaces are not `active` (title / world map), THE banner MUST NOT show.

### R-UI-3 — Tier-2 nudge toast is transient and work-preserving
WHEN a Tier-2 nudge (`{ type, text }`) is published AND the surfaces are `active`,
THE system MUST show a status toast carrying `data-nudge-type`. The toast MUST
auto-dismiss after 5000 ms and MUST also be manually dismissible. It MUST NOT
restructure the lesson workspace (display-only; see constitution §5.3).

### R-UI-4 — Mastery inspector exposes the live model + counter-metrics
THE inspector MUST render, per skill node, P(known), the four gate conditions
(accuracy / independence / transfer / fluency), a status label, and hint
dependence, plus the session counter-metrics: **UI churn** (T3 changes/session),
**dependence** (unassisted-correct at low scaffold), and **false-positive rate**
(mastered → later failed a retention probe), plus the decision log (newest first).
- THE inspector MUST start collapsed and expand via its header toggle.
- THE inspector MUST compute mastery status inline (mirroring `gate.ts`) and MUST
  NOT import the engine.
- Shell MUST gate the inspector to `import.meta.env.DEV` lessons; the component's
  own toggle remains available for field debugging in any build.

### R-UI-5 — Affect probe: consented, reader-safe, in-fiction, firewalled
WHEN the parent renders the probe with `open`, THE system MUST present Babushka's
"tricky, or easy-peasy?" prompt with two large tap targets, each carrying a visible
TEXT label (not emoji alone), plus a skip ("Not now").
- THE prompt MUST be tagged `data-vox-speaker="Babushka"` for the tap-to-read layer.
- A face tap MUST call `onReport('easy'|'tricky')`; skip MUST call `onDismiss()`
  without reporting.
- THE probe MUST be purely presentational: it MUST NOT read or write engine state;
  the parent owns *when* it appears and corroboration happens in `runtime/affect`
  (see constitution §5.2 affect firewall).

### R-UI-6 — Surfaces are a pure display layer
NONE of `EngineSurfaces`, `RationaleBanner`, `MasteryInspector`, `AffectProbe` MAY
import from `web/src/engine/**`. They MUST consume data via props or the observable
store and MUST NOT mutate engine/mastery state. (This is the structural guarantee
behind the affect firewall and engine purity for the UI layer.)

### R-UI-7 — Surfaces live in viewport space, above the stage
THE surface stylesheets MUST position the banner, toast, and inspector with
`position: fixed` in viewport coordinates (not inside the scaled `#stage`), placed
to clear the lesson's bottom answer bar / Check button / cook. The affect probe MUST
overlay its parent (`position: absolute; inset: 0`).
