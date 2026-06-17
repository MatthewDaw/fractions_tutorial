# Work Order — review (Mixed Basket / Interleaved Practice)

- **Component:** `web/src/MixedReview.jsx` · **Route:** `#/review` · **CSS:** `mixreview.css` · **Effort:** M
- **Uses shared shell:** NO (completely standalone, no chrome/tabs/stages). Work = adopt shared chrome + dedup ribbon/layout.
- **Priority:** LATE.

## Target wireframe screens
`docs/wireframe/screens/review.html`, data `docs/wireframe/src/screens/review.js` (kind: raw).

## Design gaps to close
- No header chrome / no tabs / no rail / no answer bar / no tutor column — fully bespoke centered column.
- Status ribbon reimplemented inline (duplicates TutorRibbon tone logic).

## Dedup moves
- Adopt a lesson-variant or `<SceneFrame>` + `<HeaderLayout>` for title/subtitle ("Mixed Basket" + "solved N so far").
- Use shared TutorRibbon (or its tone CSS) instead of inline `.ribbon--{tone}`.
- Title/subtitle copy → a registry/screen entry (currently inline `:82-83`).
- Centralize Slate shape-dispatch (`renderInput` integer/relation/mixed/fraction) into a `SlateRenderer` helper reusable by lessons.
- Back button → shared CtrlButton.

## Mechanics to PRESERVE
Two-phase loop (identify → solve) via `pickType`; correct recipe → solve phase, wrong → "Look again" warn; `submit` grading → done++ + 650ms auto-advance; problem rotation modulo eligible.length; empty state (<2 recipes); Slate shapes (integer/relation/mixed/fraction); `generateFor`/`gradeAnswer`.

## Playwright test plan
1. Empty state (≤1 skill): empty heading + back → onExit.
2. Identify phase: prompt + choice buttons; identify visible, solve hidden, ribbon empty.
3. Wrong recipe → "Look again" warn, phase stays.
4. Correct recipe → "now solve it" ok, solve Slate appears.
5. Fraction shape: two stacked cells; write num/den; Check ready.
6. Correct answer → "Correct!", done++, subtitle updates, auto-advance after 650ms to new identify.
7. Wrong answer → "Not quite", no advance.
8. Rotation: recipes cycle, no consecutive repeat if eligible>2.
9. Back → onExit.
10. integer/relation/mixed shapes render + submit correctly.

## Risks
Standalone → adopting shell is a restructure (onExit routing may break); ribbon vs TutorRibbon visual decision (Cook art?); no stages/tabs (may need a lesson-variant type); inline title not in registry; only page using generateFor/gradeAnswer directly (no engine stage progression — watch engine assumptions).

## Definition of done
Shared chrome adopted, two-phase loop intact · Playwright passes, zero errors · build clean · vitest green · worktree + PR.
