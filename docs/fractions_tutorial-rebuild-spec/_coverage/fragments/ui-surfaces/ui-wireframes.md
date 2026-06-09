<!-- slice: ui-surfaces → ui-wireframes.md -->

## Engine-surface layouts (`styles/engine-surfaces.css`, `styles/affectprobe.css`)

> Per-surface layouts only. The NAV GRAPH connecting screens is synthesis-owned.
> These surfaces live in **viewport** coordinates, NOT inside the scaled 1280×800
> `#stage`, so they are `position: fixed` (banner/toast/inspector) or absolute-inset
> (probe) and palette-matched to the Soviet/old-paper theme (`tokens.css`).

### RationaleBanner — bottom-center, lifted "why did this change?" bar

```
 ┌───────────────────────────────────── viewport ──────────────────────────────────┐
 │                                                                                   │
 │                          ( scaled #stage / lesson )                               │
 │                                                                                   │
 │                  ┌──────────────────────────────────────┐                        │
 │                  │▌ <one-line rationale text>        × │   ← .rationale-banner   │
 │                  └──────────────────────────────────────┘     bottom:200px       │
 │   [answer inputs]            [ Check ]                       [ cook ]             │
 └───────────────────────────────────────────────────────────────────────────────────┘
```

- `position: fixed; left:50%; bottom:200px; transform:translateX(-50%); z-index:40`.
- `max-width: min(460px, 46vw)` — narrowed to the central column so its edges clear
  the bottom-left answer inputs and the bottom-right cook.
- WHY `bottom:200px` (not flush): the lesson answer-bar band (~190px tall) holds the
  denominator input (left), Check (center), cook (right); a full-width bottom bar
  clipped the input and crowded the cook. Lifting above the band keeps it a
  bottom-docked status bar that touches nothing.
- Red left accent border (`--red`), paper background, serif; rises in via
  `rationale-rise` 240ms. `×` dismiss top-right of the bar.

### Tier-2 nudge toast — pill, stacked just above the banner

```
                  ┌············ engine-nudge (dashed pill) ··········┐
                  : <italic nudge text>                          ×  :  bottom:258px
                  └··················································┘
                  ┌──────────────────────────────────────┐
                  │▌ rationale                          × │          bottom:200px
                  └──────────────────────────────────────┘
```

- `position: fixed; left:50%; bottom:258px; z-index:39` — sits ~58px above the
  banner so the two STACK rather than overlap when both are up.
- `max-width: min(440px, 46vw)`; dashed muted border, pill radius (999px), italic
  serif; same `rationale-rise` entrance. Transient (auto-dismiss 5s).

### MasteryInspector — bottom-left toggle + pop-up panel (DEV/observer)

```
 ┌─ .mastery-inspector__panel (min(560px,94vw), max-height 70vh, scrolls) ─┐
 │  Mastery Inspector                                                       │
 │  ┌─ inspector-table ───────────────────────────────────────────────┐   │
 │  │ Node             P(known)  Gate                Status     Hint dep │   │
 │  │ Same Den (r1)    93.0%   ✓Acc ✓Ind ✗Xfr ✓Flu  in-progress  40%    │   │
 │  │ … 5 rows, topo order; mastered=green tint, needs-review=red tint  │   │
 │  └───────────────────────────────────────────────────────────────────┘   │
 │  COUNTER-METRICS:  UI churn 2  ·  Dependence 38.0%  ·  False-pos 0.0%   │
 │  DECISION LOG:  [FadeScaffold] 3 clean answers… @123  (newest first)    │
 └────────────────────────────────────────────────────────────────────────┘
 [ Mastery Inspector ]   ← .mastery-inspector__toggle, fixed left:14px bottom:14px
```

- Toggle `position: fixed; left:14px; bottom:14px; z-index:41`; dark ink chip,
  paper text, ~78% opacity → 100% on hover. Panel pops up above the toggle
  (`bottom:38px`), scrolls internally.
- Gate badges: green pass (`✓`) / red-deep fail (`✗`). Rows tinted by status.

### AffectProbe — centered modal overlay (rare T3 pause)

```
 ┌──────────── .affect-probe (absolute inset:0, dimmed scrim) ────────────┐
 │                  ┌──────── .affect-probe__card ────────┐               │
 │                  │  Ну что, solnyshko — was that        │               │
 │                  │  tricky, or easy-peasy?              │               │
 │                  │   ┌────────┐      ┌────────┐         │               │
 │                  │   │  🙂    │      │  😖    │         │               │
 │                  │   │Easy-   │      │Tricky  │         │               │
 │                  │   │peasy   │      │        │         │               │
 │                  │   └────────┘      └────────┘         │               │
 │                  │            Not now                   │               │
 │                  └─────────────────────────────────────┘               │
 └────────────────────────────────────────────────────────────────────────┘
```

- `position: absolute; inset:0` over its parent, dimmed scrim
  (`rgba(40,26,18,.45)`), `z-index:40`; centered paper card.
- Two faces: `min 140×140px` tap targets (small-hands/tablet), reader-safe label
  under an `aria-hidden` emoji; easy=green tint, tricky=red tint; lift on
  hover/focus-visible. Underlined "Not now" skip below.
