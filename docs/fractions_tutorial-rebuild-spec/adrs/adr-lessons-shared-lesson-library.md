<!-- FRAGMENT ADR (slice-local, lessons-rooms). Synthesis may promote or merge.
     NOTE: the cross-cutting "advisory affect firewall" and "engine purity / wire-DTO"
     ADRs are SYNTHESIS-OWNED (spanning); this ADR documents a decision wholly
     internal to the lessons-rooms slice. -->

# ADR (lessons-rooms): Extract a shared lesson library; layout in separate grid tracks

## Status
Accepted (reflects what IS in the codebase).

## Context
Eight lesson rooms (`AppR1`, `AppSubtract`, `AppNumberLine`, `AppCompare`,
`AppM1`, `AppM3`, `AppR4`, `AppR5`) plus the config-driven `LessonUnlikeDen` each
originally inlined a byte-for-byte-identical page chrome (topbar, stage tabs,
question band, goal banner) and a hand-rolled "four fixed rectangles" play
layout built from absolutely-positioned `.xx-z-*` rectangles. The absolute layout
had a recurring, cross-browser bug: a longer equation or a different font (Safari
vs Chromium) could reflow the answer bar OVER the interaction area.

## Decision
1. Extract ONE shared lesson library, `components/lesson/**`
   (`LessonShell` + `LessonBoard` + `AnswerBar` + `LessonGoal` + `HintRail` +
   `TutorRibbon`), imported via a barrel. Each room supplies only its tag/title,
   reset handler, tabs, band, goal, and per-stage body; everything else renders
   once.
2. `LessonBoard` lays the play area out as a CSS **grid with the stage and the
   answer bar in SEPARATE tracks** (`split` variant: stage · rail / answer ·
   tutor; `wide` variant for word-problem stages). The answer bar can therefore
   NEVER overlap the interaction area — the bug is fixed structurally, once,
   everywhere.
3. Each room adopts the runtime controller `useLessonScaffold` (runtime-affect,
   BY POINTER) for the engine wiring + stage nav + outcome state, so a room owns
   ONLY its stage model, manipulative, copy, and per-stage reset.

## Consequences
- All rooms read the same; chrome/layout fixes land once.
- A room's stage model maps to canonical `ScaffoldLevel` L0..L4 via `scaffoldMap`
  (BY POINTER), independent of how many native beats it shows — string-keyed
  steps (`showwork`, `practice`) slot in without renumbering the child-facing
  numeric stages.
- Some legacy stages (Workbench/Applied/Show-Work in a few rooms) intentionally
  remain on the older `.play/.hud` layout where no overlap risk exists — these are
  documented as deliberate exceptions, not omissions.
- Trade-off: the shared library is a coupling point; a room with a genuinely
  novel layout (e.g. `MomsRoom`'s bespoke fixed-zone kitchen) opts OUT and builds
  its own chrome rather than contorting the library.
