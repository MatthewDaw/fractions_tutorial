# shell-nav — coverage checklist

Tick `[x]` when the item is documented across this slice's fragments. One line
per owned census item under the `shell-nav` globs.

## Entry / shell
- [x] `web/index.html` — SPA HTML entry, #fit/#stage/#root, fonts, viewport
- [x] `web/src/main.jsx` — createRoot → `<Shell/>`, global CSS imports
- [x] `web/src/Shell.jsx` — useStageFit, useHashRoute, loadMasteryMap, screen switch, retention probe settle, FAB bar, global mounts

## Chrome / overlay screens
- [x] `web/src/TitleScreen.jsx` — landing, START, greet-on-load
- [x] `web/src/WorldMap.jsx` — two-level map (shelves → lesson cards), badges
- [x] `web/src/EmptyRoom.jsx` — unbuilt-room placeholder
- [x] `web/src/RoomIntro.jsx` — iframe intro video + gated narration + endcard
- [x] `web/src/SettingsScreen.jsx` — volume sliders + input mode
- [x] `web/src/SettingsButton.jsx` — header gear → #/settings
- [x] `web/src/ConceptMap.jsx` — concept → node → atomic-card mastery viz
- [x] `web/src/BackgroundMusic.jsx` — persistent ducking player
- [x] `web/src/TapToRead.jsx` — global read-aloud injector

## Data / registry modules
- [x] `web/src/rooms.js` — ROOMS / STRANDS / KITCHEN / CENTER
- [x] `web/src/kitchenProgress.js` — mastery facade + persistence + probes
- [x] `web/src/conceptTree.js` — CONCEPTS + buildConceptTree + getMastery seam
- [x] `web/src/ccss.js` — denominator set + in-grade helpers
- [x] `web/src/ccssStandards.js` — NODE_STANDARDS map
- [x] `web/src/denominatorColors.js` — palette + hatch per denominator

## Settings / audio / voice
- [x] `web/src/settings.js` — bf_settings_v1 store + legacy migration
- [x] `web/src/music.js` — MUSIC scene map + sceneFor
- [x] `web/src/audioBus.js` — voice-active count bus
- [x] `web/src/voice.js` — single-channel say()/stopVoice + TTS fallback
- [x] `web/src/voiceLines.js` — LINES / SPEAKERS / MEOW_SFX / LINE_SPEAKER / speakerOf
- [x] `web/src/speechify.js` — number/fraction spell-out for TTS

## Intro cue sheets (10)
- [x] `web/src/introR1.js` introR2 introR3 introR4 introR5 introM1 introM3 introNL introS1 introCmp — cue sheet shape (gate/pause/key/text, STAGE_PERSIST_KEY, INTRO_DURATION)

## CSS (owned)
- [x] `styles/title.css world.css conceptmap.css settings.css tokens.css voicetap.css` — referenced in ui-wireframes (layout) + design (scene-scoping convention)

## Public assets
- [x] `web/public/intros/**` (10 HTML) — self-contained animated intro videos
- [x] `web/public/music/**` (5 mp3 + _audition) — background tracks
- [x] `web/public/voice/**` (~203 mp3 + README) — pre-baked clips
- [x] `web/public/settings-gear.png` — gear icon

## Undocumented owned items
- none — every owned census path is covered. (voiceLines full LINES catalog is
  documented at shape/section level, not line-by-line; the ~203 individual voice
  mp3s and 10 intro HTML files are documented as asset groups, consistent with the
  census's group-level treatment.)
