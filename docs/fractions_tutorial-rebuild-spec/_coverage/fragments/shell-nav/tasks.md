# tasks — shell-nav fragment

Rebuild tasks for the app shell / router / maps / settings / audio-voice / intros.
Ordered so each task builds on the prior. Engine-core (mastery load),
runtime-affect (scaffoldMap/useLessonEngine), lessons-rooms (room screens), and
ui-surfaces (EngineSurfaces) are dependencies referenced by pointer.

## T1 — Bootstrap & stage
- [ ] Author `index.html` (`#fit > #stage > #root`, locked viewport, Google Fonts).
- [ ] `main.jsx`: `createRoot(#root).render(<Shell/>)`; import tokens/lesson/world CSS.
- [ ] Implement `useStageFit` (visualViewport-based uniform fit; fixed+centered #fit;
      re-fit on resize/orientation/vv events).

## T2 — Hash router + screen switch (`Shell.jsx`)
- [ ] `useHashRoute` (read `#/<route>`, default `title`, `hashchange` sub, `go`).
- [ ] Screen if/else over settings/concepts/title/mom/review/room; keep globals
      mounted by computing a `screen` variable (no early return).
- [ ] Overlay return-to-origin via `prevRouteRef` for settings/concepts.
- [ ] FAB bar (Concepts + Settings) on title/world only.
- [ ] Mount `TapToRead`, `EngineSurfaces` (active in lesson/mom; inspector in DEV),
      `BackgroundMusic` once.

## T3 — Data registries
- [ ] `rooms.js`: ROOMS[] (10), STRANDS[] (3, contiguous), KITCHEN, CENTER.
- [ ] `ccss.js` (CCSS_DENOMINATORS + helpers), `ccssStandards.js` (NODE_STANDARDS),
      `denominatorColors.js` (palette + hatch + contrast helpers).

## T4 — Settings store + screen
- [ ] `settings.js`: `bf_settings_v1` store, normalize/clamp, legacy
      `musicVolume`/`musicMuted` first-run migration, subscribe API.
- [ ] `SettingsScreen.jsx`: 2 VolumeRows + 2 ModeCards, live subscribe, kbd sliders.
- [ ] `SettingsButton.jsx`: gear → `#/settings`.

## T5 — Audio stack
- [ ] `audioBus.js` (count-based voice-active bus).
- [ ] `music.js` (MUSIC scene map + `sceneFor`).
- [ ] `BackgroundMusic.jsx` (UI-less player: loop/rotate, duck under voice, live
      volume, autoplay retry).

## T6 — Voice stack
- [ ] `speechify.js` (number/fraction spell-out, glyph strip; doubles as cache key).
- [ ] `voiceLines.js` (LINES, SPEAKERS w/ voiceEnv names, MEOW_SFX, LINE_SPEAKER,
      `speakerOf`).
- [ ] `voice.js` (single-channel say/stop, clip→exact-text→TTS resolution, toggle,
      audioBus bracketing, NO robotic fallback, `readAloud` yield).
- [ ] `TapToRead.jsx` (MutationObserver speaker-button injection, capture-phase
      toggle, skip-list).

## T7 — Chrome screens
- [ ] `TitleScreen.jsx` (greet-on-load + gesture retry; START → world).
- [ ] `WorldMap.jsx` (two-level shelves/cards, status badges, suggested "Next",
      shelf rollups, no-data fallback).
- [ ] `EmptyRoom.jsx` (unbuilt-room placeholder).

## T8 — Concept map
- [ ] `conceptTree.js` (CONCEPTS, buildConceptTree, getMastery seam live/placeholder,
      rollups, More bucket).
- [ ] `ConceptMap.jsx` (top-nav tabs → node breakdown → atomic cards; Ring/CardBar;
      live-vs-placeholder chip; banding).

## T9 — Intros
- [ ] 10 `intro*.js` cue sheets (STAGE_PERSIST_KEY, INTRO_DURATION, INTRO_CUES).
- [ ] `RoomIntro.jsx` (iframe video, playhead-gated narration, pause/seek, end card,
      watch-again, mute-by-volume, pause-aware completion timer).
- [ ] Wire first-entry gating + `onRewatchIntro` in Shell (`seenIntros` set).

## T10 — Mastery-driven shell wiring (pointer: engine-core / runtime-affect)
- [ ] `loadMasteryMap()` + reload on return to world/title/review.
- [ ] Scaffold entry: `entryScaffoldFor` → `toBeatForLevel` → `initialBeat`.
- [ ] `kitchenProgress.js`: masteryStatusFor / suggestedNextRoom / entryScaffoldFor /
      eligibleMixSkills / dueProbes / recordRetentionProbe / loadMastered /
      saveMastered (legacy) / resetProgress.
- [ ] Retention-probe settle on return (U7); wall→room→return `stumpingRecipeId`
      sessionStorage handoff.

## T11 — Assets
- [ ] Place `public/intros/*.html` (10), `public/music/*.mp3` (5, slugs match
      music.js + fetch-music), `public/voice/*.mp3` (baked clips), `settings-gear.png`.

## Verification (pointer: runtime/e2e tests owned by other slices)
- [ ] Stage fit correct under simulated visualViewport offset.
- [ ] WorldMap badges/suggestion reflect a seeded mastery map; null → no-data render.
- [ ] Settings changes propagate live to music/voice/Slate; persist + reload.
- [ ] Single-voice invariant: a new `say()` cuts the previous; music ducks/resumes.
- [ ] Intro narration never overlaps; pause freezes video+audio+timer; seek works.
