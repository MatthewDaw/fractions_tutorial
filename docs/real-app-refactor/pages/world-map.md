# Work Order — world-map (Lesson Map)

- **Component:** `web/src/WorldMap.jsx` · **Route:** `#/world` · **CSS:** `world.css` · **Effort:** M
- **Uses shared shell:** NO (standalone scene). Work is about extracting SHARED CHROME, not lesson-shell adoption.
- **Priority:** LATE (land after lesson pages — touches shared chrome FabBar/MasteryBadge).

## Target wireframe screens
`docs/wireframe/screens/world.html`, `shelf-build.html`, `shelf-combine.html`, `shelf-found.html`.

## Design gaps to close
- Renders own chrome (.world/.world-head/.world-foot/.wedges) — not LessonShell (intentional for map).
- `.fab-bar` (Settings/Concepts) rendered in `Shell.jsx:262-281`, orphaned from the map.
- No LessonBoard/HintRail/etc (correct — map is bespoke).
- Mastery badges hardcoded per card (no central badge component).

## Dedup moves
- Extract `<FabBar>` shared component; render from WorldMap (and title) instead of orphaned in Shell.
- Extract `<CardNode>` (used by LessonCard + inline shelf rendering).
- Extract `<TrailSVG>`/`<TrailSpoke>` (top-level + submenu variants).
- Extract `<MasteryBadge status>` (replaces inline `.wtag` ternaries).
- Optional `useMasteryState` hook for `masteryStatusFor`/`suggestedNextRoom` derivation.
- **NEW lesson entries:** add den + num cards to the appropriate shelf (coordinate with den/num work orders).

## Mechanics to PRESERVE
Two-level nav (shelves ↔ submenu, openStrandId); `onOpen(id)` routing; kitchen → `mom`; mixbasket → `review`; SVG trails (trailPath bezier); submenu positioning; mastery badges from masteryMap; shelf progress counter; suggested-next badge.

## Playwright test plan
1. `#/world`: 3 shelves at expected positions, kitchen medallion, 3 trail paths, footer text.
2. Click shelf → submenu, back button, header, lesson cards.
3. Back → shelves restored.
4. Click lesson card → onOpen(id), route changes.
5. Kitchen → `#/mom`; mixbasket → `#/review`.
6. Mastery badges with masteryMap; suggested-next badge; shelf progress counter.
7. SVG trails render; submenu card positioning; "coming soon" cards.
8. FabBar present on `#/world` (Concepts + Settings).

## Risks
openStrandId state threading (don't break strand lifecycle); position hardcoding to 1280×800; SVG trail magic numbers; masteryMap timing (stub engine log in tests); FabBar coupling to Shell (extracting must keep it visible); responsive card width.

## Definition of done
Shared chrome extracted (FabBar/CardNode/MasteryBadge/TrailSVG) · den+num cards added · Playwright passes, zero errors · build clean · vitest green · worktree + PR.
