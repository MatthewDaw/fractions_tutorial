# Work Order — title (Title Screen)

- **Component:** `web/src/TitleScreen.jsx` · **Route:** `#/` (title) · **CSS:** `title.css` · **Effort:** M
- **Uses shared shell:** NO (standalone). Work = extract shared chrome.
- **Priority:** LATE.

## Target wireframe screens
`docs/wireframe/screens/title.html`, data `docs/wireframe/src/screens/title.js` (kind: raw).

## Design gaps to close
- `.fab-bar` rendered in `Shell.jsx` (orphaned), not TitleScreen.
- START button is `<button onClick>` vs wireframe `<a href>` — keep programmatic routing (one pattern).
- Character SVGs are React components (Cook/Mom/cast) — wireframe inlines; keep components.

## Dedup moves
- Use shared `<FabBar>` (same as world-map).
- Extract `<Corner>` filigree → shared.
- Extract `<FStrip>` fraction strips → shared `components/`.
- Reveal/stagger (.rv, d1-d6) → shared `useRevealStagger` or tokens.
- `data-vox` voice pattern standardized.

## Mechanics to PRESERVE
useReady 120ms reveal; Cook voice on load + autoplay-block fallback (pointer/keydown retry); bob animations; qbounce; START onStart; FStrip on/off pieces; prefers-reduced-motion; autoFocus on START.

## Playwright test plan
1. Mount: `.scene.titlescreen.ready` after 120ms; 4 corners; paper-fill.
2. Voice: mock useVoice, say('titleWelcome') on mount; autoplay fallback adds/removes listeners; gesture retry.
3. Reveal: .rv opacity 0→1 with staggered delays.
4. Figure/qbounce animations.
5. START click → onStart fired; autoFocus set.
6. FStrip renders 1/2 and 1/3 with correct on/off pieces.
7. FabBar present (Concepts + Settings).
8. data-vox-speaker='cook'; reduced-motion disables animations.

## Risks
FabBar in Shell (extract carefully); navigation model (pick onClick routing); keep character SVGs as components; preserve 120ms useReady; voice timing must not be overridden by shell defaults; FStrip new shared component availability; reduced-motion CSS scope; z-index/bob timings.

## Definition of done
Shared chrome (FabBar/Corner/FStrip/reveal) extracted · Playwright passes, zero errors · build clean · vitest green · worktree + PR.
