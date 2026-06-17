# Work Order — settings (Settings Screen)

- **Component:** `web/src/SettingsScreen.jsx` · **Route:** `#/settings` · **CSS:** `settings.css` · **Effort:** M
- **Uses shared shell:** NO (raw scene — design is ALIGNED with wireframe). Work = extract reusable scene chrome.
- **Priority:** LATE.

## Target wireframe screens
`docs/wireframe/screens/settings.html` (kind: raw, `settings.js`).

## Design gaps to close
- Mostly ALIGNED: paper/frame/corners, header, section labels, volume sliders, mode cards all match. No major gaps — this is a dedup/extraction pass.

## Dedup moves
- Extract `<SceneFrame>`/`<BackdropSurface>` (paper-fill/foxing/frame/4 corners) — reused by every standalone scene.
- Extract `useRevealStagger` hook (shared with title).
- Extract `<HeaderLayout left right>` (kicker+title+subtitle + control).
- Extract `<PrimaryButton>` (`.st-back` style).
- Extract `<SectionLabel num>`; icon SVGs → shared icon registry.
- Add a central screen registry entry so routes are enumerable (not scattered route strings).

## Mechanics to PRESERVE
Volume sliders (pointer drag + keyboard arrows/Home/End, 0-100, muted 'Off' state, icon swap); input-mode cards (stylus/typing select, aria-pressed); settings persistence via `settings.js` store + `subscribeSettings`; Done → onBack; 90ms ready timeout reveal.

## Playwright test plan
1. Load `#/settings`: `.settings-scene.ready`, 4 corners, paper-fill.
2. Header: kicker/title/subtitle/Done.
3. Voice slider: drag 0→100%, .st-fill/.st-knob/.st-vval update; keyboard ±5; set 0 → muted icon + 'Off'.
4. Music slider independent; muted state.
5. Slider focus-visible ring.
6. Mode card: click Stylus → 'on' + stamp; click Typing → swaps.
7. Done → onBack invoked.
8. Persistence: change voice 80, navigate away + back, still 80.
9. Aria labels/valuenow; reveal stagger; reduced motion.

## Risks
Slider pointer→track coord math (touch on tablets); SVG muted icon in two places (centralize); settings.js store coupling; no error handling if getSettings undefined; Done no-op if onBack missing (add fallback); 90ms timeout on slow devices; touch target ≥44px; corner transform order; tick alignment.

## Definition of done
Scene chrome extracted (SceneFrame/HeaderLayout/SectionLabel/useRevealStagger) · Playwright passes, zero errors · build clean · vitest green · worktree + PR.
