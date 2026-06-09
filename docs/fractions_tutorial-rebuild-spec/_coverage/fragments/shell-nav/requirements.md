# requirements — shell-nav fragment

RFC-2119 requirements for the app shell, hash router, world/concept maps,
settings, intros, and audio/voice. The cross-screen NAV GRAPH is synthesis-owned;
this fragment specifies each screen's behavior, not the route edges. Engine mastery
load and lesson-room rendering are referenced by pointer (engine-core,
lessons-rooms).

> Source of truth: `web/src/Shell.jsx`, `TitleScreen.jsx`, `WorldMap.jsx`,
> `EmptyRoom.jsx`, `RoomIntro.jsx`, `SettingsScreen.jsx`, `SettingsButton.jsx`,
> `ConceptMap.jsx`, `BackgroundMusic.jsx`, `TapToRead.jsx`, `settings.js`,
> `music.js`, `audioBus.js`, `voice.js`, `voiceLines.js`, `speechify.js`,
> `kitchenProgress.js`, `rooms.js`, `conceptTree.js`.

---

## SHELL-1 — Bootstrap & mount

- The app SHALL bootstrap from `web/index.html` (mounts `#root` inside
  `#fit > #stage`) → `web/src/main.jsx`, which `createRoot(...).render(<Shell/>)`.
- `main.jsx` SHALL import the global stylesheets `tokens.css`, `lesson.css`,
  `world.css` before rendering (so design tokens exist before first paint).
- There SHALL be NO router library; routing is hand-rolled hash routing in
  `Shell.jsx` (rationale: the tablet back-gesture works against the URL hash, and
  every screen keeps an explicit back button too).

## SHELL-2 — Stage scaling (1280×800 fit)

- The shell SHALL render every screen in a fixed **1280×800** coordinate space and
  scale `#stage` uniformly to fit the viewport via `useStageFit`.
- The scale factor SHALL be `min(viewportW/1280, viewportH/800)` applied as a CSS
  `transform: scale(s)` on `#stage`.
- The fit MUST use `window.visualViewport` width/height (NOT `window.innerHeight`)
  when available. **Given** iOS/iPadOS Safari's dynamic toolbar, **When** the layout
  viewport (100vh) is taller than the visible area, **Then** fitting to
  `visualViewport` keeps the stage's bottom (e.g. the intro video controls) inside
  the visible box.
- Because a transform does not change layout size, `#fit` SHALL be `position:fixed`
  and sized to the scaled footprint (`1280*s × 800*s`), centered against the visual
  viewport rect (including `offsetLeft`/`offsetTop`).
- The fit SHALL re-apply on `resize`, `orientationchange`, and (when present)
  `visualViewport` `resize`/`scroll`.

## SHELL-3 — Hash routing

- The current route SHALL be derived from `window.location.hash` as
  `hash.replace(/^#\/?/, "")` lowercased, defaulting to `"title"` when empty.
- The shell SHALL subscribe to `hashchange` and re-render on route change.
- `go(r)` SHALL set `window.location.hash` to `#/` for the title/empty route, else
  `#/<r>`.
- Recognized routes: `title` (`''`), `world`, `mom`, `review`, `settings`,
  `concepts`, and the 10 room ids (`m1 m3 nl r1 s1 cmp r3 r2 r4 r5`). An
  unrecognized route SHALL fall through to the world map.

## SHELL-4 — Mastery load at the boundary (pointer: engine-core)

- On mount, and **every time the route returns to `world`/`title`/`review`**, the
  shell SHALL recompute the mastery map via `loadMasteryMap()`:
  `loadLog()` → (if non-empty) `migrateFromKitchenProgress()` seed priors →
  `measurementReduce(log, Date.now(), seedPriors)` → `mastery`.
- `loadMasteryMap()` MUST return `null` on an empty log or any thrown error
  (no-data state). The engine fold itself stays wall-clock-free; `Date.now()` is
  injected here at the React boundary (see engine-core for the purity contract).
- The live `masteryMap` SHALL be passed to `WorldMap` (badges) and used by
  `eligibleMixSkills` for `MixedReview`.

## SHELL-5 — First-entry room intro gating

- Each room MAY declare an `intro` (HTML video URL) in `rooms.js`. The FIRST time a
  room with an `intro` is entered in a session, the shell SHALL render `RoomIntro`
  before the lesson.
- "Seen" state SHALL be tracked in an in-memory `Set` (`seenIntros`) keyed by room
  id — it is session-scoped, NOT persisted.
- A room's lesson SHALL receive an `onRewatchIntro` callback only when the room has
  an `intro`; invoking it deletes the room from `seenIntros`, re-showing `RoomIntro`
  (which replays from the top). Rooms without a video pass `undefined` so the lesson
  simply omits the rewatch button.

## SHELL-6 — Scaffold-entry computation (pointer: engine-core, runtime-affect)

- On entering a room, the shell SHALL compute the design scaffold level via
  `entryScaffoldFor(nodeId, masteryMap)` and map it to the lesson's native beat via
  `toBeatForLevel(roomId, level)` (runtime/scaffoldMap), passing it as `initialBeat`
  (and `initialStage` for `s1`).
- **Given** no mastery data, **When** a room is opened, **Then** `entryScaffoldFor`
  returns `0` → the lesson starts at its most-supported beat.

## SHELL-7 — Wall→room→return handoff

- Before routing to a room from the kitchen, the kitchen MAY stash a
  `stumpingRecipeId` in `sessionStorage` (the hash route is stateless). The shell
  SHALL read it ONCE on room entry, immediately remove it (so a stale key cannot
  mislabel a later direct entry), and pass it as `stumpingRecipe`.
- A non-null `stumpingRecipe` makes `ReturnToKitchen` legal in the lesson policy;
  `onReturnToKitchen` SHALL navigate back to `mom`.

## SHELL-8 — Retention probe settle (U7) (pointer: engine-core)

- **Given** a room is opened whose engine node has a probe due
  (`dueProbes(masteryMap, Date.now())` includes it), **Then** the shell SHALL mark
  that node in `probingNodeRef`.
- **When** the route next returns to `world`/`title`/`review` with a pending probe,
  **Then** the shell SHALL re-load the fresh mastery map and call
  `recordRetentionProbe(node, isMastered(freshEstimate))` exactly once, then clear
  the ref. A pass keeps the node mastered (resets the spaced clock); a fail demotes
  it to `needs-review`.

## SHELL-9 — Always-mounted global surfaces

- `BackgroundMusic` SHALL be mounted ONCE and SHALL NOT unmount on navigation
  (music must not restart when changing rooms); the screen is computed into a
  variable rather than early-returned to keep it mounted.
- `TapToRead` SHALL be mounted once at the root.
- `EngineSurfaces` (pointer: ui-surfaces) SHALL be mounted with `active` true only
  inside a lesson or the kitchen (`mom`), and `showInspector` only when
  `import.meta.env.DEV`.
- A FAB bar (Concepts + Settings buttons) SHALL be shown ONLY on the `title` and
  `world` routes.

## TITLE — Title screen

- Route `''`/`title` SHALL render `TitleScreen`; its sole primary action (START /
  "Let's Slice!") SHALL navigate to `world`.
- On mount, the Cook SHALL greet the player via `say("titleWelcome")`. **Given**
  the browser blocks autoplay, **When** the first `pointerdown`/`keydown` occurs and
  the greeting never started, **Then** the greeting SHALL be retried once (and MUST
  NOT double-speak when autoplay was not blocked).

## WORLDMAP — Lesson map

- The world map SHALL present TWO levels: a TOP level of three **shelf** nodes
  (the `STRANDS`) around the central kitchen, and a SUBMENU of one strand's lesson
  cards laid out as a centered row.
- Per-room status SHALL come from `masteryStatusFor(nodeId, masteryMap)` mapped to
  one of: `mastered` ("Mastered"), `in-progress` ("In progress"), `needs-review`
  ("Cook again"), `not-started` (Ready/Coming soon by `built`).
- The engine's suggested next room (`suggestedNextRoom(masteryMap)`) SHALL be
  highlighted with a "Next" badge; the shelf containing it SHALL also carry "Next".
- A shelf with all lessons mastered SHALL show "Done" and a per-shelf
  `mastered / total` count.
- The central kitchen medallion SHALL open `mom`; a "Mixed Basket" button SHALL open
  `review`.
- **Given** `masteryMap` is null, **Then** the map SHALL render the no-engine-data
  state (all `not-started`, suggestion = first node's room).

## EMPTYROOM — Unbuilt room

- A room whose component is not built SHALL render `EmptyRoom` (lesson number,
  title, and a back button to the kitchen map). (All ten rooms are `built: true`
  today, so this is a fallback.)

## ROOMINTRO — Intro video + narration

- `RoomIntro` SHALL embed the room's `intro` HTML in a same-origin `<iframe>` and
  drive narration GATED to the video's playhead.
- The video is silent; the iframe's `<Stage>` SHALL persist its playhead to
  `localStorage[STAGE_PERSIST_KEY + ":t"]`. The intro SHALL reset that key to `"0"`
  before each (re)mount so video and narration start together.
- A cue line SHALL begin only when the playhead passes BOTH its `gate` (the
  animation beat) AND `prevLineEnd + pause` — so a line never overlaps the wrong
  visual nor clips the previous one.
- Each cue's audio SHALL play at `getSettings().voiceVol / 100`. **Given** autoplay
  is blocked for a clip, **Then** narration SHALL advance on a duration estimate
  rather than stalling.
- Completion SHALL be timer-driven (`room.introDurationMs`, default 35000ms) because
  the video has no "finished" event; the timer MUST be pause-aware (it freezes while
  paused). "Skip ▸" ends immediately.
- Pause/Play SHALL freeze BOTH the video (`iframe.contentWindow.__anim.pause/play`)
  and the current narration clip; the gated loop freezes implicitly because the
  paused video stops advancing the playhead.
- The transcript pane SHALL list every cue; clicking a line SHALL seek the video
  (`__anim.seek`) and resume narration from that cue. The end card SHALL offer
  "Watch again" (remount + replay) and "Continue to the lesson".
- A mute toggle SHALL silence narration via volume (not pause), preserving timing.

## SETTINGS — Settings screen + button

- Route `settings` SHALL render `SettingsScreen`; it is OVERLAY-style — the shell
  SHALL remember the last non-`settings`/non-`concepts` route and return there on
  "Done" (`onBack`).
- `SettingsScreen` SHALL expose exactly three controls, all persisted via
  `settings.js` (`bf_settings_v1`) and applied LIVE app-wide:
  1. **Voice lines** volume `0-100` → `voice.js` (per-clip `audio.volume`).
  2. **Music** volume `0-100` (0 = muted) → `BackgroundMusic`.
  3. **How you answer**: `stylus` | `typing` → `components/Slate` (pointer:
     lessons-rooms).
- The screen SHALL subscribe to `subscribeSettings` so external changes reflect
  live; writes go through `setSettings(patch)`.
- `SettingsButton` SHALL navigate to `#/settings` (drop-in for the old per-lesson
  sound toggle); it appears in lesson/intro header clusters.
- Volume sliders SHALL be keyboard-operable (Arrow ±5, Home=0, End=100) with
  `role="slider"` + `aria-valuenow`.

## CONCEPTMAP — Concept Mastery Map

- Route `concepts` SHALL render `ConceptMap` (overlay-style, same return behavior as
  Settings).
- The map SHALL present `Concept → Skill node → Atomic card`, with NO grade level
  shown anywhere (the app is pace-agnostic). Top nav = concepts; selecting one opens
  its skill-node breakdown.
- Mastery SHALL be measured only at the atomic-card grain and ROLL UP: every level
  shows the average of the cards beneath it. The data + seam come from
  `conceptTree.js` (`buildConceptTree`, `getMastery`).
- The header SHALL indicate whether the tree is backed by **live engine data** or
  **placeholder** data (`isLiveMastery()`).
- Mastery banding SHALL be: strong ≥0.85, partial ≥0.5, weak ≥0.15, else empty.

## AUDIO-1 — Music routing

- `BackgroundMusic` SHALL play the current scene's track list from `music.js`
  (`MUSIC[scene]`): a single-entry list loops natively; a multi-entry list rotates
  (advance on each track's `ended`). The scene SHALL come from
  `sceneFor(route, showingIntro)`.
- Scenes: `mom`→`kitchen`, any `r[1-9]…` room→`rooms`, intro showing→`null` (no
  music), everything else→`map`.
- Music SHALL play UNLESS muted (`musicVol === 0`), the scene has no tracks, or a
  voice is active (`audioBus`). It SHALL fade out + pause under narration and fade
  back in afterwards (the "always music except under a voice" rule).
- Volume changes SHALL track live (no fade) while playing. Autoplay block SHALL be
  retried on the first user gesture.

## AUDIO-2 — Voice channel (single)

- Exactly ONE voice SHALL play at a time across the entire app (module-level
  channel shared by every `useVoice()` and `TapToRead`); a new line cuts off the
  last — nothing overlaps.
- `say(keyOrText, {speaker})` resolution order: (1) baked clip key in `LINES`
  → play `public/voice/<key>.mp3`; (2) EXACT text of a baked line → resolve to its
  key → same clip; (3) arbitrary text → `speechify()` then synthesize in-character
  via the dev `/api/tts` service (pointer: leftovers vite middleware), voiced by
  `speaker` / the line's prefix / default `cook`.
- There SHALL be NO robotic Web Speech fallback — on any synthesis failure the app
  stays SILENT (constitution §5.9).
- Re-requesting the SAME source while it is playing SHALL TOGGLE it off (stop).
- Voice playback SHALL bracket each utterance with `audioBus.voiceStart/voiceEnd`
  (count-based) so music ducking always balances.
- `readAloud()` (TapToRead path) SHALL YIELD to app-driven narration: it MUST NOT
  speak within 250ms of an app-driven `say()`.

## AUDIO-3 — Tap-to-read affordance

- `TapToRead` SHALL inject a small speaker button next to each readable copy block
  inside `#stage` (via a debounced `MutationObserver`), NOT make every text node a
  tap target.
- It SHALL skip interactive/manipulative surfaces (forms, the Slate, scratch canvas,
  nav cards, the intro rail, `[data-novox]`, buttons/links) and only attach to leaf
  text blocks.
- Pressing a button SHALL read its block: `[data-vox="<key>"]` plays that baked clip;
  otherwise it synthesizes the block's own text, voiced by the nearest
  `[data-vox-speaker]` (default `cook`). Pressing the same button again SHALL stop
  (toggle). The handler SHALL be capture-phase and not leak to the underlying board.

## VOICE-TEXT — Speech normalization

- `speechify()` SHALL normalize on-screen text for neural TTS: spell fractions
  (`5/7`→"five sevenths", `1/2`→"one half"), read `№`→"number", strip UI glyphs
  (arrows/stars/pencils/checks/bullets/pipes), and collapse whitespace. The
  normalized string is ALSO the TTS cache key (so the same visible text maps to one
  clip).
- `voiceLines.js` SHALL be the single source of truth for spoken text (`LINES`),
  speakers (`SPEAKERS` with `voiceEnv` env-var pointers), the Cat's meow SFX
  (`MEOW_SFX`), and per-key speaker routing (`LINE_SPEAKER` + `speakerOf` prefix
  rules `mr_kid_`/`mr_gp_`/`mr_grandpa_`/`mr_cat_`/`mr_mom_`). The Cat is NOT a
  speaker (no voice id) — it only meows.
